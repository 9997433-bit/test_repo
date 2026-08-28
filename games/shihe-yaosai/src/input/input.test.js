// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { INPUT_EVENT, UI_EVENT, createInput } from "./index.js";

/** jsdom 没有 PointerEvent，用 MouseEvent 打上 pointerId / offset 顶替。 */
function pointer(type, x, y) {
  const event = new MouseEvent(type, { bubbles: true, cancelable: true, clientX: x, clientY: y, button: 0 });
  Object.defineProperty(event, "offsetX", { value: x });
  Object.defineProperty(event, "offsetY", { value: y });
  event.pointerId = 1;
  return event;
}

function key(code, extra = {}) {
  const map = { Digit1: "1", Digit2: "2", Digit3: "3", Digit4: "4", Digit5: "5", KeyF: "f", Space: " ", Escape: "Escape" };
  return new KeyboardEvent("keydown", { code, key: map[code] ?? code, bubbles: true, cancelable: true, ...extra });
}

let canvas;
let input;
let picked;
let scene;

beforeEach(() => {
  document.body.innerHTML = '<canvas id="sh-canvas"></canvas>';
  canvas = document.getElementById("sh-canvas");
  picked = null;
  scene = { pick: vi.fn(() => ({ hit: picked !== null })) };
  input = createInput({ canvas, scene, pickSocket: () => picked });
});

afterEach(() => {
  input?.dispose();
  document.body.innerHTML = "";
});

function tap(x = 10, y = 10) {
  canvas.dispatchEvent(pointer("pointerdown", x, y));
  canvas.dispatchEvent(pointer("pointerup", x, y));
}

describe("createInput({ canvas, scene, pickSocket })", () => {
  it("refuses any other call shape so misuse is loud", () => {
    expect(() => createInput(canvas, scene, {})).toThrow(TypeError);
    expect(() => createInput(canvas)).toThrow(TypeError);
    expect(() => createInput("nope")).toThrow(TypeError);
    const bare = createInput();
    expect(bare.read()).toMatchObject({ pause: false, selectedSocket: null, towerId: "rail" });
    bare.dispose();
  });

  it("starts armed with the first tower and nothing selected", () => {
    expect(input.read()).toEqual({ selectedSocket: null, pause: false, towerId: "rail" });
  });
});

describe("read()", () => {
  it("repeats pause and selectedSocket every frame because both are absolute", () => {
    picked = 5;
    tap();
    expect(input.read()).toMatchObject({ selectedSocket: 5, pause: false });

    window.dispatchEvent(key("Space"));
    expect(input.read()).toMatchObject({ selectedSocket: 5, pause: true });
    // 关键回归：暂停不是沿边脉冲，下一帧仍要报 true，否则 sim 的 `paused = !!cmd.pause` 立刻解除暂停。
    expect(input.read()).toMatchObject({ selectedSocket: 5, pause: true });

    window.dispatchEvent(key("Space"));
    expect(input.read().pause).toBe(false);
  });

  it("hands place over exactly once", () => {
    picked = 12;
    tap();
    expect(input.read().place).toEqual({ socket: 12, towerId: "rail" });
    expect(input.read().place).toBeUndefined();
  });

  it("hands overclockSocket over exactly once", () => {
    picked = 3;
    tap();
    input.read();
    window.dispatchEvent(key("KeyF"));
    expect(input.read().overclockSocket).toBe(3);
    expect(input.read().overclockSocket).toBeUndefined();
  });

  it("drops towerId while disarmed", () => {
    window.dispatchEvent(key("Escape"));
    const out = input.read();
    expect(out.towerId).toBeUndefined();
    expect(out.selectedSocket).toBeNull();
  });
});

describe("keyboard", () => {
  it("maps 1..5 to the frozen tower order and toggles off on a repeat press", () => {
    const order = ["rail", "prism", "scatter", "well", "star"];
    window.dispatchEvent(key("Escape"));
    order.forEach((towerId, index) => {
      window.dispatchEvent(key(`Digit${index + 1}`));
      expect(input.read().towerId).toBe(towerId);
      window.dispatchEvent(key(`Digit${index + 1}`));
      expect(input.read().towerId).toBeUndefined();
    });
  });

  it("warns instead of queueing an overclock with nothing selected", () => {
    const notices = [];
    document.addEventListener(INPUT_EVENT, (e) => e.detail.notice && notices.push(e.detail.notice));
    window.dispatchEvent(key("KeyF"));
    expect(input.read().overclockSocket).toBeUndefined();
    expect(notices).toEqual([{ text: "先选中一座塔再过载", kind: "warn" }]);
  });

  it("stays out of the way of text entry and browser shortcuts", () => {
    document.body.insertAdjacentHTML("beforeend", '<input id="probe" />');
    const probe = document.getElementById("probe");
    probe.dispatchEvent(key("Digit3"));
    window.dispatchEvent(key("Digit3", { ctrlKey: true }));
    expect(input.read().towerId).toBe("rail");
  });
});

