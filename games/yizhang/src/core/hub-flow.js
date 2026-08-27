// 安全区大厅的「壳层视图模型」。纯函数：吃 sim 的 view 快照，吐 UI 直接能贴的字符串。
//
// 为什么单独一层：靠近哪座台、按 E 会装到哪个槽、传送门该不该放行 —— 这些判断
// sim 已经在 `view.hub` 里给足了原料（focusGloveId / pedestals[].slot / portalReady），
// 但「该显示什么文案」不属于 sim。放在这里而不是 ui/ 里，是为了能不开浏览器就单测。
//
// 约定：本模块只读 view，不写、不碰 DOM、不 import ui。

/** 装备提示语。与 sim/hub.js 的 equipFromPedestal「先主后副」一致。 */
export const EQUIP_CTA = Object.freeze({
  main: "装 为 主 掌",
  promote: "提 为 主 掌",
  off: "装 为 副 掌",
  swapOff: "换 上 副 掌",
  isMain: "已 是 主 掌",
  locked: "未 解 锁",
});

export const PORTAL_TEXT = Object.freeze({
  pick: "先在走道里挑一只主掌，传送门才认人",
  ready: "配掌完成 · 走到走道尽头，穿过传送门进裂岛",
  near: "穿 过 传 送 门",
});

/** 当前存档下已解锁的掌 id。createMatch 的 `unlocked` 就吃这个数组。 */
export function unlockedIdsFor(gloves, isUnlocked, save) {
  const list = Array.isArray(gloves) ? gloves : [];
  if (typeof isUnlocked !== "function") return list.map((g) => g.id);
  const out = [];
  for (const g of list) {
    if (isUnlocked(g.id, save)) out.push(g.id);
  }
  // 一只都没有会让大厅八座台全灰，退到掌表第一只（存档里 cotton 永远在）
  if (!out.length && list.length) out.push(list[0].id);
  return out;
}

/**
 * 按 E 会发生什么。`slot` 是这只掌当前占的槽（sim 给的 `pedestal.slot`）。
 * @returns {{ key: keyof typeof EQUIP_CTA, text: string, actionable: boolean }}
 */
export function equipIntent(ped, hub) {
  if (!ped) return { key: "locked", text: EQUIP_CTA.locked, actionable: false };
  if (!ped.unlocked) return { key: "locked", text: EQUIP_CTA.locked, actionable: false };

  const mainId = hub ? hub.mainGloveId : null;
  const offId = hub ? hub.offGloveId : null;

  if (ped.gloveId === mainId) return { key: "isMain", text: EQUIP_CTA.isMain, actionable: false };
  if (!mainId) return { key: "main", text: EQUIP_CTA.main, actionable: true };
  if (ped.gloveId === offId) return { key: "promote", text: EQUIP_CTA.promote, actionable: true };
  if (!offId) return { key: "off", text: EQUIP_CTA.off, actionable: true };
  return { key: "swapOff", text: EQUIP_CTA.swapOff, actionable: true };
}

function pedestalOf(hub) {
  const list = (hub && hub.pedestals) || [];
  const focused = list.find((p) => p.focused);
  if (focused) return focused;
  if (!hub || !hub.focusGloveId) return null;
  return list.find((p) => p.gloveId === hub.focusGloveId) || null;
}

function nameOf(gloveById, id, fallback) {
  const g = id && gloveById ? gloveById[id] : null;
  return (g && g.name) || fallback || "—";
}

/**
 * 大厅 HUD 的一帧模型。
 *
 * @param {object} view   adaptView 后的快照（需要 `phase` 与 `hub`）
 * @param {object} ctx    { gloveById, unlockTextOf, touch }
 * @returns {{
 *   visible: boolean,
 *   focus: null | object,
 *   loadout: { mainId: string|null, mainName: string, offId: string|null, offName: string, complete: boolean },
 *   portal: { ready: boolean, near: boolean, text: string, tone: 'pick'|'ready'|'near' },
 *   accent: string|null,
 * }}
 */
export function hubHudModel(view, ctx = {}) {
  const hub = view && view.hub ? view.hub : null;
  const visible = !!view && view.phase === "hub" && !!hub;
  const gloveById = ctx.gloveById || {};
  const unlockTextOf = ctx.unlockTextOf || (() => "局内挑战");
  const confirmKey = ctx.touch ? "选" : "E";

  const mainId = hub ? hub.mainGloveId || null : null;
  const offId = hub ? hub.offGloveId || null : null;
  const loadout = {
    mainId,
    offId,
    mainName: mainId ? nameOf(gloveById, mainId) : "未 选",
    // 副掌没挑时沿用主掌（sim 的 applyLoadout 就是这么写回玩家的）
    offName: offId ? nameOf(gloveById, offId) : mainId ? `${nameOf(gloveById, mainId)}（同主掌）` : "未 选",
    complete: !!mainId && !!offId,
  };

  const ready = !!(hub && hub.portalReady);
  const near = !!(hub && hub.portalNear);
  const tone = !ready ? "pick" : near ? "near" : "ready";
  const portal = { ready, near, tone, text: PORTAL_TEXT[tone] };

  const ped = visible ? pedestalOf(hub) : null;
  let focus = null;
  if (ped) {
    const glove = gloveById[ped.gloveId] || null;
    const intent = equipIntent(ped, hub);
    focus = {
      gloveId: ped.gloveId,
      name: ped.name || nameOf(gloveById, ped.gloveId, ped.gloveId),
      role: ped.role || (glove && glove.role) || "",
      desc: ped.desc || (glove && glove.desc) || "",
      color: ped.color || (glove && glove.color) || null,
      unlocked: !!ped.unlocked,
      slot: ped.slot || null,
      intent,
      // 未解锁时说明牌上写解锁条件，不写「按 E」
      hint: ped.unlocked ? `${confirmKey} · ${intent.text}` : unlockTextOf(glove || { id: ped.gloveId, unlock: ped.unlock }),
    };
  }

  return {
    visible,
    focus,
    loadout,
    portal,
    accent: (focus && focus.color) || (mainId && gloveById[mainId] ? gloveById[mainId].color : null),
  };
}
