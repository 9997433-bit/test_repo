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

export function pathLength(pts) {
  let len = 0;
  for (let i = 1; i < pts.length; i++) {
    len += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
  }
  return len;
}

export function pointAt(pts, t) {
  const total = pathLength(pts);
  let remain = Math.max(0, Math.min(1, t)) * total;
  for (let i = 1; i < pts.length; i++) {
    const seg = Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
    if (remain <= seg) {
      const k = seg === 0 ? 0 : remain / seg;
      return {
        x: pts[i - 1].x + (pts[i].x - pts[i - 1].x) * k,
        y: pts[i - 1].y + (pts[i].y - pts[i - 1].y) * k,
      };
    }
    remain -= seg;
  }
  return { ...pts[pts.length - 1] };
}

export function nearestPathT(pts, x, y) {
  let best = 0;
  let bestD = Infinity;
  const total = pathLength(pts);
  let acc = 0;
  for (let i = 1; i < pts.length; i++) {
    const ax = pts[i - 1].x;
    const ay = pts[i - 1].y;
    const bx = pts[i].x;
    const by = pts[i].y;
    const vx = bx - ax;
    const vy = by - ay;
    const len2 = vx * vx + vy * vy || 1;
    const u = Math.max(0, Math.min(1, ((x - ax) * vx + (y - ay) * vy) / len2));
    const px = ax + vx * u;
    const py = ay + vy * u;
    const d = Math.hypot(x - px, y - py);
    const t = (acc + Math.sqrt(len2) * u) / total;
    if (d < bestD) {
      bestD = d;
      best = t;
    }
    acc += Math.sqrt(len2);
  }
  return { t: best, dist: bestD };
}
