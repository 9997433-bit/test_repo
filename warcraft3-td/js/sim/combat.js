/* Combat kernel: targeting rules, projectile leading, splash falloff, chain
 * bouncing and the full WC3 damage pipeline. Pure + DOM-free so tests can
 * exercise every rule directly. */
(function (root) {
  'use strict';
  const NS = (root.WC3TD = root.WC3TD || {});
  const DT = () => NS.DamageTable;

  const TARGET_MODES = ['first', 'last', 'strongest', 'weakest', 'closest'];

  /* ------------------------------------------------------------------ rules */

  /** Flying rules: the tower must be air-capable AND its attack type must
   *  be one that can reach the sky (pierce / magic / chaos, DESIGN.md §3).
   *  A webbed flyer counts as grounded and can be hit by anything. */
  function canHit(def, creep) {
    if (!creep || !creep.alive) return false;
    const airborne = creep.isAirborne ? creep.isAirborne() : !!creep.flying;
    if (!airborne) return true;
    if (def.targets.indexOf('air') === -1) return false;
    return DT().attackTypeHitsAir(def.attackType);
  }

  function inRange(tower, creep, range) {
    const dx = creep.x - tower.x, dy = creep.y - tower.y;
    return dx * dx + dy * dy <= range * range;
  }

  /** Pick up to `count` targets from `candidates` honouring the tower's mode. */
  function selectTargets(tower, def, candidates, count, mode) {
    const valid = [];
    for (let i = 0; i < candidates.length; i++) {
      const c = candidates[i];
      if (canHit(def, c) && inRange(tower, c, def.range)) valid.push(c);
    }
    if (valid.length <= 1) return valid.slice(0, count);
    const m = mode || 'first';
    valid.sort(function (a, b) {
      switch (m) {
        case 'last': return a.progress() - b.progress();
        case 'strongest': return b.hp - a.hp;
        case 'weakest': return a.hp - b.hp;
        case 'closest': {
          const da = (a.x - tower.x) * (a.x - tower.x) + (a.y - tower.y) * (a.y - tower.y);
          const db = (b.x - tower.x) * (b.x - tower.x) + (b.y - tower.y) * (b.y - tower.y);
          return da - db;
        }
        default: return b.progress() - a.progress(); // "first" = furthest along the road
      }
    });
    return valid.slice(0, count);
  }

  /* ------------------------------------------------------------- projectiles */

  /**
   * Time until a constant-speed projectile fired now from `p` intercepts a
   * target at `t` moving with velocity `v`. Returns null when unreachable.
   */
  function interceptTime(px, py, tx, ty, vx, vy, speed) {
    const dx = tx - px, dy = ty - py;
    const a = vx * vx + vy * vy - speed * speed;
    const b = 2 * (dx * vx + dy * vy);
    const c = dx * dx + dy * dy;
    if (Math.abs(a) < 1e-6) {
      if (Math.abs(b) < 1e-6) return 0;
      const t0 = -c / b;
      return t0 >= 0 ? t0 : null;
    }
    const disc = b * b - 4 * a * c;
    if (disc < 0) return null;
    const sq = Math.sqrt(disc);
    const t1 = (-b - sq) / (2 * a);
    const t2 = (-b + sq) / (2 * a);
    let best = null;
    if (t1 > 0) best = t1;
    if (t2 > 0 && (best === null || t2 < best)) best = t2;
    return best;
  }

  /** Aim point for a leading shot; falls back to the target's current spot. */
  function leadTarget(tower, creep, speed) {
    const t = interceptTime(tower.x, tower.y, creep.x, creep.y, creep.vx || 0, creep.vy || 0, speed);
    if (t === null || !isFinite(t) || t > 4) return { x: creep.x, y: creep.y, t: 0 };
    return { x: creep.x + (creep.vx || 0) * t, y: creep.y + (creep.vy || 0) * t, t };
  }

  /* ------------------------------------------------------------------ splash */

  /** WC3-style three-ring splash falloff. */
  function splashFactor(dist, splash) {
    if (!splash) return dist <= 0 ? 1 : 0;
    const f = (NS.Config && NS.Config.splashFalloff) || { full: 1, mid: 0.5, outer: 0.25 };
    if (dist <= splash.full) return f.full;
    if (dist <= splash.mid) return f.mid;
    if (dist <= splash.outer) return f.outer;
    return 0;
  }

  /* ------------------------------------------------------------------- chain */

  /**
   * Build the bounce order for a chain attack: nearest un-hit valid target
   * within `chain.range` of the previous link, up to `chain.bounces` extra hits.
   * Returns [{creep, factor}] including the primary target at factor 1.
   */
  function chainSequence(def, primary, pool) {
    const out = [{ creep: primary, factor: 1 }];
    if (!def.chain) return out;
    const hit = new Set([primary]);
    let cur = primary;
    let factor = 1;
    for (let b = 0; b < def.chain.bounces; b++) {
      let best = null, bestD = Infinity;
      for (let i = 0; i < pool.length; i++) {
        const c = pool[i];
        if (hit.has(c) || !canHit(def, c)) continue;
        const d = Math.hypot(c.x - cur.x, c.y - cur.y);
        if (d <= def.chain.range && d < bestD) { best = c; bestD = d; }
      }
      if (!best) break;
      factor *= def.chain.decay;
      out.push({ creep: best, factor });
      hit.add(best);
      cur = best;
    }
    return out;
  }

  /* ------------------------------------------------------------------ damage */

  function rollDamage(def, rng) {
    const lo = def.damage[0], hi = def.damage[1];
    const r = rng ? rng.next() : 0.5;
    return lo + (hi - lo) * r;
  }

  /**
   * Resolve and apply one hit. Returns the breakdown (amount, typeFactor, ...)
   * or null if the hit was impossible (e.g. flying rules).
   */
  function strike(game, tower, def, creep, base, opts) {
    if (!creep || !creep.alive) return null;
    if (!canHit(def, creep)) return null;
    const o = opts || {};
    const res = DT().resolve({
      base,
      attackType: def.attackType,
      armorType: creep.armorType,
      armorValue: creep.effectiveArmor(),
      bonusVsArmor: def.bonusVsArmor,
      multiplier: o.multiplier === undefined ? 1 : o.multiplier
    });
    creep.takeDamage(res.amount, tower, res, o);
    return res;
  }

  NS.Combat = {
    TARGET_MODES, canHit, inRange, selectTargets,
    interceptTime, leadTarget, splashFactor, chainSequence, rollDamage, strike
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
