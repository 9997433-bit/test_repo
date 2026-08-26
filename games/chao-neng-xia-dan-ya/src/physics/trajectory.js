/**
 * 弹道预测：用与实际积分完全相同的代码路径跑一个「幽灵蛋」，
 * 保证虚线预览与真实落点一致（同一份重力、力场、碰撞解算）。
 *
 * 同源保证：预测与 `stepWorld` 都只经由 `advanceEgg` 推进，
 * 谁也拿不到私有的积分分支；幽灵蛋另起一条时间轴（`ctx.time`），
 * 穿透冷却、命中冷却因此与实弹按同样的节奏推进。
 *
 * 幽灵蛋不入 `world.eggs`，不写事件、不改世界统计、不破坏砖块。
 * GDD 要求：瞄准虚线最多预览 3 次反弹。
 */

import {
  PREDICT_MAX_BOUNCES,
  PREDICT_MAX_STEPS,
  PREDICT_SAMPLE_EVERY,
} from "./constants.js";
import { advanceEgg, createEgg, createStepContext, resetStepContext } from "./world.js";

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

/** 把接触快照转成瞄准 UI 直接可用的命中点 */
function toHit(contact, pointIndex) {
  if (!contact) return null;
  return {
    x: contact.x,
    y: contact.y,
    nx: contact.nx,
    ny: contact.ny,
    /** 命中瞬间的蛋心与入射速度（reflect 之前） */
    ex: contact.ex,
    ey: contact.ey,
    vx: contact.vx,
    vy: contact.vy,
    speed: contact.speed,
    impact: contact.impact,
    bodyId: contact.bodyId,
    kind: contact.kind,
    team: contact.team,
    enemy: contact.enemy,
    step: contact.step,
    time: contact.time,
    /** 在 points 数组中的大致位置，方便描准星 */
    index: pointIndex,
  };
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
 *   reason: "bounces"|"out"|"steps"|"enemy"|"sensor"|"empty",
 *   contacts: Array<object>,
 *   contactCount: number,
 *   enemyContacts: number,
 *   hitsEnemy: boolean,
 *   firstHit: object|null,
 *   firstEnemyHit: object|null,
 *   impact: [number,number]|null
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
    contacts: [],
    contactCount: 0,
    enemyContacts: 0,
    hitsEnemy: false,
    firstHit: null,
    firstEnemyHit: null,
    impact: null,
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
  ctx.collect = true;
  // 幽灵蛋从当前世界时刻起跑，冷却窗口与实弹对齐
  resetStepContext(ctx, w.time);

  const b = w.bounds;
  const stopOnEnemy = opts.stopOnEnemy === true;
  let reason = "steps";
  let steps = 0;
  let sinceSample = 0;
  let firstHit = null;
  let firstEnemyHit = null;

  for (let i = 0; i < maxSteps; i++) {
    const before = ghost.bounces;
    const contactsBefore = ctx.contacts.length;
    advanceEgg(w, ghost, dt, ctx);
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

    // 命中点在 reflect 之前就已落账，这里只是把它挑出来
    if (ctx.contacts.length > contactsBefore) {
      for (let k = contactsBefore; k < ctx.contacts.length; k++) {
        const c = ctx.contacts[k];
        if (!firstHit) firstHit = toHit(c, points.length - 1);
        if (!firstEnemyHit && c.enemy) firstEnemyHit = toHit(c, points.length - 1);
      }
      if (stopOnEnemy && firstEnemyHit) {
        reason = "enemy";
        break;
      }
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

  const impactPoint = firstEnemyHit ?? firstHit;
  return {
    points,
    bouncePoints,
    bounces: ghost.bounces,
    steps,
    duration: steps * dt,
    end: { x: ghost.x, y: ghost.y, vx: ghost.vx, vy: ghost.vy },
    reason,
    /** 沿途所有接触快照，按发生顺序 */
    contacts: ctx.contacts.slice(),
    contactCount: ghost.contacts,
    enemyContacts: ghost.enemyContacts,
    hitsEnemy: ghost.enemyContacts > 0,
    firstHit,
    firstEnemyHit,
    /** core/sim.js 兼容形态：优先给敌人首命中点 */
    impact: impactPoint ? [impactPoint.x, impactPoint.y] : null,
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
