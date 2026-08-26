/**
 * 心愿池。奖励口径见 docs/GDD.md「心愿屋」铁律 5（Round 2 收紧，全表无特例）：
 * coin ∈ 需求基准价合计 × [1.0, 1.8]（单品目标 1.0–1.45，多物品/引导 1.6–1.8）；
 * xp ∈ coin × [0.35, 0.6]。w_veg 已从 2.33× 校准到 1.67×。
 * minLevel/maxLevel：village.wishCandidates 已双向过滤（Round 2 落地）；
 * Lv.1 池 = 晒谷/一棵白菜/泡豆子/两把麦子，全部出自 Lv.1 春季可种作物（白菜含春，见 crops.js）。
 * 前 9 条为既有条目，顺序与 id 不可变（refreshWishes 按下标取单），扩充只许追加。
 */
export const WISH_POOL = [
  { id: "w_paddy", name: "晒谷", needs: { paddy: 2 }, coin: 18, xp: 10, minLevel: 1, maxLevel: 99 },
  { id: "w_veg", name: "一棵白菜", needs: { cabbage: 1 }, coin: 10, xp: 5, minLevel: 1, maxLevel: 99 },
  { id: "w_rice", name: "黄米饭", needs: { rice: 2 }, coin: 28, xp: 12, minLevel: 2, maxLevel: 99 },
  { id: "w_egg", name: "荷包蛋", needs: { egg: 2 }, coin: 36, xp: 16, minLevel: 3, maxLevel: 99 },
  { id: "w_tofu", name: "嫩豆腐", needs: { tofu: 1 }, coin: 32, xp: 14, minLevel: 2, maxLevel: 99 },
  { id: "w_bread", name: "早饭面包", needs: { bread: 1 }, coin: 48, xp: 20, minLevel: 4, maxLevel: 99 },
  { id: "w_milk", name: "热牛奶", needs: { milk: 1 }, coin: 44, xp: 18, minLevel: 6, maxLevel: 99 },
  { id: "w_cloth", name: "新围巾", needs: { cloth: 1 }, coin: 80, xp: 30, minLevel: 7, maxLevel: 99 },
  { id: "w_combo", name: "一桌家常", needs: { rice: 1, tofu: 1, egg: 1 }, coin: 90, xp: 36, minLevel: 3, maxLevel: 99 },
  // ——— 以下为 Round 1 扩充，只允许追加，不得插入或重排 ———
  { id: "w_soy", name: "泡豆子", needs: { soybean: 2 }, coin: 21, xp: 9, minLevel: 1, maxLevel: 99 },
  { id: "w_wheat", name: "两把麦子", needs: { wheat: 2 }, coin: 16, xp: 7, minLevel: 1, maxLevel: 99 },
  { id: "w_corn", name: "掰玉米", needs: { corn: 3 }, coin: 24, xp: 10, minLevel: 3, maxLevel: 99 },
  { id: "w_tomato", name: "熟透的番茄", needs: { tomato: 3 }, coin: 20, xp: 8, minLevel: 2, maxLevel: 99 },
  { id: "w_berry", name: "草莓一捧", needs: { strawberry: 3 }, coin: 36, xp: 15, minLevel: 3, maxLevel: 99 },
  { id: "w_chili", name: "晒辣椒", needs: { chili: 2 }, coin: 19, xp: 8, minLevel: 2, maxLevel: 99 },
  { id: "w_tea", name: "明前茶", needs: { tea_leaf: 2 }, coin: 32, xp: 13, minLevel: 5, maxLevel: 99 },
  { id: "w_flour", name: "两袋面粉", needs: { flour: 2 }, coin: 38, xp: 16, minLevel: 3, maxLevel: 99 },
  { id: "w_sugar", name: "一罐红糖", needs: { sugar: 1 }, coin: 27, xp: 11, minLevel: 5, maxLevel: 99 },
  { id: "w_sauce", name: "打酱", needs: { sauce: 1 }, coin: 40, xp: 17, minLevel: 6, maxLevel: 99 },
  { id: "w_wool", name: "剪羊毛", needs: { wool: 2 }, coin: 68, xp: 28, minLevel: 5, maxLevel: 99 },
  { id: "w_soymilk", name: "一壶豆奶", needs: { soymilk: 1 }, coin: 88, xp: 36, minLevel: 8, maxLevel: 99 },
  { id: "w_tomato_egg", name: "下饭番茄炒蛋", needs: { tomato_egg: 1 }, coin: 42, xp: 17, minLevel: 4, maxLevel: 99 },
  { id: "w_fried_rice", name: "一碗蛋炒饭", needs: { egg_fried_rice: 1 }, coin: 46, xp: 19, minLevel: 4, maxLevel: 99 },
  { id: "w_cabbage_tofu", name: "热汤暖胃", needs: { cabbage_tofu: 1 }, coin: 54, xp: 22, minLevel: 4, maxLevel: 99 },
  { id: "w_chili_tofu", name: "开胃麻辣豆腐", needs: { chili_tofu: 1 }, coin: 47, xp: 19, minLevel: 5, maxLevel: 99 },
  { id: "w_cake", name: "生日蛋糕", needs: { strawberry_cake: 1 }, coin: 106, xp: 42, minLevel: 5, maxLevel: 99 },
  { id: "w_milk_tea", name: "赶集前的奶茶", needs: { milk_tea: 1 }, coin: 100, xp: 40, minLevel: 6, maxLevel: 99 },
  { id: "w_noodles", name: "长寿酱拌面", needs: { sauce_noodles: 1 }, coin: 96, xp: 38, minLevel: 6, maxLevel: 99 },
  { id: "w_hotpot", name: "全村的暖锅", needs: { hotpot: 1 }, coin: 118, xp: 47, minLevel: 8, maxLevel: 99 },
  { id: "w_feast", name: "招待远客", needs: { bread: 1, milk: 1, tomato_egg: 1 }, coin: 162, xp: 65, minLevel: 6, maxLevel: 99 },
];

