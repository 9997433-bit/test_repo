// @vitest-environment jsdom
//
// Round 3 SOTA 边角：**真输入层 → 真壳层 → 真 HUD** 一条链上钉切视角的三个角落。
// hud.test.js / shell.test.js 拿的是壳层自己的 setLookMode 单口，input/index.test.js
// 只看输入层内部；这三处各自绿着，链子中间那两个接头仍然没人锁。这里把 V 键、
// 存档回调、HUD 回执接成一条，专钉下面三件在实机上才露头的事：
//
//   1. 切 V 当帧生效 —— 同一次事件回合里 sample() 就按新模式分派，不等下一帧；
//      壳层回调（落存档 / 弹回执）抛错也不许把这次翻转吞回去。
//   2. 连按不叠两套 HUD —— 屏上永远只有一枚 .yz-look-flash、一份模式镜像，
//      中央短讯不跟着开；计时从**最后一次**按下算 0.9s。
//   3. 输入禁用不切模式 —— 暂停 / 结算 / 失焦期间 V 键与触控钮（同一条
//      toggleLookMode 路径）都不换模式，HUD 也不许亮回执。

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { GLOVES, GLOVE_BY_ID, SKINS } from "../data/index.js";
import { resolveSkins } from "../core/skins.js";
import { cameraYawToSimYaw, yawFromDir } from "../core/view.js";
import { createInput } from "../input/index.js";
import { createShell } from "./shell.js";

const TABLE = resolveSkins({ SKINS, DEFAULT_SKIN_ID: "drifter" });

function noopBag() {
  return new Proxy({}, { get: () => () => {} });
}

/** 把输入层与壳层按 main.js 的接法接起来：V → onLookModeChange → 落存档 + shell 镜像。 */
function wire({ onSave } = {}) {
  const root = document.createElement("div");
  document.body.appendChild(root);
  const canvas = document.createElement("canvas");
  document.body.appendChild(canvas);

  let shell = null;
  const input = createInput(document, canvas, {
    pointerLock: false,
    onLookModeChange: (mode) => {
      if (onSave) onSave(mode);
      shell.setLookMode(mode);
    },
  });
  shell = createShell({
    root,
    gloves: GLOVES,
    gloveById: GLOVE_BY_ID,
    skinTable: TABLE,
    save: { loadout: { main: "cotton", off: "cotton" }, skinId: "drifter", unlocked: ["cotton"] },
    audio: noopBag(),
    input,
    matchConfig: { killsToWin: 7, switchLock: 0.4 },
    isUnlocked: () => true,
    unlockTextOf: () => "局内挑战",
    lookMode: input.getLookMode(),
    callbacks: {},
  });
  shell.showMatch();
  input.setEnabled(true);
  return { input, shell, root, canvas };
}

function pressV() {
  window.dispatchEvent(new KeyboardEvent("keydown", { code: "KeyV" }));
  window.dispatchEvent(new KeyboardEvent("keyup", { code: "KeyV" }));
}

function press(code) {
  window.dispatchEvent(new KeyboardEvent("keydown", { code }));
}

function flashOf(root) {
  return root.querySelector(".yz-look-flash");
}

let live = null;

beforeEach(() => {
  document.body.innerHTML = "";
  delete document.documentElement.dataset.touch;
});

afterEach(() => {
  if (live) live.input.dispose();
  live = null;
  vi.useRealTimers();
});

