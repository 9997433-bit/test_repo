/**
 * 小镇等级唯一事实源（API_CONTRACT §9 指派 Fable-3）。
 * XP_TABLE[i] = 升到 Lv.(i+1) 所需累计经验；封顶 Lv.10。
 * core/engine.js 的 LEVELS / levelFor 迁为本表的再导出（Opus-4 接线，见 GDD 契约表）。
 */
export const XP_TABLE = [0, 40, 100, 180, 280, 420, 600, 820, 1100, 1450];

export function levelForXp(xp) {
  let level = 1;
  for (let i = 0; i < XP_TABLE.length; i += 1) if (xp >= XP_TABLE[i]) level = i + 1;
  return level;
}

/** 升到下一级的累计经验门槛；满级返回 Infinity。 */
export function xpForNext(level) {
  return XP_TABLE[level] ?? Infinity;
}
