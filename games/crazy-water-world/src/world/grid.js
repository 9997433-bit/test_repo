import { BUILDINGS } from "../data/buildings.js";
import { REASON, allow, deny } from "../core/reasons.js";

export const ROTATIONS = [0, 90];

function isCoord(n) {
  return Number.isInteger(n);
}

function footprint(type, x, y, rot = 0) {
  const def = BUILDINGS[type];
  if (!def) return [];
  const turned = rot === 90 || rot === 270;
  const w = turned ? def.h : def.w;
  const h = turned ? def.w : def.h;
  const cells = [];
  for (let j = 0; j < h; j += 1) {
    for (let i = 0; i < w; i += 1) {
      cells.push([x + i, y + j]);
    }
  }
  return cells;
}

export function footprintOf(building) {
  return footprint(building.type, building.x, building.y, building.rot);
}

// 几何 / 身份检查。资源与解锁等级归 build.js 的 canBuild，
// 因为 moveBuilding 复用本函数时不该再付一次钱。
export function canPlace(state, type, x, y, rot = 0, ignoreId = null) {
  if (!BUILDINGS[type]) return deny(REASON.UNKNOWN_TYPE);
  if (!ROTATIONS.includes(rot)) return deny(REASON.INVALID_ARG);
  if (!isCoord(x) || !isCoord(y)) return deny(REASON.INVALID_ARG);
  const def = BUILDINGS[type];
  if (def.unique && state.buildings.some((b) => b.type === type && b.id !== ignoreId)) {
    return deny(REASON.UNIQUE);
  }
  const cells = footprint(type, x, y, rot);
  for (const [cx, cy] of cells) {
    if (cx < 0 || cy < 0 || cx >= state.raft.width || cy >= state.raft.height) {
      return deny(REASON.BOUNDS);
    }
    const tile = state.raft.tiles[cy]?.[cx];
    if (tile && tile.buildingId !== ignoreId) return deny(REASON.OCCUPIED);
  }
  return allow({ cells });
}

export function occupy(tiles, cells, buildingId, level, rot) {
  const next = tiles.map((row) => row.slice());
  for (const [x, y] of cells) {
    if (next[y]?.[x] !== undefined) next[y][x] = { buildingId, level, rot, occupant: null };
  }
  return next;
}

export function clearOccupy(tiles, buildingId) {
  return tiles.map((row) =>
    row.map((cell) => (cell && cell.buildingId === buildingId ? null : cell)),
  );
}

// 足迹外一圈的正交邻格（去重，可越界，由调用方过滤）。
export function ringCells(cells) {
  const inside = new Set(cells.map(([x, y]) => `${x},${y}`));
  const out = new Map();
  for (const [x, y] of cells) {
    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const key = `${x + dx},${y + dy}`;
      if (!inside.has(key)) out.set(key, [x + dx, y + dy]);
    }
  }
  return [...out.values()];
}

export function adjacentBuildingIds(state, building) {
  const ids = new Set();
  for (const [x, y] of ringCells(footprintOf(building))) {
    const tile = state.raft.tiles[y]?.[x];
    if (tile && tile.buildingId !== building.id) ids.add(tile.buildingId);
  }
  return [...ids];
}

export function adjacentWalls(state, building) {
  const ids = new Set(adjacentBuildingIds(state, building));
  return state.buildings.filter((b) => b.type === "wall" && ids.has(b.id));
}

export { footprint };
