// 进局入口：哪个按钮进哪扇门。
//
// Round 1 遗留 6：结算板的「再 来 一 局」走的是 `startMatch(lastLoadout)`，
// 而 `lastLoadout` 里没有 `skipHub`，`startMatch` 又是「不为 true 就落走道」——
// 于是「再来一局」和「回安全区换掌」按下去是同一件事：都把人扔回走道重挑掌。
// 打完一局想接着打，得先走一趟走道、再按一次 E、再穿一次门。
//
// 收口：入口语义集中在这里定，main 只负责照单开局。
//   ENTRY.RESTART —— 结算「再 来 一 局」：同一副掌直接回裂岛（skipHub: true）
//   ENTRY.HUB     —— 结算「回 安 全 区 换 掌」/ 暂停「回 安 全 区」：
//                    回走道重挑（skipHub: false，`startMatch` 那边不预填主副掌，
//                    `portalReady` 从 false 起步，挑完才放行 —— GOAL §6/§7）
//
// 两个入口共用一套配装取值链（后者兜前者）：上一局 → 存档 → 2D 配掌板。
// 「再来一局」要的是**同一副掌**，所以链头必须是 lastLoadout。
// 开局第一局不走这里：那时还没有「上一局」，main 直接拿 2D 板的已解锁配装。

export const ENTRY = Object.freeze({
  RESTART: "restart",
  HUB: "hub",
});

/** 只有「再来一局」跳过走道。别让第二个入口也返回 true，否则两个按钮又一样了。 */
export function skipHubFor(kind) {
  return kind === ENTRY.RESTART;
}

function pick(...values) {
  for (const v of values) {
    if (typeof v === "string" && v.trim()) return v;
  }
  return null;
}

/**
 * 算出一次进局要带的配装与去处。
 *
 * @param {'restart'|'hub'} kind
 * @param {{ lastLoadout?:object|null, save?:object|null, menuLoadout?:object|null }} ctx
 * @returns {{ kind:string, skipHub:boolean, main:string|null, off:string|null, skinId:string|null }}
 */
export function resolveEntry(kind, ctx = {}) {
  const last = ctx.lastLoadout || {};
  const saved = (ctx.save && ctx.save.loadout) || {};
  const menu = ctx.menuLoadout || {};

  const main = pick(last.main, saved.main, menu.main);
  const off = pick(last.off, saved.off, menu.off) || main;
  const skinId = pick(last.skinId, ctx.save && ctx.save.skinId, menu.skinId);

  return { kind, skipHub: skipHubFor(kind), main, off, skinId };
}
