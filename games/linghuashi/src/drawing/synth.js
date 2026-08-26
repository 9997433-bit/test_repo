/**
 * Deterministic reference trajectories for the six recognised gestures.
 * Used by the recogniser to build its templates and by tests/tools that need
 * a "textbook" stroke without a real pointer device.
 */

const TAU = Math.PI * 2;

const DEFAULTS = {
  cx: 160,
  cy: 160,
  size: 140,
  rotation: 0,
  count: 0,
  dt: 14,
  noise: 0,
  wobble: 0,
  seed: 1,
};

export const SYNTH_TYPES = ["line", "curve", "circle", "zigzag", "spiral", "cloud", "scribble"];

/**
 * @param {string} type one of SYNTH_TYPES
 * @param {object} [options] cx, cy, size, rotation (rad), count, dt (ms/sample),
 *   noise (fraction of size), wobble (fraction of size), seed, plus per-type
 *   knobs: teeth, turns, lobes, sweep, bulge, gap, decay.
 * @returns {{x:number,y:number,t:number}[]}
 */
export function synthesizeStroke(type, options = {}) {
  const o = { ...DEFAULTS, ...options };
  const rng = mulberry32(o.seed >>> 0 || 1);
  const build = BUILDERS[type] || BUILDERS.scribble;
  const local = build(o, rng);
  const cos = Math.cos(o.rotation);
  const sin = Math.sin(o.rotation);
  const noise = o.noise * o.size;
  const wobble = o.wobble * o.size;
  const phase = rng() * TAU;
  const out = [];
  for (let i = 0; i < local.length; i += 1) {
    const p = local[i];
    let x = p.x;
    let y = p.y;
    if (wobble > 0) {
      const u = i / Math.max(1, local.length - 1);
      x += Math.sin(u * 9.3 + phase) * wobble;
      y += Math.cos(u * 7.7 + phase * 1.7) * wobble;
    }
    const rx = x * cos - y * sin;
    const ry = x * sin + y * cos;
    out.push({
      x: o.cx + rx + (noise ? gauss(rng) * noise : 0),
      y: o.cy + ry + (noise ? gauss(rng) * noise : 0),
      t: Math.round(i * o.dt),
    });
  }
  return out;
}

const BUILDERS = {
  line(o) {
    const n = o.count || 40;
    const half = o.size / 2;
    return series(n, (u) => ({ x: -half + o.size * u, y: 0 }));
  },

  curve(o) {
    const n = o.count || 48;
    const sweep = o.sweep ?? Math.PI * 0.62;
    const bulge = o.bulge ?? 1;
    const r = o.size / (2 * Math.sin(sweep / 2) || 1);
    return series(n, (u) => {
      const a = -sweep / 2 + sweep * u;
      return { x: r * Math.sin(a), y: bulge * r * (Math.cos(a) - Math.cos(sweep / 2)) };
    });
  },

  circle(o) {
    const n = o.count || 72;
    const r = o.size / 2;
    const gap = o.gap ?? 0.04;
    return series(n, (u) => {
      const a = -Math.PI / 2 + TAU * (1 - gap) * u;
      return { x: r * Math.cos(a), y: r * Math.sin(a) };
    });
  },

  zigzag(o) {
    const teeth = Math.max(2, o.teeth ?? 5);
    const amp = (o.amplitude ?? 0.34) * o.size;
    const per = Math.max(3, Math.round((o.count || 60) / teeth));
    const half = o.size / 2;
    const nodes = [];
    for (let k = 0; k <= teeth; k += 1) {
      nodes.push({ x: -half + (o.size * k) / teeth, y: k % 2 ? amp : -amp });
    }
    return polyline(nodes, per);
  },

  spiral(o) {
    const turns = o.turns ?? 2.4;
    const n = o.count || Math.round(36 * turns);
    const rMax = o.size / 2;
    const rMin = rMax * (o.decay ?? 0.12);
    return series(n, (u) => {
      const a = TAU * turns * u;
      const r = rMin + (rMax - rMin) * u;
      return { x: r * Math.cos(a), y: r * Math.sin(a) };
    });
  },

  cloud(o) {
    const lobes = Math.max(3, o.lobes ?? 4);
    const n = o.count || 96;
    const r0 = o.size / 2.4;
    const amp = (o.amplitude ?? 0.34) * r0;
    const gap = o.gap ?? 0.03;
    return series(n, (u) => {
      const a = -Math.PI / 2 + TAU * (1 - gap) * u;
      const r = r0 + amp * Math.cos(lobes * a);
      return { x: r * Math.cos(a), y: r * Math.sin(a) * 0.82 };
    });
  },

  scribble(o, rng) {
    const n = o.count || 34;
    const step = o.size / 12;
    const pts = [];
    let x = 0;
    let y = 0;
    let dir = rng() * TAU;
    for (let i = 0; i < n; i += 1) {
      dir += (rng() - 0.5) * 3.4;
      x += Math.cos(dir) * step;
      y += Math.sin(dir) * step;
      pts.push({ x, y });
    }
    return pts;
  },
};

function series(n, fn) {
  const out = [];
  const last = Math.max(1, n - 1);
  for (let i = 0; i < n; i += 1) out.push(fn(i / last));
  return out;
}

function polyline(nodes, perSegment) {
  const out = [];
  for (let k = 1; k < nodes.length; k += 1) {
    const a = nodes[k - 1];
    const b = nodes[k];
    const steps = k === nodes.length - 1 ? perSegment : perSegment - 1;
    for (let s = 0; s <= steps; s += 1) {
      const u = s / perSegment;
      out.push({ x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u });
    }
  }
  return out;
}

function gauss(rng) {
  let u = 0;
  let v = 0;
  while (u === 0) u = rng();
  while (v === 0) v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(TAU * v) * 0.4;
}

export function mulberry32(a) {
  let s = a >>> 0;
  return function next() {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
