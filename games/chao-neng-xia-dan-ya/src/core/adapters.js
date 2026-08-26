/**
 * 上游模块适配层。
 *
 * `src/physics/**`（Opus-1）与 `src/combat/**`（Opus-2）与本模块并行开发。
 * 主循环在启动时探测上游能力：能用就用上游，仍是脚手架就走内置实现，
 * 这样任何一方先落地都不会把游戏卡成不可玩。
 */
import * as upstreamPhysics from "../physics/index.js";
import { resolveHit as upstreamResolveHit } from "../combat/index.js";

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

/** 基础伤害标量：优先走 combat 契约的纯函数，失败时退回等价内置公式。 */
export function baseHit(egg, target, ctx) {
  if (CAPS.combat) {
    try {
      const r = upstreamResolveHit(egg, target, ctx);
      if (r && Number.isFinite(r.damage)) {
        return { damage: r.damage, effects: r.effects ?? [], comboDelta: r.comboDelta ?? 1 };
      }
    } catch {
      /* 上游异常时静默降级，不能让战斗崩掉 */
    }
  }
  const power = egg?.power ?? 10;
  const combo = ctx?.combo ?? 0;
  return { damage: Math.max(1, Math.round(power * (1 + combo * 0.06))), effects: [], comboDelta: 1 };
}

/**
 * 只报告「实际在用」的实现，避免探测到上游能力却仍走内置时产生误导。
 * 弹道积分目前统一走 core/sim.js，这样预测虚线与真实轨迹必然同源；
 * 迁移到上游积分器是 Round 2 的事。
 */
export function describeCaps() {
  const physics = CAPS.physics ? "内置积分器（上游已就绪，待接入）" : "内置积分器";
  const combat = CAPS.combat ? "上游 resolveHit" : "内置兜底公式";
  return `物理 ${physics} · 伤害 ${combat}`;
}
