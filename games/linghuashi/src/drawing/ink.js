import { clamp, clamp01 } from "./geometry.js";

/**
 * Brush model for 焦墨飞白: a variable width ribbon split into bristles.
 *
 * Width follows 提按 - the pen presses on the slow parts of a gesture and lifts
 * on the fast ones, with a taper at both ends. Coverage follows the ink load:
 * as the brush dries or accelerates, individual bristles start skipping and the
 * paper shows through as 飞白 streaks instead of the whole stroke fading grey.
 */

const DEFAULTS = {
  color: "#1a120b",
  width: 10,
  minWidth: 1.2,
  pressure: 0.5,
  alpha: 0.96,
  speedLift: 5, // px/ms at which the pen counts as fully lifted
  reload: 2600, // px of travel before the brush runs dry
  bleed: true,
  seed: 1,
};

export function createInkBrush(ctx, brushOptions = {}) {
  const base = { ...DEFAULTS, ...brushOptions };
  let s = null;

  function begin(options = {}) {
    const o = { ...base, ...options };
    s = {
      o,
      rgb: parseColor(o.color),
      ribs: [], // pending cross sections, emitted one behind the pen
      prev: null,
      speed: 0,
      travel: 0,
      phase: (hash01(o.seed ?? 1) * 2 - 1) * Math.PI,
      bristles: bristleLayout(o.width * clamp01(o.pressure) + o.minWidth, o.seed ?? 1),
      ended: false,
    };
    return s;
  }

  function extend(point) {
    if (!s || s.ended || !finitePoint(point)) return;
    const p = { x: point.x, y: point.y, t: Number.isFinite(point.t) ? point.t : (s.prev?.t ?? 0) + 16 };
    if (!s.prev) {
      s.prev = p;
      return;
    }
    const step = Math.hypot(p.x - s.prev.x, p.y - s.prev.y);
    if (step < 0.05) return;
    const dt = Math.max(1, p.t - s.prev.t);
    // Heavy smoothing on speed: raw per-sample speed is far too spiky to drive
    // a stroke width without the line looking like a string of beads.
    s.speed = s.speed * 0.72 + (step / dt) * 0.28;
    s.travel += step;
    pushRib(s, p, widthAt(s, s.travel, s.speed), s.speed);
    flush(ctx, s, false);
    s.prev = p;
  }

  /** 收笔: the tail thins to a point over the last few pixels. */
  function end() {
    if (!s || s.ended) return;
    s.ended = true;
    const tip = s.ribs[s.ribs.length - 1];
    if (!tip || s.travel < 2) {
      flush(ctx, s, true);
      s = null;
      return;
    }
    const tailLen = clamp(s.o.width * 1.3, 4, 15);
    const dir = s.lastDir || { x: 1, y: 0 };
    for (let i = 1; i <= 4; i += 1) {
      const u = i / 4;
      pushRib(
        s,
        { x: tip.p.x + dir.x * tailLen * u, y: tip.p.y + dir.y * tailLen * u },
        Math.max(0.25, tip.w * (1 - u) ** 1.3),
        s.speed,
      );
    }
    flush(ctx, s, true);
    s = null;
  }

  return {
    begin,
    extend,
    end,

    /** One-shot: paint an entire polyline. Kept for non-interactive callers. */
    stroke(points, options = {}) {
      if (!Array.isArray(points) || points.length < 2) return;
      begin(options);
      for (const p of points) extend(p);
      if (options.taper === false) {
        s = null;
      } else {
        end();
      }
    },

    /**
     * Ink diffusing into the paper. Multiply keeps it subtractive, so repeated
     * blooms deepen the tone instead of stacking a grey film over the page, and
     * the alpha ramp is squared so there is no visible disc edge.
     */
    bloom(x, y, color = base.color, radius = 28, options = {}) {
      if (!Number.isFinite(x) || !Number.isFinite(y)) return;
      const r = clamp(Number(radius) || 0, 2, 220);
      const rgb = parseColor(color);
      const strength = clamp(options.strength ?? rgb.a * 0.55, 0, 0.7);
      if (strength <= 0.001) return;
      ctx.save();
      ctx.globalCompositeOperation = options.composite ?? "multiply";
      // Three offset pools rather than one perfect disc: ink wicks along the
      // fibres of the paper, it does not land as a circle.
      const pools = options.pools ?? 3;
      for (let i = 0; i < pools; i += 1) {
        const j = hash01(i * 97 + Math.round(x) * 31 + Math.round(y) * 7 + (options.seed ?? 0));
        const k = hash01(i * 131 + Math.round(y) * 17 + (options.seed ?? 0) * 3);
        const rr = r * (0.62 + 0.42 * j);
        const cx = x + (k - 0.5) * r * 0.3;
        const cy = y + (j - 0.5) * r * 0.3;
        const g = ctx.createRadialGradient(cx, cy, Math.min(1.5, rr * 0.1), cx, cy, rr);
        const peak = (strength / pools) * 2.1;
        // Squared-exponential falloff taken all the way to zero at the rim.
        // A linear stop leaves a visible disc edge, which is what turns a
        // bloom into a smudge once a few of them overlap.
        for (let stop = 0; stop <= 8; stop += 1) {
          const u = stop / 8;
          g.addColorStop(u, rgba(rgb, peak * Math.exp(-2.1 * u * u) * (1 - u) ** 0.7));
        }
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(cx, cy, rr, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    },
  };
}

/** 提按 curve: press on the slow strokes, lift on the fast ones. */
function widthAt(s, travel, speed) {
  const o = s.o;
  const press = clamp01(o.pressure);
  const full = o.minWidth + o.width * (0.35 + 0.65 * press);
  const lift = 1 / (1 + (speed / o.speedLift) ** 1.5);
  const entry = clamp01(travel / Math.max(4, o.width * 0.9)) ** 0.6;
  const swell = 1 + 0.14 * Math.sin(travel / 34 + s.phase) + 0.07 * Math.sin(travel / 11.3 - s.phase);
  return Math.max(o.minWidth * 0.5, full * (0.28 + 0.72 * lift) * (0.4 + 0.6 * entry) * swell);
}

/**
 * Records a cross section of the ribbon. Ribs are emitted one behind the pen so
 * each one can be mitred against both of its neighbours: consecutive quads then
 * share an exact edge instead of overlapping, which is what stops a
 * semi-transparent stroke from banding like a ladder.
 */
function pushRib(s, p, w, speed) {
  const prev = s.ribs[s.ribs.length - 1];
  if (prev) {
    const dx = p.x - prev.p.x;
    const dy = p.y - prev.p.y;
    const len = Math.hypot(dx, dy);
    if (len < 1e-6) return;
    prev.out = { x: dx / len, y: dy / len };
    s.lastDir = prev.out;
  }
  s.ribs.push({ p: { x: p.x, y: p.y }, w, travel: s.travel, speed, in: prev ? prev.out : null, out: null });
}

function flush(ctx, s, final) {
  const ribs = s.ribs;
  // Keep the newest rib pending until its outgoing direction is known.
  const limit = final ? ribs.length : ribs.length - 1;
  for (let i = 0; i + 1 < limit; i += 1) {
    if (ribs[i].done) continue;
    paintSpan(ctx, s, ribs[i], ribs[i + 1]);
    ribs[i].done = true;
  }
  if (final && ribs.length >= 2) {
    const last = ribs.length - 2;
    if (!ribs[last].done) {
      paintSpan(ctx, s, ribs[last], ribs[last + 1]);
      ribs[last].done = true;
    }
  }
  if (!final && ribs.length > 3) ribs.splice(0, ribs.length - 3);
}

function normalOf(rib) {
  const a = rib.in;
  const b = rib.out || rib.in;
  if (!a) return b ? { x: -b.y, y: b.x, miter: 1 } : { x: 0, y: 1, miter: 1 };
  const c = b || a;
  let nx = -(a.y + c.y);
  let ny = a.x + c.x;
  const len = Math.hypot(nx, ny);
  if (len < 1e-6) return { x: -a.y, y: a.x, miter: 1 };
  nx /= len;
  ny /= len;
  // 1/cos(half turn): keeps the ribbon a constant width around a bend, capped
  // so a hairpin does not shoot a spike off the page.
  const cos = Math.max(0.35, nx * -a.y + ny * a.x);
  return { x: nx, y: ny, miter: Math.min(2.2, 1 / cos) };
}

function paintSpan(ctx, s, ra, rb) {
  const o = s.o;
  const na = normalOf(ra);
  const nb = normalOf(rb);

  // Dryness from two sources: the pen outrunning the ink, and the reservoir
  // emptying over a long stroke. Either one starts opening 飞白 gaps.
  const rush = clamp01((rb.speed / o.speedLift - 0.26) / 0.8);
  const spent = clamp01(rb.travel / o.reload) ** 1.6;
  // Never let the mark vanish outright: even a whipped stroke leaves a core.
  const dry = clamp(rush * 0.95 + spent * 0.4, 0, 0.84);

  const wa = ra.w * na.miter;
  const wb = rb.w * nb.miter;

  if (o.bleed && dry < 0.8) {
    fillQuad(ctx, ra.p, rb.p, na, nb, wa * 1.5, wb * 1.5, rgba(s.rgb, o.alpha * 0.06 * (1 - dry)));
  }

  for (const br of s.bristles) {
    const cover = bristleCover(br, rb.travel, dry);
    if (cover <= 0.02) continue;
    const edge = 1 - 0.28 * Math.abs(br.t);
    const alpha = o.alpha * cover * edge * (0.6 + 0.4 * clamp01(o.pressure));
    const oa = br.t * wa * 0.5;
    const ob = br.t * wb * 0.5;
    fillQuad(
      ctx,
      { x: ra.p.x + na.x * oa, y: ra.p.y + na.y * oa },
      { x: rb.p.x + nb.x * ob, y: rb.p.y + nb.y * ob },
      na,
      nb,
      wa * br.w,
      wb * br.w,
      rgba(s.rgb, alpha),
    );
  }

  // Only hairpins need a round join; everywhere else the mitre already closes
  // the gap and an extra disc would double-darken the seam.
  if (ra.out && rb.out && ra.out.x * rb.out.x + ra.out.y * rb.out.y < 0.5) {
    ctx.fillStyle = rgba(s.rgb, o.alpha * 0.5 * (1 - dry * 0.6));
    ctx.beginPath();
    ctx.arc(rb.p.x, rb.p.y, Math.max(0.2, rb.w * 0.5), 0, Math.PI * 2);
    ctx.fill();
  }
}

/**
 * One bristle's coverage along the stroke. The bristle carries its own low
 * frequency noise; dryness raises the level that noise has to clear, so hairs
 * drop out one at a time and leave streaks rather than a uniform fade.
 */
function bristleCover(br, travel, dry) {
  if (dry <= 0.06) return 1;
  // Three octaves: long dry runs, mid streaks, and a fine grain so the breakup
  // reads as hairs dragging over the paper rather than a dashed line.
  const n =
    0.5 +
    0.26 * Math.sin(travel / br.scale + br.phase) +
    0.16 * Math.sin(travel / (br.scale * 0.37) + br.phase * 2.3) +
    0.09 * Math.sin(travel / (br.scale * 0.13) + br.phase * 5.1);
  const threshold = (dry - 0.06) * (0.32 + 0.9 * br.thirst);
  return clamp01((n - threshold) / 0.18);
}

/**
 * Hairs laid across the width of the nib. They overlap deliberately - a wet
 * stroke has to read as one solid mark, and only dryness is allowed to open
 * the gaps between them.
 */
function bristleLayout(width, seed) {
  const count = clamp(Math.round(width / 1.25), 4, 11);
  const spread = 2 / (count - 1);
  const out = [];
  for (let i = 0; i < count; i += 1) {
    const t = (i / (count - 1)) * 2 - 1;
    out.push({
      t,
      w: spread * (1.35 + 0.45 * hash01(seed + i * 13)),
      phase: hash01(seed + i * 29) * Math.PI * 2,
      scale: 16 + hash01(seed + i * 47) * 30,
      // The middle of the nib holds ink longest, the outer hairs dry first.
      thirst: clamp01(Math.abs(t) * 0.75 + 0.3 * hash01(seed + i * 71)),
    });
  }
  return out;
}

function fillQuad(ctx, a, b, na, nb, wa, wb, style) {
  const ha = Math.max(0.12, wa) / 2;
  const hb = Math.max(0.12, wb) / 2;
  ctx.fillStyle = style;
  ctx.beginPath();
  ctx.moveTo(a.x + na.x * ha, a.y + na.y * ha);
  ctx.lineTo(b.x + nb.x * hb, b.y + nb.y * hb);
  ctx.lineTo(b.x - nb.x * hb, b.y - nb.y * hb);
  ctx.lineTo(a.x - na.x * ha, a.y - na.y * ha);
  ctx.closePath();
  ctx.fill();
}

function finitePoint(p) {
  return p && Number.isFinite(p.x) && Number.isFinite(p.y);
}

export function parseColor(input) {
  const fallback = { r: 26, g: 18, b: 11, a: 1 };
  if (typeof input !== "string") return fallback;
  const c = input.trim().toLowerCase();
  const hex = /^#([0-9a-f]{3,8})$/.exec(c);
  if (hex) {
    const h = hex[1];
    if (h.length === 3 || h.length === 4) {
      return {
        r: parseInt(h[0] + h[0], 16),
        g: parseInt(h[1] + h[1], 16),
        b: parseInt(h[2] + h[2], 16),
        a: h.length === 4 ? parseInt(h[3] + h[3], 16) / 255 : 1,
      };
    }
    if (h.length === 6 || h.length === 8) {
      return {
        r: parseInt(h.slice(0, 2), 16),
        g: parseInt(h.slice(2, 4), 16),
        b: parseInt(h.slice(4, 6), 16),
        a: h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1,
      };
    }
  }
  const fn = /^rgba?\(([^)]+)\)$/.exec(c);
  if (fn) {
    const parts = fn[1].split(/[,/\s]+/).filter(Boolean).map(Number);
    if (parts.length >= 3 && parts.slice(0, 3).every(Number.isFinite)) {
      return {
        r: clamp(parts[0], 0, 255),
        g: clamp(parts[1], 0, 255),
        b: clamp(parts[2], 0, 255),
        a: Number.isFinite(parts[3]) ? clamp(parts[3], 0, 1) : 1,
      };
    }
  }
  return fallback;
}

function rgba(c, a) {
  const v = clamp(a * (c.a ?? 1), 0, 1);
  return `rgba(${Math.round(c.r)},${Math.round(c.g)},${Math.round(c.b)},${v.toFixed(4)})`;
}

function hash01(n) {
  let x = Math.imul(Math.round(n) ^ 0x9e3779b9, 0x85ebca6b);
  x ^= x >>> 13;
  x = Math.imul(x, 0xc2b2ae35);
  x ^= x >>> 16;
  return (x >>> 0) / 4294967296;
}
