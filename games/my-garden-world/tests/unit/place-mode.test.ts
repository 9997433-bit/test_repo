import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { boot } from "../../src/app";
import { ANCHOR_SLOTS } from "../../src/scene/decor-art";

/** 摆放模式全链路（jsdom）：购置即落锚可见 → 布置栏拿起挪动 → Esc 退出 → 主题染层。 */

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

const SAVE = {
  schemaVersion: 3,
  tutorialStep: 99,
  tutorialDone: true,
  level: 10,
  coins: 2_000,
  fragments: 0,
};

describe("placement mode (anchors)", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem("my-garden-world:save:v1", JSON.stringify(SAVE));
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

  it("purchase lands on the first free anchor and stays adjustable via tap-tap", () => {
    boot(el("#app"));
    tick(50);

    // 购置：纱灯落「檐下」，即刻入景
    dockBtn("decor").click();
    tick(50);
    const lanternCard = [...document.querySelectorAll<HTMLButtonElement>(".sheet .card")].find((c) =>
      c.textContent?.includes("纱灯"),
    )!;
    lanternCard.click();
    tick(50);
    const item = el<HTMLElement>('.decor-item[data-decor="lantern"]');
    expect(item.style.left).toBe(`${ANCHOR_SLOTS.eaves!.x}%`);
    // 布置栏显示落位
    expect(el(".arrange").textContent).toContain("已摆 · 檐下");

    // 布置：点纱灯手持进入摆放模式；首次进入弹「一物得其所」番外折
    const moveChip = [...document.querySelectorAll<HTMLButtonElement>(".arrange-list .chip")].find((c) =>
      c.textContent?.includes("纱灯"),
    )!;
    moveChip.click();
    tick(50);
    expect(el<HTMLElement>("#app").dataset.mode).toBe("place");
    expect(el(".modal.side-story").textContent).toContain("一物得其所");
    el<HTMLButtonElement>(".modal.side-story .cta").click();
    tick(50);

    // 8 个锚位标记浮现；手持纱灯点「门前」落座
    expect(document.querySelectorAll(".anchor-spot")).toHaveLength(8);
    expect(el(".place-holding").textContent).toContain("纱灯");
    el<HTMLButtonElement>('.anchor-spot[data-anchor="gate"]').click();
    tick(50);
    expect(item.style.left).toBe(`${ANCHOR_SLOTS.gate!.x}%`);

    // 空手点「门前」拿起，再点「回匣」；退出后布置栏显示「在匣」
    el<HTMLButtonElement>('.anchor-spot[data-anchor="gate"]').click();
    tick(50);
    expect(el(".place-holding").textContent).toContain("纱灯");
    el<HTMLButtonElement>(".place-stash").click();
    tick(50);
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    tick(50);
    expect(el<HTMLElement>("#app").dataset.mode).toBeUndefined();
    dockBtn("decor").click();
    tick(50);
    expect(el(".arrange").textContent).toContain("在匣");
    expect(document.querySelector('.decor-item[data-decor="lantern"]')).toBeNull();
  });

  it("applying a theme paints [data-theme] on the app root", () => {
    boot(el("#app"));
    tick(50);
    expect(el<HTMLElement>("#app").dataset.theme).toBe("");

    dockBtn("decor").click();
    tick(50);
    const springBtn = [...document.querySelectorAll<HTMLButtonElement>(".themes button")].find((b) =>
      b.textContent?.includes("春晓"),
    )!;
    springBtn.click();
    tick(50);
    expect(el<HTMLElement>("#app").dataset.theme).toBe("spring");
    // 主题三件套全部入景
    for (const id of ["lantern", "swing", "path"]) {
      expect(document.querySelector(`.decor-item[data-decor="${id}"]`)).not.toBeNull();
    }
  });
});
