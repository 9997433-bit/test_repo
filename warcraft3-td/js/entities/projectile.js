/*
 * Homing projectile. Tracks a live target while it exists, otherwise flies to
 * the last known impact point so splash weapons still detonate. Never leaks:
 * a hard TTL guarantees every projectile dies even if its target vanishes.
 */
(function (global) {
  'use strict';

  var MAX_TTL = 6;

  function Projectile() {
    this.alive = false;
    this.id = 0;
    this.x = 0; this.y = 0; this.z = 0;
    this.sx = 0; this.sy = 0; this.sz = 0;
    this.tx = 0; this.ty = 0; this.tz = 0;
    this.speed = 500;
    this.arc = 0;
    this.travelled = 0;
    this.total = 1;
    this.ttl = MAX_TTL;
    this.target = null;
    this.targetId = 0;
    this.kind = 'arrow';
    this.color = '#ffe9a8';
    this.payload = null;
    this.angle = 0;
  }

  Projectile.prototype.init = function (id, from, target, aim, payload, proj) {
    this.id = id;
    this.x = this.sx = this.px = from.x;
    this.y = this.sy = this.py = from.y;
    this.z = this.sz = this.pz = from.z || 30;
    this.target = target;
    this.targetId = target ? target.id : 0;
    this.tx = aim.x;
    this.ty = aim.y;
    this.tz = aim.z || 0;
    this.speed = (proj && proj.speed) || 520;
    this.arc = (proj && proj.arc) || 0;
    this.kind = (proj && proj.kind) || 'arrow';
    this.color = payload.color || '#ffe9a8';
    this.payload = payload;
    this.travelled = 0;
    this.ttl = MAX_TTL;
    var dx = this.tx - this.x;
    var dy = this.ty - this.y;
    this.total = Math.max(1, Math.sqrt(dx * dx + dy * dy));
    this.angle = Math.atan2(dy, dx);
    return this;
  };

  Projectile.prototype.update = function (dt, game) {
    this.px = this.x;
    this.py = this.y;
    this.pz = this.z;
    this.ttl -= dt;
    if (this.ttl <= 0) { game.despawnProjectile(this, false); return; }

    var t = this.target;
    if (t && t.alive && t.id === this.targetId) {
      this.tx = t.x;
      this.ty = t.y;
      this.tz = t.z;
    } else {
      this.target = null;
    }

    var dx = this.tx - this.x;
    var dy = this.ty - this.y;
    var d = Math.sqrt(dx * dx + dy * dy);
    var step = this.speed * dt;

    if (d <= step || d < 1e-4) {
      this.x = this.tx;
      this.y = this.ty;
      this.z = this.tz;
      game.despawnProjectile(this, true);
      return;
    }
    this.x += (dx / d) * step;
    this.y += (dy / d) * step;
    this.angle = Math.atan2(dy, dx);
    this.travelled += step;

    var p = Math.max(0, Math.min(1, this.travelled / this.total));
    var base = this.sz + (this.tz - this.sz) * p;
    this.z = base + (this.arc ? Math.sin(Math.PI * p) * this.arc : 0);
  };

  global.WC3.Projectile = Projectile;

  if (typeof module === 'object' && module.exports) module.exports = Projectile;
})(typeof globalThis !== 'undefined' ? globalThis : this);
