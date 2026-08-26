/**
 * 数值总表 — 纯数据，无副作用，可在 Node 中 import。
 * 任何随机相关的权重都在这里，锻造/战斗/挂机不得内联魔法数字。
 *
 * Round 2 起本表以 `.agent_workspace/round1/fable3-economy.md` 为准（400 种子蒙特卡洛校准）。
 * 该文档的导出名（QUALITY_MULT / FORGE_TIERS / LUCKY_CHARM_MOD / STAGE_BALANCE …）与
 * Round 1 已在用的导出名（QUALITY_STAT_MULTIPLIER / QUALITY_WEIGHTS / FORGE_COST …）并存，
 * 同一份字面量两个名字，避免下游拆测试。
 *
 * 刻意未对齐的两处，留给 fable-3 Round 2 的实战重校（文档 §11）：
 *  - ENHANCE_COST / QUALITY_LEVEL_CAP：文档的 6–21 级曲线是按 baseAtk 20–32 的原型算的，
 *    而 data/weapons.js 的原型高约 1.5 倍，直接换会让 21–40 关的战力墙失真。
 *  - stages.js 的 recommendPower：战斗引擎按现有曲线调过，文档的 enemyPower 另存为
 *    `stage.balancePower` 供经济回归比对。
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

/** 品质碎片资源 ID（强化突破与分解产出，fable-3 §10 接口缺口 R1）。 */
export const SHARD_RESOURCE = Object.freeze({
  common: 'shardCommon',
  uncommon: 'shardUncommon',
  rare: 'shardRare',
  epic: 'shardEpic',
  legendary: 'shardLegendary',
  mythic: 'shardMythic',
});

export const SHARD_RESOURCE_IDS = Object.freeze(QUALITIES.map((q) => SHARD_RESOURCE[q]));

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

/* ------------------------------------------------------------------ *
 * 1. 三座炉：解锁 / 成本 / 滚动区间 / 品质权重（fable-3 §1 字面量）
 * ------------------------------------------------------------------ */

export const FORGE_TIERS = Object.freeze({
  iron: Object.freeze({
    unlockStage: 0,
    cost: Object.freeze({ iron: 20, coin: 120 }),
    baseAtk: Object.freeze([20, 32]),
    baseHp: Object.freeze([104, 166]),
    weights: Object.freeze({ common: 52, uncommon: 31, rare: 13.5, epic: 3.2, legendary: 0.3, mythic: 0 }),
  }),
  silver: Object.freeze({
    unlockStage: 8,
    cost: Object.freeze({ silverOre: 16, iron: 30, coin: 450 }),
    baseAtk: Object.freeze([65, 100]),
    baseHp: Object.freeze([338, 520]),
    weights: Object.freeze({ common: 20, uncommon: 34, rare: 28, epic: 14, legendary: 3.6, mythic: 0.4 }),
  }),
  gold: Object.freeze({
    unlockStage: 21,
    cost: Object.freeze({ goldOre: 12, silverOre: 25, iron: 60, coin: 1800 }),
    baseAtk: Object.freeze([160, 240]),
    baseHp: Object.freeze([832, 1248]),
    weights: Object.freeze({ common: 0, uncommon: 16, rare: 33, epic: 31, legendary: 16, mythic: 4 }),
  }),
});

/**
 * 品质权重（未归一化）。三座炉各一套，锻造时再乘以幸运符 / 大师熔炉修正。
 * 与 FORGE_TIERS[stage].weights 是同一份数据。
 */
export const QUALITY_WEIGHTS = Object.freeze({
  iron: FORGE_TIERS.iron.weights,
  silver: FORGE_TIERS.silver.weights,
  gold: FORGE_TIERS.gold.weights,
});

/** 锻造消耗。elementBias / lucky / masterForge 的附加消耗单列。 */
export const FORGE_COST = Object.freeze({
  iron: FORGE_TIERS.iron.cost,
  silver: FORGE_TIERS.silver.cost,
  gold: FORGE_TIERS.gold.cost,
});

/** 各炉解锁所需的已通关关卡数。 */
export const FORGE_UNLOCK_STAGE = Object.freeze({
  iron: FORGE_TIERS.iron.unlockStage,
  silver: FORGE_TIERS.silver.unlockStage,
  gold: FORGE_TIERS.gold.unlockStage,
});

