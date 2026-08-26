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

export function renderHud(state) {
  if (!state.meta.faction) return "";
  return RES.map(([k, label]) => `<span>${label} <b>${fmt(state.resources[k])}</b></span>`).join("");
}
