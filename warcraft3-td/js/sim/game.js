/* Headless game simulation. No DOM access anywhere in this file so that the
 * node test-suite can run whole games. */
(function (root) {
  'use strict';
  const NS = (root.WC3TD = root.WC3TD || {});

  const NullAudio = {
    shoot: function () {}, build: function () {}, sell: function () {}, upgrade: function () {},
    wave: function () {}, leak: function () {}, click: function () {}, ability: function () {},
    victory: function () {}, defeat: function () {}, deny: function () {}, boss: function () {}
  };

  function Game(opts) {
    const o = opts || {};
    this.diffKey = o.difficulty || 'normal';
    this.diff = NS.Config.difficulties[this.diffKey];
    this.rng = new NS.Rng(o.seed || NS.Config.seed);
    this.audio = o.audio || NullAudio;
    this.fx = new NS.Fx(this);

    this.path = new NS.Path(NS.Config.waypoints);
    this.flyPath = new NS.Path(NS.Config.airWaypoints);

    this.time = 0;
    this.gold = this.diff.gold;
    this.lumber = 0;
    this.lives = this.diff.lives;
    this.maxLives = this.diff.lives;
    this.interestRate = NS.Config.interestStart;
    this.interestTimer = NS.Config.interestPeriod;

    this.towers = [];
    this.creeps = [];
    this.projectiles = [];
    this.creepHash = new NS.SpatialHash(3);
    this.occupied = {};      // "x,y" -> tower
    this.buildable = this.buildBuildableMask();

    this.wave = 0;
    this.waveState = 'prep';  // prep | spawning | clearing | over
    this.waveTimer = NS.Config.firstWaveDelay;
    this.spawnQueue = [];
    this.status = 'playing';  // playing | victory | defeat
    this.auraTimer = 0;

    this.stats = {
      kills: 0, leaks: 0, goldEarned: 0, goldSpent: 0, damage: 0,
      interestPaid: 0, wavesCleared: 0, built: 0, sold: 0, upgraded: 0
    };
    this.events = [];
    this.hero = o.hero === null ? null : new NS.Hero(this, o.hero || 'paladin');
    this.selection = null;
  }

  /* ------------------------------------------------------------------ map */

  Game.prototype.buildBuildableMask = function () {
    const g = NS.Config.grid;
    const mask = [];
    for (let y = 0; y < g.rows; y++) {
      const row = [];
      for (let x = 0; x < g.cols; x++) {
        const d = this.path.distanceTo(x + 0.5, y + 0.5);
        const nearKeep = Math.hypot(x + 0.5 - NS.Config.keepTile.x, y + 0.5 - NS.Config.keepTile.y) < 2.2;
        row.push(d > NS.Config.pathWidth && !nearKeep && x > 0 && x < g.cols - 1 && y > 0 && y < g.rows - 1);
      }
      mask.push(row);
    }
    return mask;
  };

  Game.prototype.tileKey = function (x, y) { return x + ',' + y; };

  Game.prototype.isBuildable = function (x, y) {
    const g = NS.Config.grid;
    if (x < 0 || y < 0 || x >= g.cols || y >= g.rows) return false;
    if (!this.buildable[y][x]) return false;
    return !this.occupied[this.tileKey(x, y)];
  };

  Game.prototype.towerAt = function (x, y) { return this.occupied[this.tileKey(x, y)] || null; };

  /* ------------------------------------------------------------ build API */

  Game.prototype.canAfford = function (def) {
    return this.gold >= def.gold && this.lumber >= def.lumber;
  };

  Game.prototype.build = function (defId, x, y) {
    const def = NS.TowerData.get(defId);
    if (!def || def.tier !== 1) return { ok: false, reason: 'invalid' };
    if (!this.isBuildable(x, y)) return { ok: false, reason: 'blocked' };
    if (!this.canAfford(def)) return { ok: false, reason: 'cost' };
    this.gold -= def.gold; this.lumber -= def.lumber;
    this.stats.goldSpent += def.gold;
    this.stats.built++;
    const tw = new NS.Tower(this, defId, x, y);
    this.towers.push(tw);
    this.occupied[this.tileKey(x, y)] = tw;
    this.audio.build();
    this.fx.ring(tw.x, tw.y, 0.05, 0.2, 1.0, '#ffe07a', 0.5);
    return { ok: true, tower: tw };
  };

  Game.prototype.upgrade = function (tower) {
    const next = tower.upgradeDef();
    if (!next) return { ok: false, reason: 'max' };
    if (!this.canAfford(next)) return { ok: false, reason: 'cost' };
    this.gold -= next.gold; this.lumber -= next.lumber;
    this.stats.goldSpent += next.gold;
    this.stats.upgraded++;
    tower.upgrade();
    this.audio.upgrade();
    this.fx.ring(tower.x, tower.y, 0.05, 0.2, 1.2, '#9fe0ff', 0.5);
    return { ok: true };
  };

  Game.prototype.sell = function (tower) {
    const idx = this.towers.indexOf(tower);
    if (idx === -1) return { ok: false };
    const value = tower.sellValue();
    this.gold += value;
    this.stats.sold++;
    this.towers.splice(idx, 1);
    delete this.occupied[this.tileKey(tower.tileX, tower.tileY)];
    if (this.selection === tower) this.selection = null;
    this.audio.sell();
    this.fx.text(tower.x, tower.y, 1.2, '+' + value, '#ffd24a');
    return { ok: true, value };
  };

  /* --------------------------------------------------------------- combat */

  Game.prototype.spawnProjectile = function (o) {
    this.projectiles.push(new NS.Projectile(this, o));
  };

  Game.prototype.nearestCreep = function (x, y, r, respectRules, def) {
    const pool = this.creepHash.query(x, y, r);
    let best = null, bd = Infinity;
    for (let i = 0; i < pool.length; i++) {
      const c = pool[i];
      if (respectRules && def && !NS.Combat.canHit(def, c)) continue;
      const d = (c.x - x) * (c.x - x) + (c.y - y) * (c.y - y);
      if (d < bd) { bd = d; best = c; }
    }
    return best;
  };

  /** Hero/ability damage that bypasses the projectile system. */
  Game.prototype.heroStrike = function (hero, creep, base, attackType, quiet) {
    if (!creep || !creep.alive) return null;
    const def = { attackType: attackType || 'spells', targets: ['ground', 'air'], bonusVsArmor: null, line: 'hero' };
    if (!NS.Combat.canHit(def, creep)) return null;
    const res = NS.DamageTable.resolve({
      base, attackType: def.attackType,
      armorType: creep.armorType, armorValue: creep.effectiveArmor()
    });
    creep.takeDamage(res.amount, hero, res, { quiet: !!quiet });
    return res;
  };

  Game.prototype.onDamage = function (creep, amount, source, breakdown, opts) {
    this.stats.damage += amount;
    if (source && source.damageDealt !== undefined) source.damageDealt += amount;
    if (!opts.quiet && this.showDamageNumbers !== false) {
      const color = opts.crit ? '#ff6a4a' : (breakdown && breakdown.typeFactor > 1 ? '#8cff9a'
        : (breakdown && breakdown.typeFactor < 1 ? '#c0c0c0' : '#ffe07a'));
      this.fx.text(creep.x, creep.y, creep.z + 0.8, (opts.crit ? '!' : '') + Math.round(amount), color, !!opts.crit);
    }
  };

  Game.prototype.onPoisonKill = function () {};

  Game.prototype.onCreepKilled = function (creep, source) {
    this.stats.kills++;
    this.gold += creep.bounty;
    this.stats.goldEarned += creep.bounty;
    if (source && source.kills !== undefined) source.kills++;
    this.fx.text(creep.x, creep.y, creep.z + 0.9, '+' + creep.bounty, '#ffd24a');
    this.fx.blood(creep.x, creep.y, creep.z + 0.3, creep.type.trim);
    if (this.hero && creep.boss) this.hero.xp += 0.5;
  };

  Game.prototype.onCreepLeaked = function (creep) {
    const cost = creep.boss ? 4 : this.diff.leak;
    this.lives -= cost;
    this.stats.leaks++;
    this.audio.leak();
    this.log('leak', { name: creep.name, cost });
    if (this.lives <= 0) { this.lives = 0; this.defeat(); }
  };

  Game.prototype.onHeroDeath = function () {
    this.lives -= NS.Config.hero.leakLifeCost;
    this.log('hero_death', {});
    this.audio.leak();
    if (this.lives <= 0) { this.lives = 0; this.defeat(); }
  };

  /* ---------------------------------------------------------------- waves */

  Game.prototype.startWave = function (manual) {
    if (this.status !== 'playing') return false;
    if (this.waveState === 'spawning') return false;
    if (this.wave >= NS.WaveData.count) return false;
    if (manual && this.waveTimer > 0) {
      const bonus = Math.floor(this.waveTimer * 2);
      this.gold += bonus;
      this.stats.goldEarned += bonus;
      if (bonus > 0) this.log('early', { bonus });
    }
    this.wave++;
    const w = NS.WaveData.wave(this.wave);
    this.spawnQueue = [];
    w.groups.forEach((grp) => {
      for (let i = 0; i < grp.count; i++) {
        this.spawnQueue.push({ at: this.time + grp.delay + i * grp.gap, type: grp.type });
      }
    });
    this.spawnQueue.sort((a, b) => a.at - b.at);
    this.waveState = 'spawning';
    this.currentWave = w;
    this.audio.wave();
    if (w.boss) this.audio.boss();
    this.log('wave_start', { wave: this.wave, boss: w.boss, types: NS.WaveData.preview(this.wave) });
    return true;
  };

  Game.prototype.updateWaves = function (dt) {
    if (this.status !== 'playing') return;
    if (this.waveState === 'spawning') {
      while (this.spawnQueue.length && this.spawnQueue[0].at <= this.time) {
        const e = this.spawnQueue.shift();
        this.creeps.push(new NS.Creep(this, e.type, this.wave));
      }
      if (!this.spawnQueue.length && !this.liveCreeps()) this.finishWave();
    } else if (this.waveState === 'prep' || this.waveState === 'clearing') {
      this.waveTimer -= dt;
      if (this.waveTimer <= 0) this.startWave(false);
    }
  };

  Game.prototype.liveCreeps = function () {
    for (let i = 0; i < this.creeps.length; i++) if (this.creeps[i].alive) return true;
    return false;
  };

  Game.prototype.finishWave = function () {
    const w = this.currentWave;
    this.stats.wavesCleared++;
    this.gold += w.clearBonus;
    this.stats.goldEarned += w.clearBonus;
    let lumber = this.wave % NS.Config.lumberEveryWaves === 0 ? 1 : 0;
    if (w.boss) {
      lumber += NS.Config.lumberPerBoss;
      this.interestRate = Math.min(NS.Config.interestCap, this.interestRate + NS.Config.interestStep);
    }
    if (lumber) {
      this.lumber += lumber;
      this.log('lumber', { amount: lumber });
    }
    if (this.hero) {
      this.hero.xp += NS.Config.hero.xpPerWave;
      while (this.hero.xp >= 1 && this.hero.level < NS.Config.hero.maxLevel) {
        this.hero.xp -= 1; this.hero.gainLevel();
      }
    }
    this.log('wave_clear', { wave: this.wave, bonus: w.clearBonus });
    if (this.wave >= NS.WaveData.count) { this.victory(); return; }
    this.waveState = 'clearing';
    this.waveTimer = NS.Config.autoWaveDelay;
  };

  Game.prototype.victory = function () {
    this.status = 'victory';
    this.waveState = 'over';
    this.audio.victory();
    this.log('victory', {});
  };

  Game.prototype.defeat = function () {
    if (this.status !== 'playing') return;
    this.status = 'defeat';
    this.waveState = 'over';
    this.audio.defeat();
    this.log('defeat', {});
  };

  /* ---------------------------------------------------------------- auras */

  Game.prototype.updateAuras = function () {
    for (let i = 0; i < this.creeps.length; i++) this.creeps[i].auraArmor = 0;
    for (let i = 0; i < this.creeps.length; i++) {
      const c = this.creeps[i];
      if (!c.alive || !c.aura) continue;
      const pool = this.creepHash.query(c.x, c.y, c.aura.radius);
      for (let j = 0; j < pool.length; j++) pool[j].auraArmor = Math.max(pool[j].auraArmor, c.aura.armor);
    }

    for (let i = 0; i < this.towers.length; i++) this.towers[i].auraDamageMul = 1;
    const h = this.hero;
    if (h && !h.dead) {
      const dev = h.def.abilities.filter((a) => a.kind === 'aura')[0];
      if (dev) {
        const bonus = 1 + h.scaled(dev, 'towerDamage');
        for (let i = 0; i < this.towers.length; i++) {
          const tw = this.towers[i];
          if (Math.hypot(tw.x - h.x, tw.y - h.y) <= dev.radius) tw.auraDamageMul = bonus;
        }
      }
      const frost = h.def.abilities.filter((a) => a.kind === 'slowAura')[0];
      if (frost) {
        const amount = h.scaled(frost, 'slow');
        const pool = this.creepHash.query(h.x, h.y, frost.radius);
        for (let i = 0; i < pool.length; i++) {
          pool[i].applyEffect({ type: 'slow', amount, duration: 0.6 }, h.atkDef, null);
        }
      }
    }
  };

  /** Bosses and creeps trample a commander standing in their way. */
  Game.prototype.updateCreepMelee = function (dt) {
    const h = this.hero;
    if (!h || h.dead) return;
    const pool = this.creepHash.query(h.x, h.y, 1.4);
    let dmg = 0;
    for (let i = 0; i < pool.length; i++) {
      const c = pool[i];
      if (c.isAirborne()) continue;
      dmg += (5 + this.wave * 1.8) * (c.boss ? 4 : 1);
    }
    if (dmg > 0) h.takeDamage(dmg * dt);
  };

  /* ----------------------------------------------------------------- loop */

  Game.prototype.update = function (dt) {
    if (this.status !== 'playing' && this.waveState === 'over') {
      this.fx.update(dt);
      return;
    }
    this.time += dt;

    // spatial hash over live creeps
    const live = [];
    for (let i = 0; i < this.creeps.length; i++) if (this.creeps[i].alive) live.push(this.creeps[i]);
    this.creepHash.rebuild(live);

    this.auraTimer -= dt;
    if (this.auraTimer <= 0) { this.auraTimer = 0.2; this.updateAuras(); }

    this.updateWaves(dt);

    for (let i = 0; i < this.creeps.length; i++) this.creeps[i].update(dt);
    for (let i = 0; i < this.towers.length; i++) this.towers[i].update(dt);
    if (this.hero) this.hero.update(dt);
    this.updateCreepMelee(dt);

    let w = 0;
    for (let i = 0; i < this.projectiles.length; i++) {
      const p = this.projectiles[i];
      p.update(dt);
      if (!p.dead) this.projectiles[w++] = p;
    }
    this.projectiles.length = w;

    w = 0;
    for (let i = 0; i < this.creeps.length; i++) {
      const c = this.creeps[i];
      if (c.alive || c.dying > 0) this.creeps[w++] = c;
    }
    this.creeps.length = w;

    // interest
    this.interestTimer -= dt;
    if (this.interestTimer <= 0) {
      this.interestTimer += NS.Config.interestPeriod;
      const gain = Math.floor(this.gold * this.interestRate);
      if (gain > 0) {
        this.gold += gain;
        this.stats.goldEarned += gain;
        this.stats.interestPaid += gain;
        this.log('interest', { gain, rate: this.interestRate });
      }
    }

    this.fx.update(dt);
  };

  Game.prototype.log = function (kind, data) {
    this.events.push({ t: this.time, kind, data });
    if (this.events.length > 240) this.events.shift();
    if (this.onLog) this.onLog(kind, data);
  };

  NS.Game = Game;
  NS.NullAudio = NullAudio;
})(typeof globalThis !== 'undefined' ? globalThis : this);
