export function dist(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.hypot(dx, dy);
}

export function polylineLength(points) {
  let n = 0;
  for (let i = 1; i < points.length; i += 1) n += dist(points[i - 1], points[i]);
  return n;
}

export function boundsOf(points) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const p of points) {
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  }
  return { minX, minY, maxX, maxY, w: maxX - minX, h: maxY - minY };
}

export function resample(points, n = 64) {
  if (points.length < 2) return points.slice();
  const total = polylineLength(points);
  if (total <= 0) return points.slice(0, 1);
  const step = total / (n - 1);
  const out = [points[0]];
  let acc = 0;
  let i = 1;
  let prev = points[0];
  while (out.length < n && i < points.length) {
    const d = dist(prev, points[i]);
    if (acc + d >= step) {
      const t = (step - acc) / d;
      const nx = prev.x + (points[i].x - prev.x) * t;
      const ny = prev.y + (points[i].y - prev.y) * t;
      const np = { x: nx, y: ny, t: prev.t + ((points[i].t ?? 0) - (prev.t ?? 0)) * t };
      out.push(np);
      prev = np;
      acc = 0;
    } else {
      acc += d;
      prev = points[i];
      i += 1;
    }
  }
  while (out.length < n) out.push(points[points.length - 1]);
  return out;
}

export function centroid(points) {
  let x = 0;
  let y = 0;
  for (const p of points) {
    x += p.x;
    y += p.y;
  }
  return { x: x / points.length, y: y / points.length };
}

export function angles(points) {
  const out = [];
  for (let i = 2; i < points.length; i += 1) {
    const a = points[i - 2];
    const b = points[i - 1];
    const c = points[i];
    const v1x = b.x - a.x;
    const v1y = b.y - a.y;
    const v2x = c.x - b.x;
    const v2y = c.y - b.y;
    const d1 = Math.hypot(v1x, v1y) || 1;
    const d2 = Math.hypot(v2x, v2y) || 1;
    const dot = (v1x * v2x + v1y * v2y) / (d1 * d2);
    out.push(Math.acos(Math.max(-1, Math.min(1, dot))));
  }
  return out;
}

export function turningNumber(points) {
  let sum = 0;
  for (let i = 1; i < points.length; i += 1) {
    const a = points[i - 1];
    const b = points[i];
    const c = points[(i + 1) % points.length];
    const cross = (b.x - a.x) * (c.y - b.y) - (b.y - a.y) * (c.x - b.x);
    const dot = (b.x - a.x) * (c.x - b.x) + (b.y - a.y) * (c.y - b.y);
    sum += Math.atan2(cross, dot);
  }
  return sum / (2 * Math.PI);
}

export function r2Line(points) {
  const n = points.length;
  let sx = 0;
  let sy = 0;
  let sxx = 0;
  let syy = 0;
  let sxy = 0;
  for (const p of points) {
    sx += p.x;
    sy += p.y;
    sxx += p.x * p.x;
    syy += p.y * p.y;
    sxy += p.x * p.y;
  }
  const num = n * sxy - sx * sy;
  const vx = n * sxx - sx * sx;
  const vy = n * syy - sy * sy;
  if (vx <= 1e-6 && vy <= 1e-6) return 1;
  if (vx <= 1e-6 || vy <= 1e-6) return 1;
  const den = Math.sqrt(vx * vy) || 1;
  return Math.abs(num / den);
}

export function circleFit(points) {
  const c = centroid(points);
  const rs = points.map((p) => dist(p, c));
  const mean = rs.reduce((a, b) => a + b, 0) / rs.length;
  const variance = rs.reduce((a, r) => a + (r - mean) ** 2, 0) / rs.length;
  const std = Math.sqrt(variance);
  const closure = dist(points[0], points[points.length - 1]);
  const circ = mean * 2 * Math.PI || 1;
  return {
    radius: mean,
    circularity: 1 / (1 + std / (mean || 1)),
    closure: Math.max(0, 1 - closure / circ),
  };
}

export function meanSpeed(points) {
  if (points.length < 2) return 0;
  let v = 0;
  let n = 0;
  for (let i = 1; i < points.length; i += 1) {
    const dt = Math.max(1, (points[i].t ?? i) - (points[i - 1].t ?? i - 1));
    v += dist(points[i], points[i - 1]) / dt;
    n += 1;
  }
  return v / n;
}
