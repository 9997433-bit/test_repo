/* Flying targeting rules: who may shoot the sky, and how web drags it down. */
module.exports = function (test, NS) {
  const C = NS.Combat;
  const TD = NS.TowerData;

  function mkGame() { return new NS.Game({ difficulty: 'normal', hero: null, seed: 3 }); }
  function place(game, typeId, x, y, wave) {
    const c = new NS.Creep(game, typeId, wave || 1);
    c.x = x; c.y = y; c.z = c.flying ? NS.Config.flyHeight : 0;
    game.creeps.push(c);
    return c;
  }

  test('only pierce / magic / chaos towers can hit a flyer', (t) => {
    const game = mkGame();
    const flyer = place(game, 'wyvern', 0, 0, 4);
    t.ok(flyer.flying);
    t.ok(C.canHit(TD.get('h_arrow_t1'), flyer), 'pierce arrow tower');
    t.ok(C.canHit(TD.get('h_arcane_t1'), flyer), 'magic arcane tower');
    t.notOk(C.canHit(TD.get('o_watch_t1'), flyer), 'normal watch tower cannot');
    t.notOk(C.canHit(TD.get('h_cannon_t3'), flyer), 'siege mortar cannot');
    t.notOk(C.canHit(TD.get('e_ancient_t3'), flyer), 'normal ancient cannot');
  });

  test('an air-capable tower with a grounded attack type still cannot hit air', (t) => {
    const game = mkGame();
    const flyer = place(game, 'gargoyle', 0, 0, 12);
    const fake = Object.assign({}, TD.get('h_arrow_t1'), { attackType: 'normal' });
    t.eq(fake.targets.indexOf('air') !== -1, true);
    t.notOk(C.canHit(fake, flyer), 'normal damage cannot reach the sky');
  });

  test('every tower flagged as air-capable uses a legal air attack type', (t) => {
    Object.keys(TD.TOWERS).forEach((id) => {
      const def = TD.TOWERS[id];
      if (def.targets.indexOf('air') === -1) return;
      t.ok(NS.DamageTable.attackTypeHitsAir(def.attackType), id + ' uses ' + def.attackType);
    });
  });

  test('every race has an answer to air waves', (t) => {
    let airLines = 0;
    TD.RACES.forEach((race) => {
      const lines = TD.linesOfRace(race.id);
      t.eq(lines.length, 3, race.id + ' has 3 lines');
      const air = lines.filter((l) => l.tiers.every((tw) => TD.canTargetAir(tw)));
      t.gte(air.length, 1, race.id + ' can answer air waves');
      airLines += air.length;
    });
    t.gte(airLines, 6, 'the roster is not starved of anti-air');
  });

  test('ground-only towers never acquire a flying target', (t) => {
    const game = mkGame();
    const def = TD.get('o_watch_t2');
    const tower = { x: 0, y: 0 };
    const flyer = place(game, 'wyvern', 1, 0, 6);
    const walker = place(game, 'grunt', 2, 0, 6);
    const got = C.selectTargets(tower, def, [flyer, walker], 3, 'closest');
    t.eq(got.length, 1);
    t.eq(got[0], walker);
  });

  test('web drags a flyer to the ground so anything can hit it', (t) => {
    const game = mkGame();
    const zigg = TD.get('u_zigg_t3');
    const flyer = place(game, 'wyvern', 3, 3, 18);
    const cannon = TD.get('h_cannon_t2');
    t.notOk(C.canHit(cannon, flyer), 'cannot hit while airborne');

    const web = zigg.effects.filter((e) => e.type === 'web')[0];
    t.ok(flyer.applyEffect({ type: 'web', chance: 1, duration: web.duration }, zigg, game.rng));
    t.notOk(flyer.isAirborne(), 'webbed = grounded');
    t.ok(C.canHit(cannon, flyer), 'siege can now shell it');

    game.time += web.duration + 0.01;
    t.ok(flyer.isAirborne(), 'web expires and it takes off again');
  });

  test('web only affects flyers, root only affects ground units', (t) => {
    const game = mkGame();
    const walker = place(game, 'footman', 0, 0, 5);
    const flyer = place(game, 'wyvern', 1, 1, 5);
    t.notOk(walker.applyEffect({ type: 'web', chance: 1, duration: 2 }, null, game.rng), 'web wastes on ground');
    t.notOk(flyer.applyEffect({ type: 'root', chance: 1, duration: 2 }, null, game.rng), 'root cannot entangle the sky');
    const grounded = place(game, 'gargoyle', 2, 2, 5);
    grounded.applyEffect({ type: 'web', chance: 1, duration: 2 }, null, game.rng);
    t.ok(grounded.applyEffect({ type: 'root', chance: 1, duration: 2 }, null, game.rng), 'a webbed flyer can be rooted');
  });

  test('flyers travel the straight air corridor, not the road', (t) => {
    const game = mkGame();
    const walker = new NS.Creep(game, 'footman', 1);
    const flyer = new NS.Creep(game, 'wyvern', 1);
    t.eq(walker.path, game.path);
    t.eq(flyer.path, game.flyPath);
    t.lt(game.flyPath.length, game.path.length, 'the air route is shorter');
    t.near(flyer.z, NS.Config.flyHeight, 1e-9);
  });

  test('a hero can only reach air after Metamorphosis turns it chaos', (t) => {
    const game = new NS.Game({ difficulty: 'normal', hero: 'demonhunter', seed: 5 });
    const flyer = place(game, 'wyvern', game.hero.x + 1, game.hero.y, 6);
    t.notOk(C.canHit(game.hero.atkDef, flyer), 'hero attack type cannot hit air');
    game.hero.mana = 999;
    game.hero.cast('R');
    t.eq(game.hero.atkDef.attackType, 'chaos');
    t.ok(C.canHit(game.hero.atkDef, flyer), 'demon form reaches the sky');
  });

  test('a full air wave is stopped by anti-air and leaks past ground-only towers', (t) => {
    function run(towerId) {
      const game = new NS.Game({ difficulty: 'easy', hero: null, seed: 11 });
      game.gold = 100000; game.lumber = 100;
      let built = 0;
      for (let y = 0; y < NS.Config.grid.rows && built < 8; y++) {
        for (let x = 0; x < NS.Config.grid.cols && built < 8; x++) {
          const near = Math.hypot(x + 0.5 - game.flyPath.points[0].x, y + 0.5 - game.flyPath.points[0].y);
          if (near > 12 || !game.isBuildable(x, y)) continue;
          if (game.flyPath.distanceTo(x + 0.5, y + 0.5) > 3) continue;
          if (game.build(towerId, x, y).ok) built++;
        }
      }
      t.gt(built, 3, 'placed anti-air coverage for ' + towerId);
      game.wave = 3;
      game.startWave(true);
      for (let i = 0; i < 60 * 90 && game.liveCreeps() + game.spawnQueue.length > 0; i++) game.update(1 / 60);
      return game;
    }
    const withAA = run('h_arrow_t1');
    const withoutAA = run('o_watch_t1');
    t.gt(withAA.stats.kills, 0, 'pierce towers shoot down wyverns');
    t.eq(withoutAA.stats.kills, 0, 'ground-only towers cannot touch them');
    t.gt(withoutAA.stats.leaks, 0, 'so the air wave leaks');
  });
};
