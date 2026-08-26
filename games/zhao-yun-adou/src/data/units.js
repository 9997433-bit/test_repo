/**
 * 兵种与全局常量数值表（Round 1 平衡版）。
 *
 * 调参目标（见 docs/GDD.md「数值与平衡」）：
 * - 1 级白字要能独当一面：教程期（1–3 波）2~3 枚白字即可守住；
 * - 合并收益压平为每级约 ×1.42，防止「合并贪婪」一侧滚雪球；
 * - 四兵种 1 级 DPS 收敛在 13.5~16.2，差异体现在射程 / 穿透 / 节奏。
 */
export const UNIT_TABLE = {
  dao: { id: "dao", glyph: "刀", role: "melee", rate: 0.9, range: 1, atk: [16, 23, 33, 46, 64] },
  qiang: { id: "qiang", glyph: "枪", role: "melee", rate: 0.75, range: 1, atk: [18, 26, 37, 52, 72], pierce: 1 },
  gong: { id: "gong", glyph: "弓", role: "ranged", rate: 1.1, range: 2, atk: [13, 19, 27, 38, 52] },
  qi: { id: "qi", glyph: "骑", role: "melee", rate: 1.35, range: 1, atk: [12, 17, 24, 34, 47] },
};

export const TIER_NAMES = ["白", "绿", "蓝", "紫", "橙"];
export const MAX_LEVEL = 5;
export const HAND_LIMIT = 5;
export const COLS = 5;
export const ROWS = 4;
export const CELL_COUNT = COLS * ROWS;
export const START_UNLOCKED = [5, 6, 7, 8, 9, 10, 11, 12];
export const START_MANTOU = 60;
export const START_HEARTS = 3;

/**
 * 征兵费用：8 + 5n。
 * 起步比基线便宜（首抽 8）保证教程期铺场顺滑；
 * 斜率 5 高于基线 4，压制后期无限征兵滚雪球。
 */
export function recruitCost(recruitCount) {
  return 8 + 5 * recruitCount;
}

export function unitAttack(id, level) {
  const row = UNIT_TABLE[id];
  if (!row) return 0;
  return row.atk[Math.min(MAX_LEVEL, level) - 1];
}
