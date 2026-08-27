// 主菜单：标题 + 双掌配装 + 选皮肤 + 进裂岛。Fable-2 合同（§11.5）：
//   .yz-screen.yz-screen--deep > .yz-home
//     ├── .yz-title / .yz-subtitle
//     ├── .yz-plate.yz-panel.yz-panel--wide（选掌板）
//     │     └── .yz-glove-grid > .yz-glove-tile(.is-main/.is-off/.is-locked)
//     ├── .yz-plate.yz-panel.yz-panel--wide（选皮肤板）
//     │     └── .yz-glove-grid.yz-skin-grid > .yz-glove-tile.yz-skin-tile(.is-main)
//     ├── .yz-menu > .yz-btn(.yz-btn--primary / .yz-btn--ghost)
//     └── .yz-foot
//
// 皮肤格沿用选掌格的合同类（Fable-2 的 CSS 直接就位），剪影是内联 SVG：
// 低面数几何体的比例预览，不下载任何素材、不引第二套皮肤 CSS。

import { h, clear, svg } from "./dom.js";
import { gloveIcon } from "./hud.js";
import { FALLBACK_SKINS, normalizeSkinId, resolveSkins } from "../core/skins.js";

function clampNum(v, lo, hi, fallback) {
  return Number.isFinite(v) ? Math.max(lo, Math.min(hi, v)) : fallback;
}

/** 皮肤剪影：头 / 肩 / 躯干三段按 build 比例缩放，再按 accessory 加一件配件。 */
export function skinSilhouette(skin) {
  const b = (skin && skin.build) || {};
  const height = clampNum(b.height, 0.85, 1.2, 1);
  const mass = clampNum(b.mass, 0.75, 1.35, 1);
  const shoulder = clampNum(b.shoulder, 0.8, 1.35, 1);
  const cloth = skin.cloth || "#6d7280";
  const trim = skin.trim || "#2c313b";
  const accent = skin.accent || "#d9cfba";

  const headR = 5;
  const headY = 13 - (height - 1) * 22;
  const shoulderY = headY + headR + 2;
  const shoulderW = 23 * shoulder;
  const torsoW = 14.5 * mass;
  const torsoTop = shoulderY + 2;
  const torsoH = 46 - torsoTop;

  const parts = [];
  if (skin.accessory === "cloak") {
    parts.push(
      svg("rect", {
        x: 20 - (torsoW + 9) / 2,
        y: shoulderY,
        width: torsoW + 9,
        height: torsoH + 5,
        rx: 5,
        fill: trim,
        opacity: "0.85",
      })
    );
  }
  parts.push(
    svg("rect", { x: 20 - shoulderW / 2, y: shoulderY, width: shoulderW, height: 6, rx: 3, fill: trim }),
    svg("rect", { x: 20 - torsoW / 2, y: torsoTop, width: torsoW, height: torsoH, rx: torsoW * 0.34, fill: cloth }),
    svg("circle", { cx: 20, cy: headY, r: headR, fill: "#c9a184" })
  );

  switch (skin.accessory) {
    case "hood":
      parts.push(
        svg("path", {
          d: `M ${20 - headR - 2.4} ${headY + 2} A ${headR + 2.4} ${headR + 2.4} 0 0 1 ${20 + headR + 2.4} ${headY + 2} Z`,
          fill: accent,
        })
      );
      break;
    case "turban":
      parts.push(svg("rect", { x: 20 - headR - 1, y: headY - headR - 1, width: (headR + 1) * 2, height: 4.2, rx: 2, fill: accent }));
      break;
    case "pauldron":
      parts.push(
        svg("rect", { x: 20 - shoulderW / 2 - 1, y: shoulderY - 1.6, width: 7, height: 7, rx: 2.2, fill: accent }),
        svg("rect", { x: 20 + shoulderW / 2 - 6, y: shoulderY - 1.6, width: 7, height: 7, rx: 2.2, fill: accent })
      );
      break;
    case "bracer":
      parts.push(
        svg("rect", { x: 20 - torsoW / 2 - 4.6, y: torsoTop + torsoH * 0.42, width: 4.4, height: 8, rx: 1.8, fill: accent }),
        svg("rect", { x: 20 + torsoW / 2 + 0.2, y: torsoTop + torsoH * 0.42, width: 4.4, height: 8, rx: 1.8, fill: accent })
      );
      break;
    case "sash":
      parts.push(
        svg("polygon", {
          points: `${20 - torsoW / 2},${torsoTop + torsoH * 0.34} ${20 + torsoW / 2},${torsoTop + torsoH * 0.16} ${20 + torsoW / 2},${torsoTop + torsoH * 0.34} ${20 - torsoW / 2},${torsoTop + torsoH * 0.52}`,
          fill: accent,
        })
      );
      break;
    case "cloak":
      parts.push(svg("rect", { x: 20 - 3, y: shoulderY + 1, width: 6, height: 5, rx: 2, fill: accent }));
      break;
    default:
      parts.push(
        svg("rect", { x: 20 - torsoW / 2, y: torsoTop + torsoH * 0.52, width: torsoW, height: 3.6, rx: 1.6, fill: accent })
      );
      break;
  }

  return svg(
    "svg",
    { viewBox: "0 0 40 52", width: "40", height: "52", class: "yz-skin-figure", "aria-hidden": "true" },
    parts
  );
}

