import { clamp, clamp01 } from "./geometry.js";
import { extractFeatures } from "./features.js";

export const TYPES = ["line", "curve", "circle", "zigzag", "spiral", "cloud", "scribble"];

const MIN_POINTS = 6;
const MIN_LENGTH = 28;
const SCRIBBLE_FLOOR = 0.46;

export { synthesizeStroke, SYNTH_TYPES } from "./synth.js";

/**
 * Classifies a raw pointer trace into one of TYPES.
 * @param {{x:number,y:number,t?:number}[]} rawPoints
 * @returns {{type:string,precision:number,pressure:number,length:number,bounds:object,raw:array,scores:object}}
 */
export function classifyStroke(rawPoints) {
  const f = extractFeatures(rawPoints);
  const pressure = pressureOf(f.speed);
  const base = { pressure, length: f.length, bounds: f.bounds, raw: f.raw };

  if (!f.ok || f.raw.length < MIN_POINTS || f.length < MIN_LENGTH) {
    return { type: "scribble", precision: 0.15, ...base, scores: {} };
  }

  // A stroke that never leaves its own regression line is a line, full stop.
  // This keeps straight drags - axis aligned ones above all - out of the
  // scoring lottery. The absolute arm covers short strokes, where a couple of
  // pixels of tremor is a large fraction of the length but still not a bend.
  const strayPx = f.perpRatio * f.chord;
  const straight = f.perpRatio <= 0.038 && f.straightness >= 0.965;
  const tiny = strayPx <= 4 && f.straightness >= 0.9;
  if (f.cornerCount === 0 && (straight || tiny)) {
    const purity = clamp01(1 - Math.max(f.perpRatio / 0.038, strayPx / 8));
    return {
      type: "line",
      precision: clamp(0.72 + 0.28 * purity, 0.6, 1),
      ...base,
      scores: { line: 1 },
    };
  }

  const scores = {
    line: scoreLine(f),
    curve: scoreCurve(f),
    circle: scoreCircle(f),
    zigzag: scoreZigzag(f),
    spiral: scoreSpiral(f),
    cloud: scoreCloud(f),
  };

  // Every intended gesture is coherent: it barely crosses itself and its
  // corners are all of a kind. Aimless scribbling fails both, so this scales
  // the whole board down without disturbing the ranking.
  const coherence = fall(f.crossings, 2, 8) * fall(f.cornerSpread, 0.55, 0.95);

  const ranked = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const [type, top] = ranked[0];
  const best = top * coherence;
  const margin = (top - ranked[1][1]) * coherence;
  const precision = clamp(best * (0.8 + 0.2 * clamp01(margin / 0.22)), 0.12, 1);

  if (best < SCRIBBLE_FLOOR) {
    return { type: "scribble", precision: clamp(precision * 0.55, 0.1, 0.4), ...base, scores };
  }
  return { type, precision, ...base, scores };
}

/**
 * Stateful wrapper. `consume` may be fed points one at a time while drawing;
 * `finalize` still accepts an explicit array for pure/unit-test usage.
 */
export function createStrokeRecognizer() {
  let buffer = [];
  return {
    consume(input) {
      if (!input) return;
      if (Array.isArray(input)) buffer = buffer.concat(input);
      else buffer.push(input);
    },
    reset() {
      buffer = [];
    },
    peek() {
      return buffer.slice();
    },
    finalize(points) {
      const src = points && points.length ? points : buffer;
      const result = classifyStroke(src);
      buffer = [];
      return result;
    },
  };
}

/**
 * 提按: a slow pen presses, a fast one lifts. Median speed so a single stalled
 * sample cannot spike it. The knee sits at 0.85 px/ms, roughly the pace of a
 * deliberate stroke, so the whole 0.15..1 range is actually reachable.
 */
function pressureOf(speed) {
  if (!(speed > 0)) return 0.95;
  return clamp(1 / (1 + (speed / 0.85) ** 1.15), 0.15, 1);
}

/**
 * Deviations of a couple of pixels are pointer noise whatever the stroke size,
 * so shape ratios are faded out below an absolute floor. Without this a 40px
 * flick with 3px of tremor scores as bent as a deliberate arc.
 */
const NOISE_PX = 4;

function withPixelFloor(ratio, pixels) {
  return ratio * ramp(pixels, NOISE_PX, NOISE_PX * 2.4);
}

/** Amplitude of any structure riding on the stroke, at any frequency, in px. */
function reliefPx(f) {
  const bowPx = Number.isFinite(f.bendPx) ? f.bendPx : 0;
  return Math.max(bowPx, f.waviness * f.scale * 1.6);
}

function relief(f) {
  const px = reliefPx(f);
  return withPixelFloor(px / f.scale, px);
}

