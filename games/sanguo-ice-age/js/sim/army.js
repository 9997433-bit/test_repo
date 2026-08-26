/** 练兵：受兵营编制上限约束，消耗资源。 */
import { ARMY, TROOP_NAMES, RESOURCE_NAMES } from "../config.js";
import { troopCap, pushLog } from "./state.js";

export function trainCost(type, count) {
  const per = ARMY.costs[type];
  const out = {};
  for (const [res, amount] of Object.entries(per)) out[res] = Math.ceil(amount * count);
  return out;
}

export function maxTrainable(state, type) {
  const room = Math.max(0, troopCap(state, type) - state.army[type]);
  if (room === 0) return 0;
  let byRes = Infinity;
  for (const [res, per] of Object.entries(ARMY.costs[type])) {
    if (per <= 0) continue;
    byRes = Math.min(byRes, Math.floor(state.resources[res] / per));
  }
  return Math.max(0, Math.min(room, byRes));
}

export function train(state, type, count) {
  if (!ARMY.costs[type]) return { ok: false, reason: "未知兵种" };
  if (count <= 0) return { ok: false, reason: "数量无效" };
  const cap = troopCap(state, type);
  if (cap === 0) return { ok: false, reason: `需要先建造${TROOP_NAMES[type]}营` };
  if (state.army[type] + count > cap) return { ok: false, reason: `编制不足（上限 ${cap}）` };
  const cost = trainCost(type, count);
  for (const [res, amount] of Object.entries(cost)) {
    if (state.resources[res] < amount) {
      return { ok: false, reason: `${RESOURCE_NAMES[res]}不足（需 ${amount}）` };
    }
  }
  for (const [res, amount] of Object.entries(cost)) state.resources[res] -= amount;
  state.army[type] += count;
  state.stats.trained += count;
  pushLog(state, `征募${TROOP_NAMES[type]} ×${count}（现有 ${state.army[type]}）。`, "army");
  return { ok: true };
}
