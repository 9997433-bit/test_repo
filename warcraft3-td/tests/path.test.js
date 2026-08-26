/* Road geometry, leaking and build validity. */
module.exports = function (test, NS) {
  test('polyline length is the sum of its segments', (t) => {
    const p = new NS.Path([{ x: 0, y: 0 }, { x: 3, y: 0 }, { x: 3, y: 4 }]);
    t.near(p.length, 7, 1e-9);
    t.eq(p.segments.length, 2);
  });

  test('positionAt walks the road and clamps at both ends', (t) => {
    const p = new NS.Path([{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 10 }]);
    t.near(p.positionAt(0).x, 0, 1e-9);
    t.near(p.positionAt(5).x, 5, 1e-9);
    t.near(p.positionAt(10).x, 10, 1e-9);
    t.near(p.positionAt(15).y, 5, 1e-9);
    t.near(p.positionAt(-4).x, 0, 1e-9);
    t.near(p.positionAt(999).y, 10, 1e-9);
  });

  test('directionAt returns unit headings', (t) => {
    const p = new NS.Path([{ x: 0, y: 0 }, { x: 0, y: 6 }, { x: 6, y: 6 }]);
    const d1 = p.directionAt(3);
    t.near(Math.hypot(d1.x, d1.y), 1, 1e-9);
    t.near(d1.y, 1, 1e-9);
    const d2 = p.directionAt(9);
    t.near(d2.x, 1, 1e-9);
  });

  test('distanceTo measures perpendicular distance to the road', (t) => {
    const p = new NS.Path([{ x: 0, y: 0 }, { x: 10, y: 0 }]);
    t.near(p.distanceTo(5, 3), 3, 1e-9);
    t.near(p.distanceTo(-4, 0), 4, 1e-9);
    t.near(p.distanceTo(5, 0), 0, 1e-9);
  });

  test('the campaign road is continuous and inside the map', (t) => {
    const game = new NS.Game({ hero: null });
    const g = NS.Config.grid;
    t.gt(game.path.length, 40, 'a long winding road');
    for (let d = 0; d <= game.path.length; d += 0.5) {
      const pt = game.path.positionAt(d);
      t.ok(pt.x >= -1 && pt.x <= g.cols + 1 && pt.y >= -1 && pt.y <= g.rows + 1, 'in bounds at ' + d);
    }
  });

  test('road tiles are never buildable, open grass is', (t) => {
    const game = new NS.Game({ hero: null });
    let onRoad = 0, free = 0;
    for (let y = 0; y < NS.Config.grid.rows; y++) {
      for (let x = 0; x < NS.Config.grid.cols; x++) {
        const d = game.path.distanceTo(x + 0.5, y + 0.5);
        if (d <= NS.Config.pathWidth) { t.notOk(game.isBuildable(x, y), 'road tile ' + x + ',' + y); onRoad++; }
        else if (game.isBuildable(x, y)) free++;
      }
    }
    t.gt(onRoad, 40, 'the road covers real estate');
    t.gt(free, 200, 'plenty of build space remains');
  });

  test('a tower occupies its tile until sold', (t) => {
    const game = new NS.Game({ hero: null });
    game.gold = 5000;
    let spot = null;
    for (let y = 1; y < NS.Config.grid.rows && !spot; y++) {
      for (let x = 1; x < NS.Config.grid.cols && !spot; x++) if (game.isBuildable(x, y)) spot = { x, y };
    }
    const r = game.build('h_arrow_t1', spot.x, spot.y);
    t.ok(r.ok);
    t.notOk(game.isBuildable(spot.x, spot.y), 'tile now occupied');
    t.eq(game.build('h_arrow_t1', spot.x, spot.y).reason, 'blocked');
    game.sell(r.tower);
    t.ok(game.isBuildable(spot.x, spot.y), 'freed after selling');
  });

  test('a creep that walks the whole road leaks and costs a life', (t) => {
    const game = new NS.Game({ difficulty: 'normal', hero: null });
    const c = new NS.Creep(game, 'footman', 1);
    game.creeps.push(c);
    const lives = game.lives;
    c.dist = game.path.length - 0.01;
    c.update(1);
    t.notOk(c.alive);
    t.ok(c.leaked);
    t.eq(game.lives, lives - 1);
    t.eq(game.stats.leaks, 1);
  });

  test('a boss leak hurts far more than a trash leak', (t) => {
    const game = new NS.Game({ difficulty: 'normal', hero: null });
    const boss = new NS.Creep(game, 'boss_abyss', 30);
    game.creeps.push(boss);
    const lives = game.lives;
    boss.dist = game.path.length;
    boss.update(0.1);
    t.eq(game.lives, lives - 4);
  });

  test('running out of lives ends the run', (t) => {
    const game = new NS.Game({ difficulty: 'insane', hero: null });
    for (let i = 0; i < 20 && game.status === 'playing'; i++) {
      const c = new NS.Creep(game, 'footman', 1);
      c.dist = game.path.length;
      c.update(0.1);
    }
    t.eq(game.lives, 0);
    t.eq(game.status, 'defeat');
  });
};
