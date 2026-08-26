// @vitest-environment jsdom
/**
 * juice 的 DOM 通道只许说 fx.css 的方言：`.fx-float` / `.fx-splash` / `.fx-quake`
 * 挂在 `#fx-layer` 与 `#app` 上，定位强度全走 `--fx-*` 变量，
 * 本模块一行样式也不许自注入。
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createBus } from "../core/events.js";
import { attachJuice, detachJuice, juiceStats } from "./juice.js";

const SKILL_JUICE = {
  shake: 0.45,
  color: "#c9a24a",
  sfx: "sweep",
  duration: 0.55,
  focusT: 0.62,
  shape: "sweep",
  text: "七进七出",
};

/** jsdom 不做布局：手工给出视口矩形，juice 才有落点。 */
function box(el, { left = 100, top = 200, width = 56, height = 56 } = {}) {
  el.getBoundingClientRect = () => ({
    left,
    top,
    width,
    height,
    right: left + width,
    bottom: top + height,
    x: left,
    y: top,
  });
  return el;
}

/** 复刻 index.html 的骨架：#app（含棋盘与阿斗）+ 平级的 #fx-layer。 */
function stage() {
  document.body.innerHTML = `
    <div id="app">
      <div class="arena">
        <section class="half ai"><div class="adou">斗</div><div class="grid" id="grid-ai"></div></section>
        <section class="half player"><div class="grid" id="grid-player"></div><div class="adou">斗</div></section>
      </div>
    </div>
    <div id="fx-layer" aria-hidden="true"></div>`;
  for (const side of ["player", "ai"]) {
    const grid = document.getElementById(`grid-${side}`);
    for (let i = 0; i < 12; i++) {
      const cell = document.createElement("div");
      cell.className = "cell";
      grid.appendChild(box(cell, { left: 40 + (i % 4) * 60, top: 300 + Math.floor(i / 4) * 60 }));
    }
  }
  for (const el of document.querySelectorAll(".adou, .half")) box(el, { width: 320, height: 180 });
  const bus = createBus();
  attachJuice({ bus, state: {} });
  return bus;
}

const fxLayer = () => document.getElementById("fx-layer");
const appRoot = () => document.getElementById("app");

let bus;

beforeEach(() => {
  bus = stage();
});

afterEach(() => {
  detachJuice();
  vi.useRealTimers();
  document.body.innerHTML = "";
});

