/** @typedef {{ id: string, name: string, buildingId: string, feedId: string, productId: string, cycleMs: number, xp: number }} Animal */

/**
 * 冬季每次投喂多记两成饲料账，攒满 1 才真的多扣一份（确定性余数，
 * 即冬天每喂 5 次有 1 次吃 2 份；实现见 production.winterFeedCarry，已落地）。
 * production/index.js 目前持有同值本地常量，Round 3 收敛为从这里 import（Opus-2，见 GDD 契约表）。
 */
export const WINTER_FEED_SURCHARGE = 0.2;

/** @type {Animal[]} */
export const ANIMALS = [
  { id: "chicken", name: "鸡", buildingId: "coop", feedId: "chicken_feed", productId: "egg", cycleMs: 20_000, xp: 5 },
  { id: "sheep", name: "羊", buildingId: "sheepfold", feedId: "sheep_feed", productId: "wool", cycleMs: 28_000, xp: 7 },
  { id: "cow", name: "牛", buildingId: "barn", feedId: "cow_feed", productId: "milk", cycleMs: 32_000, xp: 8 },
];

export const animalByBuilding = (buildingId) => ANIMALS.find((a) => a.buildingId === buildingId);
