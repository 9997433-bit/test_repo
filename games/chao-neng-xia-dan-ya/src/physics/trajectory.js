/**
 * 弹道预测：用与实际积分完全相同的代码路径跑一个「幽灵蛋」，
 * 保证虚线预览与真实落点一致（同一份重力、力场、碰撞解算）。
 *
 * 幽灵蛋不入 `world.eggs`，不写事件、不改世界统计、不破坏砖块。
 * GDD 要求：瞄准虚线最多预览 3 次反弹。
 */

import {
  PREDICT_MAX_BOUNCES,
  PREDICT_MAX_STEPS,
  PREDICT_SAMPLE_EVERY,
} from "./constants.js";
import { createEgg, createStepContext, stepEgg } from "./world.js";

const ghostCtx = createStepContext(false);

function looksLikeWorld(v) {
  return !!v && Array.isArray(v.eggs) && Array.isArray(v.statics);
}

function normalizeArgs(a, b, c, d) {
  // 契约签名：predictTrajectory(origin, velocity, world, options)
  // 同时容错 world 前置的调用方式
  if (looksLikeWorld(a)) return { world: a, origin: b, velocity: c, options: d };
  return { world: c, origin: a, velocity: b, options: d };
}

/**
 * 详细版预测。
 * @returns {{
 *   points: Array<{x:number,y:number}>,
 *   bouncePoints: Array<{x:number,y:number,index:number}>,
 *   bounces: number,
 *   steps: number,
 *   duration: number,
 *   end: {x:number,y:number,vx:number,vy:number},
 *   reason: "bounces"|"out"|"steps"|"sensor"|"empty"
 * }}
 */
export function predictTrajectoryDetailed(origin, velocity, world, options) {
  const args = normalizeArgs(origin, velocity, world, options);
  const w = args.world;
  const start = args.origin || { x: 0, y: 0 };
  const vel = args.velocity || { x: 0, y: 0 };
  const raw = args.options;
  // 数字形态即契约里的 `steps`：每步取一个样本，返回恰好 steps 个点（提前
  // 终止时更短）。对象形态面向瞄准 UI，默认抽稀并带上起点。
  const opts =
    typeof raw === "number"
      ? { maxSteps: raw, sampleEvery: 1, includeOrigin: false }
      : raw || {};

  const empty = {
    points: [],
    bouncePoints: [],
    bounces: 0,
    steps: 0,
    duration: 0,
    end: { x: start.x ?? 0, y: start.y ?? 0, vx: 0, vy: 0 },
    reason: "empty",
  };
  if (!w) return empty;

  const dt = opts.dt ?? w.dt;
  const maxBounces = opts.maxBounces ?? PREDICT_MAX_BOUNCES;
  const maxSteps = Math.max(1, opts.maxSteps ?? PREDICT_MAX_STEPS);
  const sampleEvery = Math.max(1, opts.sampleEvery ?? PREDICT_SAMPLE_EVERY);

  const ghost = createEgg({
    id: "ghost",
    x: start.x ?? 0,
    y: start.y ?? 0,
    vx: vel.x ?? vel.vx ?? 0,
    vy: vel.y ?? vel.vy ?? 0,
    r: opts.r ?? opts.radius ?? undefined,
    restitution: opts.restitution,
    friction: opts.friction,
    drag: opts.drag,
    gravityScale: opts.gravityScale,
    pierce: opts.pierce ?? 0,
    lifetime: 0,
  });

  const includeOrigin = opts.includeOrigin !== false;
  const points = includeOrigin ? [{ x: ghost.x, y: ghost.y }] : [];
  const bouncePoints = [];
  const ctx = opts.context || ghostCtx;
  ctx.emit = false;
  ctx.ghost = true;

  const b = w.bounds;
  let reason = "steps";
  let steps = 0;
  let sinceSample = 0;

  for (let i = 0; i < maxSteps; i++) {
    const before = ghost.bounces;
    stepEgg(w, ghost, dt, ctx);
    steps++;
    sinceSample++;
    const bounced = ghost.bounces > before;

    if (bounced) {
      bouncePoints.push({ x: ghost.x, y: ghost.y, index: points.length });
      points.push({ x: ghost.x, y: ghost.y });
      sinceSample = 0;
    } else if (sinceSample >= sampleEvery) {
      points.push({ x: ghost.x, y: ghost.y });
      sinceSample = 0;
    }

    if (ghost.bounces >= maxBounces) {
      reason = "bounces";
      break;
    }
    if (
      ghost.y > b.bottom + ghost.r ||
      ghost.y < b.top - 200 ||
      ghost.x < b.left - 40 ||
      ghost.x > b.right + 40
    ) {
      reason = "out";
      break;
    }
  }

  const last = points[points.length - 1];
  if (!last || last.x !== ghost.x || last.y !== ghost.y) {
    points.push({ x: ghost.x, y: ghost.y });
  }

  return {
    points,
    bouncePoints,
    bounces: ghost.bounces,
    steps,
    duration: steps * dt,
    end: { x: ghost.x, y: ghost.y, vx: ghost.vx, vy: ghost.vy },
    reason,
  };
}

/**
 * 稳定契约版：返回可直接连线的点序列（最多 3 次反弹）。
 * @param {{x:number,y:number}} origin
 * @param {{x:number,y:number}} velocity
 * @param {object} world
 * @param {number|object} [options] 数字视为最大步数
 * @returns {Array<{x:number,y:number}>}
 */
export function predictTrajectory(origin, velocity, world, options) {
  return predictTrajectoryDetailed(origin, velocity, world, options).points;
}

/**
 * 按瞄准角预测（0=正下，负=左，正=右），供瞄准 UI 直接调用。
 */
export function predictAim(world, aim, speed, options) {
  const origin = options?.origin || world.launch;
  const velocity = { x: Math.sin(aim) * speed, y: Math.cos(aim) * speed };
  return predictTrajectoryDetailed(origin, velocity, world, options);
}
