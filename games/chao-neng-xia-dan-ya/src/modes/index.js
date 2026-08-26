export { CHAPTERS, STAGES, TOTAL_STAGES, stageByIndex, stagesOfChapter } from "./levels.js";
export { ARTIFACTS, applyDraft, createRogueLevel, rollDraft } from "./rogue.js";
export { TOWER_FLOORS, createTowerLevel, sweepReward, towerTheme } from "./tower.js";
export { RAID_SECONDS, RAID_TIERS, createRaidLevel, raidTier } from "./raid.js";
export { BUFF_LABEL, FISH, SEAS, createFishing, fishReward } from "./fishing.js";

export const MODES = [
  { id: "adventure", name: "冒险关卡", icon: "🥚", desc: "6 章 24 关，主线推进与养成产出" },
  { id: "rogue", name: "极限挑战", icon: "🎲", desc: "肉鸽无尽波次，每 2 波三选一" },
  { id: "tower", name: "试炼之塔", icon: "🗼", desc: "30 层爬塔，已通层可扫荡" },
  { id: "raid", name: "讨伐魔王", icon: "🔥", desc: "60 秒极限输出，按伤害发档位奖" },
  { id: "fishing", name: "佛系钓鱼", icon: "🎣", desc: "节奏收杆，钓怪物球换战斗 BUFF" },
];
