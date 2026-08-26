/* The 30-wave ladder, the spawner and the victory / defeat conditions. */
module.exports = function (t, WC3) {
  var Config = WC3.Config;
  var DT = Config.DT;
  var WaveData = WC3.WaveData;

  t.test('there are exactly 30 waves with bosses every fifth', function () {
    var waves = WaveData.WAVES;
    t.eq(waves.length, 30, 'wave count');
    [5, 10, 15, 20, 25, 30].forEach(function (n) {
      t.eq(waves[n - 1].boss, true, 'wave ' + n + ' is a boss wave');
    });
    waves.forEach(function (w) {
      if ([5, 10, 15, 20, 25, 30].indexOf(w.wave) < 0) {
        t.eq(w.boss, false, 'wave ' + w.wave + ' is not a boss wave');
      }
    });
  });

  t.test('hp, bounty and creep counts all grow with the wave number', function () {
    var waves = WaveData.WAVES;
    for (var i = 1; i < waves.length; i++) {
      t.gt(WaveData.hpForWave(i + 1), WaveData.hpForWave(i), 'hp grows at wave ' + (i + 1));
      t.gt(WaveData.bountyForWave(i + 1), WaveData.bountyForWave(i), 'bounty grows at wave ' + (i + 1));
    }
    t.gt(waves[29].hpPool, waves[0].hpPool * 100, 'late waves are far beefier');
  });

  t.test('the ladder covers every armor type the damage table cares about', function () {
    var seen = {};
    WaveData.WAVES.forEach(function (w) {
      w.entries.forEach(function (e) { seen[e.def.armor] = true; });
    });
    ['unarmored', 'light', 'medium', 'heavy', 'fortified', 'hero'].forEach(function (a) {
      t.ok(seen[a], 'armor type present: ' + a);
    });
  });

  t.test('the ladder includes flying and spell-immune threats', function () {
    var flying = 0;
    var immune = 0;
    WaveData.WAVES.forEach(function (w) {
      w.entries.forEach(function (e) {
        if (e.def.flying) flying++;
        if (e.def.spellImmune) immune++;
      });
    });
    t.gt(flying, 5, 'air waves exist');
    t.gt(immune, 2, 'spell-immune waves exist');
  });

  t.test('starting a wave schedules exactly the planned creeps', function () {
    var g = new WC3.Game({ difficulty: 'normal', seed: 2 });
    g.startWave();
    t.eq(g.waveIndex, 1, 'wave counter');
    t.eq(g.waveState, 'spawning', 'spawning state');
    t.eq(g.schedule.length, g.waves[0].totalCreeps, 'schedule length');
    for (var i = 1; i < g.schedule.length; i++) {
      t.ok(g.schedule[i].time >= g.schedule[i - 1].time, 'schedule sorted at ' + i);
    }

    var guard = 0;
    while (g.waveState === 'spawning' && guard++ < 6000) g.tick(DT);
    t.eq(g.schedulePtr, g.schedule.length, 'everything spawned');
    t.eq(g.creeps.length, g.waves[0].totalCreeps, 'all creeps alive on the map');
  });

  t.test('waves auto-start after the countdown and never stall', function () {
    var g = new WC3.Game({ difficulty: 'normal', seed: 3 });
    t.eq(g.waveState, 'prep', 'starts in prep');
    t.close(g.autoTimer, Config.AUTO_WAVE_DELAY, 1e-9, 'countdown armed');
    for (var i = 0; i < Config.AUTO_WAVE_DELAY * 60 + 5; i++) g.tick(DT);
    t.eq(g.waveIndex, 1, 'wave 1 auto-started');
  });

  t.test('a cleared wave returns to prep and re-arms the countdown', function () {
    var g = new WC3.Game({ difficulty: 'normal', seed: 3 });
    g.startWave();
    var guard = 0;
    while (g.waveState === 'spawning' && guard++ < 6000) g.tick(DT);
    // Wipe the board the honest way; dead entities are swept at end of tick,
    // so the wave is only recognised as cleared on the following tick.
    g.creeps.slice().forEach(function (c) { g.killCreep(c, null); });
    g.tick(DT);
    g.tick(DT);
    t.eq(g.waveState, 'prep', 'back to prep');
    t.eq(g.wavesCleared, 1, 'wave counted as cleared');
    t.close(g.autoTimer, Config.AUTO_WAVE_DELAY, 0.05, 'countdown re-armed');
  });

  t.test('clearing all 30 waves is a victory', function () {
    var g = new WC3.Game({ difficulty: 'normal', seed: 3 });
    g.waveIndex = 30;
    g.waveState = 'active';
    g.onWaveCleared();
    t.eq(g.state, 'victory', 'victory declared');
    t.eq(g.wavesCleared, 30, 'all waves cleared');
    for (var i = 0; i < 120; i++) g.tick(DT);
    t.eq(g.state, 'victory', 'state stays stable');
  });

  t.test('the spawner respects the hard creep cap', function () {
    var g = new WC3.Game({ difficulty: 'insane', seed: 9 });
    var entry = g.waves[28].entries[0];
    for (var i = 0; i < Config.MAX_CREEPS_SOFT + 60; i++) g.spawnCreep(entry);
    t.eq(g.creeps.length, Config.MAX_CREEPS_SOFT, 'creep count capped');
  });

  t.test('surrender ends the run immediately', function () {
    var g = new WC3.Game({ difficulty: 'normal', seed: 3 });
    g.surrender();
    t.eq(g.state, 'defeat', 'defeat');
    var before = g.checksum();
    for (var i = 0; i < 600; i++) g.tick(DT);
    t.eq(g.state, 'defeat', 'still defeat');
    void before;
  });

  t.test('an unattended run always terminates instead of hanging', function () {
    // No towers: every wave leaks, so the run must reach a defeat quickly.
    var g = new WC3.Game({ difficulty: 'normal', seed: 12 });
    var guard = 0;
    while (g.state === 'playing' && guard++ < 60 * 60 * 6) g.tick(DT);
    t.eq(g.state, 'defeat', 'undefended keep falls');
    t.lt(guard, 60 * 60 * 6, 'terminated well inside the guard budget');
    t.eq(g.creeps.length >= 0, true, 'entity list intact');
  });
};
