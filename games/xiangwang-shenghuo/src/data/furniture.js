/**
 * 家具：购买后直接摆放（不进背包），永久 +温馨。
 * cost 中 coin/pearl 走 resources，cloth/wool 走 inv（与 buildings 建造同一套扣费规则）。
 * 温馨阈值效果见 docs/GDD.md「家具与温馨」。
 * @typedef {{ id: string, name: string, room: "hall"|"kitchen"|"yard"|"guestroom", cost: Record<string, number>, warmth: number, unlockLevel: number, desc: string }} Furniture
 */

/** @type {Furniture[]} */
export const FURNITURE = [
  { id: "fur_bamboo_stool", name: "竹凳", room: "hall", cost: { coin: 30 }, warmth: 2, unlockLevel: 1, desc: "被坐得发亮的竹凳，吱呀一声就是招呼。" },
  { id: "fur_reed_mat", name: "苇席", room: "hall", cost: { coin: 45 }, warmth: 3, unlockLevel: 2, desc: "新编的苇席带着河边的青气。" },
  { id: "fur_clay_teaset", name: "粗陶茶具", room: "hall", cost: { coin: 60 }, warmth: 4, unlockLevel: 3, desc: "杯沿有点歪，倒茶却一滴不洒。" },
  { id: "fur_flower_bed", name: "篱边花坛", room: "yard", cost: { coin: 70 }, warmth: 4, unlockLevel: 5, desc: "沿着篱笆种一排，风一过就点头。" },
  { id: "fur_lantern_string", name: "红灯笼串", room: "yard", cost: { coin: 90 }, warmth: 5, unlockLevel: 6, desc: "天一擦黑就亮，照得院子像过节。" },
  { id: "fur_patch_curtain", name: "花布门帘", room: "hall", cost: { coin: 80, cloth: 1 }, warmth: 6, unlockLevel: 7, desc: "自家织的布拼的帘子，掀开有饭香。" },
  { id: "fur_wool_rug", name: "羊毛地毯", room: "guestroom", cost: { coin: 120, cloth: 1, wool: 2 }, warmth: 8, unlockLevel: 7, desc: "踩上去像踩在云上，客人都不想走。" },
  { id: "fur_stove_screen", name: "灶画屏风", room: "kitchen", cost: { coin: 160, cloth: 2 }, warmth: 9, unlockLevel: 8, desc: "画着丰收的屏风，挡油烟也挡不住香味。" },
  { id: "fur_swing_chair", name: "藤编摇椅", room: "yard", cost: { coin: 140, cloth: 1 }, warmth: 8, unlockLevel: 8, desc: "午后摇一摇，猫比人先占座。" },
  { id: "fur_pearl_chime", name: "珍珠风铃", room: "yard", cost: { coin: 150, pearl: 1 }, warmth: 10, unlockLevel: 9, desc: "风一吹叮咚响，像把日子摇出了声。" },
];

export const furnitureById = (id) => FURNITURE.find((f) => f.id === id);
