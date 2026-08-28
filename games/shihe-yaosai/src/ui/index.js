// 蚀核要塞 HUD 出口。唯一签名：mountHud(el) / syncHud(view, extras)。
// getHud / toast 是给 main.js 报告引擎信息的可选钩子，不是第二种调用形态。
export { mountHud, syncHud, getHud, toast, UI_EVENT, INPUT_EVENT, QUALITY_TIERS } from "./hud.js";
export { TOWER_ORDER, getTowerCatalog, towerIdByIndex, getMeta } from "./catalog.js";
