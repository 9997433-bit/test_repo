/**
 * 范围与链式指令的求解器。
 *
 * `explosion` / `chain` 指令只描述「在哪、多大、打多少」，
 * 真正命中谁取决于当时的敌人列表。模式层把敌人列表交给这里，
 * 得到一组已结算的直接伤害指令。全程只读，不改敌人对象。
 */

import { armorMitigation, resistOf } from "./damage.js";
import { damageEffect } from "./effects.js";
import { EFFECT } from "./effects.js";
import { armorShredFrom, damageTakenMultFrom, readStatuses } from "./status.js";

function distance(ax, ay, bx, by) {
  return Math.hypot((bx ?? 0) - (ax ?? 0), (by ?? 0) - (ay ?? 0));
}

function alive(target) {
  return target && (target.hp == null || target.hp > 0);
}

function mitigate(amount, target, element, ctx, now) {
  const statuses = readStatuses(target, ctx, now);
  const value = amount * damageTakenMultFrom(statuses) * armorMitigation(target.armor ?? 0, armorShredFrom(statuses)) * (1 - resistOf(target, element));
  return Math.max(1, Math.round(value));
}

/**
 * 结算一条爆炸指令。
 *
 * @param {object} fx explosionEffect() 产出的指令
 * @param {object[]} targets 当前敌人列表（需带 id / x / y）
 * @param {object} [opts] { ctx, now, mitigate:boolean }
 * @returns {{ hits: object[], effects: object[] }}
 */
export function resolveExplosion(fx, targets = [], opts = {}) {
  const { ctx = {}, now = ctx.now ?? 0 } = opts;
  const useMitigation = opts.mitigate !== false;
  const exclude = new Set(fx?.excludeIds ?? []);
  const hits = [];

  for (const target of targets) {
    if (!alive(target) || exclude.has(target.id)) continue;
    const dist = distance(fx.x, fx.y, target.x, target.y);
    if (dist > fx.radius) continue;
    const ratio = fx.radius > 0 ? Math.max(0, 1 - (fx.falloff ?? 0) * (dist / fx.radius)) : 1;
    const raw = fx.damage * ratio;
    if (raw <= 0) continue;
    hits.push({
      targetId: target.id,
      damage: useMitigation ? mitigate(raw, target, fx.element, ctx, now) : Math.max(1, Math.round(raw)),
      element: fx.element,
      kind: fx.kind ?? "explosion",
      distance: dist,
    });
  }

  hits.sort((a, b) => a.distance - b.distance);
  return {
    hits,
    effects: hits.map((h) => damageEffect({ targetId: h.targetId, amount: h.damage, element: h.element, kind: h.kind, source: fx.sourceId ?? null })),
  };
}

/**
 * 结算一条链式弹跳指令（雷 3 层 / 感电扩散）。
 * 每一跳跳向最近的未命中目标，伤害按 falloff 递减。
 */
export function resolveChain(fx, targets = [], opts = {}) {
  const { ctx = {}, now = ctx.now ?? 0 } = opts;
  const useMitigation = opts.mitigate !== false;
  const visited = new Set([...(fx?.excludeIds ?? []), fx?.fromId].filter((id) => id != null));
  const hits = [];

  let x = fx.x;
  let y = fx.y;
  let damage = fx.damage;

  for (let hop = 0; hop < (fx.hops ?? 0); hop += 1) {
    damage *= fx.falloff ?? 0.55;
    if (damage <= 0) break;

    let best = null;
    let bestDist = Infinity;
    for (const target of targets) {
      if (!alive(target) || visited.has(target.id)) continue;
      const dist = distance(x, y, target.x, target.y);
      if (dist > (fx.radius ?? Infinity) || dist >= bestDist) continue;
      best = target;
      bestDist = dist;
    }
    if (!best) break;

    visited.add(best.id);
    hits.push({
      targetId: best.id,
      damage: useMitigation ? mitigate(damage, best, fx.element, ctx, now) : Math.max(1, Math.round(damage)),
      element: fx.element,
      kind: "chain",
      hop: hop + 1,
      distance: bestDist,
    });
    x = best.x;
    y = best.y;
  }

  return {
    hits,
    effects: hits.map((h) => damageEffect({ targetId: h.targetId, amount: h.damage, element: h.element, kind: h.kind, source: fx.fromId ?? null })),
  };
}

/**
 * 把一批指令里的 explosion / chain 全部展开成直接伤害指令。
 * 其余指令原样保留，方便模式层一次性处理。
 *
 * @returns {{ effects: object[], hits: object[] }}
 */
export function expandAreaEffects(effects = [], targets = [], opts = {}) {
  const out = [];
  const hits = [];
  for (const fx of effects) {
    if (fx?.type === EFFECT.EXPLOSION) {
      const res = resolveExplosion(fx, targets, opts);
      hits.push(...res.hits);
      out.push(...res.effects);
    } else if (fx?.type === EFFECT.CHAIN) {
      const res = resolveChain(fx, targets, opts);
      hits.push(...res.hits);
      out.push(...res.effects);
    } else {
      out.push(fx);
    }
  }
  return { effects: out, hits };
}
