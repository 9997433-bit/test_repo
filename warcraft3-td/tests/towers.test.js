/* Roster integrity: 4 races × 3 lines × 3 tiers and sane progression. */
module.exports = function (test, NS) {
  const TD = NS.TowerData;
  const ids = Object.keys(TD.TOWERS);

  test('the roster is 4 races × 3 lines × 3 tiers', (t) => {
    t.eq(TD.RACES.length, 4);
    t.eq(TD.LINES.length, 12);
    t.eq(ids.length, 36);
    TD.RACES.forEach((r) => t.eq(TD.linesOfRace(r.id).length, 3, r.id));
    TD.LINES.forEach((l) => t.eq(l.tiers.length, 3, l.id));
  });

  test('names, ids and hotkeys are unique where they must be', (t) => {
    t.eq(new Set(ids).size, 36);
    const zh = ids.map((i) => TD.TOWERS[i].name.zh);
    t.eq(new Set(zh).size, 36, 'no duplicate Chinese names');
    const en = ids.map((i) => TD.TOWERS[i].name.en);
    t.eq(new Set(en).size, 36, 'no duplicate English names');
    TD.RACES.forEach((r) => {
      const keys = TD.linesOfRace(r.id).map((l) => l.hotkey);
      t.eq(new Set(keys).size, 3, r.id + ' command card hotkeys');
    });
  });

  test('every tower declares valid combat data', (t) => {
    ids.forEach((id) => {
      const d = TD.TOWERS[id];
      t.ok(NS.DamageTable.ATTACK_TYPES.indexOf(d.attackType) !== -1, id + ' attack type');
      t.gt(d.damage[1], 0, id);
      t.gte(d.damage[1], d.damage[0], id + ' damage range');
      t.gt(d.cooldown, 0, id);
      t.gt(d.range, 3, id + ' range');
      t.lt(d.range, 9, id + ' range not absurd');
      t.gt(d.projectile.speed, 0, id);
      t.ok(d.targets.length > 0, id);
      if (d.splash) {
        t.gt(d.splash.mid, d.splash.full, id + ' splash rings ordered');
        t.gt(d.splash.outer, d.splash.mid, id + ' splash rings ordered');
      }
      if (d.chain) { t.gt(d.chain.bounces, 0, id); t.lt(d.chain.decay, 1, id); }
      if (d.crit) { t.gt(d.crit.mult, 1, id); t.lte(d.crit.chance, 1, id); }
    });
  });

  test('each line gets stronger and pricier every tier', (t) => {
    TD.LINES.forEach((line) => {
      for (let i = 1; i < line.tiers.length; i++) {
        const a = line.tiers[i - 1], b = line.tiers[i];
        t.gt(b.gold, a.gold, line.id + ' T' + (i + 1) + ' costs more');
        t.gt(b.dps, a.dps * 1.8, line.id + ' T' + (i + 1) + ' hits much harder');
        t.gte(b.range, a.range, line.id + ' range never regresses');
        t.eq(b.attackType, a.attackType, line.id + ' keeps its attack type');
        t.eq(b.prev, a.id);
        t.eq(a.next, b.id);
      }
      t.eq(line.tiers[0].prev, null);
      t.eq(line.tiers[2].next, null);
    });
  });

  test('ultimate tiers cost lumber, lower tiers do not', (t) => {
    TD.LINES.forEach((line) => {
      t.eq(line.tiers[0].lumber, 0, line.id);
      t.eq(line.tiers[1].lumber, 0, line.id);
      t.eq(line.tiers[2].lumber, 1, line.id + ' ultimate needs lumber');
    });
  });

  test('invested totals accumulate and drive the sell price', (t) => {
    TD.LINES.forEach((line) => {
      let sum = 0;
      line.tiers.forEach((tw) => {
        sum += tw.gold;
        t.eq(tw.investedGold, sum, tw.id);
        t.eq(TD.sellValue(tw), Math.floor(sum * 0.75), tw.id);
      });
    });
  });

  test('the roster covers every combat mechanic', (t) => {
    const all = ids.map((i) => TD.TOWERS[i]);
    t.ok(all.some((d) => d.splash), 'splash');
    t.ok(all.some((d) => d.chain), 'chain');
    t.ok(all.some((d) => d.crit), 'crit');
    t.ok(all.some((d) => d.multishot > 1), 'multishot');
    t.ok(all.some((d) => d.bonusVsArmor), 'flat armour-type bonus');
    ['slow', 'poison', 'root', 'web'].forEach((kind) => {
      t.ok(all.some((d) => d.effects.some((e) => e.type === kind)), kind);
    });
    ['normal', 'pierce', 'siege', 'magic'].forEach((a) => {
      t.ok(all.some((d) => d.attackType === a), 'attack type ' + a);
    });
  });

  test('armour type matchups make lines meaningfully different', (t) => {
    const arrow = TD.get('h_arrow_t2');   // pierce
    const cannon = TD.get('h_cannon_t2'); // siege
    const dmg = (def, armor) => NS.DamageTable.compute({
      base: def.avgDamage, attackType: def.attackType, armorType: armor, armorValue: 0
    }) / def.cooldown;
    t.gt(dmg(arrow, 'light'), dmg(arrow, 'fortified') * 4, 'arrows shred light, bounce off walls');
    t.gt(dmg(cannon, 'fortified'), dmg(cannon, 'medium') * 2, 'cannons crack fortifications');
    t.gt(dmg(arrow, 'light') / dmg(cannon, 'light'), 1, 'pick the right tool');
  });

  test('a placed tower reports its live DPS against a specific creep', (t) => {
    const game = new NS.Game({ hero: null });
    game.gold = 9999;
    let spot = null;
    for (let y = 1; y < NS.Config.grid.rows && !spot; y++) {
      for (let x = 1; x < NS.Config.grid.cols && !spot; x++) if (game.isBuildable(x, y)) spot = { x, y };
    }
    const tw = game.build('h_arrow_t1', spot.x, spot.y).tower;
    const light = new NS.Creep(game, 'huntress', 1);
    const fort = new NS.Creep(game, 'siege', 1);
    t.gt(tw.dpsVersus(light), tw.dpsVersus(fort) * 3, 'the panel shows a real difference');
    t.gt(tw.dpsVersus(null), 0);
  });

  test('every hero is fully specified with Q/W/E/R', (t) => {
    t.eq(NS.HeroData.HEROES.length, 4);
    NS.HeroData.HEROES.forEach((h) => {
      t.eq(h.abilities.length, 4, h.id);
      t.eq(h.abilities.map((a) => a.key).join(''), 'QWER', h.id);
      t.ok(h.abilities.some((a) => a.ultimate), h.id + ' has an ultimate');
      t.ok(h.abilities.some((a) => a.passive), h.id + ' has a passive');
      t.ok(NS.DamageTable.ATTACK_TYPES.indexOf(h.attack.attackType) !== -1, h.id);
    });
  });

  test('heroes level up, gain power and spend mana', (t) => {
    const game = new NS.Game({ hero: 'deathknight' });
    const h = game.hero;
    const dps0 = h.atkDef.dps;
    h.gainLevel(); h.gainLevel();
    t.eq(h.level, 3);
    t.gt(h.atkDef.dps, dps0);
    t.gt(h.maxMana, NS.Config.hero.baseMana);
    const mana = h.mana;
    t.ok(h.cast('Q'));
    t.eq(h.mana, mana - h.ability('Q').mana);
    t.notOk(h.cast('Q'), 'still on cooldown');
  });
};
