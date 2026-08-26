/**
 * 数值总表 — 纯数据，无副作用，可在 Node 中 import。
 * 任何随机相关的权重都在这里，锻造/战斗/挂机不得内联魔法数字。
 */

export const QUALITIES = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic'];

export const QUALITY_RANK = Object.freeze({
  common: 0,
  uncommon: 1,
  rare: 2,
  epic: 3,
  legendary: 4,
  mythic: 5,
});

export const ELEMENTS = ['fire', 'ice', 'thunder'];

/** fire → ice → thunder → fire */
export const ELEMENT_BEATS = Object.freeze({
  fire: 'ice',
  ice: 'thunder',
  thunder: 'fire',
});

export const ELEMENT_MULTIPLIER = Object.freeze({
  strong: 1.35,
  neutral: 1.0,
  weak: 0.75,
});

export const ELEMENT_CRYSTAL = Object.freeze({
  fire: 'fireCrystal',
  ice: 'iceCrystal',
  thunder: 'thunderCrystal',
});

export const WEAPON_TYPES = [
  'sword',
  'saber',
  'spear',
  'halberd',
  'bow',
  'crossbow',
  'axe',
  'hammer',
  'fan',
  'flute',
  'umbrella',
  'blade',
];

export const FORGE_STAGES = ['iron', 'silver', 'gold'];

/**
 * 品质权重（未归一化）。三座炉各一套，锻造时再乘以幸运符 / 大师熔炉修正。
 */
export const QUALITY_WEIGHTS = Object.freeze({
  iron: Object.freeze({
    common: 5200,
    uncommon: 3000,
    rare: 1300,
    epic: 420,
    legendary: 75,
    mythic: 5,
  }),
  silver: Object.freeze({
    common: 2200,
    uncommon: 3300,
    rare: 2700,
    epic: 1400,
    legendary: 360,
    mythic: 40,
  }),
  gold: Object.freeze({
    common: 600,
    uncommon: 1800,
    rare: 3000,
    epic: 3000,
    legendary: 1400,
    mythic: 200,
  }),
});

/** 幸运符：整体品质权重上移（低品质压低、高品质抬高）。 */
export const LUCKY_CHARM_MULTIPLIER = Object.freeze({
  common: 0.45,
  uncommon: 0.8,
  rare: 1.25,
  epic: 1.6,
  legendary: 2.0,
  mythic: 2.4,
});

/** 大师熔炉：每日 1 次，史诗及以上权重 ×1.8。 */
export const MASTER_FORGE_MULTIPLIER = Object.freeze({
  common: 1,
  uncommon: 1,
  rare: 1,
  epic: 1.8,
  legendary: 1.8,
  mythic: 1.8,
});

export const MASTER_FORGE = Object.freeze({
  dailyUses: 1,
  /** 免费；只是每日限次的策略资源 */
  extraCost: Object.freeze({}),
});

/** 锻造消耗。elementBias / lucky / masterForge 的附加消耗单列。 */
export const FORGE_COST = Object.freeze({
  iron: Object.freeze({ coin: 120, iron: 12 }),
  silver: Object.freeze({ coin: 480, iron: 20, silverOre: 8 }),
  gold: Object.freeze({ coin: 1600, silverOre: 16, goldOre: 6 }),
});

/** 指定元素偏向的额外消耗（对应三相晶）。 */
export const ELEMENT_BIAS_COST = Object.freeze({
  iron: 2,
  silver: 3,
  gold: 4,
});

/**
 * 元素偏向命中权重：偏向元素的原型权重 ×N，其余 ×1。
 * 不做 100% 保底，保留寻器惊喜感。
 */
export const ELEMENT_BIAS_WEIGHT = 6;

export const LUCKY_CHARM_COST = Object.freeze({ luckyCharm: 1 });

/** 保底：连续未出史诗/传说的次数达到阈值时，本次强制提档。按炉分别计数。 */
export const FORGE_PITY = Object.freeze({
  iron: Object.freeze({ epic: 25, legendary: 160 }),
  silver: Object.freeze({ epic: 14, legendary: 80 }),
  gold: Object.freeze({ epic: 8, legendary: 40 }),
});

/** 品质对基础属性的乘区。 */
export const QUALITY_STAT_MULTIPLIER = Object.freeze({
  common: 1.0,
  uncommon: 1.18,
  rare: 1.42,
  epic: 1.75,
  legendary: 2.2,
  mythic: 2.9,
});

/** 品质决定词条数量。 */
export const QUALITY_AFFIX_COUNT = Object.freeze({
  common: 1,
  uncommon: 1,
  rare: 2,
  epic: 3,
  legendary: 3,
  mythic: 4,
});

/** 品质决定强化等级上限。 */
export const QUALITY_LEVEL_CAP = Object.freeze({
  common: 20,
  uncommon: 30,
  rare: 40,
  epic: 50,
  legendary: 60,
  mythic: 70,
});

/** 词条数值随品质放大。 */
export const QUALITY_AFFIX_POWER = Object.freeze({
  common: 0.7,
  uncommon: 0.85,
  rare: 1.0,
  epic: 1.2,
  legendary: 1.45,
  mythic: 1.75,
});

/** 每级成长（乘在基础值上的线性系数）。 */
export const LEVEL_GROWTH = Object.freeze({
  atk: 0.12,
  hp: 0.1,
});

/** 强化：每 3 级解锁 1 个技能槽，最多 3 个。 */
export const SKILL_SLOT_LEVELS = Object.freeze([1, 3, 6]);
export const MAX_SKILL_SLOTS = 3;

