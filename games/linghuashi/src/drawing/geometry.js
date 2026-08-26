const EPS = 1e-9;

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
  if (!Number.isFinite(minX)) return { minX: 0, minY: 0, maxX: 0, maxY: 0, w: 0, h: 0 };
  return { minX, minY, maxX, maxY, w: maxX - minX, h: maxY - minY };
}

/**
 * Drops non-finite samples, collapses duplicated positions and forces a
 * monotonic timeline so downstream speed maths never divides by zero.
 */
export function sanitize(rawPoints) {
  const out = [];
  let lastT = 0;
  for (const p of rawPoints || []) {
    const x = Number(p?.x);
    const y = Number(p?.y);
    if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
    let t = Number(p?.t);
    if (!Number.isFinite(t)) t = out.length ? lastT + 8 : 0;
    if (out.length && t < lastT) t = lastT;
    const prev = out[out.length - 1];
    if (prev && Math.abs(prev.x - x) < 1e-4 && Math.abs(prev.y - y) < 1e-4) {
      prev.t = t;
      lastT = t;
      continue;
    }
    out.push({ x, y, t });
    lastT = t;
  }
  return out;
}

export function resample(points, n = 64) {
  if (!points || points.length < 2) return (points || []).slice();
  const total = polylineLength(points);
  if (total <= EPS) return points.slice(0, 1);
  const count = Math.max(2, Math.round(n));
  const cum = new Array(points.length);
  cum[0] = 0;
  for (let i = 1; i < points.length; i += 1) cum[i] = cum[i - 1] + dist(points[i - 1], points[i]);
  const out = [];
  let j = 1;
  for (let k = 0; k < count; k += 1) {
    const target = (total * k) / (count - 1);
    while (j < points.length - 1 && cum[j] < target) j += 1;
    const a = points[j - 1];
    const b = points[j];
    const seg = cum[j] - cum[j - 1];
    const u = seg > EPS ? clamp((target - cum[j - 1]) / seg, 0, 1) : 0;
    out.push({
      x: a.x + (b.x - a.x) * u,
      y: a.y + (b.y - a.y) * u,
      t: (a.t ?? 0) + ((b.t ?? 0) - (a.t ?? 0)) * u,
    });
  }
  return out;
}

/**
 * Moving-average smoothing over arc length. The window shrinks near the ends so
 * both endpoints survive untouched, which matters for closure measurements.
 */
export function boxSmooth(points, half) {
  const n = points.length;
  const k = Math.floor(half);
  if (k < 1 || n < 3) return points.map((p) => ({ ...p }));
  const px = new Float64Array(n + 1);
  const py = new Float64Array(n + 1);
  for (let i = 0; i < n; i += 1) {
    px[i + 1] = px[i] + points[i].x;
    py[i + 1] = py[i] + points[i].y;
  }
  const out = new Array(n);
  for (let i = 0; i < n; i += 1) {
    const w = Math.min(k, i, n - 1 - i);
    const lo = i - w;
    const hi = i + w + 1;
    const c = hi - lo;
    out[i] = { x: (px[hi] - px[lo]) / c, y: (py[hi] - py[lo]) / c, t: points[i].t };
  }
  return out;
}

/** Binomial [1 2 1] smoothing that keeps both endpoints pinned. */
export function smoothPolyline(points, passes = 1) {
  let cur = points;
  for (let p = 0; p < passes; p += 1) {
    if (cur.length < 3) return cur.slice();
    const out = new Array(cur.length);
    out[0] = { ...cur[0] };
    out[cur.length - 1] = { ...cur[cur.length - 1] };
    for (let i = 1; i < cur.length - 1; i += 1) {
      const a = cur[i - 1];
      const b = cur[i];
      const c = cur[i + 1];
      out[i] = { x: (a.x + 2 * b.x + c.x) / 4, y: (a.y + 2 * b.y + c.y) / 4, t: b.t };
    }
    cur = out;
  }
  return cur;
}

export function centroid(points) {
  let x = 0;
  let y = 0;
  for (const p of points) {
    x += p.x;
    y += p.y;
  }
  const n = points.length || 1;
  return { x: x / n, y: y / n };
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
    out.push(Math.acos(clamp(dot, -1, 1)));
  }
  return out;
}

/** Signed per-vertex heading change, wrapped into (-pi, pi]. */
export function turnSeries(points) {
  const out = [];
  let prev = null;
  for (let i = 1; i < points.length; i += 1) {
    const dx = points[i].x - points[i - 1].x;
    const dy = points[i].y - points[i - 1].y;
    if (Math.hypot(dx, dy) < EPS) continue;
    const dir = Math.atan2(dy, dx);
    if (prev !== null) out.push(wrapPi(dir - prev));
    prev = dir;
  }
  return out;
}

