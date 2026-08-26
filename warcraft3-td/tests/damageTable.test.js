/* Attack x armor table + armor reduction formula. */
module.exports = function (t, WC3) {
  var D = WC3.Damage;

  t.test('table has all 7 attack rows x 7 armor columns', function () {
    t.eq(D.ATTACK_TYPES.length, 7, 'attack types');
    t.eq(D.ARMOR_TYPES.length, 7, 'armor types');
    D.ATTACK_TYPES.forEach(function (a) {
      t.ok(D.TABLE[a], 'row ' + a + ' exists');
      t.eq(D.TABLE[a].length, 7, 'row ' + a + ' width');
    });
  });

  t.test('canonical attack-vs-armor multipliers', function () {
    t.eq(D.factor('pierce', 'light'), 2.00, 'pierce vs light');
    t.eq(D.factor('pierce', 'fortified'), 0.35, 'pierce vs fortified');
    t.eq(D.factor('siege', 'fortified'), 1.50, 'siege vs fortified');
    t.eq(D.factor('siege', 'medium'), 0.50, 'siege vs medium');
    t.eq(D.factor('normal', 'medium'), 1.50, 'normal vs medium');
    t.eq(D.factor('magic', 'heavy'), 1.50, 'magic vs heavy');
    t.eq(D.factor('magic', 'fortified'), 0.35, 'magic vs fortified');
    t.eq(D.factor('hero', 'fortified'), 0.50, 'hero vs fortified');
  });

  t.test('chaos ignores armor type entirely', function () {
    D.ARMOR_TYPES.forEach(function (arm) {
      t.eq(D.factor('chaos', arm), 1.0, 'chaos vs ' + arm);
    });
  });

  t.test('divine resists everything except chaos', function () {
    D.ATTACK_TYPES.forEach(function (atk) {
      var f = D.factor(atk, 'divine');
      if (atk === 'chaos') t.eq(f, 1.0, 'chaos vs divine');
      else t.eq(f, 0.05, atk + ' vs divine');
    });
  });

  t.test('unknown types fall back to 1.0 instead of NaN', function () {
    t.eq(D.factor('bogus', 'light'), 1, 'unknown attack');
    t.eq(D.factor('pierce', 'bogus'), 1, 'unknown armor');
  });

  t.test('armor reduction matches the classic RTS formula', function () {
    t.eq(D.armorMultiplier(0), 1, 'zero armor');
    t.close(D.armorMultiplier(5), 1 - (0.3 / 1.3), 1e-9, 'armor 5');
    t.close(D.armorMultiplier(10), 1 - (0.6 / 1.6), 1e-9, 'armor 10');
    t.gt(D.armorMultiplier(-3), 1, 'negative armor amplifies');
    // Strictly decreasing and always positive.
    var prev = Infinity;
    for (var a = 0; a <= 30; a++) {
      var m = D.armorMultiplier(a);
      t.lt(m, prev + 1e-12, 'monotonic at armor ' + a);
      t.gt(m, 0, 'positive at armor ' + a);
      prev = m;
    }
  });

  t.test('computeDamage combines table factor and armor', function () {
    // 100 pierce vs light armor 1 -> 100 * 2.0 * (1 - .06/1.06)
    var expect = 100 * 2.0 * (1 - 0.06 / 1.06);
    t.close(D.computeDamage(100, 'pierce', 'light', 1), expect, 1e-9, 'pierce/light');
    t.eq(D.computeDamage(0, 'normal', 'light', 0), 0, 'zero base');
    t.eq(D.computeDamage(-50, 'normal', 'light', 0), 0, 'never negative');
  });

  t.test('damage table visibly changes DPS versus armor type', function () {
    var vsLight = D.computeDamage(100, 'pierce', 'light', 0);
    var vsFort = D.computeDamage(100, 'pierce', 'fortified', 0);
    t.gt(vsLight / vsFort, 5, 'pierce swing between light and fortified');
    var siegeFort = D.computeDamage(100, 'siege', 'fortified', 0);
    t.gt(siegeFort, vsFort, 'siege beats pierce into fortified');
  });

  t.test('air can only be hit by pierce / magic / chaos', function () {
    t.eq(D.canHitAir('pierce'), true, 'pierce');
    t.eq(D.canHitAir('magic'), true, 'magic');
    t.eq(D.canHitAir('chaos'), true, 'chaos');
    t.eq(D.canHitAir('normal'), false, 'normal');
    t.eq(D.canHitAir('siege'), false, 'siege');
  });

  t.test('every tower def agrees with its air capability flag', function () {
    WC3.TowerData.TOWER_LIST.forEach(function (def) {
      t.eq(def.targetsAir, D.canHitAir(def.attackType), def.id + ' air flag');
    });
  });
};
