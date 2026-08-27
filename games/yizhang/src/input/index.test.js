// 键鼠 / 触屏的方向映射。这是「上下反了、左右也反了」那条 bug 的看门测试：
// W 必须朝相机水平前向走，鼠标右移必须让角色右转，摇杆与 WASD 共用同一套换算。
//
// vitest 跑在 node 环境（vite.config.js），所以这里自备最小 DOM 替身：
// 只要能 addEventListener / 派发事件就够，input 层不读别的 DOM 能力。

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { cameraYawToSimYaw, yawFromDir } from "../core/view.js";
import { forwardX, forwardZ } from "../sim/math.js";
import { createMatch, getPlayer, step } from "../sim/index.js";
import { createInput, moveFromCameraYaw } from "./index.js";

function fakeNode() {
  const handlers = new Map();
  const node = {
    // 记下注册时的第三参：passive 与否决定 preventDefault 是真拦还是空调用，
    // 触屏那条纪律得连注册方式一起钉。
    bound: [],
    addEventListener(type, fn, options) {
      if (!handlers.has(type)) handlers.set(type, new Set());
      handlers.get(type).add(fn);
      node.bound.push({ type, options });
    },
    removeEventListener(type, fn) {
      handlers.get(type)?.delete(fn);
    },
    emit(type, event = {}) {
      for (const fn of handlers.get(type) || []) fn({ preventDefault() {}, ...event });
    },
  };
  return node;
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

const DT = 1 / 60;

/** 只有本人的裂岛对局，用来把 sample() 的 yaw 真的喂进 sim 看 p.yaw 动不动。 */
function arena(seed = 0x100c) {
  const state = createMatch({ seed, botCount: 0, phase: "arena" });
  return { state, player: getPlayer(state, "p0") };
}

/** 按主循环（main.js collectInputs）的那条路采样并步进一帧。 */
function tick(state) {
  const sampled = input.sample(input.getLook().yaw);
  step(state, { p0: sampled }, DT);
  return sampled;
}

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

// 暂停 / 失焦会把指针锁还给系统。回来点画布重新抓锁的那一下，浏览器只当它是普通
// mousedown —— 既申请了锁，又扇了一巴掌。大厅里 inHub 把 slap 挡住了看不出来，
// 裂岛里就是一记实打实的空挥（还白吃冷却）。这一组钉的就是那道闸：
// 「未持锁的左键只抓锁」「持锁的左键照常扇击」，两边都不许塌。
describe("左键与指针锁：抓锁那一下不算扇击", () => {
  let lockCanvas;
  let lockRequests;

  /** 带 requestPointerLock 的画布替身。真机的锁是异步到手的，这里当场到手就够用了。 */
  function makeLockCanvas({ grant = true, request } = {}) {
    const node = fakeNode();
    lockRequests = 0;
    node.requestPointerLock =
      request ||
      (() => {
        lockRequests += 1;
        if (grant) doc.pointerLockElement = node;
      });
    return node;
  }

  function lockDown() {
    lockCanvas.emit("mousedown", { button: 0 });
  }

  function lockUp() {
    globalThis.window.emit("mouseup", { button: 0 });
  }

  beforeEach(() => {
    input.dispose();
    lockCanvas = makeLockCanvas();
    input = createInput(doc, lockCanvas, { pointerLock: true, yaw: -Math.PI / 2, pitch: 0 });
  });

  it("未持锁的左键只抓锁、不 slap（暂停回来点一下不该空挥）", () => {
    expect(input.isPointerLocked()).toBe(false);
    lockDown();

    expect(lockRequests).toBe(1);
    expect(input.sample(0).slap).toBe(false);
    // hold 也没置位：不然锁一到手就成了「按住连扇」，白挥从一下变成一串
    expect(input.sample(0).slap).toBe(false);
    lockUp();
    expect(input.sample(0).slap).toBe(false);
  });

  it("持锁后的左键照常 slap：吞的只有抓锁那一下", () => {
    lockDown(); // 抓锁，吞
    lockUp();
    expect(input.isPointerLocked()).toBe(true);

    lockDown();
    expect(lockRequests).toBe(1); // 已经持锁，不重复申请
    expect(input.sample(0).slap).toBe(true);
    lockUp();
    expect(input.sample(0).slap).toBe(false);
  });

  it("持锁时按住左键连发：按住型没被这道闸带走", () => {
    lockDown();
    lockUp(); // 锁到手
    lockDown();
    expect(input.sample(0).slap).toBe(true);
    expect(input.sample(0).slap).toBe(true);
    lockUp();
  });

  it("每暂停一趟只吞一下：锁掉了再点还是抓锁，抓回来又能打", () => {
    lockDown();
    lockUp();
    expect(input.sample(0).slap).toBe(false);

    doc.pointerLockElement = null; // 暂停 / Esc 把锁还了
    lockDown();
    lockUp();
    expect(input.sample(0).slap).toBe(false);

    lockDown();
    expect(input.sample(0).slap).toBe(true);
    lockUp();
  });

  it("裂岛里真的没挥出去：喂进 sim 也不发 slapStart、stats.slaps 不动", () => {
    const { state, player } = arena();
    lockDown();
    const seen = [];
    for (let i = 0; i < 40; i++) {
      step(state, { p0: input.sample(0) }, DT);
      seen.push(...state.events.map((e) => e.type));
    }
    lockUp();

    expect(seen).not.toContain("slapStart");
    expect(state.stats.slaps).toBe(0);
    expect(player.attack.phase).toBe("idle");
  });

  it("持锁后同一条路能打出去：这组断言不是因为 sim 收不到输入才通过的", () => {
    const { state } = arena();
    lockDown();
    lockUp(); // 锁到手，这一下被吞

    lockDown();
    const seen = [];
    for (let i = 0; i < 40; i++) {
      step(state, { p0: input.sample(0) }, DT);
      seen.push(...state.events.map((e) => e.type));
    }
    lockUp();

    expect(seen).toContain("slapStart");
    expect(state.stats.slaps).toBeGreaterThan(0);
  });

  it("玩家在设置里关了指针锁：左键一直是扇击兼拖拽，一下都不许吞", () => {
    input.setPointerLock(false);
    lockDown();
    expect(lockRequests).toBe(0);
    expect(input.sample(0).slap).toBe(true);
    // 无锁模式下左键还兼着拖拽转视角
    const before = input.getLook().yaw;
    globalThis.window.emit("mousemove", { movementX: 120, movementY: 0 });
    expect(input.getLook().yaw).not.toBe(before);
    lockUp();
  });

  it("浏览器没有 requestPointerLock：也不吞（判据与真正申请锁的条件同一条）", () => {
    input.dispose();
    const bare = fakeNode(); // 没有 requestPointerLock 的画布
    input = createInput(doc, bare, { pointerLock: true });
    bare.emit("mousedown", { button: 0 });
    expect(input.sample(0).slap).toBe(true);
    globalThis.window.emit("mouseup", { button: 0 });
  });

  it("抓锁被浏览器拒绝（Promise reject）不炸穿输入层，这一下依旧不算扇击", async () => {
    input.dispose();
    lockCanvas = makeLockCanvas({
      request: () => {
        lockRequests += 1;
        return Promise.reject(new Error("SecurityError"));
      },
    });
    input = createInput(doc, lockCanvas, { pointerLock: true });
    expect(() => lockDown()).not.toThrow();
    await Promise.resolve();
    expect(lockRequests).toBe(1);
    expect(input.sample(0).slap).toBe(false);
    lockUp();
  });

  it("右键不受影响：未持锁也照样进拖拽转视角", () => {
    const before = input.getLook().yaw;
    lockCanvas.emit("mousedown", { button: 2 });
    globalThis.window.emit("mousemove", { movementX: 120, movementY: 0 });
    globalThis.window.emit("mouseup", { button: 2 });
    expect(lockRequests).toBe(0);
    expect(input.getLook().yaw).not.toBe(before);
  });
});

// 暂停时输入是关的，但 iOS 的边缘返回、下拉刷新不会跟着一起关。拦手势与收手势是两件事：
// `preventDefault` 必须排在 `enabled` 闸前面，否则玩家在暂停面板上从屏幕边一划就退出了对局。
describe("触屏手势拦截与 enabled 闸的先后", () => {
  function touch(type, over = {}) {
    let prevented = 0;
    canvas.emit(type, {
      preventDefault: () => {
        prevented += 1;
      },
      changedTouches: [{ identifier: 7, clientX: 100, clientY: 100 }],
      ...over,
    });
    return prevented;
  }

  it("touchstart / touchmove 是 passive:false 注册的，preventDefault 才拦得住", () => {
    const optionsFor = (type) => canvas.bound.filter((b) => b.type === type).map((b) => b.options);
    expect(optionsFor("touchstart")).toEqual([{ passive: false }]);
    expect(optionsFor("touchmove")).toEqual([{ passive: false }]);
  });

  it("禁用时 touchstart / touchmove 仍 preventDefault", () => {
    input.setEnabled(false);
    expect(touch("touchstart")).toBe(1);
    expect(touch("touchmove", { changedTouches: [{ identifier: 7, clientX: 180, clientY: 100 }] })).toBe(1);
    input.setEnabled(true);
  });

  it("拦归拦，禁用期间不收手势：暂停时划屏不转视角", () => {
    const before = input.getLook().yaw;
    input.setEnabled(false);
    touch("touchstart");
    touch("touchmove", { changedTouches: [{ identifier: 7, clientX: 260, clientY: 100 }] });
    expect(input.getLook().yaw).toBe(before);
    input.setEnabled(true);
  });

  it("恢复后照常转视角：闸抬起来手势就收得到", () => {
    input.setEnabled(false);
    touch("touchstart");
    input.setEnabled(true);

    const before = input.getLook().yaw;
    touch("touchstart");
    touch("touchmove", { changedTouches: [{ identifier: 7, clientX: 180, clientY: 100 }] });
    canvas.emit("touchend", { changedTouches: [{ identifier: 7, clientX: 180, clientY: 100 }] });
    expect(input.getLook().yaw).not.toBe(before);
  });

  it("启用时也照拦：这道 preventDefault 不因挪到闸前而漏掉", () => {
    expect(touch("touchstart")).toBe(1);
    expect(touch("touchmove", { changedTouches: [{ identifier: 7, clientX: 180, clientY: 100 }] })).toBe(1);
    canvas.emit("touchend", { changedTouches: [{ identifier: 7, clientX: 180, clientY: 100 }] });
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

  it("禁用时 toggleLookMode 也不切：触控钮 / 调试与 V 键同一条路，同一道闸", () => {
    const modes = [];
    input.dispose();
    input = createInput(doc, canvas, {
      pointerLock: false,
      onLookModeChange: (m) => modes.push(m),
    });
    input.setEnabled(false);
    expect(input.toggleLookMode()).toBe("locked");
    expect(input.getLookMode()).toBe("locked");
    // 一次回调都不许发：壳层不该为一次没发生的切换落存档、亮回执
    expect(modes).toEqual([]);
    input.setEnabled(true);
    expect(input.toggleLookMode()).toBe("free");
    expect(modes).toEqual(["free"]);
  });

  it("禁用只是不许切，不是把模式清回缺省：暂停一趟回来还是 free", () => {
    input.setLookMode("free");
    input.setEnabled(false);
    input.setEnabled(true);
    expect(input.getLookMode()).toBe("free");
  });

  it("切换当帧生效：同一回合里 V 之后那次 sample 已经按新模式分派", () => {
    expect(input.sample(0.7).yaw).toBe(cameraYawToSimYaw(0.7));
    press("KeyV");
    expect(input.sample(0.7).yaw).toBeNull();
    release("KeyV");
    press("KeyV");
    expect(input.sample(0.7).yaw).toBe(cameraYawToSimYaw(0.7));
    release("KeyV");
  });

  it("壳层回调抛错不连坐：模式照翻、当帧照分派，异常不炸穿输入层", () => {
    const warn = console.warn;
    const warned = [];
    console.warn = (...args) => warned.push(args);
    try {
      input.dispose();
      input = createInput(doc, canvas, {
        pointerLock: false,
        onLookModeChange: () => {
          throw new Error("存档写不进去");
        },
      });
      expect(() => press("KeyV")).not.toThrow();
      expect(input.getLookMode()).toBe("free");
      expect(input.sample(0.7).yaw).toBeNull();
      expect(warned).toHaveLength(1);
    } finally {
      console.warn = warn;
    }
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

// Input.yaw 是 sim 唯一的朝向入口，两种视角模式在这里分道：locked 把相机角 1:1 送出去
// （打人朝向 = 视线），free 只送走向、静止不送。sim 不感知 lookMode，所以这条分派线一旦
// 塌回「恒送相机角」，free 就会悄悄退化成 locked——本组用真 sim 步进钉死两边的差别。
describe("Input.yaw 按 lookMode 分派", () => {
  describe("locked（缺省）：朝向 = 视线，1:1", () => {
    it("任意相机角都是 cameraYawToSimYaw(θ)，与转视角前的既有行为逐字一致", () => {
      for (const cam of CAMERA_YAWS) {
        expect(input.sample(cam).yaw).toBe(cameraYawToSimYaw(cam));
      }
    });

    it("转视角就改 p.yaw：喂进 sim 一帧后逐位相等", () => {
      const { state, player } = arena();
      tick(state);
      const before = player.yaw;

      dragLook(160);
      const sampled = tick(state);

      expect(sampled.yaw).toBe(cameraYawToSimYaw(input.getLook().yaw));
      expect(player.yaw).toBe(sampled.yaw);
      expect(player.yaw).not.toBe(before);
    });

    it("横着走不改朝向：按 D 时 yaw 仍是视线角，不是走向角", () => {
      press("KeyD");
      const out = input.sample(-Math.PI / 2);
      release("KeyD");
      expect(out.yaw).toBe(cameraYawToSimYaw(-Math.PI / 2));
      expect(out.yaw).not.toBe(yawFromDir(out.moveX, out.moveZ));
    });
  });

  describe("free：镜头与面向解耦", () => {
    beforeEach(() => {
      input.setLookMode("free");
    });

    it("零移动送 null —— 是 null，不是 NaN，也不是 0", () => {
      const out = input.sample(0.9);
      expect(out.yaw).toBe(null);
      expect(Number.isNaN(out.yaw)).toBe(false);
      expect(out.yaw).not.toBe(cameraYawToSimYaw(0.9));
    });

    it("转视角不改 p.yaw：连拖三下镜头，人一动不动", () => {
      const { state, player } = arena();
      player.yaw = 1.234;

      for (const dx of [160, -240, 90]) {
        dragLook(dx);
        const sampled = tick(state);
        expect(sampled.yaw).toBe(null);
        expect(player.yaw).toBe(1.234);
      }
      // 镜头是真的转过了：不是「输入没进来」造成的假通过
      expect(input.getLook().yaw).not.toBe(-Math.PI / 2);
    });

    it("按 D 走时面朝 +X（相机朝 -Z 的缺省机位）", () => {
      press("KeyD");
      const out = input.sample(-Math.PI / 2);
      release("KeyD");

      expect(out.yaw).toBe(yawFromDir(out.moveX, out.moveZ));
      expect(out.yaw).toBeCloseTo(-Math.PI / 2, 12); // yaw=-π/2 就是面朝 +X
      expect(forwardX(out.yaw)).toBeCloseTo(1, 12);
      expect(forwardZ(out.yaw)).toBeCloseTo(0, 12);
      expect(out.yaw).not.toBe(cameraYawToSimYaw(-Math.PI / 2));
    });

    it("任意方向都面朝走向：forward(yaw) 与 moveX/Z 同向", () => {
      const cam = 0.7;
      for (const code of ["KeyW", "KeyA", "KeyS", "KeyD"]) {
        press(code);
        const out = input.sample(cam);
        release(code);
        expect(align({ x: forwardX(out.yaw), z: forwardZ(out.yaw) }, { x: out.moveX, z: out.moveZ })).toBeCloseTo(1, 9);
      }
    });

    it("走着走着转镜头，朝向跟走向不跟镜头", () => {
      const { state, player } = arena();
      press("KeyD");
      const first = tick(state);
      dragLook(200);
      const second = tick(state);
      release("KeyD");

      // 镜头转了，走向跟着相机换算也转了，但朝向始终等于走向、不等于视线
      expect(second.yaw).not.toBe(first.yaw);
      expect(player.yaw).toBe(second.yaw);
      expect(second.yaw).toBe(yawFromDir(second.moveX, second.moveZ));
      expect(second.yaw).not.toBe(cameraYawToSimYaw(input.getLook().yaw));
    });

    it("W+S 抵消出的零位移落回 null，不会被 atan2(-0,-0) 拧成 -π", () => {
      press("KeyW");
      press("KeyS");
      const out = input.sample(0.3);
      release("KeyW");
      release("KeyS");
      expect(Math.hypot(out.moveX, out.moveZ)).toBeLessThan(1e-9);
      expect(out.yaw).toBe(null);
    });

    it("摇杆与键盘同一条分派：推杆也面朝走向，回中即 null", () => {
      const cam = 2.0;
      input.setStick(1, 0);
      const pushed = input.sample(cam);
      input.setStick(0, 0);
      const centered = input.sample(cam);

      expect(pushed.yaw).toBe(yawFromDir(pushed.moveX, pushed.moveZ));
      expect(centered.yaw).toBe(null);
    });

    it("移动换算不分模式：W 照样沿相机水平前向走", () => {
      press("KeyW");
      for (const cam of CAMERA_YAWS) {
        const out = input.sample(cam);
        expect(align({ x: out.moveX, z: out.moveZ }, { x: Math.cos(cam), z: Math.sin(cam) })).toBeCloseTo(1, 9);
      }
      release("KeyW");
    });

    it("禁用输入时送 null 而不是相机角：暂停面板上不该悄悄转身", () => {
      press("KeyD");
      input.setEnabled(false);
      expect(input.sample(0.4).yaw).toBe(null);
      input.setEnabled(true);
    });

    it("V 键切回 locked 立刻恢复 1:1，不留残留", () => {
      expect(input.sample(0.4).yaw).toBe(null);
      press("KeyV");
      release("KeyV");
      expect(input.getLookMode()).toBe("locked");
      expect(input.sample(0.4).yaw).toBe(cameraYawToSimYaw(0.4));
    });
  });

  it("同一串操作在两种模式下给出不同的 p.yaw —— free 不是 locked 的马甲", () => {
    function runOnce(mode) {
      input.setLookMode(mode);
      const { state, player } = arena(0x2f11);
      player.yaw = 0;
      press("KeyD");
      tick(state);
      dragLook(180);
      tick(state);
      release("KeyD");
      return player.yaw;
    }

    const lockedYaw = runOnce("locked");
    input.setLook(-Math.PI / 2, 0);
    const freeYaw = runOnce("free");
    expect(freeYaw).not.toBe(lockedYaw);
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
