// @vitest-environment jsdom
//
// 结算板 / 暂停板的回归测试。钉住 Round 1 遗留 6 的 UI 侧：
// 「再 来 一 局」和「回 安 全 区 换 掌」必须打到**两个不同的回调**上。

import { beforeEach, describe, expect, it } from "vitest";

import { GLOVES, GLOVE_BY_ID, SKINS } from "../data/index.js";
import { resolveSkins } from "../core/skins.js";
import { createShell } from "./shell.js";

const TABLE = resolveSkins({ SKINS, DEFAULT_SKIN_ID: "drifter" });

/** 壳层只当 audio / input 是「有这些方法」的对象，测试里给一层空转替身。 */
function noopBag() {
  return new Proxy({}, { get: () => () => {} });
}

function mount(callbacks = {}) {
  const root = document.createElement("div");
  document.body.appendChild(root);
  const calls = [];
  const shell = createShell({
    root,
    gloves: GLOVES,
    gloveById: GLOVE_BY_ID,
    skinTable: TABLE,
    save: { loadout: { main: "cotton", off: "cotton" }, skinId: "drifter", unlocked: ["cotton"] },
    audio: noopBag(),
    input: noopBag(),
    matchConfig: { killsToWin: 7, switchLock: 0.4 },
    isUnlocked: () => true,
    unlockTextOf: () => "局内挑战",
    callbacks: {
      onRestart: () => calls.push("restart"),
      onReturnHub: () => calls.push("returnHub"),
      onQuit: () => calls.push("quit"),
      onResume: () => calls.push("resume"),
      ...callbacks,
    },
  });
  return { shell, root, calls };
}

const RESULT = {
  won: true,
  reasonText: "你 先 到 7 杀",
  unlocked: [],
  rows: [
    { name: "你", kills: 7, deaths: 0, streak: 4, gloveId: "cotton", self: true },
    { name: "蛮古", kills: 2, deaths: 3, streak: 1, gloveId: "granite" },
  ],
};

function sheetButtons(root) {
  return [...root.querySelectorAll(".yz-screen--frost .yz-btn")];
}

beforeEach(() => {
  document.body.innerHTML = "";
});

describe("结算板", () => {
  it("三颗按钮各就各位", () => {
    const { shell, root } = mount();
    shell.showResult(RESULT);
    expect(sheetButtons(root).map((b) => b.textContent)).toEqual([
      "再 来 一 局",
      "回 安 全 区 换 掌",
      "配 掌 面 板",
    ]);
  });

  it("「再来一局」打 onRestart，「回安全区换掌」打 onReturnHub —— 不是同一个回调", () => {
    const { shell, root, calls } = mount();
    shell.showResult(RESULT);
    const [restart, hub] = sheetButtons(root);
    restart.click();
    hub.click();
    expect(calls).toEqual(["restart", "returnHub"]);
  });

  it("这一局没解锁新掌时，板上不该多出一行字面量 null", () => {
    const { shell, root } = mount();
    shell.showResult(RESULT);
    const body = root.querySelector(".yz-screen--frost .yz-panel");
    expect(body.textContent).not.toContain("null");
    expect(body.querySelector(".yz-heading")).toBeNull();
  });

  it("解锁了就照旧报出来", () => {
    const { shell, root } = mount();
    shell.showResult({ ...RESULT, unlocked: ["磐石", "疾风"] });
    expect(root.querySelector(".yz-screen--frost .yz-heading").textContent).toBe("解锁：磐石、疾风");
  });
});

describe("暂停板", () => {
  it("「回安全区」也走 onReturnHub，「配掌面板」才是退到 2D 板", () => {
    const { shell, root, calls } = mount();
    shell.showPause();
    const buttons = sheetButtons(root);
    expect(buttons.map((b) => b.textContent)).toEqual(["继 续", "回 安 全 区", "配 掌 面 板"]);
    buttons[1].click();
    buttons[2].click();
    expect(calls).toEqual(["returnHub", "quit"]);
  });
});
