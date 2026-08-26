import { mountPainter } from "../drawing/canvas.js";
import { motionReduced } from "./motion-bridge.js";

/**
 * 画布宿主。
 *
 * mountPainter 会在 window 上挂 resize 监听且 destroy() 不解绑，所以这里只挂载一次，
 * 把同一个 canvas 节点在各次战斗之间搬进搬出，回合结束只解开回调，不重复挂载。
 */

let host = null;
let previewTimer = null;
let previewFrame = null;

function hasCanvas2d(canvas) {
  if (typeof canvas.getContext !== "function") return false;
  try {
    return Boolean(canvas.getContext("2d"));
  } catch {
    return false;
  }
}

function stubPainter() {
  return { resize() {}, clear() {}, cancel() {}, destroy() {} };
}

export function acquirePainter({ onStroke, label } = {}) {
  if (!host) {
    const canvas = document.createElement("canvas");
    canvas.className = "paper";
    canvas.id = "paper";
    const painter = hasCanvas2d(canvas) ? mountPainter(canvas, { onStroke: (stroke) => host?.onStroke?.(stroke) }) : stubPainter();
    host = { canvas, painter, onStroke: null };
  }
  host.onStroke = onStroke ?? null;
  host.canvas.setAttribute("role", "img");
  host.canvas.setAttribute(
    "aria-label",
    label || "水墨画布：用鼠标或手指作画施法；键盘用户可用下方符键条或数字键 1 至 6。",
  );
  return host;
}

export function releasePainter() {
  cancelPreview();
  if (!host) return;
  // 半截的笔不跟着换屏：离屏时当 pointercancel 处理，别留在「正在画」的状态里。
  host.painter.cancel?.();
  host.onStroke = null;
}

function cancelPreview() {
  if (previewTimer !== null) {
    window.clearTimeout(previewTimer);
    previewTimer = null;
  }
  if (previewFrame !== null) {
    window.cancelAnimationFrame(previewFrame);
    previewFrame = null;
  }
}

export function canvasBox() {
  if (!host) return { width: 320, height: 240 };
  const rect = host.canvas.getBoundingClientRect();
  return { width: Math.max(120, rect.width), height: Math.max(120, rect.height) };
}

/**
 * 键盘施法的墨迹回显：把合成点列描到画布上再淡出。
 * 只负责显示，不参与识别，也不碰 drawing/ 的笔刷算法。
 */
export function previewStroke(points, { color = "rgba(26,18,11,0.82)", animate = true } = {}) {
  if (!host || !points?.length) return;
  const ctx = hasCanvas2d(host.canvas) ? host.canvas.getContext("2d") : null;
  if (!ctx) return;
  cancelPreview();
  // 每次只显示最新一笔，连按不会糊成一团。
  host.painter.clear();

  const draw = (upTo) => {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 5.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < upTo; i += 1) ctx.lineTo(points[i].x, points[i].y);
    ctx.stroke();
    ctx.restore();
  };

  const fade = () => {
    previewTimer = window.setTimeout(() => {
      previewTimer = null;
      host?.painter.clear();
    }, 420);
  };

  if (!animate || motionReduced() || typeof window.requestAnimationFrame !== "function") {
    draw(points.length);
    fade();
    return;
  }

  const startedAt = performance.now();
  const duration = 260;
  const step = (now) => {
    const ratio = Math.min(1, (now - startedAt) / duration);
    const upTo = Math.max(2, Math.round(points.length * ratio));
    draw(upTo);
    if (ratio < 1) {
      previewFrame = window.requestAnimationFrame(step);
    } else {
      previewFrame = null;
      fade();
    }
  };
  previewFrame = window.requestAnimationFrame(step);
}

/** 插入 DOM 后需要重新按实际尺寸初始化画布（挂载时它还不在文档里）。 */
export function refreshPainter() {
  if (!host) return;
  host.painter.resize();
}
