export const BUILDING_TYPES = {
  mansion: {
    id: "mansion",
    name: "洞府仙居",
    glyph: "府",
    desc: "决定建筑等级上限与地块数",
    unique: true,
    baseYield: { stone: 0.35 },
    unlockAt: 1,
  },
  field: {
    id: "field",
    name: "灵田",
    glyph: "田",
    desc: "产灵草；邻接灵脉产量大增",
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
    desc: "炼丹药，提高全队攻击",
    baseYield: { pills: 0.12 },
    combatBonus: { atk: 4 },
    unlockAt: 2,
  },
  forge: {
    id: "forge",
    name: "锻造房",
    glyph: "锻",
    desc: "温养法器，缓慢产出仙玉碎",
    baseYield: { jade: 0.04 },
    combatBonus: { atk: 3 },
    unlockAt: 2,
  },
  array: {
    id: "array",
    name: "聚灵阵",
    glyph: "阵",
    desc: "灵气回复与离线效率",
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
    desc: "环绕灵田：每条邻接 +15% 产量",
    baseYield: { qi: 0.12 },
    adjacency: 0.15,
    unlockAt: 2,
  },
};

export const GRID_SIZE = 6;

export function upgradeCost(type, level) {
  const lv = Math.max(1, level);
  const scale = {
    mansion: 1.35,
    field: 1.0,
    woodcut: 1.0,
    quarry: 1.05,
    alchemy: 1.25,
    forge: 1.3,
    array: 1.2,
    scripture: 1.15,
    leypulse: 1.1,
  }[type] ?? 1;
  return {
    wood: Math.ceil(8 * scale * lv ** 1.45),
    ore: Math.ceil(6 * scale * lv ** 1.4),
    stone: Math.ceil(12 * scale * lv ** 1.35),
  };
}

export function buildCost(type) {
  return upgradeCost(type, 1);
}

export function mansionCap(mansionLevel) {
  return {
    maxBuildingLevel: mansionLevel,
    plots: Math.min(GRID_SIZE * GRID_SIZE, 4 + mansionLevel * 2),
  };
}