/** 幸运符：对基础权重逐项相乘后归一化；与大师熔炉可叠乘。 */
export const LUCKY_CHARM_MOD = Object.freeze({
  common: 0.4,
  uncommon: 0.8,
  rare: 1.5,
  epic: 1.6,
  legendary: 1.7,
  mythic: 1.8,
});
export const LUCKY_CHARM_MULTIPLIER = LUCKY_CHARM_MOD;

/** 大师熔炉：每日 1 次，史诗及以上权重 ×1.8。 */
export const MASTER_FORGE_MOD = Object.freeze({
  common: 1,
  uncommon: 1,
  rare: 1,
  epic: 1.8,
  legendary: 1.8,
  mythic: 1.8,
});
export const MASTER_FORGE_MULTIPLIER = MASTER_FORGE_MOD;

export const MASTER_FORGE = Object.freeze({
  dailyUses: 1,
  /** 免费；只是每日限次的策略资源 */
  extraCost: Object.freeze({}),
});

/** 元素偏向：付 2 枚对应三相晶即保证主元素（fable-3 §1 ELEMENT_BIAS）。 */
export const ELEMENT_BIAS = Object.freeze({ crystalCost: 2, guarantee: true });

/** 指定元素偏向的额外消耗（对应三相晶），三座炉同价。 */
export const ELEMENT_BIAS_COST = Object.freeze({
  iron: ELEMENT_BIAS.crystalCost,
  silver: ELEMENT_BIAS.crystalCost,
  gold: ELEMENT_BIAS.crystalCost,
});

/**
 * 元素偏向命中权重。付费后按 ELEMENT_BIAS.guarantee 直接锁主元素，
 * 该权重只在「本品质下没有对应元素原型」时作为降级兜底。
 */
export const ELEMENT_BIAS_WEIGHT = 6;

export const LUCKY_CHARM_COST = Object.freeze({ luckyCharm: 1 });

/**
 * 保底（fable-3 §1）：
 *  - 白银 / 黄金炉连续 8 锤未出史诗+ → 第 8 锤保底史诗；出史诗+即清零。
 *  - 精铁炉无保底。
 *  - 账号第一次成功开炉保底精钢：凡铁低 roll 打不过第 1 关，首战失败是最差的新手体验。
 * 计数器持久化在 state.forge.pity[stage]。
 */
export const FORGE_PITY = Object.freeze({
  epicPityCount: 8,
  pityTiers: Object.freeze(['silver', 'gold']),
  firstForgeMinQuality: 'uncommon',
});

/** 按炉展开的保底阈值视图（null = 该炉不设此保底）。 */
export const FORGE_PITY_BY_STAGE = Object.freeze(
  FORGE_STAGES.reduce((acc, stage) => {
    acc[stage] = Object.freeze({
      epic: FORGE_PITY.pityTiers.includes(stage) ? FORGE_PITY.epicPityCount : null,
      legendary: null,
    });
    return acc;
  }, {}),
);

/* ------------------------------------------------------------------ *
 * 2. 品质派生表
 * ------------------------------------------------------------------ */

/** 品质对基础属性的乘区。 */
export const QUALITY_MULT = Object.freeze({
  common: 1.0,
  uncommon: 1.18,
  rare: 1.42,
  epic: 1.75,
  legendary: 2.2,
  mythic: 2.8,
});
export const QUALITY_STAT_MULTIPLIER = QUALITY_MULT;

/** 品质决定词条数量。凡铁无词条 —— 这是「白板」的手感来源。 */
export const AFFIX_COUNT = Object.freeze({
  common: 0,
  uncommon: 1,
  rare: 1,
  epic: 2,
  legendary: 3,
  mythic: 4,
});
export const QUALITY_AFFIX_COUNT = AFFIX_COUNT;

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

/**
 * 分解（fable-3 §2）：返还 60% 锻造矿物成本，另按品质产出同品质碎片。
 * 铜钱一分不退 —— 这是刻意保留的反通胀沉没。
 */
const DISMANTLE_SHARDS = Object.freeze({
  common: 2,
  uncommon: 4,
  rare: 7,
  epic: 12,
  legendary: 20,
  mythic: 36,
});

