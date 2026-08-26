/** Shared tunables. Systems must import from here instead of magic numbers. */
export const TICK_MS = 250;
export const TICKS_PER_DAY = 16;
export const SAVE_KEY = "sanguo-ice-age-save-v1";
export const SAVE_VERSION = 1;
export const AUTOSAVE_MS = 20000;

export const SPEEDS = [0, 1, 2, 4];

export const RESOURCES = ["food", "wood", "coal", "iron"];
export const RESOURCE_NAMES = { food: "肉食", wood: "木材", coal: "煤炭", iron: "铁料" };
export const RESOURCE_ICONS = { food: "🍖", wood: "🪵", coal: "⬛", iron: "⛏" };

export const FACTIONS = ["wei", "shu", "wu", "qun"];
export const FACTION_NAMES = { wei: "魏", shu: "蜀", wu: "吴", qun: "群" };
/** 阵营克制：吴 > 蜀 > 魏 > 吴（键克制值）。 */
export const FACTION_BEATS = { wu: "shu", shu: "wei", wei: "wu" };

export const TROOPS = ["infantry", "archer", "cavalry"];
export const TROOP_NAMES = { infantry: "步兵", archer: "弓兵", cavalry: "骑兵" };
export const TROOP_ICONS = { infantry: "🛡", archer: "🏹", cavalry: "🐎" };
/** 兵种克制：步克骑、骑克弓、弓克步（键克制值）。 */
export const TROOP_BEATS = { infantry: "cavalry", cavalry: "archer", archer: "infantry" };

export const QUALITIES = ["blue", "purple", "orange", "red"];
export const QUALITY_RANK = { blue: 1, purple: 2, orange: 3, red: 4 };
export const QUALITY_NAMES = { blue: "良将", purple: "名将", orange: "传世", red: "绝世" };

export const DEFAULT_LORD = {
  name: "流民县令",
  title: "汉末县令",
};

export const CLIMATE = {
  baseTemp: 4,
  /** 天下渐冷：每天基础温度下降，直至下限。 */
  worldCoolingPerDay: 0.06,
  worldCoolingFloor: -10,
  furnaceHeatPerLevel: 3.2,
  blizzardEveryDays: 7,
  blizzardDurationDays: 2,
  blizzardTempDelta: -14,
  /** 每次寒潮额外加深的温降。 */
  blizzardEscalation: -1.6,
  blizzardDeltaFloor: -34,
  freezeThreshold: -6,
  coldThreshold: 0,
  comfortThreshold: 8,
};

export const FUEL = {
  /** 火炉每天基础耗木 + 每级耗木（烧煤按比例折算）。 */
  woodPerDayBase: 3,
  woodPerDayPerLevel: 1.8,
  coalPerWoodUnit: 0.45,
  modes: {
    off: { name: "熄火", fuel: 0, heat: 0 },
    low: { name: "慢火", fuel: 0.6, heat: 0.65 },
    normal: { name: "正常", fuel: 1, heat: 1 },
    high: { name: "旺火", fuel: 1.9, heat: 1.35 },
  },
  sources: ["auto", "wood", "coal"],
  sourceNames: { auto: "自动", wood: "只烧木", coal: "只烧煤" },
};

/** 民心：数值均为「每天」变化量，按 tick 折算。 */
export const MORALE = {
  base: 70,
  max: 100,
  freezeDrain: 6,
  coldDrain: 2,
  comfortGain: 3,
  kitchenGainPerLevel: 0.4,
  clinicReliefPerLevel: 0.06,
  starveDrain: 12,
  collapseAt: 15,
};

export const POPULATION = {
  start: 12,
  baseCap: 16,
  housePerLevel: 8,
  eatPerDay: 1.0,
  /** 温饱且民心高时，每天向上限增长的比例。 */
  growthPerDay: 0.09,
  freezeLossPerDay: 0.02,
  starveLossPerDay: 0.045,
  fleeLossPerDay: 0.05,
  clinicLossReducePerLevel: 0.06,
};

export const WORK = {
  workersPerLevel: 3,
  /** 每工人每天产量。 */
  outputPerWorkerDay: { lumber: 8, hunter: 5.5, coalMine: 4, ironMine: 3 },
  tempFactor: { freeze: 0.45, cold: 0.75, normal: 1, comfort: 1.1 },
  academyBonusPerLevel: 0.04,
};

export const STORAGE_BASE = 250;
export const WAREHOUSE_PER_LEVEL = 320;

export const ARMY = {
  upkeepFoodPerDayPerTroop: 0.06,
  capPerCampLevel: 50,
  marchesMax: 5,
  marchesStart: 3,
  marchRegenPerDay: 1,
  stats: {
    infantry: { hp: 34, atk: 5, def: 3 },
    archer: { hp: 22, atk: 8, def: 1 },
    cavalry: { hp: 28, atk: 7, def: 2 },
  },
  costs: {
    infantry: { food: 3, wood: 1 },
    archer: { food: 3, wood: 2 },
    cavalry: { food: 6, iron: 1 },
  },
};

export const BATTLE = {
  maxRounds: 30,
  counterBonus: 1.35,
  counterPenalty: 0.8,
  factionBonus: 1.2,
  factionPenalty: 0.85,
  synergy2: 1.08,
  synergy3: 1.2,
  skillChance: 0.25,
  heroAtkWeight: 6,
  heroDefShield: 1.0,
  variance: 0.1,
  /** 军医所每级从战损中抢救回的比例。 */
  hospitalRescuePerLevel: 0.05,
  hospitalRescueMax: 0.5,
};

export const HERO = {
  baseStats: {
    blue: { atk: 42, def: 30, lead: 220 },
    purple: { atk: 58, def: 42, lead: 300 },
    orange: { atk: 80, def: 58, lead: 420 },
    red: { atk: 110, def: 80, lead: 580 },
  },
  maxLevel: { blue: 20, purple: 30, orange: 40, red: 50 },
  statGrowthPerLevel: 0.06,
  leadGrowthPerLevel: 0.06,
  dupeSouls: { blue: 20, purple: 60, orange: 200, red: 600 },
  soulCost(level) {
    return Math.round(10 * Math.pow(level, 1.5));
  },
};

export const GACHA = {
  /** 基础概率（招贤馆 1 级），每升 1 级：红 +0.4%、橙 +1.2%，从蓝里扣。 */
  baseRates: { red: 0.01, orange: 0.08, purple: 0.31, blue: 0.6 },
  redPerHallLevel: 0.004,
  orangePerHallLevel: 0.012,
  tokenTrade: { food: 150, iron: 40 },
  startTokens: 2,
};

export const ENVOY = {
  giftEveryDays: 2,
  giftPerLevel: { food: 14, wood: 14, coal: 7, iron: 5 },
  trades: [
    { id: "w2f", name: "以木易肉", give: { wood: 100 }, get: { food: 65 } },
    { id: "f2c", name: "以肉易煤", give: { food: 120 }, get: { coal: 55 } },
    { id: "w2i", name: "以木易铁", give: { wood: 160 }, get: { iron: 40 } },
  ],
};

export const WALL = {
  /** 城墙每级降低寒潮期间额外人口流失/民心流失的比例。 */
  blizzardProtectPerLevel: 0.07,
  blizzardProtectMax: 0.6,
};

export function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}
