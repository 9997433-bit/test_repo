// @vitest-environment jsdom
//
// 结算板 / 暂停板的回归测试。钉住 Round 1 遗留 6 的 UI 侧：
// 「再 来 一 局」和「回 安 全 区 换 掌」必须打到**两个不同的回调**上。

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { GLOVES, GLOVE_BY_ID, SKINS } from "../data/index.js";
import { resolveSkins } from "../core/skins.js";
import { createShell } from "./shell.js";

const TABLE = resolveSkins({ SKINS, DEFAULT_SKIN_ID: "drifter" });

/** 壳层只当 audio / input 是「有这些方法」的对象，测试里给一层空转替身。 */
function noopBag() {
  return new Proxy({}, { get: () => () => {} });
}

function mount(callbacks = {}, opts = {}) {
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
    ...opts,
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
  delete document.documentElement.dataset.touch;
});

afterEach(() => {
  vi.useRealTimers();
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

describe("结算板：两个入口分得清去处", () => {
  function hintOf(root, entry) {
    const node = root.querySelector(`.yz-screen--frost p.yz-hintline[data-entry="${entry}"]`);
    return node ? node.textContent : null;
  }

  it("每个入口底下都有一行去处说明，一个回裂岛、一个回走道", () => {
    const { shell, root } = mount();
    shell.showResult(RESULT);
    expect(hintOf(root, "restart")).toContain("直接回裂岛");
    expect(hintOf(root, "hub")).toContain("回走道重挑");
    expect(hintOf(root, "hub")).toContain("主副掌清空");
    // 第三颗不是回程：说明里要说清它退的是 2D 备选台
    expect(hintOf(root, "menu")).toContain("2D 配掌台");
  });

  it("「再来一局」报出将要沿用的那副掌（main 用同一条取值链算出来）", () => {
    const { shell, root } = mount();
    shell.showResult({ ...RESULT, restartLoadout: { main: "cotton", off: "granite" } });
    expect(hintOf(root, "restart")).toContain("沿用 木棉 / 磐石");
  });

  it("main 没给配装（旧调用 / 掌表里没有）也不留空，退到不提名字的说法", () => {
    const { shell, root } = mount();
    shell.showResult(RESULT);
    expect(hintOf(root, "restart")).toContain("沿用这副掌");
  });

  it("键位章在说明行里而不在按钮里：触屏隐藏 .yz-kbd 也吞不掉按钮文字", () => {
    const { shell, root } = mount();
    shell.showResult(RESULT);
    for (const btn of sheetButtons(root)) expect(btn.querySelector(".yz-kbd")).toBeNull();
    expect(
      root.querySelector('p.yz-hintline[data-entry="restart"] .yz-kbd').textContent
    ).toBe("R");
    expect(root.querySelector('p.yz-hintline[data-entry="hub"] .yz-kbd').textContent).toBe("H");
  });

  it("R 回裂岛、H 回走道：键盘走的是按钮自己的 click，和触控同一条路", () => {
    const { shell, root, calls } = mount();
    shell.showResult(RESULT);
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "r", bubbles: true }));
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "H", bubbles: true }));
    expect(calls).toEqual(["restart", "returnHub"]);
    expect(root.querySelector('[data-entry="restart"].yz-btn').disabled).toBe(true);
  });

  it("板一开焦点就落在主入口，Enter 直接进裂岛", () => {
    const { shell, root } = mount();
    shell.showResult(RESULT);
    expect(document.activeElement).toBe(root.querySelector('[data-entry="restart"].yz-btn'));
  });

  it("板没开 / 开的是暂停板时，R 和 H 都不生效", () => {
    const { shell, calls } = mount();
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "r", bubbles: true }));
    shell.showPause();
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "h", bubbles: true }));
    expect(calls).toEqual([]);
  });

  it("同一颗入口连点两下只开一局，另一颗仍然点得动", () => {
    const { shell, root, calls } = mount();
    shell.showResult(RESULT);
    const [restart, hub] = sheetButtons(root);
    restart.click();
    restart.click();
    hub.click();
    expect(calls).toEqual(["restart", "returnHub"]);
  });

  it("重开一板时闸复位：上一板点过的入口不会带着灰进来", () => {
    const { shell, root } = mount();
    shell.showResult(RESULT);
    sheetButtons(root)[0].click();
    shell.showResult(RESULT);
    expect(sheetButtons(root)[0].disabled).toBe(false);
  });
});

describe("暂停 / 结算板压屏时的触控层", () => {
  it("板一开收起触控层，板一关按当前页面还原", () => {
    const { shell } = mount();
    shell.showMatch();
    expect(shell.touch.el.hidden).toBe(false);
    shell.showPause();
    expect(shell.touch.el.hidden).toBe(true);
    shell.hideSheet();
    expect(shell.touch.el.hidden).toBe(false);
    shell.showResult(RESULT);
    expect(shell.touch.el.hidden).toBe(true);
  });

  it("主菜单上照旧不显示触控层", () => {
    const { shell } = mount();
    shell.showMenu();
    expect(shell.touch.el.hidden).toBe(true);
  });
});

