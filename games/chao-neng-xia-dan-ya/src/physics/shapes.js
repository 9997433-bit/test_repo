/**
 * 静态体与力场工厂。
 *
 * 静态体（world.statics）共三种几何：
 *   - `segment` 胶囊线段：墙、斜面、挡板
 *   - `circle`  圆：钉、弹垫、传送门（传感器）
 *   - `aabb`    轴对齐矩形：砖、冰面、炸弹砖
 *
 * 力场（world.fields）不参与碰撞，只在积分前贡献加速度：风扇、风、重力区、减速区。
 */

import { GRAVITY, MATERIAL, PORTAL_COOLDOWN, WORLD_H, WORLD_W } from "./constants.js";
import { TAU, normalizeAngle } from "./math.js";

let nextBodyId = 1;

/**
 * 内部字段一律不可枚举：`structuredClone` / `toEqual` 只看自有可枚举属性，
 * 因此宽相戳 `_stamp` 与规范化标记 `_norm` 不会污染快照，也不会让两份
 * 语义相同的世界因为查询次数不同而比对失败。快照恢复后 `normalizeBody`
 * 会把它们重新装回来（`_norm` 缺失 = 重跑一次幂等的字段补齐）。
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

/** 给静态体装上不可枚举的宽相戳槽位（已存在则保持原值） */
export function ensureStampSlot(body) {
  const desc = Object.getOwnPropertyDescriptor(body, "_stamp");
  if (desc && !desc.enumerable) return body;
  defineHidden(body, "_stamp", desc ? body._stamp : 0);
  return body;
}

/** 供测试/回放使用：重置自增 id，保证多次构造结果可比对 */
export function resetBodyIds(value = 1) {
  nextBodyId = value;
}

function bodyId(prefix) {
  return `${prefix}${nextBodyId++}`;
}

function baseBody(shape, kind, opts) {
  const mat = MATERIAL[kind] || MATERIAL.wall;
  const body = {
    id: opts.id || bodyId(kind.slice(0, 2)),
    shape,
    kind,
    active: opts.active !== false,
    /** 传感器只触发事件、不做反弹 */
    sensor: opts.sensor === true,
    restitution: opts.restitution ?? mat.restitution,
    friction: opts.friction ?? mat.friction,
    breakable: opts.breakable === true,
    hp: opts.hp ?? 0,
    maxHp: opts.maxHp ?? opts.hp ?? 0,
    /** 炸弹砖：破碎时触发爆炸 */
    explosive: opts.explosive === true,
    blastRadius: opts.blastRadius ?? 0,
    blastPower: opts.blastPower ?? 0,
    element: opts.element ?? null,
    team: opts.team ?? "neutral",
    tags: opts.tags ? { ...opts.tags } : {},
    data: opts.data ?? null,
    /** 命中统计，供连击 / 碰撞流结算读取 */
    hits: 0,
    lastHitTime: -1,
    aabb: { minX: 0, minY: 0, maxX: 0, maxY: 0 },
  };
  /** 宽相查询去重戳 + 规范化标记，均为内部字段，不进快照 */
  defineHidden(body, "_stamp", 0);
  defineHidden(body, "_norm", 1);
  return body;
}

/** 重算包围盒（改坐标或尺寸后必须调用） */
export function computeAABB(body) {
  const box = body.aabb || (body.aabb = { minX: 0, minY: 0, maxX: 0, maxY: 0 });
  if (body.shape === "circle") {
    box.minX = body.x - body.r;
    box.minY = body.y - body.r;
    box.maxX = body.x + body.r;
    box.maxY = body.y + body.r;
  } else if (body.shape === "aabb") {
    box.minX = body.x - body.hw;
    box.minY = body.y - body.hh;
    box.maxX = body.x + body.hw;
    box.maxY = body.y + body.hh;
  } else {
    const pad = body.halfThickness;
    box.minX = Math.min(body.x1, body.x2) - pad;
    box.minY = Math.min(body.y1, body.y2) - pad;
    box.maxX = Math.max(body.x1, body.x2) + pad;
    box.maxY = Math.max(body.y1, body.y2) + pad;
  }
  return body;
}

const num = (v, fallback) => (Number.isFinite(v) ? v : fallback);

