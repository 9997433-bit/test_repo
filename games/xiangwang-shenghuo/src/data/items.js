/**
 * 全物品基准价（金币/个）。唯一物价来源，禁止在别处硬编码。
 * 定价规则见 docs/GDD.md「物价总表」：
 * - 加工品价值 ≥ 原料价值之和（饲料与粗糠鸡食为文档化例外，利润在畜牧产物兑现）
 * - 心愿金币 ≈ 基准价 × 1.0–1.4（多物品心愿 1.6–1.8）
 * - 摊位售价 = 基准价 × STALL_MARKUP（village.stallSell 应接入 stallPrice）
 */
export const BASE_PRICES = {
  // 原粮
  paddy: 6,
  soybean: 8,
  wheat: 6,
  corn: 6,
  cabbage: 6,
  tomato: 5,
  strawberry: 9,
  cane: 9,
  cotton: 10,
  tea_leaf: 12,
  chili: 7,
  // 一级加工
  rice: 14,
  flour: 15,
  tofu: 22,
  sugar: 20,
  sauce: 30,
  // 饲料（有意低于合成平价，防倒卖，利润在畜牧端）
  chicken_feed: 6,
  sheep_feed: 9,
  cow_feed: 12,
  // 畜牧产物
  egg: 15,
  wool: 26,
  milk: 32,
  // 二级加工
  bread: 36,
  soymilk: 66,
  cloth: 60,
  // 厨房菜品
  tomato_egg: 30,
  egg_fried_rice: 34,
  cabbage_tofu: 40,
  chili_tofu: 35,
  strawberry_cake: 82,
  milk_tea: 78,
  sauce_noodles: 74,
  hotpot: 84,
};

export const STALL_MARKUP = 1.15;

export const priceOf = (id) => BASE_PRICES[id] ?? 0;

export const stallPrice = (id, qty = 1) => Math.round(priceOf(id) * qty * STALL_MARKUP);
