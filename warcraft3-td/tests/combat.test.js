/* Targeting, splash, flying rules, status effects and chain lightning. */
module.exports = function (t, WC3) {
  var Config = WC3.Config;
  var DT = Config.DT;

  function newGame(seed) {
    return new WC3.Game({ difficulty: 'normal', seed: seed || 31 });
  }

  /** Put a creep at an exact world position by faking its path distance. */
  function placeCreep(g, entryType, dist) {
    var entry = null;
    g.waves.forEach(function (w) {
      w.entries.forEach(function (e) { if (!entry && e.type === entryType) entry = e; });
    });
    if (!entry) throw new Error('no wave entry for ' + entryType);
    var c = g.spawnCreep(entry);
    c.dist = dist;
    var p = (c.flying ? g.airPath : g.path).pointAt(dist);
    c.x = p.x;
    c.y = p.y;
    return c;
  }

  /** Find a legal build tile close to the given world point. */
  function spotNear(g, x, y) {
    var best = null;
    var bestD = Infinity;
    for (var ty = 0; ty < g.gridH; ty++) {
      for (var tx = 0; tx < g.gridW; tx++) {
        if (!g.canBuildAt(tx, ty)) continue;
        var d = Math.hypot((tx + 0.5) * g.tile - x, (ty + 0.5) * g.tile - y);
        if (d < bestD) { bestD = d; best = [tx, ty]; }
      }
    }
    return best;
  }

  t.test('a tower only acquires targets inside its range', function () {
    var g = newGame();
    g.gold = 5000;
    var mid = g.path.length * 0.5;
    var p = g.path.pointAt(mid);
    var s = spotNear(g, p.x, p.y);
    var tw = g.build('human_guard_t1', s[0], s[1]);

    var far = placeCreep(g, 'skeleton', 0);
    g.hash.rebuild(g.creeps);
    t.eq(tw.acquire(g), null, 'nothing in range yet');

    var near = placeCreep(g, 'skeleton', mid);
    g.hash.rebuild(g.creeps);
    t.eq(tw.acquire(g), near, 'nearby creep acquired');
    t.eq(tw.inRange(far), false, 'distant creep out of range');
  });

  t.test('targeting modes pick the right creep', function () {
    var g = newGame();
    g.gold = 5000;
    var mid = g.path.length * 0.5;
    var p = g.path.pointAt(mid);
    var s = spotNear(g, p.x, p.y);
    var tw = g.build('human_guard_t1', s[0], s[1]);
    var range = tw.def.range;

    var behind = placeCreep(g, 'skeleton', mid - range * 0.5);
    var ahead = placeCreep(g, 'skeleton', mid + range * 0.4);
    ahead.hp = 5;
    behind.hp = 500;
    g.hash.rebuild(g.creeps);

    tw.mode = 'first';
    t.eq(tw.acquire(g), ahead, 'first = furthest along the path');
    tw.mode = 'last';
    t.eq(tw.acquire(g), behind, 'last = least progress');
    tw.mode = 'strong';
    t.eq(tw.acquire(g), behind, 'strongest by hp');
    tw.mode = 'weak';
    t.eq(tw.acquire(g), ahead, 'weakest by hp');
    tw.cycleMode(1);
    t.eq(tw.mode, 'close', 'mode cycles');
    tw.cycleMode(1);
    t.eq(tw.mode, 'first', 'mode wraps');
  });

  t.test('ground-only towers cannot see flyers, air-capable ones can', function () {
    var g = newGame();
    g.gold = 9000;
    var wy = placeCreep(g, 'wyvern', g.airPath.length * 0.5);
    var s = spotNear(g, wy.x, wy.y);
    var cannon = g.build('human_cannon_t1', s[0], s[1]);
    var s2 = spotNear(g, wy.x + 40, wy.y + 40);
    var guard = g.build('human_guard_t1', s2[0], s2[1]);
    g.hash.rebuild(g.creeps);

    t.eq(cannon.def.targetsAir, false, 'siege cannot hit air');
    t.eq(cannon.canTarget(wy), false, 'cannon ignores the wyvern');
    t.eq(guard.def.targetsAir, true, 'pierce can hit air');
    t.eq(guard.canTarget(wy), true, 'guard tower sees the wyvern');
  });

  t.test('splash damage falls off with distance and skips flyers for siege', function () {
    var g = newGame();
    var centre = g.path.pointAt(g.path.length * 0.5);
    // Positions are set explicitly so each creep sits in a different band.
    var a = placeCreep(g, 'skeleton', g.path.length * 0.5);
    var b = placeCreep(g, 'skeleton', g.path.length * 0.5);
    var c = placeCreep(g, 'skeleton', g.path.length * 0.5);
    var flyer = placeCreep(g, 'wyvern', 10);
    [a, b, c, flyer].forEach(function (x) { x.hpMax = x.hp = 100000; });
    a.x = centre.x; a.y = centre.y;
    b.x = centre.x + 70; b.y = centre.y;
    c.x = centre.x + 105; c.y = centre.y;
    flyer.x = centre.x; flyer.y = centre.y;
    g.hash.rebuild(g.creeps);

    var payload = {
      towerId: 0, damage: 1000, attackType: 'siege',
      splash: { radius: 120, near: 1.0, mid: 0.5, far: 0.25 },
      effect: null, bonus: null, color: '#fff'
    };
    g.resolveHit(payload, centre.x, centre.y, a);

    var lostA = a.hpMax - a.hp;
    var lostB = b.hpMax - b.hp;
    var lostC = c.hpMax - c.hp;
    t.gt(lostA, 0, 'centre creep takes full damage');
    t.gt(lostB, 0, 'mid band splashed');
    t.gt(lostC, 0, 'far band splashed');
    t.gt(lostA, lostB, 'falloff into the mid band');
    t.gt(lostB, lostC, 'falloff into the far band');
    t.eq(flyer.hp, flyer.hpMax, 'siege splash never touches flyers');
  });

  t.test('slow, poison and root apply, and spell immunity blocks them', function () {
    var g = newGame();
    var c = placeCreep(g, 'skeleton', 100);
    var base = c.baseSpeed;
    t.eq(c.applySlow(0.5, 2), true, 'slow applied');
    t.close(c.currentSpeed(), base * 0.5, 1e-9, 'movement halved');
    c.applySlow(0.8, 2);
    t.close(c.currentSpeed(), base * 0.5, 1e-9, 'weaker slow does not override');

    c.applyRoot(1);
    t.eq(c.currentSpeed(), 0, 'rooted creeps stop');
    for (var i = 0; i < 130; i++) g.tick(DT);
    t.eq(c.rootTimer, 0, 'root expires');

    var ancient = placeCreep(g, 'ancient', 100);
    t.eq(ancient.spellImmune, true, 'ancient is spell immune');
    t.eq(ancient.applySlow(0.4, 3), false, 'slow rejected');
    t.eq(ancient.applyPoison(50, 3), false, 'poison rejected');
    t.eq(ancient.applyRoot(3), false, 'root rejected');
    t.eq(ancient.currentSpeed(), ancient.baseSpeed, 'full speed retained');
  });

  t.test('poison keeps ticking after the shooter stops and can finish a kill', function () {
    var g = newGame();
    var c = placeCreep(g, 'skeleton', 100);
    c.hpMax = c.hp = 40;
    c.applyPoison(30, 3);
    var kills0 = g.stats.kills;
    for (var i = 0; i < 180 && c.alive; i++) g.tick(DT);
    t.eq(c.alive, false, 'poison killed the creep');
    t.eq(g.stats.kills, kills0 + 1, 'kill credited');
  });

  t.test('chain lightning bounces with damage falloff and never repeats a target', function () {
    var g = newGame();
    g.gold = 9000;
    var d0 = g.path.length * 0.5;
    var a = placeCreep(g, 'skeleton', d0);
    var b = placeCreep(g, 'skeleton', d0 + 55);
    var c = placeCreep(g, 'skeleton', d0 + 110);
    [a, b, c].forEach(function (x) { x.hpMax = x.hp = 100000; });
    var s = spotNear(g, a.x, a.y);
    var tw = g.build('orc_spirit_t1', s[0], s[1]);
    g.hash.rebuild(g.creeps);

    var payload = {
      towerId: tw.id, damage: 1000, attackType: 'magic',
      splash: null, effect: tw.def.effect, bonus: null, color: '#fff'
    };
    g.resolveChain(tw, a, payload, tw.def.effect);

    var la = a.hpMax - a.hp;
    var lb = b.hpMax - b.hp;
    var lc = c.hpMax - c.hp;
    t.gt(la, 0, 'primary hit');
    t.gt(lb, 0, 'first bounce hit');
    t.gt(lc, 0, 'second bounce hit');
    t.gt(la, lb, 'falloff after one jump');
    t.gt(lb, lc, 'falloff after two jumps');
  });

  t.test('the meat-wagon line gets its bonus versus heavy and fortified', function () {
    var g = newGame();
    var def = WC3.TowerData.get('ud_slaughter_t1');
    t.ok(def.bonus, 'bonus table present');
    var heavy = placeCreep(g, 'grunt', 200);
    heavy.hpMax = heavy.hp = 1e6;
    var payload = {
      towerId: 0, damage: 1000, attackType: 'siege',
      splash: null, effect: null, bonus: def.bonus, color: '#fff'
    };
    g.damageCreep(heavy, 1000, payload, true);
    var withBonus = heavy.hpMax - heavy.hp;

    var heavy2 = placeCreep(g, 'grunt', 200);
    heavy2.hpMax = heavy2.hp = 1e6;
    payload.bonus = null;
    g.damageCreep(heavy2, 1000, payload, true);
    var without = heavy2.hpMax - heavy2.hp;
    t.close(withBonus / without, def.bonus.heavy, 1e-6, 'bonus multiplier applied');
  });

  t.test('projectiles always resolve, even if the target dies mid-flight', function () {
    var g = newGame();
    g.gold = 9000;
    var d0 = g.path.length * 0.4;
    var victim = placeCreep(g, 'skeleton', d0);
    victim.hpMax = victim.hp = 1e6;
    var s = spotNear(g, victim.x, victim.y);
    var tw = g.build('human_cannon_t1', s[0], s[1]);
    g.hash.rebuild(g.creeps);
    tw.cooldownTimer = 0;
    tw.update(DT, g);
    t.eq(g.projectiles.length, 1, 'shot fired');

    g.killCreep(victim, tw);
    var guard = 0;
    while (g.projectiles.length > 0 && guard++ < 1200) g.tick(DT);
    t.lt(guard, 1200, 'projectile terminated');
    t.eq(g.projectiles.length, 0, 'no orphaned projectiles');
  });

  t.test('towers keep firing at their stated cadence', function () {
    var g = newGame();
    g.gold = 9000;
    var d0 = g.path.length * 0.5;
    var dummy = placeCreep(g, 'skeleton', d0);
    dummy.hpMax = dummy.hp = 1e9;
    dummy.baseSpeed = 0;
    var s = spotNear(g, dummy.x, dummy.y);
    var tw = g.build('human_guard_t1', s[0], s[1]);
    var seconds = 10;
    for (var i = 0; i < 60 * seconds; i++) g.tick(DT);
    var expected = seconds / tw.def.cooldown;
    t.close(tw.shots, expected, 2, 'shots fired in ' + seconds + 's');
    t.gt(tw.damageDealt, 0, 'damage recorded on the tower');
  });

  t.test('the hero nova damages and roots everything around it', function () {
    var g = new WC3.Game({ difficulty: 'normal', seed: 4, hero: 'paladin' });
    var near = placeCreep(g, 'skeleton', 100);
    near.hpMax = near.hp = 1e6;
    near.x = g.hero.x + 20;
    near.y = g.hero.y + 20;
    g.hash.rebuild(g.creeps);
    g.hero.mana = 100;
    t.eq(g.hero.castQ(g), true, 'nova cast');
    t.lt(near.hp, near.hpMax, 'creep damaged');
    t.gt(near.rootTimer, 0, 'creep rooted');
    t.eq(g.hero.castQ(g), false, 'ability on cooldown');
  });
};
