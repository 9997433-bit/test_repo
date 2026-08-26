/*
 * Tick determinism: the same seed + the same ordered commands must produce
 * bit-identical simulation state, tick after tick. This is what makes replays,
 * balance tests and bug reproduction possible.
 */
module.exports = function (t, WC3) {
  var DT = WC3.Config.DT;

  function buildSpots(g, n) {
    var out = [];
    for (var ty = 0; ty < g.gridH && out.length < n; ty++) {
      for (var tx = 0; tx < g.gridW && out.length < n; tx++) {
        if (!g.canBuildAt(tx, ty)) continue;
        var d = g.path.distanceTo((tx + 0.5) * g.tile, (ty + 0.5) * g.tile);
        if (d < 150) out.push([tx, ty]);
      }
    }
    return out;
  }

  var PLAN = [
    'kingdom_arrow_t1', 'warband_venom_t1', 'blight_web_t1',
    'grove_acid_t1', 'kingdom_cannon_t1', 'warband_storm_t1',
    'blight_lob_t1', 'grove_star_t1'
  ];

  /** Deterministic scripted run; returns a checksum trace. */
  function run(seed, ticks, options) {
    var opts = options || {};
    var g = new WC3.Game(Object.assign({ difficulty: 'normal', seed: seed }, opts));
    g.gold = 100000;
    g.lumber = 40;
    var spots = buildSpots(g, PLAN.length);
    var built = [];
    var trace = [];
    for (var i = 0; i < ticks; i++) {
      // Commands are issued at fixed tick numbers so both runs match exactly.
      if (i === 0 && g.hero) {
        var hp = g.path.pointAt(g.path.length * 0.3);
        g.hero.order(hp.x, hp.y);
      }
      if (i % 90 === 0 && !opts.noTowers) {
        var k = i / 90;
        if (k < PLAN.length) {
          var tw = g.build(PLAN[k], spots[k][0], spots[k][1]);
          if (typeof tw === 'object') built.push(tw);
        } else if (built[k - PLAN.length]) {
          g.upgrade(built[k - PLAN.length]);
        }
      }
      if (i === 1200 && g.hero) g.hero.castQ(g);
      g.tick(DT);
      if (i % 250 === 0) trace.push(g.checksum());
    }
    trace.push(g.checksum());
    return { game: g, trace: trace };
  }

  t.test('rng reproduces the same stream from the same seed', function () {
    var a = new WC3.RNG(12345);
    var b = new WC3.RNG(12345);
    for (var i = 0; i < 5000; i++) t.eq(a.next(), b.next(), 'draw ' + i);
    t.eq(a.calls, 5000, 'call counter');
  });

  t.test('rng draws stay inside [0,1) and are not degenerate', function () {
    var r = new WC3.RNG(7);
    var sum = 0;
    var min = 1;
    var max = 0;
    for (var i = 0; i < 20000; i++) {
      var v = r.next();
      t.ok(v >= 0 && v < 1, 'in range at ' + i);
      sum += v;
      if (v < min) min = v;
      if (v > max) max = v;
    }
    t.close(sum / 20000, 0.5, 0.02, 'mean');
    t.lt(min, 0.001, 'reaches low values');
    t.gt(max, 0.999, 'reaches high values');
  });

  t.test('rng snapshot/restore replays the exact same tail', function () {
    var r = new WC3.RNG(99);
    for (var i = 0; i < 100; i++) r.next();
    var snap = r.save();
    var a = [];
    for (i = 0; i < 50; i++) a.push(r.next());
    r.load(snap);
    for (i = 0; i < 50; i++) t.eq(r.next(), a[i], 'restored draw ' + i);
  });

  t.test('TICK DETERMINISM: identical seeds produce identical checksum traces', function () {
    var a = run(1337, 2400);
    var b = run(1337, 2400);
    t.eq(a.trace.length, b.trace.length, 'trace length');
    for (var i = 0; i < a.trace.length; i++) {
      t.eq(a.trace[i], b.trace[i], 'checksum at sample ' + i);
    }
    t.eq(a.game.stats.kills, b.game.stats.kills, 'kills');
    t.eq(a.game.stats.damageDealt, b.game.stats.damageDealt, 'damage dealt');
    t.eq(a.game.gold, b.game.gold, 'gold');
    t.eq(a.game.rng.calls, b.game.rng.calls, 'rng call count');
    t.gt(a.game.stats.kills, 0, 'the scripted run actually killed things');
  });

  t.test('TICK DETERMINISM: a different seed diverges', function () {
    var a = run(1337, 1200);
    var c = run(2024, 1200);
    var same = 0;
    for (var i = 0; i < a.trace.length; i++) if (a.trace[i] === c.trace[i]) same++;
    t.lt(same, a.trace.length, 'traces are not all identical');
  });

  t.test('TICK DETERMINISM: holds with a hero in the run', function () {
    // No towers: the hero is the only source of damage, so its contribution
    // is unambiguous.
    var a = run(555, 2400, { hero: 'swordmaster', noTowers: true });
    var b = run(555, 2400, { hero: 'swordmaster', noTowers: true });
    for (var i = 0; i < a.trace.length; i++) t.eq(a.trace[i], b.trace[i], 'hero checksum ' + i);
    t.gt(a.game.hero.damageDealt, 0, 'hero contributed damage');
    t.eq(a.game.hero.level, b.game.hero.level, 'hero level');
  });

  t.test('checksum reacts to every part of the state', function () {
    var g = new WC3.Game({ seed: 8, difficulty: 'normal' });
    g.spawnCreep(g.waves[0].entries[0]);
    var base = g.checksum();
    g.creeps[0].hp -= 1;
    t.ne(g.checksum(), base, 'hp change');
    g.creeps[0].hp += 1;
    t.eq(g.checksum(), base, 'restored');
    g.gold += 1;
    t.ne(g.checksum(), base, 'gold change');
  });

  t.test('the sim never touches Math.random', function () {
    var real = Math.random;
    var used = 0;
    Math.random = function () { used++; return real(); };
    try {
      var g = new WC3.Game({ seed: 3, difficulty: 'hard', hero: 'warden' });
      g.gold = 5000;
      var spots = buildSpots(g, 3);
      spots.forEach(function (s, i) { g.build(PLAN[i], s[0], s[1]); });
      for (var i = 0; i < 1500; i++) g.tick(DT);
    } finally {
      Math.random = real;
    }
    t.eq(used, 0, 'Math.random calls inside the simulation');
  });
};
