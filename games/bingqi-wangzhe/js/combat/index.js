/**
 * 战斗层统一出口。
 * 上层（core / ui）建议只从这里 import，便于内部文件重构。
 */

export * from './elements.js';
export * from './units.js';
export * from './skills.js';
export * from './lineup.js';
export {
  AI_PROFILES,
  ENGINE_VERSION,
  EVENT_ALIASES,
  EVENT_DURATION,
  EVENT_SUBTYPES,
  EVENT_TYPE_OF,
  EVENT_TYPES,
  MAX_ROUNDS,
  arenaOpponentToWaves,
  canonicalEventType,
  estimatePower,
  estimateUnitsPower,
  formatBattleReport,
  generateArenaOpponents,
  simulateBattle,
  toEnemyWaves,
} from './engine.js';
export {
  createCombatRng,
  hashSeed,
  mulberry32,
  normalizeSeed,
  toRng,
} from './rng.js';
