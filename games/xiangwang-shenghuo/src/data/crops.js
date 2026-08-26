/** @typedef {{ id: string, name: string, seasons: string[], growMs: number, seedCost: number, yieldId: string, yieldQty: number, xp: number }} Crop */

export const SEASONS = ["spring", "summer", "autumn", "winter"];

/** @type {Crop[]} */
export const CROPS = [
  { id: "rice", name: "水稻", seasons: ["spring", "summer"], growMs: 18_000, seedCost: 8, yieldId: "paddy", yieldQty: 2, xp: 6 },
  { id: "soy", name: "大豆", seasons: ["spring", "autumn"], growMs: 20_000, seedCost: 10, yieldId: "soybean", yieldQty: 2, xp: 7 },
  { id: "wheat", name: "小麦", seasons: ["spring", "autumn"], growMs: 16_000, seedCost: 7, yieldId: "wheat", yieldQty: 2, xp: 5 },
  { id: "corn", name: "玉米", seasons: ["summer"], growMs: 22_000, seedCost: 9, yieldId: "corn", yieldQty: 3, xp: 8 },
  { id: "cabbage", name: "白菜", seasons: ["autumn", "winter"], growMs: 14_000, seedCost: 6, yieldId: "cabbage", yieldQty: 2, xp: 4 },
  { id: "tomato", name: "番茄", seasons: ["summer"], growMs: 16_000, seedCost: 8, yieldId: "tomato", yieldQty: 3, xp: 6 },
  { id: "strawberry", name: "草莓", seasons: ["spring"], growMs: 24_000, seedCost: 14, yieldId: "strawberry", yieldQty: 3, xp: 10 },
  { id: "cane", name: "甘蔗", seasons: ["summer", "autumn"], growMs: 26_000, seedCost: 12, yieldId: "cane", yieldQty: 2, xp: 9 },
  { id: "cotton", name: "棉花", seasons: ["autumn"], growMs: 28_000, seedCost: 13, yieldId: "cotton", yieldQty: 2, xp: 9 },
  { id: "tea", name: "茶树", seasons: ["spring", "autumn"], growMs: 32_000, seedCost: 16, yieldId: "tea_leaf", yieldQty: 2, xp: 12 },
];

export const cropById = (id) => CROPS.find((c) => c.id === id);
