// @vitest-environment jsdom
//
// 掌语字条（P2-F2）：世界观短句的低干扰展示口。story 表归 F1，这里钉的是
// 展示合同：一次只亮一句、队列全长 ≤3 塞满拒收、复用 .yz-plate 材质、
// 节点独立于战斗 toast / 中央短讯（永不抢同一块牌）、换局清空。

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { GLOVES, GLOVE_BY_ID, SKINS } from "../data/index.js";
import { resolveSkins } from "../core/skins.js";
import { createLoreStrip } from "./lore.js";
import { createShell } from "./shell.js";

beforeEach(() => {
  document.body.innerHTML = "";
  delete document.documentElement.dataset.touch;
});

afterEach(() => {
  vi.useRealTimers();
});

describe("createLoreStrip", () => {
  it("常驻节点：.yz-lore > .yz-plate.yz-lore-item，默认不亮", () => {
    const lore = createLoreStrip();
    const item = lore.el.querySelector(".yz-lore-item");
    expect(lore.el.classList.contains("yz-lore")).toBe(true);
    expect(lore.el.getAttribute("role")).toBe("status");
    expect(item).not.toBeNull();
    expect(item.classList.contains("yz-plate")).toBe(true);
    expect(item.classList.contains("is-on")).toBe(false);
  });

  it("show 写文本 + .is-on，约 4.6s 后自己摘掉", () => {
    vi.useFakeTimers();
    const lore = createLoreStrip();
    const item = lore.el.querySelector(".yz-lore-item");

    expect(lore.show("掌语其一 · 岛是掌痕")).toBe(true);
    expect(item.classList.contains("is-on")).toBe(true);
    expect(item.textContent).toBe("掌语其一 · 岛是掌痕");

    vi.advanceTimersByTime(4500);
    expect(item.classList.contains("is-on")).toBe(true);
    vi.advanceTimersByTime(200);
    expect(item.classList.contains("is-on")).toBe(false);
  });

  it("一次只亮一句：第二句排队，第一句灭了、换口气才上", () => {
    vi.useFakeTimers();
    const lore = createLoreStrip();
    const item = lore.el.querySelector(".yz-lore-item");

    lore.show("第一句");
    lore.show("第二句");
    expect(item.textContent).toBe("第一句");
    expect(lore.pending()).toBe(2);
    // 屏上永远只有这一块牌
    expect(lore.el.querySelectorAll(".yz-lore-item")).toHaveLength(1);

    vi.advanceTimersByTime(4600);
    expect(item.classList.contains("is-on")).toBe(false); // 换气间隔里不亮
    vi.advanceTimersByTime(260);
    expect(item.classList.contains("is-on")).toBe(true);
    expect(item.textContent).toBe("第二句");
  });

  it("队列全长 ≤3：第四句拒收返回 false，消化掉一句后再收", () => {
    vi.useFakeTimers();
    const lore = createLoreStrip();
    expect(lore.show("一")).toBe(true);
    expect(lore.show("二")).toBe(true);
    expect(lore.show("三")).toBe(true);
    expect(lore.show("四")).toBe(false);
    expect(lore.pending()).toBe(3);

    vi.advanceTimersByTime(4600);
    expect(lore.show("四")).toBe(true);
  });

  it("空句 / 全空白拒收", () => {
    const lore = createLoreStrip();
    expect(lore.show("")).toBe(false);
    expect(lore.show("   ")).toBe(false);
    expect(lore.show(null)).toBe(false);
    expect(lore.pending()).toBe(0);
  });

  it("clear 清队列摘牌，旧计时器不回魂", () => {
    vi.useFakeTimers();
    const lore = createLoreStrip();
    const item = lore.el.querySelector(".yz-lore-item");
    lore.show("一");
    lore.show("二");
    lore.clear();
    expect(lore.pending()).toBe(0);
    expect(item.classList.contains("is-on")).toBe(false);
    vi.advanceTimersByTime(10000);
    expect(item.classList.contains("is-on")).toBe(false);
  });
});

describe("壳层接线 shell.showLore", () => {
  const TABLE = resolveSkins({ SKINS, DEFAULT_SKIN_ID: "drifter" });

  function noopBag() {
    return new Proxy({}, { get: () => () => {} });
  }

  function mount() {
    const root = document.createElement("div");
    document.body.appendChild(root);
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
      callbacks: {},
    });
    return { shell, root };
  }

  it("字条挂在 #hud 里，与 .yz-center-note / killfeed 各占各的节点", () => {
    const { shell } = mount();
    const strip = shell.hud.el.querySelector(".yz-lore");
    expect(strip).not.toBeNull();
    expect(strip.parentElement).toBe(shell.hud.el);
    expect(strip.querySelector(".yz-center-note")).toBeNull();
    expect(strip.querySelector(".yz-feed")).toBeNull();
    expect(shell.hud.el.querySelector(".yz-center-note")).not.toBeNull();
  });

  it("showLore 排队展示；战斗 toast 照走 .yz-center-note，互不覆写", () => {
    const { shell } = mount();
    expect(shell.showLore("掌语 · 一掌开天")).toBe(true);
    shell.toast("台面塌了一块");
    const item = shell.hud.el.querySelector(".yz-lore-item");
    const note = shell.hud.el.querySelector(".yz-center-note");
    expect(item.textContent).toBe("掌语 · 一掌开天");
    expect(note.textContent).toBe("台面塌了一块");
  });

  it("换局（showMatch）清空字条队列，不带旧句进新局", () => {
    const { shell } = mount();
    shell.showLore("一");
    shell.showLore("二");
    shell.showMatch();
    expect(shell.lore.pending()).toBe(0);
    expect(shell.hud.el.querySelector(".yz-lore-item").classList.contains("is-on")).toBe(false);
  });
});