describe("切 V：当帧就换 sample 分派", () => {
  it("同一回合里按下 V，紧接着那次 sample 已经按新模式分派（不等下一帧）", () => {
    live = wire();
    const { input } = live;
    const cameraYaw = 0.63;

    expect(input.sample(cameraYaw).yaw).toBe(cameraYawToSimYaw(cameraYaw));
    pressV();
    // 静止的 free：当帧就该是「保持朝向」的 null，而不是还在送视线角
    expect(input.getLookMode()).toBe("free");
    expect(input.sample(cameraYaw).yaw).toBeNull();
    pressV();
    expect(input.sample(cameraYaw).yaw).toBe(cameraYawToSimYaw(cameraYaw));
  });

  it("走着切也是当帧：locked 送视线、free 当帧改送走向角", () => {
    live = wire();
    const { input } = live;
    const cameraYaw = -1.1;
    press("KeyW");

    const locked = input.sample(cameraYaw);
    expect(locked.yaw).toBe(cameraYawToSimYaw(cameraYaw));

    pressV();
    const free = input.sample(cameraYaw);
    expect(free.yaw).toBe(yawFromDir(free.moveX, free.moveZ));
    // 位移一个字节都不许因为切模式而变：两模式共用同一条移动换算
    expect(free.moveX).toBeCloseTo(locked.moveX, 12);
    expect(free.moveZ).toBeCloseTo(locked.moveZ, 12);
  });

  it("壳层回调抛错也不回滚：模式已经翻了，当帧 sample 照新模式走", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    live = wire({
      onSave: () => {
        throw new Error("存档写不进去");
      },
    });
    const { input } = live;

    expect(() => pressV()).not.toThrow();
    expect(input.getLookMode()).toBe("free");
    expect(input.sample(0.4).yaw).toBeNull();
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});

describe("连按 V：屏上不叠第二套 HUD", () => {
  it("按 7 下只有一枚回执、一份镜像，中央短讯不跟着开", () => {
    vi.useFakeTimers();
    live = wire();
    const { input, root } = live;
    const LABEL = { locked: "视角锁定", free: "自由视角" };

    for (let i = 0; i < 7; i += 1) {
      pressV();
      vi.advanceTimersByTime(40);
      // 每一下之后 HUD 镜像与文案都必须与输入层权威一致，不许错半拍
      expect(root.querySelector("#hud").dataset.look).toBe(input.getLookMode());
      expect(flashOf(root).textContent).toContain(LABEL[input.getLookMode()]);
      expect(root.querySelectorAll(".yz-look-flash")).toHaveLength(1);
    }

    // 奇数下：停在 free
    expect(input.getLookMode()).toBe("free");
    expect(flashOf(root).classList.contains("is-on")).toBe(true);
    expect(root.querySelector(".yz-center-note").hidden).toBe(true);
    expect(root.querySelectorAll(".yz-look-flash.is-on")).toHaveLength(1);
  });

  it("计时从最后一次按下算：连按不会让回执提前灭，也不会赖着不走", () => {
    vi.useFakeTimers();
    live = wire();
    const { root } = live;

    pressV();
    vi.advanceTimersByTime(800);
    pressV();
    vi.advanceTimersByTime(800);
    expect(flashOf(root).classList.contains("is-on")).toBe(true);
    vi.advanceTimersByTime(120);
    expect(flashOf(root).classList.contains("is-on")).toBe(false);
  });

  it("大厅里连按也不叠：hub HUD 与战斗 HUD 仍是同一块，phase 不动", () => {
    live = wire();
    const { input, shell, root } = live;
    input.setPhase("hub");
    shell.setPhase("hub");

    pressV();
    pressV();
    pressV();

    const hudEl = root.querySelector("#hud");
    expect(input.getLookMode()).toBe("free");
    expect(hudEl.dataset.look).toBe("free");
    // 大厅那张脸不许被这一下顶掉，也不许再开第二个全屏层
    expect(hudEl.dataset.phase).toBe("hub");
    expect(root.querySelectorAll("#hud")).toHaveLength(1);
    expect(root.querySelectorAll(".yz-hub-hud")).toHaveLength(1);
    expect(root.querySelectorAll(".yz-look-flash")).toHaveLength(1);
    expect(root.querySelector(".yz-center-note").hidden).toBe(true);
  });

  it("连按到暂停板正开着也只有一块板：分段器不叠、灯跟着当前模式", () => {
    live = wire();
    const { shell, root } = live;
    shell.showPause();
    shell.setLookMode("free");
    shell.setLookMode("locked");
    shell.setLookMode("free");
    expect(root.querySelectorAll(".yz-screen--frost .yz-panel")).toHaveLength(1);
    const opts = [...root.querySelectorAll(".yz-screen--frost .yz-seg-opt")].filter((b) =>
      ["固定视角", "自由视角"].includes(b.textContent)
    );
    expect(opts).toHaveLength(2);
    expect(opts.map((b) => b.classList.contains("is-on"))).toEqual([false, true]);
  });
});

describe("输入禁用：任何切换路径都不换模式", () => {
  it("暂停期间按 V 不换模式，也不亮回执", () => {
    live = wire();
    const { input, shell, root } = live;
    input.setEnabled(false);
    shell.showPause();

    pressV();
    pressV();
    expect(input.getLookMode()).toBe("locked");
    expect(root.querySelector("#hud").dataset.look).toBe("locked");
    expect(flashOf(root).classList.contains("is-on")).toBe(false);
  });

  it("触控钮 / 调试走的 toggleLookMode 是同一条路：禁用时同样不换", () => {
    live = wire();
    const { input, root } = live;
    input.setEnabled(false);

    expect(input.toggleLookMode()).toBe("locked");
    expect(input.getLookMode()).toBe("locked");
    expect(root.querySelector("#hud").dataset.look).toBe("locked");
    expect(flashOf(root).classList.contains("is-on")).toBe(false);
  });

  it("设置面板那条静默路不受禁用影响（暂停时改设置照样算数）", () => {
    live = wire();
    const { input, shell, root } = live;
    input.setEnabled(false);
    // main.applySettings 的接法：input 先收敛，再拿收敛值回喂壳层
    input.setLookMode("free");
    shell.setLookMode(input.getLookMode());
    expect(input.getLookMode()).toBe("free");
    expect(root.querySelector("#hud").dataset.look).toBe("free");
  });

  it("重新启用后 V 立刻恢复：禁用期间那几下不许攒着补发", () => {
    live = wire();
    const { input } = live;
    input.setEnabled(false);
    pressV();
    pressV();
    pressV();
    input.setEnabled(true);
    expect(input.getLookMode()).toBe("locked");
    pressV();
    expect(input.getLookMode()).toBe("free");
    expect(input.sample(0.2).yaw).toBeNull();
  });
});
