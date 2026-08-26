/**
 * 窄相碰撞：圆-线段（胶囊）、圆-圆、圆-AABB。
 *
 * 所有检测函数把结果写入调用方提供的 manifold，避免分配：
 *   m.hit    是否接触
 *   m.nx/ny  单位法线，方向为「把蛋推离静态体」
 *   m.depth  穿透深度（>=0）
 *   m.px/py  接触点（世界坐标）
 */

import { PENETRATION_SLOP, RESTING_VELOCITY } from "./constants.js";
import {
  EPS,
  clamp,
  closestPointOnSegment,
  combineFriction,
  combineRestitution,
  vec,
} from "./math.js";

export function createManifold() {
  return { hit: false, nx: 0, ny: 0, depth: 0, px: 0, py: 0, body: null };
}

const scratchPoint = vec();

/** 圆 vs 圆（钉、弹垫、蛋与蛋） */
export function circleVsCircle(cx, cy, cr, ox, oy, or_, m) {
  const dx = cx - ox;
  const dy = cy - oy;
  const rsum = cr + or_;
  const d2 = dx * dx + dy * dy;
  if (d2 >= rsum * rsum) {
    m.hit = false;
    return m;
  }
  const d = Math.sqrt(d2);
  if (d < EPS) {
    // 完全重合：沿竖直方向分开，保证确定性
    m.nx = 0;
    m.ny = -1;
    m.depth = rsum;
  } else {
    m.nx = dx / d;
    m.ny = dy / d;
    m.depth = rsum - d;
  }
  m.px = ox + m.nx * or_;
  m.py = oy + m.ny * or_;
  m.hit = true;
  return m;
}

/** 圆 vs 胶囊线段（墙、斜面、挡板） */
export function circleVsSegment(cx, cy, cr, body, m, fromX = cx, fromY = cy) {
  const p = closestPointOnSegment(cx, cy, body.x1, body.y1, body.x2, body.y2, scratchPoint);
  const dx = cx - p.x;
  const dy = cy - p.y;
  const rsum = cr + body.halfThickness;
  const d2 = dx * dx + dy * dy;
  if (d2 >= rsum * rsum) {
    m.hit = false;
    return m;
  }
  const d = Math.sqrt(d2);
  if (d < EPS) {
    // 蛋心正好压在中心线上：用上一位置所在侧决定法线朝向
    const side = (fromX - p.x) * body.nx + (fromY - p.y) * body.ny;
    const s = side < 0 ? -1 : 1;
    m.nx = body.nx * s;
    m.ny = body.ny * s;
    m.depth = rsum;
  } else {
    m.nx = dx / d;
    m.ny = dy / d;
    m.depth = rsum - d;
  }
  m.px = p.x;
  m.py = p.y;
  m.hit = true;
  return m;
}

/** 圆 vs AABB（砖、冰面）。body 用中心 + 半宽半高表示。 */
export function circleVsAABB(cx, cy, cr, body, m) {
  const minX = body.x - body.hw;
  const maxX = body.x + body.hw;
  const minY = body.y - body.hh;
  const maxY = body.y + body.hh;
  const qx = clamp(cx, minX, maxX);
  const qy = clamp(cy, minY, maxY);
  const dx = cx - qx;
  const dy = cy - qy;
  const d2 = dx * dx + dy * dy;

  if (d2 > EPS) {
    if (d2 >= cr * cr) {
      m.hit = false;
      return m;
    }
    const d = Math.sqrt(d2);
    m.nx = dx / d;
    m.ny = dy / d;
    m.depth = cr - d;
    m.px = qx;
    m.py = qy;
    m.hit = true;
    return m;
  }

  // 圆心落在矩形内部：沿穿透最浅的轴推出
  const left = cx - minX;
  const right = maxX - cx;
  const top = cy - minY;
  const bottom = maxY - cy;
  let best = left;
  let nx = -1;
  let ny = 0;
  if (right < best) {
    best = right;
    nx = 1;
    ny = 0;
  }
  if (top < best) {
    best = top;
    nx = 0;
    ny = -1;
  }
  if (bottom < best) {
    best = bottom;
    nx = 0;
    ny = 1;
  }
  m.nx = nx;
  m.ny = ny;
  m.depth = best + cr;
  m.px = cx - nx * best;
  m.py = cy - ny * best;
  m.hit = true;
  return m;
}

