/** 藏经楼晋阶所需修业，与 scriptureXp 共用同一口径。 */
export function xpNeeded(profession) {
  return 20 + profession * 12;
}

/** 每秒修业速率；只有入驻建筑的弟子才吃到这份速率。 */
export function scriptureRate(state) {
  const halls = (state.buildings ?? []).filter((b) => b.type === "scripture");
  return halls.reduce((s, b) => s + 0.35 * (b.level ?? 1), 0);
}

export function scriptureXp(state, dtSec) {
  const rate = scriptureRate(state);
  if (!rate) return state.disciples;
  return (state.disciples ?? []).map((d) => {
    if (!d.buildingId) return d;
    const xp = (d.xp ?? 0) + rate * dtSec;
    if (xp < xpNeeded(d.profession)) return { ...d, xp };
    return { ...d, xp: 0, profession: d.profession + 1 };
  });
}