describe("juice DOM 通道走 fx.css 契约", () => {
  it("merge 在 #fx-layer 里泼一团 ring 墨并冒一行飘字", () => {
    bus.emit("merge", { side: "player", cellIndex: 3, level: 3 });
    const splash = fxLayer().querySelector(".fx-splash");
    const float = fxLayer().querySelector(".fx-float");
    expect(splash.className).toBe("fx-splash ring");
    expect(splash.style.getPropertyValue("--fx-x")).toMatch(/^\d+px$/);
    expect(splash.style.getPropertyValue("--fx-y")).toMatch(/^\d+px$/);
    expect(splash.style.getPropertyValue("--fx-size")).toMatch(/^\d+px$/);
    expect(float.textContent).toBe("Lv3");
    expect(float.classList.contains("gold")).toBe(false);
  });

  it("四阶起的合并改用金色修饰类，不写行内色", () => {
    bus.emit("merge", { side: "player", cellIndex: 5, level: 4 });
    const float = fxLayer().querySelector(".fx-float");
    expect(float.classList.contains("gold")).toBe(true);
    expect(float.style.color).toBe("");
  });

  it("skill 的形状类与 juice.shape 一字不差，招式名用 .brush", () => {
    bus.emit("skill", {
      side: "player",
      hero: "赵云",
      skill: "七进七出",
      cellIndex: 2,
      hits: 4,
      kills: 2,
      juice: SKILL_JUICE,
    });
    const splash = fxLayer().querySelector(".fx-splash");
    expect(splash.classList.contains("sweep")).toBe(true);
    expect(splash.style.color).toBe("rgb(201, 162, 74)");
    const brush = fxLayer().querySelector(".fx-float.brush");
    expect(brush.textContent).toBe("七进七出");
    expect(fxLayer().querySelector(".fx-float.gold").textContent).toBe("斩 2");
  });

  it("震屏挂在 #app 根节点上，强度写 --fx-shake", () => {
    bus.emit("skill", { side: "ai", skill: "七进七出", cellIndex: 1, juice: SKILL_JUICE });
    expect(appRoot().classList.contains("fx-quake")).toBe(true);
    expect(appRoot().style.getPropertyValue("--fx-shake")).toBe("0.45");
    // 泼墨跟着战场一起抖
    expect(fxLayer().classList.contains("fx-quake")).toBe(true);
  });

  it("零强度技能不摇屏", () => {
    bus.emit("skill", {
      side: "player",
      skill: "仁德",
      cellIndex: 4,
      juice: { ...SKILL_JUICE, shake: 0, shape: "aura" },
    });
    expect(appRoot().classList.contains("fx-quake")).toBe(false);
    expect(fxLayer().querySelector(".fx-splash").classList.contains("aura")).toBe(true);
  });

  it("leak 在阿斗身上冒飘字，只有对岸破阵才震屏", () => {
    bus.emit("leak", { side: "player", hearts: 2, boss: false });
    expect(fxLayer().querySelector(".fx-float").textContent).toBe("阿斗 −1 心");
    // 我方半区的震颤由 main.js 的 .shake 负责，这里不许重复
    expect(appRoot().classList.contains("fx-quake")).toBe(false);
    bus.emit("leak", { side: "ai", hearts: 2, boss: false });
    expect(appRoot().classList.contains("fx-quake")).toBe(true);
  });

  it("不自注入样式、不留旧的 zy-* 类名", () => {
    bus.emit("merge", { side: "player", cellIndex: 3, level: 2 });
    bus.emit("skill", { side: "player", skill: "七进七出", cellIndex: 2, juice: SKILL_JUICE });
    expect(document.getElementById("zy-juice-css")).toBeNull();
    expect(document.getElementById("zy-juice")).toBeNull();
    expect(document.querySelector(".zy-float, .zy-ring")).toBeNull();
    for (const el of fxLayer().children) {
      expect(el.className).toMatch(/^fx-(float|splash)\b/);
    }
  });

  it("动画播完即摘节点，定时器是兜底（reduced-motion 下 CSS 会取消动画）", () => {
    vi.useFakeTimers();
    bus.emit("merge", { side: "player", cellIndex: 3, level: 2 });
    expect(juiceStats().nodes).toBe(2);
    fxLayer().querySelector(".fx-splash").dispatchEvent(new Event("animationend"));
    expect(juiceStats().nodes).toBe(1);
    vi.advanceTimersByTime(3000);
    expect(juiceStats().nodes).toBe(0);
    expect(fxLayer().children).toHaveLength(0);
  });

  it("同屏节点有上限，连招不会把演出层撑爆", () => {
    for (let i = 0; i < 40; i++) {
      bus.emit("merge", { side: "player", cellIndex: i % 12, level: 2 });
    }
    expect(juiceStats().nodes).toBeLessThanOrEqual(14);
    expect(fxLayer().children.length).toBeLessThanOrEqual(14);
  });

  it("detach 清场但不拆 index.html 自带的 #fx-layer", () => {
    bus.emit("skill", { side: "player", skill: "七进七出", cellIndex: 2, juice: SKILL_JUICE });
    detachJuice();
    expect(fxLayer()).not.toBeNull();
    expect(fxLayer().children).toHaveLength(0);
    expect(fxLayer().classList.contains("fx-quake")).toBe(false);
    expect(appRoot().classList.contains("fx-quake")).toBe(false);
  });

  it("页面没有 #fx-layer 时自己补一个，detach 时再收走", () => {
    detachJuice();
    fxLayer().remove();
    const bus = createBus();
    attachJuice({ bus, state: {} });
    expect(fxLayer()).not.toBeNull();
    detachJuice();
    expect(fxLayer()).toBeNull();
  });
});
