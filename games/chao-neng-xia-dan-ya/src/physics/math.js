/**
 * 标量 / 向量工具。
 * 热路径函数一律接受 out 参数复用对象，避免每帧产生垃圾。
 */

export const TAU = Math.PI * 2;
export const EPS = 1e-9;

export function clamp(v, lo, hi) {
  return v < lo ? lo : v > hi ? hi : v;
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}

export function length(x, y) {
  return Math.sqrt(x * x + y * y);
}

export function lengthSq(x, y) {
  return x * x + y * y;
}

export function dot(ax, ay, bx, by) {
  return ax * bx + ay * by;
}

export function cross(ax, ay, bx, by) {
  return ax * by - ay * bx;
}

export function distance(ax, ay, bx, by) {
  return Math.sqrt((bx - ax) * (bx - ax) + (by - ay) * (by - ay));
}

export function distanceSq(ax, ay, bx, by) {
  return (bx - ax) * (bx - ax) + (by - ay) * (by - ay);
}

/** 把角度收敛到 (-π, π] */
export function normalizeAngle(a) {
  let r = a % TAU;
  if (r > Math.PI) r -= TAU;
  if (r <= -Math.PI) r += TAU;
  return r;
}

export function vec(x = 0, y = 0) {
  return { x, y };
}

/** 绕原点旋转，结果写入 out */
export function rotate(x, y, angle, out = vec()) {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  out.x = x * c - y * s;
  out.y = x * s + y * c;
  return out;
}

/** 单位化，零向量回退到 fallback 方向 */
export function normalize(x, y, out = vec(), fallbackX = 0, fallbackY = -1) {
  const len = Math.sqrt(x * x + y * y);
  if (len < EPS) {
    out.x = fallbackX;
    out.y = fallbackY;
    out.len = 0;
    return out;
  }
  out.x = x / len;
  out.y = y / len;
  out.len = len;
  return out;
}

/**
 * 点到线段的最近点。
 * out.t 为投影参数（0=A 端，1=B 端），可用于判断是否命中端点。
 */
export function closestPointOnSegment(px, py, ax, ay, bx, by, out = vec()) {
  const abx = bx - ax;
  const aby = by - ay;
  const denom = abx * abx + aby * aby;
  let t = 0;
  if (denom > EPS) t = ((px - ax) * abx + (py - ay) * aby) / denom;
  t = t < 0 ? 0 : t > 1 ? 1 : t;
  out.x = ax + abx * t;
  out.y = ay + aby * t;
  out.t = t;
  return out;
}

/** 把 v 沿法线 n 反射（n 必须已单位化），restitution 为法向能量保留 */
export function reflect(vx, vy, nx, ny, restitution = 1, friction = 0, out = vec()) {
  const vn = vx * nx + vy * ny;
  const tx = -ny;
  const ty = nx;
  const vt = vx * tx + vy * ty;
  const rn = -vn * restitution;
  const rt = vt * (1 - clamp(friction, 0, 1));
  out.x = nx * rn + tx * rt;
  out.y = ny * rn + ty * rt;
  return out;
}

/** 两材质弹性合成：乘积模型，保证「弹簧墙 × 硬蛋」仍能加速 */
export function combineRestitution(a, b) {
  return clamp(a * b, 0, 1.6);
}

/** 两材质摩擦合成：几何平均 */
export function combineFriction(a, b) {
  return clamp(Math.sqrt(Math.max(a, 0) * Math.max(b, 0)), 0, 1);
}

/** 确定性伪随机（mulberry32），物理层禁止使用 Math.random */
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** 平滑衰减：把「每秒保留 keep」换算成本步保留系数 */
export function damp(keepPerSecond, dt) {
  return Math.pow(clamp(keepPerSecond, 0, 1), dt);
}

/** AABB 与 AABB 是否相交 */
export function aabbOverlap(aMinX, aMinY, aMaxX, aMaxY, bMinX, bMinY, bMaxX, bMaxY) {
  return aMinX <= bMaxX && aMaxX >= bMinX && aMinY <= bMaxY && aMaxY >= bMinY;
}