/**
 * 按 body.shape 分发。fromX/fromY 为子步起点，用于单向板与退化法线判断。
 * 返回 manifold（m.hit 表示是否接触）。
 */
export function collideCircleBody(egg, body, m, fromX, fromY) {
  m.body = body;
  if (body.shape === "circle") {
    circleVsCircle(egg.x, egg.y, egg.r, body.x, body.y, body.r, m);
  } else if (body.shape === "aabb") {
    circleVsAABB(egg.x, egg.y, egg.r, body, m);
  } else {
    circleVsSegment(egg.x, egg.y, egg.r, body, m, fromX ?? egg.x, fromY ?? egg.y);
  }
  if (m.hit && body.oneWay) {
    // 单向板：只挡住从法线正面靠近的蛋
    const side = (fromX ?? egg.x) * body.nx + (fromY ?? egg.y) * body.ny;
    const plane = body.x1 * body.nx + body.y1 * body.ny;
    const approaching = egg.vx * body.nx + egg.vy * body.ny < 0;
    if (side - plane < 0 || !approaching) m.hit = false;
  }
  return m;
}

/**
 * 把蛋从静态体中推出并反射速度。
 * 返回本次接触的法向冲击强度（px/s），可用于音效与伤害权重；未反弹时返回 0。
 */
export function resolveStaticContact(egg, body, m) {
  // 位置修正
  const push = m.depth + PENETRATION_SLOP;
  egg.x += m.nx * push;
  egg.y += m.ny * push;

  const vn = egg.vx * m.nx + egg.vy * m.ny;
  if (vn >= 0) return 0; // 已在分离，只做位置修正

  const impact = -vn;
  const e = combineRestitution(egg.restitution, body.restitution);
  const f = combineFriction(egg.friction, body.friction);

  const tx = -m.ny;
  const ty = m.nx;
  const vt = egg.vx * tx + egg.vy * ty;

  let rn = impact * e;
  // 低速接触直接吸附，避免在斜面/砖面上无限抖动
  if (rn < RESTING_VELOCITY) rn = 0;
  const rt = vt * (1 - f);

  egg.vx = m.nx * rn + tx * rt;
  egg.vy = m.ny * rn + ty * rt;

  if (body.boost) {
    egg.vx += m.nx * body.boost;
    egg.vy += m.ny * body.boost;
  }
  return impact;
}

/**
 * 蛋与蛋的等效质量冲量解算（碰撞流核心）。
 * 返回法向相对冲击强度；分离中返回 0。
 */
export function resolveEggPair(a, b, m) {
  const invA = a.invMass;
  const invB = b.invMass;
  const invSum = invA + invB;
  if (invSum <= 0) return 0;

  // 位置修正按逆质量分配
  const push = m.depth + PENETRATION_SLOP;
  a.x += m.nx * push * (invA / invSum);
  a.y += m.ny * push * (invA / invSum);
  b.x -= m.nx * push * (invB / invSum);
  b.y -= m.ny * push * (invB / invSum);

  const rvx = a.vx - b.vx;
  const rvy = a.vy - b.vy;
  const vn = rvx * m.nx + rvy * m.ny;
  if (vn >= 0) return 0;

  const e = combineRestitution(a.restitution, b.restitution);
  const j = (-(1 + e) * vn) / invSum;
  a.vx += m.nx * j * invA;
  a.vy += m.ny * j * invA;
  b.vx -= m.nx * j * invB;
  b.vy -= m.ny * j * invB;
  return -vn;
}
