/*
 * Polyline path geometry, the flying bypass, and — the important one —
 * leak behaviour: a creep that reaches the keep must cost exactly one life,
 * be removed from every list, and never come back.
 */
module.exports = function (t, WC3) {
  var Path = WC3.Path;
  var Config = WC3.Config;

  function newGame(opts) {
    return new WC3.Game(Object.assign({ difficulty: 'normal', seed: 4242 }, opts || {}));
  }

  t.test('cumulative length equals the sum of the segments', function () {
    var p = new Path([{ x: 0, y: 0 }, { x: 30, y: 40 }, { x: 30, y: 140 }]);
    t.close(p.length, 50 + 100, 1e-9, 'total length');
    t.eq(p.segments.length, 2, 'segment count');
  });

  t.test('degenerate duplicate points are dropped, not fatal', function () {
    var p = new Path([{ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 10, y: 0 }]);
    t.eq(p.segments.length, 1, 'zero-length segment skipped');
    t.close(p.length, 10, 1e-9, 'length');
  });

  t.test('sampling is continuous and clamps at both ends', function () {
    var p = new Path([{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 100 }]);
    t.close(p.pointAt(0).x, 0, 1e-9, 'start x');
    t.close(p.pointAt(50).x, 50, 1e-9, 'mid of first segment');
    t.close(p.pointAt(150).y, 50, 1e-9, 'mid of second segment');
    t.close(p.pointAt(-99).x, 0, 1e-9, 'clamped before start');
    t.close(p.pointAt(1e6).y, 100, 1e-9, 'clamped past end');
    // No jumps between adjacent samples.
    var prev = p.pointAt(0);
    for (var d = 1; d <= p.length; d += 1) {
      var cur = p.pointAt(d);
      var step = Math.hypot(cur.x - prev.x, cur.y - prev.y);
      t.close(step, 1, 1e-6, 'step size at ' + d);
      prev = cur;
    }
  });

  t.test('distanceTo and projectDistance find the nearest point', function () {
    var p = new Path([{ x: 0, y: 0 }, { x: 100, y: 0 }]);
    t.close(p.distanceTo(50, 25), 25, 1e-9, 'perpendicular distance');
    t.close(p.distanceTo(-30, 0), 30, 1e-9, 'before the start');
    t.close(p.projectDistance(50, 25), 50, 1e-9, 'projected arc length');
    t.close(p.projectDistance(500, 0), 100, 1e-9, 'clamped projection');
  });

  t.test('ground road and flying bypass are different routes', function () {
    var g = newGame();
    t.gt(g.path.length, g.airPath.length, 'road is longer than the air line');
    t.eq(g.airPath.segments.length, Config.AIR_PATH_TILES.length - 1, 'air waypoints');
    var groundEnd = g.path.end();
    var airEnd = g.airPath.end();
    t.close(groundEnd.x, airEnd.x, 1e-6, 'both routes end at the keep (x)');
    t.close(groundEnd.y, airEnd.y, 1e-6, 'both routes end at the keep (y)');
  });

  t.test('road tiles are never buildable', function () {
    var g = newGame();
    var buildableOnRoad = 0;
    for (var ty = 0; ty < g.gridH; ty++) {
      for (var tx = 0; tx < g.gridW; tx++) {
        var i = ty * g.gridW + tx;
        var d = g.path.distanceTo((tx + 0.5) * g.tile, (ty + 0.5) * g.tile);
        if (d <= Config.ROAD_CLEARANCE && g.buildable[i]) buildableOnRoad++;
      }
    }
    t.eq(buildableOnRoad, 0, 'no buildable tile inside the road corridor');
  });

  t.test('the map always offers plenty of legal build spots', function () {
    var g = newGame();
    var free = 0;
    for (var i = 0; i < g.buildable.length; i++) if (g.buildable[i]) free++;
    t.gt(free, 120, 'buildable tile count');
  });

  // ---------------------------------------------------------------- leaking

  t.test('LEAK: a ground creep reaching the keep costs one life and vanishes', function () {
    var g = newGame();
    var entry = g.waves[0].entries[0];
    var lives0 = g.lives;
    var c = g.spawnCreep(entry);
    t.ok(c, 'creep spawned');
    t.eq(g.creeps.length, 1, 'one creep alive');

    c.dist = g.path.length - 1;
    g.tick(Config.DT);

    t.eq(g.lives, lives0 - 1, 'exactly one life lost');
    t.eq(g.stats.leaks, 1, 'leak counted');
    t.eq(g.creeps.length, 0, 'creep removed from the live list');
    t.eq(c.alive, false, 'entity flagged dead');
    g.tick(Config.DT);
    t.eq(g.hash.count, 0, 'spatial hash rebuilt without the creep');
  });

  t.test('LEAK: leaked creeps never respawn and never double-charge', function () {
    var g = newGame();
    var entry = g.waves[0].entries[0];
    var c = g.spawnCreep(entry);
    c.dist = g.path.length + 500;
    g.tick(Config.DT);
    var livesAfter = g.lives;

    for (var i = 0; i < 600; i++) g.tick(Config.DT);
    // Wave 1 auto-starts during those 10s, so filter to the leaked entity.
    t.eq(g.creeps.indexOf(c), -1, 'leaked entity is not back in the list');
    t.eq(g.stats.leaks, 1, 'still exactly one leak recorded');
    t.ok(g.lives <= livesAfter, 'lives never increase');
  });

  t.test('LEAK: a flying creep leaks through the air bypass, not the road', function () {
    var g = newGame();
    var wyvern = null;
    for (var w = 0; w < g.waves.length && !wyvern; w++) {
      g.waves[w].entries.forEach(function (e) {
        if (!wyvern && e.def.flying) wyvern = e;
      });
    }
    t.ok(wyvern, 'found a flying entry in the wave plan');
    var c = g.spawnCreep(wyvern);
    t.eq(c.flying, true, 'flying flag');
    t.close(c.pathLength, g.airPath.length, 1e-6, 'uses the air polyline');

    var lives0 = g.lives;
    var guard = 0;
    while (c.alive && guard++ < 20000) g.tick(Config.DT);
    t.lt(guard, 20000, 'flight terminates');
    t.eq(g.lives, lives0 - 1, 'air leak costs one life');
  });

  t.test('LEAK: a boss costs three lives', function () {
    var g = newGame();
    var bossEntry = null;
    g.waves.forEach(function (w) {
      w.entries.forEach(function (e) { if (!bossEntry && e.def.boss) bossEntry = e; });
    });
    var c = g.spawnCreep(bossEntry);
    var lives0 = g.lives;
    c.dist = g.path.length;
    g.tick(Config.DT);
    t.eq(g.lives, lives0 - 3, 'boss leak penalty');
  });

  t.test('LEAK: running out of lives ends the run instead of hanging', function () {
    var g = newGame({ difficulty: 'insane' });
    var entry = g.waves[0].entries[0];
    var guard = 0;
    while (g.state === 'playing' && guard++ < 100) {
      var c = g.spawnCreep(entry);
      c.dist = g.path.length;
      g.tick(Config.DT);
    }
    t.eq(g.state, 'defeat', 'run finished as a defeat');
    t.eq(g.lives, 0, 'lives clamped at zero');
    // The sim must stay responsive after the run ends.
    for (var i = 0; i < 300; i++) g.tick(Config.DT);
    t.eq(g.state, 'defeat', 'state is stable after the loss');
  });

  t.test('creep entities are recycled through the pool, not leaked', function () {
    var g = newGame();
    var entry = g.waves[0].entries[0];
    var free0 = g.creepPool.free.length;
    for (var i = 0; i < 40; i++) {
      var c = g.spawnCreep(entry);
      c.dist = g.path.length;
    }
    g.tick(Config.DT);
    t.eq(g.creeps.length, 0, 'all leaked away');
    t.ok(g.creepPool.free.length >= free0, 'pool reclaimed the entities');
    t.lt(g.creepPool.created, 200, 'pool did not allocate unboundedly');
  });
};
