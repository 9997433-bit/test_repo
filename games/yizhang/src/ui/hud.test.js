// @vitest-environment jsdom
//
// 局内 HUD 的视角模式接线（LOOK-R1 / ART_DIRECTION §18）。钉三件事：
// `.yz-look-flash` 是 #hud 里的常驻节点（不是每次切换现造）；
// `#hud[data-look]` 是随 `input.getLookMode()` 走的装饰镜像（权威仍在 input）；
// 一瞬反馈只亮约 0.9s，连按只重置计时、不排队也不叠第二块字。
//
// 顺带按 F2 写死在 `styles/hud.css` 里的选择器反查 DOM：那边写的
// `#hud[data-look="locked"] .yz-reticle` 与 `[data-touch="1"] .yz-look-flash kbd`
// 得真能选中这里挂出来的节点，样式与 DOM 才算对上。

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createHud } from "./hud.js";

/** 挂到真 document 上：`[data-touch="1"] …` 这类祖先选择器要从 html 上起选。 */
function mount() {
  const hud = createHud();
  document.body.appendChild(hud.el);
  return { hud, flash: hud.el.querySelector(".yz-look-flash") };
}

beforeEach(() => {
  document.body.innerHTML = "";
  delete document.documentElement.dataset.touch;
});

afterEach(() => {
  vi.useRealTimers();
});

describe("视角模式一瞬反馈 .yz-look-flash", () => {
  it("是 #hud 里的常驻节点：role=status + 键帽 V，默认不亮", () => {
    const { hud, flash } = mount();
    expect(flash).not.toBeNull();
    expect(flash.parentElement).toBe(hud.el);
    expect(flash.getAttribute("role")).toBe("status");
    expect(flash.querySelector("kbd").textContent).toBe("V");
    expect(flash.classList.contains("is-on")).toBe(false);
  });

  it("切换写文案 + .is-on，约 0.9s 后自己摘掉", () => {
    vi.useFakeTimers();
    const { hud, flash } = mount();

    hud.setLookMode("free");
    hud.flashLook("free");
    expect(flash.classList.contains("is-on")).toBe(true);
    expect(flash.textContent).toContain("自由视角");

    vi.advanceTimersByTime(880);
    expect(flash.classList.contains("is-on")).toBe(true);
    vi.advanceTimersByTime(40);
    expect(flash.classList.contains("is-on")).toBe(false);
  });

  it("锁回去写「视角锁定」——两条文案就这两句，容 4~6 字", () => {
    const { hud, flash } = mount();
    hud.setLookMode("free");
    hud.setLookMode("locked");
    hud.flashLook("locked");
    expect(flash.firstChild.nodeValue).toBe("视角锁定");
    expect(flash.textContent).toBe("视角锁定V");
  });

  it("连按只重置计时：不排队、不在屏上叠第二块字", () => {
    vi.useFakeTimers();
    const { hud, flash } = mount();
    hud.flashLook("free");
    vi.advanceTimersByTime(700);
    hud.flashLook("locked");
    vi.advanceTimersByTime(700);
    // 第一次的计时被顶掉了，这会儿还亮着，而且屏上只有这一枚
    expect(flash.classList.contains("is-on")).toBe(true);
    expect(hud.el.querySelectorAll(".yz-look-flash")).toHaveLength(1);
    vi.advanceTimersByTime(300);
    expect(flash.classList.contains("is-on")).toBe(false);
  });

  it("reset 摘掉这一瞬的回执，但不清模式镜像（模式跨局延续）", () => {
    vi.useFakeTimers();
    const { hud, flash } = mount();
    hud.setLookMode("free");
    hud.flashLook("free");
    hud.reset();
    expect(flash.classList.contains("is-on")).toBe(false);
    expect(hud.el.dataset.look).toBe("free");
    // 已经摘了就别让旧计时器再回来动它
    vi.advanceTimersByTime(2000);
    expect(flash.classList.contains("is-on")).toBe(false);
  });

  it("触屏没有 V 键：F2 的 [data-touch=\"1\"] .yz-look-flash kbd 选得中这枚键帽", () => {
    const { flash } = mount();
    document.documentElement.dataset.touch = "1";
    expect(document.querySelector('[data-touch="1"] .yz-look-flash kbd')).toBe(
      flash.querySelector("kbd")
    );
  });
});

describe("视角模式镜像 #hud[data-look]", () => {
  it("setLookMode 把值贴到 #hud 上，并报出这次到底换没换", () => {
    const { hud } = mount();
    expect(hud.el.dataset.look).toBe("locked");
    expect(hud.setLookMode("free")).toBe(true);
    expect(hud.el.dataset.look).toBe("free");
    expect(hud.getLookMode()).toBe("free");
    // 同一个模式再喂一遍不算切换：壳层据此决定不放一瞬反馈
    expect(hud.setLookMode("free")).toBe(false);
  });

  it("认不出的值不动既有模式（权威在 input，HUD 只是镜像）", () => {
    const { hud } = mount();
    hud.setLookMode("free");
    expect(hud.setLookMode("orbit")).toBe(false);
    expect(hud.el.dataset.look).toBe("free");
  });

  it("locked 时准星锁刻的选择器命中；free 时同一条选择器落空", () => {
    const { hud } = mount();
    const reticle = hud.el.querySelector(".yz-reticle");
    hud.setLookMode("locked");
    expect(document.querySelector('#hud[data-look="locked"] .yz-reticle')).toBe(reticle);
    hud.setLookMode("free");
    expect(document.querySelector('#hud[data-look="locked"] .yz-reticle')).toBeNull();
  });
});
