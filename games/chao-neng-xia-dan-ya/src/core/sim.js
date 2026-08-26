/**
 * 战场世界：上游 `src/physics` 的游戏侧适配层。
 *
 * Round 2 起积分 / 碰撞 / 回收全部交给 `src/physics`，本模块只做两件事：
 *   1. 把关卡实体（钉 / 砖 / 敌人 / 斜面 / 风扇 / 冰面 / 传送门）镜像成物理静态体与力场；
 *   2. 把物理事件翻译回战斗控制器的命中钩子。
 *
 * 渲染层与战斗层继续读 `world.pegs / bricks / enemies / …` 这些游戏实体，
 * 物理体挂在实体的 `_body` 上、并用 `body.data` 反向指回实体。
 *
 * 预测线与实弹跑的是同一个 `physics.stepEgg`、同一份静态体、同一组预步力
 * （冰面阻力与追踪转向都在 `prepareEgg` 里，两条路径共用），因此虚线与真实落点一致。
 */
import {
  EGG_RADIUS,
  FIXED_DT,
  GRAVITY,
  WORLD_H,
  WORLD_W,
  addField,
  addStatic,
  computeAABB,
  createEgg,
  createStepContext,
  createWorld as createPhysicsWorld,
  drainEvents,
  makeBrick,
  makeFan,
  makePeg,
  makePortalPair,
  makeSegment,
  markStaticsDirty,
  recycleEgg,
  removeStatic,
  stepEgg as physicsStepEgg,
  stepWorld as physicsStepWorld,
} from "../physics/index.js";

export { FIXED_DT, GRAVITY, WORLD_W, WORLD_H };

export const LAUNCH_X = WORLD_W / 2;
export const LAUNCH_Y = 92;
export const NEST_Y = 648;
export const MAX_AIM_DEG = 70;
export const MIN_SPEED = 220;
export const MAX_SPEED = 720;
export const MAX_EGG_SPEED = 1900;

/** 蛋默认空气阻力（每秒保留 1-drag）；冰面上明显更滑 */
const AIR_DRAG = 0.02;
const ICE_DRAG = 0.006;
/** 停滞回收：速度低于阈值持续这么久就收蛋，避免回合被磨蹭死 */
const STALL_SPEED = 45;
const STALL_TIME = 0.6;
const STALL_GRACE = 0.25;
/** 单发蛋的存活上限（秒） */
const EGG_LIFETIME = 12;
/** 一帧最多推进的固定步数 */
const MAX_FRAME_STEPS = 8;
/** 同一枚蛋对同一个敌人的重复命中间隔（秒） */
const REHIT_COOLDOWN = 0.08;
/** 追踪转向的搜索半径与强度（沿用第 1 轮手感） */
const HOMING_RANGE = 260;
const HOMING_ACCEL = 620;

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

let uid = 1;
export const nextId = () => uid++;

/* ------------------------------------------------------------------ *
 * 世界
 * ------------------------------------------------------------------ */

export function createWorld(opts = {}) {
  const world = createPhysicsWorld({
    gravity: opts.gravity ?? GRAVITY,
    maxSpeed: MAX_EGG_SPEED,
  });
  world.launch.x = LAUNCH_X;
  world.launch.y = LAUNCH_Y;

  // —— 游戏实体视图（渲染与战斗读这里，物理体由 syncStage 派生）——
  world.w = WORLD_W;
  world.h = WORLD_H;
  world.nestY = opts.nestY ?? NEST_Y;
  world.pegs = [];
  world.bricks = [];
  world.enemies = [];
  world.slopes = [];
  world.fans = [];
  world.ice = [];
  world.portals = [];
  world._accum = 0;
  return world;
}

/* ------------------------------------------------------------------ *
 * 关卡实体 → 物理体
 * ------------------------------------------------------------------ */

/**
 * 表面弹性换算。
 *
 * 上游按「蛋弹性 × 表面弹性」的乘积模型合成，而第 1 轮的手感是按绝对值调的
 * （钉 0.92 / 砖与斜面取蛋自身 0.85 / 敌人 0.72 / BOSS 0.9 / 冰砖 0.96）。
 * 这里把绝对值除以蛋的默认弹性折算成表面系数，切换积分器后弹跳观感不变。
 */
const EGG_BASE_RESTITUTION = 0.85;
const surface = (absolute) => absolute / EGG_BASE_RESTITUTION;

