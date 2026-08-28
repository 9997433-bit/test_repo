// Opus-3 纯模拟。禁止引入渲染层与浏览器全局。
// 冻结 API：createMatch(seed, opts?) / step(match, input, dtSec) / getView(match)
// 数值只从 src/data 的正式出口读（CONFIG / TOWERS / ENEMIES / WAVES / BOSS / armorMultiplier）。
export { createMatch, step, getView, FIXED_DT, TOWER_LIST } from "./match.js";
export {
  ARMOR_TYPES,
  MAX_SHOTS,
  MUZZLE_Y,
  TOWER_IDS,
  resolveConfig,
  resolveTowers,
  resolveCounters,
  resolveEnemies,
  resolveWaves,
} from "./config.js";
export { createRng, nextFloat, nextInt, hashSeed } from "./rng.js";
export { polar, socketAngle, dist3, distPointSegment, round4, num0, wrapAngle, TAU } from "./geom.js";
