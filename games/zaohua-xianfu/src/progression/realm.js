import { REALMS, realmAt } from "../data/realms.js";

export function breakthroughChance(state) {
  const r = realmAt(state.realm.index);
  const layerReady = (state.realm.exp ?? 0) >= r.exp;
  if (!layerReady) return 0;
  const heart = Math.min(0.4, (state.realm.heartDemon ?? 0) * 0.08);
  const pills = Math.min(0.2, (state.resources.pills ?? 0) / 80);
  const base = 0.42 - state.realm.index * 0.03;
  return Math.max(0.08, Math.min(0.92, base + heart + pills));
}

export function canCultivate(state) {
  return (state.resources.qi ?? 0) >= 4;
}

export function applyCultivate(state) {
  const qi = 4;
  return {
    resources: { ...state.resources, qi: state.resources.qi - qi },
    realm: { ...state.realm, exp: (state.realm.exp ?? 0) + 6 + state.realm.index },
  };
}

export function applyBreakthrough(state, rng = Math.random) {
  const chance = breakthroughChance(state);
  if (chance <= 0) return { ok: false, reason: "exp", state };
  const success = rng() < chance;
  const r = realmAt(state.realm.index);
  if (success) {
    let index = state.realm.index;
    let layer = state.realm.layer + 1;
    if (layer > r.layers) {
      index = Math.min(REALMS.length - 1, index + 1);
      layer = 1;
    }
    return {
      ok: true,
      state: {
        ...state,
        resources: { ...state.resources, pills: Math.max(0, state.resources.pills - 1) },
        realm: { index, layer, exp: 0, heartDemon: 0 },
      },
    };
  }
  return {
    ok: false,
    reason: "fail",
    state: {
      ...state,
      resources: { ...state.resources, pills: state.resources.pills * 0.4 },
      realm: { ...state.realm, heartDemon: (state.realm.heartDemon ?? 0) + 1 },
    },
  };
}