function pegBody(peg) {
  // 炸弹钉与普通钉的弹性一致，差别只在命中钩子里
  return makePeg(peg.x, peg.y, { r: peg.r ?? 9, kind: "peg", restitution: surface(0.92) });
}

function brickBody(brick) {
  const steel = brick.kind === "steel";
  return makeBrick({
    x: brick.x + brick.w / 2,
    y: brick.y + brick.h / 2,
    w: brick.w,
    h: brick.h,
    kind: brick.kind === "ice" ? "ice" : "brick",
    restitution: surface(brick.kind === "ice" ? 0.96 : EGG_BASE_RESTITUTION),
    // physics 的穿透分支只对 breakable 生效：钢砖挡穿透蛋，其余放行
    breakable: !steel,
    hp: 1,
  });
}

function enemyBody(enemy) {
  return makeBrick({
    x: enemy.x + enemy.w / 2,
    y: enemy.y + enemy.h / 2,
    w: enemy.w,
    h: enemy.h,
    kind: "enemy",
    restitution: surface(enemy.restitution ?? 0.72),
    friction: 0.1,
    // 穿透蛋应当直接洞穿敌人，而不是被弹开
    breakable: true,
    hp: 1,
  });
}

function slopeBody(slope) {
  return makeSegment({
    kind: "ramp",
    x1: slope.x1,
    y1: slope.y1,
    x2: slope.x2,
    y2: slope.y2,
    thickness: slope.thickness ?? 8,
    restitution: surface(slope.restitution ?? EGG_BASE_RESTITUTION),
  });
}

function portalBodies(portal) {
  const r = portal.r ?? 16;
  const pair = makePortalPair({ x: portal.x, y: portal.y, r }, { x: portal.tx, y: portal.ty, r });
  // 关卡传送门是单向的：出口降级成纯传感器，不会再把蛋送回入口
  pair[1].kind = "portalExit";
  return pair;
}

function fanField(fan) {
  return makeFan({
    x: fan.x + fan.w / 2,
    y: fan.y + fan.h / 2,
    w: fan.w,
    h: fan.h,
    ax: fan.ax ?? 0,
    ay: fan.ay ?? 0,
  });
}

function keepCenter() {
  return false;
}

/** 敌人会漂移与下压，每步把物理体拉回实体位置 */
function followBox(entity, body) {
  const cx = entity.x + entity.w / 2;
  const cy = entity.y + entity.h / 2;
  if (body.x === cx && body.y === cy) return false;
  body.x = cx;
  body.y = cy;
  computeAABB(body);
  return true;
}

/**
 * 单类实体的增量同步：新建 / 移除 / 跟随。
 * @returns {boolean} 是否有物理体移动过（需要重建宽相网格）
 */
function syncSolids(world, list, create, follow) {
  let moved = false;
  for (let i = 0; i < list.length; i++) {
    const item = list[i];
    if (item.alive === false) {
      if (item._body) {
        removeStatic(world, item._body);
        item._body = null;
      }
      continue;
    }
    if (!item._body) {
      const body = create(item);
      body.data = item;
      item._body = body;
      addStatic(world, body);
      continue;
    }
    if (follow(item, item._body)) moved = true;
  }
  return moved;
}

function syncPortals(world) {
  const list = world.portals;
  for (let i = 0; i < list.length; i++) {
    const item = list[i];
    if (item.alive === false) {
      if (item._body) {
        for (const body of item._bodies) removeStatic(world, body);
        item._body = null;
        item._bodies = null;
      }
      continue;
    }
    if (item._body) continue;
    const bodies = portalBodies(item);
    for (const body of bodies) {
      body.data = item;
      addStatic(world, body);
    }
    item._bodies = bodies;
    item._body = bodies[0];
  }
}

function syncFans(world) {
  const list = world.fans;
  for (let i = 0; i < list.length; i++) {
    const item = list[i];
    if (item._field) continue;
    const field = fanField(item);
    item._field = field;
    addField(world, field);
  }
}

/** 把游戏实体的增删改镜像到物理世界。每个固定步之前调用一次。 */
export function syncStage(world) {
  let moved = false;
  moved = syncSolids(world, world.pegs, pegBody, keepCenter) || moved;
  moved = syncSolids(world, world.bricks, brickBody, keepCenter) || moved;
  moved = syncSolids(world, world.enemies, enemyBody, followBox) || moved;
  moved = syncSolids(world, world.slopes, slopeBody, keepCenter) || moved;
  syncPortals(world);
  syncFans(world);
  if (moved) markStaticsDirty(world);
  return world;
}

