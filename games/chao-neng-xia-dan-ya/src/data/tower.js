/**
 * 试炼之塔静态表（30 层）。
 *
 * 曲线（已烘焙为字面量）：
 * - hpMult(f)  = 1 + 0.35(f-1) + 0.02(f-1)²   （温和二次曲线：前 10 层开荒，25+ 层为毕业挑战）
 * - dmgMult(f) = 1 + 0.12(f-1)
 * - gold(f)    = 40 + 22f + 0.8f²（取 5 的倍数）
 * - pool       敌人池沿用章节主题（"ch1".."ch6"，组成见 stages.js 对应章节波次风格）
 * - 每 5 层为 BOSS 层：bossId 按章节顺序，bossHpMult 为相对 BOSS 本体血量的折减
 * - milestone  首通里程碑奖励（英雄碎片等，只发一次）
 */
export const TOWER_FLOORS = [
  { floor: 1, hpMult: 1.0, dmgMult: 1.0, waves: 2, pool: "ch1", gold: 65 },
  { floor: 2, hpMult: 1.37, dmgMult: 1.12, waves: 2, pool: "ch1", gold: 85 },
  { floor: 3, hpMult: 1.78, dmgMult: 1.24, waves: 2, pool: "ch1", gold: 115 },
  { floor: 4, hpMult: 2.23, dmgMult: 1.36, waves: 2, pool: "ch1", gold: 140 },
  { floor: 5, hpMult: 2.72, dmgMult: 1.48, waves: 2, pool: "ch1", gold: 170, boss: "scarecrow_roc", bossHpMult: 0.5, milestone: { shards: { guard_duck: 6 } } },
  { floor: 6, hpMult: 3.25, dmgMult: 1.6, waves: 2, pool: "ch2", gold: 200 },
  { floor: 7, hpMult: 3.82, dmgMult: 1.72, waves: 2, pool: "ch2", gold: 235 },
  { floor: 8, hpMult: 4.43, dmgMult: 1.84, waves: 2, pool: "ch2", gold: 265 },
  { floor: 9, hpMult: 5.08, dmgMult: 1.96, waves: 2, pool: "ch2", gold: 305 },
  { floor: 10, hpMult: 5.77, dmgMult: 2.08, waves: 2, pool: "ch2", gold: 340, boss: "bbq_king", bossHpMult: 0.55, milestone: { shards: { ice_phoenix: 8 } } },
  { floor: 11, hpMult: 6.5, dmgMult: 2.2, waves: 3, pool: "ch3", gold: 380 },
  { floor: 12, hpMult: 7.27, dmgMult: 2.32, waves: 3, pool: "ch3", gold: 420 },
  { floor: 13, hpMult: 8.08, dmgMult: 2.44, waves: 3, pool: "ch3", gold: 460 },
  { floor: 14, hpMult: 8.93, dmgMult: 2.56, waves: 3, pool: "ch3", gold: 505 },
  { floor: 15, hpMult: 9.82, dmgMult: 2.68, waves: 3, pool: "ch3", gold: 550, boss: "magma_bathmaster", bossHpMult: 0.6, milestone: { shards: { thunder_chick: 8 } } },
  { floor: 16, hpMult: 10.75, dmgMult: 2.8, waves: 3, pool: "ch4", gold: 595 },
  { floor: 17, hpMult: 11.72, dmgMult: 2.92, waves: 3, pool: "ch4", gold: 645 },
  { floor: 18, hpMult: 12.73, dmgMult: 3.04, waves: 3, pool: "ch4", gold: 695 },
  { floor: 19, hpMult: 13.78, dmgMult: 3.16, waves: 3, pool: "ch4", gold: 745 },
  { floor: 20, hpMult: 14.87, dmgMult: 3.28, waves: 3, pool: "ch4", gold: 800, boss: "sea_god_statue", bossHpMult: 0.65, milestone: { shards: { ice_phoenix: 8 } } },
  { floor: 21, hpMult: 16.0, dmgMult: 3.4, waves: 3, pool: "ch5", gold: 855 },
  { floor: 22, hpMult: 17.17, dmgMult: 3.52, waves: 3, pool: "ch5", gold: 910 },
  { floor: 23, hpMult: 18.38, dmgMult: 3.64, waves: 3, pool: "ch5", gold: 970 },
  { floor: 24, hpMult: 19.63, dmgMult: 3.76, waves: 3, pool: "ch5", gold: 1030 },
  { floor: 25, hpMult: 20.92, dmgMult: 3.88, waves: 3, pool: "ch5", gold: 1090, boss: "mecha_incubator", bossHpMult: 0.7, milestone: { shards: { sun_bird: 8 } } },
  { floor: 26, hpMult: 22.25, dmgMult: 4.0, waves: 3, pool: "ch6", gold: 1155 },
  { floor: 27, hpMult: 23.62, dmgMult: 4.12, waves: 3, pool: "ch6", gold: 1215 },
  { floor: 28, hpMult: 25.03, dmgMult: 4.24, waves: 3, pool: "ch6", gold: 1285 },
  { floor: 29, hpMult: 26.48, dmgMult: 4.36, waves: 3, pool: "ch6", gold: 1350 },
  { floor: 30, hpMult: 27.97, dmgMult: 4.48, waves: 3, pool: "ch6", gold: 1420, boss: "demon_fryer", bossHpMult: 0.8, milestone: { shards: { ice_phoenix: 10 }, gold: 2000 } },
];

/** 塔规则（modes/tower 消费）。 */
export const TOWER_RULES = {
  floors: 30,
  retryFree: true,          // 失败无惩罚，可立即重试
  sweepYieldPct: 0.4,       // 扫荡已通层：获得该层 gold × 0.4
  sweepCooldownSec: 1800,   // 每层扫荡冷却（本地时间戳）
  sweepBatchMax: 5,         // 一键扫荡最多 5 层
};
