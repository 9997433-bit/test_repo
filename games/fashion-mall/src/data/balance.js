export const TICK_MS = 250;

export const LEVEL_INCOME_GATES = [0, 800, 4000, 20000, 100000, 600000, 3000000];
export const LEVEL_XP_GATES = [0, 20, 60, 140, 300, 620, 1280];

export const SHOPS = [
  {
    id: "fastfood",
    name: "星光快餐",
    specialty: "休闲",
    unlockLevel: 1,
    base: 12,
    growth: 1.18,
    staffSlots: 3,
    color: "#ffb4c8",
    emoji: "🍔",
    blurb: "从热油与番茄酱开始的第一桶金",
  },
  {
    id: "fresh",
    name: "晨光生鲜",
    specialty: "购物",
    unlockLevel: 2,
    base: 22,
    growth: 1.2,
    staffSlots: 3,
    color: "#9be7c4",
    emoji: "🥬",
    blurb: "接住当季，货架就会自己唱歌",
  },
  {
    id: "boutique",
    name: "缪斯服装",
    specialty: "丽人",
    unlockLevel: 3,
    base: 36,
    growth: 1.22,
    staffSlots: 4,
    color: "#e8c37a",
    emoji: "👗",
    blurb: "把顾客脑中的灵感画成一套衣服",
  },
  {
    id: "blindbox",
    name: "盲盒潮玩",
    specialty: "娱乐",
    unlockLevel: 4,
    base: 48,
    growth: 1.23,
    staffSlots: 3,
    color: "#c9b6ff",
    emoji: "🎁",
    blurb: "隐藏款会改变整层楼的排队曲线",
  },
  {
    id: "fortune",
    name: "星语占卜",
    specialty: "娱乐",
    unlockLevel: 5,
    base: 64,
    growth: 1.24,
    staffSlots: 2,
    color: "#9ad4ff",
    emoji: "🔮",
    blurb: "通关转盘可兑换招募碎片",
  },
];

export const PARTNERS = [
  { id: "lin", name: "林澄", specialty: "休闲", title: "金牌店长", story: "把翻台率做成了艺术。" },
  { id: "su", name: "苏晚", specialty: "购物", title: "买手总监", story: "只选会自己走路的货。" },
  { id: "ye", name: "叶织", specialty: "丽人", title: "天才设计师", story: "素描本里藏着下季流行。" },
  { id: "jo", name: "周漾", specialty: "娱乐", title: "营销操盘", story: "一条短视频顶一周广告。" },
  { id: "an", name: "安祈", specialty: "娱乐", title: "占卜顾问", story: "她从不剧透结局，只抬客单价。" },
  { id: "kai", name: "江澄乐", specialty: "丽人", title: "偶像代言", story: "签约后整座城都在讨论橱窗。" },
];

export const OUTFITS = {
  hair: [
    { id: "bob", name: "杏核短发", charm: 8 },
    { id: "long", name: "蜜茶长卷", charm: 12 },
    { id: "high", name: "星钻高马尾", charm: 16 },
  ],
  top: [
    { id: "tee", name: "奶油针织", charm: 6 },
    { id: "blazer", name: "玫瑰西装", charm: 14 },
    { id: "gown", name: "香槟晚礼服", charm: 22 },
  ],
  bottom: [
    { id: "skirt", name: "百褶短裙", charm: 7 },
    { id: "slacks", name: "燕麦西裤", charm: 11 },
    { id: "silk", name: "流光长裙", charm: 18 },
  ],
  shoes: [
    { id: "sneaker", name: "云朵板鞋", charm: 5 },
    { id: "heel", name: "细闪高跟", charm: 13 },
    { id: "boot", name: "法式短靴", charm: 10 },
  ],
  acc: [
    { id: "none", name: "素颜出门", charm: 0 },
    { id: "pearl", name: "珍珠耳钉", charm: 9 },
    { id: "crown", name: "时代细冠", charm: 20 },
  ],
};

export const FURNITURE = [
  { id: "sofa", name: "复古丝绒沙发", bonus: 0.06, room: "living" },
  { id: "lamp", name: "琥珀落地灯", bonus: 0.03, room: "living" },
  { id: "vanity", name: "贝壳梳妆台", bonus: 0.05, room: "studio" },
  { id: "piano", name: "奶油三角琴", bonus: 0.08, room: "studio" },
  { id: "tub", name: "玫瑰金浴缸", bonus: 0.07, room: "spa" },
  { id: "garden", name: "空中花房", bonus: 0.1, room: "spa" },
];

export const RESEARCH_NODES = [
  { id: "line-a", name: "中央厨房流水线", cost: 400, income: 8 },
  { id: "line-b", name: "冷链分拣", cost: 1800, income: 22 },
  { id: "line-c", name: "联名包装厂", cost: 9000, income: 70 },
  { id: "line-d", name: "城市配送枢纽", cost: 42000, income: 210 },
];

export function shopRate(shop, level, staffFilled, partnerBonus, charm) {
  const safeLevel = Math.max(1, level);
  return (
    shop.base *
    shop.growth ** (safeLevel - 1) *
    (1 + staffFilled * 0.12) *
    (1 + partnerBonus) *
    (1 + charm * 0.002)
  );
}

export function offlineGold(onlinePerSec, hoursAway, furnitureBonus) {
  const capped = Math.min(Math.max(hoursAway, 0), 8);
  return onlinePerSec * 0.65 * capped * 3600 * (1 + furnitureBonus);
}

export function partnerShopBonus(partnerSpecialty, shopSpecialty, partnerLevel) {
  const match = partnerSpecialty === shopSpecialty ? 0.6 : 0.15;
  return match * (1 + (partnerLevel - 1) * 0.08);
}

export function nextLevelReady(level, goldEarned, xp) {
  const next = level;
  if (next >= LEVEL_INCOME_GATES.length) return false;
  return goldEarned >= LEVEL_INCOME_GATES[next] && xp >= LEVEL_XP_GATES[next];
}
