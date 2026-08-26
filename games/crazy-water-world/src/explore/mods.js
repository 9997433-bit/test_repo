// 探索三线读天气倍率的唯一入口。
// 世界侧每量子把 weatherMods() 的结果落成快照 state.world.mods（含船坞邻接省氧那类
// 建筑修正），探索直接消费它；架构禁止 explore import world/**，所以快照缺席时
// （裸夹具 / 旧档）就地按 data/weather.js 回退，绝不在这边抄第二份数值。
import { WEATHERS } from "../data/weather.js";

// 探索侧的失败码。前四个沿用 core/reasons.js 的码面（那张表归 world/core，
// 这里只引用字符串，不反向 import）；E_WEATHER（天气封锁）与 E_BUSY（这条线已经有一场
// 没收尾的活儿：人还在水下）是探索独有的两条。
export const EXPLORE_REASON = {
  REQUIRES_BUILDING: "E_REQUIRES_BUILDING",
  LOCKED: "E_LOCKED",
  UNKNOWN_TYPE: "E_UNKNOWN_TYPE",
  NOT_FOUND: "E_NOT_FOUND",
  WEATHER: "E_WEATHER",
  BUSY: "E_BUSY",
};

function num(v, fallback) {
  return Number.isFinite(v) ? v : fallback;
}

function weatherDef(state) {
  return WEATHERS[state?.world?.weather] || WEATHERS.clear;
}

/** 当前天气的派生倍率快照：优先 world.mods，没有就现取天气表。 */
export function exploreMods(state) {
  const mods = state?.world?.mods;
  return mods && typeof mods === "object" ? mods : weatherDef(state);
}

/** 读一条天气轴（字段名由数据表给，如 FISHING_RULES.weatherField）。 */
export function modOf(state, field, fallback = 1) {
  const snap = exploreMods(state);
  if (Number.isFinite(snap?.[field])) return snap[field];
  return num(weatherDef(state)[field], fallback);
}

/** 播报用的天气名，天气表改名不用改探索文案。 */
export function weatherLabel(state) {
  const snap = exploreMods(state);
  return snap?.name || weatherDef(state).name || "天气";
}
