/**
 * 物理世界：固定步长积分器 + 碰撞解算 + 回收。
 *
 * 设计约束（见 .agent_workspace/ARCHITECTURE.md）：
 *   - 纯 JS，不引用 window/document/performance，可在 Node 下 headless 运行
 *   - 固定步 1/120s，渲染层用 prevX/prevY 做插值
 *   - 确定性：禁止 Math.random，随机只走 `nextRandom(world)`
 *   - world 是可 structuredClone 的纯数据，不挂函数
 *
 * 世界结构保持脚手架契约：`{ eggs, statics, fields, time }`。
 * 左右墙与顶板由 `world.bounds` 解析式处理，底部默认开放用于回收，
 * 因此 `statics` 只放关卡自定义的砖 / 钉 / 斜面 / 传送门。
 *
 * ## 固定步确定性
 *
 * 世界的演化只由「初始状态 + 步长序列 + 外部调用序列」决定：
 *   - 时钟只在 `stepWorld` 里走；模块内不读 `Date` / `performance`；
 *   - 随机只走 `nextRandom(world)`（状态是 `world.rngState` 整数，进快照）；
 *   - 进世界的蛋 id 由 `world.eggSeq` 分配，不吃模块级自增计数器；
 *   - 变帧驱动一律经 `advanceWorld`，它把 elapsed 钳进 `MAX_FRAME_TIME`
 *     再切成固定步，掉帧只影响补几步、不影响每步的结果。
 *
 * 唯一的例外是**绕过工厂自己发 id 的调用方**：`createEgg()` 与 `makeXxx()`
 * 工厂各有一个模块级计数器（`core/sim.js` 走的就是这条路）。要逐位复现
 * 这类回放，开跑前调一次 `resetEggIds()` + `resetBodyIds()`；只想验证解算
 * 本身可以用 `hashWorld(world, { ids: false })` 把 id 排除在外。
 * 校验工具见 `determinism.js`（`hashWorld` / `checkDeterminism`）。
 *
 * ## 克隆安全
 *
 * 宽相网格 `grid`、id 索引 `staticById`、步进上下文 `_ctx` 这些派生结构全部挂成
 * **不可枚举**属性：`structuredClone(world)` / `expect(world).toEqual(...)` 只看
 * 自有可枚举属性，于是快照里既没有 Map、也没有随查询次数变化的去重戳。
 * 克隆回来的纯数据世界可以直接继续 `stepWorld`——所有读取点都走
 * `ensureIndex` / `ensureGrid` / `ensureCtx` 惰性重建，`reviveWorld` 则是
 * 一次性把它们补齐的显式入口。
 */

import {
  CONTACT_COOLDOWN,
  EGG_DRAG,
  EGG_FRICTION,
  EGG_LIFETIME,
  EGG_RADIUS,
  EGG_RESTITUTION,
  FIXED_DT,
  GRAVITY,
  GRID_CELL,
  HIT_LOG_SIZE,
  MAX_EVENTS,
  MAX_FRAME_STEPS,
  MAX_FRAME_TIME,
  MAX_SPEED,
  MAX_SUBSTEPS,
  MIN_CONTACT_IMPACT,
  OUT_MARGIN_BOTTOM,
  OUT_MARGIN_SIDE,
  OUT_MARGIN_TOP,
  RESTING_VELOCITY,
  SLEEP_SPEED,
  SLEEP_TIME,
  SPAWN_GRACE,
  SUBSTEP_TRAVEL_RATIO,
  WORLD_H,
  WORLD_W,
} from "./constants.js";
import { createGrid, queryGrid, rebuildGrid } from "./broadphase.js";
import {
  circleVsCircle,
  collideCircleBody,
  createManifold,
  resolveEggPair,
  resolveStaticContact,
} from "./collide.js";
import { fieldContains, isEnemyBody, makeSegment, normalizeBody } from "./shapes.js";
import {
  computePortalExit,
  createPortalExit,
  isPortalBody,
  isPortalEntry,
  portalDestination,
} from "./portals.js";
import { clamp, damp, normalizeAngle } from "./math.js";

export { WORLD_W, WORLD_H, GRAVITY, FIXED_DT } from "./constants.js";

let nextEggId = 1;

/**
 * 复位「脱离世界构造的蛋」的自增 id。
 *
 * 经 `spawnEgg` / `launchEgg` / `splitEgg` 入场的蛋走的是世界自己的
 * `world.eggSeq`（见 `allocEggId`），天然可复现；这个模块级计数器只服务
 * 直接调 `createEgg()` 再自行 push 的调用方，回放前与 `resetBodyIds()`
 * 一起复位即可对齐。
 */
export function resetEggIds(value = 1) {
  nextEggId = value;
}

/**
 * 内部派生结构挂成不可枚举属性：快照 / 深比较只看自有可枚举属性，
 * 于是 Map、宽相网格、步进上下文都不会进入 `structuredClone(world)`。
 */
function defineHidden(target, key, value) {
  Object.defineProperty(target, key, {
    value,
    writable: true,
    configurable: true,
    enumerable: false,
  });
  return value;
}

/** 属性存在但还是可枚举的（老世界 / 手搓世界）就地改成隐藏 */
function hide(target, key, fallback) {
  const desc = Object.getOwnPropertyDescriptor(target, key);
  if (desc && !desc.enumerable) return target[key];
  return defineHidden(target, key, desc ? target[key] : fallback);
}

/** 静态体 id 索引；缺失（如刚从快照恢复）时重建 */
function ensureIndex(world) {
  let index = world.staticById;
  if (!(index instanceof Map)) {
    index = defineHidden(world, "staticById", new Map());
    world.staticsDirty = true;
  }
  return index;
}

/** 步进上下文；缺失时重建 */
function ensureCtx(world) {
  const ctx = world._ctx;
  if (ctx && ctx.manifold && Array.isArray(ctx.candidates)) return ctx;
  return defineHidden(world, "_ctx", createStepContext());
}

/* ------------------------------------------------------------------ *
 * 构造
 * ------------------------------------------------------------------ */

/**
 * 创建世界。
 * @param {object} [opts]
 * @param {number} [opts.gravity]  重力加速度，默认 1680
 * @param {number} [opts.dt]       固定步长，默认 1/120
 * @param {number} [opts.seed]     随机种子（分裂扰动等）
 * @param {object} [opts.bounds]   `{ left, top, right, bottom }`
 * @param {object} [opts.boundsMode] 每条边 `"bounce" | "open"`，默认底部 open
 */
