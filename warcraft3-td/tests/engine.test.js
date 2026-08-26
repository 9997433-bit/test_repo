/*
 * Engine primitives: fixed-timestep loop, spatial hash, entity pools.
 * These are the pieces that keep the frame budget stable and stop the game
 * from ever wedging itself.
 */
module.exports = function (t, WC3) {
  var Loop = WC3.Loop;
  var SpatialHash = WC3.SpatialHash;
  var Config = WC3.Config;

  t.test('loop runs exactly one tick per 1/60s of real time', function () {
    var ticks = 0;
    var frames = 0;
    var loop = new Loop({ update: function () { ticks++; }, render: function () { frames++; } });
    loop.running = true;
    loop.lastTime = 0;
    for (var i = 1; i <= 60; i++) loop.frame(i * (1000 / 60));
    t.eq(frames, 60, 'frames rendered');
    t.close(ticks, 60, 1, 'ticks simulated');
  });

  t.test('a slow frame catches up but never exceeds the step cap', function () {
    var ticks = 0;
    var loop = new Loop({ update: function () { ticks++; }, render: function () {} });
    loop.running = true;
    loop.lastTime = 0;
    loop.frame(1000); // a full second of stall in one frame
    t.eq(ticks, Config.MAX_STEPS_PER_FRAME, 'catch-up steps clamped');
    t.gt(loop.droppedTicks, 0, 'backlog was shed, not queued');
    t.eq(loop.accumulator, 0, 'accumulator reset');
  });

  t.test('a long stall cannot spiral: work per frame stays bounded', function () {
    var perFrame = [];
    var count = 0;
    var loop = new Loop({ update: function () { count++; }, render: function () {} });
    loop.running = true;
    loop.lastTime = 0;
    var time = 0;
    for (var i = 0; i < 30; i++) {
      count = 0;
      time += (i === 10) ? 12000 : 16.7; // one 12-second freeze
      loop.frame(time);
      perFrame.push(count);
    }
    perFrame.forEach(function (n, i) {
      t.ok(n <= Config.MAX_STEPS_PER_FRAME, 'frame ' + i + ' did ' + n + ' ticks');
    });
    t.eq(perFrame[perFrame.length - 1] <= 2, true, 'recovers to normal cadence');
  });

  t.test('pause freezes the sim but keeps rendering', function () {
    var ticks = 0;
    var frames = 0;
    var loop = new Loop({ update: function () { ticks++; }, render: function () { frames++; } });
    loop.running = true;
    loop.lastTime = 0;
    loop.setPaused(true);
    for (var i = 1; i <= 30; i++) loop.frame(i * 16.7);
    t.eq(ticks, 0, 'no simulation while paused');
    t.eq(frames, 30, 'still rendering');
    loop.setPaused(false);
    for (i = 31; i <= 60; i++) loop.frame(i * 16.7);
    t.gt(ticks, 0, 'resumes');
  });

  t.test('speed multiplier scales ticks, not frames', function () {
    function count(speed) {
      var ticks = 0;
      var loop = new Loop({ update: function () { ticks++; }, render: function () {} });
      loop.running = true;
      loop.lastTime = 0;
      loop.setSpeed(speed);
      for (var i = 1; i <= 30; i++) loop.frame(i * 16.7);
      return ticks;
    }
    var one = count(1);
    var two = count(2);
    t.gt(two, one * 1.7, '2x runs roughly twice the ticks');
  });

  t.test('negative or NaN frame deltas cannot rewind the clock', function () {
    var ticks = 0;
    var loop = new Loop({ update: function () { ticks++; }, render: function () {} });
    loop.running = true;
    loop.lastTime = 1000;
    loop.frame(500);          // clock went backwards
    loop.frame(NaN);
    t.eq(ticks, 0, 'no ticks from bogus deltas');
    t.ok(loop.accumulator >= 0, 'accumulator stays sane');
  });

  t.test('spatial hash finds exactly the entities inside the radius', function () {
    var hash = new SpatialHash(64, 1000, 1000);
    var ents = [];
    for (var i = 0; i < 500; i++) {
      ents.push({ id: i + 1, alive: true, x: (i * 37) % 1000, y: (i * 61) % 1000 });
    }
    hash.rebuild(ents);
    t.eq(hash.count, 500, 'all inserted');

    var qx = 500, qy = 500, r = 120;
    var brute = ents.filter(function (e) {
      return Math.hypot(e.x - qx, e.y - qy) <= r;
    }).map(function (e) { return e.id; }).sort(function (a, b) { return a - b; });
    var got = hash.query(qx, qy, r, []).map(function (e) { return e.id; })
      .sort(function (a, b) { return a - b; });
    t.eq(got.join(','), brute.join(','), 'hash query matches brute force');
  });

  t.test('spatial hash ignores dead entities and clamps out-of-bounds', function () {
    var hash = new SpatialHash(64, 500, 500);
    var ents = [
      { id: 1, alive: true, x: 10, y: 10 },
      { id: 2, alive: false, x: 12, y: 12 },
      { id: 3, alive: true, x: -400, y: -400 },
      { id: 4, alive: true, x: 9999, y: 9999 }
    ];
    hash.rebuild(ents);
    t.eq(hash.count, 3, 'dead entity skipped');
    var near = hash.query(10, 10, 20, []);
    t.eq(near.length, 1, 'only the live neighbour');
    t.eq(near[0].id, 1, 'correct entity');
  });

  t.test('spatial hash pick is deterministic on ties', function () {
    var hash = new SpatialHash(64, 500, 500);
    var ents = [
      { id: 9, alive: true, x: 100, y: 100, v: 5 },
      { id: 3, alive: true, x: 104, y: 100, v: 5 },
      { id: 7, alive: true, x: 96, y: 100, v: 5 }
    ];
    hash.rebuild(ents);
    for (var i = 0; i < 20; i++) {
      var best = hash.pick(100, 100, 60, function (e) { return e.v; }, []);
      t.eq(best.id, 3, 'lowest id wins the tie, run ' + i);
    }
  });

  t.test('pool sweep compacts in order and recycles', function () {
    var Pool = WC3.Entity.Pool;
    var n = 0;
    var pool = new Pool(function () { return { alive: false, id: ++n }; }, 4);
    var list = [];
    for (var i = 0; i < 10; i++) list.push(pool.obtain());
    var ids = list.map(function (o) { return o.id; });
    list[2].alive = false;
    list[5].alive = false;
    pool.sweep(list);
    t.eq(list.length, 8, 'two removed');
    t.eq(list[0].id, ids[0], 'order preserved');
    t.eq(list[2].id, ids[3], 'compaction shifted the tail');
    t.eq(pool.free.length, 2, 'entities returned to the pool');
    var reused = pool.obtain();
    t.eq(reused.alive, true, 'reused entity is alive again');
  });

  t.test('a long soak keeps entity lists and pools bounded', function () {
    var g = new WC3.Game({ difficulty: 'normal', seed: 77 });
    g.gold = 100000;
    var placed = 0;
    for (var ty = 0; ty < g.gridH && placed < 12; ty++) {
      for (var tx = 0; tx < g.gridW && placed < 12; tx++) {
        if (!g.canBuildAt(tx, ty)) continue;
        if (g.path.distanceTo((tx + 0.5) * g.tile, (ty + 0.5) * g.tile) > 140) continue;
        g.build(placed % 2 ? 'warband_venom_t1' : 'kingdom_arrow_t1', tx, ty);
        placed++;
      }
    }
    var maxCreeps = 0;
    var maxFx = 0;
    var maxProj = 0;
    for (var i = 0; i < 20000; i++) {
      g.tick(WC3.Config.DT);
      if (g.creeps.length > maxCreeps) maxCreeps = g.creeps.length;
      if (g.fx.length > maxFx) maxFx = g.fx.length;
      if (g.projectiles.length > maxProj) maxProj = g.projectiles.length;
    }
    t.lt(maxCreeps, WC3.Config.MAX_CREEPS_SOFT + 1, 'creep count capped');
    t.lt(maxFx, 421, 'fx count capped');
    t.lt(maxProj, 400, 'projectile count bounded');
    t.lt(g.logQueue.length, 121, 'log ring buffer bounded');
    t.lt(g.sfxQueue.length, 49, 'sfx queue bounded');
    t.lt(g.creepPool.created, 400, 'creep pool reuse working');
  });

  t.test('camera transforms round-trip and stay clamped', function () {
    if (!WC3.Camera) { t.note('camera is browser-only, skipped'); return; }
    var cam = new WC3.Camera(Config.WORLD_W, Config.WORLD_H);
    cam.resize(1280, 720);
    cam.centerOn(600, 400);
    var w = cam.toWorld(640, 360);
    t.close(w.x, cam.x, 1e-6, 'centre maps back to camera x');
    t.close(w.y, cam.y, 1e-6, 'centre maps back to camera y');
    var s = cam.toScreen(900, 500);
    var back = cam.toWorld(s.x, s.y);
    t.close(back.x, 900, 1e-6, 'round-trip x');
    t.close(back.y, 500, 1e-6, 'round-trip y');
    cam.moveBy(-99999, -99999);
    t.gt(cam.x, -200, 'clamped left');
    t.gt(cam.y, -200, 'clamped top');
    cam.moveBy(99999, 99999);
    t.lt(cam.x, Config.WORLD_W + 200, 'clamped right');
    cam.setZoom(1000);
    t.ok(cam.zoom <= cam.maxZoom, 'zoom clamped high');
    cam.setZoom(0.0001);
    t.ok(cam.zoom >= cam.minZoom, 'zoom clamped low');
  });
};
