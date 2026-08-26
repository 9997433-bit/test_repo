/** 每侧一条「几」字形路线，进度 t∈[0,1] 抵达阿斗。 */
export function pathPoints(width, height, flipY) {
  const padX = width * 0.08;
  const top = flipY ? height * 0.18 : height * 0.22;
  const bot = flipY ? height * 0.82 : height * 0.78;
  const midY = (top + bot) / 2;
  const pts = [
    { x: padX, y: top },
    { x: width - padX, y: top },
    { x: width - padX, y: midY },
    { x: padX, y: midY },
    { x: padX, y: bot },
    { x: width * 0.5, y: bot },
  ];
  return pts;
}

const ORIGIN = { x: 0, y: 0 };

function isPoint(p) {
  return !!p && Number.isFinite(p.x) && Number.isFinite(p.y);
}

/**
 * 预计算折线的分段长度与累计长度，避免每帧重复求和。
 * 战斗每 tick 会做 (格子 × 敌人) 次采样，缓存后开销可忽略。
 *
 * 坏点（缺坐标、NaN）在这里就剔除：留到采样阶段会把整条路线的距离
 * 一起污染成 NaN，射程判定随之全盘失效。
 */
export function measurePath(pts) {
  const points = Array.isArray(pts) ? pts.filter(isPoint) : [];
  const seg = [];
  const cum = [0];
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    const len = Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
    seg.push(len);
    total += len;
    cum.push(total);
  }
  return { pts: points, seg, cum, total };
}

const measured = new WeakMap();

function measureCached(pts) {
  // WeakMap 只收对象键，非数组输入直接量一次，别让缓存本身抛出来。
  if (!Array.isArray(pts)) return measurePath(pts);
  let m = measured.get(pts);
  if (!m) {
    m = measurePath(pts);
    measured.set(pts, m);
  }
  return m;
}

export function pathLength(pts) {
  return measureCached(pts).total;
}

/** 折线上进度 t 处的坐标（measured 版本供战斗热循环使用）。 */
export function pointOn(m, t) {
  if (!m || !Array.isArray(m.pts) || !m.pts.length) return { ...ORIGIN };
  // t 非有限值按起点算：当成「已走到终点」会凭空判出一次漏怪。
  const clamped = Number.isFinite(t) ? Math.max(0, Math.min(1, t)) : 0;
  let remain = clamped * m.total;
  for (let i = 0; i < m.seg.length; i++) {
    const len = m.seg[i];
    if (remain <= len) {
      const k = len === 0 ? 0 : remain / len;
      const a = m.pts[i];
      const b = m.pts[i + 1];
      return { x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k };
    }
    remain -= len;
  }
  const last = m.pts[m.pts.length - 1];
  return { x: last.x, y: last.y };
}

export function pointAt(pts, t) {
  return pointOn(measureCached(pts), t);
}

/** 距离 (x,y) 最近的折线点：返回其进度 t 与垂距 dist。 */
export function nearestOn(m, x, y) {
  let best = 0;
  let bestD = Infinity;
  if (!m || !Array.isArray(m.seg) || !Number.isFinite(x) || !Number.isFinite(y)) {
    return { t: best, dist: bestD };
  }
  for (let i = 0; i < m.seg.length; i++) {
    const a = m.pts[i];
    const b = m.pts[i + 1];
    const vx = b.x - a.x;
    const vy = b.y - a.y;
    const len2 = vx * vx + vy * vy || 1;
    const u = Math.max(0, Math.min(1, ((x - a.x) * vx + (y - a.y) * vy) / len2));
    const px = a.x + vx * u;
    const py = a.y + vy * u;
    const d = Math.hypot(x - px, y - py);
    if (d < bestD) {
      bestD = d;
      best = m.total === 0 ? 0 : (m.cum[i] + m.seg[i] * u) / m.total;
    }
  }
  return { t: best, dist: bestD };
}

export function nearestPathT(pts, x, y) {
  return nearestOn(measureCached(pts), x, y);
}