export const DISMANTLE = Object.freeze({
  refundRatio: 0.6,
  /** 强化投入的返还比例（略低，防止刷金） */
  enhanceRefundRatio: 0.45,
  /** 永不返还的资源：铜钱是主要沉没口 */
  refundExclude: Object.freeze(['coin']),
  /** 同品质碎片产出 */
  shards: DISMANTLE_SHARDS,
  /** 兼容旧字段名：品质附加产出（现在是同品质碎片） */
  qualityBonus: Object.freeze(
    QUALITIES.reduce((acc, q) => {
      acc[q] = Object.freeze({ [SHARD_RESOURCE[q]]: DISMANTLE_SHARDS[q] });
      return acc;
    }, {}),
  ),
});

/* ------------------------------------------------------------------ *
 * 3. 挂机 / 体力 / 进度门（fable-3 §4）
 * ------------------------------------------------------------------ */

/**
 * 挂机产出（每分钟）。cleared = 已通关最高关卡序号。
 * rate = base + perStage × max(0, cleared − offsetStage)，cleared < minStage 时为 0。
 */
export const IDLE_RATES = Object.freeze({
  coin: Object.freeze({ base: 5, perStage: 2.2, offsetStage: 0, minStage: 0, unlockStage: 0 }),
  iron: Object.freeze({ base: 0.5, perStage: 0.11, offsetStage: 0, minStage: 0, unlockStage: 0 }),
  silverOre: Object.freeze({ base: 0, perStage: 0.08, offsetStage: 9, minStage: 10, unlockStage: 10 }),
  goldOre: Object.freeze({ base: 0, perStage: 0.006, offsetStage: 21, minStage: 22, unlockStage: 22 }),
});

export const IDLE = Object.freeze({
  /** 离线最多结算 8 小时 */
  offlineCapMs: 8 * 60 * 60 * 1000,
  offlineCapHours: 8,
  /** 低于 1 分钟不结算，避免刷点击 */
  minCollectMs: 60 * 1000,
  /** 在线 / 离线同率（fable-3 offlineEfficiency = 1.0） */
  offlineRatio: 1.0,
  offlineEfficiency: 1.0,
  /** 图鉴收集度对挂机的加成上限 */
  codexBonusCap: 0.15,
});

export const STAMINA = Object.freeze({
  max: 120,
  regenMs: 6 * 60 * 1000,
  regenAmount: 1,
});

export const STAMINA_RULES = Object.freeze({
  cap: STAMINA.max,
  regenSeconds: STAMINA.regenMs / 1000,
  startFull: true,
  costNormal: 3,
  costElite: 6,
});

/**
 * 开局礼包 = 3 锤精铁炉的量。文档写的是 300 铜钱，但精铁炉一锤 120 铜钱，
 * 300 只够 2 锤，与它自己的注释矛盾；这里按「3 锤」这个设计意图取 360。
 */
export const STARTER_KIT = Object.freeze({
  coin: FORGE_COST.iron.coin * 3,
  iron: FORGE_COST.iron.iron * 3,
});

export const SWEEP_RULES = Object.freeze({
  unlock: 'firstClear',
  freeDaily: 2,
  staminaCost: 'same-as-stage',
  instant: true,
});

/** 图鉴收集度：每收集 1 把原型 +0.625%，封顶 15%。 */
export const CODEX_BONUS = Object.freeze({
  perEntry: 0.00625,
  perProto: 0.00625,
  cap: 0.15,
});

/** 阵容栏位：通过第 i 项关卡后解锁第 i+1 个栏位（0 = 开局即有）。 */
export const SLOT_UNLOCK_STAGES = Object.freeze([0, 2, 4, 9, 14]);
export const LINEUP_UNLOCK_STAGES = SLOT_UNLOCK_STAGES;
export const MAX_LINEUP = 5;

/* ------------------------------------------------------------------ *
 * 4. 每日 / 兑换 / 竞技（fable-3 §5–6）
 * ------------------------------------------------------------------ */

export const DAILY_RULES = Object.freeze({
  masterForgePerDay: 1,
  freeSweeps: 2,
  quest: Object.freeze({ luckyCharm: 1, coin: 500, diamond: 10 }),
  trials: Object.freeze({
    normal: Object.freeze({ freeRuns: 2, extraStamina: 8, rewards: Object.freeze({ iron: 40, coin: 350 }) }),
    elite: Object.freeze({ freeRuns: 1, powerGate: 350, rewards: Object.freeze({ silverOre: 20 }) }),
    high: Object.freeze({ freeRuns: 1, powerGate: 6000, unlockStage: 24, rewards: Object.freeze({ goldOre: 6 }) }),
  }),
});