export function turningNumber(points) {
  const turns = turnSeries(points);
  let sum = 0;
  for (const d of turns) sum += d;
  return sum / (2 * Math.PI);
}

/**
 * Total-least-squares (PCA) line fit. `rmsPerp` is the perpendicular error, the
 * only residual that stays meaningful for vertical strokes.
 */
export function lineFit(points) {
  const c = centroid(points);
  const n = points.length || 1;
  let sxx = 0;
  let syy = 0;
  let sxy = 0;
  for (const p of points) {
    const dx = p.x - c.x;
    const dy = p.y - c.y;
    sxx += dx * dx;
    syy += dy * dy;
    sxy += dx * dy;
  }
  sxx /= n;
  syy /= n;
  sxy /= n;
  const angle = 0.5 * Math.atan2(2 * sxy, sxx - syy);
  const ux = Math.cos(angle);
  const uy = Math.sin(angle);
  let sum = 0;
  let max = 0;
  for (const p of points) {
    const perp = (p.x - c.x) * -uy + (p.y - c.y) * ux;
    sum += perp * perp;
    max = Math.max(max, Math.abs(perp));
  }
  return { center: c, angle, ux, uy, rmsPerp: Math.sqrt(sum / n), maxPerp: max };
}

/** Kasa algebraic circle fit, centred on the centroid for conditioning. */
export function fitCircle(points) {
  const c = centroid(points);
  let suu = 0;
  let svv = 0;
  let suv = 0;
  let suuu = 0;
  let svvv = 0;
  let suvv = 0;
  let svuu = 0;
  for (const p of points) {
    const u = p.x - c.x;
    const v = p.y - c.y;
    suu += u * u;
    svv += v * v;
    suv += u * v;
    suuu += u * u * u;
    svvv += v * v * v;
    suvv += u * v * v;
    svuu += v * u * u;
  }
  const det = suu * svv - suv * suv;
  let cx = c.x;
  let cy = c.y;
  if (Math.abs(det) > 1e-9) {
    const d = 0.5 * (suuu + suvv);
    const e = 0.5 * (svvv + svuu);
    cx = c.x + (d * svv - suv * e) / det;
    cy = c.y + (suu * e - suv * d) / det;
  }
  const radii = points.map((p) => Math.hypot(p.x - cx, p.y - cy));
  const r = radii.reduce((a, b) => a + b, 0) / (radii.length || 1);
  let acc = 0;
  for (const v of radii) acc += (v - r) ** 2;
  return { cx, cy, r, radii, rmsRadial: Math.sqrt(acc / (radii.length || 1)) };
}

/** Legacy helper kept for API compatibility. */
export function circleFit(points) {
  const fit = fitCircle(points);
  const closure = dist(points[0], points[points.length - 1]);
  const circ = fit.r * 2 * Math.PI || 1;
  return {
    radius: fit.r,
    circularity: 1 / (1 + fit.rmsRadial / (fit.r || 1)),
    closure: Math.max(0, 1 - closure / circ),
  };
}

/** Legacy helper kept for API compatibility (absolute Pearson correlation). */
export function r2Line(points) {
  const fit = lineFit(points);
  const b = boundsOf(points);
  const span = Math.hypot(b.w, b.h) || 1;
  return clamp(1 - (fit.rmsPerp / span) * 6, 0, 1);
}

/**
 * Rescales a stroke so its two principal axes carry equal spread, capped at
 * `maxStretch`. Hand drawn "circles" are almost always ovals; measuring
 * roundness after whitening judges the shape, not the aspect ratio.
 */
export function whiten(points, maxStretch = 2) {
  const c = centroid(points);
  const n = points.length || 1;
  let sxx = 0;
  let syy = 0;
  let sxy = 0;
  for (const p of points) {
    const dx = p.x - c.x;
    const dy = p.y - c.y;
    sxx += dx * dx;
    syy += dy * dy;
    sxy += dx * dy;
  }
  sxx /= n;
  syy /= n;
  sxy /= n;
  const tr = sxx + syy;
  const diff = Math.sqrt(Math.max(0, (sxx - syy) ** 2 + 4 * sxy * sxy));
  const l1 = (tr + diff) / 2;
  const l2 = Math.max((tr - diff) / 2, 1e-9);
  const theta = 0.5 * Math.atan2(2 * sxy, sxx - syy);
  const ux = Math.cos(theta);
  const uy = Math.sin(theta);
  const stretch = clamp(Math.sqrt(l1 / l2), 1, maxStretch);
  if (stretch <= 1.02) return points.map((p) => ({ ...p }));
  return points.map((p) => {
    const dx = p.x - c.x;
    const dy = p.y - c.y;
    const a = dx * ux + dy * uy;
    const b = (-dx * uy + dy * ux) * stretch;
    return { x: c.x + a * ux - b * uy, y: c.y + a * uy + b * ux, t: p.t };
  });
}