/* ------------------------------------------------------------------ *
 * 蛋
 * ------------------------------------------------------------------ */

export function makeEgg(opts = {}) {
  const egg = createEgg({
    x: opts.x ?? LAUNCH_X,
    y: opts.y ?? LAUNCH_Y,
    vx: opts.vx ?? 0,
    vy: opts.vy ?? 400,
    r: opts.r ?? 12,
    restitution: opts.restitution ?? 0.85,
    drag: AIR_DRAG,
    power: opts.power ?? 10,
    element: opts.element ?? "none",
    pierce: opts.pierce ?? 0,
    heroId: opts.owner ?? null,
    lifetime: EGG_LIFETIME,
  });

  // —— 战斗层字段（物理层只透传，不参与积分）——
  egg.owner = opts.owner ?? null;
  egg.ownerName = opts.ownerName ?? "";
  egg.palette = opts.palette ?? ["#ffd447", "#ff8a3d", "#2a2144"];
  egg.damageMul = opts.damageMul ?? 1;
  egg.growth = opts.growth ?? 0;
  egg.homing = opts.homing ?? 0;
  egg.splitBudget = opts.splitBudget ?? 0;
  egg.splitOnHit = opts.splitOnHit ?? 0;
  egg.crit = opts.crit ?? false;
  egg.firstHitCrit = opts.firstHitCrit ?? false;
  egg.bounceScaling = opts.bounceScaling ?? 0;
  egg.isMain = opts.isMain ?? false;
  egg.hitCount = 0;
  /** 与敌人接触的次数（含预测幽灵蛋，供准星判定命中） */
  egg.enemyContacts = 0;
  /** 墙 / 斜面反弹次数，供音高与「越撞越疼」加成 */
  egg.wallBounces = 0;
  /** 总碰撞次数别名，渲染与音效读它 */
  egg.collisions = 0;
  egg.stallTime = 0;
  egg.lastHit = new Map();
  egg.trail = [];
  return egg;
}

/** 半径变化后同步质量，否则蛋与蛋的冲量解算会用旧值 */
function resizeEgg(egg, r) {
  egg.r = r;
  egg.mass = (r * r) / (EGG_RADIUS * EGG_RADIUS);
  egg.invMass = egg.mass > 0 ? 1 / egg.mass : 0;
}

export function aimVector(angleDeg, speed) {
  const a = clamp(angleDeg, -MAX_AIM_DEG, MAX_AIM_DEG);
  const rad = (a * Math.PI) / 180;
  return { vx: Math.sin(rad) * speed, vy: Math.cos(rad) * speed };
}

/** 由拖拽位移换算瞄准角与速度（向下拖 = 向下发射）。 */
export function aimFromDrag(dx, dy) {
  const len = Math.hypot(dx, dy);
  const angle = len < 1 ? 0 : (Math.atan2(dx, Math.max(dy, 1e-3)) * 180) / Math.PI;
  const power = clamp(len / 220, 0, 1);
  return {
    angle: clamp(angle, -MAX_AIM_DEG, MAX_AIM_DEG),
    power,
    speed: MIN_SPEED + (MAX_SPEED - MIN_SPEED) * power,
  };
}

/* ------------------------------------------------------------------ *
 * 预步力：冰面与追踪
 * ------------------------------------------------------------------ */

function onIce(world, egg) {
  const list = world.ice;
  const y = egg.y + egg.r;
  for (let i = 0; i < list.length; i++) {
    const p = list[i];
    if (egg.x >= p.x && egg.x <= p.x + p.w && y >= p.y && y <= p.y + p.h) return true;
  }
  return false;
}

/**
 * 固定步之前施加的非积分力。
 * 实弹与预测幽灵蛋调用的是同一个函数，虚线才不会和真实弹道分叉。
 */
function prepareEgg(world, egg, dt) {
  egg.drag = onIce(world, egg) ? ICE_DRAG : AIR_DRAG;
  if (!egg.homing) return;
  const list = world.enemies;
  let best = null;
  let bestD = HOMING_RANGE;
  for (let i = 0; i < list.length; i++) {
    const en = list[i];
    if (!en.alive) continue;
    const d = Math.hypot(en.x + en.w / 2 - egg.x, en.y + en.h / 2 - egg.y);
    if (d < bestD) {
      bestD = d;
      best = en;
    }
  }
  if (!best) return;
  const tx = best.x + best.w / 2 - egg.x;
  const ty = best.y + best.h / 2 - egg.y;
  const len = Math.hypot(tx, ty) || 1;
  const k = egg.homing * HOMING_ACCEL * dt;
  egg.vx += (tx / len) * k;
  egg.vy += (ty / len) * k;
}