export const EXCHANGE = Object.freeze({
  luckyCharm: Object.freeze({ diamond: 40, amount: 1, dailyCap: 2 }),
  staminaRefill: Object.freeze({ diamond: 50, stamina: 60, dailyCap: 2 }),
  goldOrePack: Object.freeze({ diamond: 60, goldOre: 5, dailyCap: 1 }),
});

export const ACHIEVEMENT_DIAMOND_BUDGET = Object.freeze({
  total: 300,
  examples: Object.freeze({
    firstForge: 10,
    firstRare: 10,
    firstEpic: 20,
    firstLegendary: 30,
    firstMythic: 50,
    stage5: 15,
    stage10: 20,
    stage15: 25,
    stage20: 30,
    codex12: 30,
    codex24: 60,
  }),
});

export const ARENA_RULES = Object.freeze({
  unlockStage: 8,
  attacksPerDay: 5,
  staminaCost: 0,
  opponentPowerBand: Object.freeze([0.85, 1.25]),
  elo: Object.freeze({ start: 1000, winDelta: 14, lossDelta: -10, floor: 800 }),
  rewards: Object.freeze({
    win: Object.freeze({ diamond: 4, goldOre: 2, coin: 350 }),
    loss: Object.freeze({ diamond: 1, goldOre: 1, coin: 120 }),
  }),
  dailyChest: Object.freeze([
    Object.freeze({ minElo: 0, name: '青铜', diamond: 8, goldOre: 2 }),
    Object.freeze({ minElo: 1100, name: '白银', diamond: 12, goldOre: 4 }),
    Object.freeze({ minElo: 1200, name: '黄金', diamond: 18, goldOre: 6 }),
    Object.freeze({ minElo: 1350, name: '铂金', diamond: 28, goldOre: 9 }),
    Object.freeze({ minElo: 1500, name: '王者', diamond: 40, goldOre: 14 }),
  ]),
});

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

/** fable-3 §7 的战力模型假设（模拟器与经济回归用）。 */
export const POWER_FACTORS = Object.freeze({
  baseCrit: 0.08,
  critPowerWeight: 0.5,
  hpPowerWeight: 0.15,
  hpPerAtk: 5.2,
  setBonusAssumed: 0.05,
});

/**
 * 兵器架容量。刷本 → 分解 → 再锻造是主循环，架子太小会把节奏卡在整理背包上。
 */
export const BAG = Object.freeze({
  baseSlots: 400,
  maxSlots: 999,
});

/* ------------------------------------------------------------------ *
 * 5. 40 关掉落表（fable-3 §3 字面量，逐行照抄）
 *
 * crystal      = 本关 element 对应的三相晶数量
 * shards       = { 品质: 数量 }，映射到 SHARD_RESOURCE
 * repeat[x]    = [min,max] 每次胜利/扫荡的均匀随机区间
 * shardChance  命中时掉 1 个 shardTier 品质碎片
 * crystalChance 命中时掉 1 个本关元素晶
 * 首通同时发放该关一次 repeat 掉落。
 * ------------------------------------------------------------------ */

