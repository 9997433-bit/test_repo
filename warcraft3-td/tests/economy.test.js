/* Gold, lumber, bounty, interest, sell and upgrade accounting. */
module.exports = function (test, NS) {
  function freeTile(game, skip) {
    let n = 0;
    for (let y = 1; y < NS.Config.grid.rows; y++) {
      for (let x = 1; x < NS.Config.grid.cols; x++) {
        if (game.isBuildable(x, y)) { if (n++ >= (skip || 0)) return { x, y }; }
      }
    }
    return null;
  }

  test('difficulty sets the starting purse and lives', (t) => {
    t.eq(new NS.Game({ difficulty: 'easy', hero: null }).gold, 200);
    t.eq(new NS.Game({ difficulty: 'normal', hero: null }).gold, 120);
    t.eq(new NS.Game({ difficulty: 'insane', hero: null }).lives, 10);
    t.gt(new NS.Game({ difficulty: 'hard', hero: null }).diff.hp, 1);
  });

  test('building deducts gold and refuses when broke', (t) => {
    const game = new NS.Game({ difficulty: 'normal', hero: null });
    const def = NS.TowerData.get('h_arrow_t1');
    const spot = freeTile(game);
    t.ok(game.build('h_arrow_t1', spot.x, spot.y).ok);
    t.eq(game.gold, 120 - def.gold);
    game.gold = 0;
    const spot2 = freeTile(game, 1);
    t.eq(game.build('h_arrow_t1', spot2.x, spot2.y).reason, 'cost');
  });

  test('only tier-1 buildings can be raised directly', (t) => {
    const game = new NS.Game({ hero: null });
    game.gold = 9999; game.lumber = 9;
    const spot = freeTile(game);
    t.eq(game.build('h_arrow_t3', spot.x, spot.y).reason, 'invalid');
  });

  test('upgrading charges the tier price and tracks total investment', (t) => {
    const game = new NS.Game({ hero: null });
    game.gold = 5000; game.lumber = 5;
    const spot = freeTile(game);
    const tw = game.build('h_cannon_t1', spot.x, spot.y).tower;
    t.eq(tw.investedGold, 80);
    game.upgrade(tw);
    t.eq(tw.def.tier, 2);
    t.eq(tw.investedGold, 80 + 200);
    game.upgrade(tw);
    t.eq(tw.def.tier, 3);
    t.eq(tw.investedGold, 80 + 200 + 480);
    t.eq(tw.investedLumber, 1);
    t.eq(game.upgrade(tw).reason, 'max');
  });

  test('tier-3 upgrades require lumber', (t) => {
    const game = new NS.Game({ hero: null });
    game.gold = 5000; game.lumber = 0;
    const spot = freeTile(game);
    const tw = game.build('u_spirit_t1', spot.x, spot.y).tower;
    game.upgrade(tw);
    t.eq(game.upgrade(tw).reason, 'cost', 'no lumber, no ultimate');
    game.lumber = 1;
    t.ok(game.upgrade(tw).ok);
    t.eq(game.lumber, 0);
  });

  test('selling refunds 75 percent of everything invested', (t) => {
    const game = new NS.Game({ hero: null });
    game.gold = 5000; game.lumber = 5;
    const spot = freeTile(game);
    const tw = game.build('o_spirit_t1', spot.x, spot.y).tower;
    game.upgrade(tw);
    const invested = tw.investedGold;
    const before = game.gold;
    const res = game.sell(tw);
    t.eq(res.value, Math.floor(invested * 0.75));
    t.eq(game.gold, before + res.value);
    t.eq(game.towers.length, 0);
  });

  test('kills pay bounty scaled by wave and difficulty', (t) => {
    const easy = new NS.Game({ difficulty: 'easy', hero: null });
    const hard = new NS.Game({ difficulty: 'hard', hero: null });
    const c1 = new NS.Creep(easy, 'footman', 10);
    const c2 = new NS.Creep(hard, 'footman', 10);
    t.gt(c1.bounty, c2.bounty, 'easy pays better');
    const gold = easy.gold;
    c1.kill(null);
    t.eq(easy.gold, gold + c1.bounty);
    t.eq(easy.stats.kills, 1);
    const late = new NS.Creep(easy, 'footman', 25);
    t.gt(late.bounty, c1.bounty, 'later waves pay more');
  });

  test('interest pays out on a fixed timer and is capped', (t) => {
    const game = new NS.Game({ difficulty: 'normal', hero: null });
    game.gold = 1000;
    game.interestTimer = 0.001;
    game.update(0.002);
    t.eq(game.gold, 1020, '2 percent of 1000');
    t.eq(game.stats.interestPaid, 20);
    game.interestRate = 1;
    t.lte(NS.Config.interestCap, 0.08);
  });

  test('boss waves raise the interest rate up to the cap', (t) => {
    const game = new NS.Game({ difficulty: 'normal', hero: null });
    const start = game.interestRate;
    for (let i = 0; i < 30; i++) {
      game.wave = 5;
      game.currentWave = NS.WaveData.wave(5);
      game.finishWave();
    }
    t.gt(game.interestRate, start);
    t.lte(game.interestRate, NS.Config.interestCap);
  });

  test('lumber arrives every five waves, with a bonus log for each boss', (t) => {
    const game = new NS.Game({ hero: null });
    for (let w = 1; w <= 10; w++) {
      game.wave = w;
      game.currentWave = NS.WaveData.wave(w);
      game.finishWave();
    }
    t.eq(game.lumber, 2 + 2 * NS.Config.lumberPerBoss, 'waves 5 and 10 also drop boss lumber');
  });

  test('calling a wave early pays a bounty for the unused timer', (t) => {
    const game = new NS.Game({ hero: null });
    game.waveTimer = 10;
    const gold = game.gold;
    game.startWave(true);
    t.eq(game.gold, gold + 20);
  });

  test('clearing a wave grants the completion bonus', (t) => {
    const game = new NS.Game({ hero: null });
    game.wave = 7;
    game.currentWave = NS.WaveData.wave(7);
    const gold = game.gold;
    game.finishWave();
    t.eq(game.gold, gold + NS.WaveData.wave(7).clearBonus);
    t.eq(game.stats.wavesCleared, 1);
  });
};
