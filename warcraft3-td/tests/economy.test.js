/* Gold / lumber / lives economy: build, sell, upgrade, interest, bounty. */
module.exports = function (t, WC3) {
  var Config = WC3.Config;
  var TowerData = WC3.TowerData;

  function newGame(diff, seed) {
    return new WC3.Game({ difficulty: diff || 'normal', seed: seed || 11 });
  }

  function firstSpot(g) {
    for (var ty = 0; ty < g.gridH; ty++) {
      for (var tx = 0; tx < g.gridW; tx++) {
        if (g.canBuildAt(tx, ty)) return [tx, ty];
      }
    }
    return null;
  }

  /** A legal tile that actually overlooks the road. */
  function spotOnRoad(g) {
    for (var ty = 0; ty < g.gridH; ty++) {
      for (var tx = 0; tx < g.gridW; tx++) {
        if (!g.canBuildAt(tx, ty)) continue;
        if (g.path.distanceTo((tx + 0.5) * g.tile, (ty + 0.5) * g.tile) < 120) return [tx, ty];
      }
    }
    return null;
  }

  t.test('difficulty sets starting resources', function () {
    t.eq(newGame('easy').gold, Config.DIFFICULTY.easy.gold, 'easy gold');
    t.eq(newGame('normal').gold, 120, 'normal gold');
    t.eq(newGame('normal').lives, 20, 'normal lives');
    t.eq(newGame('insane').lives, Config.DIFFICULTY.insane.lives, 'insane lives');
  });

  t.test('building deducts gold and occupies the tile', function () {
    var g = newGame();
    var s = firstSpot(g);
    var def = TowerData.get('human_guard_t1');
    var gold0 = g.gold;
    var tower = g.build('human_guard_t1', s[0], s[1]);
    t.ok(typeof tower === 'object', 'tower created');
    t.eq(g.gold, gold0 - def.gold, 'gold deducted');
    t.eq(g.canBuildAt(s[0], s[1]), false, 'tile now occupied');
    t.eq(g.towerAt(s[0], s[1]), tower, 'lookup by tile');
    t.eq(g.stats.towersBuilt, 1, 'stat recorded');
  });

  t.test('insufficient funds are rejected without side effects', function () {
    var g = newGame();
    g.gold = 10;
    var s = firstSpot(g);
    t.eq(g.build('human_guard_t1', s[0], s[1]), 'errGold', 'gold error code');
    t.eq(g.gold, 10, 'gold untouched');
    t.eq(g.towers.length, 0, 'nothing built');

    g.gold = 5000;
    g.lumber = 0;
    t.eq(g.build('human_guard_t1', -5, 2), 'errSpot', 'off-map rejected');
    t.eq(g.towers.length, 0, 'still nothing built');
  });

  t.test('tier 2 and 3 towers cannot be built directly', function () {
    var g = newGame();
    g.gold = 99999;
    g.lumber = 20;
    var s = firstSpot(g);
    t.eq(g.build('human_guard_t2', s[0], s[1]), 'errSpot', 't2 direct build blocked');
    t.eq(g.build('human_guard_t3', s[0], s[1]), 'errSpot', 't3 direct build blocked');
  });

  t.test('upgrading charges the next tier and accumulates investment', function () {
    var g = newGame();
    g.gold = 2000;
    g.lumber = 5;
    var s = firstSpot(g);
    var tw = g.build('human_guard_t1', s[0], s[1]);
    var t1 = TowerData.get('human_guard_t1');
    var t2 = TowerData.get('human_guard_t2');
    var t3 = TowerData.get('human_guard_t3');
    var gold0 = g.gold;

    g.upgrade(tw);
    t.eq(tw.def.id, 'human_guard_t2', 'promoted to tier 2');
    t.eq(g.gold, gold0 - t2.gold, 'tier 2 cost');
    t.eq(tw.investedGold, t1.gold + t2.gold, 'investment tracked');

    var lumber0 = g.lumber;
    g.upgrade(tw);
    t.eq(tw.def.id, 'human_guard_t3', 'promoted to tier 3');
    t.eq(g.lumber, lumber0 - t3.lumber, 'lumber spent');
    t.eq(g.upgrade(tw), 'errSpot', 'tier 3 is the cap');
    t.gt(tw.def.dps, t1.dps, 'tier 3 out-damages tier 1');
  });

  t.test('selling refunds 75% of everything invested and frees the tile', function () {
    var g = newGame();
    g.gold = 3000;
    g.lumber = 5;
    var s = firstSpot(g);
    var tw = g.build('human_guard_t1', s[0], s[1]);
    g.upgrade(tw);
    var invested = tw.investedGold;
    var goldBefore = g.gold;

    var refund = g.sell(tw);
    t.eq(refund, Math.floor(invested * Config.SELL_RATE), '75% refund');
    t.eq(g.gold, goldBefore + refund, 'gold credited');
    t.eq(g.canBuildAt(s[0], s[1]), true, 'tile freed');
    g.tick(Config.DT);
    t.eq(g.towers.length, 0, 'tower removed from the list');
  });

  t.test('interest pays out every 15s and is capped', function () {
    var g = newGame();
    g.gold = 1000;
    var gold0 = g.gold;
    for (var i = 0; i < 15 * 60 + 2; i++) g.tick(Config.DT);
    t.gt(g.gold, gold0, 'interest paid');
    t.eq(g.interestRate(), Config.INTEREST_START, 'starts at 2%');

    g.wavesCleared = Config.INTEREST_WAVE_STEP;
    t.close(g.interestRate(), Config.INTEREST_START + Config.INTEREST_STEP, 1e-9, 'grows per step');
    g.wavesCleared = 30;
    t.eq(g.interestRate(), Config.INTEREST_CAP, 'capped at 8%');
  });

  t.test('killing a creep pays its bounty, scaled by difficulty', function () {
    function bountyFor(diff) {
      var g = newGame(diff, 5);
      var c = g.spawnCreep(g.waves[0].entries[0]);
      var gold0 = g.gold;
      g.killCreep(c, null);
      return g.gold - gold0;
    }
    var easy = bountyFor('easy');
    var normal = bountyFor('normal');
    var hard = bountyFor('hard');
    t.gt(easy, normal, 'easy pays more');
    t.gt(normal, hard, 'hard pays less');
    t.gt(hard, 0, 'always some bounty');
  });

  t.test('lumber is granted every 5 cleared waves', function () {
    var g = newGame();
    g.lumber = 0;
    g.waveIndex = 5;
    g.waveState = 'active';
    g.onWaveCleared();
    t.eq(g.lumber, 1, 'lumber granted at wave 5');
    g.waveIndex = 6;
    g.waveState = 'active';
    g.onWaveCleared();
    t.eq(g.lumber, 1, 'no lumber at wave 6');
  });

  t.test('calling a wave early pays a bonus', function () {
    var g = newGame();
    var gold0 = g.gold;
    t.eq(g.canCallWave(), true, 'callable during prep');
    g.callWave();
    t.gt(g.gold, gold0, 'bonus paid');
    t.eq(g.waveIndex, 1, 'wave started');
    t.eq(g.canCallWave(), false, 'cannot double-call mid-spawn');
  });

  t.test('stat counters only ever move forward', function () {
    var g = newGame();
    g.gold = 6000;
    var s = spotOnRoad(g);
    g.build('orc_watch_t1', s[0], s[1]);
    var prevEarned = 0;
    var prevKills = 0;
    for (var i = 0; i < 4000; i++) {
      g.tick(Config.DT);
      t.ok(g.stats.goldEarned >= prevEarned, 'goldEarned monotonic');
      t.ok(g.stats.kills >= prevKills, 'kills monotonic');
      prevEarned = g.stats.goldEarned;
      prevKills = g.stats.kills;
    }
    t.gt(g.stats.kills, 0, 'the run actually happened');
  });
};
