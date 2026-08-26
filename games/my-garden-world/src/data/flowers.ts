export type Season = "spring" | "summer" | "autumn" | "winter";
export type Rarity = 1 | 2 | 3 | 4 | 5;
export type GrowthStage = "empty" | "seeded" | "sprout" | "bud" | "bloom" | "wilt";

export interface FlowerDef {
  id: string;
  name: string;
  season: Season;
  rarity: Rarity;
  growMs: number;
  waterNeed: number;
  seedCost: number;
  harvestCoin: number;
  harvestExp: number;
  color: string;
  accent: string;
  lore: string;
  unlockLevel: number;
}

// 数值守则（probe 会抽查）：seedCost < harvestCoin × 1.15；growMs > 5000。
// 排列按四季分组，每季 6 种：1 廉价快花 / 2 中坚 / 1 季末稀有。
export const FLOWERS: FlowerDef[] = [
  // —— 春 ——
  { id: "daisy", name: "小雏菊", season: "spring", rarity: 1, growMs: 18_000, waterNeed: 1, seedCost: 8, harvestCoin: 14, harvestExp: 6, color: "#f4e7b5", accent: "#f2c14e", lore: "田埂边最先醒来的浅金。", unlockLevel: 1 },
  { id: "peach", name: "碧桃", season: "spring", rarity: 2, growMs: 28_000, waterNeed: 2, seedCost: 22, harvestCoin: 40, harvestExp: 12, color: "#ffb7c5", accent: "#e46a86", lore: "一夜东风，枝上尽是人面。", unlockLevel: 1 },
  { id: "orchid", name: "春兰", season: "spring", rarity: 3, growMs: 40_000, waterNeed: 2, seedCost: 48, harvestCoin: 90, harvestExp: 22, color: "#c9e4c5", accent: "#5c8a58", lore: "空谷幽香，不以无人而不芳。", unlockLevel: 3 },
  { id: "magnolia", name: "玉兰", season: "spring", rarity: 3, growMs: 42_000, waterNeed: 2, seedCost: 52, harvestCoin: 104, harvestExp: 24, color: "#f3ead7", accent: "#a97bb5", lore: "玉盏擎露，先花后叶。", unlockLevel: 5 },
  { id: "peony", name: "牡丹", season: "spring", rarity: 4, growMs: 55_000, waterNeed: 3, seedCost: 96, harvestCoin: 180, harvestExp: 40, color: "#f7cad0", accent: "#c23b55", lore: "国色天香，花中之王。", unlockLevel: 6 },
  { id: "dawn-begonia", name: "朝霞海棠", season: "spring", rarity: 5, growMs: 72_000, waterNeed: 3, seedCost: 170, harvestCoin: 340, harvestExp: 75, color: "#ffc4a3", accent: "#e35d6a", lore: "晨曦最早的一抹霞，被花萼接住了。", unlockLevel: 11 },
  // —— 夏 ——
  { id: "morning-glory", name: "牵牛花", season: "summer", rarity: 1, growMs: 16_000, waterNeed: 1, seedCost: 7, harvestCoin: 13, harvestExp: 5, color: "#aebfe9", accent: "#5566ad", lore: "顺着竹篱，一路爬进晨光里。", unlockLevel: 1 },
  { id: "jasmine", name: "茉莉", season: "summer", rarity: 2, growMs: 24_000, waterNeed: 2, seedCost: 20, harvestCoin: 38, harvestExp: 11, color: "#fffdf4", accent: "#e8d9a0", lore: "暮色里最先被闻见的白。", unlockLevel: 1 },
  { id: "sunflower", name: "金葵", season: "summer", rarity: 2, growMs: 26_000, waterNeed: 2, seedCost: 24, harvestCoin: 44, harvestExp: 13, color: "#ffd166", accent: "#e09f1f", lore: "朝阳所向，一园皆金。", unlockLevel: 2 },
  { id: "lotus", name: "并蒂莲", season: "summer", rarity: 3, growMs: 36_000, waterNeed: 3, seedCost: 52, harvestCoin: 100, harvestExp: 24, color: "#f6d5e0", accent: "#d46a8c", lore: "出淤泥而不染。", unlockLevel: 2 },
  { id: "waterlily", name: "睡莲", season: "summer", rarity: 4, growMs: 50_000, waterNeed: 3, seedCost: 88, harvestCoin: 170, harvestExp: 36, color: "#e4c1f9", accent: "#9b5de5", lore: "池光夏梦，花开便是月。", unlockLevel: 7 },
  { id: "flame-lotus", name: "焰火莲", season: "summer", rarity: 5, growMs: 68_000, waterNeed: 3, seedCost: 165, harvestCoin: 330, harvestExp: 72, color: "#ffb37a", accent: "#c73e1d", lore: "夏夜焰火落进池心，从此夜夜自明。", unlockLevel: 13 },
  // —— 秋 ——
  { id: "amaranth", name: "雁来红", season: "autumn", rarity: 1, growMs: 17_000, waterNeed: 1, seedCost: 8, harvestCoin: 15, harvestExp: 6, color: "#e6a08e", accent: "#a63c2e", lore: "北雁南飞时，叶尖最先染红。", unlockLevel: 2 },
  { id: "chrys", name: "秋菊", season: "autumn", rarity: 2, growMs: 22_000, waterNeed: 1, seedCost: 18, harvestCoin: 34, harvestExp: 10, color: "#f4a261", accent: "#c45c26", lore: "采菊东篱，悠然见山。", unlockLevel: 1 },
  { id: "osmanthus", name: "金桂", season: "autumn", rarity: 3, growMs: 34_000, waterNeed: 2, seedCost: 46, harvestCoin: 92, harvestExp: 22, color: "#f0d58c", accent: "#c9862a", lore: "吴刚斧下，人间便醉了。", unlockLevel: 3 },
  { id: "maple", name: "枫叶兰", season: "autumn", rarity: 3, growMs: 32_000, waterNeed: 2, seedCost: 44, harvestCoin: 88, harvestExp: 20, color: "#e76f51", accent: "#9b2226", lore: "霜降之后，红得更真。", unlockLevel: 4 },
  { id: "spider-lily", name: "彼岸花", season: "autumn", rarity: 4, growMs: 52_000, waterNeed: 2, seedCost: 92, harvestCoin: 176, harvestExp: 38, color: "#f25c54", accent: "#8d0801", lore: "花开不见叶，叶生不见花。", unlockLevel: 8 },
  { id: "star-tulip", name: "星辰郁金香", season: "autumn", rarity: 5, growMs: 70_000, waterNeed: 3, seedCost: 160, harvestCoin: 320, harvestExp: 70, color: "#7b2cbf", accent: "#3c096c", lore: "传闻花瓣里藏着一整片夜空。", unlockLevel: 10 },
  // —— 冬 ——
  { id: "winter-jasmine", name: "迎春", season: "winter", rarity: 1, growMs: 17_000, waterNeed: 1, seedCost: 8, harvestCoin: 15, harvestExp: 6, color: "#f9e784", accent: "#c8a028", lore: "雪未化尽，金铃先在墙头响了。", unlockLevel: 1 },
  { id: "narcissus", name: "水仙", season: "winter", rarity: 2, growMs: 20_000, waterNeed: 2, seedCost: 16, harvestCoin: 30, harvestExp: 9, color: "#fff1b8", accent: "#f4d35e", lore: "案头一盆，便是春信。", unlockLevel: 2 },
  { id: "camellia", name: "山茶", season: "winter", rarity: 3, growMs: 38_000, waterNeed: 2, seedCost: 50, harvestCoin: 96, harvestExp: 23, color: "#e63946", accent: "#6d1420", lore: "雪未消，她已开。", unlockLevel: 4 },
  { id: "plum", name: "墨梅", season: "winter", rarity: 4, growMs: 48_000, waterNeed: 1, seedCost: 90, harvestCoin: 175, harvestExp: 38, color: "#f8f4ef", accent: "#2b2b2b", lore: "零落成泥碾作尘，只有香如故。", unlockLevel: 5 },
  { id: "snow-lotus", name: "雪莲", season: "winter", rarity: 4, growMs: 54_000, waterNeed: 1, seedCost: 95, harvestCoin: 190, harvestExp: 41, color: "#eef4f8", accent: "#7fa8c9", lore: "生在崖上冰雪里，开成一朵慈悲。", unlockLevel: 9 },
  { id: "dream-rose", name: "梦幻玫瑰", season: "winter", rarity: 5, growMs: 75_000, waterNeed: 3, seedCost: 180, harvestCoin: 360, harvestExp: 80, color: "#ff4d6d", accent: "#6a040f", lore: "只在梦里开过一次的红。", unlockLevel: 12 },
];

export const FLOWER_MAP = Object.fromEntries(FLOWERS.map((f) => [f.id, f])) as Record<string, FlowerDef>;

export const STAGES: GrowthStage[] = ["empty", "seeded", "sprout", "bud", "bloom", "wilt"];

export function stageIndex(stage: GrowthStage): number {
  return STAGES.indexOf(stage);
}
