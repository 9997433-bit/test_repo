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
//
// 皮肤的 CSS 钩子一律**按 id 落在 data 属性上**（`.yz-skin-tile[data-skin="nuo"]`、
// `.yz-skin-figure[data-headgear="mask"]`），不给每套皮肤造一个新类名：
// 皮肤表随 F3 增删，选择器不该跟着改。

import { h, clear, svg } from "./dom.js";
import { gloveIcon } from "./hud.js";
import { FALLBACK_SKINS, normalizeSkinId, resolveSkins, skinAppearance } from "../core/skins.js";

const CX = 20;
const HEAD_R = 5;

/** 背件：契约 §3.2 规则 1 的识别色载体。三种形状从侧后方探出来，正视也认得。 */
function backParts(look, geo) {
  const { palette, trim } = look;
  const right = CX + geo.torsoW / 2;
  switch (look.back) {
    case "banner": {
      // 背旗：旗杆压在右肩后，旗面随 bannerHeight 长短
      const height = 16 * (trim.bannerHeight || 1);
      const top = geo.shoulderY - height * 0.55;
      return [
        svg("rect", { x: right - 0.4, y: top, width: 1.4, height: height, rx: 0.7, fill: palette.leather }),
        svg("polygon", {
          points: `${right + 1} ${top + 1} ${right + 8.5} ${top + 4.2} ${right + 1} ${top + 8.4}`,
          fill: palette.accent,
        }),
      ];
    }
    case "pack": {
      // 行囊：右腰后一坨，bulk 决定鼓多少
      const bulk = 1 * (trim.packBulk || 1);
      const w = 7.2 * bulk;
      const top = geo.torsoTop + geo.torsoH * 0.16;
      return [
        svg("rect", { x: right - 1.4, y: top, width: w, height: geo.torsoH * 0.52, rx: 2.6, fill: palette.leather }),
        svg("rect", { x: right - 1.4, y: top + geo.torsoH * 0.2, width: w, height: 2.2, fill: palette.accent }),
      ];
    }
    case "panel": {
      // 背板：贴着躯干右缘的一条竖漆板
      const top = geo.torsoTop + 1;
      return [
        svg("rect", { x: right - 1.2, y: top, width: 4.4, height: geo.torsoH * 0.66, rx: 1.6, fill: palette.clothDim }),
        svg("rect", { x: right + 0.2, y: top + 1.4, width: 1.8, height: geo.torsoH * 0.44, rx: 0.9, fill: palette.accent }),
      ];
    }
    default:
      return [];
  }
}

/** 头部件：契约六选一。灰度下也得两两分得开（GDD §13.1 灰度剪影判据）。 */
function headParts(look, geo) {
  const { palette, trim } = look;
  const y = geo.headY;
  switch (look.headgear) {
    case "hood": {
      const depth = HEAD_R + 2.2 + (trim.hoodDepth || 0) * 2;
      return [
        svg("path", {
          d: `M ${CX - depth} ${y + 2.4} A ${depth} ${depth} 0 0 1 ${CX + depth} ${y + 2.4} Z`,
          fill: palette.clothDim,
        }),
        svg("path", {
          d: `M ${CX - depth} ${y + 2.4} A ${depth} ${depth} 0 0 1 ${CX + depth} ${y + 2.4}`,
          fill: "none",
          stroke: palette.accent,
          "stroke-width": "1.1",
        }),
      ];
    }
    case "topknot":
      return [
        svg("circle", { cx: CX, cy: y - HEAD_R - 1.6, r: 2.1, fill: palette.clothDim }),
        svg("rect", { x: CX - 2.4, y: y - HEAD_R - 0.4, width: 4.8, height: 1.4, rx: 0.7, fill: palette.accent }),
      ];
    case "strawHat": {
      const brim = 9 + (trim.hatRadius || 0) * 16;
      return [
        svg("polygon", {
          points: `${CX - brim} ${y - 0.6} ${CX} ${y - HEAD_R - 4.2} ${CX + brim} ${y - 0.6}`,
          fill: palette.leather,
        }),
        svg("rect", { x: CX - brim, y: y - 1.2, width: brim * 2, height: 1.6, rx: 0.8, fill: palette.accent }),
      ];
    }
    case "mask":
      return [
        svg("rect", {
          x: CX - HEAD_R - 0.8,
          y: y - HEAD_R + 0.6,
          width: (HEAD_R + 0.8) * 2,
          height: HEAD_R * 1.8,
          rx: 1.8,
          fill: palette.clothDim,
        }),
        svg("rect", { x: CX - 0.7, y: y - HEAD_R + 1.4, width: 1.4, height: HEAD_R * 1.5, fill: palette.accent }),
        svg("rect", { x: CX - HEAD_R + 0.4, y: y - 0.6, width: HEAD_R * 2 - 0.8, height: 1.2, fill: palette.accent }),
      ];
    case "horns": {
      const spread = 3.4 + (trim.hornSpread || 0) * 5;
      return [
        svg("path", {
          d: `M ${CX - HEAD_R + 0.6} ${y - 2.6} q ${-spread} ${-1.6} ${-spread - 1} ${-5.2} q ${spread * 0.7} ${1.4} ${spread * 0.7 + 1.4} ${4.4} Z`,
          fill: palette.accent,
        }),
        svg("path", {
          d: `M ${CX + HEAD_R - 0.6} ${y - 2.6} q ${spread} ${-1.6} ${spread + 1} ${-5.2} q ${-spread * 0.7} ${1.4} ${-spread * 0.7 - 1.4} ${4.4} Z`,
          fill: palette.accent,
        }),
      ];
    }
    case "bare":
    default:
      return [];
  }
}

