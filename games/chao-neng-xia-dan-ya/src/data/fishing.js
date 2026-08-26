/**
 * 佛系钓鱼静态表（3 海域，节奏小游戏，渔获给战斗临时 BUFF）。
 *
 * 玩法数据约定：
 * - rhythm     节奏判定参数：bpm 节拍、notes 音符数、perfectWindowMs / greatWindowMs 判定窗
 * - castCost   单次抛竿金币
 * - catches    渔获池（weight 加权抽取）；buff 为战斗临时增益，battles 为持续场次
 * - 渔获品质由节奏成绩决定，最终 BUFF 数值 = buff 基础值 × qualityMult（见 FISHING_RULES）
 */
export const FISHING_SEAS = [
  {
    id: "pond_dawn",
    name: "晨曦池塘",
    unlockAfterStage: "1-2",
    castCostGold: 10,
    rhythm: { bpm: 84, notes: 8, perfectWindowMs: 120, greatWindowMs: 240 },
    palette: { water: "#8ECAE6", sky: "#FFE8A3" },
    catches: [
      { id: "poached_jelly", name: "荷包蛋水母", rarity: "common", weight: 40, buff: { atkPct: 0.06 }, battles: 3, desc: "半熟的漂浮朋友，攻击 +6%。" },
      { id: "dawn_carp", name: "晨曦鲤", rarity: "common", weight: 35, buff: { goldFindPct: 0.1 }, battles: 3, desc: "鳞片会反光的招财鱼，金币 +10%。" },
      { id: "crit_puffer", name: "暴击河豚", rarity: "rare", weight: 20, buff: { critChance: 0.08 }, battles: 3, desc: "生气就变大，暴击率 +8%。" },
      { id: "twin_whale_baby", name: "双黄鲸宝宝", rarity: "epic", weight: 5, buff: { extraEgg: 1 }, battles: 2, desc: "每回合多下一颗蛋的小可爱。" },
    ],
  },
  {
    id: "neon_bay",
    name: "霓虹湾",
    unlockAfterStage: "2-4",
    castCostGold: 25,
    rhythm: { bpm: 108, notes: 12, perfectWindowMs: 100, greatWindowMs: 200 },
    palette: { water: "#3A0CA3", sky: "#2B2D42" },
    catches: [
      { id: "neon_tetra", name: "霓虹灯鱼", rarity: "common", weight: 38, buff: { atkPct: 0.1 }, battles: 3, desc: "自带 RGB 跑马灯，攻击 +10%。" },
      { id: "eel_powerbank", name: "电鳗充电宝", rarity: "rare", weight: 30, buff: { energyGainPct: 0.15 }, battles: 3, desc: "10000 毫安时，能量获取 +15%。" },
      { id: "soda_bream", name: "冰汽水鲷", rarity: "rare", weight: 24, buff: { elementDmgPct: 0.12 }, battles: 3, desc: "气泡里全是元素力，元素伤害 +12%。" },
      { id: "golden_koi", name: "金蛋锦鲤", rarity: "epic", weight: 8, buff: { atkPct: 0.06, critChance: 0.06 }, battles: 3, desc: "转发这条锦鲤：攻击 +6%、暴击 +6%。" },
    ],
  },
  {
    id: "abyss_trench",
    name: "深渊油锅海沟",
    unlockAfterStage: "4-4",
    castCostGold: 50,
    rhythm: { bpm: 132, notes: 16, perfectWindowMs: 90, greatWindowMs: 170 },
    palette: { water: "#10002B", sky: "#3C1518" },
    catches: [
      { id: "abyss_angler", name: "深渊灯笼鱼", rarity: "rare", weight: 40, buff: { atkPct: 0.15 }, battles: 3, desc: "灯笼一亮火力全开，攻击 +15%。" },
      { id: "lobster_guard", name: "龙虾护卫", rarity: "rare", weight: 30, buff: { leakReducePct: 0.25 }, battles: 3, desc: "铁钳守门，漏怪伤害 -25%。" },
      { id: "magma_octoball", name: "熔岩章鱼球", rarity: "epic", weight: 22, buff: { burnOnHitChance: 0.15 }, battles: 3, desc: "命中 15% 概率点燃敌人。" },
      { id: "pot_dragon", name: "传说·锅中蛟", rarity: "legendary", weight: 8, buff: { extraEgg: 1, atkPct: 0.1 }, battles: 3, desc: "从魔王油锅里越狱的蛟龙：+1 蛋且攻击 +10%。" },
    ],
  },
];

/** 钓鱼规则（modes/fishing 消费）。 */
export const FISHING_RULES = {
  qualityMult: { perfect: 1.5, great: 1.2, good: 1.0 },   // miss 直接脱钩
  missTolerance: 2,        // 单次抛竿允许 miss 音符数，超出脱钩
  buffSlots: 2,            // 同时生效的渔获 BUFF 上限（新 BUFF 顶替最旧）
  perfectBonusWeightPct: 0.2, // 全 perfect 时稀有渔获权重 +20%
};
