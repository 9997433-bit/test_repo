/**
 * 静态数据总出口（稳定契约）：只做 re-export，禁止逻辑。
 * 既有导出（HEROES / HERO_LIST）保持不变，其余为 Fable-3 追加。
 */
export { HEROES, HERO_LIST, RESERVED_HERO_IDS } from "./heroes.js";
export { SKILLS, SKILL_LIST } from "./skills.js";
export { SCHOOLS, SYNERGIES, RACES, RACE_TECH, BONDS, BOND_TABLE } from "./synergies.js";
export { ENEMIES, ELITE_MODS, BOSSES, BOSS_LIST } from "./enemies.js";
export { CHAPTERS, STAGES, CHAPTER_SCALING, LAYOUT_FEATURES } from "./stages.js";
export { ARTIFACTS, ROGUE_RULES, ROGUE_WAVE_SCALING, ROGUE_WAVE_BANDS } from "./artifacts.js";
export { TOWER_FLOORS, TOWER_RULES } from "./tower.js";
export { RAID } from "./raid.js";
export { FISHING_SEAS, FISHING_RULES } from "./fishing.js";
export { LEVEL_CURVE, LEVEL_BAND_BONUSES, STAR_RULES, DEX_MILESTONES } from "./progression.js";
export { BATTLE_ITEMS, ITEM_RULES } from "./items.js";
export { ELEMENTS, REACTIONS, SAME_ELEMENT } from "./elements.js";
export { BALANCE } from "./balance.js";

/** 数据表结构版本（消费方可用于兼容检查）。 */
export const DATA_VERSION = 1;
