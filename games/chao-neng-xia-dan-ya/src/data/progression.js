/**
 * 养成静态表：等级曲线、升星、图鉴（纯数据）。
 *
 * 总攻击公式约定（progression/combat 消费，数据只提供系数）：
 * atk = 基础攻 × LEVEL_CURVE[level-1].atkMult × (1 + (star-1) × STAR_RULES.atkPctPerStar)
 *       × (1 + 图鉴加成 + 种族科技 + 光环/羁绊)
 * 设计上限（40 级 5 星满图鉴，不含光环）≈ 基础攻 × 5.1，避免数值爆炸。
 */

/**
 * 等级曲线 1-40。
 * - atkMult:  1 + 0.06 × (level-1)，40 级 ×3.34
 * - goldCost: 升到下一级的金币（25 + 15L + 1.2L²，取 5 的倍数；40 级为满级 0）
 * 全程 1→40 约需 37,000 金币 ≈ 通关 6 章 + 塔 20 层的自然产出。
 */
export const LEVEL_CURVE = [
  { level: 1, atkMult: 1.0, goldCost: 40 },
  { level: 2, atkMult: 1.06, goldCost: 60 },
  { level: 3, atkMult: 1.12, goldCost: 80 },
  { level: 4, atkMult: 1.18, goldCost: 105 },
  { level: 5, atkMult: 1.24, goldCost: 130 },
  { level: 6, atkMult: 1.3, goldCost: 160 },
  { level: 7, atkMult: 1.36, goldCost: 190 },
  { level: 8, atkMult: 1.42, goldCost: 220 },
  { level: 9, atkMult: 1.48, goldCost: 255 },
  { level: 10, atkMult: 1.54, goldCost: 295 },
  { level: 11, atkMult: 1.6, goldCost: 335 },
  { level: 12, atkMult: 1.66, goldCost: 380 },
  { level: 13, atkMult: 1.72, goldCost: 425 },
  { level: 14, atkMult: 1.78, goldCost: 470 },
  { level: 15, atkMult: 1.84, goldCost: 520 },
  { level: 16, atkMult: 1.9, goldCost: 570 },
  { level: 17, atkMult: 1.96, goldCost: 625 },
  { level: 18, atkMult: 2.02, goldCost: 685 },
  { level: 19, atkMult: 2.08, goldCost: 745 },
  { level: 20, atkMult: 2.14, goldCost: 805 },
  { level: 21, atkMult: 2.2, goldCost: 870 },
  { level: 22, atkMult: 2.26, goldCost: 935 },
  { level: 23, atkMult: 2.32, goldCost: 1005 },
  { level: 24, atkMult: 2.38, goldCost: 1075 },
  { level: 25, atkMult: 2.44, goldCost: 1150 },
  { level: 26, atkMult: 2.5, goldCost: 1225 },
  { level: 27, atkMult: 2.56, goldCost: 1305 },
  { level: 28, atkMult: 2.62, goldCost: 1385 },
  { level: 29, atkMult: 2.68, goldCost: 1470 },
  { level: 30, atkMult: 2.74, goldCost: 1555 },
  { level: 31, atkMult: 2.8, goldCost: 1645 },
  { level: 32, atkMult: 2.86, goldCost: 1735 },
  { level: 33, atkMult: 2.92, goldCost: 1825 },
  { level: 34, atkMult: 2.98, goldCost: 1920 },
  { level: 35, atkMult: 3.04, goldCost: 2020 },
  { level: 36, atkMult: 3.1, goldCost: 2120 },
  { level: 37, atkMult: 3.16, goldCost: 2225 },
  { level: 38, atkMult: 3.22, goldCost: 2330 },
  { level: 39, atkMult: 3.28, goldCost: 2435 },
  { level: 40, atkMult: 3.34, goldCost: 0 },
];

/** 等级段位奖励（达到 minLevel 即生效）：蛋半径与能量回复（GDD：升级加基础攻/蛋半径/能量回复）。 */
export const LEVEL_BAND_BONUSES = [
  { minLevel: 10, eggRadiusBonus: 0.5, energyGainPct: 0.05 },
  { minLevel: 20, eggRadiusBonus: 1.0, energyGainPct: 0.1 },
  { minLevel: 30, eggRadiusBonus: 1.5, energyGainPct: 0.15 },
  { minLevel: 40, eggRadiusBonus: 2.0, energyGainPct: 0.2 },
];

/**
 * 升星规则：
 * - unlockShards: 首次解锁英雄所需碎片（按稀有度）
 * - starCosts:    升到 2/3/4/5 星的碎片（按稀有度，依次消耗）
 * - atkPctPerStar: 每星（2 星起）+8% 攻击
 * - 升星词条见 heroes.js starPerks（2/3/4/5 星各解锁 1 条）
 */
export const STAR_RULES = {
  maxStar: 5,
  atkPctPerStar: 0.08,
  unlockShards: { r: 8, sr: 12, ssr: 16 },
  starCosts: {
    r: [15, 30, 60, 120],
    sr: [20, 40, 80, 160],
    ssr: [25, 50, 100, 200],
  },
};

/**
 * 图鉴收集加成（GDD：0-15% 全局攻击）。
 * 收集分 = 已解锁英雄数 × 1 + 全部英雄额外星数（星-1）之和 × 1。
 * 满分 = 18 + 18 × 4 = 90。达到 score 时全局攻击加成为 atkPct（取已达到的最高档，非累加）。
 */
export const DEX_MILESTONES = [
  { score: 6, atkPct: 0.01 },
  { score: 12, atkPct: 0.02 },
  { score: 20, atkPct: 0.04 },
  { score: 30, atkPct: 0.06 },
  { score: 42, atkPct: 0.08 },
  { score: 56, atkPct: 0.1 },
  { score: 72, atkPct: 0.12 },
  { score: 90, atkPct: 0.15 },
];
