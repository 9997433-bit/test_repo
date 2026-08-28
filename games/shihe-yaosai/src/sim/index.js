// Opus-3 纯模拟。禁止引入渲染层与浏览器全局。
// 冻结 API：createMatch(seed) / step(match, input, dtSec) / getView(match)
export { createMatch, step, getView, FIXED_DT, TOWER_LIST } from "./match.js";
export {
  FALLBACK_CONFIG,
  FALLBACK_TOWERS,
  FALLBACK_ENEMIES,
  FALLBACK_COUNTERS,
  TOWER_IDS,
  resolveConfig,
  resolveTowers,
  resolveCounters,
  resolveEnemies,
  resolveWaves,
} from "./config.js";
export { createRng, nextFloat, nextInt, hashSeed } from "./rng.js";
export { polar, socketAngle, dist3, distPointSegment, TAU } from "./geom.js";
