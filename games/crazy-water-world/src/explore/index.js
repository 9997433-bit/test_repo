import { syncFishingWeather } from "./fishing.js";
import { syncDiveWeather } from "./dive.js";

export {
  spawnFlotsam,
  collectFlotsam,
  collectFlotsamAt,
  hitTestFlotsam,
  flotsamLayout,
  flotsamScreenPos,
  flotsamRadius,
  salvageBonus,
  salvageSummary,
  weatherSalvageMul,
  FLOTSAM_KINDS,
  FLOTSAM_VIEW,
} from "./salvage.js";
export {
  castLine,
  canCast,
  resolveHook,
  beginCast,
  hookCast,
  gradeCast,
  castCursor,
  fishingPool,
  fishingMul,
  fishingHud,
  fishCodex,
  syncFishingWeather,
  GRADES,
} from "./fishing.js";
export {
  startDive,
  canDive,
  diveZones,
  diveStep,
  finishDive,
  beginDive,
  advanceDive,
  diveHud,
  diveO2Mul,
  syncDiveWeather,
  DIVE_ZONES,
  DIVE_RULES,
  DEFAULT_ZONE,
} from "./dive.js";
export { EXPLORE_REASON, exploreMods, modOf } from "./mods.js";

/**
 * 天气巡检总入口：海啸（fishing / diveO2 = 0）时强制收杆并把潜水员捞上来。
 * 两条线都没受影响就返回原引用，可以每量子无脑调用。
 */
export function syncExploreWeather(state) {
  const reeled = syncFishingWeather(state);
  return syncDiveWeather(reeled);
}
