/** 养成数值常量（Opus-3 所有权）。纯数据 + 纯函数，不触碰存档与 DOM。 */

export const MIN_LEVEL = 1;
export const MAX_LEVEL = 40;
export const MIN_STAR = 1;
export const MAX_STAR = 5;

/** 星级决定等级上限，等级门槛决定能否升星，两条曲线交替卡点。 */
export const LEVEL_CAP_BY_STAR = { 1: 10, 2: 16, 3: 24, 4: 32, 5: 40 };

/** 升到该星级所需的最低等级。 */
export const STAR_LEVEL_REQUIREMENT = { 2: 5, 3: 12, 4: 20, 5: 30 };

/** 由 star → star+1 所需碎片。 */
export const STAR_SHARD_COST = { 1: 20, 2: 50, 3: 120, 4: 280 };

/** 由 star → star+1 所需金币。 */
export const STAR_GOLD_COST = { 1: 500, 2: 1500, 3: 4000, 4: 10000 };

/** 每级成长系数。能量回复的等级加成不在这里：走数据表的 `LEVEL_BAND_BONUSES` 段位。 */
export const ATK_PER_LEVEL = 0.055;
export const HP_PER_LEVEL = 0.04;

/** 每星成长系数。 */
export const ATK_PER_STAR = 0.12;
export const HP_PER_STAR = 0.1;
export const ENERGY_PER_STAR = 0.06;
export const CRIT_PER_STAR = 0.01;

/** 蛋半径受等级/星级推动，GDD 约束 10–14。 */
export const EGG_RADIUS_MIN = 10;
export const EGG_RADIUS_MAX = 14;
export const LEVELS_PER_RADIUS_STEP = 13;
export const STARS_PER_RADIUS_STEP = 2;

/** 图鉴全局攻击加成上限（GDD：0–15%）。 */
export const DEX_MAX_ATK_BONUS = 0.15;

/** 图鉴各分类权重，合计 1。 */
export const DEX_WEIGHTS = { heroes: 0.45, enemies: 0.25, artifacts: 0.18, fish: 0.12 };

/** 钓鱼 BUFF 叠加上限，防止刷鱼碾压。 */
export const FISHING_CAPS = { atk: 0.3, crit: 0.25, extraEggs: 2, eggPower: 0.25 };

/** 肉鸽临时队起始等级/星级：不继承任何账号养成。 */
export const ROGUE_BASE_LEVEL = 1;
export const ROGUE_BASE_STAR = 1;
export const ROGUE_MAX_LEVEL = 12;
export const ROGUE_ATK_PER_LEVEL = 0.09;

/** 单次升级（level → level+1）金币消耗。 */
export function levelGoldCost(level) {
  const l = clampInt(level, MIN_LEVEL, MAX_LEVEL);
  if (l >= MAX_LEVEL) return Infinity;
  return Math.round(48 * Math.pow(l, 1.45)) + 32;
}

/** [from, to) 区间的累计金币消耗。 */
export function cumulativeGoldCost(fromLevel, toLevel) {
  const from = clampInt(fromLevel, MIN_LEVEL, MAX_LEVEL);
  const to = clampInt(toLevel, MIN_LEVEL, MAX_LEVEL);
  let total = 0;
  for (let l = from; l < to; l += 1) total += levelGoldCost(l);
  return total;
}

export function levelCapForStar(star) {
  return LEVEL_CAP_BY_STAR[clampInt(star, MIN_STAR, MAX_STAR)] ?? MAX_LEVEL;
}

export function clampInt(value, min, max) {
  const n = Number.isFinite(Number(value)) ? Math.floor(Number(value)) : min;
  return Math.min(max, Math.max(min, n));
}

export function clamp(value, min, max) {
  const n = Number.isFinite(Number(value)) ? Number(value) : min;
  return Math.min(max, Math.max(min, n));
}
