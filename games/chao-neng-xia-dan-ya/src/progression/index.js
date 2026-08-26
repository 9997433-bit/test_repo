/** 养成层公开出口（Opus-3 所有权）。 */
export {
  ATK_PER_LEVEL,
  ATK_PER_STAR,
  DEX_MAX_ATK_BONUS,
  DEX_WEIGHTS,
  EGG_RADIUS_MAX,
  EGG_RADIUS_MIN,
  FISHING_CAPS,
  LEVEL_CAP_BY_STAR,
  MAX_LEVEL,
  MAX_STAR,
  MIN_LEVEL,
  MIN_STAR,
  ROGUE_MAX_LEVEL,
  STAR_GOLD_COST,
  STAR_LEVEL_REQUIREMENT,
  STAR_SHARD_COST,
  clamp,
  clampInt,
  cumulativeGoldCost,
  levelCapForStar,
  levelGoldCost,
} from "./constants.js";

export {
  DEX_CATEGORIES,
  DEX_OWNED,
  DEX_SEEN,
  EXTRA_DEX_CATEGORIES,
  PROGRESSION_VERSION,
  addGold,
  addShards,
  ensureProgression,
  heroLevelOf,
  heroStarOf,
  isHeroOwned,
  normalizeDexState,
  shardsOf,
} from "./save.js";

export {
  clearHeroRegistry,
  dexTotals,
  heroDef,
  heroList,
  heroRace,
  heroTable,
  isKnownHero,
  registerHeroDefs,
} from "./catalog.js";

export {
  LEVEL_ERRORS,
  canLevelUp,
  levelProgress,
  levelUpHero,
  maxAffordableLevelUps,
} from "./level.js";

export {
  STAR_ERRORS,
  canStarUp,
  starGoldCost,
  starLevelRequirement,
  starProgress,
  starShardCost,
  starUpHero,
} from "./star.js";

export {
  DEX_MILESTONES,
  dexAttackBonus,
  dexCompletion,
  dexStateOf,
  dexSummary,
  markDexOwned,
  markDexSeen,
  raceTech,
} from "./dex.js";

export {
  FISHING_WATERS,
  FISH_BUFFS,
  LEGACY_KIND_TO_MOD,
  RARITY_ORDER,
  activeFishingBuffs,
  aggregateFishingBuff,
  applyFishReward,
  clearFishingBuffs,
  consumeFishingBuffs,
  fish,
  fishDef,
  fishOfWater,
  grantFishingBuff,
  ingestLegacyBuff,
  isWaterUnlocked,
  rollCatch,
} from "./fishing.js";

export {
  DRAFT_EVERY_WAVES,
  DRAFT_OPTIONS,
  ROGUE_ARTIFACTS,
  ROGUE_FIELD_SIZE,
  advanceWave,
  applyDraft,
  createRogueRun,
  finishRogueRun,
  rogueArtifactMods,
  rogueAtkMulFor,
  rogueLevelOf,
  rollDraft,
  shouldOfferDraft,
} from "./rogue.js";

export { createRng, hashSeed, pickWeighted, sampleWithout } from "./rng.js";

export {
  ACCOUNT_GROWTH,
  ROGUE_GROWTH,
  buildAdventureContext,
  buildRogueContext,
  neutralContext,
} from "./context.js";

export {
  buildLoadout,
  dexBonus,
  grantShards,
  heroAtk,
  heroLevel,
  heroStar,
  levelUpCost,
  starUpCost,
  tryLevelUp,
  tryStarUp,
} from "./loadout.js";
