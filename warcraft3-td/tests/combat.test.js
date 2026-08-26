/* Combat kernel: target selection, leading, splash, chain, crit, effects. */
module.exports = function (test, NS) {
  const C = NS.Combat;

  function mkGame() {
    return new NS.Game({ difficulty: 'normal', hero: null, seed: 7 });
  }
  function place(game, typeId, x, y, wave) {
    const c = new NS.Creep(game, typeId, wave || 1);
    c.x = x; c.y = y; c.z = c.flying ? NS.Config.flyHeight : 0;
    game.creeps.push(c);
    return c;
  }
  function sync(game) {
    game.creepHash.rebuild(game.creeps.filter((c) => c.alive));
  }

  // ------------------------------------------------------------------ splash
  test('splash falloff uses the 100 / 50 / 25 percent rings', (t) => {
    const splash = { full: 1, mid: 2, outer: 3 };
    t.eq(C.splashFactor(0, splash), 1);
    t.eq(C.splashFactor(1, splash), 1);
    t.eq(C.splashFactor(1.5, splash), 0.5);
    t.eq(C.splashFactor(2, splash), 0.5);
    t.eq(C.splashFactor(2.5, splash), 0.25);
    t.eq(C.splashFactor(3.01, splash), 0);
    t.eq(C.splashFactor(0, null), 1);
    t.eq(C.splashFactor(0.5, null), 0);
  });

  test('a siege shell damages the whole cluster with distance falloff', (t) => {
    const game = mkGame();
    const def = NS.TowerData.get('h_cannon_t3');
    const centre = place(game, 'footman', 10, 10, 8);
    const mid = place(game, 'footman', 10 + def.splash.full + 0.4, 10, 8);
    const far = place(game, 'footman', 10 + def.splash.mid + 0.4, 10, 8);
    const outside = place(game, 'footman', 10 + def.splash.outer + 2, 10, 8);
    [centre, mid, far, outside].forEach((c) => { c.radius = 0; });
    sync(game);

    const proj = new NS.Projectile(game, {
      tower: null, def, target: centre, base: 100, speed: 10,
      x: 10, y: 10, z: 0, aimX: 10, aimY: 10, aimZ: 0
    });
    proj.impact();

    const dmg = (c) => c.maxHp - c.hp;
    t.gt(dmg(centre), 0, 'centre hit');
    t.near(dmg(mid) / dmg(centre), 0.5, 1e-6, 'mid ring is 50%');
    t.near(dmg(far) / dmg(centre), 0.25, 1e-6, 'outer ring is 25%');
    t.eq(dmg(outside), 0, 'outside the blast takes nothing');
  });

  test('splash only touches targets the tower is allowed to hit', (t) => {
    const game = mkGame();
    const def = NS.TowerData.get('e_chimaera_t2'); // siege, ground only
    const ground = place(game, 'footman', 5, 5, 6);
    const flyer = place(game, 'wyvern', 5.2, 5, 6);
    ground.radius = 0; flyer.radius = 0;
    sync(game);
    const proj = new NS.Projectile(game, {
      tower: null, def, target: ground, base: 80, speed: 10,
      x: 5, y: 5, z: 0, aimX: 5, aimY: 5, aimZ: 0
    });
    proj.impact();
    t.gt(ground.maxHp - ground.hp, 0, 'ground creep takes splash');
    t.eq(flyer.maxHp - flyer.hp, 0, 'airborne creep is untouched by siege splash');
  });

  // ------------------------------------------------------------------- chain
  test('chain lightning bounces to the nearest new target with decay', (t) => {
    const game = mkGame();
    const def = NS.TowerData.get('o_spirit_t3'); // 5 bounces, decay .85
    const a = place(game, 'footman', 0, 0, 5);
    const b = place(game, 'footman', 1, 0, 5);
    const c = place(game, 'footman', 2, 0, 5);
    const far = place(game, 'footman', 40, 40, 5);
    sync(game);
    const seq = C.chainSequence(def, a, [a, b, c, far]);
    t.eq(seq.length, 3, 'primary + 2 reachable bounces');
    t.eq(seq[0].creep, a);
    t.eq(seq[1].creep, b);
    t.eq(seq[2].creep, c);
    t.near(seq[1].factor, 0.85, 1e-9);
    t.near(seq[2].factor, 0.85 * 0.85, 1e-9);
  });

  test('chain never hits the same creep twice and respects the bounce cap', (t) => {
    const game = mkGame();
    const def = NS.TowerData.get('o_spirit_t1'); // 2 bounces
    const list = [];
    for (let i = 0; i < 8; i++) list.push(place(game, 'ghoul', i * 0.8, 0, 4));
    sync(game);
    const seq = C.chainSequence(def, list[0], list);
    t.eq(seq.length, 3, 'primary + 2 bounces max');
    const ids = seq.map((s) => s.creep.id);
    t.eq(new Set(ids).size, ids.length, 'no duplicates');
  });

  test('chain skips targets the attack type cannot reach', (t) => {
    const game = mkGame();
    const def = Object.assign({}, NS.TowerData.get('o_spirit_t2'), { attackType: 'normal' });
    const a = place(game, 'footman', 0, 0, 5);
    const flyer = place(game, 'wyvern', 1, 0, 5);
    const c = place(game, 'footman', 2, 0, 5);
    sync(game);
    const seq = C.chainSequence(def, a, [a, flyer, c]);
    t.eq(seq.length, 2);
    t.eq(seq[1].creep, c, 'bounced past the flyer');
  });

  // ---------------------------------------------------------------- leading
  test('intercept solver leads a moving target exactly', (t) => {
    // target 10 right of shooter running away at 2, projectile speed 6 -> t = 2.5
    const tt = C.interceptTime(0, 0, 10, 0, 2, 0, 6);
    t.near(tt, 2.5, 1e-9);
    // head-on: closing speed 8 -> t = 1.25
    t.near(C.interceptTime(0, 0, 10, 0, -2, 0, 6), 1.25, 1e-9);
    // stationary target: pure distance / speed
    t.near(C.interceptTime(0, 0, 9, 0, 0, 0, 3), 3, 1e-9);
  });

  test('unreachable targets fall back to a direct shot', (t) => {
    t.eq(C.interceptTime(0, 0, 10, 0, 20, 0, 5), null, 'faster than the projectile');
    const lead = C.leadTarget({ x: 0, y: 0 }, { x: 10, y: 0, vx: 40, vy: 0 }, 5);
    t.eq(lead.x, 10, 'aims at the current position');
    t.eq(lead.t, 0);
  });

  test('lead point is where the creep will actually be', (t) => {
    const shooter = { x: 0, y: 0 };
    const creep = { x: 6, y: 0, vx: 0, vy: 3 };
    const lead = C.leadTarget(shooter, creep, 12);
    const flight = Math.hypot(lead.x - shooter.x, lead.y - shooter.y) / 12;
    t.near(lead.y, creep.y + creep.vy * flight, 1e-6);
    t.gt(lead.y, 0, 'aimed ahead of the target');
  });

  // -------------------------------------------------------- target priority
  test('targeting modes order candidates the way the command card promises', (t) => {
    const game = mkGame();
    const def = NS.TowerData.get('h_arrow_t1');
    const tower = { x: 10, y: 10 };
    const near = place(game, 'footman', 10.5, 10, 5); near.dist = 5; near.hp = 500;
    const far = place(game, 'footman', 12, 10, 5); far.dist = 30; far.hp = 100;
    const mid = place(game, 'footman', 11, 10, 5); mid.dist = 18; mid.hp = 900;
    const pool = [near, far, mid];
    const pick = (mode) => C.selectTargets(tower, def, pool, 1, mode)[0];
    t.eq(pick('first'), far, 'first = furthest along the road');
    t.eq(pick('last'), near, 'last = least progress');
    t.eq(pick('strongest'), mid);
    t.eq(pick('weakest'), far);
    t.eq(pick('closest'), near);
  });

  test('targets outside the range circle are never selected', (t) => {
    const game = mkGame();
    const def = NS.TowerData.get('h_arrow_t1');
    const tower = { x: 0, y: 0 };
    const inside = place(game, 'footman', def.range - 0.5, 0, 3);
    const outside = place(game, 'footman', def.range + 0.5, 0, 3);
    const got = C.selectTargets(tower, def, [inside, outside], 4, 'closest');
    t.eq(got.length, 1);
    t.eq(got[0], inside);
  });

  test('multishot towers engage several creeps per volley', (t) => {
    const game = mkGame();
    const def = NS.TowerData.get('e_moon_t3');
    t.eq(def.multishot, 3);
    const tower = { x: 0, y: 0 };
    const pool = [];
    for (let i = 0; i < 5; i++) pool.push(place(game, 'ghoul', 1 + i * 0.5, 0, 4));
    t.eq(C.selectTargets(tower, def, pool, def.multishot, 'first').length, 3);
  });

  // ------------------------------------------------------------------ hits
  test('strike routes through the damage table and reports the multiplier', (t) => {
    const game = mkGame();
    const def = NS.TowerData.get('h_arrow_t1'); // pierce
    const light = place(game, 'huntress', 0, 0, 1);   // light armour
    light.armorValue = 0;
    const res = C.strike(game, null, def, light, 100);
    t.eq(res.typeFactor, 2.0, 'pierce vs light');
    t.near(res.amount, 200, 1e-9);
  });

  test('bonus damage versus heavy/fortified is applied before the type factor', (t) => {
    const game = mkGame();
    const def = NS.TowerData.get('u_meat_t3'); // +55 heavy, +75 fortified, siege
    const heavy = place(game, 'grunt', 0, 0, 1); heavy.armorValue = 0;
    const res = C.strike(game, null, def, heavy, 100);
    t.eq(res.bonus, 55);
    t.near(res.amount, 155 * NS.DamageTable.factor('siege', 'heavy'), 1e-9);
  });

  test('critical strikes multiply the final number', (t) => {
    const game = mkGame();
    const def = NS.TowerData.get('h_arrow_t3');
    t.ok(def.crit, 'longbow crits');
    const c1 = place(game, 'footman', 0, 0, 1); c1.armorValue = 0;
    const c2 = place(game, 'footman', 0, 0, 1); c2.armorValue = 0;
    const plain = C.strike(game, null, def, c1, 100).amount;
    const crit = C.strike(game, null, def, c2, 100, { multiplier: def.crit.mult }).amount;
    t.near(crit / plain, def.crit.mult, 1e-9);
  });

  // ---------------------------------------------------------------- effects
  test('poison keeps ticking after the projectile lands', (t) => {
    const game = mkGame();
    const def = NS.TowerData.get('o_troll_t3');
    const c = place(game, 'footman', 0, 0, 10);
    c.applyEffect(def.effects[0], def, game.rng);
    const before = c.hp;
    game.time += 1; c.update(1);
    t.near(before - c.hp, def.effects[0].dps * 1, 1e-6);
  });

  test('the strongest poison from one line wins instead of stacking', (t) => {
    const game = mkGame();
    const weak = NS.TowerData.get('o_troll_t1');
    const strong = NS.TowerData.get('o_troll_t3');
    const c = place(game, 'footman', 0, 0, 12);
    c.applyEffect(weak.effects[0], weak, game.rng);
    c.applyEffect(strong.effects[0], strong, game.rng);
    t.eq(c.poisons.size, 1);
    const hpBefore = c.hp;
    c.update(1);
    t.near(hpBefore - c.hp, strong.effects[0].dps, 1e-6);
  });

  test('slow reduces movement speed and the strongest slow wins', (t) => {
    const game = mkGame();
    const c = place(game, 'footman', 0, 0, 3);
    const base = c.currentSpeed();
    c.applyEffect({ type: 'slow', amount: 0.25, duration: 2 }, null, null);
    t.near(c.currentSpeed(), base * 0.75, 1e-9);
    c.applyEffect({ type: 'slow', amount: 0.5, duration: 2 }, null, null);
    t.near(c.currentSpeed(), base * 0.5, 1e-9);
    c.applyEffect({ type: 'slow', amount: 0.1, duration: 2 }, null, null);
    t.near(c.currentSpeed(), base * 0.5, 1e-9, 'weaker slow does not overwrite');
  });

  test('root stops a ground creep dead, and expires', (t) => {
    const game = mkGame();
    const c = place(game, 'footman', 0, 0, 3);
    c.applyEffect({ type: 'root', chance: 1, duration: 1 }, null, game.rng);
    t.eq(c.currentSpeed(), 0);
    game.time += 1.01;
    t.gt(c.currentSpeed(), 0);
  });

  test('spell immune creeps ignore slow, poison and root but still take damage', (t) => {
    const game = mkGame();
    const c = place(game, 'treant', 0, 0, 12);
    t.ok(c.spellImmune);
    t.notOk(c.applyEffect({ type: 'slow', amount: 0.5, duration: 3 }, null, null));
    t.notOk(c.applyEffect({ type: 'poison', dps: 50, duration: 3 }, null, null));
    t.notOk(c.applyEffect({ type: 'root', chance: 1, duration: 3 }, null, game.rng));
    t.eq(c.poisons.size, 0);
    const def = NS.TowerData.get('h_arcane_t2'); // magic
    const res = C.strike(game, null, def, c, 100);
    t.gt(res.amount, 0, 'magic damage still lands');
  });

  test('bosses resist crowd control with shortened durations', (t) => {
    const game = mkGame();
    const boss = place(game, 'boss_warlord', 0, 0, 5);
    boss.applyEffect({ type: 'root', chance: 1, duration: 2 }, null, game.rng);
    t.near(boss.rootUntil - game.time, 0.8, 1e-6);
  });
};
