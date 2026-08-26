import { createInkBrush } from "./ink.js";
import { createStrokeRecognizer } from "./recognizer.js";
import { meanSpeed } from "./geometry.js";
import { templatePoints } from "./templates.js";

export function mountPainter(canvas, { onStroke, reducedMotion = false } = {}) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return noopPainter();
  const brush = createInkBrush(ctx);
  const recognizer = createStrokeRecognizer();
  let points = [];
  let drawing = false;
  let guideType = null;
  let fadeTimer = 0;
  let playbackRaf = 0;
  let destroyed = false;

  function rectSize() {
    const rect = canvas.getBoundingClientRect();
    return { w: Math.max(1, rect.width), h: Math.max(1, rect.height) };
  }

  function size() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const { w, h } = rectSize();
    canvas.width = Math.max(1, Math.floor(w * dpr));
    canvas.height = Math.max(1, Math.floor(h * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    paintPaper();
  }

  function paintPaper() {
    const { w, h } = rectSize();
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, "#f0e4ca");
    g.addColorStop(0.55, "#eadcbc");
    g.addColorStop(1, "#e2d0a8");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    // 纸纤维
    ctx.globalAlpha = 0.05;
    for (let i = 0; i < 46; i += 1) {
      ctx.fillStyle = i % 2 ? "#3b2a18" : "#8a6a3a";
      const x = ((i * 137.5) % w);
      const y = ((i * 89.7 + 31) % h);
      ctx.fillRect(x, y, 1.4, 1.4);
    }
    ctx.globalAlpha = 1;
    // 角落闲章
    ctx.save();
    ctx.globalAlpha = 0.35;
    ctx.strokeStyle = "#7a1818";
    ctx.lineWidth = 1.6;
    ctx.strokeRect(w - 34, h - 34, 22, 22);
    ctx.font = "13px serif";
    ctx.fillStyle = "#7a1818";
    ctx.fillText("灵", w - 29, h - 18);
    ctx.restore();
    if (guideType) paintGuide();
  }

  // 教程引导：淡墨虚线模板
  function paintGuide() {
    const { w, h } = rectSize();
    const pts = templatePoints(guideType, { w, h });
    if (pts.length < 2) return;
    ctx.save();
    ctx.strokeStyle = "rgba(26, 18, 11, 0.28)";
    ctx.lineWidth = 2;
    ctx.setLineDash([7, 9]);
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (const p of pts.slice(1)) ctx.lineTo(p.x, p.y);
    ctx.stroke();
    // 起笔点
    ctx.setLineDash([]);
    ctx.fillStyle = "rgba(122, 24, 24, 0.5)";
    ctx.beginPath();
    ctx.arc(pts[0].x, pts[0].y, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function scheduleFade(delay = 280) {
    window.clearTimeout(fadeTimer);
    fadeTimer = window.setTimeout(() => {
      if (!destroyed) paintPaper();
    }, delay);
  }

  function pos(ev) {
    const rect = canvas.getBoundingClientRect();
    const src = ev.touches ? ev.touches[0] : ev;
    return { x: src.clientX - rect.left, y: src.clientY - rect.top, t: performance.now() };
  }

  function start(ev) {
    ev.preventDefault();
    if (ev.pointerId !== undefined && canvas.setPointerCapture) {
      try {
        canvas.setPointerCapture(ev.pointerId);
      } catch {
        /* jsdom / detached */
      }
    }
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
    if (last && !reducedMotion) brush.bloom(last.x, last.y, "rgba(122,24,24,0.45)", 36);
    onStroke?.(result);
    scheduleFade();
    points = [];
  }

  // 键盘施法：把模板笔迹以动画重演在纸上（reducedMotion 时整笔画出）
  function playback(type, { color = "#233a5e" } = {}) {
    window.cancelAnimationFrame(playbackRaf);
    const { w, h } = rectSize();
    const pts = templatePoints(type, { w, h });
    if (reducedMotion || !window.requestAnimationFrame) {
      brush.stroke(pts, { color, pressure: 0.65 });
      scheduleFade(420);
      return;
    }
    let i = 1;
    const step = () => {
      if (destroyed) return;
      const until = Math.min(pts.length, i + 3);
      brush.stroke(pts.slice(Math.max(0, i - 1), until), { color, pressure: 0.65 });
      i = until;
      if (i < pts.length) playbackRaf = window.requestAnimationFrame(step);
      else scheduleFade(420);
    };
    playbackRaf = window.requestAnimationFrame(step);
  }

  canvas.addEventListener("pointerdown", start);
  canvas.addEventListener("pointermove", move);
  canvas.addEventListener("pointerup", end);
  canvas.addEventListener("pointercancel", end);
  canvas.addEventListener("pointerleave", end);
  canvas.addEventListener("touchstart", start, { passive: false });
  canvas.addEventListener("touchmove", move, { passive: false });
  canvas.addEventListener("touchend", end);
  window.addEventListener("resize", size);
  size();

  return {
    resize: size,
    clear: paintPaper,
    playback,
    setGuide(type) {
      guideType = type;
      paintPaper();
    },
    destroy() {
      destroyed = true;
      window.clearTimeout(fadeTimer);
      window.cancelAnimationFrame(playbackRaf);
      canvas.removeEventListener("pointerdown", start);
      canvas.removeEventListener("pointermove", move);
      canvas.removeEventListener("pointerup", end);
      canvas.removeEventListener("pointercancel", end);
      canvas.removeEventListener("pointerleave", end);
      canvas.removeEventListener("touchstart", start);
      canvas.removeEventListener("touchmove", move);
      canvas.removeEventListener("touchend", end);
      window.removeEventListener("resize", size);
    },
  };
}

// jsdom 等无 2D 上下文环境下的空实现，保证 UI 可挂载测试
function noopPainter() {
  return {
    resize() {},
    clear() {},
    playback() {},
    setGuide() {},
    destroy() {},
  };
}
