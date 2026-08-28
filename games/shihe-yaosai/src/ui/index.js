// Opus-4 HUD —— 对外只暴露 mountHud / syncHud，其余是给 main.js 的可选钩子。
export { mountHud, syncHud, getHud, toast, UI_EVENT, INPUT_EVENT, QUALITY_TIERS } from "./hud.js";
export { TOWER_ORDER, getTowerCatalog, towerIdByIndex, getMeta } from "./catalog.js";
