(function (root) {
  "use strict";
  const S = root.SimCore;
  const D = root.GameData;

  let _id = 1;
  function nid() { return _id++; }

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
    this.announce("A pack gathers at the dark portal… / 黑暗之门开始集结……");
  }

  Game.prototype.t = function (key) {
    const pack = D.STR[this.lang] || D.STR.zh;
    return pack[key] || key;
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

  Game.prototype._spawnHero = function () {
    const def = D.heroById(this.heroId) || D.HEROES[0];
    const keep = this.path[this.path.length - 1];
    return {
      id: nid(),
      kind: "hero",
      def: def,
      x: keep.x - 40,
      y: keep.y - 30,
      px: keep.x - 40,
      py: keep.y - 30,
      tx: keep.x - 40,
      ty: keep.y - 30,
      hp: def.hp,
      maxHp: def.hp,
      mana: def.mana,
      maxMana: def.mana,
      cd: { q: 0, w: 0, e: 0 },
      shield: 0,
      critUntil: 0,
      metaUntil: 0,
      immolation: false,
      attackCd: 0,
    };
  };

  Game.prototype.announce = function (msg) {
    this.log.unshift({ t: this.time, msg: msg });
    if (this.log.length > 30) this.log.pop();
  };

  Game.prototype.float = function (x, y, text, color) {
    this.fx.push({ kind: "text", x: x, y: y, text: text, color: color || "#fff", life: 0.9, max: 0.9, vy: -22 });
  };

  Game.prototype.spark = function (x, y, color) {
    this.fx.push({ kind: "spark", x: x, y: y, color: color || "#ffe082", life: 0.25, max: 0.25, r: 4 });
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
    };
    this.gold -= cost;
    this.occupied[t.tx + "," + t.ty] = tower.id;
    this.towers.push(tower);
    this.selected = tower;
    if (this.audio) this.audio.build();
    return tower;
  };

  Game.prototype.upgradeSelected = function () {
    const t = this.selected;
    if (!t || t.kind !== "tower") return false;
    if (t.tier >= 3) return false;
    const cost = t.def.cost[t.tier];
    if (this.gold < cost) return false;
    this.gold -= cost;
    t.invested += cost;
    t.tier += 1;
    t.range = t.def.range[t.tier - 1];
    t.dmg = t.def.dmg[t.tier - 1];
    t.rate = t.def.rate[t.tier - 1];
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
    this.float(t.x, t.y, "+" + refund, "#ffe082");
    return refund;
  };

  Game.prototype.startNextWave = function () {
    if (this.ended) return;
    if (!this.betweenWaves) return;
    if (this.waveIndex >= this.waves.length) return;
    this.betweenWaves = false;
    this.waveSpawned = 0;
    this.waveAcc = 0;
    const w = this.waves[this.waveIndex];
    const nm = w.name[this.lang] || w.name.zh;
    this.announce((this.lang === "zh" ? "第 " : "Wave ") + w.index + (this.lang === "zh" ? " 波：" : ": ") + nm + (w.boss ? " ★" : ""));
    if (this.audio) this.audio.wave();
  };

  Game.prototype._spawnCreep = function (wave) {
    const start = this.path[0];
    const hp = S.waveHp(wave.hp, this.difficulty);
    const bounty = S.waveBounty(wave.bounty, this.difficulty);
    this.creeps.push({
      id: nid(),
      kind: "creep",
      wave: wave.index,
      name: wave.name,
      x: start.x,
      y: start.y,
      px: start.x,
      py: start.y,
      dist: 0,
      hp: hp,
      maxHp: hp,
      bounty: bounty,
      armor: wave.armor,
      armorType: wave.armorType,
      flying: wave.flying,
      spellImmune: !!wave.spellImmune,
      speed: wave.speed * (wave.flying ? 1.05 : 1),
      color: wave.color,
      boss: wave.boss,
      slow: 0,
      root: 0,
      poison: 0,
    });
  };

  Game.prototype._rebuildHash = function () {
    this.hash.clear();
    for (let i = 0; i < this.creeps.length; i++) {
      const c = this.creeps[i];
      if (c.hp > 0) this.hash.insert(c);
    }
  };

  Game.prototype._hitCreep = function (creep, base, attackType, source) {
    const res = S.applyHit(base, attackType, creep.armorType, creep.armor, {
      flying: creep.flying,
      canHitFlying: !source || source.canHitFlying !== false || source.kind === "hero",
      spellImmune: creep.spellImmune,
    });
    if (res.damage <= 0) return res;
    if (creep.root > 0 && source && source.root) {
      /* already rooted */
    }
    creep.hp -= res.damage;
    if (this.settings.dmgNumbers) {
      this.float(creep.x, creep.y - 12, Math.round(res.damage).toString(), res.multiplier >= 1.4 ? "#ffee66" : "#ffffff");
    }
    this.spark(creep.x, creep.y, "#ffe082");
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
    this.fx.push({ kind: "ring", x: creep.x, y: creep.y, color: "#cfd8dc", life: 0.35, max: 0.35, r: 14 });
  };

  Game.prototype._leak = function (creep) {
    if (creep._dead) return;
    creep._dead = true;
    creep.hp = 0;
    this.lives = S.livesAfterLeak(this.lives, 1, creep.boss ? 2 : 1);
    if (this.audio) this.audio.leak();
    this.announce(this.lang === "zh" ? "敌军漏入要塞！" : "A creep leaked into the keep!");
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

  Game.prototype.cast = function (slot) {
    const h = this.hero;
    if (!h || this.ended) return false;
    const def = h.def[slot];
    if (!def) return false;
    if (h.cd[slot] > 0) return false;
    if (h.mana < def.mana) return false;
    h.mana -= def.mana;
    h.cd[slot] = def.cd;
    const target = this._closestCreep(h.x, h.y, 220);
    if (slot === "q") {
      if (h.def.id === "paladin") {
        if (target) this._hitCreep(target, def.dmg, "spells", { canHitFlying: true });
      } else if (h.def.id === "blademaster") {
        h.critUntil = this.time + 5;
      } else if (h.def.id === "demonhunter" && target) {
        this._hitCreep(target, def.dmg, "spells", { canHitFlying: true });
      } else if (target) {
        this._hitCreep(target, def.dmg, "spells", { canHitFlying: true });
      }
    } else if (slot === "w") {
      if (h.def.id === "demonhunter") h.immolation = !h.immolation;
    } else if (slot === "e") {
      if (h.def.id === "paladin") h.shield = def.dur;
      if (h.def.id === "blademaster") h.speedBoost = def.dur;
      if (h.def.id === "demonhunter") h.metaUntil = this.time + def.dur;
      if (h.def.id === "deathknight") {
        this.gold += 25;
        this.float(h.x, h.y, "+25", "#90caf9");
      }
    }
    this.fx.push({ kind: "ring", x: h.x, y: h.y, color: h.def.color, life: 0.4, max: 0.4, r: 28 });
    return true;
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
      if (g > 0) this.announce((this.lang === "zh" ? "利息 +" : "Interest +") + g);
    }
  };

  Game.prototype._tickWave = function (dt) {
    if (this.betweenWaves) {
      if (this.waveIndex > 0 && this.waveIndex < this.waves.length) {
        this.autoWave -= dt;
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

  Game.prototype._tickCreeps = function (dt) {
    const path = this.path;
    for (let i = 0; i < this.creeps.length; i++) {
      const c = this.creeps[i];
      c.px = c.x;
      c.py = c.y;
      if (c.hp <= 0) continue;
      if (c.poison > 0) {
        c.poison -= dt;
        c.hp -= 6 * dt;
        if (c.hp <= 0) this._killCreep(c);
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
    this.creeps = this.creeps.filter(function (c) { return c.hp > 0 && !c._dead; });
  };

  Game.prototype._tickTowers = function (dt) {
    for (let i = 0; i < this.towers.length; i++) {
      const t = this.towers[i];
      t.cd -= dt;
      if (t.cd > 0) continue;
      const targets = this.hash.queryRadius(t.x, t.y, t.range);
      let pick = null;
      let best = -1;
      for (let k = 0; k < targets.length; k++) {
        const c = targets[k];
        if (!S.canTowerHit(t, c)) continue;
        if (c.dist > best) { best = c.dist; pick = c; }
      }
      if (!pick) continue;
      t.cd = t.rate;
      this._fire(t, pick);
      if (this.audio) this.audio.shoot(t.race);
    }
  };

  Game.prototype._fire = function (tower, target) {
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
      dmg: tower.dmg,
      attackType: tower.attackType,
      splash: tower.splash,
      chain: tower.chain,
      source: tower,
      color: tower.def.color,
      life: 1.2,
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
    h.cd.q = Math.max(0, h.cd.q - dt);
    h.cd.w = Math.max(0, h.cd.w - dt);
    h.cd.e = Math.max(0, h.cd.e - dt);
    h.mana = Math.min(h.maxMana, h.mana + 6 * dt);
    if (h.shield > 0) h.shield -= dt;
    const auraArmor = h.def.w && h.def.w.aura && h.def.id === "paladin" ? h.def.w.aura : 0;
    this._heroAuraArmor = auraArmor;
    if (h.def.id === "deathknight") {
      for (let i = 0; i < this.creeps.length; i++) {
        /* unholy: towers already shoot faster visually via rate — apply small haste */
      }
    }
    const spd = 90 * (h.speedBoost > 0 ? 1.6 : 1);
    if (h.speedBoost > 0) h.speedBoost -= dt;
    const dx = h.tx - h.x;
    const dy = h.ty - h.y;
    const dist = Math.hypot(dx, dy);
    if (dist > 3) {
      h.x += (dx / dist) * spd * dt;
      h.y += (dy / dist) * spd * dt;
    }
    h.attackCd -= dt;
    const range = h.metaUntil > this.time ? h.def.range + 40 : h.def.range;
    const tgt = this._closestCreep(h.x, h.y, range);
    if (tgt && h.attackCd <= 0) {
      h.attackCd = h.def.rate;
      let dmg = h.def.dmg * (h.metaUntil > this.time ? 1.45 : 1);
      if (h.critUntil > this.time) dmg *= 2.2;
      this._hitCreep(tgt, dmg, "hero", { canHitFlying: true });
    }
    if (h.immolation) {
      h.mana = Math.max(0, h.mana - h.def.w.mana * dt);
      if (h.mana <= 0) h.immolation = false;
      const near = this.hash.queryRadius(h.x, h.y, 70);
      for (let i = 0; i < near.length; i++) {
        this._hitCreep(near[i], (h.def.w.aura || 8) * dt, "spells", { canHitFlying: true });
      }
    }
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
      this.announce(this.lang === "zh" ? "获得 1 木材" : "+1 lumber");
    }
    if (this.waveIndex >= this.waves.length) {
      this._end("victory");
      return;
    }
    this.betweenWaves = true;
    this.autoWave = 12;
    this.announce(this.lang === "zh" ? "波次肃清。12 秒后下一波。" : "Wave cleared. Next in 12s.");
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
    return {
      gold: this.gold,
      lumber: this.lumber,
      lives: this.lives,
      wave: this.waveIndex,
      towers: this.towers.length,
      creeps: this.creeps.length,
      ended: this.ended,
      time: Math.round(this.time * 1000) / 1000,
    };
  };

  root.Game = Game;
})(typeof globalThis !== "undefined" ? globalThis : this);
