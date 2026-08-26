/*
 * The simulation. Completely DOM-free and deterministic: given the same seed,
 * difficulty and ordered list of player commands, tick() reproduces the exact
 * same state. The renderer and HUD only read from here.
 */
(function (global) {
  'use strict';

  var Config = global.WC3.Config;
  var Path = global.WC3.Path;
  var RNG = global.WC3.RNG;
  var SpatialHash = global.WC3.SpatialHash;
  var Damage = global.WC3.Damage;
  var TowerData = global.WC3.TowerData;
  var WaveData = global.WC3.WaveData;
  var Entity = global.WC3.Entity;
  var Creep = global.WC3.Creep;
  var Tower = global.WC3.Tower;
  var Projectile = global.WC3.Projectile;
  var Fx = global.WC3.Fx;
  var Hero = global.WC3.Hero;

  var MAX_FX = 420;
  var MAX_LOG = 120;
  var MAX_SFX = 48;

  function Game(opts) {
    opts = opts || {};
    this.difficulty = Config.DIFFICULTY[opts.difficulty] || Config.DIFFICULTY.normal;
    this.seedValue = (opts.seed === undefined) ? Config.seed : opts.seed;
    this.rng = new RNG(this.seedValue);
    this.mapRng = new RNG(this.seedValue ^ 0x5bf03635);

    this.tile = Config.TILE;
    this.gridW = Config.GRID_W;
    this.gridH = Config.GRID_H;
    this.worldW = Config.WORLD_W;
    this.worldH = Config.WORLD_H;

    this.path = Path.fromTiles(Config.PATH_TILES, this.tile);
    this.airPath = Path.fromTiles(Config.AIR_PATH_TILES, this.tile);
    this.portal = { x: (Config.PORTAL_TILE[0] + 0.5) * this.tile, y: (Config.PORTAL_TILE[1] + 0.5) * this.tile };
    this.keep = { x: (Config.KEEP_TILE[0] + 0.5) * this.tile, y: (Config.KEEP_TILE[1] + 0.5) * this.tile };

    this.hash = new SpatialHash(Config.HASH_CELL, this.worldW, this.worldH);

    this.ids = new Entity.IdSource(0);
    this.creepPool = makePool(Creep, 96);
    this.projPool = makePool(Projectile, 128);
    this.fxPool = makePool(Fx, 160);

    this.creeps = [];
    this.towers = [];
    this.projectiles = [];
    this.fx = [];

    this.waves = WaveData.buildWaves();
    this.totalWaves = this.waves.length;

    this.buildGrid();

    // ---- run state ----
    this.state = 'playing';        // playing | victory | defeat
    this.time = 0;
    this.tickCount = 0;
    this.gold = this.difficulty.gold;
    this.lumber = 0;
    this.lives = this.difficulty.lives;
    this.maxLives = this.difficulty.lives;
    this.interestTimer = Config.INTEREST_PERIOD;

    this.waveIndex = 0;            // waves started
    this.wavesCleared = 0;
    this.waveState = 'prep';       // prep | spawning | active
    this.autoTimer = Config.AUTO_WAVE_DELAY;
    this.schedule = [];
    this.schedulePtr = 0;
    this.waveTime = 0;

    this.stats = {
      kills: 0, leaks: 0, goldEarned: 0, goldSpent: 0,
      damageDealt: 0, towersBuilt: 0, shots: 0
    };

    this.logQueue = [];
    this.sfxQueue = [];
    this.events = [];

    this.hero = null;
    if (opts.hero) {
      this.hero = new Hero().init(this.ids.next(), opts.hero,
        this.keep.x - this.tile * 2.2, this.keep.y + this.tile * 1.2);
    }

    this._splashScratch = [];
    this._chainScratch = [];
    this._novaScratch = [];
    this._hitSet = [];
  }

  // One free list per entity type.
  function makePool(ctor, n) {
    return new Entity.Pool(function () { return new ctor(); }, n);
  }

  // ---------------------------------------------------------------- terrain

  Game.prototype.buildGrid = function () {
    var w = this.gridW;
    var h = this.gridH;
    var tile = this.tile;
    this.buildable = new Uint8Array(w * h);
    this.occupied = new Int32Array(w * h);
    this.roadTile = new Uint8Array(w * h);
    this.decor = [];

    var clearance = Config.ROAD_CLEARANCE;
    var i, tx, ty, cx, cy;
    for (ty = 0; ty < h; ty++) {
      for (tx = 0; tx < w; tx++) {
        i = ty * w + tx;
        cx = (tx + 0.5) * tile;
        cy = (ty + 0.5) * tile;
        var dRoad = this.path.distanceTo(cx, cy);
        this.roadTile[i] = dRoad <= Config.ROAD_WIDTH ? 1 : 0;
        var nearPortal = Math.abs(tx - Config.PORTAL_TILE[0]) < 2.2 && Math.abs(ty - Config.PORTAL_TILE[1]) < 2.2;
        var nearKeep = Math.abs(tx - Config.KEEP_TILE[0]) < 2.2 && Math.abs(ty - Config.KEEP_TILE[1]) < 2.2;
        this.buildable[i] = (dRoad > clearance && !nearPortal && !nearKeep) ? 1 : 0;
      }
    }

    // Scatter doodads on buildable ground. They block construction, which is
    // what gives the map its shape; generated from a dedicated rng stream so
    // gameplay randomness never shifts the terrain.
    var kinds = ['tree', 'tree', 'tree', 'rock', 'bush'];
    for (ty = 0; ty < h; ty++) {
      for (tx = 0; tx < w; tx++) {
        i = ty * w + tx;
        if (!this.buildable[i]) continue;
        var edge = (tx <= 0 || ty <= 0 || tx >= w - 1 || ty >= h - 1);
        var p = edge ? 0.62 : 0.085;
        if (this.mapRng.next() < p) {
          this.buildable[i] = 0;
          this.decor.push({
            tx: tx, ty: ty,
            x: (tx + 0.5) * tile + this.mapRng.range(-7, 7),
            y: (ty + 0.5) * tile + this.mapRng.range(-7, 7),
            kind: this.mapRng.pick(kinds),
            variant: this.mapRng.int(0, 2),
            scale: this.mapRng.range(0.85, 1.2)
          });
        }
      }
    }
    this.decor.sort(function (a, b) { return a.y - b.y; });
  };

  Game.prototype.tileIndex = function (tx, ty) {
    if (tx < 0 || ty < 0 || tx >= this.gridW || ty >= this.gridH) return -1;
    return ty * this.gridW + tx;
  };

  Game.prototype.worldToTile = function (wx, wy) {
    return { tx: Math.floor(wx / this.tile), ty: Math.floor(wy / this.tile) };
  };

  Game.prototype.canBuildAt = function (tx, ty) {
    var i = this.tileIndex(tx, ty);
    if (i < 0) return false;
    return this.buildable[i] === 1 && this.occupied[i] === 0;
  };

  Game.prototype.towerAt = function (tx, ty) {
    var i = this.tileIndex(tx, ty);
    if (i < 0 || this.occupied[i] === 0) return null;
    var id = this.occupied[i];
    for (var k = 0; k < this.towers.length; k++) {
      if (this.towers[k].id === id) return this.towers[k];
    }
    return null;
  };

  // ---------------------------------------------------------------- economy

  Game.prototype.addGold = function (amount) {
    this.gold += amount;
    if (amount > 0) this.stats.goldEarned += amount;
  };

  Game.prototype.interestRate = function () {
    var steps = Math.floor(this.wavesCleared / Config.INTEREST_WAVE_STEP);
    return Math.min(Config.INTEREST_CAP, Config.INTEREST_START + Config.INTEREST_STEP * steps);
  };

  Game.prototype.build = function (defId, tx, ty) {
    var def = TowerData.get(defId);
    if (!def || def.tier !== 1) return 'errSpot';
    if (!this.canBuildAt(tx, ty)) return 'errSpot';
    if (this.gold < def.gold) return 'errGold';
    if (this.lumber < def.lumber) return 'errLumber';

    this.gold -= def.gold;
    this.lumber -= def.lumber;
    this.stats.goldSpent += def.gold;
    this.stats.towersBuilt++;

    var t = new Tower().init(this.ids.next(), def, tx, ty, this.tile);
    t.alive = true;
    this.towers.push(t);
    this.occupied[this.tileIndex(tx, ty)] = t.id;

    this.spawnFx('ring', { x: t.x, y: t.y, ttl: 0.45, size: 30, color: def.raceColor });
    this.spawnFx('puff', { x: t.x, y: t.y, ttl: 0.6, size: 26, color: '#d9c9a4' });
    this.playSfx('build');
    this.log('logBuild', { name: nameOf(def) });
    return t;
  };

  Game.prototype.upgrade = function (tower) {
    if (!tower || !tower.alive || !tower.def.next) return 'errSpot';
    var next = TowerData.get(tower.def.next);
    if (this.gold < next.gold) return 'errGold';
    if (this.lumber < next.lumber) return 'errLumber';

    this.gold -= next.gold;
    this.lumber -= next.lumber;
    this.stats.goldSpent += next.gold;
    tower.investedGold += next.gold;
    tower.investedLumber += next.lumber;
    tower.def = next;
    tower.buildAnim = 0.35;
    tower.target = null;
    tower.targetId = 0;

    this.spawnFx('ring', { x: tower.x, y: tower.y, ttl: 0.55, size: 36, color: next.raceAccent });
    this.playSfx('upgrade');
    this.log('logUpgrade', { name: nameOf(next) });
    return tower;
  };

  Game.prototype.sell = function (tower) {
    if (!tower || !tower.alive) return 0;
    var refund = tower.sellValue(Config.SELL_RATE);
    this.addGold(refund);
    this.lumber += tower.investedLumber;
    tower.alive = false;
    var i = this.tileIndex(tower.tx, tower.ty);
    if (i >= 0) this.occupied[i] = 0;
    this.spawnFx('puff', { x: tower.x, y: tower.y, ttl: 0.6, size: 30, color: '#c9b487' });
    this.playSfx('sell');
    this.log('logSell', { name: nameOf(tower.def), gold: refund });
    return refund;
  };

  // ------------------------------------------------------------------ waves

  Game.prototype.currentWave = function () {
    return this.waves[Math.min(this.waveIndex, this.totalWaves - 1)];
  };

  Game.prototype.nextWavePreview = function () {
    return this.waves[Math.min(this.waveIndex, this.totalWaves - 1)];
  };

  Game.prototype.canCallWave = function () {
    if (this.state !== 'playing') return false;
    if (this.waveIndex >= this.totalWaves) return false;
    return this.waveState === 'prep' ||
      (this.waveState === 'active' && this.schedulePtr >= this.schedule.length);
  };

  Game.prototype.callWave = function () {
    if (!this.canCallWave()) return false;
    var bonus = Math.floor(Config.EARLY_CALL_BONUS *
      (this.waveState === 'prep' ? this.autoTimer : Config.AUTO_WAVE_DELAY));
    if (bonus > 0) {
      this.addGold(bonus);
      this.log('logEarly', { gold: bonus });
    }
    this.startWave();
    return true;
  };

  Game.prototype.startWave = function () {
    if (this.waveIndex >= this.totalWaves) return;
    var wave = this.waves[this.waveIndex];
    this.waveIndex++;
    this.waveTime = 0;
    this.waveState = 'spawning';

    var sched = [];
    for (var g = 0; g < wave.entries.length; g++) {
      var entry = wave.entries[g];
      var t = 0.35 + g * 0.7;
      for (var i = 0; i < entry.count; i++) {
        sched.push({ time: t, entry: entry });
        t += entry.interval;
      }
    }
    sched.sort(function (a, b) { return a.time - b.time; });
    this.schedule = sched;
    this.schedulePtr = 0;

    var lead = wave.entries[0];
    this.log(wave.boss ? 'logBoss' : 'logWaveIn', {
      n: wave.wave,
      name: nameOf(lead.def)
    });
    this.playSfx(wave.boss ? 'bosshorn' : 'wavehorn');
    this.pushEvent('wave', { wave: wave.wave, boss: wave.boss });
  };

  Game.prototype.spawnCreep = function (entry) {
    if (this.creeps.length >= Config.MAX_CREEPS_SOFT) return null;
    var c = this.creepPool.obtain();
    c.init(this.ids.next(), entry, this.waveIndex, this.difficulty.hp,
      this.difficulty.speed, entry.def.flying ? this.airPath : this.path);
    this.creeps.push(c);
    return c;
  };

  Game.prototype.updateWaves = function (dt) {
    if (this.waveState === 'prep') {
      this.autoTimer -= dt;
      if (this.autoTimer <= 0) this.startWave();
      return;
    }

    this.waveTime += dt;
    if (this.waveState === 'spawning') {
      while (this.schedulePtr < this.schedule.length &&
             this.schedule[this.schedulePtr].time <= this.waveTime) {
        this.spawnCreep(this.schedule[this.schedulePtr].entry);
        this.schedulePtr++;
      }
      if (this.schedulePtr >= this.schedule.length) this.waveState = 'active';
    }

    if (this.waveState === 'active' && this.creeps.length === 0) {
      this.onWaveCleared();
    }
  };

  Game.prototype.onWaveCleared = function () {
    this.wavesCleared = this.waveIndex;
    if (this.wavesCleared % Config.LUMBER_EVERY === 0) {
      this.lumber += 1;
      this.log('logLumber', { n: this.wavesCleared });
    }
    if (this.wavesCleared >= this.totalWaves) {
      this.finish('victory');
      return;
    }
    this.waveState = 'prep';
    this.autoTimer = Config.AUTO_WAVE_DELAY;
  };

  Game.prototype.finish = function (result) {
    if (this.state !== 'playing') return;
    this.state = result;
    this.log(result === 'victory' ? 'logVictory' : 'logDefeat', { n: this.waveIndex });
    this.playSfx(result === 'victory' ? 'victory' : 'defeat');
    this.pushEvent(result, { wave: this.waveIndex });
  };

  Game.prototype.surrender = function () {
    this.finish('defeat');
  };

  // ----------------------------------------------------------------- combat

  Game.prototype.spawnProjectile = function (from, target, aim, payload, projDef) {
    var p = this.projPool.obtain();
    p.init(this.ids.next(), from, target, aim, payload, projDef);
    this.projectiles.push(p);
    this.stats.shots++;
    return p;
  };

  Game.prototype.despawnProjectile = function (p, hit) {
    if (hit && p.payload) this.resolveHit(p.payload, p.x, p.y, p.target);
    p.alive = false;
  };

  Game.prototype.resolveHit = function (payload, x, y, target) {
    var splash = payload.splash;
    if (splash) {
      var list = this.hash.query(x, y, splash.radius, this._splashScratch);
      for (var i = 0; i < list.length; i++) {
        var c = list[i];
        if (!c.alive) continue;
        if (c.flying && !Damage.canHitAir(payload.attackType)) continue;
        var dx = c.x - x;
        var dy = c.y - y;
        var d = Math.sqrt(dx * dx + dy * dy);
        var f = splash.far;
        if (d <= splash.radius * 0.34) f = splash.near;
        else if (d <= splash.radius * 0.67) f = splash.mid;
        this.damageCreep(c, payload.damage * f, payload, c === target);
      }
      this.spawnFx('blast', { x: x, y: y, ttl: 0.35, size: splash.radius, color: payload.color });
    } else if (target && target.alive) {
      this.damageCreep(target, payload.damage, payload, true);
      this.spawnFx('spark', {
        x: x, y: y, z: target.z + 8, ttl: 0.28, size: 6, color: payload.color,
        vx: this.rng.range(-40, 40), vy: this.rng.range(-40, 40), vz: this.rng.range(40, 120)
      });
    }
  };

  Game.prototype.resolveChain = function (tower, target, payload, effect) {
    var hit = this._hitSet;
    hit.length = 0;
    var current = target;
    var damage = payload.damage;
    var px = tower.x;
    var py = tower.y;
    var jumps = effect.jumps;

    for (var j = 0; j <= jumps && current; j++) {
      this.spawnFx('bolt', {
        ax: px, ay: py, bx: current.x, by: current.y,
        ttl: 0.18, color: '#bfe9ff', seed: this.rng.int(1, 9999), z: 28
      });
      this.damageCreep(current, damage, payload, j === 0);
      hit.push(current.id);
      px = current.x;
      py = current.y;
      damage *= effect.falloff;

      var list = this.hash.query(px, py, effect.radius, this._chainScratch);
      var best = null;
      var bestD = Infinity;
      for (var i = 0; i < list.length; i++) {
        var c = list[i];
        if (!c.alive || hit.indexOf(c.id) >= 0) continue;
        if (c.flying && !Damage.canHitAir(payload.attackType)) continue;
        var dx = c.x - px;
        var dy = c.y - py;
        var d2 = dx * dx + dy * dy;
        if (d2 < bestD || (d2 === bestD && best && c.id < best.id)) { bestD = d2; best = c; }
      }
      current = best;
    }
  };

  Game.prototype.resolveHeroNova = function (hero, radius, damage) {
    var list = this.hash.query(hero.x, hero.y, radius, this._novaScratch);
    var payload = { attackType: 'spells', heroId: hero.id, color: hero.def.color, damage: damage };
    for (var i = 0; i < list.length; i++) {
      var c = list[i];
      if (!c.alive) continue;
      this.damageCreep(c, damage, payload, false);
      c.applyRoot(0.7);
    }
    this.spawnFx('blast', { x: hero.x, y: hero.y, ttl: 0.45, size: radius, color: hero.def.color });
    this.spawnFx('ring', { x: hero.x, y: hero.y, ttl: 0.5, size: radius, color: '#fff2c0' });
    this.playSfx('nova');
  };

  /** Full damage pipeline for one creep. Returns damage actually dealt. */
  Game.prototype.damageCreep = function (creep, raw, payload, isPrimary) {
    if (!creep.alive || raw <= 0) return 0;
    var bonus = 1;
    if (payload.bonus && payload.bonus[creep.armorType]) bonus = payload.bonus[creep.armorType];
    var dmg = Damage.computeDamage(raw * bonus, payload.attackType, creep.armorType, creep.armorValue);
    var dealt = creep.hurt(dmg);
    if (dealt <= 0) return 0;

    this.stats.damageDealt += dealt;
    var tower = null;
    if (payload.towerId > 0) {
      tower = this.findTower(payload.towerId);
      if (tower) tower.damageDealt += dealt;
    }
    if (payload.heroId && this.hero) this.hero.damageDealt += dealt;

    var effect = payload.effect;
    if (effect && !creep.spellImmune) {
      if (effect.kind === 'slow') creep.applySlow(effect.factor, effect.duration);
      else if (effect.kind === 'poison') creep.applyPoison(effect.dps, effect.duration);
      else if (effect.kind === 'root' && isPrimary && this.rng.next() < effect.chance) {
        creep.applyRoot(effect.duration);
      }
    }

    this.spawnFx('dmgtext', {
      x: creep.x, y: creep.y, z: creep.z + creep.radius + 12,
      ttl: Config.FLOAT_TEXT_TTL, vz: 44, vx: this.rng.range(-8, 8),
      text: String(Math.round(dealt)),
      color: payload.color || '#ffffff', size: creep.boss ? 15 : 12
    });

    if (creep.hp <= 0) this.killCreep(creep, tower);
    return dealt;
  };

  Game.prototype.findTower = function (id) {
    for (var i = 0; i < this.towers.length; i++) {
      if (this.towers[i].id === id) return this.towers[i];
    }
    return null;
  };

  Game.prototype.notePoisonDamage = function (creep, amount) {
    this.stats.damageDealt += amount;
    void creep;
  };

  Game.prototype.killCreep = function (creep, tower) {
    if (!creep.alive) return;
    creep.alive = false;
    creep.hp = 0;
    this.stats.kills++;
    var bounty = Math.max(1, Math.round(creep.bounty * this.difficulty.bounty));
    this.addGold(bounty);
    if (tower) tower.kills++;
    if (this.hero) {
      if (this.hero.addXp(creep.boss ? 12 : 1)) {
        this.spawnFx('ring', { x: this.hero.x, y: this.hero.y, ttl: 0.7, size: 40, color: '#ffe9a0' });
        this.playSfx('levelup');
      }
    }

    this.spawnFx('goldtext', {
      x: creep.x, y: creep.y, z: creep.z + creep.radius + 18,
      ttl: 1.05, vz: 40, text: '+' + bounty, color: '#ffd76a', size: creep.boss ? 18 : 13
    });
    this.spawnFx('corpse', {
      x: creep.x, y: creep.y, z: creep.z, ttl: creep.boss ? 2.4 : 1.4,
      size: creep.radius, color: creep.def.color, angle: creep.angle
    });
    var n = creep.boss ? 10 : 4;
    for (var i = 0; i < n; i++) {
      this.spawnFx('gib', {
        x: creep.x, y: creep.y, z: creep.z + 6, ttl: this.rng.range(0.4, 0.85),
        size: this.rng.range(2, 5), color: creep.def.color,
        vx: this.rng.range(-90, 90), vy: this.rng.range(-70, 70), vz: this.rng.range(60, 190)
      });
    }
    this.playSfx(creep.boss ? 'bossdie' : 'die');
  };

  Game.prototype.leakCreep = function (creep) {
    if (!creep.alive) return;
    creep.alive = false;
    var cost = creep.boss ? 3 : 1;
    this.lives -= cost;
    this.stats.leaks++;
    this.spawnFx('leak', { x: this.keep.x, y: this.keep.y, ttl: 0.8, size: 60, color: '#ff6a5a' });
    this.log('logLeak', { name: nameOf(creep.def), lives: Math.max(0, this.lives) });
    this.playSfx('leak');
    this.pushEvent('leak', { cost: cost });
    if (this.lives <= 0) {
      this.lives = 0;
      this.finish('defeat');
    }
  };

  // --------------------------------------------------------------------- fx

  Game.prototype.spawnFx = function (kind, opts) {
    if (this.fx.length >= MAX_FX) return null;
    var f = this.fxPool.obtain();
    f.init(kind, opts);
    this.fx.push(f);
    return f;
  };

  Game.prototype.playSfx = function (name) {
    if (this.sfxQueue.length < MAX_SFX) this.sfxQueue.push(name);
  };

  Game.prototype.drainSfx = function () {
    var q = this.sfxQueue;
    this.sfxQueue = [];
    return q;
  };

  Game.prototype.log = function (key, params) {
    this.logQueue.push({ key: key, params: params || null, time: this.time });
    if (this.logQueue.length > MAX_LOG) this.logQueue.shift();
  };

  Game.prototype.drainLog = function () {
    var q = this.logQueue;
    this.logQueue = [];
    return q;
  };

  Game.prototype.pushEvent = function (kind, data) {
    this.events.push({ kind: kind, data: data, time: this.time });
    if (this.events.length > 64) this.events.shift();
  };

  Game.prototype.drainEvents = function () {
    var e = this.events;
    this.events = [];
    return e;
  };

  // ------------------------------------------------------------------- tick

  Game.prototype.tick = function (dt) {
    this.tickCount++;
    var i;

    if (this.state !== 'playing') {
      for (i = 0; i < this.fx.length; i++) this.fx[i].update(dt);
      this.fxPool.sweep(this.fx);
      return;
    }

    this.time += dt;

    this.interestTimer -= dt;
    if (this.interestTimer <= 0) {
      this.interestTimer += Config.INTEREST_PERIOD;
      var rate = this.interestRate();
      var gain = Math.floor(this.gold * rate);
      if (gain > 0) {
        this.addGold(gain);
        this.log('logInterest', { gold: gain, rate: Math.round(rate * 100) });
      }
    }

    this.updateWaves(dt);

    this.hash.rebuild(this.creeps);

    for (i = 0; i < this.towers.length; i++) this.towers[i].update(dt, this);
    if (this.hero) this.hero.update(dt, this);
    for (i = 0; i < this.creeps.length; i++) {
      if (this.creeps[i].alive) this.creeps[i].update(dt, this);
    }
    for (i = 0; i < this.projectiles.length; i++) {
      if (this.projectiles[i].alive) this.projectiles[i].update(dt, this);
    }
    for (i = 0; i < this.fx.length; i++) this.fx[i].update(dt);

    this.creepPool.sweep(this.creeps);
    this.projPool.sweep(this.projectiles);
    this.fxPool.sweep(this.fx);
    Entity.compact(this.towers);
  };

  /** Stable hash of every simulation-visible value. Used by determinism tests. */
  Game.prototype.checksum = function () {
    var h = 2166136261 >>> 0;
    function mix(v) {
      h ^= (v | 0);
      h = Math.imul(h, 16777619) >>> 0;
    }
    mix(this.lives);
    mix(Math.round(this.gold));
    mix(this.lumber);
    mix(this.waveIndex);
    mix(this.wavesCleared);
    mix(this.stats.kills);
    mix(this.stats.leaks);
    mix(Math.round(this.stats.damageDealt));
    mix(this.creeps.length);
    mix(this.projectiles.length);
    mix(this.towers.length);
    var i;
    for (i = 0; i < this.creeps.length; i++) {
      var c = this.creeps[i];
      mix(c.id);
      mix(Math.round(c.x * 16));
      mix(Math.round(c.y * 16));
      mix(Math.round(c.hp * 8));
      mix(Math.round(c.slowFactor * 100));
    }
    for (i = 0; i < this.towers.length; i++) {
      var t = this.towers[i];
      mix(t.id);
      mix(Math.round(t.cooldownTimer * 1000));
      mix(Math.round(t.damageDealt));
      mix(t.kills);
    }
    for (i = 0; i < this.projectiles.length; i++) {
      var p = this.projectiles[i];
      mix(p.id);
      mix(Math.round(p.x * 16));
      mix(Math.round(p.y * 16));
    }
    mix(this.rng.state);
    mix(this.rng.calls);
    return h >>> 0;
  };

  function nameOf(def) {
    var I18N = global.WC3.I18N;
    return I18N ? I18N.name(def) : (def.nameEn || def.nameZh);
  }

  global.WC3.Game = Game;

  if (typeof module === 'object' && module.exports) module.exports = Game;
})(typeof globalThis !== 'undefined' ? globalThis : this);
