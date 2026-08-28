// 掌语字条：世界观短句的低干扰展示条（GDD 的「掌语」碎片，story 表由 F1 供给，
// 这里只管展示口）。设计约束：
//   1. 一次只亮一条（字幕位，不堆叠），亮完隔一小口气再放下一条；
//   2. 队列全长 ≤3（在显 1 + 排队 2），塞满就拒收 —— 掌语是氛围不是必达通知，
//      宁可丢句也不糊屏；
//   3. 复用 .yz-plate 磨砂板材质，但节点独立于 .yz-center-note / .yz-toast，
//      战斗提示和掌语永远不抢同一块牌。
// DOM：.yz-lore > .yz-plate.yz-lore-item（常驻节点，JS 只写文本 + .is-on）。

import { h } from "./dom.js";

/** 一条字条的停留时长：比 toast 长（是给人读的句子），但不粘屏。 */
const SHOW_MS = 4600;

/** 两条之间的换气间隔：上一条淡出后稍停，别像走马灯。 */
const GAP_MS = 260;

/** 在显 + 排队的总上限。 */
const QUEUE_MAX = 3;

export function createLoreStrip() {
  const text = h("span", { class: "yz-lore-text" });
  const item = h("div", { class: "yz-plate yz-lore-item" }, [text]);
  const el = h("div", { class: "yz-lore", role: "status" }, [item]);

  /** @type {{ text: string, ms: number }[]} 队首是正在显示的那条。 */
  const queue = [];
  let hideTimer = 0;
  let gapTimer = 0;

  function present() {
    const head = queue[0];
    if (!head) return;
    text.textContent = head.text;
    item.classList.add("is-on");
    clearTimeout(hideTimer);
    hideTimer = setTimeout(() => {
      item.classList.remove("is-on");
      queue.shift();
      clearTimeout(gapTimer);
      if (queue.length) gapTimer = setTimeout(present, GAP_MS);
    }, head.ms);
  }

  return {
    el,
    /**
     * 排队展示一句掌语。
     * @param {string} input 句子本体（空串不收）
     * @param {number} [ms]  停留毫秒数，默认 4.6s
     * @returns {boolean} 是否收下（队列塞满 / 空句时 false）
     */
    show(input, ms = SHOW_MS) {
      const line = input == null ? "" : String(input).trim();
      if (!line) return false;
      if (queue.length >= QUEUE_MAX) return false;
      queue.push({ text: line, ms: Math.max(1000, ms) });
      if (queue.length === 1) present();
      return true;
    },
    /** 队列还压着几条（含正在显示的那条）。 */
    pending: () => queue.length,
    clear() {
      queue.length = 0;
      clearTimeout(hideTimer);
      clearTimeout(gapTimer);
      item.classList.remove("is-on");
      text.textContent = "";
    },
  };
}
