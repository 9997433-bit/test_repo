/**
 * 能量与大招口径（Opus-3 所有权）。
 *
 * 数值源只有一个：F3 的 `src/data`。本文件负责把表读成英雄层能用的形状，
 * 自己不定义任何平衡数值——下面的默认值只在数据表缺项时兜底，不对外充当数值源。
 * 依赖方向固定为 `data → energy → constants → 其余 heroes 文件`，不得反向 import。
 *
 * 三条口径：
 * 1. 大招消耗 = `HEROES[id].ult` → `SKILLS[ultId].energyCost`，回退 `HEROES[id].energy`；
 *    `starPerks[].mod.energyCost` 按已解锁星级覆盖（契约 §9.2「starPerks 覆盖同名键」）。
 * 2. 能量条上限恒等于当前星级的大招消耗，HUD 的「条满 = 可放大招」才成立。
 * 3. 各触发时机的回能取 `BALANCE.energy`；表里没单列的时机按注明的比例从表值派生。
 */
import * as DATA from "../data/index.js";

/** 被动型英雄的通用大招（`data/skills.js`，owner: null）。 */
export const GENERIC_ULT_ID = "golden_smash";

/** 词条打折后的消耗下限，避免表外英雄把消耗压到 0。 */
export const MIN_ULT_COST = 10;

function positive(value) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function finite(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

/** 兜底能量上限 = 通用大招消耗，缺表时才用 100。 */
export const BASE_ENERGY_MAX = positive(DATA.SKILLS?.[GENERIC_ULT_ID]?.energyCost) ?? 100;

/** 数据表里的大招技能 id；老形状 `ult: { id, cost }` 一并兼容。 */
export function ultSkillId(def) {
  const ult = def?.ult;
  if (typeof ult === "string") return ult;
  if (typeof ult?.id === "string") return ult.id;
  return null;
}

/** 大招在 `data/skills.js` 的条目，表外英雄返回 null。 */
export function ultSkillDef(def) {
  const id = ultSkillId(def);
  return (id && DATA.SKILLS?.[id]) || null;
}

/** 已解锁星级中最后一条覆盖 `key` 的升星词条值（starPerks 按星级升序）。 */
export function starPerkValue(def, star, key) {
  const unlocked = Math.max(1, Math.floor(Number(star) || 1));
  let value = null;
  for (const perk of def?.starPerks ?? []) {
    if ((Number(perk?.star) || 0) > unlocked) continue;
    const candidate = finite(perk?.mod?.[key]);
    if (candidate !== null) value = candidate;
  }
  return value;
}

/** 数据表口径的大招消耗；表里查不到这只英雄时返回 null。 */
export function tableUltCost(def, star = 1) {
  return (
    positive(starPerkValue(def, star, "energyCost")) ??
    positive(ultSkillDef(def)?.energyCost) ??
    positive(def?.ult?.cost) ??
    positive(def?.energy)
  );
}

/**
 * 最终大招消耗。数据表有值即为权威（升星折扣已含在内），
 * 只有表外注入的英雄才吃 heroes 层技能词条的 `cost` 增减。
 * @returns {number|null} 没有任何可用口径时返回 null
 */
export function ultEnergyCost(def, star = 1, { skill = null, mods = null } = {}) {
  const fromTable = tableUltCost(def, star);
  if (fromTable !== null) return fromTable;
  const base = positive(skill?.ult?.cost);
  if (base === null) return null;
  return Math.max(MIN_ULT_COST, base + (finite(mods?.cost) ?? 0));
}

/** 能量条上限 = 当前星级的大招消耗；没有大招口径的英雄退到属性表 / 兜底上限。 */
export function energyMaxFor(def, star = 1, { skill = null, mods = null, fallback = null } = {}) {
  return ultEnergyCost(def, star, { skill, mods }) ?? positive(fallback) ?? BASE_ENERGY_MAX;
}

const BALANCE_ENERGY = DATA.BALANCE?.energy ?? {};

/** 命中敌人一次的基础回能，同时是英雄 `energyGain` 的基线。 */
export const BASE_HIT_ENERGY = positive(BALANCE_ENERGY.perEnemyHit) ?? 6;

/** 击碎一块砖的回能。 */
export const BRICK_ENERGY = positive(BALANCE_ENERGY.perBrickBreak) ?? 2;

/** 回合结束的回能。 */
export const TURN_END_ENERGY = positive(BALANCE_ENERGY.perTurnEnd) ?? 12;

/** 连击里程碑的回能。 */
export const COMBO_MILESTONE_ENERGY = positive(BALANCE_ENERGY.perComboMilestone) ?? 10;

/** 连击每达该层数给一次里程碑回能。 */
export const COMBO_MILESTONE_EVERY = Math.max(
  1,
  Math.floor(positive(BALANCE_ENERGY.milestoneEvery) ?? 5),
);

/* 数据表未单列的时机，按表值派生：撞钉 = 半块砖，击杀 = 1.5 次命中，回收一枚蛋 = 一块砖。 */
export const PEG_HIT_ENERGY = round2(BRICK_ENERGY * 0.5);
export const KILL_ENERGY = round2(BASE_HIT_ENERGY * 1.5);
export const EGG_RECYCLED_ENERGY = BRICK_ENERGY;

/** 连击回能只在里程碑层数结算，避免每层都回。 */
export function isComboMilestone(combo) {
  const layers = Math.floor(Number(combo) || 0);
  return layers > 0 && layers % COMBO_MILESTONE_EVERY === 0;
}

/** 等级段位的能量回复加成（`LEVEL_BAND_BONUSES`，取已达到的最高档，非累加）。 */
export function levelEnergyMul(level) {
  const current = Math.max(1, Math.floor(Number(level) || 1));
  let pct = 0;
  for (const band of DATA.LEVEL_BAND_BONUSES ?? []) {
    const need = finite(band?.minLevel);
    if (need === null || current < need) continue;
    pct = Math.max(pct, finite(band?.energyGainPct) ?? 0);
  }
  return 1 + pct;
}
