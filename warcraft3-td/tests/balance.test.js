/*
 * Full-run playability. A scripted "auto commander" plays the whole ladder
 * headless: it proves the campaign can actually be beaten, that the sim never
 * hangs, and that a tick stays far inside the 16.6ms frame budget.
 */
module.exports = function (t, WC3) {
  var DT = WC3.Config.DT;

  // Towers the bot rotates through: pierce and magic for air coverage,
  // siege for fortified, plus slow support.
  var ORDER = [
    'kingdom_arrow_t1', 'warband_venom_t1', 'blight_web_t1', 'kingdom_cannon_t1',
    'grove_star_t1', 'warband_storm_t1', 'blight_lob_t1', 'kingdom_arcane_t1',
    'grove_thorn_t1', 'warband_watch_t1', 'blight_wraith_t1', 'grove_acid_t1'
  ];

  /** Rank every legal tile by how much of the road it covers. */
  function rankSpots(g) {
    var samples = [];
    var step = 26;
    for (var d = 0; d < g.path.length; d += step) samples.push(g.path.pointAt(d));
    for (d = 0; d < g.airPath.length; d += step) samples.push(g.airPath.pointAt(d));

    var spots = [];
    for (var ty = 0; ty < g.gridH; ty++) {
      for (var tx = 0; tx < g.gridW; tx++) {
        if (!g.canBuildAt(tx, ty)) continue;
        var cx = (tx + 0.5) * g.tile;
        var cy = (ty + 0.5) * g.tile;
        var cover = 0;
        for (var i = 0; i < samples.length; i++) {
          var dx = samples[i].x - cx;
          var dy = samples[i].y - cy;
          if (dx * dx + dy * dy <= 205 * 205) cover++;
        }
        if (cover > 0) spots.push({ tx: tx, ty: ty, cover: cover });
      }
    }
    spots.sort(function (a, b) {
      return (b.cover - a.cover) || (a.ty - b.ty) || (a.tx - b.tx);
    });
    return spots;
  }

  function autoPlay(difficulty, seed, maxTicks) {
    var g = new WC3.Game({ difficulty: difficulty, seed: seed, hero: 'warden' });
    var spots = rankSpots(g);
    var spotIdx = 0;
    var orderIdx = 0;
    var built = [];
    var targetTowers = 18;
    var ticks = 0;

    while (g.state === 'playing' && ticks < maxTicks) {
      if (ticks % 20 === 0) {
        if (built.length < targetTowers) {
          // Build out the core first.
          var guard = 0;
          while (spotIdx < spots.length && guard++ < 50) {
            var s = spots[spotIdx];
            if (!g.canBuildAt(s.tx, s.ty)) { spotIdx++; continue; }
            var id = ORDER[orderIdx % ORDER.length];
            var res = g.build(id, s.tx, s.ty);
            if (typeof res === 'object') {
              built.push(res);
              orderIdx++;
              spotIdx++;
            }
            break;
          }
        }
        // Then pour surplus gold into upgrades, best-covering towers first.
        if (built.length >= 6) {
          for (var k = 0; k < built.length; k++) {
            var tw = built[k];
            if (!tw.alive || !tw.def.next) continue;
            var next = WC3.TowerData.get(tw.def.next);
            if (g.gold >= next.gold + 120 && g.lumber >= next.lumber) {
              g.upgrade(tw);
              break;
            }
          }
        }
        if (built.length >= targetTowers && g.gold > 600) targetTowers += 4;
      }
      if (g.hero && ticks % 30 === 0) g.hero.castQ(g);
      g.tick(DT);
      ticks++;
    }
    return { game: g, ticks: ticks, towers: built.length };
  }

  var MAX = 60 * 60 * 30; // 30 simulated minutes is a hard stop

  t.test('a competent build order beats the campaign on Easy', function () {
    var r = autoPlay('easy', 1001, MAX);
    t.note('easy: ' + r.game.state + ' at wave ' + r.game.waveIndex +
      ', lives ' + r.game.lives + '/' + r.game.maxLives +
      ', towers ' + r.towers + ', kills ' + r.game.stats.kills);
    t.eq(r.game.state, 'victory', 'campaign cleared on easy');
    t.lt(r.ticks, MAX, 'run terminated on its own');
  });

  t.test('the same build order also clears Normal', function () {
    var r = autoPlay('normal', 2002, MAX);
    t.note('normal: ' + r.game.state + ' at wave ' + r.game.waveIndex +
      ', lives ' + r.game.lives + '/' + r.game.maxLives);
    t.eq(r.game.state, 'victory', 'campaign cleared on normal');
  });

  t.test('Hard is a genuine challenge for the same bot', function () {
    var r = autoPlay('hard', 3003, MAX);
    t.note('hard: ' + r.game.state + ' at wave ' + r.game.waveIndex +
      ', lives ' + r.game.lives + '/' + r.game.maxLives);
    t.gt(r.game.waveIndex, 12, 'the bot still gets deep into the ladder');
    t.ok(r.game.state !== 'playing', 'the run resolves either way');
    t.lt(r.game.lives, r.game.maxLives, 'hard costs lives');
  });

  t.test('a full run stays far inside the 60fps tick budget', function () {
    var g = new WC3.Game({ difficulty: 'insane', seed: 4004 });
    g.gold = 200000;
    g.lumber = 200;
    var spots = rankSpots(g);
    for (var i = 0; i < 40 && i < spots.length; i++) {
      var tw = g.build(ORDER[i % ORDER.length], spots[i].tx, spots[i].ty);
      if (typeof tw === 'object') { g.upgrade(tw); g.upgrade(tw); }
    }
    // Keep the board deliberately crowded with late-wave creeps.
    var lateEntries = g.waves[28].entries;
    var N = 30000;
    var peak = 0;
    var start = Date.now();
    for (i = 0; i < N; i++) {
      while (g.creeps.length < 120) {
        g.spawnCreep(lateEntries[g.creeps.length % lateEntries.length]);
      }
      g.tick(DT);
      if (g.creeps.length > peak) peak = g.creeps.length;
      if (g.state !== 'playing') { g.state = 'playing'; g.lives = 500; }
    }
    var ms = Date.now() - start;
    var per = ms / N;
    t.note('40 towers, peak ' + peak + ' creeps: ' + per.toFixed(4) +
      ' ms/tick (' + Math.round(1000 / per) + ' ticks/s), ' + ms + 'ms for ' + N + ' ticks');
    t.gt(peak, 60, 'the stress run really was crowded');
    t.lt(per, 2.0, 'average tick cost in ms');
  });
};
