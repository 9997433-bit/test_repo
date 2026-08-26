/**
 * 建筑表。经营层（mansion/**）从这里读定义：
 * - `baseYield`：Lv.1 的每秒裸产量，实际产量 = 裸产量 × 等级系数(0.85+0.15×Lv) × 弟子 × 邻接 × 府邸光环。
 * - `combatBonus`：每级给全队的战斗加成（目前生效字段：atk）。
 * - `unlockAt`：洞府仙居达到该等级才可营造。
 * - 邻接规则在 mansion/layout.js 的 ADJACENCY_RULES（灵脉滋田 +15%/条 等）。
 * 兼容性：id 永不删除；只增字段与新条目。
 */
export const BUILDING_TYPES = {
  mansion: {
    id: "mansion",
    name: "洞府仙居",
    glyph: "府",
    desc: "决定建筑等级上限与地块数；每高一级全府产量 +3%",
    unique: true,
    baseYield: { stone: 0.35 },
    unlockAt: 1,
  },
  field: {
    id: "field",
    name: "灵田",
    glyph: "田",
    desc: "产灵草；邻接灵脉产量大增，忌邻丹房锻造房",
    baseYield: { herb: 0.55 },
    unlockAt: 1,
  },
  woodcut: {
    id: "woodcut",
    name: "木坊",
    glyph: "木",
    desc: "伐灵木，供营造",
    baseYield: { wood: 0.42 },
    unlockAt: 1,
  },
  quarry: {
    id: "quarry",
    name: "石坊",
    glyph: "石",
    desc: "开灵矿，供营造与锻造",
    baseYield: { ore: 0.38 },
    unlockAt: 1,
  },
  alchemy: {
    id: "alchemy",
    name: "丹房",
    glyph: "丹",
    desc: "炼丹药；每级全队攻击 +4",
    baseYield: { pills: 0.12 },
    combatBonus: { atk: 4 },
    unlockAt: 2,
  },
  forge: {
    id: "forge",
    name: "锻造房",
    glyph: "锻",
    desc: "温养法器，缓慢产出仙玉碎；每级全队攻击 +3",
    baseYield: { jade: 0.04 },
    combatBonus: { atk: 3 },
    unlockAt: 2,
  },
  array: {
    id: "array",
    name: "聚灵阵",
    glyph: "阵",
    desc: "灵气回复；每级离线结算效率 +6%（上限 90%）",
    baseYield: { qi: 0.9 },
    unlockAt: 1,
  },
  scripture: {
    id: "scripture",
    name: "藏经楼",
    glyph: "经",
    desc: "弟子修业，增长专业经验",
    baseYield: {},
    xpPerSec: 0.35,
    unlockAt: 3,
  },
  leypulse: {
    id: "leypulse",
    name: "灵脉",
    glyph: "脉",
    desc: "地脉节点：邻接灵田 +15%、坊 +10%、聚灵阵 +12%（随灵脉等级再增）",
    baseYield: { qi: 0.12 },
    adjacency: 0.15,
    unlockAt: 2,
  },
  spring: {
    id: "spring",
    name: "灵泉",
    glyph: "泉",
    desc: "涌灵泉，兼产灵气与灵草，中期回气主力",
    baseYield: { qi: 0.5, herb: 0.18 },
    unlockAt: 3,
  },
  bounty: {
    id: "bounty",
    name: "悬赏阁",
    glyph: "赏",
    desc: "接仙盟悬赏，积累仙玉与灵石，礼聘仙友的财源",
    baseYield: { jade: 0.05, stone: 0.3 },
    unlockAt: 5,
  },
  drill: {
    id: "drill",
    name: "演武场",
    glyph: "武",
    desc: "操演阵法；每级全队攻击 +5，造价高昂",
    baseYield: { stone: 0.1 },
    combatBonus: { atk: 5 },
    unlockAt: 6,
  },
};

export const GRID_SIZE = 6;

/** 升级消耗的类型系数：战力类建筑更贵，采集类便宜。 */
export const COST_SCALE = {
  mansion: 1.35,
  field: 1.0,
  woodcut: 1.0,
  quarry: 1.05,
  alchemy: 1.25,
  forge: 1.3,
  array: 1.2,
  scripture: 1.15,
  leypulse: 1.1,
  spring: 1.15,
  bounty: 1.5,
  drill: 1.65,
};

/**
 * 升到 lv 级（含营造 Lv.1）该次的消耗：
 * wood = 8×系数×lv^1.45，ore = 6×系数×lv^1.4，stone = 12×系数×lv^1.35。
 */
export function upgradeCost(type, level) {
  const lv = Math.max(1, level);
  const scale = COST_SCALE[type] ?? 1;
  return {
    wood: Math.ceil(8 * scale * lv ** 1.45),
    ore: Math.ceil(6 * scale * lv ** 1.4),
    stone: Math.ceil(12 * scale * lv ** 1.35),
  };
}

export function buildCost(type) {
  return upgradeCost(type, 1);
}

/** 洞府仙居等级 → 其他建筑的等级上限与可用地块数（4 + 2×等级，满级 12 时 28 块）。 */
export function mansionCap(mansionLevel) {
  return {
    maxBuildingLevel: mansionLevel,
    plots: Math.min(GRID_SIZE * GRID_SIZE, 4 + mansionLevel * 2),
  };
}
