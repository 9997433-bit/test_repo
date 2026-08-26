/** 英雄层公开出口（Opus-3 所有权）。 */
export {
  BASE_ENERGY_MAX,
  DEFAULT_BASE_STATS,
  EFFECTS,
  FIELD_SIZE,
  SCHOOLS,
  TRIGGERS,
  TRIGGER_LIST,
} from "./constants.js";

export { baseStatsOf, computeHeroStats, eggRadiusFor, levelAtkMul, starAtkMul } from "./stats.js";

export {
  FALLBACK_SKILL,
  SKILLS,
  SKILL_ALIASES,
  auraOf,
  mergeTraitMods,
  resolveSkill,
  unlockedTraits,
} from "./skills.js";

export {
  addStack,
  createHeroInstance,
  energyRatio,
  gainEnergy,
  refreshStats,
  spendEnergy,
  stacksOf,
  tickTurn,
  ultimateCost,
  ultimateReady,
} from "./runtime.js";

export {
  BONDS,
  BOND_TIER_ATK,
  activeHero,
  aggregateAuras,
  allHeroIds,
  computeBonds,
  createAdventureSquad,
  createRogueSquad,
  createSquad,
  nextHero,
  previewSquad,
  refreshSquad,
  sanitizeRoster,
  setActiveHero,
  squadAttackTotal,
} from "./squad.js";

export {
  BENCH_ENERGY_SHARE,
  ENERGY_GAIN_RATE,
  awardEnergy,
  canCastUltimate,
  castUltimate,
  dispatchTrigger,
  endTurn,
  groupEffects,
  startBattle,
} from "./triggers.js";
