/**
 * Azeroth Keep TD — headless simulation core (browser + Node).
 * Pure Warcraft III TFT-inspired combat/economy math. No DOM.
 */
(function (root, factory) {
  if (typeof module !== "undefined" && module.exports) {
    module.exports = factory();
  } else {
    root.SimCore = factory();
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const ATTACK = ["normal", "pierce", "siege", "magic", "chaos", "hero", "spells"];
  const ARMOR = ["unarmored", "light", "medium", "heavy", "fortified", "hero", "divine"];

  // Close to TFT 1.30+ gameplay constants (readable tribute, not a dump of IP).
  const DAMAGE_TABLE = {
    normal: { unarmored: 1.0, light: 1.0, medium: 1.5, heavy: 1.0, fortified: 0.7, hero: 1.0, divine: 0.05 },
    pierce: { unarmored: 1.5, light: 2.0, medium: 0.75, heavy: 1.0, fortified: 0.35, hero: 0.5, divine: 0.05 },
    siege: { unarmored: 1.0, light: 1.0, medium: 0.5, heavy: 1.0, fortified: 1.5, hero: 0.5, divine: 0.05 },
    magic: { unarmored: 1.0, light: 1.25, medium: 0.75, heavy: 2.0, fortified: 0.35, hero: 0.5, divine: 0.05 },
    chaos: { unarmored: 1.0, light: 1.0, medium: 1.0, heavy: 1.0, fortified: 1.0, hero: 1.0, divine: 1.0 },
    hero: { unarmored: 1.0, light: 1.0, medium: 1.0, heavy: 1.0, fortified: 0.5, hero: 1.0, divine: 0.05 },
    spells: { unarmored: 1.0, light: 1.0, medium: 1.0, heavy: 1.0, fortified: 1.0, hero: 0.7, divine: 0.05 },
  };

  const DIFFICULTY = {
    easy: { hp: 0.75, bounty: 1.15, gold: 160, lives: 30, name: "easy" },
    normal: { hp: 1.0, bounty: 1.0, gold: 120, lives: 20, name: "normal" },
    hard: { hp: 1.45, bounty: 0.85, gold: 100, lives: 15, name: "hard" },
    insane: { hp: 2.1, bounty: 0.7, gold: 80, lives: 10, name: "insane" },
  };

  function clamp(v, a, b) {
    return Math.max(a, Math.min(b, v));
  }

  function mulberry32(seed) {
    let s = seed >>> 0;
    return function rng() {
      s |= 0;
      s = (s + 0x6d2b79f5) | 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function damageMultiplier(attackType, armorType) {
    const row = DAMAGE_TABLE[attackType];
    if (!row) return 1;
    const m = row[armorType];
    return m == null ? 1 : m;
  }

  /** WC3 armor reduction: 0.06 * armor / (1 + 0.06 * armor), negative armor increases damage. */
  function armorReduction(armor) {
    return (0.06 * armor) / (1 + 0.06 * Math.abs(armor));
  }

  function applyHit(baseDamage, attackType, armorType, armorValue, opts) {
    opts = opts || {};
    const flying = !!opts.flying;
    const canHitFlying = opts.canHitFlying !== false;
    const spellImmune = !!opts.spellImmune;
    if (flying && !canHitFlying) {
      return { damage: 0, multiplier: 0, blocked: "flying" };
    }
    if (spellImmune && (attackType === "magic" || attackType === "spells")) {
      return { damage: 0, multiplier: 0, blocked: "immune" };
    }
    const mult = damageMultiplier(attackType, armorType);
    const red = armorReduction(armorValue || 0);
    const factor = armorValue >= 0 ? 1 - red : 1 + red;
    const dmg = Math.max(0, baseDamage * mult * factor);
    return { damage: dmg, multiplier: mult, reduction: red, blocked: null };
  }

  function splashDamage(centerHit, splashRatio, splashCount) {
    const out = [centerHit];
    const n = splashCount || 0;
    for (let i = 0; i < n; i++) {
      out.push({
        damage: centerHit.damage * (splashRatio == null ? 0.4 : splashRatio),
        multiplier: centerHit.multiplier,
        splash: true,
      });
    }
    return out;
  }

  function interestGold(gold, rate) {
    const r = clamp(rate, 0, 0.08);
    return Math.floor(Math.max(0, gold) * r);
  }

  function sellRefund(investedGold, ratio) {
    return Math.floor(Math.max(0, investedGold) * (ratio == null ? 0.75 : ratio));
  }

  function canTowerHit(tower, creep) {
    if (!creep || creep.hp <= 0) return false;
    if (creep.flying && !tower.canHitFlying) return false;
    if (creep.spellImmune && (tower.attackType === "magic" || tower.attackType === "spells")) {
      return false;
    }
    return true;
  }

  function dist2(ax, ay, bx, by) {
    const dx = ax - bx;
    const dy = ay - by;
    return dx * dx + dy * dy;
  }

  function polylineLength(points) {
    let len = 0;
    for (let i = 1; i < points.length; i++) {
      const a = points[i - 1];
      const b = points[i];
      len += Math.hypot(b.x - a.x, b.y - a.y);
    }
    return len;
  }

  function pointOnPolyline(points, distance) {
    if (!points.length) return { x: 0, y: 0, done: true, t: 1 };
    if (distance <= 0) return { x: points[0].x, y: points[0].y, done: false, t: 0 };
    let left = distance;
    let total = polylineLength(points);
    for (let i = 1; i < points.length; i++) {
      const a = points[i - 1];
      const b = points[i];
      const seg = Math.hypot(b.x - a.x, b.y - a.y);
      if (left <= seg) {
        const u = seg === 0 ? 0 : left / seg;
        return {
          x: a.x + (b.x - a.x) * u,
          y: a.y + (b.y - a.y) * u,
          done: false,
          t: total ? distance / total : 1,
        };
      }
      left -= seg;
    }
    const last = points[points.length - 1];
    return { x: last.x, y: last.y, done: true, t: 1 };
  }

  function livesAfterLeak(lives, count, perCreep) {
    return Math.max(0, lives - count * (perCreep == null ? 1 : perCreep));
  }

  function nextInterestRate(current, lumberSpentOnInterest) {
    return clamp(current + lumberSpentOnInterest * 0.02, 0.02, 0.08);
  }

  function waveBounty(base, difficulty) {
    const d = DIFFICULTY[difficulty] || DIFFICULTY.normal;
    return Math.max(1, Math.round(base * d.bounty));
  }

  function waveHp(base, difficulty) {
    const d = DIFFICULTY[difficulty] || DIFFICULTY.normal;
    return Math.max(1, Math.round(base * d.hp));
  }

  function hashGridKey(x, y, cell) {
    const c = cell || 64;
    return ((x / c) | 0) + ":" + ((y / c) | 0);
  }

  function SpatialHash(cell) {
    this.cell = cell || 64;
    this.buckets = Object.create(null);
  }
  SpatialHash.prototype.clear = function () {
    this.buckets = Object.create(null);
  };
  SpatialHash.prototype.insert = function (ent) {
    const k = hashGridKey(ent.x, ent.y, this.cell);
    (this.buckets[k] || (this.buckets[k] = [])).push(ent);
  };
  SpatialHash.prototype.queryRadius = function (x, y, r) {
    const c = this.cell;
    const r2 = r * r;
    const minX = ((x - r) / c) | 0;
    const maxX = ((x + r) / c) | 0;
    const minY = ((y - r) / c) | 0;
    const maxY = ((y + r) / c) | 0;
    const out = [];
    for (let gx = minX; gx <= maxX; gx++) {
      for (let gy = minY; gy <= maxY; gy++) {
        const bucket = this.buckets[gx + ":" + gy];
        if (!bucket) continue;
        for (let i = 0; i < bucket.length; i++) {
          const e = bucket[i];
          if (dist2(x, y, e.x, e.y) <= r2) out.push(e);
        }
      }
    }
    return out;
  };

  function tickInterest(state, dt) {
    state.interestAcc = (state.interestAcc || 0) + dt;
    const gained = [];
    while (state.interestAcc >= 15) {
      state.interestAcc -= 15;
      const g = interestGold(state.gold, state.interestRate);
      state.gold += g;
      gained.push(g);
    }
    return gained;
  }

  function createEconomy(difficulty) {
    const d = DIFFICULTY[difficulty] || DIFFICULTY.normal;
    return {
      gold: d.gold,
      lumber: 0,
      lives: d.lives,
      interestRate: 0.02,
      interestAcc: 0,
      goldEarned: 0,
      difficulty: d.name,
    };
  }

  return {
    ATTACK,
    ARMOR,
    DAMAGE_TABLE,
    DIFFICULTY,
    clamp,
    mulberry32,
    damageMultiplier,
    armorReduction,
    applyHit,
    splashDamage,
    interestGold,
    sellRefund,
    canTowerHit,
    dist2,
    polylineLength,
    pointOnPolyline,
    livesAfterLeak,
    nextInterestRate,
    waveBounty,
    waveHp,
    hashGridKey,
    SpatialHash,
    tickInterest,
    createEconomy,
  };
});
