/* Creep entity: pathing, status effects, damage intake. DOM-free. */
(function (root) {
  'use strict';
  const NS = (root.WC3TD = root.WC3TD || {});

  let NEXT_ID = 1;

  function Creep(game, typeId, wave) {
    const st = NS.CreepData.statsFor(typeId, wave, game.diff);
    this.id = NEXT_ID++;
    this.game = game;
    this.wave = wave;
    this.typeId = typeId;
    this.type = st.type;
    this.name = st.name;
    this.maxHp = st.maxHp;
    this.hp = st.maxHp;
    this.armorType = st.armorType;
    this.armorValue = st.armorValue;
    this.baseSpeed = st.speed;
    this.bounty = st.bounty;
    this.flying = st.flying;
    this.spellImmune = st.spellImmune;
    this.boss = st.boss;
    this.radius = st.radius;
    this.regen = st.regen;
    this.aura = st.aura;

    this.path = st.flying ? game.flyPath : game.path;
    this.dist = 0;
    this.alive = true;
    this.dying = 0;
    this.leaked = false;
    this.auraArmor = 0;

    // status effects
    this.slowAmount = 0; this.slowUntil = 0;
    this.rootUntil = 0;
    this.webUntil = 0;
    this.poisons = new Map(); // sourceLine -> {dps, until}

    this.vx = 0; this.vy = 0;
    this.z = st.flying ? NS.Config.flyHeight : 0;
    this.facing = 0;
    this.hitFlash = 0;
    this.anim = Math.random() * 6.28;

    const p = this.path.positionAt(0);
    this.x = p.x; this.y = p.y;
  }

  Creep.prototype.progress = function () { return this.dist / this.path.length; };

  Creep.prototype.isAirborne = function () {
    return this.flying && this.game.time >= this.webUntil;
  };

  Creep.prototype.isRooted = function () {
    return this.game.time < this.rootUntil;
  };

  Creep.prototype.effectiveArmor = function () {
    return this.armorValue + this.auraArmor;
  };

  Creep.prototype.currentSpeed = function () {
    if (this.isRooted()) return 0;
    const slow = this.game.time < this.slowUntil ? this.slowAmount : 0;
    return this.baseSpeed * (1 - slow);
  };

  /** Status effects from a tower hit. Spell-immune creeps shrug them off. */
  Creep.prototype.applyEffect = function (eff, def, rng) {
    if (!this.alive) return false;
    if (this.spellImmune) return false;
    const now = this.game.time;
    switch (eff.type) {
      case 'slow': {
        const active = now < this.slowUntil ? this.slowAmount : 0;
        // strongest slow wins; a weaker one may still extend an equal duration
        if (eff.amount >= active) {
          this.slowAmount = eff.amount;
          this.slowUntil = now + eff.duration;
        } else {
          this.slowAmount = active;
        }
        return true;
      }
      case 'poison': {
        const key = def ? def.line : 'poison';
        const cur = this.poisons.get(key);
        if (!cur || eff.dps >= cur.dps) this.poisons.set(key, { dps: eff.dps, until: now + eff.duration });
        else cur.until = Math.max(cur.until, now + eff.duration);
        return true;
      }
      case 'root':
        if (this.flying && this.isAirborne()) return false; // can't entangle the sky
        if (this.boss) eff = { type: 'root', chance: eff.chance, duration: eff.duration * 0.4 };
        if (rng && eff.chance !== undefined && !rng.chance(eff.chance)) return false;
        this.rootUntil = Math.max(this.rootUntil, now + eff.duration);
        return true;
      case 'web': {
        if (!this.flying) return false; // web only drags flyers down
        let dur = eff.duration;
        if (this.boss) dur *= 0.5;
        if (rng && eff.chance !== undefined && !rng.chance(eff.chance)) return false;
        this.webUntil = Math.max(this.webUntil, now + dur);
        return true;
      }
      default: return false;
    }
  };

  Creep.prototype.takeDamage = function (amount, source, breakdown, opts) {
    if (!this.alive || amount <= 0) return;
    this.hp -= amount;
    this.hitFlash = 0.12;
    this.game.onDamage(this, amount, source, breakdown, opts || {});
    if (this.hp <= 0) this.kill(source);
  };

  Creep.prototype.kill = function (source) {
    if (!this.alive) return;
    this.alive = false;
    this.dying = 0.7;
    this.game.onCreepKilled(this, source);
  };

  Creep.prototype.leak = function () {
    if (!this.alive) return;
    this.alive = false;
    this.leaked = true;
    this.dying = 0.35;
    this.game.onCreepLeaked(this);
  };

  Creep.prototype.update = function (dt) {
    const now = this.game.time;
    if (!this.alive) { this.dying -= dt; return; }
    this.anim += dt;
    if (this.hitFlash > 0) this.hitFlash -= dt;

    // poison ticks
    if (this.poisons.size) {
      let total = 0;
      this.poisons.forEach((p, k) => {
        if (now >= p.until) this.poisons.delete(k);
        else total += p.dps;
      });
      if (total > 0) {
        this.hp -= total * dt;
        if (this.hp <= 0) { this.game.onPoisonKill(this); this.kill(null); return; }
      }
    }
    if (this.regen && this.hp < this.maxHp) this.hp = Math.min(this.maxHp, this.hp + this.regen * dt);

    // altitude: webbed flyers are dragged to the ground
    const wantZ = this.isAirborne() ? NS.Config.flyHeight : 0;
    const zRate = this.flying ? 5 : 12;
    if (this.z < wantZ) this.z = Math.min(wantZ, this.z + zRate * dt);
    else if (this.z > wantZ) this.z = Math.max(wantZ, this.z - zRate * dt);

    const sp = this.currentSpeed();
    const prevX = this.x, prevY = this.y;
    this.dist += sp * dt;
    if (this.dist >= this.path.length) { this.leak(); return; }
    const p = this.path.positionAt(this.dist);
    this.x = p.x; this.y = p.y;
    const d = this.path.directionAt(this.dist);
    this.vx = d.x * sp; this.vy = d.y * sp;
    if (sp > 0) this.facing = Math.atan2(this.y - prevY, this.x - prevX);
  };

  NS.Creep = Creep;
})(typeof globalThis !== 'undefined' ? globalThis : this);
