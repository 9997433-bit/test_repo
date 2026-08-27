// 键鼠 / 触屏的方向映射。这是「上下反了、左右也反了」那条 bug 的看门测试：
// W 必须朝相机水平前向走，鼠标右移必须让角色右转，摇杆与 WASD 共用同一套换算。
//
// vitest 跑在 node 环境（vite.config.js），所以这里自备最小 DOM 替身：
// 只要能 addEventListener / 派发事件就够，input 层不读别的 DOM 能力。

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { cameraYawToSimYaw } from "../core/view.js";
import { forwardX, forwardZ } from "../sim/math.js";
import { createInput, moveFromCameraYaw } from "./index.js";

function fakeNode() {
  const handlers = new Map();
  return {
    addEventListener(type, fn) {
      if (!handlers.has(type)) handlers.set(type, new Set());
      handlers.get(type).add(fn);
    },
    removeEventListener(type, fn) {
      handlers.get(type)?.delete(fn);
    },
    emit(type, event = {}) {
      for (const fn of handlers.get(type) || []) fn({ preventDefault() {}, ...event });
    },
  };
}

let doc;
let canvas;
let input;

beforeEach(() => {
  doc = fakeNode();
  doc.hidden = false;
  doc.pointerLockElement = null;
  canvas = fakeNode();
  globalThis.window = fakeNode();
  input = createInput(doc, canvas, { pointerLock: false, yaw: -Math.PI / 2, pitch: 0 });
});

afterEach(() => {
  input.dispose();
  delete globalThis.window;
});

function press(code) {
  globalThis.window.emit("keydown", { code });
}

function release(code) {
  globalThis.window.emit("keyup", { code });
}

/** 右键拖拽转视角：先按下再移动，与真机同一条路径。 */
function dragLook(dx, dy = 0) {
  canvas.emit("mousedown", { button: 2 });
  globalThis.window.emit("mousemove", { movementX: dx, movementY: dy });
  globalThis.window.emit("mouseup", { button: 2 });
}

/** 世界向量与参考向量的夹角余弦。 */
function align(v, ref) {
  const len = Math.hypot(v.x, v.z) * Math.hypot(ref.x, ref.z);
  return len < 1e-9 ? 0 : (v.x * ref.x + v.z * ref.z) / len;
}

const CAMERA_YAWS = [-Math.PI / 2, 0, 0.9, 2.4, -2.1];

describe("moveFromCameraYaw", () => {
  it("W 沿相机水平前向，S 沿反向", () => {
    for (const cam of CAMERA_YAWS) {
      const forward = { x: Math.cos(cam), z: Math.sin(cam) };
      expect(align(moveFromCameraYaw(0, -1, cam), forward)).toBeCloseTo(1, 9);
      expect(align(moveFromCameraYaw(0, 1, cam), forward)).toBeCloseTo(-1, 9);
    }
  });

  it("D 走屏幕右侧 right=(-sin, cos)，A 走左侧", () => {
    for (const cam of CAMERA_YAWS) {
      const right = { x: -Math.sin(cam), z: Math.cos(cam) };
      expect(align(moveFromCameraYaw(1, 0, cam), right)).toBeCloseTo(1, 9);
      expect(align(moveFromCameraYaw(-1, 0, cam), right)).toBeCloseTo(-1, 9);
    }
  });
});

describe("input.sample 的世界位移", () => {
  it("W 的世界位移与相机水平前向同向（不是反向）", () => {
    press("KeyW");
    for (const cam of CAMERA_YAWS) {
      const out = input.sample(cam);
      const forward = { x: Math.cos(cam), z: Math.sin(cam) };
      expect(align({ x: out.moveX, z: out.moveZ }, forward)).toBeCloseTo(1, 9);
    }
    release("KeyW");
  });

  it("W 的世界位移就是 sim 朝向的前方：moveX/Z == forwardX/Z(out.yaw)", () => {
    press("KeyW");
    for (const cam of CAMERA_YAWS) {
      const out = input.sample(cam);
      expect(out.yaw).toBeCloseTo(cameraYawToSimYaw(cam), 9);
      expect(out.moveX).toBeCloseTo(forwardX(out.yaw), 9);
      expect(out.moveZ).toBeCloseTo(forwardZ(out.yaw), 9);
    }
    release("KeyW");
  });

  it("S 后退、A 屏幕左、D 屏幕右", () => {
    const cam = 0.7;
    const forward = { x: Math.cos(cam), z: Math.sin(cam) };
    const right = { x: -Math.sin(cam), z: Math.cos(cam) };

    press("KeyS");
    let out = input.sample(cam);
    expect(align({ x: out.moveX, z: out.moveZ }, forward)).toBeCloseTo(-1, 9);
    release("KeyS");

    press("KeyA");
    out = input.sample(cam);
    expect(align({ x: out.moveX, z: out.moveZ }, right)).toBeCloseTo(-1, 9);
    release("KeyA");

    press("KeyD");
    out = input.sample(cam);
    expect(align({ x: out.moveX, z: out.moveZ }, right)).toBeCloseTo(1, 9);
    release("KeyD");
  });

  it("方向键与 WASD 同一套映射", () => {
    const cam = -1.3;
    press("KeyW");
    const wasd = input.sample(cam);
    release("KeyW");
    press("ArrowUp");
    const arrows = input.sample(cam);
    release("ArrowUp");
    expect(arrows.moveX).toBeCloseTo(wasd.moveX, 12);
    expect(arrows.moveZ).toBeCloseTo(wasd.moveZ, 12);
  });

  it("触屏摇杆与 WASD 共用同一套换算", () => {
    const cam = 2.0;
    press("KeyW");
    const keyboardW = input.sample(cam);
    release("KeyW");
    press("KeyD");
    const keyboardD = input.sample(cam);
    release("KeyD");

    input.setStick(0, -1);
    const stickUp = input.sample(cam);
    input.setStick(1, 0);
    const stickRight = input.sample(cam);
    input.setStick(0, 0);

    expect(stickUp.moveX).toBeCloseTo(keyboardW.moveX, 9);
    expect(stickUp.moveZ).toBeCloseTo(keyboardW.moveZ, 9);
    expect(stickRight.moveX).toBeCloseTo(keyboardD.moveX, 9);
    expect(stickRight.moveZ).toBeCloseTo(keyboardD.moveZ, 9);
  });

  it("斜向不加速：合成位移长度不超过 1", () => {
    press("KeyW");
    press("KeyD");
    const out = input.sample(0.3);
    expect(Math.hypot(out.moveX, out.moveZ)).toBeLessThanOrEqual(1 + 1e-9);
    release("KeyW");
    release("KeyD");
  });
});

