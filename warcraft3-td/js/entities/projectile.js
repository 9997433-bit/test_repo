/* Projectiles: homing bolts, arcing siege shells, instant chain lightning.
 * Impact resolution (splash / chain / effects) lives here. DOM-free. */
(function (root) {
  'use strict';
  const NS = (root.WC3TD = root.WC3TD || {});

  function Projectile(game, o) {
    this.game = game;
    this.tower = o.tower;
    this.def = o.def;
    this.target = o.target || null;
    this.base = o.base;
    this.critMult = o.critMult || 1;
    this.speed = o.speed;
    this.kind = o.kind || 'arrow';
    this.color = o.color || '#fff';
    this.arc = o.arc || 0;
    this.x = o.x; this.y = o.y; this.z = o.z === undefined ? 0.9 : o.z;
    this.sx = this.x; this.sy = this.y; this.sz = this.z;
    this.aim = { x: o.aimX, y: o.aimY, z: o.aimZ || 0 };
    this.travel = 0;
    this.totalTime = Math.max(0.03, Math.hypot(this.aim.x - this.x, this.aim.y - this.y) / this.speed);
    this.dead = false;
    this.angle = Math.atan2(this.aim.y - this.y, this.aim.x - this.x);
    this.homing = !o.arc;
    this.trail = [];
  }

  Projectile.prototype.update = function (dt) {
    if (this.dead) return;
    // homing shots keep re-leading a live target
    if (this.homing && this.target && this.target.alive) {
      const lead = NS.Combat.leadTarget(this, this.target, this.speed);
      this.aim.x = lead.x; this.aim.y = lead.y;
      this.aim.z = this.target.z;
    }
    this.travel += dt;
    const dx = this.aim.x - this.x, dy = this.aim.y - this.y;
    const dist = Math.hypot(dx, dy);
    const step = this.speed * dt;
    if (this.trail.length > 5) this.trail.shift();
    this.trail.push({ x: this.x, y: this.y, z: this.z });
    if (dist <= step || this.travel > 5) {
      this.x = this.aim.x; this.y = this.aim.y; this.z = this.aim.z;
      this.impact();
      return;
    }
    this.angle = Math.atan2(dy, dx);
    this.x += (dx / dist) * step;
    this.y += (dy / dist) * step;
    const k = Math.min(1, this.travel / this.totalTime);
    const flat = this.sz + (this.aim.z - this.sz) * k;
    this.z = flat + (this.arc ? this.arc * 4 * k * (1 - k) : 0);
  };

  Projectile.prototype.impact = function () {
    this.dead = true;
    const game = this.game, def = this.def, tower = this.tower;
    const hits = [];

    if (def.chain && this.target && this.target.alive) {
      const pool = game.creepHash.query(this.target.x, this.target.y, def.chain.range * (def.chain.bounces + 1));
      const seq = NS.Combat.chainSequence(def, this.target, pool);
      for (let i = 0; i < seq.length; i++) hits.push(seq[i]);
      for (let i = 1; i < seq.length; i++) {
        game.fx.lightning(seq[i - 1].creep, seq[i].creep, this.color);
      }
    } else if (def.splash) {
      const pool = game.creepHash.query(this.x, this.y, def.splash.outer);
      for (let i = 0; i < pool.length; i++) {
        const c = pool[i];
        if (!NS.Combat.canHit(def, c)) continue;
        const d = Math.hypot(c.x - this.x, c.y - this.y);
        const f = NS.Combat.splashFactor(Math.max(0, d - c.radius * 0.5), def.splash);
        if (f > 0) hits.push({ creep: c, factor: f });
      }
      if (this.target && this.target.alive && NS.Combat.canHit(def, this.target) &&
          !hits.some((h) => h.creep === this.target)) {
        hits.push({ creep: this.target, factor: 1 });
      }
      game.fx.explosion(this.x, this.y, this.z, def.splash.mid, this.color);
    } else if (this.target && this.target.alive) {
      hits.push({ creep: this.target, factor: 1 });
    }

    for (let i = 0; i < hits.length; i++) {
      const h = hits[i];
      const res = NS.Combat.strike(game, tower, def, h.creep, this.base, {
        multiplier: h.factor * this.critMult,
        crit: this.critMult > 1 && h.factor === 1,
        splash: h.factor < 1
      });
      if (res && def.effects) {
        for (let e = 0; e < def.effects.length; e++) h.creep.applyEffect(def.effects[e], def, game.rng);
      }
    }
    if (!def.splash) game.fx.spark(this.x, this.y, this.z, this.color);
  };

  NS.Projectile = Projectile;
})(typeof globalThis !== 'undefined' ? globalThis : this);