describe("视角模式接线（LOOK-R1 · ART_DIRECTION §18）", () => {
  /** 设置板里某一行的分段器按钮。行结构 = 标签 span + 控件，见 settingRow。 */
  function segOptions(root, label) {
    const tag = [...root.querySelectorAll(".yz-screen--frost .yz-glove-role")].find(
      (n) => n.textContent === label
    );
    return tag ? [...tag.parentElement.querySelectorAll(".yz-seg-opt")] : [];
  }

  it("开局就把镜像贴上，但不放回执：locked + 反馈不亮", () => {
    const { shell, root } = mount();
    expect(shell.hud.el.dataset.look).toBe("locked");
    expect(root.querySelector(".yz-look-flash").classList.contains("is-on")).toBe(false);
  });

  it("URL / 存档给的开局模式也照贴（面板灯与准星锁刻同一个源）", () => {
    const { shell } = mount({}, { lookMode: "free" });
    expect(shell.hud.el.dataset.look).toBe("free");
    expect(shell.settings.lookMode).toBe("free");
  });

  it("切换后 data-look 跟上、.yz-look-flash 写文案并亮 0.9s", () => {
    vi.useFakeTimers();
    const { shell, root } = mount();
    const flash = root.querySelector(".yz-look-flash");

    shell.setLookMode("free");
    expect(shell.hud.el.dataset.look).toBe("free");
    expect(flash.classList.contains("is-on")).toBe(true);
    expect(flash.textContent).toContain("自由视角");

    vi.advanceTimersByTime(900);
    expect(flash.classList.contains("is-on")).toBe(false);

    shell.setLookMode("locked");
    expect(shell.hud.el.dataset.look).toBe("locked");
    expect(flash.textContent).toContain("视角锁定");
  });

  it("模式提示只有这一枚：中央短讯那块大字不跟着开", () => {
    const { shell, root } = mount();
    shell.setLookMode("free");
    expect(root.querySelector(".yz-center-note").hidden).toBe(true);
    expect(root.querySelectorAll(".yz-look-flash")).toHaveLength(1);
  });

  it("同一个模式再喂一遍不亮回执（每帧同步不该在屏上闪）", () => {
    const { shell, root } = mount();
    shell.setLookMode("locked");
    expect(root.querySelector(".yz-look-flash").classList.contains("is-on")).toBe(false);
  });

  it("设置板分段器：标签「视角模式」+ 两枚 .yz-seg-opt，当前态亮着", () => {
    const { shell, root } = mount();
    shell.showPause();
    const opts = segOptions(root, "视角模式");
    expect(opts.map((b) => b.textContent)).toEqual(["固定视角", "自由视角"]);
    expect(opts.map((b) => b.classList.contains("is-on"))).toEqual([true, false]);
  });

  it("设置板那条路与 V 键走同一枚反馈（main 拿 input 收敛后的值回喂）", () => {
    const { shell, root } = mount({
      onSettingsChange: (next) => shell.setLookMode(next.lookMode),
    });
    shell.showPause();
    segOptions(root, "视角模式")[1].click();
    expect(shell.settings.lookMode).toBe("free");
    expect(shell.hud.el.dataset.look).toBe("free");
    expect(root.querySelector(".yz-look-flash").classList.contains("is-on")).toBe(true);
  });

  it("V 键切换时设置板正开着也不许亮旧灯", () => {
    const { shell, root } = mount();
    shell.showPause();
    shell.setLookMode("free");
    expect(segOptions(root, "视角模式").map((b) => b.classList.contains("is-on"))).toEqual([
      false,
      true,
    ]);
  });

  it("键位表写着「切换视角 · V」，触屏整块照旧靠 .yz-kbd 收起", () => {
    const { shell, root } = mount();
    shell.showPause();
    const keys = [...root.querySelectorAll(".yz-screen--frost .yz-kbd")].map((n) => n.textContent);
    expect(keys).toContain("V");
    expect(root.querySelector(".yz-screen--frost .yz-panel").textContent).toContain("切换视角");
  });

  it("触屏隐藏键帽走的是 F2 那条选择器，DOM 结构对得上", () => {
    const { root } = mount();
    document.documentElement.dataset.touch = "1";
    expect(document.querySelector('[data-touch="1"] .yz-look-flash kbd')).toBe(
      root.querySelector(".yz-look-flash kbd")
    );
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

  it("暂停里的「回安全区」写明这一局作废，且不挂快捷键章（板上还有滑块）", () => {
    const { shell, root } = mount();
    shell.showPause();
    const hint = root.querySelector('.yz-screen--frost p.yz-hintline[data-entry="hub"]');
    expect(hint.textContent).toContain("弃掉这一局回走道");
    expect(hint.querySelector(".yz-kbd")).toBeNull();
  });
});
