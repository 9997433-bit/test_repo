/**
 * 上游模块适配层。
 *
 * 伤害结算（`src/combat/**`）仍走「探测到就用上游、否则内置兜底」的策略，
 * 因为它只是一个纯函数，降级不影响可玩性。
 *
 * 物理不再降级：Round 2 起 `core/sim.js` 直接以 `src/physics` 为唯一积分器，
 * 这里的 `CAPS.physics` / `CAPS.trajectory` 只用于在菜单上如实报告链路状态。
 */
import * as upstreamPhysics from "../physics/index.js";
import { ELEMENT, feedbackEffect, resolveHit as upstreamResolveHit } from "../combat/index.js";

function probePhysics() {
  try {
    const { createWorld, stepWorld } = upstreamPhysics;
    if (typeof createWorld !== "function" || typeof stepWorld !== "function") return false;
    const world = createWorld();
    if (!world || !Array.isArray(world.eggs)) return false;
    const egg = { x: 100, y: 100, vx: 0, vy: 0, r: 10 };
    world.eggs.push(egg);
    stepWorld(world, 1 / 60);
    stepWorld(world, 1 / 60);
    // 真正的积分器会让蛋在重力下落；脚手架只会累加 time。
    return egg.y > 100.05;
  } catch {
    return false;
  }
}

function probeTrajectory() {
  try {
    const pts = upstreamPhysics.predictTrajectory?.(
      { x: 240, y: 60 },
      { x: 0, y: 400 },
      upstreamPhysics.createWorld(),
      120,
    );
    return Array.isArray(pts) && pts.length > 2;
  } catch {
    return false;
  }
}

function probeCombat() {
  try {
    const r = upstreamResolveHit({ power: 10 }, { hp: 100 }, { combo: 0 });
    return !!r && Number.isFinite(r.damage) && r.damage > 0;
  } catch {
    return false;
  }
}

export const CAPS = {
  physics: probePhysics(),
  trajectory: probeTrajectory(),
  combat: probeCombat(),
};

export const WORLD_W = Number.isFinite(upstreamPhysics.WORLD_W) ? upstreamPhysics.WORLD_W : 480;
export const WORLD_H = Number.isFinite(upstreamPhysics.WORLD_H) ? upstreamPhysics.WORLD_H : 800;
export const GRAVITY = Number.isFinite(upstreamPhysics.GRAVITY) ? upstreamPhysics.GRAVITY : 1680;
export const FIXED_DT = Number.isFinite(upstreamPhysics.FIXED_DT) ? upstreamPhysics.FIXED_DT : 1 / 120;

/**
 * 内置兜底命中结果。
 *
 * 形状与上游 `resolveHit` 一致（含 `effects` / `comboDelta`），
 * 这样调用方永远只有一条消费路径，不需要为降级再写一套分支。
 */
function fallbackStrike(egg = {}, target = {}, ctx = {}) {
  const power = Number.isFinite(egg.power) ? egg.power : 10;
  const combo = Number.isFinite(ctx.combo) ? Math.max(0, Math.floor(ctx.combo)) : 0;
  const element = egg.element ?? ELEMENT.PHYSICAL;
  const amount = power > 0 ? Math.max(1, Math.round(power * (1 + combo * 0.06) * (egg.damageMult ?? 1))) : 0;
  const at = ctx.hitPoint ?? { x: target.x ?? 0, y: target.y ?? 0 };
  const hp = typeof target.hp === "number" ? target.hp : Infinity;
  return {
    damage: amount,
    effects: [feedbackEffect({ kind: "floater", text: String(amount), tone: element, intensity: 0.7, at })],
    comboDelta: egg.noCombo || ctx.comboGain === 0 ? 0 : 1,
    events: [],
    crit: false,
    element,
    reaction: null,
    saturated: null,
    combo: combo + 1,
    comboBefore: combo,
    burst: false,
    killed: Number.isFinite(hp) && hp - amount <= 0,
    hpAfter: hp - amount,
    absorbed: 0,
    overkill: 0,
    breakdown: null,
  };
}

/**
 * 完整命中结算：直接把 combat 契约的 `{ damage, effects, comboDelta, … }` 交给调用方。
 * 战斗控制器消费 `effects`（爆炸 / 状态 / 附着 / 增益 / 表现）与 `comboDelta`，
 * 自己不再另算一份，所以爆蛋时刻全局只有这一套实现。
 */
export function resolveStrike(egg, target, ctx = {}) {
  if (CAPS.combat) {
    try {
      const r = upstreamResolveHit(egg, target, ctx);
      if (r && Number.isFinite(r.damage) && Array.isArray(r.effects)) return r;
    } catch {
      /* 上游异常时静默降级，不能让战斗崩掉 */
    }
  }
  return fallbackStrike(egg, target, ctx);
}

/**
 * 只报告「实际在用」的实现。
 *
 * Round 2 起 `core/sim.js` 直接把 `src/physics` 的 `stepEgg` 当作唯一积分器，
 * 预测幽灵蛋与实弹跑的是同一份代码，因此这里报告的就是真实链路；
 * 上游探测失败时才退回内置兜底（届时战斗会失去弹球手感，但仍可运行）。
 */
export function describeCaps() {
  const physics = CAPS.physics
    ? CAPS.trajectory
      ? "上游积分器（预测与实弹同源）"
      : "上游积分器"
    : "上游积分器不可用 · 检查 src/physics";
  const combat = CAPS.combat ? "上游 resolveHit" : "内置兜底公式";
  return `物理 ${physics} · 伤害 ${combat}`;
}