/** Continuous polar angle around a centre, unwrapped across the +/-pi seam. */
export function unwrapAngles(points, cx, cy) {
  const out = [];
  if (!points.length) return out;
  let prev = Math.atan2(points[0].y - cy, points[0].x - cx);
  let acc = prev;
  out.push(acc);
  for (let i = 1; i < points.length; i += 1) {
    const a = Math.atan2(points[i].y - cy, points[i].x - cx);
    acc += wrapPi(a - prev);
    prev = a;
    out.push(acc);
  }
  return out;
}

/**
 * Ramer-Douglas-Peucker. Reduces a stroke to its structural vertices, which is
 * what makes corner counting independent of how fast the user drew.
 */
export function simplify(points, tolerance) {
  return simplifyIndices(points, tolerance).map((i) => points[i]);
}

/** Same as `simplify` but returns the indices of the surviving vertices. */
export function simplifyIndices(points, tolerance) {
  const n = points.length;
  if (n < 3) return points.map((_, i) => i);
  const tol = Math.max(tolerance, 1e-3);
  const keep = new Uint8Array(n);
  keep[0] = 1;
  keep[n - 1] = 1;
  const stack = [[0, n - 1]];
  while (stack.length) {
    const [lo, hi] = stack.pop();
    if (hi - lo < 2) continue;
    const a = points[lo];
    const b = points[hi];
    let dx = b.x - a.x;
    let dy = b.y - a.y;
    const len = Math.hypot(dx, dy);
    if (len > EPS) {
      dx /= len;
      dy /= len;
    }
    let bestI = -1;
    let bestD = tol;
    for (let i = lo + 1; i < hi; i += 1) {
      const px = points[i].x - a.x;
      const py = points[i].y - a.y;
      const d = len > EPS ? Math.abs(px * -dy + py * dx) : Math.hypot(px, py);
      if (d > bestD) {
        bestD = d;
        bestI = i;
      }
    }
    if (bestI >= 0) {
      keep[bestI] = 1;
      stack.push([lo, bestI], [bestI, hi]);
    }
  }
  const out = [];
  for (let i = 0; i < n; i += 1) if (keep[i]) out.push(i);
  return out;
}

/**
 * Clips the press-down / lift-off flicks that bookend most real strokes: a
 * short leading or trailing limb that leaves at a steep angle from the body of
 * the gesture. Without this a hooked drag reads as a curve instead of a line.
 */
export function trimHooks(points, scale, { maxArm = 0.13, maxTrim = 0.18, minTurn = 0.8 } = {}) {
  const n = points.length;
  if (n < 12) return points;
  const idx = simplifyIndices(points, Math.max(1.2, 0.02 * scale));
  if (idx.length < 4) return points;
  const armLimit = maxArm * scale;
  const trimLimit = Math.floor(maxTrim * n);
  const vertexAt = (k) => points[idx[k]];

  let lo = 0;
  let hi = idx.length - 1;
  for (let guard = 0; guard < 3 && hi - lo >= 3; guard += 1) {
    const a = vertexAt(lo);
    const b = vertexAt(lo + 1);
    if (dist(a, b) > armLimit || idx[lo + 1] > trimLimit) break;
    if (Math.abs(turnAt(vertexAt(lo), b, vertexAt(lo + 2))) < minTurn) break;
    lo += 1;
  }
  for (let guard = 0; guard < 3 && hi - lo >= 3; guard += 1) {
    const a = vertexAt(hi);
    const b = vertexAt(hi - 1);
    if (dist(a, b) > armLimit || n - 1 - idx[hi - 1] > trimLimit) break;
    if (Math.abs(turnAt(vertexAt(hi - 2), b, a)) < minTurn) break;
    hi -= 1;
  }
  if (lo === 0 && hi === idx.length - 1) return points;
  const from = idx[lo];
  const to = idx[hi];
  return to - from >= 8 ? points.slice(from, to + 1) : points;
}

function pointToSegment(p, a, b) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy);
  if (len < EPS) return dist(p, a);
  const t = clamp(((p.x - a.x) * dx + (p.y - a.y) * dy) / (len * len), 0, 1);
  return Math.hypot(p.x - (a.x + dx * t), p.y - (a.y + dy * t));
}

function turnAt(a, b, c) {
  const ax = b.x - a.x;
  const ay = b.y - a.y;
  const bx = c.x - b.x;
  const by = c.y - b.y;
  const da = Math.hypot(ax, ay);
  const db = Math.hypot(bx, by);
  if (da < EPS || db < EPS) return 0;
  return Math.atan2((ax * by - ay * bx) / (da * db), (ax * bx + ay * by) / (da * db));
}

