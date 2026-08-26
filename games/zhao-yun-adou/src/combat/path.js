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

/**
 * 预计算折线的分段长度与累计长度，避免每帧重复求和。
 * 战斗每 tick 会做 (格子 × 敌人) 次采样，缓存后开销可忽略。
 */
export function measurePath(pts) {
  const seg = [];
  const cum = [0];
  let total = 0;
  for (let i = 1; i < pts.length; i++) {
    const len = Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
    seg.push(len);
    total += len;
    cum.push(total);
  }
  return { pts, seg, cum, total };
}

const measured = new WeakMap();

function measureCached(pts) {
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
  const clamped = Math.max(0, Math.min(1, t));
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
