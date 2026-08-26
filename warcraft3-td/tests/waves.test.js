/* Wave script, spawn scheduling and creep stat scaling. */
module.exports = function (test, NS) {
  const W = NS.WaveData;

  test('there are exactly 30 waves with 6 boss waves', (t) => {
    t.eq(W.count, 30);
    t.eq(W.BOSS_WAVES.length, 6);
    [5, 10, 15, 20, 25, 30].forEach((n) => t.ok(W.wave(n).boss, 'wave ' + n + ' is a boss wave'));
    t.notOk(W.wave(4).boss);
    t.eq(W.wave(31), null);
  });

  test('every wave references a real creep type and spawns something', (t) => {
    for (let i = 1; i <= W.count; i++) {
      const w = W.wave(i);
      t.gt(w.groups.length, 0, 'wave ' + i);
      w.groups.forEach((g) => {
        t.ok(NS.CreepData.TYPES[g.type], 'wave ' + i + ' type ' + g.type);
        t.gt(g.count, 0);
        t.gt(g.gap, 0);
      });
      t.gt(W.totalCreeps(i), 0);
    }
  });

  test('boss waves actually contain a boss', (t) => {
    W.BOSS_WAVES.forEach((n) => {
      const hasBoss = W.wave(n).groups.some((g) => NS.CreepData.TYPES[g.type].boss);
      t.ok(hasBoss, 'wave ' + n);
    });
  });

  test('air waves appear early enough to matter', (t) => {
    let firstAir = 0;
    for (let i = 1; i <= W.count && !firstAir; i++) {
      if (W.preview(i).some((ty) => NS.CreepData.TYPES[ty].flying)) firstAir = i;
    }
    t.gt(firstAir, 0);
    t.lte(firstAir, 6, 'players meet air by wave 6');
  });

  test('hit points climb monotonically across the campaign', (t) => {
    let prev = 0;
    for (let i = 1; i <= W.count; i++) {
      const hp = NS.CreepData.baseHp(i);
      t.gt(hp, prev, 'wave ' + i);
      prev = hp;
    }
    t.gt(NS.CreepData.baseHp(30) / NS.CreepData.baseHp(1), 35, 'a real difficulty ramp');
  });

  test('armour value grows with the wave number', (t) => {
    const g = new NS.Game({ hero: null });
    const early = NS.CreepData.statsFor('footman', 1, g.diff);
    const late = NS.CreepData.statsFor('footman', 27, g.diff);
    t.gt(late.armorValue, early.armorValue);
    t.gt(late.maxHp, early.maxHp * 20);
  });

  test('difficulty scales creep hit points', (t) => {
    const easy = new NS.Game({ difficulty: 'easy', hero: null });
    const insane = new NS.Game({ difficulty: 'insane', hero: null });
    const a = new NS.Creep(easy, 'grunt', 12);
    const b = new NS.Creep(insane, 'grunt', 12);
    t.gt(b.maxHp, a.maxHp * 2);
    t.gt(b.baseSpeed, a.baseSpeed);
  });

  test('starting a wave builds a sorted spawn schedule', (t) => {
    const game = new NS.Game({ hero: null });
    game.startWave(false);
    t.eq(game.wave, 1);
    t.eq(game.waveState, 'spawning');
    t.eq(game.spawnQueue.length, W.totalCreeps(1));
    for (let i = 1; i < game.spawnQueue.length; i++) {
      t.gte(game.spawnQueue[i].at, game.spawnQueue[i - 1].at, 'sorted');
    }
  });

  test('creeps actually enter the map on schedule', (t) => {
    const game = new NS.Game({ hero: null });
    game.startWave(false);
    for (let i = 0; i < 60 * 12; i++) game.update(1 / 60);
    t.eq(game.creeps.length + game.stats.leaks + game.stats.kills >= W.totalCreeps(1), true);
    t.eq(game.spawnQueue.length, 0, 'the whole wave spawned');
  });

  test('a cleared wave rolls into the next one automatically', (t) => {
    const game = new NS.Game({ hero: null });
    game.startWave(false);
    game.creeps.length = 0;
    game.spawnQueue.length = 0;
    game.update(1 / 60);
    t.eq(game.waveState, 'clearing');
    t.near(game.waveTimer, NS.Config.autoWaveDelay, 0.1);
    for (let i = 0; i < 60 * 13; i++) game.update(1 / 60);
    t.eq(game.wave, 2);
  });

  test('surviving wave 30 wins the game', (t) => {
    const game = new NS.Game({ hero: null });
    game.wave = 30;
    game.currentWave = W.wave(30);
    game.finishWave();
    t.eq(game.status, 'victory');
  });
};
