// 「我打别人打不到」的看门测试。
//
// 一帧里有两条独立的 yaw 通路，两条都从 `input.getLook().yaw`（**相机方位角**，
// 水平前向 = (cos, sin)）出发：
//
//   画面这条：input.getLook() → core/look.js feedLook → renderer.setLook
//             → YizhangRenderer.sync 拿 lookYaw 当 cameraRig 的 sim yaw → 机位与视线
//   判定这条：input.sample(look.yaw) → cameraYawToSimYaw → step 的 `p.yaw = input.yaw`
//             → combat 的扇形锥（forwardFromYaw）
//
// 两条必须落在同一个世界方向上。之前 feedLook 把相机系的 yaw 原样丢给 setLook，
// 而 cameraRig 按 sim 约定解释它，于是「镜头看的方向」与「角色面向 / 扇击锥」
// 差了一个随视角变化的角（开局默认视角正好差 90°）：玩家对着画面里的人出掌，
// 判定打向另一边 —— 表现就是打不到人。
//
// 这里不新造第四套朝向：判定侧用 sim 的 forwardX/forwardZ，画面侧直接读
// 真实 cameraRig 摆好的 three 相机的世界朝向。

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { Vector3 } from "three";

import { feedLook, lookPayload } from "../src/core/look.js";
import { cameraYawToSimYaw } from "../src/core/view.js";
import { createInput } from "../src/input/index.js";
import { createCamera } from "../src/render/camera.js";
import { YizhangRenderer } from "../src/render/renderer.js";
import { createMatch, step } from "../src/sim/index.js";
import { forwardX, forwardZ } from "../src/sim/math.js";
import { DT, playersOf, resetPlayer } from "./helpers.js";

/** input 层只用 addEventListener / dispatch，给个最小替身即可（同 src/input/index.test.js）。 */
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

/** 只装配视角那条链路的渲染器：WebGL 起不来，但 setLook 与 cameraRig 都是真的。 */
function lookOnlyRenderer() {
  const r = Object.create(YizhangRenderer.prototype);
  r.cameraRig = createCamera({});
  r.lookPitch = null;
  r.lookYaw = null;
  return r;
}

/**
 * 跑够帧让阻尼收敛，返回镜头的水平前向（世界系单位向量）。
 * yaw 的取法与 YizhangRenderer.sync 逐字一致：喂过 lookYaw 就用它，没喂才跟角色朝向。
 */
function settleCamera(r, focus, characterYaw, frames = 420) {
  const vel = new Vector3();
  const yaw = r.lookYaw == null ? characterYaw : r.lookYaw;
  for (let i = 0; i < frames; i++) {
    r.cameraRig.update(DT, focus, yaw, vel, { pitchBias: r._pitchBias() });
  }
  const dir = new Vector3();
  r.cameraRig.camera.getWorldDirection(dir);
  const len = Math.hypot(dir.x, dir.z);
  return { x: dir.x / len, z: dir.z / len };
}

function angleBetween(a, b) {
  const dot = (a.x * b.x + a.z * b.z) / (Math.hypot(a.x, a.z) * Math.hypot(b.x, b.z));
  return Math.acos(Math.max(-1, Math.min(1, dot)));
}

/** 相机呼吸/前引会给视线带一点亚度级抖动，比这更大的偏差就是接线错了。 */
const AIM_TOLERANCE = 0.03; // 弧度，约 1.7°

// 开局默认视角（-π/2）必须在列：那正是玩家一进场就对不准的那一档。
const CAMERA_YAWS = [-Math.PI / 2, 0, 0.9, 2.4, -2.1];

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

describe("feedLook 喂给渲染器的 yaw", () => {
  it("是 sim 那套（yaw=0 面向 -Z），不是输入层的相机方位角", () => {
    for (const cam of CAMERA_YAWS) {
      const payload = lookPayload({ yaw: cam, pitch: 0.1 });
      expect(payload.simYaw).toBeCloseTo(cameraYawToSimYaw(cam), 12);
      expect(payload.yaw).toBeCloseTo(payload.simYaw, 12);
      // 相机系的原值仍然透出，只是换了个不会被误当成 sim yaw 的名字
      expect(payload.cameraYaw).toBe(cam);
    }
  });

  it("渲染器认 simYaw 优先：壳层哪怕把相机系角度写在 yaw 上也不会串空间", () => {
    const r = lookOnlyRenderer();
    const cam = 0.9;
    r.setLook({ yaw: cam, simYaw: cameraYawToSimYaw(cam), pitch: 0.2 });
    expect(r.lookYaw).toBeCloseTo(cameraYawToSimYaw(cam), 12);
  });

  it("整条喂入链路落到 lookYaw 上的就是 simYaw", () => {
    const r = lookOnlyRenderer();
    for (const cam of CAMERA_YAWS) {
      input.setLook(cam, 0.1);
      expect(feedLook(r, input.getLook()).fed).toBe("setLook");
      expect(r.lookYaw).toBeCloseTo(cameraYawToSimYaw(cam), 12);
    }
  });
});