/**
 * 把「外部直接 push 进 world.statics 的鸭子类型物体」补齐成合法静态体。
 * 兼容 `type`/`material`/`width`/`height`/`radius` 等常见别名，幂等。
 */
export function normalizeBody(body) {
  if (body._norm !== 1) {
    if (!body.shape) {
      const t = body.type;
      if (t === "aabb" || t === "box" || t === "rect" || t === "enemy") body.shape = "aabb";
      else if (t === "circle" || t === "peg" || t === "portal") body.shape = "circle";
      else if (t === "segment" || t === "line" || t === "wall" || t === "ramp") body.shape = "segment";
      else if (body.x1 !== undefined) body.shape = "segment";
      else if (body.r !== undefined || body.radius !== undefined) body.shape = "circle";
      else body.shape = "aabb";
    }
    if (!body.kind) {
      body.kind =
        body.material ||
        (body.type === "portal"
          ? "portal"
          : body.type === "enemy"
            ? "enemy"
            : body.shape === "circle"
              ? "peg"
              : body.shape === "segment"
                ? "wall"
                : "brick");
    }
    const mat = MATERIAL[body.kind] || MATERIAL.brick;
    body.id = body.id ?? bodyId(body.kind.slice(0, 2));
    body.restitution = num(body.restitution, mat.restitution);
    body.friction = num(body.friction, mat.friction);
    body.active = body.active !== false;
    // 传送门恒为传感器：外部直接 push 的鸭子类型门也不能变成实心球
    body.sensor = body.sensor === true || body.kind === "portal" || body.kind === "portalExit";
    body.breakable = body.breakable === true;
    body.explosive = body.explosive === true;
    body.hp = num(body.hp, 0);
    body.hits = num(body.hits, 0);
    body.lastHitTime = num(body.lastHitTime, -1);
    if (body.kind === "portal" || body.kind === "portalExit") normalizePortal(body);

    if (body.shape === "aabb") {
      const w = num(body.w, num(body.width, 40));
      const h = num(body.h, num(body.height, 24));
      body.w = w;
      body.h = h;
      body.hw = num(body.hw, w / 2);
      body.hh = num(body.hh, h / 2);
      body.x = num(body.x, 0);
      body.y = num(body.y, 0);
      // 关卡数据常用左上角锚点（core/sim.js 的敌人/砖就是这样），
      // 物理层统一用中心，转换一次后打上标记避免二次偏移。
      if (body.anchor === "topleft") {
        body.x += body.hw;
        body.y += body.hh;
        body.anchor = "center";
      }
    } else if (body.shape === "circle") {
      body.r = num(body.r, num(body.radius, 6));
      body.x = num(body.x, 0);
      body.y = num(body.y, 0);
    } else {
      body.x1 = num(body.x1, 0);
      body.y1 = num(body.y1, 0);
      body.x2 = num(body.x2, 0);
      body.y2 = num(body.y2, 0);
      body.halfThickness = num(body.halfThickness, num(body.thickness, 0) / 2);
      const dx = body.x2 - body.x1;
      const dy = body.y2 - body.y1;
      const len = Math.hypot(dx, dy) || 1;
      body.nx = num(body.nx, dy / len);
      body.ny = num(body.ny, -dx / len);
      body.length = len;
      body.oneWay = body.oneWay === true;
    }
    defineHidden(body, "_norm", 1);
  }
  ensureStampSlot(body);
  return computeAABB(body);
}

/**
 * 补齐传送门语义字段（见 `portals.js` 头注）。
 * `link` 兼容 `to` / `target` 别名；没有链接的一端自动降级为出口。
 */
function normalizePortal(body) {
  if (typeof body.link !== "string" || body.link.length === 0) {
    const alias = body.to ?? body.target ?? body.linkId;
    body.link = typeof alias === "string" && alias.length > 0 ? alias : null;
  }
  const hasLink = typeof body.link === "string" && body.link.length > 0;
  body.entry = body.kind === "portalExit" ? false : body.entry !== false && hasLink;
  body.facing = Number.isFinite(body.facing) ? normalizeAngle(body.facing) : null;
  body.exitSpeed = num(body.exitSpeed, 0);
  body.cooldown = num(body.cooldown, PORTAL_COOLDOWN);
  return body;
}

