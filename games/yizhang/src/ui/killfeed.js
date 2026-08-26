// 击杀播报。Fable-2 合同：.yz-feed > .yz-feed-item，与本机玩家相关的挂 .is-me，
// 名字用 <strong> 提亮。最多 5 条，4 秒后移除。

import { h } from "./dom.js";

const MAX_ROWS = 5;
const LIFE_MS = 4200;

export function createKillFeed() {
  const el = h("div", { class: "yz-feed" });
  const rows = [];

  function push({ killer, victim, method = "扇 出 岛", mine = false }) {
    const item = h("div", { class: "yz-plate yz-feed-item" }, [
      killer ? h("strong", { text: killer }) : h("span", { text: "失足" }),
      h("span", { text: ` ${method} ` }),
      h("strong", { text: victim }),
    ]);
    if (mine) item.classList.add("is-me");
    el.appendChild(item);

    const row = { node: item, timer: 0 };
    row.timer = setTimeout(() => {
      item.remove();
      const i = rows.indexOf(row);
      if (i >= 0) rows.splice(i, 1);
    }, LIFE_MS);
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
