/**
 * 确定性工具：快照 / 克隆 / 摘要 / 定步重放。
 *
 * 物理世界的演化只由「初始状态 + 步长序列 + 外部调用序列」决定（见 `world.js`
 * 头注）。本模块把这条性质变成可执行的检查：
 *
 *   const digest = hashWorld(world);              // 逐位摘要，可跨进程比对
 *   const copy   = cloneWorld(world);             // 纯数据克隆，能继续 stepWorld
 *   checkDeterminism(() => buildScene());         // 同种子跑两遍是否一致
 *   checkCloneSafety(() => buildScene());         // 中途克隆再跑完是否一致
 *
 * 快照口径（`snapshotWorld`）：
 *   - 只取自有**可枚举**属性 → 宽相网格 / id 索引 / 步进上下文天然被排除；
 *   - 额外剔除 `_` 前缀字段与 `data`（战斗层挂的外部实体，可能带函数与环引用），
 *     需要保留时传 `{ keepData: true }`；
 *   - Map / Set / 类实例视为派生结构直接丢弃，`reviveWorld` 负责重建。
 */

import { FIXED_DT } from "./constants.js";
import { reviveWorld, stepWorld } from "./world.js";

/* ------------------------------------------------------------------ *
 * 快照 / 克隆
 * ------------------------------------------------------------------ */

/** 这些键是派生结构，永远不进快照 */
const DERIVED_KEYS = new Set(["grid", "staticById"]);
const UNDERSCORE = 95;

