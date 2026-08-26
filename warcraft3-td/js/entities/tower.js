/*
 * Tower entity. Acquires a target through the spatial hash, leads the shot
 * against the target's projected path position, then either lobs a projectile
 * or resolves an instant chain-lightning strike.
 */
(function (global) {
  'use strict';

  var AIM = { x: 0, y: 0, angle: 0, seg: 0 };

  var TARGET_MODES = ['first', 'last', 'strong', 'weak', 'close'];

  function Tower() {
    this.alive = false;
    this.id = 0;
    this.def = null;
    this.tx = 0; this.ty = 0;
    this.x = 0; this.y = 0;
    this.cooldownTimer = 0;
    this.target = null;
    this.targetId = 0;
    this.angle = 0;
    this.mode = 'first';
    this.investedGold = 0;
    this.investedLumber = 0;
    this.kills = 0;
    this.damageDealt = 0;
    this.shots = 0;
    this.fireAnim = 0;
    this.buildAnim = 1;
    this._scratch = [];
  }

  Tower.prototype.init = function (id, def, tx, ty, tile) {
    this.id = id;
    this.def = def;
    this.tx = tx;
    this.ty = ty;
    this.x = (tx + 0.5) * tile;
    this.y = (ty + 0.5) * tile;
    this.cooldownTimer = 0.25;
    this.target = null;
    this.targetId = 0;
    this.angle = 0;
    this.mode = 'first';
    this.investedGold = def.gold;
    this.investedLumber = def.lumber;
    this.kills = 0;
    this.damageDealt = 0;
    this.shots = 0;
    this.fireAnim = 0;
    this.buildAnim = 0;
    return this;
  };

  Tower.prototype.canTarget = function (c) {
    if (!c || !c.alive) return false;
    if (c.flying && !this.def.targetsAir) return false;
    return true;
  };

  Tower.prototype.inRange = function (c) {
    var dx = c.x - this.x;
    var dy = c.y - this.y;
    var r = this.def.range;
    return dx * dx + dy * dy <= r * r;
  };

  Tower.prototype.score = function (c) {
    if (!this.canTarget(c)) return null;
    switch (this.mode) {
      case 'last': return -c.dist;
      case 'strong': return c.hp;
      case 'weak': return -c.hp;
      case 'close': {
        var dx = c.x - this.x;
        var dy = c.y - this.y;
        return -(dx * dx + dy * dy);
      }
      default: return c.dist;
    }
  };

  Tower.prototype.acquire = function (game) {
    var self = this;
    var found = game.hash.pick(this.x, this.y, this.def.range, function (c) {
      return self.score(c);
    }, this._scratch);
    this.target = found;
    this.targetId = found ? found.id : 0;
    return found;
  };

  Tower.prototype.cycleMode = function (dir) {
    var i = TARGET_MODES.indexOf(this.mode);
    i = (i + (dir || 1) + TARGET_MODES.length) % TARGET_MODES.length;
    this.mode = TARGET_MODES[i];
    return this.mode;
  };

  Tower.prototype.sellValue = function (rate) {
    return Math.floor(this.investedGold * rate);
  };

  Tower.prototype.update = function (dt, game) {
    if (this.buildAnim < 1) {
      this.buildAnim = Math.min(1, this.buildAnim + dt * 2.2);
    }
    if (this.fireAnim > 0) this.fireAnim -= dt;
    if (this.cooldownTimer > 0) this.cooldownTimer -= dt;

    // Entities are pooled: a stale reference may already have been recycled,
    // so the id must match as well as the alive flag.
    var t = this.target;
    if (t && t.id !== this.targetId) t = this.target = null;
    if (!this.canTarget(t) || !this.inRange(t)) {
      t = this.acquire(game);
    }
    if (!t) return;

    var dx = t.x - this.x;
    var dy = t.y - this.y;
    this.angle = Math.atan2(dy, dx);

    if (this.cooldownTimer <= 0) {
      this.fire(game, t);
      this.cooldownTimer += this.def.cooldown;
      if (this.cooldownTimer < 0) this.cooldownTimer = this.def.cooldown;
    }
  };

  Tower.prototype.rollDamage = function (rng) {
    return rng.range(this.def.dmgMin, this.def.dmgMax + 1);
  };

  Tower.prototype.fire = function (game, target) {
    var def = this.def;
    this.shots++;
    this.fireAnim = 0.14;

    var payload = {
      towerId: this.id,
      damage: this.rollDamage(game.rng),
      attackType: def.attackType,
      splash: def.splash,
      effect: def.effect,
      bonus: def.bonus,
      color: def.raceAccent
    };

    if (def.effect && def.effect.kind === 'chain') {
      game.resolveChain(this, target, payload, def.effect);
      game.playSfx('shoot_' + def.race);
      return;
    }

    // Lead the shot: estimate flight time and aim where the creep will be.
    var dx = target.x - this.x;
    var dy = target.y - this.y;
    var dist = Math.sqrt(dx * dx + dy * dy);
    var speed = (def.projectile && def.projectile.speed) || 520;
    var flight = dist / speed;
    var path = target.flying ? game.airPath : game.path;
    target.predict(flight, path, AIM);

    game.spawnProjectile(
      { x: this.x, y: this.y, z: 34 + def.tier * 6 },
      target,
      { x: AIM.x, y: AIM.y, z: target.z },
      payload,
      def.projectile
    );
    game.playSfx('shoot_' + def.race);
  };

  Tower.TARGET_MODES = TARGET_MODES;
  global.WC3.Tower = Tower;

  if (typeof module === 'object' && module.exports) module.exports = Tower;
})(typeof globalThis !== 'undefined' ? globalThis : this);
