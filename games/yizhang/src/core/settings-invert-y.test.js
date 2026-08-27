// Y 轴反转的落盘闭环（Round 4 · O4 收口）。
//
// 这一项的三段早就各自到位：`storage.js` 的 `DEFAULTS.invertY`、`input.setInvertY` /
// `applyLook` 的定号、以及 F2 在设置板加的那格开关。缺的是中间那一节 —— 面板改完
// 只即时打了输入层，`main.applySettings` 的 `updateSave` 补丁里没有 `invertY`，
// 于是刷新一下开关就弹回「关」。本文件钉的就是这一节：
//
//   1. 真存档往返：写盘 → 换一份模块实例重读（等价于刷新）→ 值还在 → 真输入层
//      按这个值开起来，俯仰方向确实是反的。
//   2. 缺席语义：老档没有这个字段落 false；`invertY: undefined` 会把 key 整只抹掉 ——
//      这正是 `applySettings` 里那道「面板没报就沿用现值」的存在理由。
//   3. main 的接线守门（源码断言，与 combat / sim / tuning 几处同一套路数）：
//      `main.js` 不是可导入的单元（进来就 boot 真渲染器），但它那几行接线一旦掉回去，
//      上面两组照样全绿 —— 所以这里直接对着源文本钉。

import { readFileSync } from "node:fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createInput } from "../input/index.js";

const MAIN_SRC = readFileSync(new URL("../main.js", import.meta.url), "utf8");

/** 一份能跨「刷新」活下来的 localStorage 替身：模块换实例，盘上的字节不动。 */
function fakeDisk(seed) {
  const map = new Map();
  if (seed) map.set("yizhang-save-v1", JSON.stringify(seed));
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: (k) => map.delete(k),
    read: () => JSON.parse(map.get("yizhang-save-v1")),
    hasKey: (k) => Object.prototype.hasOwnProperty.call(JSON.parse(map.get("yizhang-save-v1")), k),
  };
}

/** 换一份 storage 模块实例 = 刷新页面：模块级 cache 清零，盘还是那块盘。 */
function reboot() {
  vi.resetModules();
  return import("./storage.js");
}

// ---- 输入层那一侧：最小 DOM 替身，与 src/input/index.test.js 同一套 ----

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

/** 按存档开一只输入层，右键上拖 100px，返回俯仰的净变化量。 */
function pitchDeltaFromSave(save) {
  const doc = fakeNode();
  doc.pointerLockElement = null;
  const canvas = fakeNode();
  globalThis.window = fakeNode();
  const input = createInput(doc, canvas, {
    pointerLock: false,
    pitch: 0,
    invertY: save.invertY,
  });
  canvas.emit("mousedown", { button: 2 });
  globalThis.window.emit("mousemove", { movementX: 0, movementY: 100 });
  globalThis.window.emit("mouseup", { button: 2 });
  const { pitch } = input.getLook();
  input.dispose();
  delete globalThis.window;
  return pitch;
}

let disk = null;

beforeEach(() => {
  vi.resetModules();
});

afterEach(() => {
  delete globalThis.localStorage;
  delete globalThis.window;
  disk = null;
});

