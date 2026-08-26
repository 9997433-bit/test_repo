/**
 * 菜品呈现层数据：配方本体在 recipes.js（buildingId === "kitchen"）。
 * warmth / happiness 为「上桌」时的加成，替代 village.cook 现有的固定 +6/+3（Round 2 接入契约）；
 * 嘉宾最爱命中另加温馨 +8（沿用现行为）。黑暗料理判定（8%）不变。
 * @typedef {{ id: string, recipeId: string, outputId: string, name: string, warmth: number, happiness: number, desc: string }} Dish
 */

/** @type {Dish[]} */
export const DISHES = [
  { id: "bread", recipeId: "bread", outputId: "bread", name: "烤面包", warmth: 5, happiness: 2, desc: "灶膛里烤出焦壳，掰开还冒热气。" },
  { id: "dish_tomato_egg", recipeId: "dish_tomato_egg", outputId: "tomato_egg", name: "番茄炒蛋", warmth: 5, happiness: 2, desc: "红黄一锅，是谁都挑不出错的一道菜。" },
  { id: "dish_fried_rice", recipeId: "dish_fried_rice", outputId: "egg_fried_rice", name: "蛋炒饭", warmth: 5, happiness: 2, desc: "隔夜饭的最好归宿，粒粒分明。" },
  { id: "dish_cabbage_tofu", recipeId: "dish_cabbage_tofu", outputId: "cabbage_tofu", name: "白菜炖豆腐", warmth: 6, happiness: 2, desc: "咕嘟到入味，冬天就靠它撑着。" },
  { id: "dish_chili_tofu", recipeId: "dish_chili_tofu", outputId: "chili_tofu", name: "麻辣豆腐", warmth: 6, happiness: 3, desc: "辣得直吸气，筷子却停不下来。" },
  { id: "dish_strawberry_cake", recipeId: "dish_strawberry_cake", outputId: "strawberry_cake", name: "草莓蛋糕", warmth: 9, happiness: 4, desc: "春天摘的草莓，摆成一圈小灯笼。" },
  { id: "dish_milk_tea", recipeId: "dish_milk_tea", outputId: "milk_tea", name: "暖手奶茶", warmth: 8, happiness: 3, desc: "捧在手里先暖手，喝下去再暖心。" },
  { id: "dish_sauce_noodles", recipeId: "dish_sauce_noodles", outputId: "sauce_noodles", name: "酱拌面", warmth: 8, happiness: 3, desc: "自家晒的酱，一勺就够香半条巷子。" },
  { id: "dish_hotpot", recipeId: "dish_hotpot", outputId: "hotpot", name: "蘑菇屋暖锅", warmth: 12, happiness: 5, desc: "一锅端上桌，谁来了都得添双筷子。" },
];

export const dishById = (id) => DISHES.find((d) => d.id === id);
export const dishByRecipe = (recipeId) => DISHES.find((d) => d.recipeId === recipeId);
export const dishByOutput = (outputId) => DISHES.find((d) => d.outputId === outputId);