/**
 * 胶囊线段。thickness 为总厚度，内部存半厚 radius。
 * oneWay=true 时只从法线正面接触（用于单向挡板）。
 */
export function makeSegment(opts) {
  const body = baseBody("segment", opts.kind || "wall", opts);
  body.x1 = opts.x1;
  body.y1 = opts.y1;
  body.x2 = opts.x2;
  body.y2 = opts.y2;
  /** 胶囊半厚（0 = 理想细线）；圆形体的半径用 `r`，两者不复用字段名 */
  body.halfThickness = (opts.thickness ?? 0) / 2;
  body.oneWay = opts.oneWay === true;
  const dx = body.x2 - body.x1;
  const dy = body.y2 - body.y1;
  const len = Math.hypot(dx, dy) || 1;
  // 线段法线取左手方向，配合 oneWay 决定可通行侧
  body.nx = dy / len;
  body.ny = -dx / len;
  body.length = len;
  body.angle = Math.atan2(dy, dx);
  return computeAABB(body);
}

/** 墙：无厚度线段，弹性最高 */
export function makeWall(x1, y1, x2, y2, opts = {}) {
  return makeSegment({ ...opts, kind: opts.kind || "wall", x1, y1, x2, y2 });
}

/**
 * 斜面：带厚度的线段，默认略微吃掉一点切向速度。
 * angle 用度表示时可传 `{ x, y, length, angleDeg }`。
 */
export function makeRamp(opts) {
  if (opts.angleDeg !== undefined || opts.angle !== undefined) {
    const ang = opts.angle ?? (opts.angleDeg * Math.PI) / 180;
    const half = (opts.length ?? 80) / 2;
    const dx = Math.cos(ang) * half;
    const dy = Math.sin(ang) * half;
    return makeSegment({
      thickness: 8,
      ...opts,
      kind: opts.kind || "ramp",
      x1: opts.x - dx,
      y1: opts.y - dy,
      x2: opts.x + dx,
      y2: opts.y + dy,
    });
  }
  return makeSegment({ thickness: 8, ...opts, kind: opts.kind || "ramp" });
}

/**
 * 砖：AABB，可碎（hp>0 且 breakable）。
 * `anchor: "topleft"` 时按关卡数据的左上角坐标摆放。
 */
export function makeBrick(opts) {
  const body = baseBody("aabb", opts.kind || "brick", {
    breakable: opts.breakable !== false,
    hp: opts.hp ?? 30,
    ...opts,
  });
  const w = opts.w ?? 40;
  const h = opts.h ?? 24;
  body.w = w;
  body.h = h;
  body.hw = w / 2;
  body.hh = h / 2;
  const anchorTopLeft = opts.anchor === "topleft";
  body.x = (opts.x ?? 0) + (anchorTopLeft ? body.hw : 0);
  body.y = (opts.y ?? 0) + (anchorTopLeft ? body.hh : 0);
  body.anchor = "center";
  return computeAABB(body);
}

/** 炸弹砖：破碎时对半径内目标结算 */
export function makeBombBrick(opts) {
  return makeBrick({
    hp: 20,
    blastRadius: 90,
    blastPower: 620,
    ...opts,
    kind: opts.kind || "brick",
    explosive: true,
  });
}

/**
 * 敌人碰撞盒：AABB 静态体，`kind === "enemy"`、`team === "enemy"`。
 *
 * 物理层只认「几何 + 生死」，血量与伤害归 combat；这里给 hp 只是为了
 * `damageStatic` 能统一处理死亡与移除。敌人会漂移/下压，外部改完坐标
 * 记得调用 `markStaticsDirty(world)`（或 `syncEnemyBody`）刷新宽相。
 *
 * @param {object} opts
 * @param {"center"|"topleft"} [opts.anchor] 坐标锚点，默认中心
 * @param {object} [opts.data] 战斗层的敌人对象，物理层原样透传
 */