/* ------------------------------------------------------------------ *
 * 物理事件 → 战斗钩子
 * ------------------------------------------------------------------ */

const NOOP_HOOKS = {};

function wallSide(ev) {
  if (ev.nx > 0.5) return "left";
  if (ev.nx < -0.5) return "right";
  return ev.ny > 0.5 ? "top" : "bottom";
}

/** 「越撞越大」每个固定步最多长一次，否则一步多次接触会瞬间撑爆半径 */
function onContact(world, egg) {
  egg.collisions = egg.bounces;
  if (!egg.growth || egg._grewStep === world.stepIndex) return;
  egg._grewStep = world.stepIndex;
  resizeEgg(egg, Math.min(34, egg.r + egg.growth));
  egg.damageMul += 0.06 * egg.growth;
}

function enemyHit(hooks, egg, enemy, ev) {
  if (!enemy || enemy.alive === false) return;
  egg.enemyContacts++;
  const last = egg.lastHit.get(enemy.id) ?? -Infinity;
  if (egg.age - last <= REHIT_COOLDOWN) return;
  egg.lastHit.set(enemy.id, egg.age);
  hooks.onEnemy?.(egg, enemy, ev);
}

function dispatch(world, hooks) {
  const events = drainEvents(world);
  if (events.length === 0) return;
  for (let i = 0; i < events.length; i++) {
    const ev = events[i];
    const egg = ev.egg;
    if (ev.type === "recycle") {
      hooks.onRecycle?.(egg, ev.reason);
      continue;
    }
    if (ev.type === "portal") {
      hooks.onPortal?.(egg, ev.body?.data ?? ev.body);
      continue;
    }
    if (ev.type !== "bounce" && ev.type !== "pierce" && ev.type !== "eggHit") continue;
    onContact(world, egg);
    if (ev.type === "eggHit") continue;

    const body = ev.body;
    if (!body) {
      egg.wallBounces++;
      hooks.onWall?.(egg, wallSide(ev));
      continue;
    }
    switch (body.kind) {
      case "peg":
        hooks.onPeg?.(egg, body.data, ev);
        break;
      case "enemy":
        enemyHit(hooks, egg, body.data, ev);
        break;
      case "brick":
      case "ice":
        hooks.onBrick?.(egg, body.data, ev);
        break;
      case "ramp":
        egg.wallBounces++;
        hooks.onSlope?.(egg, body.data, ev);
        break;
      default:
        egg.wallBounces++;
        hooks.onWall?.(egg, "wall");
    }
  }
}

/** 停滞回收：物理层的睡眠阈值（8px/s）太严，回合会拖太久。 */
function reapStalled(world, dt) {
  const eggs = world.eggs;
  let dead = false;
  for (let i = 0; i < eggs.length; i++) {
    const egg = eggs[i];
    if (!egg.alive) {
      dead = true;
      continue;
    }
    if (egg.age < STALL_GRACE) continue;
    if (Math.hypot(egg.vx, egg.vy) < STALL_SPEED) {
      egg.stallTime += dt;
      if (egg.stallTime >= STALL_TIME) {
        recycleEgg(world, egg, "stalled");
        dead = true;
      }
    } else {
      egg.stallTime = 0;
    }
  }
  if (!dead) return;
  let w = 0;
  for (let i = 0; i < eggs.length; i++) if (eggs[i].alive) eggs[w++] = eggs[i];
  eggs.length = w;
}

function pushTrails(world) {
  const eggs = world.eggs;
  for (let i = 0; i < eggs.length; i++) {
    const egg = eggs[i];
    if (!egg.trail) continue;
    if (egg.trail.length > 14) egg.trail.shift();
    egg.trail.push([egg.x, egg.y]);
  }
}

/**
 * 推进一帧（内部按 1/120 固定步累积）。
 * @param {object} world
 * @param {number} dt   帧时长（秒）
 * @param {object} hooks 命中回调：onWall / onSlope / onPeg / onBrick / onEnemy / onPortal / onRecycle
 */
