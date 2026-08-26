import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { boot } from "../../src/app";

/**
 * 邻家花园互访的 UI 冒烟（docs/UX.md 六）：
 * 访邻面板名册 → 串门进园（篱外人家番外）→ 帮浇水 / smart-tap 摘花（借花一枝番外）
 * → 回家小结 toast 与 Esc 回家。garden 快照按「邻居id+游戏日」确定性生成，day 0 可复现。
 */

function el<T extends HTMLElement>(selector: string): T {
  const node = document.querySelector<T>(selector);
  if (!node) throw new Error(`missing element: ${selector}`);
  return node;
}

function dockBtn(id: string): HTMLButtonElement {
  return el<HTMLButtonElement>(`.dock-btn[data-id="${id}"]`);
}

function tick(ms: number): void {
  vi.advanceTimersByTime(ms);
}

function seedSave(level: number): void {
  localStorage.setItem(
    "my-garden-world:save:v1",
    JSON.stringify({ schemaVersion: 3, tutorialStep: 99, tutorialDone: true, level, coins: 500 }),
  );
}

beforeEach(() => {
  localStorage.clear();
  document.body.innerHTML = `<div id="app"></div>`;
  vi.useFakeTimers({
    toFake: [
      "setTimeout",
      "clearTimeout",
      "setInterval",
      "clearInterval",
      "Date",
      "performance",
      "requestAnimationFrame",
      "cancelAnimationFrame",
    ],
  });
});

afterEach(() => {
  vi.useRealTimers();
});

describe("visit panel roster", () => {
  it("lists unlocked neighbors with hearts and allowance, seals the rest as silhouettes", () => {
    seedSave(3);
    boot(el("#app"));
    tick(50);
    expect(dockBtn("visit").disabled).toBe(false);
    dockBtn("visit").click();
    tick(50);
    expect(el(".sheet").textContent).toContain("串门访邻");
    const cards = [...document.querySelectorAll<HTMLElement>(".neighbor-card")];
    expect(cards).toHaveLength(3);
    expect(cards[0]!.textContent).toContain("邻家阿姊");
    expect(cards[0]!.textContent).toContain("可浇 3 · 可摘 1");
    expect(cards[0]!.textContent).toContain("♡♡♡♡♡");
    expect(cards[0]!.querySelector("button.primary")).not.toBeNull();
    expect(cards[1]!.textContent).toContain("茶寮掌柜");
    // 东篱客 5 阶结识：剪影卡置灰、无串门按钮，留期待不隐藏
    expect(cards[2]!.className).toContain("is-sealed");
    expect(cards[2]!.textContent).toContain("5 阶后来往");
    expect(cards[2]!.querySelector("button.primary")).toBeNull();
  });
});

describe("visit mode: water, pick, go home", () => {
  it("串门弹「篱外人家」，浇水摘花有痕，回家结一条串门小记", () => {
    seedSave(3);
    boot(el("#app"));
    tick(50);
    dockBtn("visit").click();
    tick(50);
    el<HTMLButtonElement>(".neighbor-card button.primary").click();
    tick(50);

    // 首次串门 → 「篱外人家」番外折；收起后邻园盖上舞台、dock 隐去
    expect(el(".modal.side-story").textContent).toContain("篱外人家");
    el<HTMLButtonElement>(".modal.side-story .cta").click();
    tick(50);
    expect(document.querySelector(".sheet")).toBeNull();
    expect(el("#app").dataset.mode).toBe("visit");
    expect(el(".visit-banner").textContent).toContain("邻家阿姊家的园子");
    expect(document.querySelectorAll(".visit-garden .plot")).toHaveLength(6);

    // 帮浇水：选中动作，点缺水的圃 → 一次补满、不再干渴
    const waterBtn = el<HTMLButtonElement>('.visit-act[data-act="water"]');
    expect(waterBtn.disabled).toBe(false);
    waterBtn.click();
    tick(20);
    expect(waterBtn.getAttribute("aria-pressed")).toBe("true");
    const thirstyPlot = el<HTMLButtonElement>(".visit-garden .plot.is-thirsty");
    thirstyPlot.click();
    tick(20);
    expect(thirstyPlot.className).not.toContain("is-thirsty");

    // smart-tap 摘花：空手点盛放圃即摘 → 首摘弹「借花一枝」，圃面换借花笺
    if (!waterBtn.disabled) waterBtn.click(); // 收起水勺（若园里已无缺水圃则动作已自动复位）
    tick(20);
    const bloom = el<HTMLButtonElement>(".visit-garden .plot.is-ready");
    bloom.click();
    tick(20);
    expect(el(".modal.side-story").textContent).toContain("借花一枝");
    el<HTMLButtonElement>(".modal.side-story .cta").click();
    tick(20);
    expect(bloom.className).toContain("is-borrowed");
    expect(bloom.textContent).toContain("借花笺");
    expect(bloom.getAttribute("aria-label")).toContain("借花笺");
    // 一家一枝：摘花动作转为不可用
    expect(el<HTMLButtonElement>('.visit-act[data-act="pick"]').disabled).toBe(true);

    // 回家：小结 toast 汇总本次串门
    el<HTMLButtonElement>(".visit-home").click();
    tick(20);
    expect(el("#app").dataset.mode).toBeUndefined();
    const toasts = [...document.querySelectorAll(".toast")].map((t) => t.textContent).join("|");
    expect(toasts).toContain("串门小记");
    expect(toasts).toContain("浇了 1 瓢水");
    expect(toasts).toContain("借得 1 枝");
    expect(toasts).toContain("友谊 +1"); // 帮浇 +1；借花是欠人情，不涨友谊

    // 借来的花进了自家花匣
    dockBtn("bag").click();
    tick(50);
    expect(el(".sheet").textContent).toContain("×1");

    // 名册余量随痕迹更新
    dockBtn("bag").click();
    tick(20);
    dockBtn("visit").click();
    tick(50);
    expect(el(".neighbor-card").textContent).toContain("可浇 2 · 可摘 0");
  });

  it("Esc 回自家园，空手而归也有一句小记", () => {
    seedSave(1);
    boot(el("#app"));
    tick(50);
    dockBtn("visit").click();
    tick(50);
    // 1 阶只识邻家阿姊
    expect(document.querySelectorAll(".neighbor-card button.primary")).toHaveLength(1);
    el<HTMLButtonElement>(".neighbor-card button.primary").click();
    tick(50);
    // 番外折每会话只弹一次（上个用例已看过），直接在园中
    expect(el("#app").dataset.mode).toBe("visit");
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    tick(20);
    expect(el("#app").dataset.mode).toBeUndefined();
    const toasts = [...document.querySelectorAll(".toast")].map((t) => t.textContent).join("|");
    expect(toasts).toContain("坐坐就好");
  });
});

describe("mute preference persistence", () => {
  it("静音偏好写入 localStorage，换会话仍记得", async () => {
    vi.resetModules();
    const a = await import("../../src/audio/soundscape");
    expect(a.isMuted()).toBe(false);
    a.toggleMute();
    expect(localStorage.getItem("my-garden-world:muted")).toBe("1");
    // 模拟下次进园：重载模块即重读偏好
    vi.resetModules();
    const b = await import("../../src/audio/soundscape");
    expect(b.isMuted()).toBe(true);
    b.toggleMute();
    expect(localStorage.getItem("my-garden-world:muted")).toBe("0");
    vi.resetModules();
    const c = await import("../../src/audio/soundscape");
    expect(c.isMuted()).toBe(false);
  });
});