/* --------------------------------------------- 心愿屋节奏与掉落（数值事实源，Round 2 校准） */

/** 心愿补位间隔：120 游戏分钟 = 2 游戏时（灯哥在座 ×0.85 ≈ 102 分钟）。API_CONTRACT §5.1/§9。 */
export const WISH_REFRESH_MIN = 120;

/**
 * 工具基础掉率（Round 2：0.35 → 0.25，Opus-3 接线）。
 * 量算见 GDD「工具经济」：通关约交 70–90 单，0.25 + 保底后有效掉率 ≈ 0.29，
 * 期望 23–29 件，对上全程工具汇 ≈ 28 件（锹 10 / 锯 12 / 斧 6）；
 * 0.35 会多掉三成、后期刷爆，且旧权重给斧 0.35 远超其 6 件总需求。
 */
export const WISH_TOOL_DROP = 0.25;

/** 珍珠掉率：终局节日广场（3）+ 珍珠风铃（1）≈ 需 4 颗，全程期望 3–4 颗，保持紧俏。 */
export const WISH_PEARL_DROP = 0.04;

/** 掉落权重按全程需求比（锹 10 : 锯 12 : 斧 6，锯含温室田改造 ×3；锹的溢出由开田吸收）。 */
export const TOOL_DROP_WEIGHTS = [
  ["shovel", 0.4],
  ["saw", 0.35],
  ["axe", 0.25],
];

/**
 * 保底 = 正规工具来源，取代「开局白送斧锯」的 UI 权宜：
 * 1) 新档前 3 次交单按序必掉 斧 → 锯 → 锹（解锁 L2 磨坊 / L3 饲料厂 / L3 鸡舍）；
 * 2) 此后连续 TOOL_PITY_DROUGHT 次未掉工具，下一单必掉（按权重取）。
 * 配套开局资源 锹×1 / 斧×0 / 锯×0（engine 契约，Opus-4）。
 */
export const TOOL_PITY_ORDER = ["axe", "saw", "shovel"];
export const TOOL_PITY_DROUGHT = 6;

/** 覆盖所有可进背包/心愿需求/资源栏的 id；家具名在 furniture.js 内。 */
export const ITEM_NAMES = {
  coin: "金币",
  xp: "经验",
  pearl: "珍珠",
  happiness: "幸福",
  warmth: "温馨",
  pop: "人口",
  popCap: "人口上限",
  shovel: "铁锹",
  axe: "斧子",
  saw: "锯子",
  paddy: "稻谷",
  rice: "大米",
  soybean: "大豆",
  tofu: "豆腐",
  wheat: "小麦",
  flour: "面粉",
  corn: "玉米",
  cabbage: "白菜",
  tomato: "番茄",
  strawberry: "草莓",
  cane: "甘蔗",
  sugar: "糖",
  cotton: "棉花",
  tea_leaf: "茶叶",
  chili: "辣椒",
  sauce: "酱",
  chicken_feed: "鸡饲料",
  sheep_feed: "羊饲料",
  cow_feed: "牛饲料",
  egg: "鸡蛋",
  wool: "羊毛",
  milk: "牛奶",
  cloth: "布",
  soymilk: "豆奶",
  bread: "面包",
  tomato_egg: "番茄炒蛋",
  egg_fried_rice: "蛋炒饭",
  cabbage_tofu: "白菜炖豆腐",
  chili_tofu: "麻辣豆腐",
  strawberry_cake: "草莓蛋糕",
  milk_tea: "暖手奶茶",
  sauce_noodles: "酱拌面",
  hotpot: "蘑菇屋暖锅",
};
