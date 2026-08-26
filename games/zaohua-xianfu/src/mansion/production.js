import { BUILDING_TYPES } from "../data/buildings.js";
import { adjacencyBonus } from "./layout.js";
import { yieldMultiplier } from "../disciples/assign.js";

export function produce(state, dtSec) {
  const add = { qi: 0, herb: 0, wood: 0, ore: 0, stone: 0, pills: 0, jade: 0 };
  const disciples = state.disciples ?? [];
  for (const b of state.buildings ?? []) {
    const def = BUILDING_TYPES[b.type];
    if (!def?.baseYield) continue;
    const adj = b.type === "field" ? adjacencyBonus(state.buildings, b.x, b.y) : 1;
    const worker = disciples.find((d) => d.buildingId === b.id);
    const mul = yieldMultiplier(worker, b) * (0.85 + 0.15 * (b.level ?? 1)) * adj;
    for (const [k, v] of Object.entries(def.baseYield)) {
      add[k] = (add[k] ?? 0) + v * mul * dtSec;
    }
  }
  const realmIndex = state.realm?.index ?? 0;
  add.qi += (0.15 + realmIndex * 0.08) * dtSec;
  return add;
}

export function applyYield(resources, add) {
  const next = { ...resources };
  for (const [k, v] of Object.entries(add)) {
    next[k] = (next[k] ?? 0) + v;
  }
  return next;
}

export function combatBuildingBonus(buildings) {
  let atk = 0;
  for (const b of buildings ?? []) {
    if (b.type === "alchemy") atk += 4 * (b.level ?? 1);
    if (b.type === "forge") atk += 3 * (b.level ?? 1);
  }
  return { atk };
}
