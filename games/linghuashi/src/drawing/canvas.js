import { createInkBrush } from "./ink.js";
import { createStrokeRecognizer } from "./recognizer.js";
import { clamp, clamp01, medianSpeed } from "./geometry.js";

const INK = "#1a120b";
const SEAL = "rgba(150,32,28,0.9)";
const FADE_MS = 520;

export function mountPainter(canvas, { onStroke, ink = INK, fadeMs = FADE_MS } = {}) {
  const ctx = canvas.getContext("2d");
  const brush = createInkBrush(ctx, { color: ink });
  const recognizer = createStrokeRecognizer();
  let points = [];
  let drawing = false;
  let pointerId = null;
  let paper = null;
  let fade = null;
  let strokeSeed = 1;

  function cssSize() {
    const rect = canvas.getBoundingClientRect?.();
    const w = rect?.width || canvas.clientWidth || canvas.width || 1;
    const h = rect?.height || canvas.clientHeight || canvas.height || 1;
    return { w: Math.max(1, w), h: Math.max(1, h) };
  }

  function size() {
    const dpr = Math.min(2, (typeof window !== "undefined" && window.devicePixelRatio) || 1);
    const { w, h } = cssSize();
    canvas.width = Math.max(1, Math.floor(w * dpr));
    canvas.height = Math.max(1, Math.floor(h * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    paper = makePaper(w, h);
    paintPaper();
  }

  /**
   * The fibre speckle is baked once into an offscreen tile. Re-randomising it
   * on every repaint made the sheet crawl between strokes.
   */
  function makePaper(w, h) {
    const off = createSurface(Math.ceil(w), Math.ceil(h));
    if (!off) return null;
    const c = off.getContext("2d");
    const g = c.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, "#efe3c8");
    g.addColorStop(0.55, "#eaddbe");
    g.addColorStop(1, "#e4d3ae");
    c.fillStyle = g;
    c.fillRect(0, 0, w, h);
    const grains = Math.min(2600, Math.round((w * h) / 320));
    for (let i = 0; i < grains; i += 1) {
      const u = hash01(i * 2.17);
      const v = hash01(i * 5.31 + 11);
      c.globalAlpha = 0.03 + 0.05 * hash01(i * 7.7);
      c.fillStyle = i % 3 ? "#8a6a3a" : "#3b2a18";
      c.fillRect(u * w, v * h, 1 + hash01(i) * 0.8, 1 + hash01(i + 3) * 0.8);
    }
    c.globalAlpha = 1;
    return off;
  }

  function paintPaper() {
    const { w, h } = cssSize();
    if (paper) {
      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(paper, 0, 0, w, h);
      return;
    }
    ctx.fillStyle = "#eaddbe";
    ctx.fillRect(0, 0, w, h);
  }

  /** Lets the ink sink away instead of the sheet blinking clean. */
  function fadeOut() {
    stopFade();
    const { w, h } = cssSize();
    if (!paper || typeof requestAnimationFrame !== "function" || fadeMs <= 0) {
      paintPaper();
      return;
    }
    const startedAt = now();
    const step = () => {
      const u = clamp01((now() - startedAt) / fadeMs);
      ctx.save();
      ctx.globalAlpha = clamp(0.06 + u * 0.22, 0, 1);
      ctx.drawImage(paper, 0, 0, w, h);
      ctx.restore();
      if (u >= 1) {
        paintPaper();
        fade = null;
        return;
      }
      fade = requestAnimationFrame(step);
    };
    fade = requestAnimationFrame(step);
  }

  function stopFade() {
    if (fade !== null && typeof cancelAnimationFrame === "function") cancelAnimationFrame(fade);
    fade = null;
  }

  function pos(ev) {
    const rect = canvas.getBoundingClientRect?.() || { left: 0, top: 0 };
    const src = ev.touches && ev.touches.length ? ev.touches[0] : ev;
    return {
      x: src.clientX - rect.left,
      y: src.clientY - rect.top,
      t: now(),
      // A stylus reports real pressure; a mouse always reports 0.5 or 0.
      force: Number.isFinite(ev.pressure) && ev.pressure > 0 && ev.pressure !== 0.5 ? ev.pressure : null,
    };
  }

  function samples(ev) {
    if (typeof ev.getCoalescedEvents === "function") {
      try {
        const list = ev.getCoalescedEvents();
        if (list && list.length) return list.map(pos);
      } catch {
        /* Safari throws on detached events */
      }
    }
    return [pos(ev)];
  }

  function start(ev) {
    if (drawing) return;
    ev.preventDefault?.();
    if (ev.pointerId !== undefined) {
      pointerId = ev.pointerId;
      canvas.setPointerCapture?.(ev.pointerId);
    }
    stopFade();
    paintPaper();
    drawing = true;
    strokeSeed = (strokeSeed * 1664525 + 1013904223) >>> 0;
    const first = pos(ev);
    points = [first];
    recognizer.reset();
    recognizer.consume(first);
    brush.begin({ pressure: first.force ?? 0.55, seed: strokeSeed });
    brush.extend(first);
  }

  function move(ev) {
    if (!drawing) return;
    if (pointerId !== null && ev.pointerId !== undefined && ev.pointerId !== pointerId) return;
    ev.preventDefault?.();
    for (const p of samples(ev)) {
      points.push(p);
      recognizer.consume(p);
      brush.extend(p);
    }
  }

  /** 收笔的共同善后：松开捕获、停笔，返回这一笔是否真的在画。 */
  function finishStroke() {
    if (!drawing) return false;
    drawing = false;
    if (pointerId !== null) {
      canvas.releasePointerCapture?.(pointerId);
      pointerId = null;
    }
    brush.end();
    return true;
  }

  /**
   * 被系统夺走的一笔（来电、手势接管、笔尖离屏、多指误触）作废。
   *
   * pointercancel 的点列是半截的，交给识别只会得到一个玩家没打算画的符；
   * 这里既不 finalize 也不回调 onStroke，纸面淡出当无事发生。识别本身不动。
   */
  function discard(ev) {
    if (!finishStroke()) return;
    ev?.preventDefault?.();
    points = [];
    recognizer.reset();
    fadeOut();
  }

  function end(ev) {
    if (!drawing) return;
    ev?.preventDefault?.();
    finishStroke();
    const result = recognizer.finalize(points);
    const last = points[points.length - 1];
    if (last && result.type !== "scribble") {
      brush.bloom(last.x, last.y, SEAL, 18 + result.precision * 26, {
        strength: 0.16 + result.precision * 0.22,
        seed: strokeSeed,
      });
    }
    points = [];
    onStroke?.(result);
    fadeOut();
  }

  const listeners = [
    ["pointerdown", start, undefined],
    ["pointermove", move, undefined],
    ["pointerup", end, undefined],
    ["pointercancel", discard, undefined],
    ["pointerleave", end, undefined],
    ["touchstart", start, { passive: false }],
    ["touchmove", move, { passive: false }],
    ["touchend", end, undefined],
    ["touchcancel", discard, undefined],
  ];
  for (const [type, fn, opts] of listeners) canvas.addEventListener(type, fn, opts);
  if (typeof window !== "undefined") window.addEventListener("resize", size);
  size();

  return {
    resize: size,
    /** 主动作废未完成的一笔，例如离开战斗屏时。 */
    cancel: discard,
    clear() {
      stopFade();
      paintPaper();
    },
    /** Replays a stroke without any pointer, for tutorials and tests. */
    preview(pointList, options = {}) {
      if (!Array.isArray(pointList) || pointList.length < 2) return null;
      stopFade();
      paintPaper();
      const pressure = clamp(0.28 / (medianSpeed(pointList) * 8 + 0.1), 0.2, 1);
      brush.stroke(pointList, { pressure, seed: options.seed ?? 7, ...options });
      return recognizer.finalize(pointList);
    },
    destroy() {
      stopFade();
      if (finishStroke()) points = [];
      for (const [type, fn, opts] of listeners) canvas.removeEventListener(type, fn, opts);
      if (typeof window !== "undefined") window.removeEventListener("resize", size);
    },
  };
}

function createSurface(w, h) {
  if (typeof OffscreenCanvas === "function") return new OffscreenCanvas(w, h);
  if (typeof document !== "undefined" && document.createElement) {
    const el = document.createElement("canvas");
    el.width = w;
    el.height = h;
    return el;
  }
  return null;
}

function now() {
  return typeof performance !== "undefined" && performance.now ? performance.now() : Date.now();
}

function hash01(n) {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}