describe("pointer", () => {
  it("selects the picked socket and orders the armed tower onto an empty one", () => {
    picked = 9;
    tap(40, 40);
    expect(input.read()).toMatchObject({ selectedSocket: 9, place: { socket: 9, towerId: "rail" } });
    expect(scene.pick).toHaveBeenCalledWith(40, 40);
  });

  it("only selects when the socket already holds a tower", () => {
    input.dispose();
    const sockets = Array.from({ length: 24 }, (_, i) => ({ i, towerId: i === 9 ? "prism" : null }));
    input = createInput({ canvas, scene, pickSocket: () => picked, getView: () => ({ sockets }) });
    picked = 9;
    tap();
    const out = input.read();
    expect(out.selectedSocket).toBe(9);
    expect(out.place).toBeUndefined();
  });

  it("never places while disarmed", () => {
    window.dispatchEvent(key("Escape"));
    picked = 2;
    tap();
    const out = input.read();
    expect(out.selectedSocket).toBe(2);
    expect(out.place).toBeUndefined();
  });

  it("treats a camera drag as a drag, not a click", () => {
    canvas.dispatchEvent(pointer("pointerdown", 10, 10));
    canvas.dispatchEvent(pointer("pointermove", 60, 30));
    picked = 4;
    canvas.dispatchEvent(pointer("pointerup", 60, 30));
    const out = input.read();
    expect(out.selectedSocket).toBeNull();
    expect(out.place).toBeUndefined();
  });

  it("clears the selection when the ray misses every socket", () => {
    picked = 4;
    tap();
    input.read();
    picked = null;
    tap();
    expect(input.read().selectedSocket).toBeNull();
  });

  it("swallows a throwing pickSocket", () => {
    input.dispose();
    input = createInput({
      canvas,
      scene,
      pickSocket: () => {
        throw new Error("boom");
      },
    });
    expect(() => tap()).not.toThrow();
    expect(input.read().selectedSocket).toBeNull();
  });
});

describe("HUD wiring", () => {
  it("takes tower / overclock / pause straight off sh-ui", () => {
    document.dispatchEvent(new CustomEvent(UI_EVENT, { detail: { action: "tower", towerId: "star" } }));
    expect(input.read().towerId).toBe("star");

    document.dispatchEvent(new CustomEvent(UI_EVENT, { detail: { action: "overclock", socket: 11 } }));
    expect(input.read().overclockSocket).toBe(11);

    document.dispatchEvent(new CustomEvent(UI_EVENT, { detail: { action: "pause" } }));
    expect(input.read().pause).toBe(true);
  });

  it("broadcasts its state back on sh-input", () => {
    const seen = [];
    document.addEventListener(INPUT_EVENT, (e) => seen.push(e.detail));
    window.dispatchEvent(key("Digit4"));
    picked = 6;
    tap();
    expect(seen).toEqual([
      { towerId: "well", selectedSocket: null, paused: false },
      { towerId: "well", selectedSocket: 6, paused: false },
    ]);
  });

  it("ignores unknown sh-ui actions", () => {
    expect(() =>
      document.dispatchEvent(new CustomEvent(UI_EVENT, { detail: { action: "teleport" } })),
    ).not.toThrow();
  });
});

describe("lifecycle", () => {
  it("goes quiet after dispose", () => {
    input.dispose();
    window.dispatchEvent(key("Digit2"));
    picked = 1;
    tap();
    expect(input.read()).toEqual({ selectedSocket: null, pause: false, towerId: "rail" });
  });

  it("picks up the scene once the renderer is ready", () => {
    input.dispose();
    input = createInput({ canvas });
    picked = 8;
    tap();
    expect(input.read().selectedSocket).toBeNull();
    input.setScene(scene, () => picked);
    tap();
    expect(input.read().selectedSocket).toBe(8);
  });
});
