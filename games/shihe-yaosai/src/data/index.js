// 蚀核要塞 · 数据总出口（Fable-3，Round 2）
// 纯数据 + 纯函数，禁止 import Babylon / DOM；sim / tests / scripts 直接 import 本文件。
// Round 2 冻结：以下即全部正式导出名，sim 只读这些名字；禁止再加兼容别名（SIM_CONFIG 等）。

export { CONFIG } from "./config.js";
// ARMOR_INFO 不是别名：护甲中文名 + 克制提示文案，HUD/图鉴用。
export { ARMOR_TYPES, ARMOR_INFO, ARMOR_MULT, armorMultiplier } from "./armor.js";
export { TOWERS, TOWER_ORDER, towerCost, upgradeOptions } from "./towers.js";
export { ENEMIES } from "./enemies.js";
export { WAVES, BOSS } from "./waves.js";
