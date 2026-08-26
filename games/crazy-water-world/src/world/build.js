import { BUILDINGS, UNLOCK_LEVEL } from "../data/buildings.js";
import { canPlace, occupy, clearOccupy, footprint } from "./grid.js";

function pay(res, cost) {
  const next = { ...res };
  for (const [k, v] of Object.entries(cost)) {
    if ((next[k] || 0) < v) return null;
    next[k] -= v;
  }
  return next;
}

function nid(prefix, state) {
  return `${prefix}-${state.buildings.length + 1}-${state.meta.tick}`;
}

export function placeBuilding(state, type, x, y, rot = 0) {
  const def = BUILDINGS[type];
  if (!def) return state;
  if ((UNLOCK_LEVEL[type] || 1) > state.player.level) return state;
  const check = canPlace(state, type, x, y, rot);
  if (!check.ok) return state;
  const paid = pay(state.resources, def.cost);
  if (!paid) return state;
  const id = nid(type, state);
  const building = { id, type, x, y, level: 1, rot, occupantHeroId: null };
  return {
    ...state,
    resources: paid,
    buildings: [...state.buildings, building],
    raft: { ...state.raft, tiles: occupy(state.raft.tiles, check.cells, id, 1, rot) },
    log: [`${def.name}落成。木槌声在废海上回荡。`, ...state.log].slice(0, 24),
  };
}

export function moveBuilding(state, id, x, y, rot) {
  const b = state.buildings.find((it) => it.id === id);
  if (!b) return state;
  const cleared = { ...state, raft: { ...state.raft, tiles: clearOccupy(state.raft.tiles, id) } };
  const check = canPlace(cleared, b.type, x, y, rot, id);
  if (!check.ok) return state;
  return {
    ...cleared,
    buildings: cleared.buildings.map((it) => (it.id === id ? { ...it, x, y, rot } : it)),
    raft: { ...cleared.raft, tiles: occupy(cleared.raft.tiles, check.cells, id, b.level, rot) },
  };
}

export function upgradeBuilding(state, id) {
  const b = state.buildings.find((it) => it.id === id);
  if (!b) return state;
  const def = BUILDINGS[b.type];
  const paid = pay(state.resources, def.upgrade);
  if (!paid) return state;
  const cells = footprint(b.type, b.x, b.y, b.rot);
  return {
    ...state,
    resources: paid,
    buildings: state.buildings.map((it) => (it.id === id ? { ...it, level: it.level + 1 } : it)),
    raft: {
      ...state.raft,
      tiles: occupy(clearOccupy(state.raft.tiles, id), cells, id, b.level + 1, b.rot),
    },
    player: { ...state.player, exp: state.player.exp + 12 + b.level * 4 },
  };
}

export function expandRaft(state, dir) {
  const cost = { wood: 10 + state.raft.width + state.raft.height, plastic: 4 };
  const paid = pay(state.resources, cost);
  if (!paid) return state;
  let { width, height, tiles } = state.raft;
  if (dir === "right") {
    width += 1;
    tiles = tiles.map((row) => [...row, null]);
  } else if (dir === "left") {
    width += 1;
    tiles = tiles.map((row) => [null, ...row]);
    return {
      ...state,
      resources: paid,
      raft: { width, height, tiles },
      buildings: state.buildings.map((b) => ({ ...b, x: b.x + 1 })),
    };
  } else if (dir === "down") {
    height += 1;
    tiles = [...tiles, Array.from({ length: width }, () => null)];
  } else {
    height += 1;
    tiles = [Array.from({ length: width }, () => null), ...tiles];
    return {
      ...state,
      resources: paid,
      raft: { width, height, tiles },
      buildings: state.buildings.map((b) => ({ ...b, y: b.y + 1 })),
    };
  }
  return { ...state, resources: paid, raft: { width, height, tiles } };
}

export { canPlace };