export function stepWorld(world, dt, hooks = NOOP_HOOKS) {
  const h = world.dt ?? FIXED_DT;
  // 回合之间不留半步余量，否则下一发的第一帧会莫名多跑一步
  if (world.eggs.length === 0) world._accum = 0;
  world._accum = Math.min((world._accum ?? 0) + Math.max(0, dt || 0), h * MAX_FRAME_STEPS);
  let steps = 0;
  while (world._accum >= h && steps < MAX_FRAME_STEPS) {
    world._accum -= h;
    steps++;
    syncStage(world);
    const eggs = world.eggs;
    for (let i = 0; i < eggs.length; i++) {
      if (eggs[i].alive) prepareEgg(world, eggs[i], h);
    }
    physicsStepWorld(world, h);
    reapStalled(world, h);
    dispatch(world, hooks);
    pushTrails(world);
    if (world.eggs.length === 0) break;
  }
  return world;
}

/* ------------------------------------------------------------------ *
 * 弹道预测
 * ------------------------------------------------------------------ */

const ghostCtx = createStepContext(false);
const STAT_KEYS = [
  "bounces",
  "wallHits",
  "pegHits",
  "brickHits",
  "eggHits",
  "portalUses",
  "breaks",
  "recycled",
  "spawned",
];
const savedStats = {};

/**
 * 弹道预测：幽灵蛋走 `physics.stepEgg`——与实弹逐字相同的积分与碰撞路径。
 *
 * 为了拿到「撞到的是谁」，幽灵蛋临时开启事件（否则物理层只会告诉我们撞了几次），
 * 跑完后把世界的事件队列、统计与静态体命中计数全部还原，对外零副作用。
 *
 * @returns {{points:number[][], bounces:number, hitsEnemy:boolean, impact:number[]|null, target:object|null}}
 */
export function predictTrajectory(origin, velocity, world, opts = {}) {
  syncStage(world);
  const dt = world.dt ?? FIXED_DT;
  const maxBounces = opts.maxBounces ?? 3;
  const maxSteps = opts.maxSteps ?? 480;

  const ghost = createEgg({
    id: "ghost",
    x: origin.x,
    y: origin.y,
    vx: velocity.x ?? velocity.vx ?? 0,
    vy: velocity.y ?? velocity.vy ?? 0,
    r: opts.r ?? 12,
    restitution: opts.restitution ?? 0.85,
    pierce: opts.pierce ?? 0,
    lifetime: 0,
  });
  ghost.homing = opts.homing ?? 0;

  for (const key of STAT_KEYS) savedStats[key] = world.stats[key];
  const eventMark = world.events.length;
  const touched = [];
  ghostCtx.emit = true;

  const points = [[ghost.x, ghost.y]];
  let bounces = 0;
  let impact = null;
  let hitsEnemy = false;
  let target = null;
  let slow = 0;

  for (let i = 0; i < maxSteps; i++) {
    const before = ghost.bounces;
    prepareEgg(world, ghost, dt);
    physicsStepEgg(world, ghost, dt, ghostCtx);
    ghost.age += dt;

    for (let k = eventMark; k < world.events.length; k++) {
      const body = world.events[k].body;
      if (!body) continue;
      touched.push(body);
      if (body.kind === "enemy" && !hitsEnemy) {
        hitsEnemy = true;
        impact = [world.events[k].x, world.events[k].y];
        target = body.data;
      }
    }
    world.events.length = eventMark;

    const hit = ghost.bounces - before;
    if (hit > 0) {
      bounces += hit;
      points.push([ghost.x, ghost.y]);
    } else if (i % 3 === 0) {
      points.push([ghost.x, ghost.y]);
    }
    if (bounces >= maxBounces) break;
    if (ghost.y - ghost.r > world.h + 10) break;
    // 停滞判定要和实弹的 reapStalled 一样看「持续多久」：
    // 只看瞬时速度的话，竖直反弹的最高点会把虚线提前掐断
    if (Math.hypot(ghost.vx, ghost.vy) < STALL_SPEED) {
      slow += dt;
      if (slow >= STALL_TIME) break;
    } else {
      slow = 0;
    }
  }

  const last = points[points.length - 1];
  if (last[0] !== ghost.x || last[1] !== ghost.y) points.push([ghost.x, ghost.y]);

  ghostCtx.emit = false;
  world.events.length = eventMark;
  for (const key of STAT_KEYS) world.stats[key] = savedStats[key];
  for (const body of touched) body.hits--;

  return { points, bounces, hitsEnemy, impact, target };
}
