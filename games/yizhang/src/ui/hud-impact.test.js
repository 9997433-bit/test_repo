// @vitest-environment jsdom
//
// P2-F2 的两件受击可读性（GDD 无血条，这两件都不是血条也不是伤害数字）：
//
// 1. 击退累积刻度 `.yz-knock`：掌位坞里从空往满涨的「起飞表」。填充量
//    --knock 由 view.knockScale（1 起步，上限镜像 sim 的 3.2）归一得来，
//    涨了蹦一下（.is-bump）、进红区常亮（.is-hot）、重生跟着 view 清零。
// 2. 准星命中脉冲 `.yz-reticle.is-hit`：打中人的一瞬 ≤120ms 自摘。由 combo
//    递增或本帧本人 hit 事件触发 —— 是回执不是指示器，free 模式的裸点合同
//    （§18 LOOK-R2：不给 free 加第二枚常驻指示）不因此破例。
//
// 外观合同的反查（CSS 文本断言）在 hud-feel-css.test.js（node 环境读文件）。

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createHud } from "./hud.js";

function mount() {
  const hud = createHud();
  document.body.appendChild(hud.el);
  return {
    hud,
    knock: hud.el.querySelector(".yz-knock"),
    reticle: hud.el.querySelector(".yz-reticle"),
  };
}

/** 最小可跑的一帧快照：一名本机玩家 + 可选覆写。 */
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

describe("击退累积刻度 .yz-knock", () => {
  it("常驻在掌位坞里：填充 + 刻痕两层，不是第二根掌意条", () => {
    const { hud, knock } = mount();
    expect(knock).not.toBeNull();
    expect(knock.closest(".yz-glove-dock")).not.toBeNull();
    expect(knock.querySelector(".yz-knock-fill")).not.toBeNull();
    expect(knock.querySelector(".yz-knock-ticks")).not.toBeNull();
    // 与掌意条是两个节点、两个钩子（--knock vs --meter）
    expect(hud.el.querySelector(".yz-meter")).not.toBe(knock);
  });

  it("knockScale 1 → 空刻；线性涨到上限 3.2 → 满刻", () => {
    const { hud, knock } = mount();
    hud.update(frame({ knockScale: 1 }), "p0");
    expect(knock.style.getPropertyValue("--knock")).toBe("0.000");
    hud.update(frame({ knockScale: 2.1 }), "p0");
    expect(knock.style.getPropertyValue("--knock")).toBe("0.500");
    hud.update(frame({ knockScale: 3.2 }), "p0");
    expect(knock.style.getPropertyValue("--knock")).toBe("1.000");
  });

  it("view 没给 knockScale（兜底 sim）→ 按 1 起步，不显示半根鬼条", () => {
    const { hud, knock } = mount();
    hud.update(frame({ knockScale: undefined }), "p0");
    expect(knock.style.getPropertyValue("--knock")).toBe("0.000");
  });

  it("红区 .is-hot：过 62% 常亮，回落（落地回蓝 / 重生清零）就摘", () => {
    const { hud, knock } = mount();
    hud.update(frame({ knockScale: 2.4 }), "p0"); // k≈0.636
    expect(knock.classList.contains("is-hot")).toBe(true);
    hud.update(frame({ knockScale: 1 }), "p0"); // 重生
    expect(knock.classList.contains("is-hot")).toBe(false);
    expect(knock.style.getPropertyValue("--knock")).toBe("0.000");
  });

  it("涨了蹦一下 .is-bump（乱战可见「又挨了一掌」），跌了不蹦", () => {
    vi.useFakeTimers();
    const { hud, knock } = mount();
    hud.update(frame({ knockScale: 1 }), "p0");
    expect(knock.classList.contains("is-bump")).toBe(false);

    hud.update(frame({ knockScale: 1.3 }), "p0");
    expect(knock.classList.contains("is-bump")).toBe(true);
    vi.advanceTimersByTime(200);
    expect(knock.classList.contains("is-bump")).toBe(false);

    // 落地回一点（1.3 → 1.15）：是好事，不该闪
    hud.update(frame({ knockScale: 1.15 }), "p0");
    expect(knock.classList.contains("is-bump")).toBe(false);
  });

  it("reset 清空刻度与状态类（新一局不能带着上一局的红区）", () => {
    const { hud, knock } = mount();
    hud.update(frame({ knockScale: 3 }), "p0");
    hud.reset();
    expect(knock.style.getPropertyValue("--knock")).toBe("0");
    expect(knock.classList.contains("is-hot")).toBe(false);
    expect(knock.classList.contains("is-bump")).toBe(false);
  });
});

describe("准星命中脉冲 .yz-reticle.is-hit", () => {
  it("combo 递增（自己打中人）→ 亮一瞬，≤120ms 自摘", () => {
    vi.useFakeTimers();
    const { hud, reticle } = mount();
    hud.update(frame({ combo: 0 }), "p0");
    expect(reticle.classList.contains("is-hit")).toBe(false);

    hud.update(frame({ combo: 1 }), "p0");
    expect(reticle.classList.contains("is-hit")).toBe(true);
    vi.advanceTimersByTime(120);
    expect(reticle.classList.contains("is-hit")).toBe(false);
  });

  it("combo 回落 / 窗口过期 → 不脉冲（挨打与超时不是命中）", () => {
    vi.useFakeTimers();
    const { hud, reticle } = mount();
    hud.update(frame({ combo: 3 }), "p0");
    vi.advanceTimersByTime(200);
    hud.update(frame({ combo: 0 }), "p0");
    expect(reticle.classList.contains("is-hit")).toBe(false);
  });

  it("本帧事件里有自己的 hit 也认（双保险），别人的 hit 不认", () => {
    vi.useFakeTimers();
    const { hud, reticle } = mount();
    hud.update(
      frame({ combo: 2 }, { events: [{ type: "hit", playerId: "b1", targetId: "p0" }] }),
      "p0"
    );
    // 首帧 combo 2 > 0 会脉一次，先放掉再验事件路
    vi.advanceTimersByTime(200);
    hud.update(
      frame({ combo: 2 }, { events: [{ type: "hit", playerId: "b1", targetId: "b2" }] }),
      "p0"
    );
    expect(reticle.classList.contains("is-hit")).toBe(false);

    hud.update(
      frame({ combo: 2 }, { events: [{ type: "hit", playerId: "p0", targetId: "b1" }] }),
      "p0"
    );
    expect(reticle.classList.contains("is-hit")).toBe(true);
  });

  it("不是常驻指示：摘掉后准星只剩裸点那一个类（free 合同不破）", () => {
    vi.useFakeTimers();
    const { hud, reticle } = mount();
    hud.update(frame({ combo: 1 }), "p0");
    vi.advanceTimersByTime(150);
    expect(reticle.className).toBe("yz-reticle");
    expect(hud.el.querySelectorAll(".yz-reticle")).toHaveLength(1);
  });

  it("reset 立即摘脉冲，旧计时器不回魂", () => {
    vi.useFakeTimers();
    const { hud, reticle } = mount();
    hud.pulseReticle();
    expect(reticle.classList.contains("is-hit")).toBe(true);
    hud.reset();
    expect(reticle.classList.contains("is-hit")).toBe(false);
    vi.advanceTimersByTime(500);
    expect(reticle.classList.contains("is-hit")).toBe(false);
  });
});