function isPlainObject(value) {
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

function pureClone(value, keepData, seen) {
  if (value === null) return null;
  const t = typeof value;
  if (t === "function" || t === "symbol") return undefined;
  if (t !== "object") return value;

  const cached = seen.get(value);
  if (cached !== undefined) return cached;

  if (Array.isArray(value)) {
    const out = [];
    seen.set(value, out);
    for (let i = 0; i < value.length; i++) {
      const item = pureClone(value[i], keepData, seen);
      out.push(item === undefined ? null : item);
    }
    return out;
  }
  if (!isPlainObject(value)) return undefined;

  const out = {};
  seen.set(value, out);
  for (const key of Object.keys(value)) {
    if (key.charCodeAt(0) === UNDERSCORE) continue;
    if (DERIVED_KEYS.has(key)) continue;
    if (key === "data" && !keepData) continue;
    const raw = value[key];
    const cloned = pureClone(raw, keepData, seen);
    if (cloned !== undefined || raw === undefined) out[key] = cloned;
  }
  return out;
}

/**
 * 世界 → 纯数据快照。结果可 `structuredClone` / `JSON.stringify`，
 * 也可直接喂给 `restoreWorld` / `reviveWorld`。
 * @param {object} world
 * @param {{keepData?: boolean}} [opts] keepData=true 时保留 body.data / egg.data
 */
export function snapshotWorld(world, opts = {}) {
  return pureClone(world, opts.keepData === true, new WeakMap());
}

/**
 * 快照 → 可步进的世界。原地补齐派生结构，返回同一个对象。
 * 单独暴露是为了让「先 `structuredClone(world)` 存盘、之后再跑」这条路径
 * 不必知道物理层内部有哪些索引。
 */
export function hydrateWorld(snapshot) {
  return reviveWorld(snapshot);
}

/**
 * 深拷贝一个可继续步进的世界。
 *
 * 默认丢掉 `data`（战斗层的实体引用）：克隆世界与原世界共享一份战斗实体是错的，
 * 需要保留请显式传 `{ keepData: true }`，并自行处理引用别名。
 */
export function cloneWorld(world, opts = {}) {
  return reviveWorld(snapshotWorld(world, opts));
}

/** 用快照覆盖一个已有世界（原地，保持对象身份） */
export function restoreWorld(world, snapshot, opts = {}) {
  const data = snapshotWorld(snapshot, opts);
  for (const key of Object.keys(world)) {
    if (!Object.prototype.hasOwnProperty.call(data, key)) delete world[key];
  }
  Object.assign(world, data);
  return reviveWorld(world);
}

/* ------------------------------------------------------------------ *
 * 摘要
 * ------------------------------------------------------------------ */

const FNV_PRIME = 0x01000193;
const FNV_OFFSET = 0x811c9dc5;

const bits = new ArrayBuffer(8);
const asF64 = new Float64Array(bits);
const asU32 = new Uint32Array(bits);

function mixU32(h, v) {
  return Math.imul(h ^ (v >>> 0), FNV_PRIME) >>> 0;
}

/** 按 IEEE754 位模式混入，摘要因此对 1e-15 级的漂移也敏感 */
function mixNumber(h, v) {
  asF64[0] = Number.isFinite(v) ? v : Number.isNaN(v) ? Number.MAX_VALUE : Number.MIN_VALUE;
  return mixU32(mixU32(h, asU32[0]), asU32[1]);
}

function mixString(h, s) {
  const str = typeof s === "string" ? s : String(s);
  let acc = h;
  for (let i = 0; i < str.length; i++) acc = mixU32(acc, str.charCodeAt(i));
  return acc;
}

function mixFlag(h, v) {
  return mixU32(h, v ? 1 : 2);
}

const EGG_NUMBERS = [
  "x",
  "y",
  "vx",
  "vy",
  "prevX",
  "prevY",
  "r",
  "mass",
  "restitution",
  "friction",
  "drag",
  "gravityScale",
  "age",
  "lifetime",
  "restTimer",
  "angle",
  "spin",
  "portalCooldown",
  "bounces",
  "wallHits",
  "pegHits",
  "brickHits",
  "eggHits",
  "portalUses",
  "contacts",
  "enemyContacts",
  "splitsLeft",
  "pierce",
  "power",
  "generation",
];

const BODY_NUMBERS = ["x", "y", "r", "hw", "hh", "x1", "y1", "x2", "y2", "hp", "hits"];

/**
 * 世界的确定性摘要（uint32）。
 *
 * 覆盖会影响后续演化的模拟状态：时钟、随机数、蛋、静态体的生死与几何。
 * 三类旁路默认不进摘要，需要时按需打开：
 *   - `accumulator`：`advanceWorld` 的亚步余量，取决于宿主喂进来的帧长。
 *     同一串固定步在 60fps 与抖动帧下模拟结果完全一致，只有这点余量不同
 *     （量级 1e-15），把它算进摘要只会制造假告警。
 *   - `stats`：命中/回收计数，供 HUD 读，不参与解算。
 *   - `events`：一次性队列，取决于消费时机。
 *
 * `{ ids: false }` 可以跳过 id 只比几何：直接 `createEgg()` 再自行 push 的调用方
 * （如 `core/sim.js`）吃的是模块级计数器，两次运行的 id 会不同，但轨迹应当逐位
 * 一致——这个开关就是用来把「id 来源」和「解算」两件事分开定位的。
 *
 * @param {object} world
 * @param {{stats?, events?, accumulator?, ids?: boolean}} [opts]
 * @returns {number} 0..2^32-1
 */
export function hashWorld(world, opts = {}) {
  const withIds = opts.ids !== false;
  let h = FNV_OFFSET;
  h = mixNumber(h, world.time);
  h = mixNumber(h, world.stepIndex);
  if (opts.accumulator) h = mixNumber(h, world.accumulator);
  h = mixNumber(h, world.dt);
  h = mixNumber(h, world.gravity);
  h = mixU32(h, world.rngState >>> 0);
  h = mixNumber(h, world.contactSeq);
  if (withIds) h = mixNumber(h, world.eggSeq);

  const eggs = world.eggs || [];
  h = mixU32(h, eggs.length);
  for (let i = 0; i < eggs.length; i++) {
    const egg = eggs[i];
    if (withIds) h = mixString(h, egg.id);
    h = mixFlag(h, egg.alive);
    h = mixFlag(h, egg.sleeping);
    for (let k = 0; k < EGG_NUMBERS.length; k++) h = mixNumber(h, egg[EGG_NUMBERS[k]]);
  }

  const statics = world.statics || [];
  h = mixU32(h, statics.length);
  for (let i = 0; i < statics.length; i++) {
    const body = statics[i];
    if (withIds) h = mixString(h, body.id);
    h = mixFlag(h, body.active !== false);
    for (let k = 0; k < BODY_NUMBERS.length; k++) {
      const v = body[BODY_NUMBERS[k]];
      if (v !== undefined) h = mixNumber(h, v);
    }
  }

  const fields = world.fields || [];
  h = mixU32(h, fields.length);
  for (let i = 0; i < fields.length; i++) {
    const f = fields[i];
    h = mixString(h, withIds ? f.id ?? f.type ?? "" : f.type ?? "");
    h = mixFlag(h, f.active !== false);
    h = mixNumber(h, f.ax);
    h = mixNumber(h, f.ay);
  }

  if (opts.stats && world.stats) {
    for (const key of Object.keys(world.stats).sort()) {
      h = mixString(h, key);
      h = mixNumber(h, world.stats[key]);
    }
  }
  if (opts.events) {
    const events = world.events || [];
    h = mixU32(h, events.length);
    for (let i = 0; i < events.length; i++) h = mixString(h, events[i].type);
  }
  return h >>> 0;
}

/** 摘要的十六进制写法，方便打日志与贴报告 */
export function worldDigest(world, opts) {
  return hashWorld(world, opts).toString(16).padStart(8, "0");
}

/* ------------------------------------------------------------------ *
 * 重放与自检
 * ------------------------------------------------------------------ */

/** 连推 n 个固定步 */
export function runSteps(world, steps, dt) {
  const h = Number.isFinite(dt) && dt > 0 ? dt : world.dt ?? FIXED_DT;
  const n = Math.max(0, Math.floor(steps));
  for (let i = 0; i < n; i++) stepWorld(world, h);
  return world;
}

/**
 * 同一个构造函数跑两遍，比对摘要。
 * @param {() => object} build 每次返回一个全新的世界（含蛋与静态体）
 * @param {{steps?: number, dt?: number, hash?: object}} [opts]
 * @returns {{ok: boolean, steps: number, digestA: string, digestB: string}}
 */
export function checkDeterminism(build, opts = {}) {
  const steps = opts.steps ?? 600;
  const a = runSteps(build(), steps, opts.dt);
  const b = runSteps(build(), steps, opts.dt);
  const ha = hashWorld(a, opts.hash);
  const hb = hashWorld(b, opts.hash);
  return {
    ok: ha === hb,
    steps,
    digestA: ha.toString(16).padStart(8, "0"),
    digestB: hb.toString(16).padStart(8, "0"),
  };
}

/**
 * 中途克隆一次，克隆体与本体各自跑完剩下的步数，比对摘要。
 * 覆盖的是「快照丢了什么派生状态」这一类 bug。
 * @param {() => object} build
 * @param {{steps?: number, splitAt?: number, dt?: number, keepData?: boolean}} [opts]
 */
export function checkCloneSafety(build, opts = {}) {
  const steps = opts.steps ?? 600;
  const splitAt = Math.min(opts.splitAt ?? Math.floor(steps / 2), steps);
  const world = runSteps(build(), splitAt, opts.dt);
  const copy = cloneWorld(world, { keepData: opts.keepData === true });
  const beforeA = hashWorld(world);
  const beforeB = hashWorld(copy);
  runSteps(world, steps - splitAt, opts.dt);
  runSteps(copy, steps - splitAt, opts.dt);
  const ha = hashWorld(world);
  const hb = hashWorld(copy);
  return {
    ok: beforeA === beforeB && ha === hb,
    steps,
    splitAt,
    snapshotMatches: beforeA === beforeB,
    digestA: ha.toString(16).padStart(8, "0"),
    digestB: hb.toString(16).padStart(8, "0"),
  };
}
