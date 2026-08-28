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
  resolveTowerLevels,
  resolveCounters,
  resolveEnemies,
  resolveWaves,
} from "./config.js";
export { createRng, nextFloat, nextInt, hashSeed } from "./rng.js";
export { polar, socketAngle, dist3, distPointSegment, round4, num0, wrapAngle, TAU } from "./geom.js";
// 确定性自动指挥官。跨模块 import 一律走本入口（契约 §2 冻结入口），
// 冒烟 / 探针 / 基准都从这里拿 bot，不要深引 ./bot.mjs。
export {
  BOT_DT,
  BOT_TOWERS,
  BOT_TOWER_IDS,
  VALUE_FLOOR,
  bestPlacement,
  botInput,
  createBot,
  crowdSocket,
  dpsAgainst,
  exposureSeconds,
  freeSocketNear,
  leakWeightOf,
  observeThreat,
} from "./bot.mjs";