describe("安全区的 interact 采样", () => {
  it("默认在裂岛：E 是技能，不发 interact", () => {
    expect(input.getPhase()).toBe("arena");
    press("KeyE");
    const out = input.sample(0);
    expect(out.skill).toBe(true);
    expect(out.interact).toBe(true); // sim 在裂岛会忽略它，发不发都不影响判定
    release("KeyE");
  });

  it("hub 里 E 只发 interact，不出技能也不出扇击", () => {
    input.setPhase("hub");
    press("KeyE");
    canvas.emit("mousedown", { button: 0 });
    const out = input.sample(0);
    expect(out.interact).toBe(true);
    expect(out.skill).toBe(false);
    expect(out.slap).toBe(false);
    release("KeyE");
    globalThis.window.emit("mouseup", { button: 0 });
  });

  it("按住 E 会持续为真（边沿由 sim 的 prev.interact 判），松开即假", () => {
    input.setPhase("hub");
    press("KeyE");
    expect(input.sample(0).interact).toBe(true);
    expect(input.sample(0).interact).toBe(true);
    release("KeyE");
    expect(input.sample(0).interact).toBe(false);
  });

  it("同一帧内按下又松开的短点触不会漏（边沿补一次）", () => {
    input.setPhase("hub");
    press("KeyE");
    release("KeyE");
    expect(input.sample(0).interact).toBe(true);
    expect(input.sample(0).interact).toBe(false);
  });

  it("触控「选」按钮与 E 走同一条 interact 通路，可指定槽位", () => {
    input.setPhase("hub");
    input.setTouchButton("interact", true, { slot: "off" });
    const out = input.sample(0);
    expect(out.interact).toBe(true);
    expect(out.interactSlot).toBe("off");
    input.setTouchButton("interact", false);
    const after = input.sample(0);
    expect(after.interact).toBe(false);
    expect(after.interactSlot).toBe(null);
  });

  it("切区会清掉按住态：在大厅按着 E 过门，不会在裂岛立刻放技能", () => {
    input.setPhase("hub");
    press("KeyE");
    expect(input.sample(0).interact).toBe(true);
    input.setPhase("arena");
    expect(input.sample(0).skill).toBe(false);
  });

  it("hub 里移动与跳/冲照旧：安全区只关掉出招", () => {
    input.setPhase("hub");
    press("KeyW");
    press("Space");
    const out = input.sample(0.7);
    expect(Math.hypot(out.moveX, out.moveZ)).toBeCloseTo(1, 9);
    expect(out.jump).toBe(true);
    release("KeyW");
    release("Space");
  });

  it("禁用输入时 interact 也不外泄", () => {
    input.setPhase("hub");
    press("KeyE");
    input.setEnabled(false);
    expect(input.sample(0).interact).toBe(false);
    input.setEnabled(true);
  });
});