/** 强化消耗曲线：coin = base * level^exp * qualityMul，矿石按阶段取。 */
export const ENHANCE_COST = Object.freeze({
  coinBase: 60,
  coinExponent: 1.35,
  qualityMultiplier: Object.freeze({
    common: 1,
    uncommon: 1.25,
    rare: 1.6,
    epic: 2.1,
    legendary: 2.8,
    mythic: 3.6,
  }),
  /** 每次强化所需矿石 = ceil(level / oreDivisor)，矿种由兵器 forgeStage 决定。 */
  oreDivisor: 3,
  oreByStage: Object.freeze({ iron: 'iron', silver: 'silverOre', gold: 'goldOre' }),
  /** 每 10 级需要 1 枚玄晶作为「淬火」门槛 */
  diamondEveryLevels: 10,
  diamondPerBreak: 1,
});

/** 分解返还 60% 的锻造消耗，并按品质额外给碎片。 */
export const DISMANTLE = Object.freeze({
  refundRatio: 0.6,
  /** 强化投入的返还比例（略低，防止刷金） */
  enhanceRefundRatio: 0.45,
  qualityBonus: Object.freeze({
    common: Object.freeze({ coin: 20 }),
    uncommon: Object.freeze({ coin: 60 }),
    rare: Object.freeze({ coin: 180, luckyCharm: 0 }),
    epic: Object.freeze({ coin: 520, luckyCharm: 1 }),
    legendary: Object.freeze({ coin: 1400, luckyCharm: 2, diamond: 1 }),
    mythic: Object.freeze({ coin: 4000, luckyCharm: 4, diamond: 5 }),
  }),
});

/**
 * 挂机产出（每分钟）。cleared = 已通关最高关卡序号。
 * rate = base + perStage * cleared，unlockStage 之前为 0。
 */
export const IDLE_RATES = Object.freeze({
  coin: Object.freeze({ base: 6, perStage: 2.4, unlockStage: 0 }),
  iron: Object.freeze({ base: 1.2, perStage: 0.35, unlockStage: 0 }),
  silverOre: Object.freeze({ base: 0, perStage: 0.12, unlockStage: 10 }),
  goldOre: Object.freeze({ base: 0, perStage: 0.05, unlockStage: 25 }),
  fireCrystal: Object.freeze({ base: 0, perStage: 0.035, unlockStage: 4 }),
  iceCrystal: Object.freeze({ base: 0, perStage: 0.035, unlockStage: 12 }),
  thunderCrystal: Object.freeze({ base: 0, perStage: 0.035, unlockStage: 20 }),
});

export const IDLE = Object.freeze({
  /** 离线最多结算 8 小时 */
  offlineCapMs: 8 * 60 * 60 * 1000,
  /** 低于 1 分钟不结算，避免刷点击 */
  minCollectMs: 60 * 1000,
  /** 离线收益折算（在线挂机 100%，离线 80%） */
  offlineRatio: 0.8,
  /** 图鉴收集度对挂机的加成上限 */
  codexBonusCap: 0.15,
});

export const STAMINA = Object.freeze({
  max: 120,
  regenMs: 6 * 60 * 1000,
  regenAmount: 1,
});

/** 图鉴收集度：每收集 1 把原型 +x，封顶 15%。 */
export const CODEX_BONUS = Object.freeze({
  perProto: 0.0045,
  cap: 0.15,
});

/** 阵容栏位随主线进度解锁。 */
export const LINEUP_UNLOCK_STAGES = Object.freeze([0, 3, 8, 16, 28]);
export const MAX_LINEUP = 5;

/** 羁绊阈值（战斗层读取）。 */
export const BOND_RULES = Object.freeze({
  sameType: 2,
  sameElement: 3,
  mythic: 1,
});

/** 战力估算权重（与 GDD 第 6 节一致）。 */
export const POWER_FORMULA = Object.freeze({
  critWeight: 0.5,
  hpWeight: 0.15,
  bondBonus: 0.08,
});

export const BAG = Object.freeze({
  baseSlots: 60,
  maxSlots: 200,
});

export const BALANCE_VERSION = 1;

export default Object.freeze({
  BALANCE_VERSION,
  QUALITIES,
  QUALITY_RANK,
  ELEMENTS,
  ELEMENT_BEATS,
  ELEMENT_MULTIPLIER,
  ELEMENT_CRYSTAL,
  WEAPON_TYPES,
  FORGE_STAGES,
  QUALITY_WEIGHTS,
  LUCKY_CHARM_MULTIPLIER,
  MASTER_FORGE_MULTIPLIER,
  MASTER_FORGE,
  FORGE_COST,
  ELEMENT_BIAS_COST,
  ELEMENT_BIAS_WEIGHT,
  LUCKY_CHARM_COST,
  FORGE_PITY,
  QUALITY_STAT_MULTIPLIER,
  QUALITY_AFFIX_COUNT,
  QUALITY_LEVEL_CAP,
  QUALITY_AFFIX_POWER,
  LEVEL_GROWTH,
  SKILL_SLOT_LEVELS,
  MAX_SKILL_SLOTS,
  ENHANCE_COST,
  DISMANTLE,
  IDLE_RATES,
  IDLE,
  STAMINA,
  CODEX_BONUS,
  LINEUP_UNLOCK_STAGES,
  MAX_LINEUP,
  BOND_RULES,
  POWER_FORMULA,
  BAG,
});
