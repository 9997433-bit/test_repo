import * as mansion from "./adapters.js";

const RES = [
  ["qi", "灵气"],
  ["stone", "灵石"],
  ["herb", "灵草"],
  ["wood", "灵木"],
  ["ore", "灵矿"],
  ["pills", "丹药"],
  ["jade", "仙玉"],
];

export function fmt(n) {
  const v = Number(n) || 0;
  if (v >= 1e6) return `${(v / 1e6).toFixed(2)}M`;
  if (v >= 1e4) return `${(v / 1e4).toFixed(2)}万`;
  return v.toFixed(v >= 10 ? 0 : 1);
}

/** 速率常在小数点后打转，仙玉这类慢产要多留一位。 */
export function fmtRate(n) {
  const v = Number(n) || 0;
  if (v >= 10) return v.toFixed(0);
  if (v >= 0.1) return v.toFixed(2);
  return v.toFixed(3);
}

export function renderHud(state) {
  if (!state.meta.faction) return "";
  const rates = mansion.rates(state) ?? {};
  return RES.map(([k, label]) => {
    const rate = rates[k] ?? 0;
    const perSec = rate > 0.0005 ? `${fmtRate(rate)}/秒` : "无产出";
    return `<span title="${label} · ${perSec}">${label} <b>${fmt(state.resources[k])}</b>${
      rate > 0.0005 ? `<i class="rate">+${fmtRate(rate)}/秒</i>` : ""
    }</span>`;
  }).join("");
}
