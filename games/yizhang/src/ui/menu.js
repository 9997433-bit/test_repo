// 主菜单：双掌配装。左边两个掌位，下面八张掌卡，点掌位选中槽，点掌卡填进去。
// 未解锁的掌显示解锁条件而不是灰一片没有下文。

import { h } from "./dom.js";

export function createMenu({ gloves, save, onStart, onPick, onOpenSettings }) {
  const state = {
    slot: 0,
    main: save.loadout.main,
    off: save.loadout.off,
    unlocked: new Set(save.unlocked),
  };

  if (!state.unlocked.has(state.main)) state.main = gloves[0].id;
  if (!state.unlocked.has(state.off)) state.off = state.main;

  const byId = Object.fromEntries(gloves.map((g) => [g.id, g]));
  const slotEls = [];
  const cardEls = new Map();

  const detail = h("p", {
    text: "第三人称浮空擂台。选两只手套进裂岛：扇击积掌意，掌意满 8 秒觉醒，把对手扇出岛外。先到 7 杀或撑满 4 分钟。",
  });

  function makeSlot(index, label) {
    const el = h("button", { class: "yz-slot", type: "button" }, [
      h("span", { text: label }),
      h("b", { text: "—" }),
      h("em", { text: "" }),
    ]);
    el.addEventListener("click", () => {
      state.slot = index;
      render();
      if (onPick) onPick("slot");
    });
    slotEls.push(el);
    return el;
  }

  const slotMain = makeSlot(0, "主掌 · 1");
  const slotOff = makeSlot(1, "副掌 · 2");

  const grid = h("div", { class: "yz-grid" });
  for (const g of gloves) {
    const card = h("button", { class: "yz-card", type: "button" }, [
      h("div", { class: "yz-card-top" }, [
        h("b", { text: g.name }),
        h("i", { text: g.role }),
      ]),
      h("p", { text: g.skillId === "none" ? g.skillDesc || "无主动技" : `${g.skillName || "主动"}：${g.skillDesc || ""}` }),
      h("small", { text: `觉醒 · ${g.awakenDesc || "强化当前形态"}` }),
      h("small", { class: "yz-card-unlock", text: "" }),
      h("span", { class: "yz-pick-tag", text: "" }),
    ]);
    card.style.setProperty("--card-color", g.color || "#7f8c9e");
    card.addEventListener("click", () => {
      if (!state.unlocked.has(g.id)) return;
      if (state.slot === 0) state.main = g.id;
      else state.off = g.id;
      state.slot = state.slot === 0 ? 1 : 0;
      render();
      if (onPick) onPick("card");
    });
    cardEls.set(g.id, card);
    grid.appendChild(card);
  }

  const startBtn = h("button", {
    class: "yz-btn",
    type: "button",
    "data-primary": true,
    text: "进 裂 岛",
  });
  startBtn.addEventListener("click", () => onStart({ main: state.main, off: state.off }));

  const settingsBtn = h("button", { class: "yz-btn", type: "button", "data-ghost": true, text: "设 置" });
  if (onOpenSettings) settingsBtn.addEventListener("click", onOpenSettings);

  const hint = h("div", { class: "yz-hintline" });

  const el = h("div", { class: "yz-screen yz-menu", "data-modal": true }, [
    h("div", { class: "yz-menu-head" }, [
      h("h1", { class: "yz-title", text: "异掌" }),
      h("div", {}, [h("p", { class: "yz-kicker", text: "Round 1 · 竖切" }), detail]),
    ]),
    h("div", { class: "yz-loadout" }, [slotMain, slotOff]),
    grid,
    h("div", { class: "yz-menu-foot" }, [startBtn, settingsBtn, hint]),
  ]);

  function render() {
    const picks = [state.main, state.off];
    slotEls.forEach((slotEl, i) => {
      const g = byId[picks[i]] || gloves[0];
      slotEl.dataset.active = state.slot === i ? "1" : "0";
      slotEl.style.setProperty("--slot-color", g.color || "#7f8c9e");
      slotEl.querySelector("b").textContent = g.name;
      slotEl.querySelector("em").textContent = `${g.role} · ${g.skillId === "none" ? "无主动" : g.skillName}`;
    });

    for (const g of gloves) {
      const card = cardEls.get(g.id);
      const unlocked = state.unlocked.has(g.id);
      card.disabled = !unlocked;
      const slotIndex = picks.indexOf(g.id);
      const tag = card.querySelector(".yz-pick-tag");
      if (slotIndex === 0 && picks[0] === picks[1]) tag.textContent = "主 + 副";
      else if (slotIndex === 0) tag.textContent = "主掌";
      else if (slotIndex === 1) tag.textContent = "副掌";
      else tag.textContent = "";
      if (slotIndex >= 0) card.dataset.picked = "1";
      else delete card.dataset.picked;
      card.querySelector(".yz-card-unlock").textContent = unlocked
        ? `已解锁 · ${g.material || ""}`
        : `未解锁 · ${g.unlock?.text || "局内挑战"}`;
    }

    hint.textContent =
      state.main === state.off
        ? "两个掌位相同：Q 换掌不会有效果，建议配两只不同的手套。"
        : "Q 键在局内切换主副掌，切换有 0.4 秒收掌硬直。";
  }

  render();

  return {
    el,
    render,
    getLoadout: () => ({ main: state.main, off: state.off }),
    setUnlocked(list) {
      state.unlocked = new Set(list);
      if (!state.unlocked.has(state.main)) state.main = gloves[0].id;
      if (!state.unlocked.has(state.off)) state.off = state.main;
      render();
    },
    focusStart() {
      startBtn.focus();
    },
  };
}