export function createMenu({
  gloves,
  skins,
  skinTable,
  save,
  switchLock = 0.4,
  isUnlocked,
  unlockTextOf,
  onStart,
  onPick,
  onPickSkin,
  onOpenSettings,
}) {
  const unlockText = unlockTextOf || (() => "局内挑战");
  const table = skinTable || (Array.isArray(skins) && skins.length
    ? { skins, byId: Object.fromEntries(skins.map((s) => [s.id, s])), defaultId: skins[0].id }
    : resolveSkins(null));
  const skinList = table.skins && table.skins.length ? table.skins : FALLBACK_SKINS;
  const state = {
    slot: 0,
    main: save.loadout.main,
    off: save.loadout.off,
    skinId: normalizeSkinId(save.skinId, table),
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

  // ---- 选皮肤 ----
  const skinGrid = h("div", { class: "yz-glove-grid yz-skin-grid" });
  const skinTiles = new Map();
  for (const s of skinList) {
    const tile = h(
      "div",
      {
        class: "yz-plate yz-glove-tile yz-skin-tile",
        role: "button",
        tabindex: "0",
        dataset: { skin: s.id },
        style: { alignItems: "center", textAlign: "center" },
      },
      [
        skinSilhouette(s),
        h("div", { class: "yz-glove-name", text: s.name || s.id }),
        h("div", { class: "yz-glove-role", text: s.desc || "" }),
      ]
    );
    const choose = () => {
      if (state.skinId === s.id) return;
      state.skinId = s.id;
      render();
      if (onPickSkin) onPickSkin(s.id);
    };
    tile.addEventListener("click", choose);
    tile.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        choose();
      }
    });
    skinTiles.set(s.id, tile);
    skinGrid.appendChild(tile);
  }

  const skinHint = h("p", { class: "yz-lock-note" });
  const skinPanel = h("div", { class: "yz-plate yz-panel yz-panel--wide" }, [
    h("h2", { class: "yz-heading", text: "选 皮 肤" }),
    h("div", { class: "yz-scroll" }, [skinGrid]),
    skinHint,
  ]);

  const startBtn = h("button", {
    class: "yz-btn yz-btn--primary",
    type: "button",
    text: "进 裂 岛",
  });
  startBtn.addEventListener("click", () =>
    onStart({ main: state.main, off: state.off, skinId: state.skinId })
  );

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
      skinPanel,
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

    const skin = table.byId[state.skinId] || skinList[0];
    for (const [id, tile] of skinTiles) tile.classList.toggle("is-main", id === state.skinId);
    skinHint.textContent = `当前皮肤：${skin.name || skin.id} · ${skin.desc || ""}（存档记住这一套，bot 会错开用别的）`;
  }

  render();

  return {
    el,
    render,
    getLoadout: () => ({ main: state.main, off: state.off, skinId: state.skinId }),
    getSkinId: () => state.skinId,
    setSkinId(id) {
      state.skinId = normalizeSkinId(id, table);
      render();
      return state.skinId;
    },
    setSave(next) {
      state.save = next;
      if (!unlocked(state.main)) state.main = firstUnlocked();
      if (!unlocked(state.off)) state.off = state.main;
      if (next && next.skinId) state.skinId = normalizeSkinId(next.skinId, table);
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
