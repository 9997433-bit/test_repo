/** @typedef {{ id: string, name: string, buildingId: string, inputs: Record<string, number>, outputId: string, outputQty: number, timeMs: number, unlockLevel: number }} Recipe */

/** @type {Recipe[]} */
export const RECIPES = [
  { id: "mill_rice", name: "碾米", buildingId: "mill", inputs: { paddy: 2 }, outputId: "rice", outputQty: 1, timeMs: 10_000, unlockLevel: 2 },
  { id: "mill_tofu", name: "磨豆腐", buildingId: "mill", inputs: { soybean: 2 }, outputId: "tofu", outputQty: 1, timeMs: 12_000, unlockLevel: 2 },
  { id: "mill_flour", name: "磨面", buildingId: "mill", inputs: { wheat: 2 }, outputId: "flour", outputQty: 1, timeMs: 10_000, unlockLevel: 3 },
  { id: "feed_chicken_simple", name: "粗糠鸡食", buildingId: "feedmill", inputs: { rice: 2 }, outputId: "chicken_feed", outputQty: 2, timeMs: 8_000, unlockLevel: 3 },
  { id: "feed_chicken", name: "鸡饲料", buildingId: "feedmill", inputs: { rice: 1, corn: 1 }, outputId: "chicken_feed", outputQty: 3, timeMs: 8_000, unlockLevel: 4 },
  { id: "feed_sheep", name: "羊饲料", buildingId: "feedmill", inputs: { rice: 1, wheat: 1 }, outputId: "sheep_feed", outputQty: 2, timeMs: 9_000, unlockLevel: 5 },
  { id: "feed_cow", name: "牛饲料", buildingId: "feedmill", inputs: { rice: 1, corn: 1, wheat: 1 }, outputId: "cow_feed", outputQty: 2, timeMs: 10_000, unlockLevel: 6 },
  { id: "sugar", name: "熬糖", buildingId: "sugarhouse", inputs: { cane: 2 }, outputId: "sugar", outputQty: 1, timeMs: 14_000, unlockLevel: 5 },
  { id: "sauce", name: "晒酱", buildingId: "saucehouse", inputs: { soybean: 2, chili: 1 }, outputId: "sauce", outputQty: 1, timeMs: 16_000, unlockLevel: 6 },
  { id: "cloth", name: "织布", buildingId: "weavery", inputs: { wool: 1, cotton: 1 }, outputId: "cloth", outputQty: 1, timeMs: 18_000, unlockLevel: 7 },
  { id: "soymilk", name: "豆奶", buildingId: "mill", inputs: { tofu: 1, milk: 1 }, outputId: "soymilk", outputQty: 1, timeMs: 12_000, unlockLevel: 8 },
  { id: "bread", name: "烤面包", buildingId: "kitchen", inputs: { flour: 1, egg: 1 }, outputId: "bread", outputQty: 1, timeMs: 11_000, unlockLevel: 4 },
  // ——— 厨房菜谱（呈现层数据见 dishes.js，温馨/幸福加成由 village.cook 接入）———
  { id: "dish_tomato_egg", name: "番茄炒蛋", buildingId: "kitchen", inputs: { tomato: 2, egg: 1 }, outputId: "tomato_egg", outputQty: 1, timeMs: 9_000, unlockLevel: 4 },
  { id: "dish_fried_rice", name: "蛋炒饭", buildingId: "kitchen", inputs: { rice: 1, egg: 1 }, outputId: "egg_fried_rice", outputQty: 1, timeMs: 10_000, unlockLevel: 4 },
  { id: "dish_cabbage_tofu", name: "白菜炖豆腐", buildingId: "kitchen", inputs: { cabbage: 2, tofu: 1 }, outputId: "cabbage_tofu", outputQty: 1, timeMs: 10_000, unlockLevel: 4 },
  { id: "dish_chili_tofu", name: "麻辣豆腐", buildingId: "kitchen", inputs: { tofu: 1, chili: 1 }, outputId: "chili_tofu", outputQty: 1, timeMs: 12_000, unlockLevel: 5 },
  { id: "dish_strawberry_cake", name: "草莓蛋糕", buildingId: "kitchen", inputs: { flour: 1, egg: 1, strawberry: 2, sugar: 1 }, outputId: "strawberry_cake", outputQty: 1, timeMs: 16_000, unlockLevel: 5 },
  { id: "dish_milk_tea", name: "暖手奶茶", buildingId: "kitchen", inputs: { milk: 1, tea_leaf: 1, sugar: 1 }, outputId: "milk_tea", outputQty: 1, timeMs: 12_000, unlockLevel: 6 },
  { id: "dish_sauce_noodles", name: "酱拌面", buildingId: "kitchen", inputs: { flour: 2, sauce: 1 }, outputId: "sauce_noodles", outputQty: 1, timeMs: 14_000, unlockLevel: 6 },
  { id: "dish_hotpot", name: "蘑菇屋暖锅", buildingId: "kitchen", inputs: { cabbage: 2, tofu: 1, egg: 1, chili: 1 }, outputId: "hotpot", outputQty: 1, timeMs: 20_000, unlockLevel: 8 },
];

export const recipeById = (id) => RECIPES.find((r) => r.id === id);
export const recipesByBuilding = (buildingId) => RECIPES.filter((r) => r.buildingId === buildingId);
