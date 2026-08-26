/*
 * Pooled visual effects: floating combat text, impact sparks, dust puffs,
 * expanding shockwave rings, lightning arcs and fading corpses.
 * FX live in the sim (so they stay deterministic) but never affect gameplay.
 */
(function (global) {
  'use strict';

  function Fx() {
    this.alive = false;
    this.kind = 'spark';
    this.x = 0; this.y = 0; this.z = 0;
    this.vx = 0; this.vy = 0; this.vz = 0;
    this.life = 1; this.ttl = 1;
    this.size = 8;
    this.color = '#ffffff';
    this.text = '';
    this.ax = 0; this.ay = 0; this.bx = 0; this.by = 0;
    this.seed = 0;
    this.angle = 0;
  }

  Fx.prototype.init = function (kind, opts) {
    this.kind = kind;
    this.x = opts.x || 0;
    this.y = opts.y || 0;
    this.z = opts.z || 0;
    this.vx = opts.vx || 0;
    this.vy = opts.vy || 0;
    this.vz = opts.vz || 0;
    this.life = this.ttl = opts.ttl || 0.6;
    this.size = opts.size || 8;
    this.color = opts.color || '#ffffff';
    this.text = opts.text || '';
    this.ax = opts.ax || 0;
    this.ay = opts.ay || 0;
    this.bx = opts.bx || 0;
    this.by = opts.by || 0;
    this.seed = opts.seed || 0;
    this.angle = opts.angle || 0;
    return this;
  };

  Fx.prototype.update = function (dt) {
    this.life -= dt;
    if (this.life <= 0) {
      this.alive = false;
      return;
    }
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.z += this.vz * dt;
    if (this.kind === 'spark' || this.kind === 'gib') {
      this.vz -= 320 * dt;
      if (this.z < 0) { this.z = 0; this.vz = 0; this.vx *= 0.4; this.vy *= 0.4; }
    }
  };

  Fx.prototype.progress = function () {
    return 1 - (this.life / this.ttl);
  };

  global.WC3.Fx = Fx;

  if (typeof module === 'object' && module.exports) module.exports = Fx;
})(typeof globalThis !== 'undefined' ? globalThis : this);