export function makeEnemy(opts = {}) {
  const w = opts.w ?? opts.width ?? 44;
  const h = opts.h ?? opts.height ?? 44;
  const body = baseBody("aabb", opts.kind || "enemy", {
    breakable: opts.breakable ?? (opts.hp ?? 0) > 0,
    ...opts,
    team: opts.team ?? "enemy",
  });
  body.w = w;
  body.h = h;
  body.hw = w / 2;
  body.hh = h / 2;
  const anchorTopLeft = opts.anchor === "topleft";
  body.x = (opts.x ?? 0) + (anchorTopLeft ? body.hw : 0);
  body.y = (opts.y ?? 0) + (anchorTopLeft ? body.hh : 0);
  body.anchor = "center";
  return computeAABB(body);
}

/** 是否为敌人碰撞盒（kind 或 team 命中即可，兼容外部直接 push 的鸭子类型） */
export function isEnemyBody(body) {
  return !!body && (body.kind === "enemy" || body.type === "enemy" || body.team === "enemy");
}

/**
 * 把静态体挪到新位置并刷新包围盒（敌人漂移 / 每回合下压用）。
 * 返回是否真的动过，调用方据此决定要不要 `markStaticsDirty(world)`。
 * @param {"center"|"topleft"} [anchor] 仅对 aabb 有意义
 */
export function moveBody(body, x, y, anchor = "center") {
  const isBox = body.shape === "aabb";
  const nx = anchor === "topleft" && isBox ? x + body.hw : x;
  const ny = anchor === "topleft" && isBox ? y + body.hh : y;
  if (body.shape === "segment") {
    const cx = (body.x1 + body.x2) / 2;
    const cy = (body.y1 + body.y2) / 2;
    if (cx === nx && cy === ny) return false;
    const dx = nx - cx;
    const dy = ny - cy;
    body.x1 += dx;
    body.x2 += dx;
    body.y1 += dy;
    body.y2 += dy;
    computeAABB(body);
    return true;
  }
  if (body.x === nx && body.y === ny) return false;
  body.x = nx;
  body.y = ny;
  computeAABB(body);
  return true;
}

/** 冰面：低摩擦 AABB，不可碎 */
export function makeIce(opts) {
  return makeBrick({
    ...opts,
    kind: "ice",
    breakable: false,
    hp: 0,
    tags: { ...(opts.tags || {}), slippery: true },
  });
}

/** 钉：圆形静态体，改变方向并累计碰撞流层数 */
export function makePeg(x, y, opts = {}) {
  const body = baseBody("circle", opts.kind || "peg", opts);
  body.x = x;
  body.y = y;
  body.r = opts.r ?? 6;
  return computeAABB(body);
}

/** 弹垫：超弹性圆，命中后主动加速 */
export function makeBumper(x, y, opts = {}) {
  const body = baseBody("circle", "bumper", opts);
  body.x = x;
  body.y = y;
  body.r = opts.r ?? 14;
  /** 命中时沿法线附加的固定速度（px/s） */
  body.boost = opts.boost ?? 260;
  return computeAABB(body);
}

/**
 * 传送门：一对圆形传感器。完整语义见 `portals.js` 头注。
 *
 * @param {{x,y,r?,facing?,exitSpeed?,cooldown?}} a 入口端
 * @param {{x,y,r?,facing?,exitSpeed?,cooldown?}} b 另一端
 * @param {object} [opts]
 * @param {boolean} [opts.oneWay] true = B 端只出不进（关卡单向门）
 * @param {number}  [opts.exitSpeed] 出口最小速度，避免传送后原地下坠
 * @param {number}  [opts.cooldown]  传送冷却（s）
 * @returns {[object, object]} `[入口, 另一端]`
 */
export function makePortalPair(a, b, opts = {}) {
  const r = opts.r ?? 18;
  const idA = opts.idA || bodyId("po");
  const idB = opts.idB || bodyId("po");
  const oneWay = opts.oneWay === true;
  const build = (p, id, link, entry) => {
    const body = baseBody("circle", "portal", { ...opts, id, sensor: true });
    body.x = p.x;
    body.y = p.y;
    body.r = p.r ?? r;
    /** 本端吃蛋后送往的另一端 id；出口端为 null */
    body.link = entry ? link : null;
    /** false = 只出不进 */
    body.entry = entry;
    body.facing = Number.isFinite(p.facing) ? normalizeAngle(p.facing) : null;
    body.exitSpeed = p.exitSpeed ?? opts.exitSpeed ?? 0;
    body.cooldown = p.cooldown ?? opts.cooldown ?? PORTAL_COOLDOWN;
    return computeAABB(body);
  };
  return [build(a, idA, idB, true), build(b, idB, idA, !oneWay)];
}

