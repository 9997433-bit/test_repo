import { boundsOf, resample } from "./geometry.js";
import { createInkBrush } from "./ink.js";

// 画阁存档用：降采样并归一化到 [0,1]²，保持长宽比
export function normalizeForStorage(points, n = 32) {
  if (!points || points.length < 2) return [];
  const sampled = resample(points, n);
  const b = boundsOf(sampled);
  const span = Math.max(b.w, b.h) || 1;
  return sampled.map((p) => ({
    x: +(((p.x - b.minX) / span).toFixed(3)),
    y: +(((p.y - b.minY) / span).toFixed(3)),
  }));
}

// 把归一化点位铺进目标画布（含留白），返回像素坐标
export function fitToCanvas(norm, w, h, pad = 0.14) {
  if (!norm.length) return [];
  let maxX = 0;
  let maxY = 0;
  for (const p of norm) {
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  }
  const usableW = w * (1 - pad * 2);
  const usableH = h * (1 - pad * 2);
  const scale = Math.min(usableW / (maxX || 1), usableH / (maxY || 1));
  const offX = (w - maxX * scale) / 2;
  const offY = (h - maxY * scale) / 2;
  return norm.map((p, i) => ({ x: offX + p.x * scale, y: offY + p.y * scale, t: i * 24 }));
}

// 在独立画布上回放一笔墨迹；返回 stop()。reducedMotion 时立即整笔画出。
export function replayOnCanvas(canvas, normPoints, { reducedMotion = false, color = "#1a120b" } = {}) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return () => {};
  const dpr = Math.min(2, (typeof window !== "undefined" && window.devicePixelRatio) || 1);
  const rect = canvas.getBoundingClientRect();
  const w = Math.max(1, rect.width || canvas.width);
  const h = Math.max(1, rect.height || canvas.height);
  canvas.width = Math.floor(w * dpr);
  canvas.height = Math.floor(h * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = "#efe3c8";
  ctx.fillRect(0, 0, w, h);
  const pts = fitToCanvas(normPoints, w, h);
  const brush = createInkBrush(ctx);
  if (pts.length < 2) return () => {};

  if (reducedMotion || typeof window === "undefined" || !window.requestAnimationFrame) {
    brush.stroke(pts, { color, pressure: 0.6 });
    return () => {};
  }

  let i = 1;
  let raf = 0;
  const step = () => {
    const until = Math.min(pts.length, i + 2);
    brush.stroke(pts.slice(Math.max(0, i - 1), until), { color, pressure: 0.6 });
    i = until;
    if (i < pts.length) raf = window.requestAnimationFrame(step);
  };
  raf = window.requestAnimationFrame(step);
  return () => window.cancelAnimationFrame(raf);
}