/** 兜底表（比例数值形状）的配件。真表没有 accessory，这一段整个不上场。 */
function accessoryParts(look, geo) {
  const { palette } = look;
  const { shoulderY, shoulderW, torsoTop, torsoH, torsoW, headY } = geo;
  switch (look.accessory) {
    case "hood":
      return [
        svg("path", {
          d: `M ${CX - HEAD_R - 2.4} ${headY + 2} A ${HEAD_R + 2.4} ${HEAD_R + 2.4} 0 0 1 ${CX + HEAD_R + 2.4} ${headY + 2} Z`,
          fill: palette.accent,
        }),
      ];
    case "turban":
      return [
        svg("rect", {
          x: CX - HEAD_R - 1,
          y: headY - HEAD_R - 1,
          width: (HEAD_R + 1) * 2,
          height: 4.2,
          rx: 2,
          fill: palette.accent,
        }),
      ];
    case "pauldron":
      return [
        svg("rect", { x: CX - shoulderW / 2 - 1, y: shoulderY - 1.6, width: 7, height: 7, rx: 2.2, fill: palette.accent }),
        svg("rect", { x: CX + shoulderW / 2 - 6, y: shoulderY - 1.6, width: 7, height: 7, rx: 2.2, fill: palette.accent }),
      ];
    case "bracer":
      return [
        svg("rect", { x: CX - torsoW / 2 - 4.6, y: torsoTop + torsoH * 0.42, width: 4.4, height: 8, rx: 1.8, fill: palette.accent }),
        svg("rect", { x: CX + torsoW / 2 + 0.2, y: torsoTop + torsoH * 0.42, width: 4.4, height: 8, rx: 1.8, fill: palette.accent }),
      ];
    case "sash":
      return [
        svg("polygon", {
          points: `${CX - torsoW / 2},${torsoTop + torsoH * 0.34} ${CX + torsoW / 2},${torsoTop + torsoH * 0.16} ${CX + torsoW / 2},${torsoTop + torsoH * 0.34} ${CX - torsoW / 2},${torsoTop + torsoH * 0.52}`,
          fill: palette.accent,
        }),
      ];
    case "cloak":
      return [svg("rect", { x: CX - 3, y: shoulderY + 1, width: 6, height: 5, rx: 2, fill: palette.accent })];
    case "wrap":
      return [
        svg("rect", { x: CX - torsoW / 2, y: torsoTop + torsoH * 0.52, width: torsoW, height: 3.6, rx: 1.6, fill: palette.accent }),
      ];
    default:
      return [];
  }
}

/**
 * 皮肤剪影：头 / 肩 / 躯干三段按 build 比例缩放，再挂背件与头部件。
 *
 * 两种皮肤形状都吃 —— 入参先过 `core/skins.js skinAppearance()`：真表给的是
 * `build:'broad' / headgear:'horns' / back:'pack' / palette{…}`，兜底表给的是
 * `build{height,mass,shoulder} / cloth,trim,accent / accessory`。以前这里只会读
 * 兜底表那套字段，真表进来时 `build.height` 全是 undefined、`trim` 还是个对象，
 * 六套皮肤会画成同一只灰胶囊（Round 1 遗留 10）。
 *
 * @param {object} skin SkinDef（真表或兜底表形状）
 */