/** 风扇力场：矩形区域内施加恒定加速度 */
export function makeFan(opts) {
  const w = opts.w ?? 80;
  const h = opts.h ?? 160;
  const angle = opts.angle ?? -Math.PI / 2;
  const power = opts.power ?? 1400;
  return {
    id: opts.id || bodyId("fan"),
    type: "fan",
    active: opts.active !== false,
    x: opts.x ?? 0,
    y: opts.y ?? 0,
    w,
    h,
    hw: w / 2,
    hh: h / 2,
    angle,
    power,
    ax: opts.ax ?? Math.cos(angle) * power,
    ay: opts.ay ?? Math.sin(angle) * power,
    /** 沿风向的线性衰减：0=全区等强，1=出口处衰减为 0 */
    falloff: opts.falloff ?? 0,
    tags: opts.tags ? { ...opts.tags } : {},
  };
}

/** 全局风：整张图恒定加速度 */
export function makeWind(ax, ay, opts = {}) {
  return {
    id: opts.id || bodyId("wind"),
    type: "wind",
    active: opts.active !== false,
    ax,
    ay,
    tags: opts.tags ? { ...opts.tags } : {},
  };
}

/** 减速区：区域内额外阻尼（每秒保留比例） */
export function makeSlowField(opts) {
  const w = opts.w ?? 120;
  const h = opts.h ?? 120;
  return {
    id: opts.id || bodyId("slow"),
    type: "slow",
    active: opts.active !== false,
    x: opts.x ?? 0,
    y: opts.y ?? 0,
    w,
    h,
    hw: w / 2,
    hh: h / 2,
    keep: opts.keep ?? 0.25,
    tags: opts.tags ? { ...opts.tags } : {},
  };
}

/** 局部重力区：区域内覆盖世界重力 */
export function makeGravityField(opts) {
  const w = opts.w ?? WORLD_W;
  const h = opts.h ?? 200;
  return {
    id: opts.id || bodyId("grav"),
    type: "gravity",
    active: opts.active !== false,
    x: opts.x ?? WORLD_W / 2,
    y: opts.y ?? WORLD_H / 2,
    w,
    h,
    hw: w / 2,
    hh: h / 2,
    gravity: opts.gravity ?? GRAVITY * 0.35,
    tags: opts.tags ? { ...opts.tags } : {},
  };
}

/** 判断点是否落在矩形力场内 */
export function fieldContains(field, x, y) {
  return (
    x >= field.x - field.hw &&
    x <= field.x + field.hw &&
    y >= field.y - field.hh &&
    y <= field.y + field.hh
  );
}

/**
 * 生成一排钉板，常用于「钉板图」。
 * rows×cols 交错排列。
 */
export function makePegGrid(opts = {}) {
  const rows = opts.rows ?? 4;
  const cols = opts.cols ?? 6;
  const x0 = opts.x ?? 60;
  const y0 = opts.y ?? 320;
  const gapX = opts.gapX ?? 64;
  const gapY = opts.gapY ?? 56;
  const out = [];
  for (let r = 0; r < rows; r++) {
    const offset = r % 2 === 0 ? 0 : gapX / 2;
    for (let c = 0; c < cols; c++) {
      out.push(makePeg(x0 + offset + c * gapX, y0 + r * gapY, { r: opts.r ?? 6 }));
    }
  }
  return out;
}

/** 生成一片砖墙 */
export function makeBrickField(opts = {}) {
  const rows = opts.rows ?? 3;
  const cols = opts.cols ?? 8;
  const w = opts.w ?? 52;
  const h = opts.h ?? 26;
  const x0 = opts.x ?? 40;
  const y0 = opts.y ?? 200;
  const gapX = opts.gapX ?? w + 4;
  const gapY = opts.gapY ?? h + 4;
  const out = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      out.push(
        makeBrick({
          x: x0 + c * gapX,
          y: y0 + r * gapY,
          w,
          h,
          hp: opts.hp ?? 30,
        }),
      );
    }
  }
  return out;
}

/** 角度工具再导出，方便关卡数据层直接用 */
export { TAU };
