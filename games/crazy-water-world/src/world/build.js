import { BUILDINGS, UNLOCK_LEVEL } from "../data/buildings.js";
import { REASON, allow, deny } from "../core/reasons.js";
import { canPlace, occupy, clearOccupy, footprint, footprintOf } from "./grid.js";

export const MAX_BUILDING_LEVEL = 8;
export const MAX_RAFT_SIDE = 32;
export const DIRS = ["left", "right", "up", "down"];
const REFUND_RATE = 0.5;

function affords(res, cost) {
  return Object.entries(cost || {}).every(([k, v]) => (res[k] || 0) >= v);
}

function pay(res, cost) {
  const next = { ...res };
  for (const [k, v] of Object.entries(cost || {})) {
    if ((next[k] || 0) < v) return null;
    next[k] -= v;
  }
  return next;
}

function refund(res, cost) {
  const next = { ...res };
  for (const [k, v] of Object.entries(cost || {})) {
    next[k] = (next[k] || 0) + Math.floor(v * REFUND_RATE);
  }
  return next;
}

function nid(prefix, state) {
  const used = new Set(state.buildings.map((b) => b.id));
  let n = state.buildings.length + 1;
  let id = `${prefix}-${n}-${state.meta.tick}`;
  while (used.has(id)) {
    n += 1;
    id = `${prefix}-${n}-${state.meta.tick}`;
  }
  return id;
}

function pushLog(log, line) {
  return [line, ...log].slice(0, 24);
}

function expandCost(state) {
  return { wood: 10 + state.raft.width + state.raft.height, plastic: 4 };
}

// 建造完整前置：与 placeBuilding 的检查顺序一致（表 → 解锁 → 落位 → 付款）。
export function canBuild(state, type, x, y, rot = 0) {
  const def = BUILDINGS[type];
  if (!def) return deny(REASON.UNKNOWN_TYPE);
  if ((UNLOCK_LEVEL[type] || 1) > state.player.level) {
    return deny(REASON.LOCKED, { need: UNLOCK_LEVEL[type] || 1 });
  }
  const spot = canPlace(state, type, x, y, rot);
  if (!spot.ok) return spot;
  if (!affords(state.resources, def.cost)) return deny(REASON.COST, { cost: def.cost });
  return allow({ cells: spot.cells, cost: def.cost });
}

export function canMove(state, id, x, y, rot) {
  const b = state.buildings.find((it) => it.id === id);
  if (!b) return deny(REASON.NOT_FOUND);
  const cleared = { ...state, raft: { ...state.raft, tiles: clearOccupy(state.raft.tiles, id) } };
  return canPlace(cleared, b.type, x, y, rot ?? b.rot, id);
}

export function canUpgrade(state, id) {
  const b = state.buildings.find((it) => it.id === id);
  if (!b) return deny(REASON.NOT_FOUND);
  const def = BUILDINGS[b.type];
  if (!def) return deny(REASON.UNKNOWN_TYPE);
  const cap = def.maxLevel || MAX_BUILDING_LEVEL;
  if (b.level >= cap) return deny(REASON.MAX_LEVEL, { cap });
  if (!affords(state.resources, def.upgrade)) return deny(REASON.COST, { cost: def.upgrade });
  return allow({ cost: def.upgrade, level: b.level + 1 });
}

export function canExpand(state, dir) {
  if (!DIRS.includes(dir)) return deny(REASON.INVALID_ARG);
  const grows = dir === "left" || dir === "right" ? state.raft.width : state.raft.height;
  if (grows + 1 > MAX_RAFT_SIDE) return deny(REASON.BOUNDS, { cap: MAX_RAFT_SIDE });
  const cost = expandCost(state);
  if (!affords(state.resources, cost)) return deny(REASON.COST, { cost });
  return allow({ cost });
}

export function canDemolish(state, id) {
  const b = state.buildings.find((it) => it.id === id);
  if (!b) return deny(REASON.NOT_FOUND);
  return allow({ refund: refund({}, BUILDINGS[b.type]?.cost) });
}

export function placeBuilding(state, type, x, y, rot = 0) {
  const check = canBuild(state, type, x, y, rot);
  if (!check.ok) return state;
  const def = BUILDINGS[type];
  const paid = pay(state.resources, def.cost);
  if (!paid) return state;
  const id = nid(type, state);
  const building = { id, type, x, y, level: 1, rot, occupantHeroId: null };
  return {
    ...state,
    resources: paid,
    buildings: [...state.buildings, building],
    raft: { ...state.raft, tiles: occupy(state.raft.tiles, check.cells, id, 1, rot) },
    log: pushLog(state.log, `${def.name}落成。木槌声在废海上回荡。`),
  };
}

export function moveBuilding(state, id, x, y, rot) {
  const b = state.buildings.find((it) => it.id === id);
  if (!b) return state;
  const nextRot = rot ?? b.rot;
  const cleared = { ...state, raft: { ...state.raft, tiles: clearOccupy(state.raft.tiles, id) } };
  const check = canPlace(cleared, b.type, x, y, nextRot, id);
  if (!check.ok) return state;
  return {
    ...cleared,
    buildings: cleared.buildings.map((it) => (it.id === id ? { ...it, x, y, rot: nextRot } : it)),
    raft: { ...cleared.raft, tiles: occupy(cleared.raft.tiles, check.cells, id, b.level, nextRot) },
  };
}

export function upgradeBuilding(state, id) {
  const check = canUpgrade(state, id);
  if (!check.ok) return state;
  const b = state.buildings.find((it) => it.id === id);
  const def = BUILDINGS[b.type];
  const paid = pay(state.resources, def.upgrade);
  if (!paid) return state;
  const cells = footprintOf(b);
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

export function demolishBuilding(state, id) {
  const b = state.buildings.find((it) => it.id === id);
  if (!b) return state;
  const def = BUILDINGS[b.type];
  return {
    ...state,
    resources: refund(state.resources, def?.cost),
    buildings: state.buildings.filter((it) => it.id !== id),
    raft: { ...state.raft, tiles: clearOccupy(state.raft.tiles, id) },
    heroes: state.heroes.map((h) => (h.assignedBuildingId === id ? { ...h, assignedBuildingId: null } : h)),
    log: pushLog(state.log, `${def?.name || "建筑"}被拆了，回收了一半材料。`),
  };
}

export function expandRaft(state, dir) {
  const check = canExpand(state, dir);
  if (!check.ok) return state;
  const paid = pay(state.resources, check.cost);
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

export { canPlace, footprint };
