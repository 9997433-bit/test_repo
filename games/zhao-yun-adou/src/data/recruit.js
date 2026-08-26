import { UNIT_TABLE } from "./units.js";
import { GLYPH_POOL } from "./heroes.js";

/**
 * 征兵掉落权重（Round 1 平衡版）。
 *
 * - 兵种合计 86：保证前 8 格能快速铺满可战斗单位；
 * - 单字 10：武将是中后期爆发点，而非前期依赖；
 * - 铲子 3 / 神兵符 1：工具牌保持稀有，配合下方「课程化掉落」
 *   保证开局教程期绝不出工具牌。
 */
export const RECRUIT_WEIGHTS = [
  { w: 22, v: { kind: "unit", id: "gong" } },
  { w: 23, v: { kind: "unit", id: "dao" } },
  { w: 22, v: { kind: "unit", id: "qiang" } },
  { w: 19, v: { kind: "unit", id: "qi" } },
  { w: 10, v: { kind: "glyph" } },
  { w: 3, v: { kind: "shovel" } },
  { w: 1, v: { kind: "token", id: "shenbing" } },
];

/** 教程期（全局前 CURRICULUM_ROLLS 次征兵）屏蔽工具牌后的权重。 */
const EARLY_WEIGHTS = RECRUIT_WEIGHTS.filter(
  (p) => p.v.kind === "unit" || p.v.kind === "glyph",
);

/**
 * 课程化掉落阈值：一局内（双方合计）前 20 次征兵不出铲子 / 神兵符，
 * 即每侧前 ~10 抽必为兵种或单字 —— 教程期手牌不会被工具牌堵死，
 * 中后期工具牌照常掉落，扩地与神兵机制不受影响。
 */
export const CURRICULUM_ROLLS = 20;

// 以局内 rng 实例为键的抽卡计数（每局新建 rng，天然按局重置，保持可复现）。
const rollCounts = new WeakMap();

export function rollRecruit(rng) {
  const n = (rollCounts.get(rng) || 0) + 1;
  rollCounts.set(rng, n);
  const table = n <= CURRICULUM_ROLLS ? EARLY_WEIGHTS : RECRUIT_WEIGHTS;
  const pick = rng.weighted(table);
  if (pick.kind === "unit") {
    const row = UNIT_TABLE[pick.id];
    return { kind: "unit", id: pick.id, glyph: row.glyph, level: 1 };
  }
  if (pick.kind === "glyph") {
    return { kind: "glyph", glyph: rng.pick(GLYPH_POOL), level: 1 };
  }
  if (pick.kind === "shovel") {
    return { kind: "shovel", glyph: "铲", level: 1 };
  }
  return { kind: "token", id: "shenbing", glyph: "符", level: 1 };
}