export function skinSilhouette(skin) {
  const look = skinAppearance(skin);
  const { build, palette } = look;

  const headY = 13 - (build.height - 1) * 22;
  const shoulderY = headY + HEAD_R + 2;
  const shoulderW = 23 * build.shoulder;
  const torsoW = 14.5 * build.mass;
  const torsoTop = shoulderY + 2;
  const torsoH = 46 - torsoTop;
  const geo = { headY, shoulderY, shoulderW, torsoTop, torsoH, torsoW };

  const parts = [];
  // 兜底表的斗篷是整件外披，得垫在躯干下面
  if (look.accessory === "cloak") {
    parts.push(
      svg("rect", {
        x: CX - (torsoW + 9) / 2,
        y: shoulderY,
        width: torsoW + 9,
        height: torsoH + 5,
        rx: 5,
        fill: palette.clothDim,
        opacity: "0.85",
      })
    );
  }
  parts.push(...backParts(look, geo));
  parts.push(
    svg("rect", { x: CX - shoulderW / 2, y: shoulderY, width: shoulderW, height: 6, rx: 3, fill: palette.clothDim }),
    svg("rect", { x: CX - torsoW / 2, y: torsoTop, width: torsoW, height: torsoH, rx: torsoW * 0.34, fill: palette.cloth }),
    svg("circle", { cx: CX, cy: headY, r: HEAD_R, fill: palette.skin })
  );
  parts.push(...headParts(look, geo));
  parts.push(...accessoryParts(look, geo));

  return svg(
    "svg",
    {
      viewBox: "0 0 40 52",
      width: "34",
      height: "44",
      class: "yz-skin-figure",
      "aria-hidden": "true",
      // CSS 钩子按 id / 部件走 data 属性，不给每套皮肤造类名
      "data-skin": look.id || "",
      "data-build": look.buildTier || "",
      "data-headgear": look.headgear,
      "data-back": look.back || "",
      // 皮肤条在 flex 列里，收缩会把剪影压成 0 高
      style: "flex:0 0 auto",
    },
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

  // 板高按视口封顶（标题 + 底部按钮 + 页脚约 300px），矮屏也不会把「进裂岛」顶出画面；
  // 被压缩时让掌格让位，皮肤条固定高度，两段都留在板内。
  const panel = h(
    "div",
    {
      class: "yz-plate yz-panel yz-panel--wide",
      style: { flex: "0 1 auto", maxHeight: "calc(100vh - 270px)", minHeight: "0" },
    },
    [
      h("h2", { class: "yz-heading", text: "配 掌" }),
      slotRow,
      // 掌格是这块板里唯一让高度的一段：矮屏先压它，皮肤条与「进裂岛」不动。
      // 570px ≈ 标题 + 掌位 + 皮肤条 + 底部按钮 + 页脚的固定开销。
      h(
        "div",
        {
          class: "yz-scroll",
          style: { flex: "0 0 auto", minHeight: "92px", maxHeight: "min(40vh, calc(100vh - 660px))" },
        },
        [grid]
      ),
      hint,
    ]
  );

  // ---- 选皮肤 ----
  // 横向皮肤条塞在配掌板内：多一个整板会把「进裂岛」挤出视口（720p 笔记本就中招）。
  const skinStrip = h("div", {
    class: "yz-skin-strip",
    style: {
      display: "flex",
      flex: "0 0 auto",
      alignItems: "stretch",
      gap: "8px",
      overflowX: "auto",
      padding: "2px",
      scrollbarWidth: "thin",
    },
  });
  const skinTiles = new Map();
  for (const s of skinList) {
    const tile = h(
      "div",
      {
        class: "yz-plate yz-glove-tile yz-skin-tile",
        role: "button",
        tabindex: "0",
        title: s.desc || "",
        dataset: { skin: s.id },
        style: {
          flex: "0 0 auto",
          width: "78px",
          padding: "6px 4px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "2px",
          textAlign: "center",
        },
      },
      [skinSilhouette(s), h("div", { class: "yz-glove-name", text: s.name || s.id })]
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
    skinStrip.appendChild(tile);
  }

  // 皮肤说明进题头，不再单开一行小字：矮屏上每一行都是「进裂岛」的高度预算。
  const skinHeading = h("h2", { class: "yz-heading", text: "选 皮 肤" });
  panel.append(skinHeading, skinStrip);

  // 主路径是 3D 走道：这块 2D 板降为「暂停里翻得到的备选配装台」。
  // 主按钮把配好的掌带进安全区，想跳过走道的老玩法留一个次按钮直通裂岛。
  const startBtn = h("button", {
    class: "yz-btn yz-btn--primary",
    type: "button",
    text: "进 安 全 区",
  });
  startBtn.addEventListener("click", () =>
    onStart({ main: state.main, off: state.off, skinId: state.skinId, skipHub: false })
  );

  const skipBtn = h("button", { class: "yz-btn", type: "button", text: "直 接 进 裂 岛" });
  skipBtn.addEventListener("click", () =>
    onStart({ main: state.main, off: state.off, skinId: state.skinId, skipHub: true })
  );

  const settingsBtn = h("button", { class: "yz-btn yz-btn--ghost", type: "button", text: "设 置" });
  if (onOpenSettings) settingsBtn.addEventListener("click", onOpenSettings);

  const foot = h("div", { class: "yz-foot" });

  const el = h("div", { class: "yz-screen yz-screen--deep" }, [
    // 矮屏兜底：内容超出一屏时整列可滚，「进裂岛」永远够得着
    h("div", { class: "yz-home", style: { maxHeight: "100%", overflowY: "auto", width: "100%" } }, [
      h("div", {}, [
        h("h1", { class: "yz-title", text: "异 掌" }),
        h("p", { class: "yz-subtitle", text: "暮色裂岛 · 一场体面的巴掌架" }),
        h("p", {
          class: "yz-lock-note",
          text: "备选配装台：默认开局直接落在安全区走道，靠近展掌按 E 选。",
        }),
      ]),
      panel,
      h("div", { class: "yz-menu" }, [startBtn, skipBtn, settingsBtn]),
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
    skinHeading.textContent = `选 皮 肤 · ${skin.name || skin.id}（存档记住，bot 会错开用别的）`;
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