describe("相机前向与扇击判定前向", () => {
  it("镜头看向哪，角色就面向哪（每个视角都对得上）", () => {
    for (const cam of CAMERA_YAWS) {
      input.setLook(cam, 0);
      const look = input.getLook();
      const simYaw = input.sample(look.yaw).yaw;

      const r = lookOnlyRenderer();
      feedLook(r, look);
      const camForward = settleCamera(r, new Vector3(0, 0, 0), simYaw);
      const faceForward = { x: forwardX(simYaw), z: forwardZ(simYaw) };

      expect(angleBetween(camForward, faceForward)).toBeLessThan(AIM_TOLERANCE);
    }
  });

  it("W 走的世界方向也是镜头前方（走位与视线同一个空间）", () => {
    for (const cam of CAMERA_YAWS) {
      input.setLook(cam, 0);
      const look = input.getLook();
      globalThis.window.emit("keydown", { code: "KeyW" });
      const sampled = input.sample(look.yaw);
      globalThis.window.emit("keyup", { code: "KeyW" });

      const r = lookOnlyRenderer();
      feedLook(r, look);
      const camForward = settleCamera(r, new Vector3(0, 0, 0), sampled.yaw);

      expect(angleBetween({ x: sampled.moveX, z: sampled.moveZ }, camForward)).toBeLessThan(
        AIM_TOLERANCE
      );
    }
  });
});

describe("对着画面里的人出掌", () => {
  /**
   * 把对手摆在镜头正前方 `distance` 米处，按住扇击跑 `seconds`，回收命中事件。
   * 这是「玩家看见谁就打谁」的最小可执行版本：目标位置完全由镜头前向决定，
   * 不参考角色的 sim 朝向 —— 两者不一致的话这里就打空。
   */
  function slapWhatYouSee(cam, { distance = 1.8, seconds = 0.6 } = {}) {
    const state = createMatch({ phase: "arena", botCount: 1, seed: 7 });
    const players = playersOf(state);
    const attacker = players.find((p) => p.id === "p0");
    const target = players.find((p) => p.id !== "p0");
    resetPlayer(attacker);
    resetPlayer(target);
    attacker.x = 0;
    attacker.y = 0;
    attacker.z = 0;
    attacker.invulnT = 0;
    target.invulnT = 0;

    input.setLook(cam, 0);
    const look = input.getLook();
    const sampled = input.sample(look.yaw);
    attacker.yaw = sampled.yaw;

    const r = lookOnlyRenderer();
    feedLook(r, look);
    const camForward = settleCamera(r, new Vector3(attacker.x, attacker.y, attacker.z), attacker.yaw);

    target.x = attacker.x + camForward.x * distance;
    target.y = attacker.y;
    target.z = attacker.z + camForward.z * distance;
    target.yaw = attacker.yaw + Math.PI;

    const hits = [];
    const frames = Math.ceil(seconds / DT);
    for (let i = 0; i < frames; i++) {
      step(state, { [attacker.id]: { ...sampled, slap: true } }, DT);
      for (const e of state.events) {
        if (e.type === "hit" && e.id === attacker.id) hits.push(e);
      }
    }
    return { hits, target, camForward };
  }

  it("每个视角都打得中站在镜头正前方的对手", () => {
    for (const cam of CAMERA_YAWS) {
      const { hits, target } = slapWhatYouSee(cam);
      expect(hits.length, `相机 yaw=${cam.toFixed(2)} 时对着正前方的人扇空了`).toBeGreaterThan(0);
      expect(hits[0].targetId).toBe(target.id);
    }
  });

  it("站在镜头正后方的人打不到（锥不是全向的，上一条不是恒真）", () => {
    for (const cam of CAMERA_YAWS) {
      const { hits } = slapWhatYouSee(cam, { distance: -1.8 });
      expect(hits.length, `相机 yaw=${cam.toFixed(2)} 时背后的人被扇到了`).toBe(0);
    }
  });
});
