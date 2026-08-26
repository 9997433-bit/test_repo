// 击杀播报。最多 5 条，4 秒淡出。事件优先取 sim 的 events，
// sim 不给事件时由 shell 通过 deaths 计数差分补上。

import { h } from "./dom.js";

const MAX_ROWS = 5;
const LIFE_MS = 4200;

export function createKillFeed() {
  const el = h("div", { class: "yz-feed" });
  const rows = [];

  function drop(row) {
    row.node.dataset.fading = "1";
    setTimeout(() => {
      row.node.remove();
      const i = rows.indexOf(row);
      if (i >= 0) rows.splice(i, 1);
    }, 440);
  }

  function push({ killer, victim, method = "扇出岛", color }) {
    const node = h("div", { class: "yz-feed-row" }, [
      killer ? h("em", { text: killer }) : h("s", { text: "失足" }),
      h("i", { text: method }),
      h("s", { text: victim }),
    ]);
    node.style.setProperty("--feed-color", color || "#7f8c9e");
    el.appendChild(node);
    const row = { node, timer: 0 };
    row.timer = setTimeout(() => drop(row), LIFE_MS);
    rows.push(row);
    while (rows.length > MAX_ROWS) {
      const old = rows.shift();
      clearTimeout(old.timer);
      old.node.remove();
    }
  }

  function clear() {
    for (const row of rows.splice(0)) {
      clearTimeout(row.timer);
      row.node.remove();
    }
  }

  return { el, push, clear };
}
