import {
  boundsOf,
  boxSmooth,
  clamp,
  clamp01,
  cornersOf,
  dist,
  fitCircle,
  lineFit,
  mean,
  medianSpeed,
  polylineLength,
  resample,
  sanitize,
  simplify,
  stddev,
  trimHooks,
  turnSeries,
  unwrapAngles,
  whiten,
  wrapPi,
} from "./geometry.js";

const TAU = Math.PI * 2;
const N_SHAPE = 96;
const N_DETAIL = 128;
const SHAPE_WINDOW = 5; // +/- samples of the 96 point curve, ~10% of arc length

/**
 * Turns a raw pointer trace into scale/rotation independent descriptors.
 *
 * Three working resolutions are kept on purpose:
 *  - `shape`  low-passed, for global geometry (straightness, bow, circularity)
 *  - `dense`  full detail, for corner structure (a fast zigzag must survive)
 *  - `raw`    untouched, for timing/pressure
 */
export function extractFeatures(rawPoints) {
  const raw = sanitize(rawPoints);
  const length = polylineLength(raw);
  const bounds = boundsOf(raw);
  const diag = Math.hypot(bounds.w, bounds.h);
  const base = { raw, length, bounds, diag, speed: medianSpeed(raw) };
  if (raw.length < 4 || length < 1) return { ...base, ok: false };

  const scale = Math.max(diag, 1);
  const body = trimHooks(resample(raw, clamp(Math.round(length / 3), N_SHAPE, 320)), scale);
  const dense = body;
  const shape = boxSmooth(resample(body, N_SHAPE), SHAPE_WINDOW);
  const detail = boxSmooth(resample(body, N_DETAIL), 2);
  const path = polylineLength(shape);

  const first = shape[0];
  const last = shape[shape.length - 1];
  const chord = dist(first, last);
  const straightness = path > 0 ? clamp01(chord / path) : 0;
  const gap = chord / scale; // ~0 for a closed loop, ~1 for an open sweep

  const lf = lineFit(shape);
  const perpRatio = clamp(lf.maxPerp / Math.max(chord, 1), 0, 4);
  // Net advance along the stroke's own principal axis, as a fraction of the
  // travel along it. A line, an arc or a zigzag all march down their spine and
  // sit at ~1; a loop folds back and sits low; an aimless scrawl also sits low,
  // which is what separates it from the first group.
  const axisMonotone = axisProgress(shape, lf.ux, lf.uy);
  // Below this the stroke is effectively closed and chord-relative shape
  // measures stop meaning anything, so bendProfile returns its sentinel.
  const chordUsable = chord >= 0.08 * scale;
  const bend = bendProfile(shape, first, last, chordUsable ? chord : 0);

  const turns = turnSeries(shape);
  let turnTotal = 0;
  let turnAbs = 0;
  for (const d of turns) {
    turnTotal += d;
    turnAbs += Math.abs(d);
  }

  // Roundness must be read at detail resolution: the low-pass that stabilises
  // straightness would iron a seven bump cloud back into a circle. Whitening
  // first stops a leaning oval from being scored as a lumpy cloud.
  const round = whiten(detail, 2);
  const circle = fitCircle(round);
  const radialErr = circle.r > 1 ? circle.rmsRadial / circle.r : 1;
  const circleAng = unwrapAngles(round, circle.cx, circle.cy);
  const circleSweep = Math.abs(circleAng[circleAng.length - 1] - circleAng[0]) / TAU;
  const gapCirc = dist(round[0], round[round.length - 1]) / Math.max(TAU * circle.r, 1);

  const circleRadii = circle.radii;
  const rMean = mean(circleRadii) || 1;
  const radiusRatio = (Math.max(...circleRadii) + rMean * 0.05) / (Math.min(...circleRadii) + rMean * 0.05);
  const lobes = countRadialLobes(circleRadii, rMean, gapCirc < 0.22);

  const spin = bestSpin(shape, [
    { x: circle.cx, y: circle.cy },
    centroidOf(shape),
    { x: bounds.minX + bounds.w / 2, y: bounds.minY + bounds.h / 2 },
  ]);
  const radialMonotone = monotoneFraction(spin.radii);
  const spinRatio = (Math.max(...spin.radii) + 1) / (Math.min(...spin.radii) + 1);

  // Absolute floors matter on short strokes: below a few pixels a "corner" is
  // pointer noise, no matter how large it looks next to a 40px flick.
  const tol = Math.max(2.5, 0.026 * scale);
  const simplified = simplify(dense, tol);
  const corners = cornersOf(simplified, 0.85, Math.max(6, 0.07 * scale), Math.max(4.5, 0.045 * scale));
  // Distance from corner to corner, endpoints included.
  const struts = segmentLengths([simplified[0], ...corners.map((c) => c.point), simplified[simplified.length - 1]]);
  const alternation = alternationOf(corners);
  const segRegularity = struts.length > 1 ? clamp01(1 - stddev(struts) / (mean(struts) || 1)) : 0;

  return {
    ...base,
    ok: true,
    shape,
    detail,
    dense,
    simplified,
    path,
    scale,
    chord,
    straightness,
    gap,
    perpRatio,
    axisMonotone,
    bow: bend.bow,
    bowMax: bend.bowMax,
    bendAmp: bend.amp,
    bendFit: bend.fit,
    bend: bend.amp * bend.fit,
    // How far the stroke actually leaves its chord, in pixels, one sided. The
    // peak-to-peak amplitude doubles a symmetric tremor, so it is the wrong
    // thing to compare against an absolute noise floor. Infinite when the
    // stroke is closed and the chord carries no information.
    bendPx: chordUsable ? bend.bowMax * chord : Infinity,
    waviness: waviness(dense, scale),
    turnTotal,
    turnAbs,
    turnAbsTurns: turnAbs / TAU,
    netTurns: turnTotal / TAU,
    radialErr,
    radius: circle.r,
    circleSweep,
    gapCirc,
    sweepTurns: Math.abs(spin.sweep) / TAU,
    angularMonotone: spin.monotone,
    radiusRatio,
    spinRatio,
    radialMonotone,
    lobes,
    cornerCount: corners.length,
    cornerAngle: corners.length ? mean(corners.map((c) => c.angle)) : 0,
    alternation,
    segRegularity,
    // How strongly the stroke reads as a repeating beat rather than one gesture.
    rhythm: alternation * corners.length * segRegularity,
    cornerSpread: corners.length > 1 ? stddev(corners.map((c) => c.angle)) : 0,
    crossings: countCrossings(simplified),
    segMedian: struts.length ? median(struts) / scale : 0,
    vertexCount: simplified.length,
    inflections: countInflections(turns),
  };
}

