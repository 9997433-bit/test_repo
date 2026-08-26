import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mountPainter } from "../src/drawing/canvas.js";

/**
 * jsdom 没有 2D 上下文，这里给画布一套只记账不作画的替身：
 * 断言的是「哪一笔被交出去识别」，不是像素。
 */
function fakeCtx() {
  const gradient = { addColorStop() {} };
  return {
    canvas: null,
    globalAlpha: 1,
    save() {},
    restore() {},
    setTransform() {},
    clearRect() {},
    fillRect() {},
    drawImage() {},
    beginPath() {},
    closePath() {},
    moveTo() {},
    lineTo() {},
    arc() {},
    fill() {},
    createLinearGradient: () => gradient,
    createRadialGradient: () => gradient,
  };
}

function fakeCanvas() {
  const handlers = new Map();
  const released = [];
  const captured = [];
  return {
    width: 320,
    height: 240,
    clientWidth: 320,
    clientHeight: 240,
    released,
    captured,
    getContext: () => fakeCtx(),
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 320, height: 240 }),
    addEventListener(type, fn) {
      handlers.set(type, fn);
    },
    removeEventListener(type) {
      handlers.delete(type);
    },
    setPointerCapture(id) {
      captured.push(id);
    },
    releasePointerCapture(id) {
      released.push(id);
    },
    emit(type, ev) {
      handlers.get(type)?.(ev);
    },
    has(type) {
      return handlers.has(type);
    },
  };
}

function pointer(x, y, pointerId = 1) {
  return { pointerId, clientX: x, clientY: y, pressure: 0.5, preventDefault() {} };
}

/** 一条足以被认成「线」的横笔。 */
function drawLine(canvas, { finishWith = "pointerup", pointerId = 1 } = {}) {
  canvas.emit("pointerdown", pointer(20, 120, pointerId));
  for (let i = 1; i <= 24; i += 1) canvas.emit("pointermove", pointer(20 + i * 11, 120 + i * 0.2, pointerId));
  canvas.emit(finishWith, pointer(20 + 24 * 11, 124, pointerId));
}

let canvas;
let onStroke;
let painter;

beforeEach(() => {
  vi.stubGlobal(
    "OffscreenCanvas",
    class {
      constructor(w, h) {
        this.width = w;
        this.height = h;
      }
      getContext() {
        return fakeCtx();
      }
    },
  );
  canvas = fakeCanvas();
  onStroke = vi.fn();
  painter = mountPainter(canvas, { onStroke, fadeMs: 0 });
});

afterEach(() => {
  painter.destroy();
  vi.unstubAllGlobals();
});

describe("pointercancel 丢弃未完成的一笔", () => {
  it("正常收笔仍然交出识别结果", () => {
    drawLine(canvas);

    expect(onStroke).toHaveBeenCalledTimes(1);
    expect(onStroke.mock.calls[0][0].type).toBe("line");
  });

  it("中途被 pointercancel 打断时不施法", () => {
    drawLine(canvas, { finishWith: "pointercancel" });

    expect(onStroke).not.toHaveBeenCalled();
    expect(canvas.released).toEqual([1]);
  });

  it("被打断后画布不卡在「正在画」，下一笔照常成符", () => {
    canvas.emit("pointerdown", pointer(20, 120));
    canvas.emit("pointermove", pointer(90, 121));
    canvas.emit("pointercancel", pointer(90, 121));

    drawLine(canvas, { pointerId: 2 });

    expect(onStroke).toHaveBeenCalledTimes(1);
    expect(onStroke.mock.calls[0][0].type).toBe("line");
  });

  it("废弃的半截笔不会拼进下一笔的点列", () => {
    // 先在纸的下缘划一段，被打断；再在上缘画一条直线。
    canvas.emit("pointerdown", pointer(20, 230));
    for (let i = 1; i <= 10; i += 1) canvas.emit("pointermove", pointer(20 + i * 9, 230 - i * 8));
    canvas.emit("pointercancel", pointer(110, 150));

    drawLine(canvas, { pointerId: 3 });

    const stroke = onStroke.mock.calls[0][0];
    expect(stroke.type).toBe("line");
    // 起点若混入上一笔，raw 的首点会落在被丢弃的那段上。
    expect(stroke.raw[0].y).toBeCloseTo(120, 0);
  });

  it("touchcancel 与 pointercancel 同礼", () => {
    expect(canvas.has("touchcancel")).toBe(true);

    canvas.emit("touchstart", { touches: [{ clientX: 20, clientY: 120 }], preventDefault() {} });
    canvas.emit("touchmove", { touches: [{ clientX: 120, clientY: 121 }], preventDefault() {} });
    canvas.emit("touchcancel", { touches: [], preventDefault() {} });

    expect(onStroke).not.toHaveBeenCalled();
  });

  it("painter.cancel() 供换屏时主动作废", () => {
    canvas.emit("pointerdown", pointer(20, 120));
    canvas.emit("pointermove", pointer(120, 121));

    painter.cancel();

    expect(onStroke).not.toHaveBeenCalled();
    expect(canvas.released).toEqual([1]);
  });
});