export const STAGE_BALANCE = Object.freeze([
  {"id":1,"elite":false,"element":"fire","waves":1,"staminaCost":3,"enemyPower":40,"firstClear":{"coin":75,"iron":12,"shards":{"common":4}},"repeat":{"coin":[16,30],"iron":[2,4],"crystalChance":0.35,"shardChance":0.3,"shardTier":"common"}},
  {"id":2,"elite":false,"element":"ice","waves":1,"staminaCost":3,"enemyPower":48,"firstClear":{"coin":120,"iron":14,"shards":{"common":4}},"repeat":{"coin":[22,40],"iron":[3,5],"crystalChance":0.35,"shardChance":0.3,"shardTier":"common"}},
  {"id":3,"elite":false,"element":"thunder","waves":1,"staminaCost":3,"enemyPower":57,"firstClear":{"coin":170,"iron":15,"shards":{"common":4}},"repeat":{"coin":[27,51],"iron":[3,6],"crystalChance":0.35,"shardChance":0.3,"shardTier":"common"}},
  {"id":4,"elite":false,"element":"fire","waves":1,"staminaCost":3,"enemyPower":67,"firstClear":{"coin":215,"iron":17,"crystal":2,"shards":{"uncommon":3}},"repeat":{"coin":[33,61],"iron":[3,6],"crystalChance":0.35,"shardChance":0.3,"shardTier":"uncommon"}},
  {"id":5,"elite":true,"element":"ice","waves":1,"staminaCost":6,"enemyPower":100,"firstClear":{"coin":260,"iron":19,"crystal":2,"shards":{"uncommon":6},"luckyCharm":1,"diamond":20},"repeat":{"coin":[39,72],"iron":[4,7],"crystalChance":0.35,"shardChance":0.3,"shardTier":"uncommon"}},
  {"id":6,"elite":false,"element":"thunder","waves":1,"staminaCost":3,"enemyPower":95,"firstClear":{"coin":305,"iron":21,"crystal":2,"shards":{"uncommon":3}},"repeat":{"coin":[44,82],"iron":[4,7],"crystalChance":0.35,"shardChance":0.3,"shardTier":"uncommon"}},
  {"id":7,"elite":false,"element":"fire","waves":2,"staminaCost":3,"enemyPower":114,"firstClear":{"coin":350,"iron":23,"crystal":2,"shards":{"uncommon":3}},"repeat":{"coin":[50,92],"iron":[4,8],"crystalChance":0.35,"shardChance":0.3,"shardTier":"uncommon"}},
  {"id":8,"elite":false,"element":"ice","waves":2,"staminaCost":3,"enemyPower":135,"firstClear":{"coin":400,"iron":24,"silverOre":5,"crystal":2,"shards":{"rare":4}},"repeat":{"coin":[55,103],"iron":[5,9],"silverOre":[1,4],"crystalChance":0.35,"shardChance":0.3,"shardTier":"rare"}},
  {"id":9,"elite":false,"element":"thunder","waves":2,"staminaCost":3,"enemyPower":164,"firstClear":{"coin":445,"iron":26,"silverOre":5,"crystal":2,"shards":{"rare":4}},"repeat":{"coin":[61,113],"iron":[5,9],"silverOre":[1,4],"crystalChance":0.35,"shardChance":0.3,"shardTier":"rare"}},
  {"id":10,"elite":true,"element":"fire","waves":2,"staminaCost":6,"enemyPower":247,"firstClear":{"coin":490,"iron":28,"silverOre":15,"crystal":3,"shards":{"rare":8},"luckyCharm":1,"diamond":20},"repeat":{"coin":[67,124],"iron":[5,10],"silverOre":[1,4],"crystalChance":0.35,"shardChance":0.3,"shardTier":"rare"}},
  {"id":11,"elite":false,"element":"ice","waves":2,"staminaCost":3,"enemyPower":239,"firstClear":{"coin":535,"iron":30,"silverOre":5,"crystal":3,"shards":{"rare":4}},"repeat":{"coin":[72,134],"iron":[6,10],"silverOre":[1,5],"crystalChance":0.35,"shardChance":0.3,"shardTier":"rare"}},
  {"id":12,"elite":false,"element":"thunder","waves":2,"staminaCost":3,"enemyPower":290,"firstClear":{"coin":580,"iron":32,"silverOre":5,"crystal":3,"shards":{"rare":4}},"repeat":{"coin":[78,144],"iron":[6,11],"silverOre":[1,5],"crystalChance":0.35,"shardChance":0.3,"shardTier":"rare"}},
  {"id":13,"elite":false,"element":"fire","waves":2,"staminaCost":3,"enemyPower":351,"firstClear":{"coin":630,"iron":33,"silverOre":5,"crystal":3,"shards":{"rare":4}},"repeat":{"coin":[83,155],"iron":[6,12],"silverOre":[2,5],"crystalChance":0.35,"shardChance":0.3,"shardTier":"rare"}},
  {"id":14,"elite":false,"element":"ice","waves":2,"staminaCost":3,"enemyPower":424,"firstClear":{"coin":675,"iron":35,"silverOre":5,"crystal":3,"shards":{"rare":4}},"repeat":{"coin":[89,165],"iron":[7,12],"silverOre":[2,6],"crystalChance":0.35,"shardChance":0.3,"shardTier":"rare"}},
  {"id":15,"elite":true,"element":"thunder","waves":2,"staminaCost":6,"enemyPower":642,"firstClear":{"coin":720,"silverOre":15,"crystal":3,"shards":{"rare":8},"luckyCharm":1,"diamond":20},"repeat":{"coin":[95,176],"iron":[7,13],"silverOre":[2,6],"crystalChance":0.35,"shardChance":0.3,"shardTier":"rare"}},
  {"id":16,"elite":false,"element":"fire","waves":2,"staminaCost":3,"enemyPower":621,"firstClear":{"coin":765,"silverOre":5,"crystal":3,"shards":{"rare":4}},"repeat":{"coin":[100,186],"iron":[7,13],"silverOre":[2,6],"crystalChance":0.35,"shardChance":0.3,"shardTier":"rare"}},
  {"id":17,"elite":false,"element":"ice","waves":3,"staminaCost":3,"enemyPower":752,"firstClear":{"coin":810,"silverOre":5,"crystal":3,"shards":{"epic":4}},"repeat":{"coin":[106,196],"iron":[7,14],"silverOre":[2,7],"crystalChance":0.35,"shardChance":0.3,"shardTier":"epic"}},
  {"id":18,"elite":false,"element":"thunder","waves":3,"staminaCost":3,"enemyPower":909,"firstClear":{"coin":860,"silverOre":5,"crystal":3,"shards":{"epic":4}},"repeat":{"coin":[111,207],"iron":[8,14],"silverOre":[2,7],"crystalChance":0.35,"shardChance":0.3,"shardTier":"epic"}},
  {"id":19,"elite":false,"element":"fire","waves":3,"staminaCost":3,"enemyPower":1100,"firstClear":{"coin":905,"silverOre":5,"crystal":3,"shards":{"epic":4}},"repeat":{"coin":[117,217],"iron":[8,15],"silverOre":[2,7],"crystalChance":0.35,"shardChance":0.3,"shardTier":"epic"}},
  {"id":20,"elite":true,"element":"ice","waves":3,"staminaCost":6,"enemyPower":1664,"firstClear":{"coin":950,"silverOre":15,"crystal":4,"shards":{"epic":8},"luckyCharm":1,"diamond":20},"repeat":{"coin":[122,228],"iron":[8,16],"silverOre":[3,8],"crystalChance":0.35,"shardChance":0.3,"shardTier":"epic"}},
  {"id":21,"elite":false,"element":"thunder","waves":3,"staminaCost":3,"enemyPower":1478,"firstClear":{"coin":995,"silverOre":5,"crystal":4,"shards":{"epic":4}},"repeat":{"coin":[128,238],"iron":[6,10],"silverOre":[3,8],"crystalChance":0.35,"shardChance":0.3,"shardTier":"epic"}},
  {"id":22,"elite":false,"element":"fire","waves":3,"staminaCost":3,"enemyPower":1640,"firstClear":{"coin":1040,"silverOre":5,"goldOre":4,"crystal":4,"shards":{"epic":4}},"repeat":{"coin":[134,248],"iron":[6,10],"silverOre":[3,8],"goldOre":[0,1],"crystalChance":0.35,"shardChance":0.3,"shardTier":"epic"}},
  {"id":23,"elite":false,"element":"ice","waves":3,"staminaCost":3,"enemyPower":1821,"firstClear":{"coin":1090,"silverOre":5,"goldOre":4,"crystal":4,"shards":{"epic":4}},"repeat":{"coin":[139,259],"iron":[6,10],"silverOre":[3,9],"goldOre":[0,1],"crystalChance":0.35,"shardChance":0.3,"shardTier":"epic"}},
  {"id":24,"elite":false,"element":"thunder","waves":3,"staminaCost":3,"enemyPower":2021,"firstClear":{"coin":1135,"silverOre":5,"goldOre":5,"crystal":4,"shards":{"epic":4}},"repeat":{"coin":[145,269],"iron":[6,10],"silverOre":[3,9],"goldOre":[0,1],"crystalChance":0.35,"shardChance":0.3,"shardTier":"epic"}},
  {"id":25,"elite":true,"element":"fire","waves":3,"staminaCost":6,"enemyPower":2804,"firstClear":{"coin":1180,"goldOre":5,"crystal":4,"shards":{"legendary":4},"luckyCharm":1,"diamond":20},"repeat":{"coin":[151,280],"iron":[6,10],"silverOre":[3,10],"goldOre":[0,1],"crystalChance":0.35,"shardChance":0.3,"shardTier":"legendary"}},
  {"id":26,"elite":false,"element":"ice","waves":3,"staminaCost":3,"enemyPower":2490,"firstClear":{"coin":1225,"goldOre":6,"crystal":4,"shards":{"legendary":2}},"repeat":{"coin":[156,290],"iron":[6,10],"silverOre":[4,10],"goldOre":[0,1],"crystalChance":0.35,"shardChance":0.3,"shardTier":"legendary"}},
  {"id":27,"elite":false,"element":"thunder","waves":3,"staminaCost":3,"enemyPower":2764,"firstClear":{"coin":1270,"goldOre":6,"crystal":4,"shards":{"legendary":2}},"repeat":{"coin":[162,300],"iron":[6,10],"silverOre":[4,10],"goldOre":[0,1],"crystalChance":0.35,"shardChance":0.3,"shardTier":"legendary"}},
  {"id":28,"elite":false,"element":"fire","waves":3,"staminaCost":3,"enemyPower":3068,"firstClear":{"coin":1320,"goldOre":7,"crystal":4,"shards":{"legendary":2}},"repeat":{"coin":[167,311],"iron":[6,10],"silverOre":[4,11],"goldOre":[0,2],"crystalChance":0.35,"shardChance":0.3,"shardTier":"legendary"}},
  {"id":29,"elite":false,"element":"ice","waves":3,"staminaCost":3,"enemyPower":3406,"firstClear":{"coin":1365,"goldOre":7,"crystal":4,"shards":{"legendary":2}},"repeat":{"coin":[173,321],"iron":[6,10],"silverOre":[4,11],"goldOre":[0,2],"crystalChance":0.35,"shardChance":0.3,"shardTier":"legendary"}},
  {"id":30,"elite":true,"element":"thunder","waves":3,"staminaCost":6,"enemyPower":4726,"firstClear":{"coin":1410,"goldOre":8,"crystal":5,"shards":{"legendary":4},"luckyCharm":1,"diamond":20},"repeat":{"coin":[179,332],"iron":[6,10],"silverOre":[4,11],"goldOre":[0,2],"crystalChance":0.35,"shardChance":0.3,"shardTier":"legendary"}},
  {"id":31,"elite":false,"element":"fire","waves":3,"staminaCost":3,"enemyPower":4196,"firstClear":{"coin":1455,"goldOre":8,"crystal":5,"shards":{"legendary":2}},"repeat":{"coin":[184,342],"iron":[6,10],"silverOre":[4,12],"goldOre":[0,2],"crystalChance":0.35,"shardChance":0.3,"shardTier":"legendary"}},
  {"id":32,"elite":false,"element":"ice","waves":3,"staminaCost":3,"enemyPower":4658,"firstClear":{"coin":1500,"goldOre":9,"crystal":5,"shards":{"legendary":2}},"repeat":{"coin":[190,352],"iron":[6,10],"silverOre":[4,12],"goldOre":[0,2],"crystalChance":0.35,"shardChance":0.3,"shardTier":"legendary"}},
  {"id":33,"elite":false,"element":"thunder","waves":3,"staminaCost":3,"enemyPower":5170,"firstClear":{"coin":1550,"goldOre":9,"crystal":5,"shards":{"legendary":2}},"repeat":{"coin":[195,363],"iron":[6,10],"silverOre":[5,12],"goldOre":[0,2],"crystalChance":0.35,"shardChance":0.3,"shardTier":"legendary"}},
  {"id":34,"elite":false,"element":"fire","waves":3,"staminaCost":3,"enemyPower":5739,"firstClear":{"coin":1595,"goldOre":10,"crystal":5,"shards":{"mythic":1}},"repeat":{"coin":[201,373],"iron":[6,10],"silverOre":[5,13],"goldOre":[0,2],"crystalChance":0.35,"shardChance":0.3,"shardTier":"mythic"}},
  {"id":35,"elite":true,"element":"ice","waves":3,"staminaCost":6,"enemyPower":7963,"firstClear":{"coin":1640,"goldOre":10,"crystal":5,"shards":{"mythic":2},"luckyCharm":1,"diamond":20},"repeat":{"coin":[207,384],"iron":[6,10],"silverOre":[5,13],"goldOre":[0,2],"crystalChance":0.35,"shardChance":0.3,"shardTier":"mythic"}},
  {"id":36,"elite":false,"element":"thunder","waves":3,"staminaCost":3,"enemyPower":7071,"firstClear":{"coin":1685,"goldOre":11,"crystal":5,"shards":{"mythic":1}},"repeat":{"coin":[212,394],"iron":[6,10],"silverOre":[5,13],"goldOre":[0,2],"crystalChance":0.35,"shardChance":0.3,"shardTier":"mythic"}},
  {"id":37,"elite":false,"element":"fire","waves":3,"staminaCost":3,"enemyPower":7849,"firstClear":{"coin":1730,"goldOre":11,"crystal":5,"shards":{"mythic":1}},"repeat":{"coin":[218,404],"iron":[6,10],"silverOre":[5,14],"goldOre":[0,2],"crystalChance":0.35,"shardChance":0.3,"shardTier":"mythic"}},
  {"id":38,"elite":false,"element":"ice","waves":3,"staminaCost":3,"enemyPower":8712,"firstClear":{"coin":1780,"goldOre":12,"crystal":5,"shards":{"mythic":1}},"repeat":{"coin":[223,415],"iron":[6,10],"silverOre":[5,14],"goldOre":[0,2],"crystalChance":0.35,"shardChance":0.3,"shardTier":"mythic"}},
  {"id":39,"elite":false,"element":"thunder","waves":3,"staminaCost":3,"enemyPower":9671,"firstClear":{"coin":1825,"goldOre":12,"crystal":5,"shards":{"mythic":1}},"repeat":{"coin":[229,425],"iron":[6,10],"silverOre":[5,14],"goldOre":[0,2],"crystalChance":0.35,"shardChance":0.3,"shardTier":"mythic"}},
  {"id":40,"elite":true,"element":"fire","waves":3,"staminaCost":6,"enemyPower":14491,"firstClear":{"coin":1870,"goldOre":13,"crystal":6,"shards":{"mythic":2},"luckyCharm":1,"diamond":20},"repeat":{"coin":[234,436],"iron":[6,10],"silverOre":[6,15],"goldOre":[0,2],"crystalChance":0.35,"shardChance":0.3,"shardTier":"mythic"}}
].map((row) => Object.freeze(row)));