/**
 * Signed offset from the start->end chord, described by how much of it lives in
 * the first two bending modes (a C shape and an S shape).
 *
 * Amplitude alone cannot tell a shallow arc from a jittery line: both sit a few
 * percent off the chord. The mode fit can - an arc's offset profile is a clean
 * hump, tremor's is not - so `amp * fit` is the honest "how bent is this".
 */
function bendProfile(points, first, last, chord) {
  if (chord < 1) return { bow: 2, bowMax: 2, amp: 2, fit: 1 };
  const n = points.length;
  const ux = (last.x - first.x) / chord;
  const uy = (last.y - first.y) / chord;
  const d = new Float64Array(n);
  let sum = 0;
  let maxPos = 0;
  let maxNeg = 0;
  let maxAbs = 0;
  for (let i = 0; i < n; i += 1) {
    const v = (points[i].x - first.x) * -uy + (points[i].y - first.y) * ux;
    d[i] = v;
    sum += v;
    if (v > maxPos) maxPos = v;
    if (v < maxNeg) maxNeg = v;
    maxAbs = Math.max(maxAbs, Math.abs(v));
  }
  const dMean = sum / n;
  let dd = 0;
  let c1 = 0;
  let c2 = 0;
  let m1m1 = 0;
  let m2m2 = 0;
  for (let i = 0; i < n; i += 1) {
    const u = i / (n - 1);
    const m1 = u * (1 - u) - 1 / 6; // zero mean C mode
    const m2 = u * (1 - u) * (2 * u - 1); // already zero mean S mode
    const dc = d[i] - dMean;
    dd += dc * dc;
    c1 += dc * m1;
    c2 += dc * m2;
    m1m1 += m1 * m1;
    m2m2 += m2 * m2;
  }
  const fit = dd > 1e-9 ? Math.sqrt(clamp01((c1 * c1) / (dd * m1m1 || 1) + (c2 * c2) / (dd * m2m2 || 1))) : 0;
  return {
    bow: Math.abs(dMean) / chord,
    bowMax: maxAbs / chord,
    amp: (maxPos - maxNeg) / chord,
    fit,
  };
}

/** Signed travel along a unit direction, netted against the distance covered. */
function axisProgress(points, ux, uy) {
  let net = 0;
  let total = 0;
  let prev = points[0].x * ux + points[0].y * uy;
  for (let i = 1; i < points.length; i += 1) {
    const cur = points[i].x * ux + points[i].y * uy;
    net += cur - prev;
    total += Math.abs(cur - prev);
    prev = cur;
  }
  return total > 1e-9 ? Math.abs(net) / total : 0;
}

/** How far the stroke rides off its own low-passed spine: catches fast teeth. */
function waviness(dense, scale) {
  const half = Math.max(2, Math.round(dense.length / 22));
  const spine = boxSmooth(dense, half);
  let acc = 0;
  for (let i = 0; i < dense.length; i += 1) {
    acc += (dense[i].x - spine[i].x) ** 2 + (dense[i].y - spine[i].y) ** 2;
  }
  return Math.sqrt(acc / dense.length) / scale;
}

