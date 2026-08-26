export const UNIT_TABLE = {
  dao: { id: "dao", glyph: "刀", role: "melee", rate: 0.9, range: 1, atk: [12, 20, 28, 38, 52] },
  qiang: { id: "qiang", glyph: "枪", role: "melee", rate: 0.75, range: 1, atk: [14, 23, 32, 44, 60], pierce: 1 },
  gong: { id: "gong", glyph: "弓", role: "ranged", rate: 1.1, range: 2, atk: [9, 16, 24, 34, 48] },
  qi: { id: "qi", glyph: "骑", role: "melee", rate: 1.3, range: 1, atk: [10, 17, 25, 35, 46] },
};

export const TIER_NAMES = ["白", "绿", "蓝", "紫", "橙"];
export const MAX_LEVEL = 5;
export const HAND_LIMIT = 5;
export const COLS = 5;
export const ROWS = 4;
export const CELL_COUNT = COLS * ROWS;
export const START_UNLOCKED = [5, 6, 7, 8, 9, 10, 11, 12];
export const START_MANTOU = 48;
export const START_HEARTS = 3;

export function recruitCost(recruitCount) {
  return 10 + 4 * recruitCount;
}

export function unitAttack(id, level) {
  const row = UNIT_TABLE[id];
  if (!row) return 0;
  return row.atk[Math.min(MAX_LEVEL, level) - 1];
}
