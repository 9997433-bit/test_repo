/** @typedef {{ id: string, name: string, kind: string, unlockLevel: number, cost: Record<string, number>, popNeed?: number, slots?: number }} BuildingDef */

/** @type {BuildingDef[]} */
export const BUILDINGS = [
  { id: "mushroom", name: "蘑菇屋", kind: "hub", unlockLevel: 1, cost: {} },
  { id: "wish", name: "心愿屋", kind: "orders", unlockLevel: 1, cost: {} },
  { id: "mill", name: "磨坊", kind: "factory", unlockLevel: 2, cost: { coin: 80, axe: 1 }, slots: 2 },
  { id: "feedmill", name: "饲料厂", kind: "factory", unlockLevel: 3, cost: { coin: 120, saw: 1 }, slots: 3 },
  { id: "coop", name: "鸡舍", kind: "livestock", unlockLevel: 3, cost: { coin: 100, shovel: 1 }, slots: 3 },
  { id: "kitchen", name: "厨房", kind: "cook", unlockLevel: 4, cost: { coin: 140 }, slots: 2 },
  { id: "sheepfold", name: "羊圈", kind: "livestock", unlockLevel: 5, cost: { coin: 180, axe: 1 }, slots: 3 },
  { id: "sugarhouse", name: "制糖坊", kind: "factory", unlockLevel: 5, cost: { coin: 160, saw: 1 }, slots: 2 },
  { id: "community", name: "社区", kind: "cap", unlockLevel: 5, cost: { coin: 200, saw: 1, axe: 1 } },
  { id: "barn", name: "牛棚", kind: "livestock", unlockLevel: 6, cost: { coin: 240, shovel: 1, axe: 1 }, slots: 3 },
  { id: "saucehouse", name: "酱料坊", kind: "factory", unlockLevel: 6, cost: { coin: 200, saw: 1 }, slots: 2 },
  { id: "house", name: "民居", kind: "pop", unlockLevel: 6, cost: { coin: 90, shovel: 1 } },
  { id: "weavery", name: "布行", kind: "factory", unlockLevel: 7, cost: { coin: 260, saw: 1, axe: 1 }, slots: 2 },
  { id: "petyard", name: "宠物院", kind: "pets", unlockLevel: 7, cost: { coin: 150 } },
  { id: "stall", name: "摊位", kind: "trade", unlockLevel: 7, cost: { coin: 120 } },
  { id: "greenhouse", name: "温室", kind: "farm", unlockLevel: 8, cost: { coin: 320, saw: 2 } },
  { id: "guestroom", name: "客房", kind: "guest", unlockLevel: 9, cost: { coin: 280, cloth: 2 } },
  { id: "dock", name: "货运码头", kind: "freight", unlockLevel: 9, cost: { coin: 360, saw: 2, axe: 1 } },
  { id: "plaza", name: "节日广场", kind: "festival", unlockLevel: 10, cost: { coin: 500, pearl: 3 } },
];

export const buildingById = (id) => BUILDINGS.find((b) => b.id === id);