/**
 * Polar sweep depends on which point you call the centre; a spiral only unwraps
 * cleanly around its own eye. Try a few candidates, keep the most coherent.
 */
function bestSpin(points, candidates) {
  let best = null;
  for (const c of candidates) {
    if (!Number.isFinite(c.x) || !Number.isFinite(c.y)) continue;
    const ang = unwrapAngles(points, c.x, c.y);
    const sweep = ang[ang.length - 1] - ang[0];
    let pos = 0;
    let neg = 0;
    for (let i = 1; i < ang.length; i += 1) {
      const d = ang[i] - ang[i - 1];
      if (d > 0) pos += d;
      else neg -= d;
    }
    const monotone = pos + neg > 1e-6 ? Math.max(pos, neg) / (pos + neg) : 0;
    const radii = points.map((p) => Math.hypot(p.x - c.x, p.y - c.y));
    const score = Math.abs(sweep) * (0.4 + 0.6 * monotone);
    if (!best || score > best.score) best = { score, sweep, monotone, radii, center: c };
  }
  if (best) return best;
  return { score: 0, sweep: 0, monotone: 0, radii: points.map(() => 0), center: { x: 0, y: 0 } };
}

function centroidOf(points) {
  let x = 0;
  let y = 0;
  for (const p of points) {
    x += p.x;
    y += p.y;
  }
  return { x: x / points.length, y: y / points.length };
}

function monotoneFraction(arr) {
  let up = 0;
  let down = 0;
  for (let i = 1; i < arr.length; i += 1) {
    const d = arr[i] - arr[i - 1];
    if (d > 0) up += d;
    else down -= d;
  }
  if (up + down < 1e-6) return 0;
  return Math.max(up, down) / (up + down);
}

/**
 * Cloud lobes: prominent local maxima of the radial profile. A circle has none
 * that survive the prominence gate, a four-bump cloud has four.
 */
function countRadialLobes(radii, rMean, circular) {
  const n = radii.length;
  if (n < 12) return 0;
  const prominence = Math.max(0.1 * rMean, 1.2);
  const at = (i) => (circular ? radii[((i % n) + n) % n] : radii[clamp(i, 0, n - 1)]);
  const peaks = [];
  const lo = circular ? 0 : 2;
  const hi = circular ? n : n - 2;
  for (let i = lo; i < hi; i += 1) {
    const v = at(i);
    if (v < at(i - 1) || v <= at(i + 1)) continue;
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
    if (v - Math.max(leftMin, rightMin) >= prominence) {
      peaks.push({ index: i, prominence: v - Math.max(leftMin, rightMin) });
    }
  }
  const minGap = Math.max(3, Math.floor(n / 20));
  const kept = [];
  for (const p of peaks.sort((a, b) => b.prominence - a.prominence)) {
    const clash = kept.some((k) => {
      const d = Math.abs(k.index - p.index);
      return (circular ? Math.min(d, n - d) : d) < minGap;
    });
    if (!clash) kept.push(p);
  }
  return kept.length;
}

/**
 * Self intersections of the simplified outline. Every intended gesture here
 * crosses itself at most once or twice; aimless scribbling crosses constantly.
 */
function countCrossings(poly) {
  const n = poly.length;
  if (n < 5) return 0;
  let count = 0;
  for (let i = 0; i + 1 < n; i += 1) {
    for (let j = i + 2; j + 1 < n; j += 1) {
      if (i === 0 && j + 1 === n - 1) continue; // shared endpoint of a closed loop
      if (segmentsCross(poly[i], poly[i + 1], poly[j], poly[j + 1])) count += 1;
      if (count > 40) return count;
    }
  }
  return count;
}

function segmentsCross(a, b, c, d) {
  const d1 = side(c, d, a);
  const d2 = side(c, d, b);
  const d3 = side(a, b, c);
  const d4 = side(a, b, d);
  return ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0));
}

function side(a, b, p) {
  return (b.x - a.x) * (p.y - a.y) - (b.y - a.y) * (p.x - a.x);
}

function alternationOf(corners) {
  if (corners.length < 2) return 0;
  let flips = 0;
  for (let i = 1; i < corners.length; i += 1) if (corners[i].sign !== corners[i - 1].sign) flips += 1;
  return flips / (corners.length - 1);
}

function segmentLengths(points) {
  const out = [];
  for (let i = 1; i < points.length; i += 1) out.push(dist(points[i - 1], points[i]));
  return out;
}

function median(arr) {
  const s = arr.slice().sort((a, b) => a - b);
  const mid = s.length >> 1;
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

/** Sign flips of curvature, ignoring near-straight noise. */
function countInflections(turns) {
  let sign = 0;
  let flips = 0;
  let run = 0;
  for (const d of turns) {
    if (Math.abs(d) < 0.06) continue;
    const s = d > 0 ? 1 : -1;
    if (s === sign) {
      run += 1;
      continue;
    }
    if (sign !== 0 && run >= 2) flips += 1;
    sign = s;
    run = 1;
  }
  return flips;
}
