import { createInkBrush } from "./ink.js";
import { createStrokeRecognizer } from "./recognizer.js";
import { meanSpeed } from "./geometry.js";

export function mountPainter(canvas, { onStroke } = {}) {
  const ctx = canvas.getContext("2d");
  const brush = createInkBrush(ctx);
  const recognizer = createStrokeRecognizer();
  let points = [];
  let drawing = false;

  function size() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.max(1, Math.floor(rect.width * dpr));
    canvas.height = Math.max(1, Math.floor(rect.height * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    paintPaper();
  }

  function paintPaper() {
    const { width, height } = canvas.getBoundingClientRect();
    const g = ctx.createLinearGradient(0, 0, width, height);
    g.addColorStop(0, "#efe3c8");
    g.addColorStop(1, "#e4d3ae");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, width, height);
    ctx.globalAlpha = 0.06;
    for (let i = 0; i < 40; i += 1) {
      ctx.fillStyle = i % 2 ? "#3b2a18" : "#8a6a3a";
      ctx.fillRect(Math.random() * width, Math.random() * height, 1.2, 1.2);
    }
    ctx.globalAlpha = 1;
  }

  function pos(ev) {
    const rect = canvas.getBoundingClientRect();
    const src = ev.touches ? ev.touches[0] : ev;
    return { x: src.clientX - rect.left, y: src.clientY - rect.top, t: performance.now() };
  }

  function start(ev) {
    ev.preventDefault();
    drawing = true;
    points = [pos(ev)];
  }

  function move(ev) {
    if (!drawing) return;
    ev.preventDefault();
    const p = pos(ev);
    points.push(p);
    const pressure = Math.max(0.2, Math.min(1, 0.3 / (meanSpeed(points.slice(-8)) * 10 + 0.1)));
    brush.stroke(points.slice(-2), { pressure });
  }

  function end(ev) {
    if (!drawing) return;
    ev.preventDefault();
    drawing = false;
    const result = recognizer.finalize(points);
    const last = points[points.length - 1];
    if (last) brush.bloom(last.x, last.y, "rgba(122,24,24,0.45)", 36);
    onStroke?.(result);
    window.setTimeout(paintPaper, 280);
    points = [];
  }

  canvas.addEventListener("pointerdown", start);
  canvas.addEventListener("pointermove", move);
  canvas.addEventListener("pointerup", end);
  canvas.addEventListener("pointerleave", end);
  canvas.addEventListener("touchstart", start, { passive: false });
  canvas.addEventListener("touchmove", move, { passive: false });
  canvas.addEventListener("touchend", end);
  window.addEventListener("resize", size);
  size();

  return {
    resize: size,
    clear: paintPaper,
    destroy() {
      canvas.removeEventListener("pointerdown", start);
      canvas.removeEventListener("pointermove", move);
      canvas.removeEventListener("pointerup", end);
      canvas.removeEventListener("pointerleave", end);
    },
  };
}
