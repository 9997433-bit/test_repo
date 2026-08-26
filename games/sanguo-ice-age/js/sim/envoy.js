/** 使节馆：定期馈赠 + 互市。 */
import { ENVOY, RESOURCE_NAMES } from "../config.js";
import { storageCap, pushLog } from "./state.js";

export function envoyGift(state, events) {
  const lv = state.buildings.envoy;
  if (lv < 1) return;
  if (state.day % ENVOY.giftEveryDays !== 0) return;
  const cap = storageCap(state);
  const parts = [];
  for (const [res, per] of Object.entries(ENVOY.giftPerLevel)) {
    const amount = per * lv;
    state.resources[res] = Math.min(cap, state.resources[res] + amount);
    parts.push(`${RESOURCE_NAMES[res]}${amount}`);
  }
  pushLog(state, `诸侯遣使馈赠：${parts.join("、")}。`, "good");
  events.push({ type: "envoy-gift" });
}

export function trade(state, tradeId) {
  if (state.buildings.envoy < 1) return { ok: false, reason: "需要先建造使节馆" };
  const deal = ENVOY.trades.find((t) => t.id === tradeId);
  if (!deal) return { ok: false, reason: "未知交易" };
  for (const [res, amount] of Object.entries(deal.give)) {
    if (state.resources[res] < amount) {
      return { ok: false, reason: `${RESOURCE_NAMES[res]}不足（需 ${amount}）` };
    }
  }
  const cap = storageCap(state);
  for (const [res, amount] of Object.entries(deal.give)) state.resources[res] -= amount;
  for (const [res, amount] of Object.entries(deal.get)) {
    state.resources[res] = Math.min(cap, state.resources[res] + amount);
  }
  pushLog(state, `互市：${deal.name}。`, "good");
  return { ok: true };
}
