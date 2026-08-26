/*
 * Creep entity. Ground creeps ride the road polyline; flying creeps ride the
 * air bypass polyline. Position is always derived from a scalar path distance,
 * which makes "first / last" targeting and leak detection exact.
 */
(function (global) {
  'use strict';

  var SAMPLE = { x: 0, y: 0, angle: 0, seg: 0 };

  function Creep() {
    this.alive = false;
    this.id = 0;
    this.type = '';
    this.def = null;
    this.x = 0; this.y = 0; this.z = 0;
    this.angle = 0;
    this.dist = 0;
    this.baseSpeed = 0;
    this.hp = 1; this.hpMax = 1;
    this.armorType = 'unarmored';
    this.armorValue = 0;
    this.bounty = 0;
    this.flying = false;
    this.spellImmune = false;
    this.boss = false;
    this.radius = 14;
    this.wave = 0;
    this.slowFactor = 1; this.slowTimer = 0;
    this.poisonDps = 0; this.poisonTimer = 0;
    this.rootTimer = 0;
    this.anim = 0;
    this.hurtFlash = 0;
    this.pathLength = 1;
  }

  Creep.prototype.init = function (id, entry, wave, hpScale, speedScale, path) {
    var def = entry.def;
    this.id = id;
    this.type = entry.type;
    this.def = def;
    this.wave = wave;
    this.hpMax = Math.max(1, Math.round(entry.hp * hpScale));
    this.hp = this.hpMax;
    this.baseSpeed = entry.speed * speedScale;
    this.bounty = entry.bounty;
    this.armorType = def.armor;
    this.armorValue = def.armorValue;
    this.flying = !!def.flying;
    this.spellImmune = !!def.spellImmune;
    this.boss = !!def.boss;
    this.radius = def.radius;
    this.dist = 0;
    this.slowFactor = 1; this.slowTimer = 0;
    this.poisonDps = 0; this.poisonTimer = 0;
    this.rootTimer = 0;
    this.anim = 0;
    this.hurtFlash = 0;
    this.z = this.flying ? 54 : 0;
    this.pathLength = path.length;
    path.sample(0, SAMPLE);
    this.x = this.px = SAMPLE.x;
    this.y = this.py = SAMPLE.y;
    this.pz = this.z;
    this.angle = SAMPLE.angle;
    return this;
  };

  Creep.prototype.currentSpeed = function () {
    if (this.rootTimer > 0) return 0;
    return this.baseSpeed * this.slowFactor;
  };

  Creep.prototype.progress = function () {
    return this.dist / this.pathLength;
  };

  /** Where this creep will be in `t` seconds — used for projectile leading. */
  Creep.prototype.predict = function (t, path, out) {
    return path.sample(this.dist + this.currentSpeed() * t, out);
  };

  Creep.prototype.applySlow = function (factor, duration) {
    if (this.spellImmune) return false;
    // Strongest slow wins; equal slows refresh the timer.
    if (factor < this.slowFactor || this.slowTimer <= 0) this.slowFactor = factor;
    if (duration > this.slowTimer) this.slowTimer = duration;
    return true;
  };

  Creep.prototype.applyPoison = function (dps, duration) {
    if (this.spellImmune) return false;
    if (dps > this.poisonDps) this.poisonDps = dps;
    if (duration > this.poisonTimer) this.poisonTimer = duration;
    return true;
  };

  Creep.prototype.applyRoot = function (duration) {
    if (this.spellImmune || this.boss) return false;
    if (duration > this.rootTimer) this.rootTimer = duration;
    return true;
  };

  /**
   * @returns {number} damage actually removed from hp (clamped at remaining hp)
   */
  Creep.prototype.hurt = function (amount) {
    if (!this.alive || amount <= 0) return 0;
    var dealt = Math.min(amount, this.hp);
    this.hp -= dealt;
    this.hurtFlash = Creep.HURT_FLASH;
    return dealt;
  };

  Creep.prototype.update = function (dt, game) {
    this.px = this.x;
    this.py = this.y;
    this.pz = this.z;
    this.anim += dt;
    if (this.hurtFlash > 0) this.hurtFlash -= dt;

    if (this.slowTimer > 0) {
      this.slowTimer -= dt;
      if (this.slowTimer <= 0) { this.slowTimer = 0; this.slowFactor = 1; }
    }
    if (this.rootTimer > 0) {
      this.rootTimer -= dt;
      if (this.rootTimer < 0) this.rootTimer = 0;
    }
    if (this.poisonTimer > 0) {
      this.poisonTimer -= dt;
      var tick = this.poisonDps * dt;
      if (this.hurt(tick) > 0) game.notePoisonDamage(this, tick);
      if (this.poisonTimer <= 0) { this.poisonTimer = 0; this.poisonDps = 0; }
      if (this.hp <= 0) { game.killCreep(this, null); return; }
    }

    var path = this.flying ? game.airPath : game.path;
    this.dist += this.currentSpeed() * dt;
    if (this.dist >= path.length) {
      game.leakCreep(this);
      return;
    }
    path.sample(this.dist, SAMPLE);
    this.x = SAMPLE.x;
    this.y = SAMPLE.y;
    this.angle = SAMPLE.angle;
    if (this.flying) {
      this.z = 52 + Math.sin(this.anim * 2.4 + this.id * 0.7) * 5;
    }
  };

  /** Seconds a hit stays visible as a bright flash on the body. */
  Creep.HURT_FLASH = 0.12;

  global.WC3.Creep = Creep;

  if (typeof module === 'object' && module.exports) module.exports = Creep;
})(typeof globalThis !== 'undefined' ? globalThis : this);
