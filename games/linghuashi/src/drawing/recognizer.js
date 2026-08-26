import { clamp, clamp01 } from "./geometry.js";
import { extractFeatures } from "./features.js";

export const TYPES = ["line", "curve", "circle", "zigzag", "spiral", "cloud", "scribble"];

const MIN_POINTS = 6;
const MIN_LENGTH = 28;
// A stroke has to actually look like something to be a spell. Everything the
// six channels can reach scores well above this; a smudge that merely leans
// towards a shape does not, and the game is better for letting it disperse.
const SCRIBBLE_FLOOR = 0.64;
// How much of the winner's confidence the aimlessness evidence can eat.
const CHAOS_WEIGHT = 0.65;
// A straight drag never accumulates a whole revolution of heading change. The
// noisiest synthetic line tops out around 1.0 turns, a crossed-out scrawl that
// happens to drift sideways starts around 1.1.
const TURN_BUDGET = 1.1;

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
  if (f.cornerCount === 0 && f.turnAbsTurns < TURN_BUDGET && (straight || tiny)) {
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

  // Aimlessness is measured on its own terms and billed straight to the board,
  // so a stroke only has to look disordered to lose the benefit of the doubt -
  // it does not have to lose a vote to a rival shape.
  const chaos = scoreScribble(f);
  const trust = coherence * (1 - CHAOS_WEIGHT * chaos);

  const ranked = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const [type, top] = ranked[0];
  const best = top * trust;
  const margin = (top - ranked[1][1]) * trust;
  const precision = clamp(best * (0.78 + 0.22 * clamp01(margin / 0.26)), 0.12, 1);
  scores.scribble = chaos;

  if (best < SCRIBBLE_FLOOR) {
    return { type: "scribble", precision: clamp(precision * 0.55, 0.1, 0.4), ...base, scores };
  }
  return { type, precision, ...base, scores };
}

/**
 * Positive evidence that the pen was wandering rather than drawing.
 *
 * An intended gesture is ordered in one of two ways: it marches down a spine
 * (line, arc, zigzag) or it winds around a centre (circle, spiral, cloud). All
 * six sit at the top of one of those two measures, so failing both at once is
 * a property of scrawl specifically, not of sloppy drawing.
 */
function scoreScribble(f) {
  const aimless = 1 - orderOf(f);
  const tangled = ramp(f.crossings, 0.5, 4);
  const ragged = ramp(f.cornerSpread, 0.3, 0.8);
  return clamp01(0.56 * aimless + 0.3 * tangled + 0.14 * ragged);
}

function orderOf(f) {
  return Math.max(spineOrder(f), spinOrder(f));
}

/** Marches down its own axis instead of doubling back. */
function spineOrder(f) {
  return ramp(f.axisMonotone, 0.35, 0.9);
}

/** Keeps circling the same way instead of reversing around its centre. */
function spinOrder(f) {
  return ramp(f.angularMonotone, 0.68, 0.92);
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
  const raw = 0.3 * flat + 0.22 * tight + 0.22 * direct + 0.26 * plain;
  // One unbroken span, drawn without winding. Straightness alone is fooled by a
  // scrawl that shuttles back and forth while drifting sideways: it hugs its
  // own regression line, but it turns far too much to be a drag.
  return clamp01(raw * spanOf(f) * fall(f.turnAbsTurns, TURN_BUDGET, 2.2));
}

/**
 * How much of the stroke lies in its longest corner-free run. An arc or a drag
 * is a single span (~1); anything chopped into short struts by real corners is
 * something else wearing the same overall lean.
 */
function spanOf(f) {
  return ramp(f.segMedian, 0.3, 0.58);
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
    fall(f.rhythm, 1.2, 2.6) *
    // An arc leans off its chord but still travels from one end to the other.
    spineOrder(f) *
    // It also bends one way, or one way and then back. Corners are the honest
    // measure of that: inflections count the tremor of a shaky hand riding on
    // a perfectly good arc, while corners have already cleared a noise floor.
    fall(f.cornerCount, 2, 6) *
    fall(f.turnAbsTurns, TURN_BUDGET, 2.4) *
    spanOf(f);
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
  return clamp01(raw * (f.circleSweep >= 0.55 ? 1 : 0.4) * spinOrder(f));
}

function scoreZigzag(f) {
  const many = ramp(f.cornerCount, 0.9, 2.8);
  const sharp = ramp(f.cornerAngle, 1.5, 2.25);
  const winding = fall(f.straightness, 0.82, 0.97);
  const raw = 0.3 * many + 0.2 * f.alternation + 0.24 * sharp + 0.14 * f.segRegularity + 0.12 * winding;
  const gate =
    (f.cornerCount >= 2 ? 1 : 0.3) *
    ramp(relief(f), 0.05, 0.11) *
    ramp(f.gap, 0.28, 0.55) *
    // Teeth ride on a spine, they all take turns in opposite directions, they
    // are evenly spaced and they are all equally sharp. A scrawl can fake any
    // one of the four at a time, not the set.
    spineOrder(f) *
    ramp(f.alternation, 0.35, 0.75) *
    ramp(f.segRegularity, 0.5, 0.85) *
    fall(f.cornerSpread, 0.15, 0.45);
  return clamp01(raw * gate);
}

function scoreSpiral(f) {
  const wound = ramp(f.sweepTurns, 1.12, 1.8);
  const grow = ramp(f.spinRatio, 1.4, 2.8);
  const spinning = ramp(f.angularMonotone, 0.7, 0.95);
  const drift = ramp(f.radialMonotone, 0.4, 0.78);
  const smooth = fall(f.cornerCount, 1, 5);
  const raw = 0.3 * wound + 0.24 * grow + 0.2 * spinning + 0.16 * drift + 0.1 * smooth;
  // The eye of a spiral is the radius walking outwards and never back. Without
  // that it is just a loop that wandered, which is where scrawl lands.
  const gate = ramp(f.sweepTurns, 1, 1.4) * spinOrder(f) * ramp(f.radialMonotone, 0.55, 0.78);
  return clamp01(raw * gate);
}

function scoreCloud(f) {
  const bumpy = ramp(f.lobes, 2.2, 4);
  const looped = band(f.circleSweep, 0.55, 0.78, 1.3, 1.8);
  const textured = band(f.radialErr, 0.06, 0.13, 0.34, 0.6);
  const soft = fall(f.cornerAngle, 1.15, 2.1);
  const closedish = fall(f.gapCirc, 0.14, 0.42);
  const raw = 0.3 * bumpy + 0.18 * looped + 0.18 * textured + 0.14 * soft + 0.2 * closedish;
  // A puff is a closed loop that happens to be lumpy. Drop either half - the
  // closure or the single unbroken revolution - and it is just a scrawl with
  // bumps, which is the shape most scribbles land nearest to. Lumpiness itself
  // cannot be demanded: a hand drawn puff is as irregular as the scrawl is.
  const gate =
    (f.lobes >= 3 ? 1 : 0.5) *
    spinOrder(f) *
    fall(f.gapCirc, 0.13, 0.3) *
    fall(f.crossings, 1, 4);
  return clamp01(raw * gate);
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
