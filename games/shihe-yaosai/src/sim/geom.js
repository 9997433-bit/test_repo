// 极坐标 <-> 世界坐标。θ = i/24 * 2π，x = cosθ*r，z = sinθ*r，yaw=0 朝 +X。

export const TAU = Math.PI * 2;

export function socketAngle(index, socketCount) {
  return (index / socketCount) * TAU;
}

export function polar(theta, radius, y) {
  return { x: Math.cos(theta) * radius, y, z: Math.sin(theta) * radius };
}

export function dist3(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = a.z - b.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

export function dist3Sq(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = a.z - b.z;
  return dx * dx + dy * dy + dz * dz;
}

/** 点到线段的最短距离，用于棱镜折光的“在光束方向 18 单位内”判定。 */
export function distPointSegment(p, a, b) {
  const abx = b.x - a.x;
  const aby = b.y - a.y;
  const abz = b.z - a.z;
  const lenSq = abx * abx + aby * aby + abz * abz;
  if (lenSq < 1e-9) return dist3(p, a);
  let t = ((p.x - a.x) * abx + (p.y - a.y) * aby + (p.z - a.z) * abz) / lenSq;
  t = t < 0 ? 0 : t > 1 ? 1 : t;
  return dist3(p, { x: a.x + abx * t, y: a.y + aby * t, z: a.z + abz * t });
}

export function lerpPoint(a, b, t) {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, z: a.z + (b.z - a.z) * t };
}

/** 折线总长与逐段长度。 */
export function pathLengths(points) {
  const segs = [];
  let total = 0;
  for (let i = 1; i < points.length; i += 1) {
    const d = dist3(points[i - 1], points[i]);
    segs.push(d);
    total += d;
  }
  return { segs, total };
}

export function wrapAngle(theta) {
  let a = theta % TAU;
  if (a < 0) a += TAU;
  return a;
}

/**
 * view 里所有浮点都走这里：四舍五入到 1e-4，并把 -0 / NaN / Infinity 归一成 0。
 * `JSON.stringify(-0)` 会写成 `0`，不归一就过不了 JSON 往返相等的契约测试。
 */
export function round4(n) {
  if (!Number.isFinite(n)) return 0;
  const r = Math.round(n * 10000) / 10000;
  return r === 0 ? 0 : r;
}

/** 整数 / 已经算好的量走这里：只做 -0 与非有限值的归一，不动精度。 */
export function num0(n) {
  if (!Number.isFinite(n)) return 0;
  return n === 0 ? 0 : n;
}