describe("invertY 落盘：刷新后开关仍在", () => {
  it("面板打开反转 → 落盘 → 刷新重读，还是开着", async () => {
    disk = fakeDisk({ version: 1, loadout: { main: "frost", off: "spring" } });
    globalThis.localStorage = disk;

    const first = await reboot();
    // main.applySettings 的落盘口径：面板报什么就写什么
    const next = first.updateSave({ invertY: true });
    expect(next.invertY).toBe(true);
    expect(disk.read().invertY).toBe(true);

    // 刷新：模块换实例，盘不动
    const second = await reboot();
    expect(second.loadSave().invertY).toBe(true);
    // 顺手确认没有殃及别的字段
    expect(second.loadSave().loadout).toEqual({ main: "frost", off: "spring" });
  });

  it("刷新后开起来的输入层真的是反的：俯仰符号跟着存档翻", async () => {
    disk = fakeDisk(null);
    globalThis.localStorage = disk;

    const boot = await reboot();
    boot.updateSave({ invertY: true });
    const on = (await reboot()).loadSave();
    expect(on.invertY).toBe(true);

    disk = fakeDisk(null);
    globalThis.localStorage = disk;
    const off = (await reboot()).loadSave();
    expect(off.invertY).toBe(false);

    const upWhenOff = pitchDeltaFromSave(off);
    const upWhenOn = pitchDeltaFromSave(on);
    expect(upWhenOff).not.toBe(0);
    expect(Math.sign(upWhenOn)).toBe(-Math.sign(upWhenOff));
    expect(upWhenOn).toBeCloseTo(-upWhenOff, 12);
  });

  it("关回去也落盘：刷新后是关着的，不是又弹回开", async () => {
    disk = fakeDisk({ version: 1, invertY: true });
    globalThis.localStorage = disk;

    const first = await reboot();
    expect(first.loadSave().invertY).toBe(true);
    first.updateSave({ invertY: false });

    const second = await reboot();
    expect(second.loadSave().invertY).toBe(false);
    expect(pitchDeltaFromSave(second.loadSave())).toBeGreaterThan(0);
  });

  it("老档（没有 invertY 字段）照读，补 false，不清档", async () => {
    disk = fakeDisk({ version: 1, unlocked: ["cotton", "gale"], lookSensitivity: 1.4 });
    globalThis.localStorage = disk;

    const save = (await reboot()).loadSave();
    expect(save.invertY).toBe(false);
    expect(save.unlocked).toEqual(["cotton", "gale"]);
    expect(save.lookSensitivity).toBe(1.4);
  });

  it("`invertY: undefined` 会把 key 整只抹掉 —— main 那道「没报就沿用现值」的理由", async () => {
    disk = fakeDisk({ version: 1, invertY: true });
    globalThis.localStorage = disk;

    const first = await reboot();
    // updateSave 是展开合并、saveSave 又走 JSON.stringify：undefined 不会写进盘
    first.updateSave({ invertY: undefined });
    expect(disk.hasKey("invertY")).toBe(false);
    // 于是刷新之后 loadSave 补默认值，玩家开着的反转被一次不相干的设置改动关掉了
    expect((await reboot()).loadSave().invertY).toBe(false);
  });
});

// main.js 进来就 boot 真渲染器，没法在 node/jsdom 里整只导入跑。它那几行接线掉回去时
// 上面几组照样全绿，所以按本仓既有路数（combat.test.js / sim.test.js / tuning.test.js）
// 直接对源文本钉住。
describe("main.applySettings 的接线（源码守门）", () => {
  const applySettings = MAIN_SRC.slice(
    MAIN_SRC.indexOf("function applySettings"),
    MAIN_SRC.indexOf("// ---------- 画质 ----------")
  );

  it("截到了 applySettings 这一段（源码挪窝时本组要跟着修，不许悄悄空跑）", () => {
    expect(applySettings).toContain("function applySettings");
    expect(applySettings).toContain("updateSave({");
    expect(applySettings.length).toBeGreaterThan(200);
  });

  it("落盘补丁里带 invertY：这就是「刷新后开关仍在」的那一行", () => {
    const patch = applySettings.slice(applySettings.indexOf("updateSave({"), applySettings.indexOf("});"));
    expect(patch).toMatch(/\binvertY\b/);
    // 既有几项一个都不许在这次改动里掉队
    for (const key of ["quality", "muted", "lookSensitivity", "pointerLock", "touch", "lookMode"]) {
      expect(patch).toContain(key);
    }
  });

  it("面板没报 invertY 时沿用存档现值，不写 undefined 抹 key", () => {
    expect(applySettings).toMatch(/typeof\s+next\.invertY\s*===\s*"boolean"/);
    expect(applySettings).toMatch(/save\.invertY/);
  });

  it("运行值也在这里收口：与 setSensitivity / setPointerLock 同一种姿势", () => {
    expect(applySettings).toContain("input.setInvertY(");
    expect(applySettings).toContain("input.setSensitivity(");
    expect(applySettings).toContain("input.setPointerLock(");
  });

  it("开局仍从存档喂进输入层：写得进读不出等于没落盘", () => {
    expect(MAIN_SRC).toMatch(/createInput\([\s\S]{0,400}?invertY:\s*save\.invertY/);
  });
});
