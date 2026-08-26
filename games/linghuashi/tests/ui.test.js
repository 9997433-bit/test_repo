// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createStore } from "../src/core/store.js";
import { boot } from "../src/core/engine.js";

// jsdom 无 2D 上下文：mountPainter/replayOnCanvas 均有空实现兜底
beforeEach(() => {
  localStorage.clear();
  document.body.innerHTML = '<div id="app"></div>';
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
});

function bootApp() {
  const root = document.getElementById("app");
  const store = createStore();
  boot(root, store);
  return { root, store };
}

function click(el) {
  el.dispatchEvent(new MouseEvent("click", { bubbles: true }));
}

describe("app smoke (keyboard-only walkthrough)", () => {
  it("boots to the splash screen", () => {
    const { root } = bootApp();
    expect(root.textContent).toContain("灵画师");
    expect(root.querySelector('[data-go="hub"]').disabled).toBe(true);
  });

  it("walks splash → class → hub → battle with keyboard casting", () => {
    const { root, store } = bootApp();
    click(root.querySelector('[data-go="class"]'));
    expect(root.textContent).toContain("六门修行");

    click(root.querySelector(".class-card"));
    click(root.querySelector("[data-ok]"));
    expect(store.get().classId).toBe("jian");
    expect(root.textContent).toContain("秘境出战");

    // 关卡锁定：第 2 关未解锁
    const stageButtons = root.querySelectorAll(".stage-card");
    expect(stageButtons[0].disabled).toBe(false);
    expect(stageButtons[1].disabled).toBe(true);

    click(stageButtons[0]);
    expect(store.get().screen).toBe("battle");
    expect(root.querySelector("#log")).toBeTruthy();
    // 教程覆盖层出现
    expect(root.querySelector("#tut").textContent).toContain("第一式");

    // 键盘施法【1】= 直线穿云剑
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "1" }));
    expect(root.querySelector("#log").textContent).toContain("穿云剑");
    // 教程推进到第二式
    expect(root.querySelector("#tut").textContent).toContain("第二式");
    // 画阁收录了这一笔
    expect(store.get().gallery.length).toBe(1);
    expect(store.get().gallery[0].type).toBe("line");
    expect(store.get().gallery[0].points.length).toBeGreaterThan(0);
    // 六式精进被记录
    expect(store.get().strokeStats.line).toBeGreaterThan(0.5);

    // Esc 收笔撤退
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    expect(store.get().screen).toBe("hub");
  });

  it("keyboard can complete the whole tutorial sequence", () => {
    const root = document.getElementById("app");
    const store = createStore();
    store.set({ classId: "ti", stageId: "tutorial", screen: "battle" });
    boot(root, store);
    for (const key of ["1", "2", "3", "4", "5", "6"]) {
      window.dispatchEvent(new KeyboardEvent("keydown", { key }));
    }
    expect(root.querySelector("#tut").textContent).toContain("六式已成");
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    expect(store.get().screen).toBe("hub");
  });

  it("gallery lists strokes and mastery progress", () => {
    const root = document.getElementById("app");
    const store = createStore();
    store.set({
      classId: "fa",
      screen: "gallery",
      gallery: [{ type: "circle", precision: 0.8, at: Date.now(), points: [{ x: 0, y: 0 }, { x: 1, y: 1 }] }],
      strokeStats: { circle: 0.8 },
    });
    boot(root, store);
    expect(root.textContent).toContain("画阁");
    expect(root.querySelectorAll(".gallery-cell").length).toBe(1);
    expect(root.textContent).toContain("1/6");
  });

  it("hub surfaces the ink-master call once unlocked", () => {
    const root = document.getElementById("app");
    const store = createStore();
    store.set({ classId: "jian", inkUnlocked: true, screen: "hub" });
    boot(root, store);
    const mo = root.querySelector("[data-mo]");
    expect(mo).toBeTruthy();
    click(mo);
    expect(store.get().classId).toBe("mo");
  });
});