export const STAGE_BALANCE_BY_ID = Object.freeze(
  STAGE_BALANCE.reduce((acc, row) => {
    acc[row.id] = row;
    return acc;
  }, Object.create(null)),
);

export const BALANCE_VERSION = 2;

export default Object.freeze({
  BALANCE_VERSION,
  QUALITIES,
  QUALITY_RANK,
  ELEMENTS,
  ELEMENT_BEATS,
  ELEMENT_MULTIPLIER,
  ELEMENT_CRYSTAL,
  SHARD_RESOURCE,
  SHARD_RESOURCE_IDS,
  WEAPON_TYPES,
  FORGE_STAGES,
  FORGE_TIERS,
  FORGE_UNLOCK_STAGE,
  QUALITY_WEIGHTS,
  LUCKY_CHARM_MOD,
  LUCKY_CHARM_MULTIPLIER,
  MASTER_FORGE_MOD,
  MASTER_FORGE_MULTIPLIER,
  MASTER_FORGE,
  FORGE_COST,
  ELEMENT_BIAS,
  ELEMENT_BIAS_COST,
  ELEMENT_BIAS_WEIGHT,
  LUCKY_CHARM_COST,
  FORGE_PITY,
  FORGE_PITY_BY_STAGE,
  QUALITY_MULT,
  QUALITY_STAT_MULTIPLIER,
  AFFIX_COUNT,
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
  STAMINA_RULES,
  STARTER_KIT,
  SWEEP_RULES,
  CODEX_BONUS,
  SLOT_UNLOCK_STAGES,
  LINEUP_UNLOCK_STAGES,
  MAX_LINEUP,
  DAILY_RULES,
  EXCHANGE,
  ACHIEVEMENT_DIAMOND_BUDGET,
  ARENA_RULES,
  BOND_RULES,
  POWER_FORMULA,
  POWER_FACTORS,
  BAG,
  STAGE_BALANCE,
  STAGE_BALANCE_BY_ID,
});
