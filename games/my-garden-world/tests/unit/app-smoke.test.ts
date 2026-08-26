import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { boot } from "../../src/app";

/**
 * 端到端冒烟：在 jsdom 中启动整个游戏，用假时钟驱动 rAF 主循环，
 * 走完教程全链路（播种 → 拖浇 → 生长 → 收获 → 交单），
 * 同时验证渲染架构（面板选材状态跨帧存活）与 dock 门控。
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

describe("app smoke: full tutorial loop", () => {
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

  it("plays plant → water → harvest → order with gated dock", () => {
    boot(el("#app"));
    tick(50);

    // 第一折：故事弹窗；教程期非许可按钮被禁用
    expect(el(".modal.tutorial").textContent).toContain("荒园来信");
    expect(dockBtn("workshop").disabled).toBe(true);
    expect(dockBtn("water").disabled).toBe(true);
    expect(dockBtn("visit").disabled).toBe(true);
    el<HTMLButtonElement>(".modal-card .cta").click();
    tick(50);

    // 第二折：播种。先看开场折子，收起后化为 coach 横幅
    expect(el(".modal.tutorial").textContent).toContain("下一粒种");
    el<HTMLButtonElement>(".modal-card .cta").click();
    tick(50);
    expect(document.querySelector(".modal.tutorial")).toBeNull();
    expect(el(".coach").textContent).toContain("花种");
    expect(dockBtn("seed").disabled).toBe(false);
    dockBtn("seed").click();
    tick(50);
    const findDaisyCard = (): HTMLButtonElement =>
      [...document.querySelectorAll<HTMLButtonElement>(".seed-card")].find((c) => c.textContent?.includes("小雏菊"))!;
    findDaisyCard().click();
    tick(50);
    // 选中花种后面板收起，露出花圃；空圃带 is-plantable 引导
    expect(document.querySelector(".sheet")).toBeNull();
    expect(el('.plot[data-plot-id="0"]').className).toContain("is-plantable");
    el<HTMLButtonElement>('.plot[data-plot-id="0"]').click();
    tick(50);
    expect(el('.plot[data-plot-id="0"]').getAttribute("aria-label")).toContain("小雏菊");

    // 第三折：浇水（键盘/点击路径）
    expect(el(".modal.tutorial").textContent).toContain("引一瓢水");
    el<HTMLButtonElement>(".modal-card .cta").click();
    tick(50);
    expect(el(".coach").textContent).toContain("洒水");
    dockBtn("water").click();
    tick(400);
    el<HTMLButtonElement>('.plot[data-plot-id="0"]').click();
    tick(50);

    // 第四折：三段生长，每段补一次水
    expect(el(".modal.tutorial").textContent).toContain("剪一枝花");
    el<HTMLButtonElement>(".modal-card .cta").click();
    tick(50);
    expect(el(".coach").textContent).toContain("收获");
    for (let stage = 0; stage < 3; stage++) {
      tick(5200);
      el<HTMLButtonElement>('.plot[data-plot-id="0"]').click();
      tick(400);
    }
    tick(5200);
    expect(el('.plot[data-plot-id="0"]').className).toContain("is-ready");
    dockBtn("harvest").click();
    tick(50);
    el<HTMLButtonElement>('.plot[data-plot-id="0"]').click();
    tick(50);

    // 第五折：交单。教程保底雏菊订单存在且可交付
    expect(el(".modal.tutorial").textContent).toContain("接头一单");
    el<HTMLButtonElement>(".modal-card .cta").click();
    tick(50);
    expect(el(".coach").textContent).toContain("订单");
    dockBtn("order").click();
    tick(50);
    const daisyOrder = [...document.querySelectorAll<HTMLElement>(".order-card")].find((c) =>
      c.textContent?.includes("雏菊"),
    )!;
    const deliver = daisyOrder.querySelector<HTMLButtonElement>("button.primary")!;
    expect(deliver.disabled).toBe(false);
    deliver.click();
    tick(50);

    // 尾声：结业弹窗 → 全部解锁（含访邻），并附一次性音效贴士
    expect(el(".modal.tutorial").textContent).toContain("自此看花");
    el<HTMLButtonElement>(".modal-card .cta").click();
    tick(50);
    expect(document.querySelector(".modal.tutorial")).toBeNull();
    expect(document.querySelector(".coach")).toBeNull();
    expect(dockBtn("workshop").disabled).toBe(false);
    expect(dockBtn("decor").disabled).toBe(false);
    expect(dockBtn("visit").disabled).toBe(false);
    const toasts = [...document.querySelectorAll(".toast")].map((t) => t.textContent).join("|");
    expect(toasts).toContain("园中有声");
  });

  it("workshop picks survive re-renders and crafting consumes them", () => {
    // 预置一份已通关教程、库存充足的存档
    const seed = {
      schemaVersion: 1,
      tutorialStep: 99,
      tutorialDone: true,
      coins: 500,
      inventory: { daisy: 2, peach: 1 },
    };
    localStorage.setItem("my-garden-world:save:v1", JSON.stringify(seed));
    boot(el("#app"));
    tick(50);

    dockBtn("workshop").click();
    tick(50);
    const pickChip = (name: string): void => {
      const chip = [...document.querySelectorAll<HTMLButtonElement>(".bag-row .chip")].find((c) =>
        c.textContent?.includes(name),
      )!;
      chip.click();
      tick(50);
    };
    pickChip("小雏菊");
    // 关键回归：选材在多帧渲染后仍然保留（旧版每帧重建导致清空）
    tick(1000);
    expect([...document.querySelectorAll(".tray-slot.filled")]).toHaveLength(1);
    pickChip("小雏菊");
    pickChip("碧桃");
    expect([...document.querySelectorAll(".tray-slot.filled")]).toHaveLength(3);

    const vase = [...document.querySelectorAll<HTMLButtonElement>(".vase-btn")].find((b) =>
      b.textContent?.includes("青瓷"),
    )!;
    expect(vase.disabled).toBe(false);
    vase.click();
    tick(50);
    // 成器后：选材清空、陈列架出现作品、库存扣除
    expect(document.querySelectorAll(".tray-slot.filled")).toHaveLength(0);
    expect(el(".art-list").textContent).toContain("分");
    dockBtn("bag").click();
    tick(50);
    expect(el(".sheet").textContent).not.toContain("小雏菊");
  });
});
