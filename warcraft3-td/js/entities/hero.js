/*
 * Commander hero: a mobile attacker the player can order around with
 * right-click. Gains XP from kills, spends mana on two abilities.
 * The hero cannot be killed (creeps never attack), so it can never soft-lock
 * the run — it is a micro-able DPS tool, not a survival mechanic.
 */
(function (global) {
  'use strict';

  var HEROES = {
    paladin: {
      id: 'paladin', nameZh: '圣骑士', nameEn: 'Paladin', color: '#ffe6a3',
      attackType: 'hero', dmgMin: 22, dmgMax: 30, range: 190, cooldown: 1.1, speed: 205,
      qKey: 'holyLight', wKey: 'abilityQ'
    },
    blademaster: {
      id: 'blademaster', nameZh: '剑圣', nameEn: 'Blademaster', color: '#ff9f6b',
      attackType: 'hero', dmgMin: 28, dmgMax: 34, range: 150, cooldown: 0.8, speed: 235,
      qKey: 'bladestorm', wKey: 'abilityW'
    },
    demonhunter: {
      id: 'demonhunter', nameZh: '恶魔猎手', nameEn: 'Demon Hunter', color: '#c69bff',
      attackType: 'hero', dmgMin: 24, dmgMax: 32, range: 165, cooldown: 0.9, speed: 250,
      qKey: 'immolation', wKey: 'abilityW'
    },
    deathknight: {
      id: 'deathknight', nameZh: '死亡骑士', nameEn: 'Death Knight', color: '#9fe3ff',
      attackType: 'hero', dmgMin: 26, dmgMax: 36, range: 200, cooldown: 1.15, speed: 210,
      qKey: 'deathCoil', wKey: 'abilityW'
    }
  };

  var Q_COST = 55;
  var Q_RADIUS = 165;
  var Q_COOLDOWN = 9;
  var W_COST = 40;
  var W_COOLDOWN = 16;
  var W_DURATION = 7;

  function Hero() {
    this.alive = false;
    this.id = 0;
    this.def = null;
    this.x = 0; this.y = 0; this.z = 0;
    this.homeX = 0; this.homeY = 0;
    this.orderX = 0; this.orderY = 0;
    this.angle = 0;
    this.level = 1;
    this.xp = 0;
    this.xpNext = 8;
    this.mana = 100; this.manaMax = 100;
    this.cooldownTimer = 0;
    this.qTimer = 0;
    this.wTimer = 0;
    this.hasteTimer = 0;
    this.kills = 0;
    this.damageDealt = 0;
    this.anim = 0;
    this.target = null;
    this.targetId = 0;
    this._scratch = [];
  }

  Hero.prototype.init = function (id, defId, x, y) {
    this.id = id;
    this.def = HEROES[defId] || HEROES.paladin;
    this.alive = true;
    this.x = this.homeX = this.orderX = x;
    this.y = this.homeY = this.orderY = y;
    this.level = 1;
    this.xp = 0;
    this.xpNext = 8;
    this.manaMax = 100;
    this.mana = this.manaMax;
    this.cooldownTimer = 0;
    this.qTimer = 0;
    this.wTimer = 0;
    this.hasteTimer = 0;
    this.kills = 0;
    this.damageDealt = 0;
    this.target = null;
    this.targetId = 0;
    return this;
  };

  Hero.prototype.stats = function () {
    var lvl = this.level - 1;
    return {
      dmgMin: this.def.dmgMin + lvl * 7,
      dmgMax: this.def.dmgMax + lvl * 9,
      range: this.def.range,
      cooldown: this.def.cooldown / (this.hasteTimer > 0 ? 1.6 : 1),
      speed: this.def.speed
    };
  };

  Hero.prototype.order = function (x, y) {
    this.orderX = x;
    this.orderY = y;
  };

  Hero.prototype.addXp = function (amount) {
    this.xp += amount;
    while (this.xp >= this.xpNext && this.level < 10) {
      this.xp -= this.xpNext;
      this.level++;
      this.xpNext = Math.round(this.xpNext * 1.55);
      this.manaMax += 20;
      this.mana = this.manaMax;
      return true;
    }
    return false;
  };

  Hero.prototype.castQ = function (game) {
    if (this.qTimer > 0 || this.mana < Q_COST) return false;
    this.mana -= Q_COST;
    this.qTimer = Q_COOLDOWN;
    game.resolveHeroNova(this, Q_RADIUS, 45 + this.level * 26);
    return true;
  };

  Hero.prototype.castW = function (game) {
    if (this.wTimer > 0 || this.mana < W_COST) return false;
    this.mana -= W_COST;
    this.wTimer = W_COOLDOWN;
    this.hasteTimer = W_DURATION;
    game.spawnFx('ring', { x: this.x, y: this.y, ttl: 0.5, size: 46, color: this.def.color });
    game.playSfx('upgrade');
    return true;
  };

  Hero.prototype.update = function (dt, game) {
    this.anim += dt;
    var st = this.stats();

    this.mana = Math.min(this.manaMax, this.mana + (1.6 + this.level * 0.3) * dt);
    if (this.qTimer > 0) this.qTimer -= dt;
    if (this.wTimer > 0) this.wTimer -= dt;
    if (this.hasteTimer > 0) this.hasteTimer -= dt;
    if (this.cooldownTimer > 0) this.cooldownTimer -= dt;

    var dx = this.orderX - this.x;
    var dy = this.orderY - this.y;
    var d = Math.sqrt(dx * dx + dy * dy);
    if (d > 4) {
      var step = Math.min(d, st.speed * dt);
      this.x += (dx / d) * step;
      this.y += (dy / d) * step;
      this.angle = Math.atan2(dy, dx);
    }

    if (this.target && (!this.target.alive || this.target.id !== this.targetId)) {
      this.target = null;
    }
    if (!this.target || !this.inRange(this.target, st.range)) {
      this.target = game.hash.pick(this.x, this.y, st.range, function (c) {
        return c.alive ? c.dist : null;
      }, this._scratch);
      this.targetId = this.target ? this.target.id : 0;
    }
    if (this.target && this.cooldownTimer <= 0) {
      this.angle = Math.atan2(this.target.y - this.y, this.target.x - this.x);
      game.spawnProjectile(
        { x: this.x, y: this.y, z: 34 },
        this.target,
        { x: this.target.x, y: this.target.y, z: this.target.z },
        {
          towerId: -1,
          heroId: this.id,
          damage: game.rng.range(st.dmgMin, st.dmgMax + 1),
          attackType: this.def.attackType,
          splash: null,
          effect: null,
          bonus: null,
          color: this.def.color
        },
        { kind: 'heroshot', speed: 700 }
      );
      this.cooldownTimer = st.cooldown;
      game.playSfx('shoot_human');
    }
  };

  Hero.prototype.inRange = function (c, r) {
    var dx = c.x - this.x;
    var dy = c.y - this.y;
    return dx * dx + dy * dy <= r * r;
  };

  Hero.HEROES = HEROES;
  Hero.Q_COST = Q_COST;
  Hero.W_COST = W_COST;
  global.WC3.Hero = Hero;

  if (typeof module === 'object' && module.exports) module.exports = Hero;
})(typeof globalThis !== 'undefined' ? globalThis : this);
