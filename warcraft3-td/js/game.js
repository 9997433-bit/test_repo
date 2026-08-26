(function (root) {
  "use strict";
  const S = root.SimCore;
  const D = root.GameData;

  let _id = 1;
  function nid() { return _id++; }

  const HERO_SOURCE = { kind: "hero", canHitFlying: true };
  const HERO_MANA_REGEN = 6;
  const HERO_HP_REGEN = 3;
  const HERO_MELEE_RANGE = 30;
  const HERO_DOWN_TIME = 22;
  const HERO_HIT_FLASH = 0.16;
  const HERO_HIT_FX_GAP = 0.12;

  /* Effect kinds render.js knows how to paint. Anything else is dropped. */
  const FX_KINDS = { spark: true, ring: true, text: true };
  /* Transient effects are capped so a long fight cannot grow the list forever. */
  const FX_SOFT_CAP = 640;
  const FX_TRIM_TO = 480;

  function Game(opts) {
    opts = opts || {};
    this.seed = opts.seed || 1337;
    this.rng = S.mulberry32(this.seed);
    this.difficulty = opts.difficulty || "normal";
    this.lang = opts.lang || "zh";
    this.heroId = opts.heroId || "paladin";
    this.settings = {
      showRange: true,
      dmgNumbers: true,
      volume: 0.55,
    };
    this.eco = S.createEconomy(this.difficulty);
    this.gold = this.eco.gold;
    this.lumber = 0;
    this.lives = this.eco.lives;
    this.interestRate = 0.02;
    this.interestAcc = 0;
    this.goldEarned = 0;
    this.lumberSpent = 0;
    this.tech = { interest: 0, armory: 0, sentry: 0, repair: 0 };
    this.towerDamageMul = 1;
    this.towerRangeMul = 1;
    this.mapW = D.MAP_W;
    this.mapH = D.MAP_H;
    this.tile = D.TILE;
    this.path = D.pathPoints();
    this.pathBlocked = D.pathSet();
    this.waves = D.makeWaves();
    this.waveIndex = 0;
    this.waveSpawned = 0;
    this.waveAcc = 0;
    this.autoWave = 3;
    this.betweenWaves = true;
    this.creeps = [];
    this.towers = [];
    this.projectiles = [];
    this.fx = [];
    this.occupied = Object.create(null);
    this.hash = new S.SpatialHash(64);
    this.time = 0;
    this.paused = false;
    this.speed = 1;
    this.ended = null;
    this.selected = null;
    this.buildId = null;
    this.buildGhost = null;
    this.cam = { x: this.mapW * this.tile / 2, y: this.mapH * this.tile / 2, z: 1 };
    this.log = [];
    this.doodads = this._scatterDoodads();
    this.hero = this._spawnHero();
    this.audio = opts.audio || null;
    this.headless = !!opts.headless;
    this.bossAlert = null;
    this._bossCreeps = [];
    this._frostSources = [];
    this._portalAcc = 0;
    this._warnedBoss = -1;
    this.announce(this.msg("opening", { name: this.waves[0].name[this.lang] || this.waves[0].name.zh }));
  }

  Game.prototype.t = function (key) {
    const pack = D.STR[this.lang] || D.STR.zh;
    return pack[key] || key;
  };

  Game.prototype.msg = function (key, params) {
    return D.msg(key, this.lang, params);
  };

  Game.prototype._scatterDoodads = function () {
    const out = [];
    const rng = this.rng;
    for (let i = 0; i < 46; i++) {
      const tx = (rng() * this.mapW) | 0;
      const ty = (rng() * this.mapH) | 0;
      if (this.pathBlocked[tx + "," + ty]) continue;
      if (tx < 1 || ty < 1) continue;
      const kind = rng() < 0.65 ? "tree" : rng() < 0.5 ? "rock" : "banner";
      out.push({
        kind: kind,
        x: tx * this.tile + 24,
        y: ty * this.tile + 24,
        tone: kind === "tree" ? (rng() < 0.5 ? "#2e6b2a" : "#1f4d28") : "#8b1e1e",
      });
    }
    return out;
  };

  Game.prototype._heroHome = function () {
    const keep = this.path[this.path.length - 1];
    return { x: keep.x - 40, y: keep.y - 30 };
  };

  Game.prototype._spawnHero = function () {
    const def = D.heroById(this.heroId) || D.HEROES[0];
    const home = this._heroHome();
    return {
      id: nid(),
      kind: "hero",
      def: def,
      x: home.x,
      y: home.y,
      px: home.x,
      py: home.y,
      tx: home.x,
      ty: home.y,
      hp: def.hp,
      maxHp: def.hp,
      mana: def.mana,
      maxMana: def.mana,
      cd: { q: 0, w: 0, e: 0 },
      shield: 0,
      critUntil: 0,
      cleaveUntil: 0,
      imagesUntil: 0,
      metaUntil: 0,
      frenzyUntil: 0,
      invulnUntil: 0,
      auraBoostUntil: 0,
      speedBoost: 0,
      ambush: false,
      immolation: false,
      attackCd: 0,
      dead: false,
      respawn: 0,
      _hitFlash: 0,
      _hitFxAt: -1,
    };
  };

  Game.prototype.announce = function (msg) {
    this.log.unshift({ t: this.time, msg: msg });
    if (this.log.length > 30) this.log.pop();
  };

  /* ------------------------------------------------------------------ *
   * FX events
   *
   * Every visual beat the sim produces goes through fxEmit and lands in
   * `game.fx` as one of the three kinds render.js already paints: spark,
   * ring or text. The extra `name` field tags which gameplay moment fired
   * the effect, so the renderer can give each moment its own look and can
   * safely no-op on names it does not recognise. Optional fields on every
   * entry: color, r, banner, text, vy.
   * ------------------------------------------------------------------ */

  Game.prototype.fxEmit = function (name, kind, x, y, opts) {
    if (!FX_KINDS[kind]) return null;
    opts = opts || {};
    const life = opts.life || 0.3;
    const f = {
      kind: kind,
      name: name,
      x: x,
      y: y,
      color: opts.color || "#ffe082",
      life: life,
      max: life,
      r: opts.r || 0,
    };
    if (opts.text != null) f.text = opts.text;
    if (opts.vy) f.vy = opts.vy;
    if (opts.banner) f.banner = true;
    return this._pushFx(f);
  };

  /** Expanding ring plus a spark at the same spot — the generic "pop". */
  Game.prototype.fxBurst = function (name, x, y, opts) {
    opts = opts || {};
    const life = opts.life || 0.4;
    this.fxEmit(name, "ring", x, y, { color: opts.ring || opts.color, life: life, r: opts.r || 18 });
    return this.fxEmit(name, "spark", x, y, { color: opts.color, life: life * 0.7, r: opts.sparkR || 5 });
  };

  Game.prototype._pushFx = function (f) {
    this.fx.push(f);
    if (this.fx.length > FX_SOFT_CAP) this._trimFx();
    return f;
  };

  /** Drop the oldest transient effects; banners always survive a trim. */
  Game.prototype._trimFx = function () {
    const fx = this.fx;
    let drop = fx.length - FX_TRIM_TO;
    const kept = [];
    for (let i = 0; i < fx.length; i++) {
      if (drop > 0 && !fx[i].banner) { drop -= 1; continue; }
      kept.push(fx[i]);
    }
    this.fx = kept;
  };

  /** Log line plus a large floating banner drawn over the middle of the lane. */
  Game.prototype.banner = function (msg, color) {
    this.announce(msg);
    return this.fxEmit("banner", "text", this.mapW * this.tile * 0.5 - 150, this.mapH * this.tile * 0.42, {
      text: msg,
      color: color || "#ffe082",
      life: 3.4,
      vy: -8,
      banner: true,
    });
  };

  Game.prototype.float = function (x, y, text, color) {
    return this.fxEmit("float", "text", x, y, { text: text, color: color || "#fff", life: 0.9, vy: -22 });
  };

  Game.prototype.spark = function (x, y, color, r, life) {
    return this.fxEmit("spark", "spark", x, y, { color: color || "#ffe082", r: r || 4, life: life || 0.25 });
  };

  Game.prototype.ring = function (x, y, color, life, r) {
    return this.fxEmit("ring", "ring", x, y, { color: color || "#fff", life: life || 0.4, r: r || 20 });
  };

  Game.prototype.tileAt = function (x, y) {
    return { tx: Math.floor(x / this.tile), ty: Math.floor(y / this.tile) };
  };

  Game.prototype.canBuildAt = function (x, y) {
    const t = this.tileAt(x, y);
    if (t.tx < 0 || t.ty < 0 || t.tx >= this.mapW || t.ty >= this.mapH) return false;
    if (this.pathBlocked[t.tx + "," + t.ty]) return false;
    if (this.occupied[t.tx + "," + t.ty]) return false;
    return true;
  };

  Game.prototype.tryBuild = function (id, x, y) {
    const def = D.towerById(id);
    if (!def) return false;
    const cost = def.cost[0];
    if (this.gold < cost) return false;
    if (!this.canBuildAt(x, y)) return false;
    const t = this.tileAt(x, y);
    const tower = {
      id: nid(),
      kind: "tower",
      def: def,
      race: def.race,
      x: t.tx * this.tile + this.tile / 2,
      y: t.ty * this.tile + this.tile / 2,
      tx: t.tx,
      ty: t.ty,
      tier: 1,
      invested: cost,
      range: def.range[0],
      dmg: def.dmg[0],
      rate: def.rate[0],
      attackType: def.attackType,
      canHitFlying: def.canHitFlying,
      splash: def.splash || 0,
      chain: def.chain || 0,
      slow: def.slow || 0,
      poison: def.poison || 0,
      root: def.root || 0,
      cd: 0,
      stun: 0,
    };
    this.gold -= cost;
    this.occupied[t.tx + "," + t.ty] = tower.id;
    this.towers.push(tower);
    this.selected = tower;
    this.fxBurst("build", tower.x, tower.y, { color: def.color, r: 22, life: 0.5, sparkR: 6 });
    this.float(tower.x, tower.y - 30, "-" + cost, "#ffcc80");
    if (this.audio) this.audio.build();
    return tower;
  };

  Game.prototype.upgradeSelected = function () {
    const t = this.selected;
    if (!t || t.kind !== "tower" || t.temp) return false;
    if (t.tier >= 3) return false;
    const cost = t.def.cost[t.tier];
    if (this.gold < cost) return false;
    this.gold -= cost;
    t.invested += cost;
    t.tier += 1;
    t.range = t.def.range[t.tier - 1];
    t.dmg = t.def.dmg[t.tier - 1];
    t.rate = t.def.rate[t.tier - 1];
    this.fxBurst("upgrade", t.x, t.y, { color: t.def.color, ring: "#ffe082", r: 26, life: 0.65, sparkR: 7 });
    this.float(t.x, t.y - 34, "T" + t.tier, "#ffe082");
    if (this.audio) this.audio.build();
    return true;
  };

  Game.prototype.sellSelected = function () {
    const t = this.selected;
    if (!t || t.kind !== "tower") return false;
    const refund = S.sellRefund(t.invested, 0.75);
    this.gold += refund;
    delete this.occupied[t.tx + "," + t.ty];
    this.towers = this.towers.filter(function (x) { return x !== t; });
    this.selected = null;
    if (this.audio) this.audio.sell();
    this.fxBurst("sell", t.x, t.y, { color: "#bcaaa4", ring: "#ffd54f", r: 20, life: 0.45 });
    this.float(t.x, t.y, "+" + refund, "#ffe082");
    return refund;
  };

  /* ------------------------------------------------------------------ *
   * Lumber economy
   * ------------------------------------------------------------------ */

  Game.prototype.lumberUpgradeState = function (id) {
    const def = D.lumberUpgradeById(id);
    if (!def) return null;
    const level = this.tech[id] || 0;
    return {
      def: def,
      level: level,
      maxed: level >= def.max,
      cost: def.cost,
      affordable: this.lumber >= def.cost && level < def.max,
    };
  };

  /** Spend lumber on a permanent upgrade (1 lumber = +2% interest, etc.). */
  Game.prototype.spendLumber = function (id) {
    const def = D.lumberUpgradeById(id);
    if (!def) return false;
    const level = this.tech[id] || 0;
    if (level >= def.max || this.lumber < def.cost) {
      this.announce(this.msg("lumberDenied", { name: def.name[this.lang] || def.name.zh }));
      return false;
    }
    this.lumber -= def.cost;
    this.lumberSpent += def.cost;
    this.tech[id] = level + 1;
    let value = "";
    if (id === "interest") {
      this.interestRate = S.nextInterestRate(this.interestRate, 1);
      value = Math.round(this.interestRate * 100) + "%";
    } else if (id === "armory") {
      this.towerDamageMul = 1 + this.tech.armory * 0.08;
      value = "+" + Math.round((this.towerDamageMul - 1) * 100) + "%";
    } else if (id === "sentry") {
      this.towerRangeMul = 1 + this.tech.sentry * 0.08;
      value = "+" + Math.round((this.towerRangeMul - 1) * 100) + "%";
    } else if (id === "repair") {
      this.lives += 3;
      value = this.lives;
    }
    const effect = D.fmt(def.effect[this.lang] || def.effect.zh, { value: value });
    this.announce(this.msg("lumberBuy", {
      name: def.name[this.lang] || def.name.zh,
      level: this.tech[id],
      effect: effect,
    }));
    if (this.audio) this.audio.build();
    return true;
  };

  /* ------------------------------------------------------------------ *
   * Waves
   * ------------------------------------------------------------------ */

  Game.prototype.waveLabel = function (wave) {
    if (!wave) return "";
    return (wave.bossName ? (wave.bossName[this.lang] || wave.bossName.zh) : (wave.name[this.lang] || wave.name.zh));
  };

  /** Structured preview of an upcoming wave for the HUD / log. */
  Game.prototype.wavePreview = function (offset) {
    const wave = this.waves[this.waveIndex + (offset || 0)];
    if (!wave) return null;
    return {
      index: wave.index,
      name: this.waveLabel(wave),
      count: wave.count,
      boss: wave.boss,
      flying: wave.flying,
      armorType: wave.armorType,
      armor: D.armorLabel(wave.armorType, this.lang),
      counter: D.counterHint(wave.armorType, this.lang),
      spellImmune: !!wave.spellImmune,
      abilities: wave.abilities || [],
      abilityText: D.abilityText(wave.abilities, this.lang),
      hp: S.waveHp(wave.hp, this.difficulty),
    };
  };

  Game.prototype._flyTag = function (wave) {
    if (!wave.flying) return "";
    return this.lang === "zh" ? " · 飞行" : " · flying";
  };

  Game.prototype.startNextWave = function () {
    if (this.ended) return;
    if (!this.betweenWaves) return;
    if (this.waveIndex >= this.waves.length) return;
    this.betweenWaves = false;
    this.waveSpawned = 0;
    const w = this.waves[this.waveIndex];
    this.waveAcc = -(w.spawnDelay || 0);
    this.bossAlert = null;
    this.announce(this.msg("waveStart", {
      n: w.index,
      total: this.waves.length,
      name: this.waveLabel(w),
      count: w.count,
      armor: D.armorLabel(w.armorType, this.lang),
      fly: this._flyTag(w),
      counter: D.counterHint(w.armorType, this.lang),
    }));
    if (w.boss) {
      this.banner(this.msg("bossWave", {
        name: this.waveLabel(w),
        hp: S.waveHp(w.hp, this.difficulty),
        armor: D.armorLabel(w.armorType, this.lang),
        ability: D.abilityText(w.abilities, this.lang),
      }), "#ff8a65");
      const portal = this.path[0];
      this.fxEmit("bossPortal", "ring", portal.x, portal.y, { color: "#ff5252", life: 1.2, r: 48 });
    }
    if (this.audio) this.audio.wave();
  };

  Game.prototype._spawnCreep = function (wave) {
    const start = this.path[0];
    const hp = S.waveHp(wave.hp, this.difficulty);
    const bounty = S.waveBounty(wave.bounty, this.difficulty);
    const creep = {
      id: nid(),
      kind: "creep",
      wave: wave.index,
      name: wave.boss && wave.bossName ? wave.bossName : wave.name,
      x: start.x,
      y: start.y,
      px: start.x,
      py: start.y,
      dist: 0,
      hp: hp,
      maxHp: hp,
      bounty: bounty,
      armor: wave.armor,
      armorBonus: 0,
      armorType: wave.armorType,
      flying: wave.flying,
      spellImmune: !!wave.spellImmune,
      speed: wave.speed * (wave.flying ? 1.05 : 1),
      color: wave.color,
      boss: wave.boss,
      slow: 0,
      root: 0,
      poison: 0,
      shred: 0,
      shredAmt: 0,
      abilities: wave.abilities || [],
      castCd: 0,
      warned: false,
      enraged: false,
    };
    if (wave.boss) {
      const stomp = this._abilityDef(creep, "stomp");
      creep.castCd = stomp ? stomp.cd : 0;
      this.banner(this.msg("bossSpawn", { name: this.waveLabel(wave) }), "#ff8a65");
      this.fxBurst("bossSpawn", start.x, start.y, { color: wave.color, ring: "#ff5252", life: 0.8, r: 34, sparkR: 8 });
      if (this.audio) this.audio.wave();
    }
    this.creeps.push(creep);
    return creep;
  };

  Game.prototype._abilityDef = function (creep, id) {
    if (!creep.abilities || creep.abilities.indexOf(id) < 0) return null;
    return D.BOSS_ABILITIES[id] || null;
  };

  Game.prototype._rebuildHash = function () {
    this.hash.clear();
    for (let i = 0; i < this.creeps.length; i++) {
      const c = this.creeps[i];
      if (c.hp > 0) this.hash.insert(c);
    }
  };

  Game.prototype._effectiveArmor = function (creep) {
    let armor = creep.armor + (creep.armorBonus || 0);
    if (creep.shred > 0) armor -= creep.shredAmt || 0;
    return armor;
  };

  Game.prototype._hitCreep = function (creep, base, attackType, source) {
    const res = S.applyHit(base, attackType, creep.armorType, this._effectiveArmor(creep), {
      flying: creep.flying,
      canHitFlying: !source || source.canHitFlying !== false || source.kind === "hero",
      spellImmune: creep.spellImmune,
    });
    if (res.damage <= 0) return res;
    creep.hp -= res.damage;
    creep._hitFlash = 0.16;
    if (this.settings.dmgNumbers) {
      this.float(creep.x, creep.y - 12, Math.round(res.damage).toString(), res.multiplier >= 1.4 ? "#ffee66" : "#ffffff");
    }
    this.fxEmit("impact", "spark", creep.x, creep.y - 6, {
      color: source && source.def && source.def.color ? source.def.color : "#ffe082",
      r: res.multiplier >= 1.4 ? 6 : 4,
      life: 0.25,
    });
    if (source) {
      if (source.slow) creep.slow = Math.max(creep.slow, 1.6);
      if (source.poison) creep.poison = Math.max(creep.poison, 2.4);
      if (source.root) creep.root = Math.max(creep.root, source.root);
    }
    if (creep.hp <= 0) this._killCreep(creep);
    return res;
  };

  Game.prototype._killCreep = function (creep) {
    if (creep._dead) return;
    creep._dead = true;
    creep.hp = 0;
    this.gold += creep.bounty;
    this.goldEarned += creep.bounty;
    this.float(creep.x, creep.y, "+" + creep.bounty, "#ffd54f");
    const tone = creep.color || "#cfd8dc";
    this.fxEmit("kill", "ring", creep.x, creep.y, {
      color: creep.boss ? "#ff8a65" : "#cfd8dc",
      life: creep.boss ? 0.9 : 0.35,
      r: creep.boss ? 36 : 14,
    });
    this.fxEmit("kill", "spark", creep.x, creep.y - 4, {
      color: tone,
      life: creep.boss ? 0.5 : 0.3,
      r: creep.boss ? 9 : 5,
    });
    if (creep.boss) {
      this.banner(this.lang === "zh"
        ? "★ " + (creep.name[this.lang] || creep.name.zh) + " 已被击杀！"
        : "★ " + (creep.name[this.lang] || creep.name.en) + " has fallen!", "#aed581");
    }
  };

  Game.prototype._leak = function (creep) {
    if (creep._dead) return;
    creep._dead = true;
    creep.hp = 0;
    const livesBefore = this.lives;
    this.lives = S.livesAfterLeak(this.lives, 1, creep.boss ? 2 : 1);
    this.fxEmit("leak", "ring", creep.x, creep.y, { color: "#ff5252", life: 0.75, r: creep.boss ? 40 : 26 });
    this.fxEmit("leak", "spark", creep.x, creep.y - 8, { color: "#ff8a80", life: 0.35, r: 6 });
    this.float(creep.x, creep.y - 26,
      "-" + (livesBefore - this.lives) + (this.lang === "zh" ? " 生命" : " LIFE"), "#ff5252");
    if (this.audio) this.audio.leak();
    this.announce(this.msg("leak", { lives: this.lives }));
    if (this.lives <= 0) this._end("defeat");
  };

  Game.prototype._end = function (kind) {
    if (this.ended) return;
    this.ended = kind;
    this.paused = true;
    if (this.audio) {
      if (kind === "victory") this.audio.win();
      else this.audio.lose();
    }
    try {
      const key = "azeroth-keep-td-scores";
      const prev = JSON.parse(localStorage.getItem(key) || "[]");
      prev.push({
        at: Date.now(),
        difficulty: this.difficulty,
        wave: this.waveIndex,
        lives: this.lives,
        goldEarned: this.goldEarned,
        result: kind,
      });
      localStorage.setItem(key, JSON.stringify(prev.slice(-20)));
    } catch (e) { /* headless */ }
  };

  /* ------------------------------------------------------------------ *
   * Hero abilities
   * ------------------------------------------------------------------ */

  Game.prototype.cast = function (slot) {
    const h = this.hero;
    if (!h || this.ended) return false;
    const def = h.def[slot];
    if (!def) return false;
    if (h.dead) return false;
    if (h.cd[slot] > 0) return false;
    if (def.toggle && h.immolation) {
      h.immolation = false;
      h.cd[slot] = def.cd || 1;
      this.announce(this.msg("heroCast", {
        hero: h.def.name[this.lang] || h.def.name.zh,
        spell: (def[this.lang] || def.zh) + (this.lang === "zh" ? "（关闭）" : " (off)"),
      }));
      return true;
    }
    if (h.mana < (def.mana || 0)) return false;
    h.mana -= def.mana || 0;
    h.cd[slot] = def.cd || 0;
    if (def.toggle) h.immolation = true;
    else if (slot === "q") this._castQ(h, def);
    else if (slot === "w") this._castW(h, def);
    else if (slot === "e") this._castE(h, def);
    this.announce(this.msg("heroCast", {
      hero: h.def.name[this.lang] || h.def.name.zh,
      spell: def[this.lang] || def.zh,
    }));
    this.fxEmit("heroCast", "ring", h.x, h.y, { color: h.def.color, life: 0.4, r: 28 });
    this.fxEmit("heroCast", "spark", h.x, h.y - 10, { color: h.def.color, life: 0.32, r: 7 });
    return true;
  };

  Game.prototype._castQ = function (h, def) {
    const id = h.def.id;
    const target = this._closestCreep(h.x, h.y, def.cast || 240);
    if (id === "blademaster") {
      h.critUntil = this.time + (def.dur || 5);
      h.cleaveUntil = this.time + (def.dur || 5);
      this.fxEmit("heroBuff", "ring", h.x, h.y, { color: "#ff7043", life: 0.5, r: 34 });
      return;
    }
    if (!target) {
      if (def.heal) this._healHero(h, def.heal * 0.5);
      return;
    }
    let dmg = def.dmg || 0;
    if (id === "demonhunter" && target.boss) dmg += def.bossBonus || 0;
    this._hitCreep(target, dmg, "spells", { canHitFlying: true });
    this.fxBurst("spellHit", target.x, target.y, { color: h.def.color, life: 0.45, r: 26, sparkR: 7 });
    if (id === "paladin" && def.nova) {
      const near = this.hash.queryRadius(target.x, target.y, def.novaRadius || 70);
      for (let i = 0; i < near.length; i++) {
        if (near[i] === target) continue;
        this._hitCreep(near[i], dmg * def.nova, "spells", { canHitFlying: true });
      }
    }
    if (id === "demonhunter" && def.shred) {
      target.shred = Math.max(target.shred || 0, def.shredDur || 8);
      target.shredAmt = Math.max(target.shredAmt || 0, def.shred);
      this.float(target.x, target.y - 22, "-" + def.shred + " ARM", "#b39ddb");
    }
    if (def.heal) this._healHero(h, def.heal);
  };

  Game.prototype._castW = function (h, def) {
    const id = h.def.id;
    if (id === "blademaster") {
      h.imagesUntil = this.time + (def.dur || 6);
      this.fxEmit("heroBuff", "ring", h.x, h.y, { color: "#ffb74d", life: 0.6, r: 30 });
      return;
    }
    if (def.affects === "towers") {
      h.auraBoostUntil = this.time + (def.dur || 8);
      this.fxEmit("heroAura", "ring", h.x, h.y, { color: h.def.color, life: 0.8, r: def.radius || 200 });
    }
  };

  Game.prototype._castE = function (h, def) {
    const id = h.def.id;
    if (id === "paladin") {
      h.shield = def.dur || 4;
      h.invulnUntil = this.time + (def.dur || 4);
      h.frenzyUntil = this.time + (def.dur || 4);
      this._healHero(h, h.maxHp * 0.15);
    } else if (id === "blademaster") {
      h.speedBoost = def.dur || 3;
      h.invulnUntil = this.time + (def.dur || 3);
      h.ambush = true;
    } else if (id === "demonhunter") {
      h.metaUntil = this.time + (def.dur || 8);
      this.fxBurst("heroBuff", h.x, h.y, { color: "#7e57c2", life: 0.9, r: 40, sparkR: 8 });
    } else if (id === "deathknight") {
      const n = def.count || 2;
      for (let i = 0; i < n; i++) this._summonSkeleton(h, i, n, def);
      if (def.gold) {
        this.gold += def.gold;
        this.goldEarned += def.gold;
        this.float(h.x, h.y, "+" + def.gold, "#90caf9");
      }
    }
  };

  Game.prototype._healHero = function (h, amount) {
    if (!amount) return;
    const before = h.hp;
    h.hp = Math.min(h.maxHp, h.hp + amount);
    const healed = Math.round(h.hp - before);
    if (healed > 0) this.float(h.x, h.y - 20, "+" + healed, "#a5d6a7");
  };

  Game.prototype._summonSkeleton = function (h, i, n, def) {
    const skDef = D.SUMMONS.skeleton;
    const ang = (Math.PI * 2 * i) / n + 0.6;
    const x = S.clamp(h.x + Math.cos(ang) * 34, 8, this.mapW * this.tile - 8);
    const y = S.clamp(h.y + Math.sin(ang) * 34, 8, this.mapH * this.tile - 8);
    const dmg = (def.dmg || 24) + this.waveIndex * 2;
    this.towers.push({
      id: nid(),
      kind: "tower",
      temp: true,
      expire: this.time + (def.dur || 12),
      def: skDef,
      race: skDef.race,
      x: x,
      y: y,
      tx: -1,
      ty: -1,
      tier: 3,
      invested: 0,
      range: skDef.range[2],
      dmg: dmg,
      rate: skDef.rate[2],
      attackType: skDef.attackType,
      canHitFlying: skDef.canHitFlying,
      splash: 0,
      chain: 0,
      slow: 0,
      poison: 0,
      root: 0,
      cd: 0,
      stun: 0,
    });
    this.fxBurst("summon", x, y, { color: skDef.color, ring: "#cfd8dc", life: 0.5, r: 18 });
  };

  Game.prototype._closestCreep = function (x, y, range) {
    let best = null;
    let bestD = range * range;
    for (let i = 0; i < this.creeps.length; i++) {
      const c = this.creeps[i];
      if (c.hp <= 0) continue;
      const d = S.dist2(x, y, c.x, c.y);
      if (d < bestD) { bestD = d; best = c; }
    }
    return best;
  };

  Game.prototype.commandHero = function (x, y) {
    if (!this.hero) return;
    this.hero.tx = x;
    this.hero.ty = y;
  };

  /** Tower-facing aura contributed by the hero's W (Devotion / Unholy). */
  Game.prototype._heroAura = function () {
    const h = this.hero;
    if (!h || h.dead) return null;
    const w = h.def.w;
    if (!w || w.affects !== "towers" || !w.aura) return null;
    const power = h.auraBoostUntil > this.time ? (w.boost || w.aura) : w.aura;
    return {
      x: h.x,
      y: h.y,
      r2: (w.radius || 180) * (w.radius || 180),
      dmg: w.stat === "dmg" ? power : 0,
      rate: w.stat === "rate" ? power : 0,
    };
  };

  /* ------------------------------------------------------------------ *
   * Simulation
   * ------------------------------------------------------------------ */

  Game.prototype.update = function (dt) {
    if (this.paused || this.ended) {
      this._tickFx(dt);
      return;
    }
    const step = dt * this.speed;
    this.time += step;
    this._tickEconomy(step);
    this._tickWave(step);
    this._tickCreeps(step);
    this._rebuildHash();
    this._tickBossAbilities(step);
    this._tickTowers(step);
    this._tickHero(step);
    this._tickProjectiles(step);
    this._tickFx(step);
    this._checkWaveClear();
  };

  Game.prototype._tickEconomy = function (dt) {
    this.interestAcc += dt;
    while (this.interestAcc >= 15) {
      this.interestAcc -= 15;
      const g = S.interestGold(this.gold, this.interestRate);
      this.gold += g;
      this.goldEarned += g;
      if (g > 0) this.announce(this.msg("interest", { gold: g }));
    }
  };

  Game.prototype._tickWave = function (dt) {
    if (this.betweenWaves) {
      const next = this.waves[this.waveIndex];
      if (next && next.boss) this._chargePortal(dt);
      if (this.waveIndex > 0 && this.waveIndex < this.waves.length) {
        const before = this.autoWave;
        this.autoWave -= dt;
        if (before > 5 && this.autoWave <= 5 && this.autoWave > 0) {
          this.announce(next && next.boss
            ? this.msg("bossCountdown", { secs: 5 })
            : this.msg("countdown", { secs: 5 }));
        }
        if (this.autoWave <= 0) this.startNextWave();
      }
      return;
    }
    const wave = this.waves[this.waveIndex];
    if (!wave) return;
    this.waveAcc += dt;
    const gap = wave.boss ? 1.1 : 0.55;
    while (this.waveSpawned < wave.count && this.waveAcc >= gap) {
      this.waveAcc -= gap;
      this._spawnCreep(wave);
      this.waveSpawned += 1;
    }
  };

  /** Portal pulses ahead of a boss wave so the player can read the threat. */
  Game.prototype._chargePortal = function (dt) {
    this._portalAcc += dt;
    if (this._portalAcc < 0.6) return;
    this._portalAcc = 0;
    const p = this.path[0];
    this.fxEmit("portalCharge", "ring", p.x, p.y, { color: "#ff5252", life: 0.6, r: 26 });
  };

  Game.prototype._tickCreeps = function (dt) {
    const path = this.path;
    const bosses = [];
    for (let i = 0; i < this.creeps.length; i++) {
      const c = this.creeps[i];
      c.px = c.x;
      c.py = c.y;
      c.armorBonus = 0;
      if (c.shred > 0) c.shred -= dt;
      if (c.hp <= 0) continue;
      if (c.boss) {
        bosses.push(c);
        this._tickBossState(c, dt);
      }
      if (c.poison > 0) {
        c.poison -= dt;
        c.hp -= 6 * dt;
        if (c.hp <= 0) { this._killCreep(c); continue; }
      }
      if (c.root > 0) { c.root -= dt; continue; }
      const slowMul = c.slow > 0 ? 0.65 : 1;
      if (c.slow > 0) c.slow -= dt;
      c.dist += c.speed * slowMul * dt;
      const pos = S.pointOnPolyline(path, c.dist);
      c.x = pos.x;
      c.y = pos.y;
      if (pos.done) this._leak(c);
    }
    this._bossCreeps = bosses;
    this.creeps = this.creeps.filter(function (c) { return c.hp > 0 && !c._dead; });
  };

  /** Per-boss regeneration and the enrage threshold. */
  Game.prototype._tickBossState = function (c, dt) {
    const regen = this._abilityDef(c, "regen");
    if (regen) {
      c.hp = Math.min(c.maxHp, c.hp + c.maxHp * regen.regen * dt);
    }
    if (!c.enraged && c.hp <= c.maxHp * D.BOSS_ENRAGE.at) {
      c.enraged = true;
      c.speed *= D.BOSS_ENRAGE.speed;
      this.banner(this.msg("bossEnrage", { name: c.name[this.lang] || c.name.zh }), "#ff7043");
      this.fxBurst("bossEnrage", c.x, c.y, { color: c.color, ring: "#ff5252", life: 0.7, r: 30, sparkR: 8 });
    }
  };

  /** Boss auras and the telegraphed War Stomp. */
  Game.prototype._tickBossAbilities = function (dt) {
    const bosses = this._bossCreeps;
    this._frostSources = [];
    if (!bosses.length) return;
    for (let i = 0; i < bosses.length; i++) {
      const c = bosses[i];
      if (c.hp <= 0) continue;
      const frost = this._abilityDef(c, "frost");
      if (frost) this._frostSources.push({ x: c.x, y: c.y, r2: frost.radius * frost.radius, slow: frost.slow });
      const shroud = this._abilityDef(c, "shroud");
      if (shroud) {
        const near = this.hash.queryRadius(c.x, c.y, shroud.radius);
        for (let k = 0; k < near.length; k++) near[k].armorBonus = (near[k].armorBonus || 0) + shroud.armor;
      }
      const stomp = this._abilityDef(c, "stomp");
      if (!stomp) continue;
      c.castCd -= dt;
      if (!c.warned && c.castCd <= stomp.warn) {
        c.warned = true;
        this.banner(this.msg("bossStompWarn", { name: c.name[this.lang] || c.name.zh }), "#ffab40");
        this.fxEmit("bossStompWarn", "ring", c.x, c.y, { color: "#ffab40", life: stomp.warn, r: stomp.radius });
      }
      if (c.castCd <= 0) {
        c.castCd = stomp.cd;
        c.warned = false;
        this._warStomp(c, stomp);
      }
    }
  };

  Game.prototype._warStomp = function (boss, stomp) {
    let hitCount = 0;
    for (let i = 0; i < this.towers.length; i++) {
      const t = this.towers[i];
      if (S.dist2(boss.x, boss.y, t.x, t.y) > stomp.radius * stomp.radius) continue;
      t.stun = Math.max(t.stun || 0, stomp.stun);
      this.float(t.x, t.y - 26, this.lang === "zh" ? "震晕" : "STUN", "#ffab40");
      this.fxEmit("bossStomp", "spark", t.x, t.y - 18, { color: "#ffab40", life: 0.3, r: 5 });
      hitCount += 1;
    }
    this.fxEmit("bossStomp", "ring", boss.x, boss.y, { color: "#ff8a65", life: 0.6, r: stomp.radius });
    this.fxEmit("bossStomp", "ring", boss.x, boss.y, { color: "#ffd180", life: 0.4, r: stomp.radius * 0.55 });
    this.fxEmit("bossStomp", "spark", boss.x, boss.y + 6, { color: "#ffab40", life: 0.35, r: 9 });
    if (hitCount > 0) this.announce(this.msg("bossStomp", { n: hitCount }));
  };

  Game.prototype._tickTowers = function (dt) {
    const aura = this._heroAura();
    const frost = this._frostSources;
    let expired = false;
    for (let i = 0; i < this.towers.length; i++) {
      const t = this.towers[i];
      if (t.temp && t.expire <= this.time) { expired = true; continue; }
      if (t.stun > 0) {
        t.stun -= dt;
        continue;
      }
      t.cd -= dt;
      if (t.cd > 0) continue;
      const range = t.range * this.towerRangeMul;
      const targets = this.hash.queryRadius(t.x, t.y, range);
      let pick = null;
      let best = -1;
      for (let k = 0; k < targets.length; k++) {
        const c = targets[k];
        if (!S.canTowerHit(t, c)) continue;
        if (c.dist > best) { best = c.dist; pick = c; }
      }
      if (!pick) continue;
      let rate = t.rate;
      let dmg = t.dmg * this.towerDamageMul;
      if (aura && S.dist2(aura.x, aura.y, t.x, t.y) <= aura.r2) {
        if (aura.rate) rate /= 1 + aura.rate;
        if (aura.dmg) dmg *= 1 + aura.dmg;
      }
      for (let f = 0; f < frost.length; f++) {
        if (S.dist2(frost[f].x, frost[f].y, t.x, t.y) <= frost[f].r2) {
          rate *= 1 + frost[f].slow;
          break;
        }
      }
      t.cd = rate;
      this._fire(t, pick, dmg);
      if (this.audio) this.audio.shoot(t.race);
    }
    if (expired) {
      const now = this.time;
      const self = this;
      this.towers = this.towers.filter(function (t) {
        if (!t.temp || t.expire > now) return true;
        self.fxEmit("summonExpire", "ring", t.x, t.y, { color: "#90a4ae", life: 0.4, r: 16 });
        if (self.selected === t) self.selected = null;
        return false;
      });
    }
  };

  Game.prototype._fire = function (tower, target, dmg) {
    const dx = target.x - tower.x;
    const dy = target.y - tower.y;
    const len = Math.hypot(dx, dy) || 1;
    const spd = 340;
    this.projectiles.push({
      x: tower.x,
      y: tower.y - 16,
      vx: (dx / len) * spd,
      vy: (dy / len) * spd,
      targetId: target.id,
      dmg: dmg == null ? tower.dmg : dmg,
      attackType: tower.attackType,
      splash: tower.splash,
      chain: tower.chain,
      source: tower,
      color: tower.def.color,
      life: 1.2,
    });
    this.fxEmit("towerFire", "spark", tower.x + (dx / len) * 13, tower.y - 16 + (dy / len) * 7, {
      color: tower.def.color,
      life: 0.14,
      r: 3,
    });
  };

  Game.prototype._tickProjectiles = function (dt) {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.life -= dt;
      let target = null;
      for (let k = 0; k < this.creeps.length; k++) {
        if (this.creeps[k].id === p.targetId) { target = this.creeps[k]; break; }
      }
      if (target && target.hp > 0) {
        const dx = target.x - p.x;
        const dy = target.y - p.y;
        const len = Math.hypot(dx, dy) || 1;
        const spd = Math.hypot(p.vx, p.vy);
        p.vx = (dx / len) * spd;
        p.vy = (dy / len) * spd;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      let hit = false;
      if (target && S.dist2(p.x, p.y, target.x, target.y) < 14 * 14) hit = true;
      if (p.life <= 0) hit = true;
      if (!hit) continue;
      if (target && target.hp > 0) {
        this._hitCreep(target, p.dmg, p.attackType, p.source);
        if (p.splash) {
          const near = this.hash.queryRadius(p.x, p.y, p.splash);
          for (let n = 0; n < near.length; n++) {
            if (near[n] === target) continue;
            if (!S.canTowerHit(p.source, near[n])) continue;
            this._hitCreep(near[n], p.dmg * 0.4, p.attackType, p.source);
          }
        }
        if (p.chain) {
          let from = target;
          for (let b = 0; b < p.chain; b++) {
            const cand = this.hash.queryRadius(from.x, from.y, 90);
            let next = null;
            for (let c = 0; c < cand.length; c++) {
              if (cand[c].hp <= 0 || cand[c] === from) continue;
              if (!S.canTowerHit(p.source, cand[c])) continue;
              next = cand[c];
              break;
            }
            if (!next) break;
            this._hitCreep(next, p.dmg * (0.7 - b * 0.15), p.attackType, p.source);
            from = next;
          }
        }
      }
      this.projectiles.splice(i, 1);
    }
  };

  Game.prototype._tickHero = function (dt) {
    const h = this.hero;
    if (!h) return;
    h.px = h.x;
    h.py = h.y;
    if (h._hitFlash > 0) h._hitFlash = Math.max(0, h._hitFlash - dt);
    h.cd.q = Math.max(0, h.cd.q - dt);
    h.cd.w = Math.max(0, h.cd.w - dt);
    h.cd.e = Math.max(0, h.cd.e - dt);
    if (h.dead) {
      h.respawn -= dt;
      h.mana = Math.min(h.maxMana, h.mana + HERO_MANA_REGEN * 0.5 * dt);
      if (h.respawn <= 0) this._reviveHero(h);
      return;
    }
    h.mana = Math.min(h.maxMana, h.mana + HERO_MANA_REGEN * dt);
    h.hp = Math.min(h.maxHp, h.hp + HERO_HP_REGEN * dt);
    if (h.shield > 0) h.shield = Math.max(0, h.shield - dt);
    if (h.speedBoost > 0) h.speedBoost = Math.max(0, h.speedBoost - dt);

    const sprint = h.speedBoost > 0 ? (h.def.e.speed || 1.6) : 1;
    const spd = 90 * sprint;
    const dx = h.tx - h.x;
    const dy = h.ty - h.y;
    const dist = Math.hypot(dx, dy);
    if (dist > 3) {
      h.x += (dx / dist) * spd * dt;
      h.y += (dy / dist) * spd * dt;
    }

    h.attackCd -= dt;
    if (h.attackCd <= 0) this._heroAttack(h);
    this._heroImmolation(h, dt);
    this._heroTakeDamage(h, dt);
  };

  Game.prototype._heroAttack = function (h) {
    const meta = h.metaUntil > this.time;
    const range = h.def.range + (meta ? (h.def.e.rangeBonus || 0) : 0);
    const target = this._closestCreep(h.x, h.y, range);
    if (!target) return;
    let rate = h.def.rate;
    if (h.frenzyUntil > this.time) rate *= h.def.e.hasteMul || 0.5;
    if (meta) rate *= h.def.e.hasteMul || 1;
    h.attackCd = rate;

    let dmg = h.def.dmg;
    if (meta) dmg *= h.def.e.dmgMul || 1.45;
    if (h.critUntil > this.time) dmg *= h.def.q.crit || 2.2;
    if (h.ambush) {
      dmg *= h.def.e.ambush || 3;
      h.ambush = false;
      this.float(target.x, target.y - 26, this.lang === "zh" ? "偷袭!" : "AMBUSH!", "#ffcc80");
    }
    this.fxEmit("heroAttack", "spark",
      h.x + (target.x - h.x) * 0.55,
      h.y - 8 + (target.y - h.y) * 0.55,
      { color: h.def.color, life: 0.18, r: 3 });
    this._hitCreep(target, dmg, "hero", HERO_SOURCE);

    if (h.cleaveUntil > this.time && h.def.q.cleave) {
      const near = this.hash.queryRadius(target.x, target.y, h.def.q.cleaveRadius || 50);
      for (let i = 0; i < near.length; i++) {
        if (near[i] === target) continue;
        this._hitCreep(near[i], dmg * h.def.q.cleave, "hero", HERO_SOURCE);
      }
    }
    if (meta && h.def.e.splash) {
      const near = this.hash.queryRadius(target.x, target.y, h.def.e.splash);
      for (let i = 0; i < near.length; i++) {
        if (near[i] === target) continue;
        this._hitCreep(near[i], dmg * (h.def.e.splashRatio || 0.4), "hero", HERO_SOURCE);
      }
    }
    if (h.imagesUntil > this.time && h.def.w.images) {
      const extras = this.hash.queryRadius(h.x, h.y, h.def.range + 24);
      let struck = 0;
      for (let i = 0; i < extras.length && struck < h.def.w.images; i++) {
        if (extras[i] === target || extras[i].hp <= 0) continue;
        this._hitCreep(extras[i], h.def.dmg * (h.def.w.imageDmg || 0.45), "hero", HERO_SOURCE);
        struck += 1;
      }
    }
  };

  Game.prototype._heroImmolation = function (h, dt) {
    if (!h.immolation) return;
    const w = h.def.w;
    h.mana = Math.max(0, h.mana - (w.drain || 8) * dt);
    if (h.mana <= 0) {
      h.immolation = false;
      return;
    }
    const near = this.hash.queryRadius(h.x, h.y, w.radius || 70);
    for (let i = 0; i < near.length; i++) {
      this._hitCreep(near[i], (w.aura || 8) * dt, "spells", { canHitFlying: true });
    }
  };

  /** Ground creeps in melee range chew on the hero unless it is immune. */
  Game.prototype._heroTakeDamage = function (h, dt) {
    if (h.invulnUntil > this.time) return;
    const near = this.hash.queryRadius(h.x, h.y, HERO_MELEE_RANGE);
    let dps = 0;
    for (let i = 0; i < near.length; i++) {
      const c = near[i];
      if (c.flying || c.hp <= 0) continue;
      dps += 3 + c.wave * 0.5 + (c.boss ? 12 : 0);
    }
    if (dps <= 0) return;
    h.hp -= Math.min(dps, 60) * dt;
    h._hitFlash = HERO_HIT_FLASH;
    this._heroHitFx(h);
    if (h.hp <= 0) this._heroDown(h);
  };

  /** Melee chewing is continuous; throttle the spark so it reads as hits. */
  Game.prototype._heroHitFx = function (h) {
    if (this.time - (h._hitFxAt == null ? -1 : h._hitFxAt) < HERO_HIT_FX_GAP) return;
    h._hitFxAt = this.time;
    this.fxEmit("heroHit", "spark", h.x, h.y - 10, { color: "#ff8a80", life: 0.2, r: 4 });
  };

  Game.prototype._heroDown = function (h) {
    h.hp = 0;
    h.dead = true;
    h.respawn = HERO_DOWN_TIME;
    h._hitFlash = 0;
    this.fxBurst("heroDown", h.x, h.y, { color: h.def.color, ring: "#ff5252", r: 30, life: 0.9, sparkR: 8 });
    h.immolation = false;
    h.critUntil = 0;
    h.cleaveUntil = 0;
    h.imagesUntil = 0;
    h.metaUntil = 0;
    h.frenzyUntil = 0;
    h.auraBoostUntil = 0;
    h.shield = 0;
    const home = this._heroHome();
    h.x = home.x;
    h.y = home.y;
    h.tx = home.x;
    h.ty = home.y;
    this.announce(this.msg("heroDown", {
      hero: h.def.name[this.lang] || h.def.name.zh,
      secs: HERO_DOWN_TIME,
    }));
    if (this.audio) this.audio.leak();
  };

  Game.prototype._reviveHero = function (h) {
    h.dead = false;
    h.hp = h.maxHp;
    h.mana = Math.max(h.mana, h.maxMana * 0.5);
    h.attackCd = 0;
    const home = this._heroHome();
    h.x = home.x;
    h.y = home.y;
    h.px = home.x;
    h.py = home.y;
    h.tx = home.x;
    h.ty = home.y;
    h._hitFlash = 0;
    this.announce(this.msg("heroRevive", { hero: h.def.name[this.lang] || h.def.name.zh }));
    this.fxBurst("heroRevive", h.x, h.y, { color: h.def.color, r: 30, life: 0.85, sparkR: 8 });
  };

  Game.prototype._tickFx = function (dt) {
    for (let i = this.fx.length - 1; i >= 0; i--) {
      const f = this.fx[i];
      f.life -= dt;
      if (f.vy) f.y += f.vy * dt;
      if (f.life <= 0) this.fx.splice(i, 1);
    }
  };

  Game.prototype._checkWaveClear = function () {
    if (this.betweenWaves || this.ended) return;
    const wave = this.waves[this.waveIndex];
    if (!wave) return;
    if (this.waveSpawned < wave.count) return;
    if (this.creeps.some(function (c) { return c.hp > 0; })) return;
    this.waveIndex += 1;
    if (this.waveIndex % 5 === 0) {
      this.lumber += 1;
      this.announce(this.msg("lumberGain", { total: this.lumber }));
    }
    if (this.waveIndex >= this.waves.length) {
      this._end("victory");
      return;
    }
    const next = this.waves[this.waveIndex];
    this.betweenWaves = true;
    this.autoWave = next.prep || 12;
    this._portalAcc = 0;
    this.announce(this.msg("waveCleared", { n: wave.index, secs: this.autoWave }));
    this._previewNext(next);
  };

  Game.prototype._previewNext = function (next) {
    this.announce(this.msg("waveNext", {
      name: this.waveLabel(next),
      count: next.count,
      armor: D.armorLabel(next.armorType, this.lang),
      fly: this._flyTag(next),
    }));
    if (next.boss) {
      this.banner(this.msg("bossSoon", { name: this.waveLabel(next) }), "#ff8a65");
      return;
    }
    const later = this.waves[this.waveIndex + 1];
    if (later && later.boss && this._warnedBoss !== later.index) {
      this._warnedBoss = later.index;
      this.announce(this.msg("bossFar", {
        waves: 2,
        name: this.waveLabel(later),
        ability: D.abilityText(later.abilities, this.lang),
      }));
    }
  };

  Game.prototype.pickAt = function (x, y) {
    if (this.hero && S.dist2(x, y, this.hero.x, this.hero.y) < 18 * 18) return this.hero;
    for (let i = this.towers.length - 1; i >= 0; i--) {
      if (S.dist2(x, y, this.towers[i].x, this.towers[i].y) < 18 * 18) return this.towers[i];
    }
    for (let i = 0; i < this.creeps.length; i++) {
      if (S.dist2(x, y, this.creeps[i].x, this.creeps[i].y) < 16 * 16) return this.creeps[i];
    }
    return null;
  };

  Game.prototype.snapshot = function () {
    let towers = 0;
    for (let i = 0; i < this.towers.length; i++) if (!this.towers[i].temp) towers += 1;
    return {
      gold: this.gold,
      lumber: this.lumber,
      lives: this.lives,
      wave: this.waveIndex,
      towers: towers,
      creeps: this.creeps.length,
      ended: this.ended,
      time: Math.round(this.time * 1000) / 1000,
    };
  };

  root.Game = Game;
})(typeof globalThis !== "undefined" ? globalThis : this);
