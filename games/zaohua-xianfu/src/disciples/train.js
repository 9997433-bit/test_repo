export function scriptureXp(state, dtSec) {
  const halls = (state.buildings ?? []).filter((b) => b.type === "scripture");
  if (!halls.length) return state.disciples;
  const rate = halls.reduce((s, b) => s + 0.35 * (b.level ?? 1), 0);
  return (state.disciples ?? []).map((d) => {
    if (!d.buildingId) return d;
    const xp = (d.xp ?? 0) + rate * dtSec;
    if (xp < 20 + d.profession * 12) return { ...d, xp };
    return { ...d, xp: 0, profession: d.profession + 1 };
  });
}