describe("视角模式（lookMode / V 键）", () => {
  it("产品缺省 locked（固定人物视角），getLook 随帧透出", () => {
    expect(input.getLookMode()).toBe("locked");
    expect(input.getLook().lookMode).toBe("locked");
  });

  it("opts.lookMode 能把开局值设为 free；认不出的值落回 locked", () => {
    input.dispose();
    input = createInput(doc, canvas, { pointerLock: false, lookMode: "free" });
    expect(input.getLookMode()).toBe("free");
    input.dispose();
    input = createInput(doc, canvas, { pointerLock: false, lookMode: "orbit" });
    expect(input.getLookMode()).toBe("locked");
  });

  it("V 键在 locked/free 间来回切，并回调 onLookModeChange（壳层落存档 + 提示用）", () => {
    const modes = [];
    input.dispose();
    input = createInput(doc, canvas, {
      pointerLock: false,
      onLookModeChange: (m) => modes.push(m),
    });
    press("KeyV");
    expect(input.getLookMode()).toBe("free");
    expect(input.getLook().lookMode).toBe("free");
    release("KeyV");
    press("KeyV");
    expect(input.getLookMode()).toBe("locked");
    release("KeyV");
    expect(modes).toEqual(["free", "locked"]);
  });

  it("长按 V（e.repeat）不振荡：按住只算一次", () => {
    press("KeyV");
    expect(input.getLookMode()).toBe("free");
    globalThis.window.emit("keydown", { code: "KeyV", repeat: true });
    globalThis.window.emit("keydown", { code: "KeyV", repeat: true });
    expect(input.getLookMode()).toBe("free");
    release("KeyV");
  });

  it("V 不抢既有键位：同帧 WASD/空格/E 全部照常，切换也真的发生了", () => {
    press("KeyW");
    press("Space");
    press("KeyE");
    press("KeyV");
    const out = input.sample(0.7);
    expect(Math.hypot(out.moveX, out.moveZ)).toBeCloseTo(1, 9);
    expect(out.jump).toBe(true);
    expect(out.skill).toBe(true);
    expect(input.getLookMode()).toBe("free");
    release("KeyW");
    release("Space");
    release("KeyE");
    release("KeyV");
  });

  it("setLookMode 是静默 setter：归一非法值、不触发回调（设置面板不弹双提示）", () => {
    const modes = [];
    input.dispose();
    input = createInput(doc, canvas, {
      pointerLock: false,
      onLookModeChange: (m) => modes.push(m),
    });
    expect(input.setLookMode("free")).toBe("free");
    expect(input.setLookMode("banana")).toBe("free"); // 认不出保持原值，不偷偷回 locked
    expect(input.setLookMode("locked")).toBe("locked");
    expect(modes).toEqual([]);
  });

  it("toggleLookMode API 与 V 键同一条路径（触控钮/调试可走它）", () => {
    const modes = [];
    input.dispose();
    input = createInput(doc, canvas, {
      pointerLock: false,
      onLookModeChange: (m) => modes.push(m),
    });
    expect(input.toggleLookMode()).toBe("free");
    expect(modes).toEqual(["free"]);
  });

  it("禁用输入时 V 不生效：暂停面板上手滑不换模式", () => {
    input.setEnabled(false);
    press("KeyV");
    expect(input.getLookMode()).toBe("locked");
    input.setEnabled(true);
  });

  it("切换视角模式不动 yaw/pitch：机位数值与模式解耦", () => {
    dragLook(80, 40);
    const before = input.getLook();
    press("KeyV");
    release("KeyV");
    const after = input.getLook();
    expect(after.yaw).toBe(before.yaw);
    expect(after.pitch).toBe(before.pitch);
    expect(after.lookMode).toBe("free");
  });
});

describe("鼠标转向", () => {
  it("鼠标右移让角色右转（sim yaw 变小，前向倒向原来的右手边）", () => {
    const before = input.sample().yaw;
    dragLook(120);
    const after = input.sample().yaw;

    expect(input.getLook().yaw).toBeGreaterThan(-Math.PI / 2);
    expect(after).toBeLessThan(before);
    const rightX = Math.cos(before);
    const rightZ = -Math.sin(before);
    expect(forwardX(after) * rightX + forwardZ(after) * rightZ).toBeGreaterThan(0);
  });

  it("鼠标左移让角色左转", () => {
    const before = input.sample().yaw;
    dragLook(-120);
    const after = input.sample().yaw;
    expect(after).toBeGreaterThan(before);
  });

  it("转身后 W 依然朝新的镜头前方走", () => {
    dragLook(200);
    press("KeyW");
    const cam = input.getLook().yaw;
    const out = input.sample(cam);
    expect(align({ x: out.moveX, z: out.moveZ }, { x: Math.cos(cam), z: Math.sin(cam) })).toBeCloseTo(1, 9);
    release("KeyW");
  });

  it("触屏拖拽与鼠标同向：右滑也是右转", () => {
    canvas.emit("touchstart", { changedTouches: [{ identifier: 1, clientX: 100, clientY: 100 }] });
    const before = input.sample().yaw;
    canvas.emit("touchmove", { changedTouches: [{ identifier: 1, clientX: 180, clientY: 100 }] });
    const after = input.sample().yaw;
    canvas.emit("touchend", { changedTouches: [{ identifier: 1, clientX: 180, clientY: 100 }] });
    expect(after).toBeLessThan(before);
  });

  it("俯仰有夹角限制，翻不过头顶", () => {
    dragLook(0, 100000);
    expect(Math.abs(input.getLook().pitch)).toBeLessThanOrEqual(Math.PI / 2.6 + 1e-9);
    dragLook(0, -200000);
    expect(Math.abs(input.getLook().pitch)).toBeLessThanOrEqual(Math.PI / 2.6 + 1e-9);
  });
});
