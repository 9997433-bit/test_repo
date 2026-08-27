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

// 两个入口的**文案**也在这里定，不在 ui 里散着写：结算板、暂停板、以后可能有的
// 快捷键提示，说的必须是同一件事。按钮标题只有四到六个字，分不出「带着掌回岛」
// 和「空手回走道」—— 差别写在紧跟其后的一行小字里（ui 用 F2 的 .yz-hintline 贴）。
//
// key 是键鼠快捷键；触屏没有键盘，壳层把它塞进 .yz-kbd 章里，F2 在
// [data-touch="1"] 下把这一类整类隐藏，剩下的提示文字触控与键鼠共用一套。
const COPY = Object.freeze({
  [ENTRY.RESTART]: Object.freeze({
    label: "再 来 一 局",
    key: "R",
    where: "裂 岛",
  }),
  [ENTRY.HUB]: Object.freeze({
    label: "回 安 全 区 换 掌",
    key: "H",
    where: "走 道",
  }),
});

/** 只有「再来一局」跳过走道。别让第二个入口也返回 true，否则两个按钮又一样了。 */
export function skipHubFor(kind) {
  return kind === ENTRY.RESTART;
}

/** 「沿用哪副掌」：主副同一只时不写两遍，掌名未知时退到不提名字的说法。 */
function gearText(ctx) {
  const main = typeof ctx.mainName === "string" ? ctx.mainName.trim() : "";
  const off = typeof ctx.offName === "string" ? ctx.offName.trim() : "";
  if (!main) return "沿用这副掌";
  if (!off || off === main) return `沿用 ${main}`;
  return `沿用 ${main} / ${off}`;
}

/**
 * 一个入口在板上的说法。
 *
 * @param {'restart'|'hub'} kind
 * @param {{ mainName?:string, offName?:string, from?:'result'|'pause' }} [ctx]
 *        mainName/offName 只给 RESTART 用（它带着掌走）；from 区分结算板与暂停板 ——
 *        暂停时按「回安全区」等于**弃掉正在打的这一局**，那句话得说出来。
 * @returns {null|{ kind:string, label:string, key:string, where:string, hint:string, skipHub:boolean }}
 */
export function entryCopy(kind, ctx = {}) {
  const base = COPY[kind];
  if (!base) return null;
  const from = ctx.from === "pause" ? "pause" : "result";
  const hint =
    kind === ENTRY.RESTART
      ? `直接回裂岛 · ${gearText(ctx)}，不必再走一趟走道`
      : `${from === "pause" ? "弃掉这一局回走道" : "回走道重挑"} · 主副掌清空，挑完传送门才放行`;
  return { kind, label: base.label, key: base.key, where: base.where, hint, skipHub: skipHubFor(kind) };
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
