/* Commander entity: patrols, auto-attacks, casts Q/W/E/R. DOM-free. */
(function (root) {
  'use strict';
  const NS = (root.WC3TD = root.WC3TD || {});

  function Hero(game, heroId) {
    this.game = game;
    this.def = NS.HeroData.BY_ID[heroId] || NS.HeroData.HEROES[0];
    this.level = 1;
    this.xp = 0;
    const cfg = NS.Config.hero;
    this.maxHp = cfg.baseHp;
    this.hp = this.maxHp;
    this.maxMana = cfg.baseMana;
    this.mana = this.maxMana;
    this.dead = false;
    this.respawn = 0;
    this.autoCast = true;

    const kp = NS.Config.keepTile;
    this.home = { x: kp.x - 2.5, y: kp.y - 2.5 };
    this.x = this.home.x; this.y = this.home.y; this.z = 0;
    this.moveTarget = null;
    this.patrolT = 0;
    this.facing = 0;
    this.attackCd = 0;
    this.speed = 3.4;
    this.anim = 0;

    this.cooldowns = {};
    this.buff = null;         // {until, damageMul, moveMul, attackSpeedMul, attackType, rangeAdd, images}
    this.storm = null;        // {until, radius, dps, attackType, tick}
    this.immolation = false;
    this.def.abilities.forEach((a) => { this.cooldowns[a.id] = 0; });
    this.rebuildAttack();
  }

  Hero.prototype.ability = function (key) {
    return this.def.abilities.filter((a) => a.key === key)[0] || null;
  };

  Hero.prototype.scaled = function (a, field) {
    return (a[field] || 0) + (a.perLevel || 0) * (this.level - 1);
  };

  Hero.prototype.rebuildAttack = function () {
    const at = this.def.attack;
    const buff = this.activeBuff();
    const dmgMul = buff && buff.damageMul ? buff.damageMul : 1;
    const rangeAdd = buff && buff.rangeAdd ? buff.rangeAdd : 0;
    const lvlMul = 1 + (this.level - 1) * 0.16;
    const haste = this.def.abilities.filter((a) => a.kind === 'passiveHaste')[0];
    const hasteMul = haste ? 1 / (1 + this.scaled(haste, 'attackSpeed')) : 1;
    const asMul = buff && buff.attackSpeedMul ? 1 / buff.attackSpeedMul : 1;
    const crit = this.def.abilities.filter((a) => a.kind === 'passiveCrit')[0];
    this.atkDef = {
      id: 'hero_' + this.def.id, line: 'hero', tier: this.level,
      name: this.def.name,
      attackType: (buff && buff.attackType) || at.attackType,
      damage: [at.damage[0] * lvlMul * dmgMul, at.damage[1] * lvlMul * dmgMul],
      cooldown: at.cooldown * hasteMul * asMul,
      range: at.range + rangeAdd,
      targets: ['ground', 'air'],
      projectile: at.projectile,
      effects: [], splash: null, chain: null, multishot: 1,
      bonusVsArmor: null, crit: crit ? { chance: crit.chance, mult: crit.mult } : null
    };
    this.atkDef.avgDamage = (this.atkDef.damage[0] + this.atkDef.damage[1]) / 2;
    this.atkDef.dps = this.atkDef.avgDamage / this.atkDef.cooldown;
  };

  Hero.prototype.activeBuff = function () {
    if (this.buff && this.game.time < this.buff.until) return this.buff;
    return null;
  };

  Hero.prototype.gainLevel = function () {
    if (this.level >= NS.Config.hero.maxLevel) return;
    this.level++;
    const cfg = NS.Config.hero;
    this.maxHp = cfg.baseHp + cfg.hpPerLevel * (this.level - 1);
    this.maxMana = cfg.baseMana + cfg.manaPerLevel * (this.level - 1);
    this.hp = this.maxHp;
    this.mana = this.maxMana;
    this.rebuildAttack();
    this.game.fx.text(this.x, this.y, 1.6, 'LEVEL UP!', '#ffe07a', true);
    this.game.log('hero_level', { level: this.level });
  };

  Hero.prototype.canCast = function (a) {
    if (!a || a.passive || this.dead) return false;
    if (a.kind === 'toggleAura') return true;
    return this.mana >= a.mana && (this.cooldowns[a.id] || 0) <= 0;
  };

  Hero.prototype.cast = function (key, aimX, aimY) {
    const a = this.ability(key);
    if (!this.canCast(a)) return false;
    const game = this.game;
    if (a.kind === 'toggleAura') {
      this.immolation = !this.immolation;
      game.audio.ability();
      return true;
    }
    this.mana -= a.mana;
    this.cooldowns[a.id] = a.cooldown;
    game.audio.ability();

    switch (a.kind) {
      case 'nuke': {
        let tx = aimX, ty = aimY;
        if (tx === undefined) {
          const tgt = game.nearestCreep(this.x, this.y, this.atkDef.range + 3, false);
          if (!tgt) { tx = this.x; ty = this.y; } else { tx = tgt.x; ty = tgt.y; }
        }
        const dmg = this.scaled(a, 'damage');
        const pool = game.creepHash.query(tx, ty, a.radius);
        for (let i = 0; i < pool.length; i++) {
          const c = pool[i];
          game.heroStrike(this, c, dmg, a.attackType);
          if (a.slow) c.applyEffect({ type: 'slow', amount: a.slow.amount, duration: a.slow.duration }, this.atkDef, game.rng);
        }
        game.fx.explosion(tx, ty, 0.4, a.radius, this.def.color);
        game.fx.ring(tx, ty, 0.05, a.radius * 0.3, a.radius, this.def.accent, 0.45);
        break;
      }
      case 'heal':
        this.hp = Math.min(this.maxHp, this.hp + this.scaled(a, 'amount'));
        game.fx.text(this.x, this.y, 1.5, '+' + Math.round(this.scaled(a, 'amount')), '#8cff9a');
        game.fx.ring(this.x, this.y, 0.05, 0.3, 1.4, '#fff2b0', 0.5);
        break;
      case 'selfbuff':
        this.buff = {
          until: game.time + a.duration,
          damageMul: a.damageMul || 1, moveMul: a.moveMul || 1,
          attackSpeedMul: a.attackSpeedMul || 1, attackType: a.attackType || null,
          rangeAdd: a.rangeAdd || 0, images: a.images || 0, id: a.id
        };
        this.rebuildAttack();
        game.fx.ring(this.x, this.y, 0.05, 0.3, 1.8, this.def.color, 0.6);
        break;
      case 'storm':
        this.storm = {
          until: game.time + a.duration, radius: a.radius,
          dps: this.scaled(a, 'dps'), attackType: a.attackType, tick: 0, id: a.id
        };
        break;
      default: break;
    }
    return true;
  };

  Hero.prototype.order = function (x, y) {
    this.moveTarget = { x, y };
  };

  Hero.prototype.takeDamage = function (amount) {
    if (this.dead) return;
    this.hp -= amount;
    if (this.hp <= 0) {
      this.hp = 0;
      this.dead = true;
      this.respawn = NS.Config.hero.respawnTime;
      this.storm = null; this.buff = null; this.immolation = false;
      this.game.onHeroDeath(this);
    }
  };

  Hero.prototype.update = function (dt) {
    const game = this.game;
    this.anim += dt;
    if (this.dead) {
      this.respawn -= dt;
      if (this.respawn <= 0) {
        this.dead = false;
        this.hp = this.maxHp; this.mana = this.maxMana * 0.5;
        this.x = this.home.x; this.y = this.home.y;
        this.moveTarget = null;
        game.log('hero_revive', {});
      }
      return;
    }

    const cfg = NS.Config.hero;
    this.hp = Math.min(this.maxHp, this.hp + cfg.hpRegen * dt);
    this.mana = Math.min(this.maxMana, this.mana + cfg.manaRegen * dt);
    for (const k in this.cooldowns) if (this.cooldowns[k] > 0) this.cooldowns[k] -= dt;
    if (this.buff && game.time >= this.buff.until) { this.buff = null; this.rebuildAttack(); }

    // immolation
    if (this.immolation) {
      const a = this.def.abilities.filter((x) => x.kind === 'toggleAura')[0];
      this.mana -= a.manaPerSecond * dt;
      if (this.mana <= 0) { this.mana = 0; this.immolation = false; }
      else {
        this._immoTick = (this._immoTick || 0) + dt;
        if (this._immoTick >= NS.Config.dotTickInterval) {
          this._immoTick = 0;
          const dmg = this.scaled(a, 'dps') * NS.Config.dotTickInterval;
          const pool = game.creepHash.query(this.x, this.y, a.radius);
          for (let i = 0; i < pool.length; i++) game.heroStrike(this, pool[i], dmg, a.attackType, true);
        }
      }
    }

    // storm ultimate
    if (this.storm) {
      if (game.time >= this.storm.until) this.storm = null;
      else {
        this.storm.tick += dt;
        if (this.storm.tick >= NS.Config.dotTickInterval) {
          this.storm.tick -= NS.Config.dotTickInterval;
          const dmg = this.storm.dps * NS.Config.dotTickInterval;
          const pool = game.creepHash.query(this.x, this.y, this.storm.radius);
          for (let i = 0; i < pool.length; i++) game.heroStrike(this, pool[i], dmg, this.storm.attackType, true);
          game.fx.ring(this.x, this.y, 0.05, this.storm.radius * 0.5, this.storm.radius, this.def.accent, 0.3);
        }
      }
    }

    // auto-cast actives
    if (this.autoCast) {
      for (let i = 0; i < this.def.abilities.length; i++) {
        const a = this.def.abilities[i];
        if (a.passive || a.kind === 'toggleAura') continue;
        if (!this.canCast(a)) continue;
        if (a.kind === 'heal' && this.hp > this.maxHp * 0.45) continue;
        if (a.kind !== 'heal') {
          const near = game.creepHash.query(this.x, this.y, this.atkDef.range + 2).length;
          if (near < (a.ultimate ? 3 : 1)) continue;
        }
        this.cast(a.key);
        break;
      }
    }

    // movement
    const buff = this.activeBuff();
    const spd = this.speed * (buff && buff.moveMul ? buff.moveMul : 1);
    let tx, ty;
    if (this.moveTarget) {
      tx = this.moveTarget.x; ty = this.moveTarget.y;
      if (Math.hypot(tx - this.x, ty - this.y) < 0.15) this.moveTarget = null;
    } else {
      this.patrolT += dt * 0.25;
      tx = this.home.x + Math.cos(this.patrolT) * 1.6;
      ty = this.home.y + Math.sin(this.patrolT * 0.8) * 1.2;
    }
    const dx = tx - this.x, dy = ty - this.y;
    const d = Math.hypot(dx, dy);
    if (d > 0.02) {
      const step = Math.min(d, spd * dt);
      this.x += (dx / d) * step;
      this.y += (dy / d) * step;
      this.facing = Math.atan2(dy, dx);
    }

    // auto attack
    this.attackCd -= dt;
    if (this.attackCd <= 0) {
      const target = game.nearestCreep(this.x, this.y, this.atkDef.range, true, this.atkDef);
      if (target) {
        this.attackCd = this.atkDef.cooldown;
        this.facing = Math.atan2(target.y - this.y, target.x - this.x);
        const base = NS.Combat.rollDamage(this.atkDef, game.rng);
        let critMult = 1;
        if (this.atkDef.crit && game.rng.chance(this.atkDef.crit.chance)) critMult = this.atkDef.crit.mult;
        if (this.atkDef.range <= 2.2) {
          // melee: resolve immediately
          NS.Combat.strike(game, this, this.atkDef, target, base, { multiplier: critMult, crit: critMult > 1 });
          game.fx.spark(target.x, target.y, target.z + 0.4, this.atkDef.projectile.color, 7);
        } else {
          const lead = NS.Combat.leadTarget(this, target, this.atkDef.projectile.speed);
          game.spawnProjectile({
            tower: this, def: this.atkDef, target: target, base: base, critMult: critMult,
            speed: this.atkDef.projectile.speed, kind: this.atkDef.projectile.kind,
            color: this.atkDef.projectile.color, arc: 0,
            x: this.x, y: this.y, z: 1.0, aimX: lead.x, aimY: lead.y, aimZ: target.z
          });
        }
      }
    }
  };

  NS.Hero = Hero;
})(typeof globalThis !== 'undefined' ? globalThis : this);
