import { boundsOf, clamp, resample } from "./geometry.js";
import { createInkBrush } from "./ink.js";

const PAPER = "#efe3c8";
const INK = "#1a120b";
/** 一笔重放的目标时长：够看清落笔走势，又不至于让一屏墨迹排队排到天荒地老。 */
const REPLAY_MS = 620;

/** 画阁存档用：降采样并归一化到 [0,1]²，保持长宽比。 */
export function normalizeForStorage(points, n = 32) {
  if (!Array.isArray(points) || points.length < 2) return [];
  const sampled = resample(finiteOnly(points), n);
  if (sampled.length < 2) return [];
  return unitize(sampled).map((p) => ({ x: round3(p.x), y: round3(p.y) }));
}

/**
 * 把一笔收进单位空间，点数原样保留。
 *
 * 画阁存的是 [0,1]² 的点位，而刚落下的一笔交出来的是画布像素坐标；两边都要能直接回放。
 * 判据用包围盒：存档点位必然整个落在单位方框内（写入时归一化，读档时又逐点夹紧），
 * 而能成符的一笔至少几十像素长，绝不会挤在 1×1 的方框里。
 */
export function toUnitTrace(points) {
  const clean = finiteOnly(points);
  if (clean.length < 2) return [];
  const b = boundsOf(clean);
  if (b.minX >= 0 && b.minY >= 0 && b.maxX <= 1 && b.maxY <= 1) {
    return clean.map((p) => ({ x: p.x, y: p.y }));
  }
  return unitize(clean);
}

/**
 * 把单位空间的点位铺进目标画布（含留白），返回像素坐标。
 * 长宽比保持不变，否则圆会摊成椭圆、锯齿会变形，回放就认不出原来那一笔了。
 */
export function fitToCanvas(norm, w, h, pad = 0.14) {
  const pts = finiteOnly(norm);
  if (!pts.length) return [];
  const b = boundsOf(pts);
  const scale = Math.min((w * (1 - pad * 2)) / (b.w || 1), (h * (1 - pad * 2)) / (b.h || 1));
  const offX = (w - b.w * scale) / 2;
  const offY = (h - b.h * scale) / 2;
  return pts.map((p, i) => ({
    x: offX + (p.x - b.minX) * scale,
    y: offY + (p.y - b.minY) * scale,
    t: Number.isFinite(p.t) ? p.t : i * 24,
  }));
}

/**
 * 在独立画布上重放一笔墨迹；返回 stop()。
 *
 * `trace` 收单位空间的存档点位或原始像素点位都行。reducedMotion 时整笔直接落纸。
 */
export function replayOnCanvas(canvas, trace, options = {}) {
  const { reducedMotion = false, color = INK, durationMs = REPLAY_MS, pressure = 0.6, seed = 7 } = options;
  const ctx = canvas?.getContext?.("2d");
  if (!ctx) return noop;

  const { w, h } = prepare(canvas, ctx);
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, w, h);

  const pts = fitToCanvas(toUnitTrace(trace), w, h);
  if (pts.length < 2) return noop;

  const brush = createInkBrush(ctx, { color });
  const animate = typeof window !== "undefined" && typeof window.requestAnimationFrame === "function";
  if (reducedMotion || !animate) {
    brush.stroke(pts, { pressure, seed });
    return noop;
  }

  // 一次起笔、逐点续接、一次收笔。分段调用 brush.stroke() 会让每个小窗口各自
  // 起收，行程与飞白也跟着归零，重放就成了一串各带尾锋的墨点而非一笔墨迹。
  brush.begin({ pressure, seed });
  let next = 0;
  let startedAt = null;
  let frame = 0;

  const step = (now) => {
    frame = 0;
    if (startedAt === null) startedAt = now;
    const done = clamp((now - startedAt) / Math.max(1, durationMs), 0, 1);
    const until = Math.round(done * (pts.length - 1));
    while (next <= until) {
      brush.extend(pts[next]);
      next += 1;
    }
    if (done < 1) {
      frame = window.requestAnimationFrame(step);
      return;
    }
    brush.end();
  };

  frame = window.requestAnimationFrame(step);
  return function stop() {
    if (!frame) return;
    window.cancelAnimationFrame(frame);
    frame = 0;
    // 收掉半截的笔：最后一节墨还压在笔里没落纸。
    brush.end();
  };
}

function noop() {}

/** 尺寸随 dpr 放大位图，并把坐标系换回 CSS 像素。 */
function prepare(canvas, ctx) {
  const { w, h } = cssSizeOf(canvas);
  const dpr = Math.min(2, (typeof window !== "undefined" && window.devicePixelRatio) || 1);
  canvas.width = Math.max(1, Math.floor(w * dpr));
  canvas.height = Math.max(1, Math.floor(h * dpr));
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { w, h };
}

const cssSizes = new WeakMap();

/**
 * 画布的 CSS 尺寸。量不到时（还没上屏、被折叠、或测试环境里没有布局）退回首次记下的
 * 尺寸：直接读 canvas.width 会把上一次乘过 dpr 的位图宽度再乘一遍，反复重放会越涨越大。
 */
function cssSizeOf(canvas) {
  const rect = canvas.getBoundingClientRect?.();
  const w = rect?.width || canvas.clientWidth || 0;
  const h = rect?.height || canvas.clientHeight || 0;
  if (w > 0 && h > 0) {
    const measured = { w, h };
    cssSizes.set(canvas, measured);
    return measured;
  }
  const remembered = cssSizes.get(canvas);
  if (remembered) return remembered;
  const fallback = { w: Math.max(1, canvas.width), h: Math.max(1, canvas.height) };
  cssSizes.set(canvas, fallback);
  return fallback;
}

/** 归一化到 [0,1]²，长边贴满，短边按比例。点数不变。 */
function unitize(points) {
  const b = boundsOf(points);
  const span = Math.max(b.w, b.h) || 1;
  return points.map((p) => ({ x: (p.x - b.minX) / span, y: (p.y - b.minY) / span }));
}

function finiteOnly(points) {
  if (!Array.isArray(points)) return [];
  return points.filter((p) => Number.isFinite(p?.x) && Number.isFinite(p?.y));
}

function round3(n) {
  return Math.round(n * 1000) / 1000;
}
