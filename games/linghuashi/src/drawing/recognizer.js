import {
  angles,
  boundsOf,
  circleFit,
  meanSpeed,
  polylineLength,
  r2Line,
  resample,
  turningNumber,
} from "./geometry.js";

const TYPES = ["line", "curve", "circle", "zigzag", "spiral", "cloud", "scribble"];

export function classifyStroke(rawPoints) {
  const points = resample(rawPoints, 64);
  const length = polylineLength(rawPoints);
  const bounds = boundsOf(rawPoints);
  const pressure = Math.max(0.15, Math.min(1, 0.25 / (meanSpeed(rawPoints) * 8 + 0.08)));
  if (rawPoints.length < 6 || length < 28) {
    return pack("scribble", 0.15, pressure, length, bounds, rawPoints);
  }

  const lineScore = scoreLine(points, length, bounds);
  const circleScore = scoreCircle(points);
  const zigzagScore = scoreZigzag(points);
  const spiralScore = scoreSpiral(points, bounds);
  const cloudScore = scoreCloud(points, bounds);
  const curveScore = scoreCurve(points, lineScore, circleScore);

  const ranked = [
    ["line", lineScore],
    ["circle", circleScore],
    ["zigzag", zigzagScore],
    ["spiral", spiralScore],
    ["cloud", cloudScore],
    ["curve", curveScore],
  ].sort((a, b) => b[1] - a[1]);

  const [type, best] = ranked[0];
  const second = ranked[1][1];
  const precision = Math.max(0.12, Math.min(1, best * (0.72 + 0.28 * (best - second + 0.2))));
  if (best < 0.42) return pack("scribble", precision * 0.5, pressure, length, bounds, rawPoints);
  return pack(type, precision, pressure, length, bounds, rawPoints);
}

export function createStrokeRecognizer() {
  return {
    consume() {},
    finalize(points) {
      return classifyStroke(points);
    },
  };
}

export { TYPES };

function pack(type, precision, pressure, length, bounds, raw) {
  return { type, precision, pressure, length, bounds, raw };
}

function scoreLine(points, length, bounds) {
  const r2 = r2Line(points);
  const aspect = Math.max(bounds.w, bounds.h) / (Math.min(bounds.w, bounds.h) + 8);
  const span = Math.hypot(bounds.w, bounds.h);
  return clamp01(r2 * 0.75 + Math.min(1, aspect / 4) * 0.15 + Math.min(1, length / (span + 1)) * 0.1);
}

function scoreCircle(points) {
  const fit = circleFit(points);
  const turn = Math.abs(Math.abs(turningNumber(points)) - 1);
  return clamp01(fit.circularity * 0.5 + fit.closure * 0.35 + (1 - Math.min(1, turn)) * 0.15);
}

function scoreZigzag(points) {
  const angs = angles(points);
  const sharp = angs.filter((a) => a > 0.7).length;
  const reversals = countReversals(points);
  const line = r2Line(points);
  return clamp01((sharp / 18) * 0.45 + (reversals / 8) * 0.4 + (1 - line) * 0.15);
}

function scoreSpiral(points, bounds) {
  const turn = Math.abs(turningNumber(points));
  const fit = circleFit(points);
  const growth = radialGrowth(points);
  const size = Math.max(bounds.w, bounds.h);
  return clamp01((Math.min(turn, 3) / 3) * 0.45 + growth * 0.35 + (1 - fit.circularity) * 0.1 + Math.min(1, size / 160) * 0.1);
}

function scoreCloud(points, bounds) {
  const angs = angles(points);
  const wobble = angs.filter((a) => a > 0.35 && a < 1.4).length / (angs.length || 1);
  const fit = circleFit(points);
  const blob = Math.min(bounds.w, bounds.h) / (Math.max(bounds.w, bounds.h) + 1);
  return clamp01(wobble * 0.4 + fit.closure * 0.2 + blob * 0.25 + (1 - r2Line(points)) * 0.15);
}

function scoreCurve(points, lineScore, circleScore) {
  const angs = angles(points);
  const mean = angs.reduce((a, b) => a + b, 0) / (angs.length || 1);
  const smooth = 1 - Math.min(1, variance(angs) / 0.8);
  return clamp01(smooth * 0.5 + Math.min(1, mean * 2) * 0.3 + (1 - lineScore) * 0.1 + (1 - circleScore) * 0.1);
}

function countReversals(points) {
  let n = 0;
  let prev = 0;
  for (let i = 1; i < points.length; i += 1) {
    const dx = points[i].x - points[i - 1].x;
    const dy = points[i].y - points[i - 1].y;
    const dir = Math.atan2(dy, dx);
    if (i > 1) {
      let d = dir - prev;
      while (d > Math.PI) d -= Math.PI * 2;
      while (d < -Math.PI) d += Math.PI * 2;
      if (Math.abs(d) > 0.95) n += 1;
    }
    prev = dir;
  }
  return n;
}

function radialGrowth(points) {
  const c = { x: points[0].x, y: points[0].y };
  const rs = points.map((p) => Math.hypot(p.x - c.x, p.y - c.y));
  let up = 0;
  for (let i = 1; i < rs.length; i += 1) if (rs[i] > rs[i - 1]) up += 1;
  return up / (rs.length - 1);
}

function variance(arr) {
  if (!arr.length) return 0;
  const m = arr.reduce((a, b) => a + b, 0) / arr.length;
  return arr.reduce((a, b) => a + (b - m) ** 2, 0) / arr.length;
}

function clamp01(n) {
  return Math.max(0, Math.min(1, n));
}
