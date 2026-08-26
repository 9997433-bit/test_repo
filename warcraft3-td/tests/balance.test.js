/* End-to-end headless campaign runs. A scripted commander builds, upgrades and
 * plays all 30 waves so we can assert the difficulty curve actually works. */
module.exports = function (test, NS) {
  const ORDER = [
    'h_arrow_t1', 'o_troll_t1', 'h_cannon_t1', 'u_zigg_t1', 'o_spirit_t1', 'u_meat_t1',
    'h_arcane_t1', 'e_chimaera_t1', 'u_spirit_t1', 'e_moon_t1', 'o_watch_t1', 'e_ancient_t1'
  ];

  /** Arc length of the point on the road closest to (x,y). */
  function arcOf(path, x, y) {
    let best = 0, bestD = Infinity;
    for (let i = 0; i < path.segments.length; i++) {
      const s = path.segments[i];
      let tt = ((x - s.a.x) * s.dx + (y - s.a.y) * s.dy) / (s.len * s.len);
      tt = Math.max(0, Math.min(1, tt));
      const d = Math.hypot(x - (s.a.x + s.dx * tt), y - (s.a.y + s.dy * tt));
      if (d < bestD) { bestD = d; best = s.start + s.len * tt; }
    }
    return best;
  }

  function buildSpots(game) {
    const spots = [];
    for (let y = 0; y < NS.Config.grid.rows; y++) {
      for (let x = 0; x < NS.Config.grid.cols; x++) {
        if (!game.isBuildable(x, y)) continue;
        const d = game.path.distanceTo(x + 0.5, y + 0.5);
        if (d > 3.2) continue;
        spots.push({ x, y, d, s: arcOf(game.path, x + 0.5, y + 0.5) });
      }
    }
    spots.sort((a, b) => (a.s - b.s) || (a.d - b.d));
    return spots;
  }

  /** Very simple commander: alternate between adding towers and upgrading. */
  function think(game, spots, state) {
    let acted = true;
    while (acted) {
      acted = false;
      // upgrade the weakest tier first, keeping a small reserve
      let best = null;
      for (let i = 0; i < game.towers.length; i++) {
        const tw = game.towers[i];
        const next = tw.upgradeDef();
        if (!next || !game.canAfford(next)) continue;
        if (!best || tw.def.tier < best.def.tier) best = tw;
      }
      if (best && (game.towers.length >= Math.min(spots.length, 18) || game.gold > 700)) {
        if (game.upgrade(best).ok) { acted = true; continue; }
      }
      const defId = ORDER.slice(state.n % ORDER.length).concat(ORDER)
        .filter((id) => game.canAfford(NS.TowerData.get(id)))[0];
      if (defId) {
        while (state.spot < spots.length) {
          const s = spots[state.spot];
          if (!game.isBuildable(s.x, s.y)) { state.spot++; continue; }
          if (game.build(defId, s.x, s.y).ok) { state.n++; state.spot++; acted = true; }
          break;
        }
      } else if (best && game.upgrade(best).ok) acted = true;
    }
  }

  function playCampaign(difficulty, seed, hero) {
    const game = new NS.Game({ difficulty, seed, hero: hero || null });
    const spots = buildSpots(game);
    const state = { n: 0, spot: 0 };
    const dt = 1 / 30;
    let guard = 0;
    while (game.status === 'playing' && guard < 30 * 60 * 45) {
      think(game, spots, state);
      game.update(dt);
      guard++;
    }
    game.simSeconds = guard * dt;
    return game;
  }

  test('a competent commander clears all 30 waves on Easy', (t) => {
    const game = playCampaign('easy', 1234);
    t.eq(game.status, 'victory', 'reached wave 30 with ' + game.lives + ' lives');
    t.gt(game.lives, 0);
    t.eq(game.stats.wavesCleared, 30);
    t.gt(game.stats.kills, 200);
  });

  test('the same commander also holds on Normal', (t) => {
    const game = playCampaign('normal', 99);
    t.eq(game.status, 'victory', 'lives left: ' + game.lives);
    t.eq(game.stats.wavesCleared, 30);
  });

  test('Hard is a genuine challenge — it costs lives', (t) => {
    const game = playCampaign('hard', 4242);
    t.gte(game.stats.wavesCleared, 20, 'hard still gets deep into the campaign');
    t.lt(game.lives, game.maxLives * 0.5, 'but the keep really bleeds (' + game.lives + ' left)');
    t.gt(game.stats.leaks, 0);
  });

  test('Insane punishes the same play pattern', (t) => {
    const easy = playCampaign('easy', 77);
    const insane = playCampaign('insane', 77);
    t.gt(easy.stats.wavesCleared, insane.stats.wavesCleared, 'difficulty actually bites');
    t.eq(insane.status, 'defeat', 'the scripted commander cannot brute-force Insane');
  });

  test('doing nothing loses the game', (t) => {
    const game = new NS.Game({ difficulty: 'normal', hero: null, seed: 5 });
    for (let i = 0; i < 30 * 60 * 6 && game.status === 'playing'; i++) game.update(1 / 30);
    t.eq(game.status, 'defeat');
  });

  test('a commander hero contributes real damage', (t) => {
    const withHero = playCampaign('easy', 2024, 'blademaster');
    t.gt(withHero.stats.wavesCleared, 10);
    t.ok(withHero.hero, 'hero survived the campaign loop');
    t.gt(withHero.hero.level, 1, 'levels up with the waves');
  });

  test('the simulation stays cheap enough for 60 FPS with 80 creeps and 40+ towers', (t) => {
    const game = new NS.Game({ difficulty: 'hard', hero: 'paladin', seed: 8 });
    const spots = buildSpots(game);
    const state = { n: 0, spot: 0 };
    for (let i = 0; i < 4; i++) { game.gold = 200000; game.lumber = 200; think(game, spots, state); }
    const towers = game.towers.length;

    // pour 80 very tanky creeps onto the road so nothing dies during the sample
    game.wave = 29;
    for (let i = 0; i < 80; i++) {
      const c = new NS.Creep(game, i % 4 === 0 ? 'gargoyle' : 'fiend', 29);
      c.maxHp = c.hp = 5e7;
      c.dist = (i / 80) * game.path.length * 0.9;
      game.creeps.push(c);
    }
    game.update(1 / 60);
    const creeps = game.creeps.length;
    const started = Date.now();
    const ticks = 600;
    for (let i = 0; i < ticks; i++) game.update(1 / 60);
    const ms = (Date.now() - started) / ticks;
    t.gt(towers, 40, 'stress test really has 40+ towers (' + towers + ')');
    t.gte(creeps, 80, 'and 80 live creeps (' + creeps + ')');
    t.lt(ms, 8, 'average sim tick ' + ms.toFixed(3) + 'ms — inside a 16.6ms frame');
  });
};