function bendOf(f) {
  return withPixelFloor(f.bend, f.bendPx);
}

function scoreLine(f) {
  const flat = fall(bendOf(f), 0.04, 0.12);
  const tight = fall(withPixelFloor(f.perpRatio, f.perpRatio * f.chord), 0.03, 0.12);
  const direct = ramp(f.straightness, 0.86, 0.98);
  const plain = fall(relief(f), 0.04, 0.13);
  return clamp01(0.3 * flat + 0.22 * tight + 0.22 * direct + 0.26 * plain);
}

/**
 * "Curve" covers every open stroke that bends smoothly: a single arc, an S, or
 * a rolling wave. What it must not contain is a sharp reversal (that is zigzag)
 * or a full winding (that is circle/spiral).
 */
function scoreCurve(f) {
  const bend = bendOf(f);
  const bowed = band(bend, 0.035, 0.09, 0.95, 1.7);
  const open = ramp(f.gap, 0.28, 0.6);
  const flowing = fall(f.cornerAngle, 1.7, 2.4);
  const plain = fall(f.cornerCount, 1, 5);
  const formed = ramp(f.bendFit, 0.88, 0.97);
  const loose = fall(f.turnAbsTurns, 1.2, 2.6);
  const raw = 0.2 * bowed + 0.14 * open + 0.2 * flowing + 0.16 * plain + 0.16 * formed + 0.14 * loose;
  const gate =
    ramp(bend, 0.05, 0.095) *
    ramp(f.gap, 0.2, 0.45) *
    fall(f.sweepTurns, 1.05, 1.5) *
    fall(f.rhythm, 1.2, 2.6);
  return clamp01(raw * gate);
}

function scoreCircle(f) {
  const round = fall(f.radialErr, 0.07, 0.26);
  const closed = fall(f.gapCirc, 0.1, 0.34);
  const oneTurn = band(f.circleSweep, 0.62, 0.82, 1.2, 1.6);
  const smooth = fall(f.cornerCount, 0, 3);
  const even = fall(f.lobes, 1, 3);
  const steady = fall(f.radiusRatio, 1.35, 2.5);
  const raw = 0.28 * round + 0.22 * closed + 0.24 * oneTurn + 0.08 * smooth + 0.09 * even + 0.09 * steady;
  return clamp01(raw * (f.circleSweep >= 0.55 ? 1 : 0.4));
}

function scoreZigzag(f) {
  const many = ramp(f.cornerCount, 0.9, 2.8);
  const sharp = ramp(f.cornerAngle, 1.5, 2.25);
  const winding = fall(f.straightness, 0.82, 0.97);
  const raw = 0.3 * many + 0.2 * f.alternation + 0.24 * sharp + 0.14 * f.segRegularity + 0.12 * winding;
  const gate = (f.cornerCount >= 2 ? 1 : 0.3) * ramp(relief(f), 0.05, 0.11) * ramp(f.gap, 0.28, 0.55);
  return clamp01(raw * gate);
}

function scoreSpiral(f) {
  const wound = ramp(f.sweepTurns, 1.12, 1.8);
  const grow = ramp(f.spinRatio, 1.4, 2.8);
  const spinning = ramp(f.angularMonotone, 0.7, 0.95);
  const drift = ramp(f.radialMonotone, 0.4, 0.78);
  const smooth = fall(f.cornerCount, 1, 5);
  const raw = 0.3 * wound + 0.24 * grow + 0.2 * spinning + 0.16 * drift + 0.1 * smooth;
  return clamp01(raw * (f.sweepTurns >= 1.05 ? 1 : 0.45));
}

function scoreCloud(f) {
  const bumpy = ramp(f.lobes, 2.2, 4);
  const looped = band(f.circleSweep, 0.45, 0.72, 1.35, 1.95);
  const textured = band(f.radialErr, 0.06, 0.13, 0.34, 0.6);
  const soft = fall(f.cornerAngle, 1.15, 2.1);
  const closedish = fall(f.gapCirc, 0.14, 0.42);
  const raw = 0.3 * bumpy + 0.18 * looped + 0.18 * textured + 0.14 * soft + 0.2 * closedish;
  return clamp01(raw * (f.lobes >= 3 ? 1 : 0.5));
}

function ramp(v, lo, hi) {
  if (hi === lo) return v >= hi ? 1 : 0;
  return clamp01((v - lo) / (hi - lo));
}

function fall(v, lo, hi) {
  return 1 - ramp(v, lo, hi);
}

/** Trapezoid: rises over [a,b], flat to c, falls to zero at d. */
function band(v, a, b, c, d) {
  return Math.min(ramp(v, a, b), fall(v, c, d));
}
