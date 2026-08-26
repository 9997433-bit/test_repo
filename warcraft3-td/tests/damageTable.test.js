/* WC3 attack × armor table + armour-value mitigation. */
module.exports = function (test, NS) {
  const DT = NS.DamageTable;

  test('table has every attack type × armour type', (t) => {
    t.eq(DT.ATTACK_TYPES.length, 7);
    t.eq(DT.ARMOR_TYPES.length, 7);
    DT.ATTACK_TYPES.forEach((a) => {
      t.eq(DT.TABLE[a].length, 7, 'row ' + a);
      DT.ARMOR_TYPES.forEach((r) => t.ok(typeof DT.factor(a, r) === 'number', a + '/' + r));
    });
  });

  test('canonical multipliers match DESIGN.md', (t) => {
    t.eq(DT.factor('normal', 'medium'), 1.5);
    t.eq(DT.factor('normal', 'fortified'), 0.7);
    t.eq(DT.factor('pierce', 'light'), 2.0);
    t.eq(DT.factor('pierce', 'unarmored'), 1.5);
    t.eq(DT.factor('pierce', 'fortified'), 0.35);
    t.eq(DT.factor('siege', 'fortified'), 1.5);
    t.eq(DT.factor('siege', 'medium'), 0.5);
    t.eq(DT.factor('magic', 'heavy'), 1.5);
    t.eq(DT.factor('magic', 'fortified'), 0.35);
    t.eq(DT.factor('hero', 'fortified'), 0.5);
    t.eq(DT.factor('spells', 'hero'), 0.7);
  });

  test('chaos ignores every armour type, divine ignores everything but chaos', (t) => {
    DT.ARMOR_TYPES.forEach((r) => t.eq(DT.factor('chaos', r), 1.0, 'chaos vs ' + r));
    DT.ATTACK_TYPES.forEach((a) => {
      if (a === 'chaos') t.eq(DT.factor(a, 'divine'), 1.0);
      else t.eq(DT.factor(a, 'divine'), 0.05, a + ' vs divine');
    });
  });

  test('unknown types throw', (t) => {
    t.throws(() => DT.factor('laser', 'light'));
    t.throws(() => DT.factor('normal', 'adamantium'));
  });

  test('armour value mitigation follows the WC3 curve', (t) => {
    t.near(DT.armorMultiplier(0), 1);
    t.near(DT.armorMultiplier(5), 1 - (0.06 * 5) / (1 + 0.06 * 5), 1e-9);
    t.near(DT.armorMultiplier(10), 0.625, 1e-9);
    t.lt(DT.armorMultiplier(20), DT.armorMultiplier(10));
    t.gt(DT.armorMultiplier(-3), 1, 'negative armour amplifies');
  });

  test('resolve applies bonus → type factor → armour value → situational', (t) => {
    const r = DT.resolve({
      base: 100, attackType: 'siege', armorType: 'fortified', armorValue: 0,
      bonusVsArmor: { fortified: 20 }
    });
    t.eq(r.bonus, 20);
    t.eq(r.typeFactor, 1.5);
    t.near(r.amount, 180);

    const r2 = DT.resolve({ base: 100, attackType: 'pierce', armorType: 'light', armorValue: 10 });
    t.near(r2.amount, 100 * 2.0 * 0.625, 1e-9);

    const r3 = DT.resolve({ base: 100, attackType: 'normal', armorType: 'medium', armorValue: 0, multiplier: 0.5 });
    t.near(r3.amount, 75, 1e-9);
  });

  test('DPS visibly changes with armour type — pierce vs light beats pierce vs fortified', (t) => {
    const light = DT.compute({ base: 50, attackType: 'pierce', armorType: 'light', armorValue: 0 });
    const fort = DT.compute({ base: 50, attackType: 'pierce', armorType: 'fortified', armorValue: 0 });
    t.near(light / fort, 2.0 / 0.35, 1e-9);
    t.gt(light, fort * 5);
  });

  test('flying attack types are exactly pierce/magic/chaos', (t) => {
    ['pierce', 'magic', 'chaos'].forEach((a) => t.ok(DT.attackTypeHitsAir(a), a));
    ['normal', 'siege', 'hero', 'spells'].forEach((a) => t.notOk(DT.attackTypeHitsAir(a), a));
  });

  test('damage never goes negative', (t) => {
    t.eq(DT.compute({ base: 0, attackType: 'normal', armorType: 'divine', armorValue: 99 }), 0);
    t.gte(DT.compute({ base: 1, attackType: 'normal', armorType: 'divine', armorValue: 99 }), 0);
  });
};
