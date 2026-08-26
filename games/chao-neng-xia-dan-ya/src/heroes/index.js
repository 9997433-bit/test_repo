/** 英雄层公开出口（Opus-3 所有权）。 */
export {
  BASE_ENERGY_MAX,
  DEFAULT_BASE_STATS,
  EFFECTS,
  FIELD_SIZE,
  TRIGGERS,
  TRIGGER_LIST,
} from "./constants.js";

export {
  BASE_HIT_ENERGY,
  BRICK_ENERGY,
  COMBO_MILESTONE_ENERGY,
  COMBO_MILESTONE_EVERY,
  EGG_RECYCLED_ENERGY,
  GENERIC_ULT_ID,
  KILL_ENERGY,
  MIN_ULT_COST,
  PEG_HIT_ENERGY,
  TURN_END_ENERGY,
  energyMaxFor,
  isComboMilestone,
  levelEnergyMul,
  starPerkValue,
  tableUltCost,
  ultEnergyCost,
  ultSkillDef,
  ultSkillId,
} from "./energy.js";

export {
  baseStatsOf,
  computeHeroStats,
  eggRadiusFor,
  energyLevelMul,
  levelAtkMul,
  starAtkMul,
} from "./stats.js";

export {
  DEFAULT_SCHOOL,
  FALLBACK_SKILL,
  SKILLS,
  SKILL_ALIASES,
  auraOf,
  mergeTraitMods,
  resolveSkill,
  schoolOf,
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
  RESERVED_BONDS,
  RESERVED_SCHOOLS,
  SCHOOLS,
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
  ENERGY_AWARD,
  awardEnergy,
  canCastUltimate,
  castUltimate,
  dispatchTrigger,
  endTurn,
  groupEffects,
  startBattle,
  teamStartEnergy,
} from "./triggers.js";

export {
  HUD_BOND_FIELDS,
  HUD_HERO_FIELDS,
  bondHudList,
  heroHudView,
  raceName,
  schoolName,
  squadHudView,
} from "./hud.js";
