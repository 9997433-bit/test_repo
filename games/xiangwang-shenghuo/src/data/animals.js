/** @typedef {{ id: string, name: string, buildingId: string, feedId: string, productId: string, cycleMs: number, xp: number }} Animal */

/** @type {Animal[]} */
export const ANIMALS = [
  { id: "chicken", name: "鸡", buildingId: "coop", feedId: "chicken_feed", productId: "egg", cycleMs: 20_000, xp: 5 },
  { id: "sheep", name: "羊", buildingId: "sheepfold", feedId: "sheep_feed", productId: "wool", cycleMs: 28_000, xp: 7 },
  { id: "cow", name: "牛", buildingId: "barn", feedId: "cow_feed", productId: "milk", cycleMs: 32_000, xp: 8 },
];

export const animalByBuilding = (buildingId) => ANIMALS.find((a) => a.buildingId === buildingId);
