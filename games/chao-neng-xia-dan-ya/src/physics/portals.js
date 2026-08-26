/**
 * 传送门语义（唯一收口点）。
 *
 * 门永远是一对圆形传感器（`kind === "portal"`、`sensor === true`），
 * 两端的角色由 `entry` 与 `link` 决定：
 *
 *   - **入口**（`entry !== false` 且 `link` 指向同世界的另一端）：蛋圆与门圆
 *     相交即被吃掉并瞬移到出口。传送不算反弹、不落接触账本、不结算伤害，
 *     只发一条 `portal` 事件。
 *   - **出口**（`entry === false`，或历史写法 `kind === "portalExit"`）：纯传感器，
 *     只发 `sensor` 事件，不吃蛋。
 *   - `makePortalPair(a, b)` 默认双向（两端互为入口）；`{ oneWay: true }` 时
 *     B 端降级为出口，语义与 `core/sim.js` 的关卡单向门一致。
 *
 * 出射速度：
 *   - 两端都写了 `facing`（门面朝外的法线，弧度，y 轴向下）时，入射速度绕
 *     `dest.facing - body.facing + π` 旋转——「贴着 A 的门面进去，顺着 B 的
 *     门面出来」。任一端没写朝向就原样保留速度方向。
 *   - `dest.exitSpeed > 0` 时把出射速率抬到该下限，避免出门原地下坠；入射速度
 *     为 0 时方向取 `dest.facing`，仍没有就取正下方。
 *
 * 出射位置：出口圆心沿出射方向外推 `dest.r + egg.r + PORTAL_EXIT_CLEARANCE`。
 *
 * 冷却：取 `dest.cooldown ?? body.cooldown ?? PORTAL_COOLDOWN`，写进
 * `egg.portalCooldown`；冷却期内该蛋不会被任何门吃掉。
 *
 * 本模块只做纯几何与判定，不写世界、不发事件——落地（搬蛋、记统计、发事件）
 * 在 `world.js` 的 `handlePortal` 一处完成，避免语义再次分叉。
 */

import { PORTAL_COOLDOWN, PORTAL_EXIT_CLEARANCE } from "./constants.js";
import { EPS, normalizeAngle } from "./math.js";

/** 速度低于该值视为静止，方向改用门朝向兜底 */
const STILL_SPEED = 1e-6;

/** 是否为传送门体（含历史的 `portalExit` 写法） */
export function isPortalBody(body) {
  return !!body && (body.kind === "portal" || body.kind === "portalExit");
}

/** 这一端是否吃蛋。出口端 / 无链接的孤门一律返回 false。 */
export function isPortalEntry(body) {
  if (!isPortalBody(body)) return false;
  if (body.kind === "portalExit") return false;
  if (body.entry === false) return false;
  return typeof body.link === "string" && body.link.length > 0;
}

/**
 * 解析入口指向的出口体。
 * 优先走 `world.staticById` 索引，索引缺失（如刚从快照恢复的世界）时线性回退。
 * @returns {object|null} 出口体；链接断了 / 出口已失活 / 自链接时返回 null
 */
export function portalDestination(world, body) {
  const link = body?.link;
  if (typeof link !== "string" || link.length === 0) return null;
  let dest = world.staticById instanceof Map ? world.staticById.get(link) : undefined;
  if (dest === undefined) {
    const list = world.statics;
    for (let i = 0; i < list.length; i++) {
      if (list[i].id === link) {
        dest = list[i];
        break;
      }
    }
  }
  if (!dest || dest === body || dest.active === false) return null;
  return dest;
}

/** 本次传送后的冷却秒数 */
export function portalCooldownOf(body, dest) {
  const fromDest = dest?.cooldown;
  if (Number.isFinite(fromDest) && fromDest >= 0) return fromDest;
  const fromEntry = body?.cooldown;
  if (Number.isFinite(fromEntry) && fromEntry >= 0) return fromEntry;
  return PORTAL_COOLDOWN;
}

/** 出射解算的复用容器（热路径不分配） */
export function createPortalExit() {
  return {
    dest: null,
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    dirX: 0,
    dirY: 1,
    speed: 0,
    cooldown: PORTAL_COOLDOWN,
  };
}

const facingOf = (body) => (Number.isFinite(body?.facing) ? body.facing : null);

/**
 * 解算一次传送的出射状态。纯函数，不改 egg / body。
 * @param {object} egg   入射的蛋（读 x/y/vx/vy/r）
 * @param {object} body  入口
 * @param {object} dest  出口
 * @param {object} [out] 复用容器
 */
export function computePortalExit(egg, body, dest, out = createPortalExit()) {
  let vx = egg.vx;
  let vy = egg.vy;

  const from = facingOf(body);
  const to = facingOf(dest);
  if (from !== null && to !== null) {
    // +π：入射是「撞向 A 的门面」，出射要「顺着 B 的门面离开」
    const delta = normalizeAngle(to - from + Math.PI);
    const c = Math.cos(delta);
    const s = Math.sin(delta);
    const nvx = vx * c - vy * s;
    vy = vx * s + vy * c;
    vx = nvx;
  }

  let speed = Math.hypot(vx, vy);
  const floor = Number.isFinite(dest.exitSpeed) && dest.exitSpeed > 0 ? dest.exitSpeed : 0;
  if (floor > 0 && speed < floor) {
    if (speed > STILL_SPEED) {
      const k = floor / speed;
      vx *= k;
      vy *= k;
    } else {
      // 静止入门：没有方向可继承，按出口朝向送出，再没有就正下方
      const a = to !== null ? to : Math.PI / 2;
      vx = Math.cos(a) * floor;
      vy = Math.sin(a) * floor;
    }
    speed = floor;
  }

  let dirX;
  let dirY;
  if (speed > STILL_SPEED) {
    dirX = vx / speed;
    dirY = vy / speed;
  } else if (to !== null) {
    dirX = Math.cos(to);
    dirY = Math.sin(to);
  } else {
    dirX = 0;
    dirY = 1;
  }

  const destR = Number.isFinite(dest.r) ? dest.r : 0;
  const eggR = Number.isFinite(egg.r) ? egg.r : 0;
  const clearance = destR + eggR + PORTAL_EXIT_CLEARANCE;

  out.dest = dest;
  out.dirX = dirX;
  out.dirY = dirY;
  out.x = dest.x + dirX * clearance;
  out.y = dest.y + dirY * clearance;
  out.vx = Math.abs(vx) < EPS ? 0 : vx;
  out.vy = Math.abs(vy) < EPS ? 0 : vy;
  out.speed = speed;
  out.cooldown = portalCooldownOf(body, dest);
  return out;
}
