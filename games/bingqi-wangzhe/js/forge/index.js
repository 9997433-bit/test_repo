/**
 * 锻造层入口 — 只做再导出。
 */

export {
  previewForge,
  forgeWeapon,
  enhanceWeapon,
  dismantleWeapon,
  collectIdle,
  setWeaponLock,
  findWeapon,
  enhanceCostFor,
  dismantleRefundFor,
  computeForgeCost,
  computeQualityWeights,
  normalizeWeights,
  eligibleProtos,
  pityFloorFor,
  pityThresholdsFor,
  firstForgeFloorFor,
  forgeFloorFor,
  isFirstForge,
  normalizeOpts,
} from './forge.js';

export { computeWeaponStats, sumAffixes, sumPower, elementFactor, levelCapFor, skillSlotsFor } from './stats.js';
export { rollAffixes, rerollAffixValues, affixPoolFor, affixCountFor } from './affix.js';
export {
  previewIdle,
  idleRatesFor,
  regenStamina,
  clearedStagesOf,
  codexBonusOf,
  billableMinutes,
} from './idle.js';
export {
  sweepStage,
  previewSweep,
  sweepableStages,
  sweepCostFor,
  affordableSweeps,
  freeSweepsLeft,
  sweepsUsedToday,
  expectedSweepLoot,
  starsOf,
} from './sweep.js';
export { createRngAdapter } from './rng.js';
