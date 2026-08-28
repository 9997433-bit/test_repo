// @vitest-environment jsdom
//
// P3 连击/命中反馈席的两件读数（GDD 无血条——两件都是「次数/回执」，
// 不是血条也不是伤害数字）：
//
// 1. 连击读数 `.yz-combo`：combo≥2 时准星斜上方的小板「N 连」，断连
//    （sim 过 comboWindow 清零）或出局即收。只镜像 view.combo，HUD 不自己
//    计时；不占中央短讯位（.yz-center-note 照旧管开局/解锁）、不盖准星。
// 2. 命中确认圈 `.yz-hit-ring`：点脉冲 `.is-hit` 之上的加强档——同一瞬
//    外扩一圈细环，≤200ms 自摘。与点脉冲同触发同性质（回执），free 模式
//    的裸点合同（§18 LOOK-R2）不因此多出第二套常驻指示。
//
// 外观合同的反查（CSS 文本断言）在 hud-feel-css.test.js（node 环境读文件）。

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createHud } from "./hud.js";

function mount() {
  const hud = createHud();
  document.body.appendChild(hud.el);
  return {
    hud,
    combo: hud.el.querySelector(".yz-combo"),
    ring: hud.el.querySelector(".yz-hit-ring"),
    reticle: hud.el.querySelector(".yz-reticle"),
  };
}

/** 最小可跑的一帧快照：一名本机玩家 + 可选覆写（与 hud-impact 同姿势）。 */
function frame(self = {}, extra = {}) {
  return {
    timeLeft: 120,
    players: [
      {
        id: "p0",
        kills: 0,
        meter: 0,
        alive: true,
        statuses: [],
        combo: 0,
        knockScale: 1,
        ...self,
      },
    ],
    events: [],
    ...extra,
  };
}

beforeEach(() => {
  document.body.innerHTML = "";
});

afterEach(() => {
  vi.useRealTimers();
});

describe("连击读数 .yz-combo", () => {
  it("常驻节点挂在 #hud 里，默认不亮；与中央短讯是两个节点", () => {
    const { hud, combo } = mount();
    expect(combo).not.toBeNull();
    expect(combo.parentElement).toBe(hud.el);
    expect(combo.classList.contains("is-on")).toBe(false);
    expect(combo).not.toBe(hud.el.querySelector(".yz-center-note"));
  });

  it("combo 0 / 1 不亮：单掌只是命中，两掌起才叫「连」", () => {
    const { hud, combo } = mount();
    hud.update(frame({ combo: 0 }), "p0");
    expect(combo.classList.contains("is-on")).toBe(false);
    hud.update(frame({ combo: 1 }), "p0");
    expect(combo.classList.contains("is-on")).toBe(false);
  });

  it("combo 2 亮出「2 连」；续到 3 数字跟着走", () => {
    const { hud, combo } = mount();
    hud.update(frame({ combo: 2 }), "p0");
    expect(combo.classList.contains("is-on")).toBe(true);
    expect(combo.querySelector(".yz-combo-num").textContent).toBe("2");
    expect(combo.textContent).toBe("2连");

    hud.update(frame({ combo: 3 }), "p0");
    expect(combo.classList.contains("is-on")).toBe(true);
    expect(combo.textContent).toBe("3连");
  });

  it("断连（sim 过 comboWindow 清零）即收，不留残数在亮", () => {
    const { hud, combo } = mount();
    hud.update(frame({ combo: 3 }), "p0");
    hud.update(frame({ combo: 0 }), "p0");
    expect(combo.classList.contains("is-on")).toBe(false);
  });

  it("出局即收：不叠在重组浮层上", () => {
    const { hud, combo } = mount();
    hud.update(frame({ combo: 3 }), "p0");
    hud.update(frame({ combo: 3, alive: false, respawnT: 2 }), "p0");
    expect(combo.classList.contains("is-on")).toBe(false);
  });

  it("亮着时又续一掌：.is-bump 蹦一下后自摘；首次亮出不蹦", () => {
    vi.useFakeTimers();
    const { hud, combo } = mount();
    hud.update(frame({ combo: 2 }), "p0");
    expect(combo.classList.contains("is-bump")).toBe(false);

    hud.update(frame({ combo: 3 }), "p0");
    expect(combo.classList.contains("is-bump")).toBe(true);
    vi.advanceTimersByTime(200);
    expect(combo.classList.contains("is-bump")).toBe(false);
  });

  it("不叠中央大字 toast：连击亮着时 .yz-center-note 仍是收起的", () => {
    const { hud } = mount();
    hud.update(frame({ combo: 4 }), "p0");
    expect(hud.el.querySelector(".yz-center-note").hidden).toBe(true);
  });

  it("reset 收起并清数字（新一局不能带着上一局的连数）", () => {
    const { hud, combo } = mount();
    hud.update(frame({ combo: 5 }), "p0");
    hud.reset();
    expect(combo.classList.contains("is-on")).toBe(false);
    expect(combo.classList.contains("is-bump")).toBe(false);
    expect(combo.querySelector(".yz-combo-num").textContent).toBe("0");
  });

  it("GDD 无血条：读数是「次数 + 连」，不是 HP 也不是伤害数字", () => {
    const { hud, combo } = mount();
    hud.update(
      frame({ combo: 3 }, { events: [{ type: "hit", playerId: "p0", targetId: "b1" }] }),
      "p0"
    );
    // 文案就是「N连」两截，没有减号 / 百分号 / HP 字样
    expect(combo.textContent).toMatch(/^\d+连$/);
    // HUD 里不存在血条 / 伤害数字类的节点
    expect(hud.el.querySelector(".yz-hp, .yz-health, .yz-damage, .yz-dmg")).toBeNull();
  });
});