/**
 * Corners of a simplified polyline.
 *
 * A hand drawn corner is rounded, so RDP reports it as a short run of vertices
 * that all bend the same way. Those runs are merged into one corner before the
 * angle test, and `minArm` then drops kinks whose outer edges are too short to
 * be anything but tremor.
 */
export function cornersOf(simplified, threshold = 0.9, minArm = 0, minDepth = 0) {
  const n = simplified.length;
  if (n < 3) return [];
  const edge = new Array(n);
  for (let i = 1; i < n; i += 1) edge[i] = dist(simplified[i - 1], simplified[i]);
  const turn = new Array(n).fill(0);
  for (let i = 1; i < n - 1; i += 1) {
    const ax = simplified[i].x - simplified[i - 1].x;
    const ay = simplified[i].y - simplified[i - 1].y;
    const bx = simplified[i + 1].x - simplified[i].x;
    const by = simplified[i + 1].y - simplified[i].y;
    const da = edge[i];
    const db = edge[i + 1];
    if (da < EPS || db < EPS) continue;
    turn[i] = Math.atan2((ax * by - ay * bx) / (da * db), (ax * bx + ay * by) / (da * db));
  }

  const out = [];
  let i = 1;
  while (i < n - 1) {
    if (turn[i] === 0) {
      i += 1;
      continue;
    }
    const sign = Math.sign(turn[i]);
    let j = i;
    let total = turn[i];
    while (j + 1 < n - 1 && Math.sign(turn[j + 1]) === sign && edge[j + 1] < minArm) {
      j += 1;
      total += turn[j];
    }
    const armBefore = edge[i];
    const armAfter = edge[j + 1];
    const angle = Math.min(Math.abs(total), Math.PI);
    if (angle >= threshold && Math.min(armBefore, armAfter) >= minArm) {
      // How far the apex actually departs from the line its neighbours span.
      // A 90 degree kink between two 6px arms is 4px deep: that is tremor.
      let depth = 0;
      for (let k = i; k <= j; k += 1) depth = Math.max(depth, pointToSegment(simplified[k], simplified[i - 1], simplified[j + 1]));
      if (depth >= minDepth) {
        const mid = simplified[(i + j) >> 1];
        out.push({ index: (i + j) >> 1, angle, sign: sign || 1, point: mid, depth });
      }
    }
    i = j + 1;
  }
  return out;
}

/**
 * Local maxima of a (optionally circular) series that stand out from their
 * neighbouring valleys by at least `prominence`.
 */
export function countLobes(series, { prominence = 0.1, circular = true } = {}) {
  const n = series.length;
  if (n < 8) return 0;
  const at = (i) => series[((i % n) + n) % n];
  const peaks = [];
  const limit = circular ? n : n - 1;
  for (let i = circular ? 0 : 1; i < limit; i += 1) {
    const v = at(i);
    if (v < at(i - 1) || v < at(i + 1)) continue;
    if (v === at(i - 1) && v === at(i + 1)) continue;
    let leftMin = v;
    let rightMin = v;
    for (let s = 1; s < n; s += 1) {
      const l = at(i - s);
      if (l > v) break;
      leftMin = Math.min(leftMin, l);
    }
    for (let s = 1; s < n; s += 1) {
      const r = at(i + s);
      if (r > v) break;
      rightMin = Math.min(rightMin, r);
    }
    const prom = v - Math.max(leftMin, rightMin);
    if (prom >= prominence) peaks.push({ index: i, value: v, prominence: prom });
  }
  const merged = [];
  const minGap = Math.max(2, Math.floor(n / 24));
  for (const p of peaks.sort((a, b) => b.prominence - a.prominence)) {
    if (merged.some((m) => circularGap(m.index, p.index, n) < minGap)) continue;
    merged.push(p);
  }
  return merged.length;
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

/** Median px/ms speed: immune to the single huge dt of a paused pen. */
export function medianSpeed(points) {
  if (points.length < 2) return 0;
  const vs = [];
  for (let i = 1; i < points.length; i += 1) {
    const dt = Math.max(1, (points[i].t ?? i * 8) - (points[i - 1].t ?? (i - 1) * 8));
    vs.push(dist(points[i], points[i - 1]) / dt);
  }
  vs.sort((a, b) => a - b);
  const mid = vs.length >> 1;
  return vs.length % 2 ? vs[mid] : (vs[mid - 1] + vs[mid]) / 2;
}

export function wrapPi(a) {
  let d = a;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

export function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n));
}

export function clamp01(n) {
  return Math.max(0, Math.min(1, Number.isFinite(n) ? n : 0));
}

export function mean(arr) {
  if (!arr.length) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

export function stddev(arr) {
  if (!arr.length) return 0;
  const m = mean(arr);
  return Math.sqrt(arr.reduce((a, b) => a + (b - m) ** 2, 0) / arr.length);
}

function circularGap(a, b, n) {
  const d = Math.abs(a - b);
  return Math.min(d, n - d);
}