export function createWorld(opts = {}) {
  const bounds = {
    left: opts.bounds?.left ?? 0,
    top: opts.bounds?.top ?? 0,
    right: opts.bounds?.right ?? WORLD_W,
    bottom: opts.bounds?.bottom ?? WORLD_H,
  };
  const world = {
    // —— 脚手架契约字段 ——
    eggs: [],
    statics: [],
    fields: [],
    time: 0,

    // —— 积分参数 ——
    dt: opts.dt ?? FIXED_DT,
    gravity: opts.gravity ?? GRAVITY,
    maxSpeed: opts.maxSpeed ?? MAX_SPEED,
    bounds,
    boundsMode: {
      left: opts.boundsMode?.left ?? "bounce",
      right: opts.boundsMode?.right ?? "bounce",
      top: opts.boundsMode?.top ?? "bounce",
      bottom: opts.boundsMode?.bottom ?? "open",
    },
    wallRestitution: opts.wallRestitution ?? 1,
    wallFriction: opts.wallFriction ?? 0.02,

    // —— 运行时状态 ——
    stepIndex: 0,
    accumulator: 0,
    events: [],
    /** 炸弹砖破碎后待结算的爆炸，交由 queries.resolveBlasts 处理 */
    pendingBlasts: [],
    stats: {
      bounces: 0,
      wallHits: 0,
      pegHits: 0,
      brickHits: 0,
      eggHits: 0,
      portalUses: 0,
      breaks: 0,
      recycled: 0,
      spawned: 0,
    },

    /** 发射台默认位置（顶部中央），UI 与关卡可覆盖 */
    launch: { x: (bounds.left + bounds.right) / 2, y: bounds.top + 44 },

    /** 接触流水号，供战斗层去重（幽灵蛋不消耗） */
    contactSeq: 0,
    /** 入场蛋的 id 流水号，保证同种子回放拿到同样的 id */
    eggSeq: 0,
    /** 同一枚蛋重复命中同一物体的最小间隔（s） */
    contactCooldown: opts.contactCooldown ?? CONTACT_COOLDOWN,

    seed: opts.seed ?? 20260826,
    /**
     * 随机数以整型状态保存而非闭包，world 必须保持「可 structuredClone
     * 的纯数据」，UI / 测试才能直接快照比对。取值走 `nextRandom(world)`。
     */
    rngState: (opts.seed ?? 20260826) >>> 0,
    gridCell: opts.gridCell ?? GRID_CELL,
    staticsDirty: true,
  };
  // 派生结构不进快照：宽相网格、id 索引、步进上下文
  defineHidden(world, "grid", null);
  defineHidden(world, "staticById", new Map());
  defineHidden(world, "_gridLength", -1);
  defineHidden(world, "_ctx", createStepContext());
  if (opts.statics) addStatic(world, opts.statics);
  if (opts.fields) addField(world, opts.fields);
  if (opts.walls) addArenaWalls(world, opts.walls === true ? {} : opts.walls);
  return world;
}

/**
 * 解算上下文：ghost 模式（弹道预测）不写事件、不改世界统计。
 *
 * `time` 是本次推进的逻辑时刻。真实模拟用 `world.time`，幽灵蛋自带一条
 * 独立时间轴，这样穿透冷却、命中冷却在预测里与实弹走同一套判定。
 * `collect` 打开后每次接触会被推进 `contacts`，供预测线读首命中点。
 */
export function createStepContext(emit = true) {
  return {
    emit,
    ghost: !emit,
    time: 0,
    seq: 0,
    candidates: [],
    manifold: createManifold(),
    collect: false,
    contacts: [],
    lastContact: null,
  };
}

/** 复用 ghost 上下文前清空一次接触缓存 */
export function resetStepContext(ctx, time = 0) {
  ctx.time = time;
  ctx.seq = 0;
  ctx.contacts.length = 0;
  ctx.lastContact = null;
  return ctx;
}

/**
 * 把一份纯数据世界（`structuredClone` / JSON 快照的产物）补成可步进的世界。
 *
 * 幂等：对正常世界调用只是重新确认隐藏属性。恢复后 `stepWorld` 与原世界
 * 逐位一致——所有派生结构都会按当前 `statics` 重建，不依赖克隆前的内容。
 */
export function reviveWorld(world) {
  if (!world || typeof world !== "object") return world;
  if (!Array.isArray(world.eggs)) world.eggs = [];
  if (!Array.isArray(world.statics)) world.statics = [];
  if (!Array.isArray(world.fields)) world.fields = [];
  if (!Array.isArray(world.events)) world.events = [];
  if (!Array.isArray(world.pendingBlasts)) world.pendingBlasts = [];
  if (!Number.isFinite(world.time)) world.time = 0;
  if (!Number.isFinite(world.stepIndex)) world.stepIndex = 0;
  if (!Number.isFinite(world.accumulator)) world.accumulator = 0;
  if (!Number.isFinite(world.dt) || world.dt <= 0) world.dt = FIXED_DT;
  if (!Number.isFinite(world.eggSeq)) world.eggSeq = 0;
  if (!Number.isFinite(world.contactSeq)) world.contactSeq = 0;
  if (!Number.isFinite(world.rngState)) world.rngState = (world.seed ?? 0) >>> 0;

  hide(world, "grid", null);
  hide(world, "_gridLength", -1);
  hide(world, "_ctx", createStepContext());
  hide(world, "staticById", new Map());
  ensureIndex(world);
  ensureCtx(world);

  // 快照里没有 `_norm` / `_stamp`，这一遍把静态体重新规范化并装回隐藏槽位
  for (let i = 0; i < world.statics.length; i++) normalizeBody(world.statics[i]);
  for (let i = 0; i < world.eggs.length; i++) normalizeEgg(world.eggs[i]);
  world.staticsDirty = true;
  world._gridLength = -1;
  world.grid = null;
  return world;
}

/** 重置世界到空场（保留参数与种子） */
export function resetWorld(world) {
  reviveWorld(world);
  world.eggs.length = 0;
  world.statics.length = 0;
  world.fields.length = 0;
  world.events.length = 0;
  world.pendingBlasts.length = 0;
  world.staticById.clear();
  world.time = 0;
  world.stepIndex = 0;
  world.accumulator = 0;
  world.staticsDirty = true;
  world._gridLength = -1;
  world.grid = null;
  world.rngState = world.seed >>> 0;
  world.contactSeq = 0;
  world.eggSeq = 0;
  for (const key of Object.keys(world.stats)) world.stats[key] = 0;
  return world;
}

