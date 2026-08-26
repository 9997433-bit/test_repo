// 主菜单：标题 + 双掌配装 + 进裂岛。Fable-2 合同（§11.5）：
//   .yz-screen.yz-screen--deep > .yz-home
//     ├── .yz-title / .yz-subtitle
//     ├── .yz-plate.yz-panel.yz-panel--wide（选掌板）
//     │     └── .yz-glove-grid > .yz-glove-tile(.is-main/.is-off/.is-locked)
//     ├── .yz-menu > .yz-btn(.yz-btn--primary / .yz-btn--ghost)
//     └── .yz-foot

import { h, clear } from "./dom.js";
import { gloveIcon } from "./hud.js";

export function createMenu({
  gloves,
  save,
  switchLock = 0.4,
  isUnlocked,
  unlockTextOf,
  onStart,
  onPick,
  onOpenSettings,
}) {
  const unlockText = unlockTextOf || (() => "局内挑战");
  const state = {
    slot: 0,
    main: save.loadout.main,
    off: save.loadout.off,
    save,
  };

  const byId = Object.fromEntries(gloves.map((g) => [g.id, g]));
  const tiles = new Map();

  function unlocked(id) {
    return isUnlocked ? !!isUnlocked(id, state.save) : true;
  }

  function firstUnlocked() {
    const hit = gloves.find((g) => unlocked(g.id));
    return (hit || gloves[0]).id;
  }

  if (!unlocked(state.main)) state.main = firstUnlocked();
  if (!unlocked(state.off)) state.off = state.main;

  // ---- 选掌网格 ----
  const grid = h("div", { class: "yz-glove-grid" });
  for (const g of gloves) {
    const icon = gloveIcon();
    const lockNote = h("div", { class: "yz-lock-note" });
    const tile = h("div", {
      class: "yz-plate yz-glove-tile",
      role: "button",
      tabindex: "0",
      dataset: { glove: g.id },
    }, [
      icon.el,
      h("div", { class: "yz-glove-name", text: g.name }),
      h("div", { class: "yz-glove-role", text: g.role || "" }),
      lockNote,
    ]);
    const choose = () => {
      if (!unlocked(g.id)) return;
      if (state.slot === 0) state.main = g.id;
      else state.off = g.id;
      state.slot = state.slot === 0 ? 1 : 0;
      render();
      if (onPick) onPick(g.id);
    };
    tile.addEventListener("click", choose);
    tile.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        choose();
      }
    });
    tiles.set(g.id, { tile, lockNote });
    grid.appendChild(tile);
  }

  // ---- 掌位摘要（当前主 / 副）----
  const slotRow = h("div", { class: "yz-dock-row" });
  const slotButtons = [0, 1].map((index) => {
    const icon = gloveIcon();
    const name = h("span", { class: "yz-glove-name", text: "—" });
    const kbd = h("span", { class: "yz-kbd", text: index === 0 ? "主 1" : "副 2" });
    const el = h("button", { class: "yz-plate yz-glove-card", type: "button" }, [icon.el, name, kbd]);
    el.addEventListener("click", () => {
      state.slot = index;
      render();
      if (onPick) onPick("slot");
    });
    return { el, name, index };
  });
  slotRow.append(...slotButtons.map((s) => s.el));

  const hint = h("p", { class: "yz-lock-note" });

  const panel = h("div", { class: "yz-plate yz-panel yz-panel--wide" }, [
    h("h2", { class: "yz-heading", text: "配 掌" }),
    slotRow,
    h("div", { class: "yz-scroll" }, [grid]),
    hint,
  ]);

  const startBtn = h("button", {
    class: "yz-btn yz-btn--primary",
    type: "button",
    text: "进 裂 岛",
  });
  startBtn.addEventListener("click", () => onStart({ main: state.main, off: state.off }));

  const settingsBtn = h("button", { class: "yz-btn yz-btn--ghost", type: "button", text: "设 置" });
  if (onOpenSettings) settingsBtn.addEventListener("click", onOpenSettings);

  const foot = h("div", { class: "yz-foot" });

  const el = h("div", { class: "yz-screen yz-screen--deep" }, [
    h("div", { class: "yz-home" }, [
      h("div", {}, [
        h("h1", { class: "yz-title", text: "异 掌" }),
        h("p", { class: "yz-subtitle", text: "暮色裂岛 · 一场体面的巴掌架" }),
      ]),
      panel,
      h("div", { class: "yz-menu" }, [startBtn, settingsBtn]),
    ]),
    foot,
  ]);

  function render() {
    const picks = [state.main, state.off];

    // 识别色峰值跟着主掌走
    el.dataset.glove = state.main;

    slotButtons.forEach((slot) => {
      const g = byId[picks[slot.index]] || gloves[0];
      slot.el.dataset.glove = g.id;
      slot.name.textContent = g.name;
      slot.el.classList.toggle("is-active", state.slot === slot.index);
    });

    for (const g of gloves) {
      const entry = tiles.get(g.id);
      const open = unlocked(g.id);
      const slotIndex = picks.indexOf(g.id);
      entry.tile.classList.toggle("is-locked", !open);
      entry.tile.classList.toggle("is-main", open && slotIndex === 0);
      entry.tile.classList.toggle("is-off", open && picks[1] === g.id && picks[0] !== g.id);
      entry.lockNote.textContent = open ? g.desc || g.role || "" : unlockText(g);
    }

    hint.textContent =
      state.main === state.off
        ? "两个掌位相同：Q 换掌不会有效果，建议配两只不同的手套。"
        : `点掌位选槽，点掌卡填入。局内 Q 换掌，有 ${switchLock.toFixed(1)} 秒收掌硬直。`;
  }

  render();

  return {
    el,
    render,
    getLoadout: () => ({ main: state.main, off: state.off }),
    setSave(next) {
      state.save = next;
      if (!unlocked(state.main)) state.main = firstUnlocked();
      if (!unlocked(state.off)) state.off = state.main;
      render();
    },
    setFoot(nodes) {
      clear(foot);
      for (const node of nodes) foot.appendChild(node);
    },
    focusStart() {
      startBtn.focus();
    },
  };
}
