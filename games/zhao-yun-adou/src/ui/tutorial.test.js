// @vitest-environment jsdom
/**
 * 首局教程：三步、能翻页、讲完直接开打，看过一次就不再自动弹（localStorage）。
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  attachTutorial,
  closeTutorial,
  detachTutorial,
  forgetTutorial,
  openTutorial,
  tutorialOpen,
  tutorialSeen,
} from "./tutorial.js";

function fakeGame(phase = "menu") {
  return { state: { phase }, start: vi.fn(), bus: { on: () => () => {} } };
}

const layer = () => document.getElementById("tutor-layer");
const heading = () => layer()?.querySelector(".zy-ftue-head")?.textContent || "";
const dots = () => layer()?.querySelector(".zy-ftue-dots")?.textContent || "";
const act = (name) => layer()?.querySelector(`[data-tutor-act="${name}"]`);

beforeEach(() => {
  document.body.innerHTML = `<div id="app"></div>`;
  localStorage.clear();
  forgetTutorial();
});

afterEach(() => {
  detachTutorial();
  localStorage.clear();
  document.body.innerHTML = "";
});

describe("首局教程弹出时机", () => {
  it("没看过 + 停在菜单 → 自动弹出第一步", () => {
    attachTutorial(fakeGame("menu"));
    expect(tutorialOpen()).toBe(true);
    expect(heading()).toContain("征兵入营");
    expect(dots()).toBe("●○○");
    // 挂在 body 下、与 #app 平级，diff 碰不到
    expect(layer().parentElement).toBe(document.body);
  });

  it("局中途接管（读档/续跑）不打断玩家", () => {
    attachTutorial(fakeGame("playing"));
    expect(tutorialOpen()).toBe(false);
  });

  it("看过一次就不再自动弹，换一局也一样", () => {
    attachTutorial(fakeGame("menu"));
    closeTutorial();
    expect(tutorialSeen()).toBe(true);
    expect(localStorage.getItem("zy-adou.tutorial.v1")).toBe("done");
    detachTutorial();
    attachTutorial(fakeGame("menu"));
    expect(tutorialOpen()).toBe(false);
  });

  it("抹掉标记后重新走一遍", () => {
    attachTutorial(fakeGame("menu"));
    closeTutorial();
    forgetTutorial();
    expect(tutorialSeen()).toBe(false);
    detachTutorial();
    attachTutorial(fakeGame("menu"));
    expect(tutorialOpen()).toBe(true);
  });

  it("菜单里的「看教程」随时能把它叫回来", () => {
    document.body.innerHTML = `<div id="app"><button data-tutor-open>看教程</button></div>`;
    const api = fakeGame("menu");
    attachTutorial(api);
    closeTutorial();
    expect(tutorialOpen()).toBe(false);
    document.querySelector("[data-tutor-open]").click();
    expect(tutorialOpen()).toBe(true);
  });
});

describe("三步流程", () => {
  it("下一步 / 上一步 走完三页，末页按钮变「出征」", () => {
    attachTutorial(fakeGame("menu"));
    expect(act("prev").disabled).toBe(true);
    act("next").click();
    expect(heading()).toContain("布阵开地");
    expect(dots()).toBe("○●○");
    act("next").click();
    expect(heading()).toContain("合并觉醒");
    expect(dots()).toBe("○○●");
    expect(act("next")).toBeNull();
    expect(act("done").textContent).toBe("出征");
    act("prev").click();
    expect(heading()).toContain("布阵开地");
  });

  it("讲完点出征：记下标记、收起面板、直接开打", () => {
    const api = fakeGame("menu");
    attachTutorial(api);
    act("next").click();
    act("next").click();
    act("done").click();
    expect(api.start).toHaveBeenCalledTimes(1);
    expect(tutorialOpen()).toBe(false);
    expect(layer()).toBeNull();
    expect(tutorialSeen()).toBe(true);
  });

  it("跳过也算看过，但不会替玩家开局", () => {
    const api = fakeGame("menu");
    attachTutorial(api);
    act("skip").click();
    expect(tutorialOpen()).toBe(false);
    expect(api.start).not.toHaveBeenCalled();
    expect(tutorialSeen()).toBe(true);
  });
});

describe("键盘", () => {
  /** 真实按键落在焦点元素上再往上冒，window 的捕获监听才排在游戏热键前面。 */
  function press(key) {
    const target = document.activeElement || document.body;
    target.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true }));
  }

  it("← → 翻页，Esc 跳过", () => {
    attachTutorial(fakeGame("menu"));
    press("ArrowRight");
    expect(heading()).toContain("布阵开地");
    press("ArrowLeft");
    expect(heading()).toContain("征兵入营");
    press("Escape");
    expect(tutorialOpen()).toBe(false);
    expect(tutorialSeen()).toBe(true);
  });

  it("末页再按 → 就出征", () => {
    const api = fakeGame("menu");
    attachTutorial(api);
    press("ArrowRight");
    press("ArrowRight");
    press("ArrowRight");
    expect(api.start).toHaveBeenCalledTimes(1);
    expect(tutorialOpen()).toBe(false);
  });

  it("面板开着时游戏热键一个都漏不下去", () => {
    const game = vi.fn();
    window.addEventListener("keydown", game);
    attachTutorial(fakeGame("menu"));
    for (const key of [" ", "e", "r", "1", "Escape"]) press(key);
    window.removeEventListener("keydown", game);
    expect(game).not.toHaveBeenCalled();
  });

  it("教程收起后热键恢复正常", () => {
    const game = vi.fn();
    attachTutorial(fakeGame("menu"));
    closeTutorial();
    window.addEventListener("keydown", game);
    press(" ");
    window.removeEventListener("keydown", game);
    expect(game).toHaveBeenCalledTimes(1);
  });
});

describe("容错", () => {
  it("localStorage 不可用时退回内存标记，不炸也不反复打扰", () => {
    const store = window.localStorage;
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      get() {
        throw new Error("blocked");
      },
    });
    try {
      const api = fakeGame("menu");
      expect(() => attachTutorial(api)).not.toThrow();
      expect(tutorialOpen()).toBe(true);
      closeTutorial();
      expect(tutorialSeen()).toBe(true);
      detachTutorial();
      attachTutorial(fakeGame("menu"));
      expect(tutorialOpen()).toBe(false);
    } finally {
      Object.defineProperty(window, "localStorage", { configurable: true, value: store });
    }
  });

  it("重复 attach 同一局是空操作，不会叠面板", () => {
    const api = fakeGame("menu");
    attachTutorial(api);
    attachTutorial(api);
    attachTutorial(api);
    expect(document.querySelectorAll("#tutor-layer .zy-ftue")).toHaveLength(1);
  });

  it("显式 open 不看首局标记，且步数会夹到合法区间", () => {
    attachTutorial(fakeGame("menu"));
    closeTutorial();
    openTutorial(9);
    expect(dots()).toBe("○○●");
    openTutorial(-3);
    expect(dots()).toBe("●○○");
  });
});
