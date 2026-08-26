/** 建筑升级：火炉等级 = 其他建筑等级上限。 */
import { BUILDINGS, buildingCost } from "../data/buildings.js";
import { RESOURCE_NAMES } from "../config.js";
import { pushLog } from "./state.js";

export function nextCost(state, id) {
  return buildingCost(BUILDINGS[id], state.buildings[id]);
}

/** 返回 { ok, reason }。 */
export function canUpgrade(state, id) {
  const def = BUILDINGS[id];
  if (!def) return { ok: false, reason: "未知建筑" };
  const lv = state.buildings[id];
  if (lv >= def.maxLevel) return { ok: false, reason: "已达最高等级" };
  const furnace = state.buildings.furnace;
  if (id !== "furnace") {
    if (furnace < def.unlockFurnace) return { ok: false, reason: `需火炉 ${def.unlockFurnace} 级解锁` };
    if (lv >= furnace) return { ok: false, reason: `受火炉限制（火炉 ${furnace} 级）` };
  }
  const cost = nextCost(state, id);
  if (!cost) return { ok: false, reason: "已达最高等级" };
  for (const [res, amount] of Object.entries(cost)) {
    if (state.resources[res] < amount) {
      return { ok: false, reason: `${RESOURCE_NAMES[res]}不足（需 ${amount}）` };
    }
  }
  return { ok: true, reason: "" };
}

export function upgrade(state, id) {
  const check = canUpgrade(state, id);
  if (!check.ok) return check;
  const cost = nextCost(state, id);
  for (const [res, amount] of Object.entries(cost)) state.resources[res] -= amount;
  state.buildings[id] += 1;
  const def = BUILDINGS[id];
  const lv = state.buildings[id];
  pushLog(state, `${def.name}升至 ${lv} 级。`, "build");
  return { ok: true, level: lv };
}
