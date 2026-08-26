import { HEROES } from "../data/heroes.js";

export function recruit(state, heroKey) {
  const def = HEROES[heroKey];
  if (!def) return state;
  if (state.heroes.some((h) => h.heroKey === heroKey)) return state;
  if (!state.buildings.some((b) => b.type === "radio") && state.heroes.length > 0) return state;
  const id = `h-${heroKey}`;
  return {
    ...state,
    heroes: [
      ...state.heroes,
      { id, heroKey, star: 1, xp: 0, assignedBuildingId: null, injuredUntil: 0 },
    ],
    log: [`${def.name}上筏了。老大，这人能打。`, ...state.log].slice(0, 24),
  };
}

export function assignHero(state, heroId, buildingId) {
  return {
    ...state,
    buildings: state.buildings.map((b) => ({
      ...b,
      occupantHeroId: b.id === buildingId ? heroId : b.occupantHeroId === heroId ? null : b.occupantHeroId,
    })),
    heroes: state.heroes.map((h) =>
      h.id === heroId ? { ...h, assignedBuildingId: buildingId } : h,
    ),
  };
}

export function starUp(state, heroId) {
  const h = state.heroes.find((it) => it.id === heroId);
  if (!h || h.star >= 5) return state;
  const need = h.star * 10;
  if ((state.resources.shard || 0) < need) return state;
  return {
    ...state,
    resources: { ...state.resources, shard: state.resources.shard - need },
    heroes: state.heroes.map((it) => (it.id === heroId ? { ...it, star: it.star + 1 } : it)),
  };
}