/** 世界内确定性随机（mulberry32 的无闭包写法），返回 [0,1) */
export function nextRandom(world) {
  let a = (world.rngState + 0x6d2b79f5) >>> 0;
  world.rngState = a;
  let t = a;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

/* ------------------------------------------------------------------ *
 * 静态体 / 力场
 * ------------------------------------------------------------------ */

export function addStatic(world, body) {
  if (Array.isArray(body)) {
    for (let i = 0; i < body.length; i++) addStatic(world, body[i]);
    return body;
  }
  normalizeBody(body);
  world.statics.push(body);
  ensureIndex(world).set(body.id, body);
  world.staticsDirty = true;
  return body;
}

/**
 * 同步静态体：补齐外部直接 push 进来的鸭子类型物体、刷新 id 索引与包围盒。
 * 只在拓扑发生变化时执行完整扫描。
 */
export function syncStatics(world) {
  const index = ensureIndex(world);
  if (!world.staticsDirty && world._gridLength === world.statics.length) return false;
  const list = world.statics;
  index.clear();
  for (let i = 0; i < list.length; i++) {
    const body = list[i];
    normalizeBody(body);
    index.set(body.id, body);
  }
  return true;
}

export function removeStatic(world, body) {
  const index = ensureIndex(world);
  const target = typeof body === "string" ? index.get(body) : body;
  if (!target) return false;
  const i = world.statics.indexOf(target);
  if (i >= 0) world.statics.splice(i, 1);
  index.delete(target.id);
  target.active = false;
  world.staticsDirty = true;
  return true;
}

export function getStatic(world, id) {
  return ensureIndex(world).get(id) || null;
}

export function addField(world, field) {
  if (Array.isArray(field)) {
    for (let i = 0; i < field.length; i++) addField(world, field[i]);
    return field;
  }
  world.fields.push(field);
  return field;
}

export function removeField(world, field) {
  const i = world.fields.indexOf(field);
  if (i >= 0) world.fields.splice(i, 1);
  return i >= 0;
}

/** 静态体被外部直接改动坐标/数量后调用 */
export function markStaticsDirty(world) {
  world.staticsDirty = true;
}

/**
 * 对静态体结算伤害。物理层只负责生死与拓扑，伤害数值由 combat 计算。
 * 炸弹砖破碎时把爆炸推入 `world.pendingBlasts`，由 `resolveBlasts` 展开连锁。
 */
export function damageStatic(world, body, amount = 0, ctx = null) {
  if (!body || body.active === false) return { destroyed: false, hp: 0, body };
  if (!body.breakable) return { destroyed: false, hp: body.hp, body };
  body.hp -= amount;
  if (body.hp > 0) return { destroyed: false, hp: body.hp, body };
  body.hp = 0;
  const cx = body.shape === "segment" ? (body.x1 + body.x2) / 2 : body.x;
  const cy = body.shape === "segment" ? (body.y1 + body.y2) / 2 : body.y;
  removeStatic(world, body);
  world.stats.breaks++;
  emit(world, { type: "break", body, x: cx, y: cy, source: ctx?.source ?? null });
  if (body.explosive && body.blastRadius > 0) {
    world.pendingBlasts.push({
      x: cx,
      y: cy,
      radius: body.blastRadius,
      power: body.blastPower,
      source: body,
      depth: (ctx?.depth ?? 0) + 1,
    });
  }
  return { destroyed: true, hp: 0, body };
}

/** 取出并清空待结算爆炸 */
export function drainBlasts(world) {
  if (world.pendingBlasts.length === 0) return [];
  const out = world.pendingBlasts.slice();
  world.pendingBlasts.length = 0;
  return out;
}

/**
 * 把左右墙与顶板改成显式线段静态体（需要斜角墙、可破坏墙时使用）。
 * 加入后对应边界的解析式反弹会关闭，避免双重处理。
 */
export function addArenaWalls(world, opts = {}) {
  const b = world.bounds;
  const base = { thickness: opts.thickness ?? 0, kind: "wall", restitution: opts.restitution };
  const bodies = [
    makeSegment({ ...base, x1: b.left, y1: b.top, x2: b.left, y2: b.bottom }),
    makeSegment({ ...base, x1: b.right, y1: b.top, x2: b.right, y2: b.bottom }),
  ];
  world.boundsMode.left = "open";
  world.boundsMode.right = "open";
  if (opts.top !== false) {
    bodies.push(makeSegment({ ...base, x1: b.left, y1: b.top, x2: b.right, y2: b.top }));
    world.boundsMode.top = "open";
  }
  if (opts.bottom === true) {
    bodies.push(makeSegment({ ...base, x1: b.left, y1: b.bottom, x2: b.right, y2: b.bottom }));
    world.boundsMode.bottom = "open";
  }
  addStatic(world, bodies);
  return bodies;
}

/* ------------------------------------------------------------------ *
 * 蛋
 * ------------------------------------------------------------------ */

/** 创建一枚蛋（不入世界） */
export function createEgg(opts = {}) {
  const r = opts.r ?? EGG_RADIUS;
  const mass = opts.mass ?? (r * r) / (EGG_RADIUS * EGG_RADIUS);
  const x = opts.x ?? 0;
  const y = opts.y ?? 0;
  return {
    id: opts.id || `egg${nextEggId++}`,
    kind: opts.kind ?? "egg",
    x,
    y,
    prevX: x,
    prevY: y,
    vx: opts.vx ?? 0,
    vy: opts.vy ?? 0,
    r,
    mass,
    invMass: mass > 0 ? 1 / mass : 0,
    restitution: clamp(opts.restitution ?? EGG_RESTITUTION, 0, 1.4),
    friction: clamp(opts.friction ?? EGG_FRICTION, 0, 1),
    drag: opts.drag ?? EGG_DRAG,
    gravityScale: opts.gravityScale ?? 1,

    alive: true,
    sleeping: false,
    restTimer: 0,
    age: 0,
    lifetime: opts.lifetime ?? EGG_LIFETIME,

    bounces: 0,
    wallHits: 0,
    pegHits: 0,
    brickHits: 0,
    eggHits: 0,
    portalUses: 0,

    // —— 接触账本（reflect 之前写入，见 noteContact）——
    /** 与静态体 / 边界的有效接触次数 */
    contacts: 0,
    /** 其中命中敌人碰撞盒的次数 */
    enemyContacts: 0,
    /** 首次接触 / 首次命中敌人 / 最近一次接触，均为 reflect 前的快照 */
    firstContact: null,
    firstEnemyContact: null,
    lastContact: null,
    /** 最近命中过的物体 id + 时刻，用于 `fresh` 冷却判定 */
    hitLog: [],

    /** 剩余分裂次数 */
    splitsLeft: opts.splitsLeft ?? 0,
    /** 剩余穿透次数：>0 时穿过可碎砖不反弹 */
    pierce: opts.pierce ?? 0,
    /** 战斗层读取的强度值，物理层只透传 */
    power: opts.power ?? 1,
    element: opts.element ?? null,
    team: opts.team ?? "player",
    heroId: opts.heroId ?? null,
    generation: opts.generation ?? 0,
    tags: opts.tags ? { ...opts.tags } : {},
    data: opts.data ?? null,

    angle: opts.angle ?? 0,
    spin: 0,
    portalCooldown: 0,
    _ignoreId: null,
    _ignoreUntil: 0,
  };
}

const numOr = (v, fallback) => (Number.isFinite(v) ? v : fallback);

/**
 * 把「外部直接 push 进 world.eggs 的鸭子类型蛋」补齐成合法刚体。
 * 兼容 `radius` 别名，缺失字段取默认值，幂等（靠 invMass 判定）。
 */
export function normalizeEgg(egg) {
  if (Number.isFinite(egg.invMass)) return egg;
  const r = numOr(egg.r, numOr(egg.radius, EGG_RADIUS));
  egg.r = r;
  if (egg.radius !== undefined) egg.radius = r;
  const mass = numOr(egg.mass, (r * r) / (EGG_RADIUS * EGG_RADIUS));
  egg.mass = mass > 0 ? mass : 1;
  egg.invMass = egg.static === true ? 0 : 1 / egg.mass;

  egg.id = egg.id ?? `egg${nextEggId++}`;
  egg.kind = egg.kind ?? "egg";
  egg.x = numOr(egg.x, 0);
  egg.y = numOr(egg.y, 0);
  egg.vx = numOr(egg.vx, 0);
  egg.vy = numOr(egg.vy, 0);
  egg.prevX = numOr(egg.prevX, egg.x);
  egg.prevY = numOr(egg.prevY, egg.y);
  egg.restitution = clamp(numOr(egg.restitution, EGG_RESTITUTION), 0, 1.4);
  egg.friction = clamp(numOr(egg.friction, EGG_FRICTION), 0, 1);
  egg.drag = numOr(egg.drag, EGG_DRAG);
  egg.gravityScale = numOr(egg.gravityScale, 1);

  egg.alive = egg.alive !== false;
  egg.sleeping = egg.sleeping === true;
  egg.restTimer = numOr(egg.restTimer, 0);
  egg.age = numOr(egg.age, 0);
  egg.lifetime = numOr(egg.lifetime, EGG_LIFETIME);

  egg.bounces = numOr(egg.bounces, 0);
  egg.wallHits = numOr(egg.wallHits, 0);
  egg.pegHits = numOr(egg.pegHits, 0);
  egg.brickHits = numOr(egg.brickHits, 0);
  egg.eggHits = numOr(egg.eggHits, 0);
  egg.portalUses = numOr(egg.portalUses, 0);

  egg.contacts = numOr(egg.contacts, 0);
  egg.enemyContacts = numOr(egg.enemyContacts, 0);
  if (egg.firstContact === undefined) egg.firstContact = null;
  if (egg.firstEnemyContact === undefined) egg.firstEnemyContact = null;
  if (egg.lastContact === undefined) egg.lastContact = null;
  if (!Array.isArray(egg.hitLog)) egg.hitLog = [];

  egg.splitsLeft = numOr(egg.splitsLeft, 0);
  egg.pierce = numOr(egg.pierce, 0);
  egg.power = numOr(egg.power, 1);
  egg.team = egg.team ?? "player";
  egg.generation = numOr(egg.generation, 0);
  egg.angle = numOr(egg.angle, 0);
  egg.spin = numOr(egg.spin, 0);
  egg.portalCooldown = numOr(egg.portalCooldown, 0);
  if (egg._ignoreId === undefined) egg._ignoreId = null;
  egg._ignoreUntil = numOr(egg._ignoreUntil, 0);
  return egg;
}

/**
 * 数值兜底：NaN/Infinity 会污染整个积分链路，出现即就地修复而不是删蛋。
 * @returns {boolean} 是否发生了修复
 */
function sanitizeEgg(world, egg) {
  const okPos = Number.isFinite(egg.x) && Number.isFinite(egg.y);
  const okVel = Number.isFinite(egg.vx) && Number.isFinite(egg.vy);
  if (okPos && okVel) return false;
  if (!Number.isFinite(egg.vx)) egg.vx = 0;
  if (!Number.isFinite(egg.vy)) egg.vy = 0;
  if (!Number.isFinite(egg.x)) egg.x = Number.isFinite(egg.prevX) ? egg.prevX : world.launch.x;
  if (!Number.isFinite(egg.y)) egg.y = Number.isFinite(egg.prevY) ? egg.prevY : world.launch.y;
  return true;
}

function hasEggId(world, id) {
  const eggs = world.eggs;
  for (let i = 0; i < eggs.length; i++) if (eggs[i].id === id) return true;
  return false;
}

/**
 * 世界内自增蛋 id。
 *
 * 用世界自己的流水号而不是模块级计数器，同一份初始状态跑两遍才会拿到同样的
 * id（回放、对拍、快照比对都依赖这一点）。战斗层若另有直接 `createEgg()` 再
 * push 的老路径，这里的重名检查保证两条路不会撞车。
 */
function allocEggId(world) {
  let n = Number.isFinite(world.eggSeq) ? world.eggSeq : 0;
  for (let guard = 0; guard < 4096; guard++) {
    const id = `egg${++n}`;
    if (!hasEggId(world, id)) {
      world.eggSeq = n;
      return id;
    }
  }
  world.eggSeq = n;
  return `egg${n}`;
}

/** 创建并加入世界；传入已构造的蛋（含 invMass 字段）则直接入场 */
export function spawnEgg(world, opts = {}) {
  const ready = opts.invMass !== undefined && opts.alive !== undefined;
  const egg = ready ? opts : createEgg({ ...opts, id: opts.id || allocEggId(world) });
  world.eggs.push(egg);
  world.stats.spawned++;
  emit(world, { type: "spawn", egg, x: egg.x, y: egg.y });
  return egg;
}

/**
 * 以「竖直向下偏转」的瞄准语义发射。
 * @param {number} aim   偏转角（弧度，0=正下，负=左，正=右）
 * @param {number} speed 初速度 px/s（GDD：220–720）
 */
export function launchEgg(world, { aim = 0, speed = 480, x, y, ...rest } = {}) {
  const a = clamp(aim, -Math.PI / 2 + 0.01, Math.PI / 2 - 0.01);
  return spawnEgg(world, {
    ...rest,
    x: x ?? world.launch.x,
    y: y ?? world.launch.y,
    vx: Math.sin(a) * speed,
    vy: Math.cos(a) * speed,
  });
}

/** 瞄准角 → 速度分量（供 UI 预览与发射共用） */
export function aimToVelocity(aim, speed, out = { x: 0, y: 0 }) {
  out.x = Math.sin(aim) * speed;
  out.y = Math.cos(aim) * speed;
  return out;
}

/** 主动回收一枚蛋 */
export function recycleEgg(world, egg, reason = "consumed") {
  if (!egg.alive) return false;
  egg.alive = false;
  egg.sleeping = reason === "sleep";
  world.stats.recycled++;
  emit(world, { type: "recycle", egg, reason, x: egg.x, y: egg.y });
  return true;
}

/** 渲染插值位置（alpha ∈ [0,1]） */
export function renderPosition(egg, alpha = 1, out = { x: 0, y: 0 }) {
  const a = clamp(alpha, 0, 1);
  out.x = egg.prevX + (egg.x - egg.prevX) * a;
  out.y = egg.prevY + (egg.y - egg.prevY) * a;
  return out;
}

/* ------------------------------------------------------------------ *
 * 事件
 * ------------------------------------------------------------------ */

export function emit(world, event) {
  event.time = world.time;
  event.step = world.stepIndex;
  const list = world.events;
  list.push(event);
  if (list.length > MAX_EVENTS) list.splice(0, list.length - MAX_EVENTS);
  return event;
}

/** 取走并清空事件队列（战斗 / UI 每帧消费一次） */
export function drainEvents(world) {
  if (world.events.length === 0) return [];
  const out = world.events.slice();
  world.events.length = 0;
  return out;
}

/* ------------------------------------------------------------------ *
 * 力场与积分
 * ------------------------------------------------------------------ */

const accel = { x: 0, y: 0, keep: 1 };

/**
 * 汇总作用在蛋上的加速度与阻尼系数。
 * 结果写入共享 out（`{ x, y, keep }`）。
 */
export function applyFieldAcceleration(world, egg, out = accel) {
  let ax = 0;
  let ay = world.gravity * egg.gravityScale;
  let keep = 1;
  const fields = world.fields;
  for (let i = 0; i < fields.length; i++) {
    const f = fields[i];
    if (f.active === false) continue;
    if (f.type === "wind") {
      ax += f.ax;
      ay += f.ay;
    } else if (f.type === "fan") {
      if (!fieldContains(f, egg.x, egg.y)) continue;
      let k = 1;
      if (f.falloff > 0) {
        // 沿风向的线性衰减：入风口最强，出口最弱
        const len = Math.hypot(f.ax, f.ay) || 1;
        const dx = f.ax / len;
        const dy = f.ay / len;
        const half = Math.abs(dx) * f.hw + Math.abs(dy) * f.hh;
        const proj = (egg.x - f.x) * dx + (egg.y - f.y) * dy;
        const t = half > 0 ? clamp((proj + half) / (2 * half), 0, 1) : 0;
        k = 1 - f.falloff * t;
      }
      ax += f.ax * k;
      ay += f.ay * k;
    } else if (f.type === "gravity") {
      if (!fieldContains(f, egg.x, egg.y)) continue;
      ay = f.gravity * egg.gravityScale;
    } else if (f.type === "slow") {
      if (!fieldContains(f, egg.x, egg.y)) continue;
      keep *= f.keep;
    }
  }
  out.x = ax;
  out.y = ay;
  out.keep = keep;
  return out;
}

/** 半隐式欧拉积分一小步（含阻力、限速、滚动角） */
export function integrateEgg(world, egg, dt) {
  const a = applyFieldAcceleration(world, egg);
  egg.vx += a.x * dt;
  egg.vy += a.y * dt;

  const keepPerSecond = clamp((1 - egg.drag) * a.keep, 0, 1);
  if (keepPerSecond < 1) {
    const k = damp(keepPerSecond, dt);
    egg.vx *= k;
    egg.vy *= k;
  }

  const speed = Math.hypot(egg.vx, egg.vy);
  const max = world.maxSpeed;
  if (speed > max) {
    const k = max / speed;
    egg.vx *= k;
    egg.vy *= k;
  }

  egg.x += egg.vx * dt;
  egg.y += egg.vy * dt;
  egg.spin = egg.r > 0 ? egg.vx / egg.r : 0;
  egg.angle = normalizeAngle(egg.angle + egg.spin * dt);
  if (egg.portalCooldown > 0) egg.portalCooldown -= dt;
}

/* ------------------------------------------------------------------ *
 * 碰撞
 * ------------------------------------------------------------------ */

/**
 * 解析式边界的占位「物体」。常量共享、只读，因此不进 world，
 * 也就不影响 world 的 structuredClone 体积。
 */
const BOUND_BODY = {
  left: { id: "bound:left", kind: "wall", team: "neutral", bound: "left" },
  right: { id: "bound:right", kind: "wall", team: "neutral", bound: "right" },
  top: { id: "bound:top", kind: "wall", team: "neutral", bound: "top" },
  bottom: { id: "bound:bottom", kind: "wall", team: "neutral", bound: "bottom" },
};
const boundManifold = createManifold();

/**
 * 边界反弹。nx/ny 为出射法线（指向场内）。
 * @returns {number} 是否计入一次反弹
 */
function bounceOffBound(world, egg, ctx, nx, ny, e, f, side) {
  const impact = -(egg.vx * nx + egg.vy * ny);
  if (impact > MIN_CONTACT_IMPACT) {
    // 与静态体同样的规矩：先落账，再动速度
    boundManifold.hit = true;
    boundManifold.nx = nx;
    boundManifold.ny = ny;
    boundManifold.depth = 0;
    boundManifold.px = egg.x - nx * egg.r;
    boundManifold.py = egg.y - ny * egg.r;
    noteContact(world, egg, BOUND_BODY[side], boundManifold, ctx, false);
  }
  let rn = impact * e;
  if (rn < RESTING_VELOCITY) rn = 0;
  if (nx !== 0) {
    egg.vx = rn * nx;
    egg.vy *= 1 - f;
  } else {
    egg.vy = rn * ny;
    egg.vx *= 1 - f;
  }
  if (impact <= MIN_CONTACT_IMPACT) return 0;
  return onBounce(
    world,
    egg,
    null,
    "wall",
    egg.x - nx * egg.r,
    egg.y - ny * egg.r,
    nx,
    ny,
    impact,
    ctx,
  );
}

/** 与世界边界（左右墙 / 顶板 / 底板）求解，返回反弹次数 */
export function collideWithBounds(world, egg, ctx) {
  const b = world.bounds;
  const mode = world.boundsMode;
  const e = clamp(egg.restitution * world.wallRestitution, 0, 1.4);
  const f = clamp(world.wallFriction, 0, 1);
  let hits = 0;

  if (mode.left === "bounce" && egg.x - egg.r < b.left) {
    egg.x = b.left + egg.r;
    if (egg.vx < 0) hits += bounceOffBound(world, egg, ctx, 1, 0, e, f, "left");
  }
  if (mode.right === "bounce" && egg.x + egg.r > b.right) {
    egg.x = b.right - egg.r;
    if (egg.vx > 0) hits += bounceOffBound(world, egg, ctx, -1, 0, e, f, "right");
  }
  if (mode.top === "bounce" && egg.y - egg.r < b.top) {
    egg.y = b.top + egg.r;
    if (egg.vy < 0) hits += bounceOffBound(world, egg, ctx, 0, 1, e, f, "top");
  }
  if (mode.bottom === "bounce" && egg.y + egg.r > b.bottom) {
    egg.y = b.bottom - egg.r;
    if (egg.vy > 0) hits += bounceOffBound(world, egg, ctx, 0, -1, e, f, "bottom");
  }
  return hits;
}

/* ------------------------------------------------------------------ *
 * 接触账本（reflect 之前）
 * ------------------------------------------------------------------ */

/** 这枚蛋上次命中 bodyId 的时刻，没有记录返回 -1 */
export function lastHitTimeOf(egg, bodyId) {
  const log = egg.hitLog;
  if (!log) return -1;
  for (let i = log.length - 1; i >= 0; i--) {
    if (log[i].id === bodyId) return log[i].time;
  }
  return -1;
}

function recordHit(egg, bodyId, time) {
  const log = egg.hitLog;
  for (let i = log.length - 1; i >= 0; i--) {
    if (log[i].id === bodyId) {
      log[i].time = time;
      return;
    }
  }
  log.push({ id: bodyId, time });
  if (log.length > HIT_LOG_SIZE) log.shift();
}

/** 清空一枚蛋的接触账本（复用蛋对象或重新发射时调用） */
export function resetEggContacts(egg) {
  egg.contacts = 0;
  egg.enemyContacts = 0;
  egg.firstContact = null;
  egg.firstEnemyContact = null;
  egg.lastContact = null;
  if (Array.isArray(egg.hitLog)) egg.hitLog.length = 0;
  return egg;
}

/**
 * 记录一次接触——**必须在 reflect / 位置修正之前调用**。
 *
 * 反弹会把蛋推出碰撞盒，步进结束后再做重叠检测永远是 false，
 * 预测线的「这一杆会打中敌人」提示就永远不亮（Round 1 的 O4 缺陷）。
 * 因此命中判定与首命中点一律在这里落账，`vx/vy` 是入射速度。
 *
 * 记账门槛：敌人只要处在冷却窗口外就算数（哪怕擦身而过），
 * 其余表面沿用 `MIN_CONTACT_IMPACT`，避免躺在砖上的蛋每步刷一次。
 *
 * @returns {object|null} 接触快照，未达门槛时返回 null
 */
export function noteContact(world, egg, body, m, ctx, pierced = false) {
  const vx = egg.vx;
  const vy = egg.vy;
  const impact = -(vx * m.nx + vy * m.ny);
  const enemy = isEnemyBody(body);
  const now = ctx.time;
  const cooldown = world.contactCooldown ?? CONTACT_COOLDOWN;
  const last = lastHitTimeOf(egg, body.id);
  const fresh = last < 0 || now - last >= cooldown;

  if (!pierced && !(enemy ? fresh : impact > MIN_CONTACT_IMPACT)) return null;

  const contact = {
    seq: ctx.ghost ? ++ctx.seq : ++world.contactSeq,
    eggId: egg.id,
    bodyId: body.id,
    kind: body.kind,
    team: body.team ?? "neutral",
    enemy,
    /** 接触点（碰撞盒表面） */
    x: m.px,
    y: m.py,
    /** 出射法线，指向把蛋推离物体的方向 */
    nx: m.nx,
    ny: m.ny,
    depth: m.depth,
    /** 蛋心与入射速度，均为 reflect 前的值 */
    ex: egg.x,
    ey: egg.y,
    vx,
    vy,
    speed: Math.hypot(vx, vy),
    /** 法向接近速度；分离中为负 */
    impact,
    time: now,
    step: world.stepIndex,
    fresh,
    pierced,
    ghost: !!ctx.ghost,
  };

  egg.contacts++;
  egg.lastContact = contact;
  if (!egg.firstContact) egg.firstContact = contact;
  if (enemy) {
    egg.enemyContacts++;
    if (!egg.firstEnemyContact) egg.firstEnemyContact = contact;
  }
  recordHit(egg, body.id, now);

  ctx.lastContact = contact;
  if (ctx.collect) ctx.contacts.push(contact);
  if (ctx.emit) emit(world, { type: "contact", egg, body, contact });
  return contact;
}

function onBounce(world, egg, body, surface, x, y, nx, ny, impact, ctx) {
  egg.bounces++;
  if (surface === "wall") egg.wallHits++;
  else if (surface === "peg" || surface === "bumper") egg.pegHits++;
  else if (surface === "brick" || surface === "ice") egg.brickHits++;
  if (ctx.emit) {
    world.stats.bounces++;
    if (surface === "wall") world.stats.wallHits++;
    else if (surface === "peg" || surface === "bumper") world.stats.pegHits++;
    else if (surface === "brick" || surface === "ice") world.stats.brickHits++;
    if (body) {
      body.hits++;
      body.lastHitTime = world.time;
    }
    emit(world, {
      type: "bounce",
      egg,
      body,
      surface,
      x,
      y,
      nx,
      ny,
      impact,
    });
  }
  return 1;
}

function ensureGrid(world) {
  let grid = world.grid;
  if (!grid || !Array.isArray(grid.cells)) {
    grid = createGrid(
      world.gridCell ?? GRID_CELL,
      Math.max(world.bounds.right, WORLD_W),
      Math.max(world.bounds.bottom, WORLD_H),
    );
    hide(world, "grid", null);
    world.grid = grid;
    world.staticsDirty = true;
  }
  if (syncStatics(world)) {
    rebuildGrid(grid, world.statics);
    world.staticsDirty = false;
    hide(world, "_gridLength", -1);
    world._gridLength = world.statics.length;
  }
  return grid;
}

/** 与静态体求解，返回反弹次数 */
export function collideWithStatics(world, egg, ctx, fromX, fromY) {
  if (world.statics.length === 0) return 0;
  const grid = ensureGrid(world);
  const list = queryGrid(
    grid,
    Math.min(egg.x, fromX) - egg.r,
    Math.min(egg.y, fromY) - egg.r,
    Math.max(egg.x, fromX) + egg.r,
    Math.max(egg.y, fromY) + egg.r,
    ctx.candidates,
  );
  const m = ctx.manifold;
  let hits = 0;

  for (let i = 0; i < list.length; i++) {
    const body = list[i];
    if (body.active === false) continue;
    if (egg._ignoreId === body.id && ctx.time < egg._ignoreUntil) continue;

    collideCircleBody(egg, body, m, fromX, fromY);
    if (!m.hit) continue;

    if (isPortalBody(body)) {
      // 入口吃蛋后本子步不再与别的静态体求解（蛋已经不在这儿了）
      if (handlePortal(world, egg, body, ctx)) break;
      // 出口端 / 断链的门退化成纯传感器
      if (!isPortalEntry(body)) fireSensor(world, egg, body, m, ctx);
      continue;
    }
    if (body.sensor) {
      fireSensor(world, egg, body, m, ctx);
      continue;
    }
    // 穿透：可碎砖 / 敌人直接穿过，只记一次接触
    if (egg.pierce > 0 && body.breakable) {
      noteContact(world, egg, body, m, ctx, true);
      egg.pierce--;
      egg.brickHits++;
      egg._ignoreId = body.id;
      egg._ignoreUntil = ctx.time + 0.3;
      if (ctx.emit) {
        world.stats.brickHits++;
        body.hits++;
        body.lastHitTime = world.time;
        emit(world, {
          type: "pierce",
          egg,
          body,
          surface: body.kind,
          x: m.px,
          y: m.py,
          nx: m.nx,
          ny: m.ny,
          impact: Math.hypot(egg.vx, egg.vy),
        });
      }
      continue;
    }

    // 先落账再反弹：reflect 会把蛋推出碰撞盒，事后检测必然 miss
    noteContact(world, egg, body, m, ctx, false);
    const impact = resolveStaticContact(egg, body, m);
    if (impact > MIN_CONTACT_IMPACT) {
      hits += onBounce(world, egg, body, body.kind, m.px, m.py, m.nx, m.ny, impact, ctx);
    }
  }
  return hits;
}

function fireSensor(world, egg, body, m, ctx) {
  if (!ctx.emit) return;
  emit(world, { type: "sensor", egg, body, x: m.px, y: m.py });
  body.hits++;
}

const portalExit = createPortalExit();

/**
 * 传送门落地：解算交给 `portals.js`，这里只负责搬蛋、记账与发事件。
 *
 * 传送不是碰撞——不落接触账本、不计反弹、不吃伤害，只发一条 `portal` 事件。
 * @returns {boolean} 蛋是否被这道门吃掉
 */
function handlePortal(world, egg, body, ctx) {
  if (!isPortalEntry(body)) return false;
  if (egg.portalCooldown > 0) return false;
  const dest = portalDestination(world, body);
  if (!dest) return false;

  const exit = computePortalExit(egg, body, dest, portalExit);
  const fromX = egg.x;
  const fromY = egg.y;
  egg.x = exit.x;
  egg.y = exit.y;
  // 瞬移要把插值起点一起搬走，否则渲染层会在这一帧画出一条横跨全场的拖影
  egg.prevX = exit.x;
  egg.prevY = exit.y;
  egg.vx = exit.vx;
  egg.vy = exit.vy;
  egg.portalCooldown = exit.cooldown;
  egg.portalUses++;
  egg.restTimer = 0;
  if (ctx.emit) {
    // 只给入口记命中：出口不吃蛋，也就不该出现在命中统计里
    world.stats.portalUses++;
    body.hits++;
    emit(world, {
      type: "portal",
      egg,
      body,
      to: dest,
      fromX,
      fromY,
      x: egg.x,
      y: egg.y,
      vx: egg.vx,
      vy: egg.vy,
      cooldown: exit.cooldown,
    });
  }
  return true;
}

const pairManifold = createManifold();

/** 蛋与蛋（碰撞流），数量小，直接两两检测 */
function collideEggPairs(world, ctx) {
  const eggs = world.eggs;
  const n = eggs.length;
  if (n < 2) return;
  for (let i = 0; i < n; i++) {
    const a = eggs[i];
    if (!a.alive || a.invMass === 0) continue;
    for (let j = i + 1; j < n; j++) {
      const b = eggs[j];
      if (!b.alive) continue;
      const rsum = a.r + b.r;
      const dx = a.x - b.x;
      const dy = a.y - b.y;
      if (dx * dx + dy * dy >= rsum * rsum) continue;
      circleVsCircle(a.x, a.y, a.r, b.x, b.y, b.r, pairManifold);
      const impact = resolveEggPair(a, b, pairManifold);
      if (impact <= MIN_CONTACT_IMPACT) continue;
      a.eggHits++;
      b.eggHits++;
      a.bounces++;
      b.bounces++;
      if (ctx.emit) {
        world.stats.eggHits++;
        world.stats.bounces += 2;
        emit(world, {
          type: "eggHit",
          egg: a,
          other: b,
          x: pairManifold.px,
          y: pairManifold.py,
          nx: pairManifold.nx,
          ny: pairManifold.ny,
          impact,
        });
      }
    }
  }
}

/* ------------------------------------------------------------------ *
 * 主循环
 * ------------------------------------------------------------------ */

/**
 * 推进单枚蛋一个固定步（含连续碰撞子步）。
 *
 * 子步数只取决于这枚蛋自身的速度与半径，因此弹道预测（幽灵蛋）
 * 与真实模拟走的是完全相同的离散化，虚线与落点一致。
 *
 * @returns {number} 本步的反弹次数
 */
export function stepEgg(world, egg, dt, ctx) {
  // 幽灵蛋自带时间轴，其余情况跟随世界钟；两者都保证冷却判定单调推进
  if (!ctx.ghost) ctx.time = world.time;
  // 预留一步重力增量，避免刚发射（v≈0）时低估位移
  const projected = Math.hypot(egg.vx, egg.vy) + world.gravity * dt;
  const budget = Math.max(egg.r * SUBSTEP_TRAVEL_RATIO, 1);
  const substeps = clamp(Math.ceil((projected * dt) / budget), 1, MAX_SUBSTEPS);
  const h = dt / substeps;
  let hits = 0;
  for (let s = 0; s < substeps; s++) {
    const fromX = egg.x;
    const fromY = egg.y;
    integrateEgg(world, egg, h);
    hits += collideWithStatics(world, egg, ctx, fromX, fromY);
    hits += collideWithBounds(world, egg, ctx);
  }
  if (ctx.ghost) ctx.time += dt;
  return hits;
}

/**
 * 单枚蛋的一次完整推进：数值兜底 → 记录插值起点 → `stepEgg` → 再兜底。
 *
 * `stepWorld` 与 `predictTrajectory` 都只经由这里推进，任何一方要改积分
 * 顺序都必须改这一个函数，预测虚线因此不可能与实弹跑偏。
 *
 * @returns {number} 本步反弹次数
 */
export function advanceEgg(world, egg, dt, ctx) {
  if (!Number.isFinite(egg.invMass)) normalizeEgg(egg);
  if (!egg.alive) return 0;
  sanitizeEgg(world, egg);
  egg.prevX = egg.x;
  egg.prevY = egg.y;
  if (egg.sleeping) return 0;
  const hits = stepEgg(world, egg, dt, ctx);
  sanitizeEgg(world, egg);
  return hits;
}

/**
 * 推进一个固定步。
 *
 * 除了 `world` 自身的状态与 `dt`，这个函数不读任何外部信息（没有时钟、没有
 * `Math.random`），因此同一份初始状态配同一串 `dt` 必然给出同一个结果。
 * 非有限 / 非正的 `dt` 一律回落到 `world.dt`，防止一次坏输入把时钟污染成 NaN。
 *
 * @param {object} world
 * @param {number} [dt] 步长，默认 world.dt（1/120）
 * @returns {object} world
 */
export function stepWorld(world, dt = world.dt ?? FIXED_DT) {
  const fallback = Number.isFinite(world.dt) && world.dt > 0 ? world.dt : FIXED_DT;
  const h = Number.isFinite(dt) && dt > 0 ? dt : fallback;
  if (!Number.isFinite(world.time)) world.time = 0;
  if (!Number.isFinite(world.stepIndex)) world.stepIndex = 0;
  world.time += h;
  world.stepIndex++;

  const eggs = world.eggs;
  if (eggs.length === 0) return world;

  const ctx = ensureCtx(world);
  ctx.emit = true;
  ctx.ghost = false;
  ctx.time = world.time;

  for (let i = 0; i < eggs.length; i++) {
    advanceEgg(world, eggs[i], h, ctx);
  }
  collideEggPairs(world, ctx);

  finalizeStep(world, h);
  compactEggs(world);
  return world;
}

/** 出界 / 睡眠 / 寿命回收 */
function finalizeStep(world, dt) {
  const b = world.bounds;
  const eggs = world.eggs;
  for (let i = 0; i < eggs.length; i++) {
    const egg = eggs[i];
    if (!egg.alive) continue;
    egg.age += dt;

    if (
      egg.y > b.bottom + OUT_MARGIN_BOTTOM ||
      egg.y < b.top - OUT_MARGIN_TOP ||
      egg.x < b.left - OUT_MARGIN_SIDE ||
      egg.x > b.right + OUT_MARGIN_SIDE
    ) {
      recycleEgg(world, egg, "out");
      continue;
    }

    const speed = Math.hypot(egg.vx, egg.vy);
    if (egg.age > SPAWN_GRACE && speed < SLEEP_SPEED) {
      egg.restTimer += dt;
      if (egg.restTimer >= SLEEP_TIME) {
        egg.sleeping = true;
        recycleEgg(world, egg, "sleep");
        continue;
      }
    } else {
      egg.restTimer = 0;
    }

    if (egg.lifetime > 0 && egg.age >= egg.lifetime) {
      recycleEgg(world, egg, "expired");
    }
  }
}

function compactEggs(world) {
  const eggs = world.eggs;
  let w = 0;
  for (let i = 0; i < eggs.length; i++) {
    const egg = eggs[i];
    if (egg.alive) eggs[w++] = egg;
  }
  if (w !== eggs.length) eggs.length = w;
}

/**
 * 变帧时间推进：内部按固定步累积。
 *
 * 这是「渲染帧率」与「模拟步长」的唯一交界处。elapsed 先被钳进
 * `MAX_FRAME_TIME`（切后台 / 断点续跑会给出几秒的间隔），再切成整数个
 * `world.dt`；掉帧只改变本帧补几步，每一步的解算与 60fps 时逐位相同。
 * 追不上时（steps === maxSteps）丢弃多余累积，避免死亡螺旋。
 *
 * @returns {{ steps: number, alpha: number }} alpha 供渲染插值
 */
export function advanceWorld(world, elapsed, maxSteps = MAX_FRAME_STEPS) {
  const h = Number.isFinite(world.dt) && world.dt > 0 ? world.dt : FIXED_DT;
  const limit = Number.isFinite(maxSteps) && maxSteps > 0 ? Math.floor(maxSteps) : MAX_FRAME_STEPS;
  if (!Number.isFinite(world.accumulator)) world.accumulator = 0;
  const fed = Number.isFinite(elapsed) && elapsed > 0 ? Math.min(elapsed, MAX_FRAME_TIME) : 0;
  world.accumulator += fed;
  let steps = 0;
  while (world.accumulator >= h && steps < limit) {
    stepWorld(world, h);
    world.accumulator -= h;
    steps++;
  }
  if (steps === limit) world.accumulator = Math.min(world.accumulator, h);
  return { steps, alpha: clamp(world.accumulator / h, 0, 1) };
}

/** 场上是否还有活跃的蛋（回合结束判定） */
export function isSettled(world) {
  return world.eggs.length === 0;
}

/** 当前活跃蛋数量 */
export function activeEggCount(world) {
  let n = 0;
  for (let i = 0; i < world.eggs.length; i++) if (world.eggs[i].alive) n++;
  return n;
}
