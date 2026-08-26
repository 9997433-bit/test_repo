/* Effect pool: sparks, explosions, lightning arcs, floating combat text.
 * Stores plain data only — the renderer draws it, so this stays headless-safe. */
(function (root) {
  'use strict';
  const NS = (root.WC3TD = root.WC3TD || {});

  function Fx(game) {
    this.game = game;
    this.particles = [];
    this.texts = [];
    this.bolts = [];
    this.rings = [];
    this.enabled = true;
    this.maxParticles = 900;
  }

  Fx.prototype.clear = function () {
    this.particles.length = 0; this.texts.length = 0;
    this.bolts.length = 0; this.rings.length = 0;
  };

  Fx.prototype._push = function (p) {
    if (!this.enabled) return;
    if (this.particles.length < this.maxParticles) this.particles.push(p);
  };

  Fx.prototype.spark = function (x, y, z, color, n) {
    const count = n || 5;
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = 1 + Math.random() * 2.5;
      this._push({
        x, y, z, vx: Math.cos(a) * s, vy: Math.sin(a) * s, vz: 1.5 + Math.random() * 2,
        life: 0.28 + Math.random() * 0.2, age: 0, color, size: 1.6 + Math.random() * 1.6, grav: 9
      });
    }
  };

  Fx.prototype.explosion = function (x, y, z, radius, color) {
    if (!this.enabled) return;
    this.rings.push({ x, y, z, r0: radius * 0.2, r1: radius, life: 0.35, age: 0, color });
    for (let i = 0; i < 14; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = radius * (0.6 + Math.random() * 1.6);
      this._push({
        x, y, z, vx: Math.cos(a) * s, vy: Math.sin(a) * s, vz: 1 + Math.random() * 3.5,
        life: 0.4 + Math.random() * 0.3, age: 0, color, size: 2 + Math.random() * 3, grav: 8
      });
    }
  };

  Fx.prototype.muzzle = function (x, y, z, angle, color) {
    for (let i = 0; i < 3; i++) {
      const a = angle + (Math.random() - 0.5) * 0.6;
      this._push({
        x, y, z, vx: Math.cos(a) * 2.2, vy: Math.sin(a) * 2.2, vz: 0.6,
        life: 0.14, age: 0, color, size: 1.6, grav: 2
      });
    }
  };

  Fx.prototype.blood = function (x, y, z, color) {
    for (let i = 0; i < 8; i++) {
      const a = Math.random() * Math.PI * 2;
      this._push({
        x, y, z, vx: Math.cos(a) * 1.8, vy: Math.sin(a) * 1.8, vz: 1.5 + Math.random() * 2.2,
        life: 0.5, age: 0, color: color || '#8b1f1f', size: 1.8 + Math.random() * 2, grav: 11
      });
    }
  };

  Fx.prototype.lightning = function (a, b, color) {
    if (!this.enabled) return;
    this.bolts.push({ ax: a.x, ay: a.y, az: a.z, bx: b.x, by: b.y, bz: b.z, life: 0.18, age: 0, color, seed: Math.random() * 1000 });
  };

  Fx.prototype.text = function (x, y, z, str, color, big) {
    if (!this.enabled) return;
    if (this.texts.length > 160) this.texts.shift();
    this.texts.push({
      x, y, z, str, color: color || '#ffe07a', life: NS.Config.ui.floatTextLife, age: 0,
      vx: (Math.random() - 0.5) * 0.6, vz: 2.2, size: big ? 17 : 12
    });
  };

  Fx.prototype.ring = function (x, y, z, r0, r1, color, life) {
    if (!this.enabled) return;
    this.rings.push({ x, y, z, r0, r1, life: life || 0.5, age: 0, color });
  };

  Fx.prototype.update = function (dt) {
    let w = 0;
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      p.age += dt;
      if (p.age >= p.life) continue;
      p.x += p.vx * dt; p.y += p.vy * dt;
      p.vz -= p.grav * dt; p.z += p.vz * dt;
      if (p.z < 0) { p.z = 0; p.vz *= -0.3; p.vx *= 0.6; p.vy *= 0.6; }
      this.particles[w++] = p;
    }
    this.particles.length = w;

    w = 0;
    for (let i = 0; i < this.texts.length; i++) {
      const t = this.texts[i];
      t.age += dt;
      if (t.age >= t.life) continue;
      t.x += t.vx * dt; t.z += t.vz * dt; t.vz -= 3.4 * dt;
      this.texts[w++] = t;
    }
    this.texts.length = w;

    w = 0;
    for (let i = 0; i < this.bolts.length; i++) {
      const b = this.bolts[i]; b.age += dt;
      if (b.age < b.life) this.bolts[w++] = b;
    }
    this.bolts.length = w;

    w = 0;
    for (let i = 0; i < this.rings.length; i++) {
      const r = this.rings[i]; r.age += dt;
      if (r.age < r.life) this.rings[w++] = r;
    }
    this.rings.length = w;
  };

  NS.Fx = Fx;
})(typeof globalThis !== 'undefined' ? globalThis : this);