describe("命中确认圈 .yz-hit-ring", () => {
  it("自己打中人（combo 递增）→ 圈亮一瞬 ≤200ms 自摘；点脉冲照旧 ≤120ms", () => {
    vi.useFakeTimers();
    const { hud, ring, reticle } = mount();
    hud.update(frame({ combo: 0 }), "p0");
    expect(ring.classList.contains("is-on")).toBe(false);

    hud.update(frame({ combo: 1 }), "p0");
    expect(ring.classList.contains("is-on")).toBe(true);
    expect(reticle.classList.contains("is-hit")).toBe(true);

    vi.advanceTimersByTime(120);
    expect(reticle.classList.contains("is-hit")).toBe(false);
    vi.advanceTimersByTime(80); // 累计 200ms：圈也必须收了
    expect(ring.classList.contains("is-on")).toBe(false);
  });

  it("挨打 / 别人的 hit 不亮圈（与点脉冲同一判定）", () => {
    vi.useFakeTimers();
    const { hud, ring } = mount();
    hud.update(frame({ combo: 3 }), "p0");
    vi.advanceTimersByTime(250);
    hud.update(
      frame({ combo: 0 }, { events: [{ type: "hit", playerId: "b1", targetId: "p0" }] }),
      "p0"
    );
    expect(ring.classList.contains("is-on")).toBe(false);
  });

  it("pulseReticle 手动调用也带圈（点脉冲与确认圈同触发）", () => {
    vi.useFakeTimers();
    const { hud, ring } = mount();
    hud.pulseReticle();
    expect(ring.classList.contains("is-on")).toBe(true);
    vi.advanceTimersByTime(200);
    expect(ring.classList.contains("is-on")).toBe(false);
  });

  it("连击第二掌重播：先摘再挂，计时从后一掌重新起算", () => {
    vi.useFakeTimers();
    const { hud, ring } = mount();
    hud.pulseReticle();
    vi.advanceTimersByTime(100);
    hud.pulseReticle();
    vi.advanceTimersByTime(179); // 距第二掌还差 1ms：仍亮
    expect(ring.classList.contains("is-on")).toBe(true);
    vi.advanceTimersByTime(1);
    expect(ring.classList.contains("is-on")).toBe(false);
  });

  it("回执不是常驻：摘掉后圈与准星都只剩裸类，一屏各只有一枚", () => {
    vi.useFakeTimers();
    const { hud, ring, reticle } = mount();
    hud.update(frame({ combo: 1 }), "p0");
    vi.advanceTimersByTime(200);
    expect(ring.className).toBe("yz-hit-ring");
    expect(reticle.className).toBe("yz-reticle");
    expect(hud.el.querySelectorAll(".yz-hit-ring")).toHaveLength(1);
    expect(hud.el.querySelectorAll(".yz-reticle")).toHaveLength(1);
  });

  it("reset 立即摘圈，旧计时器不回魂", () => {
    vi.useFakeTimers();
    const { hud, ring } = mount();
    hud.pulseReticle();
    hud.reset();
    expect(ring.classList.contains("is-on")).toBe(false);
    vi.advanceTimersByTime(500);
    expect(ring.classList.contains("is-on")).toBe(false);
  });
});
