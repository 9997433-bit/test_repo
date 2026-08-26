import { BUILDINGS } from "../data/buildings.js";

function footprint(type, x, y, rot) {
  const def = BUILDINGS[type];
  if (!def) return [];
  const w = rot % 180 === 0 ? def.w : def.h;
  const h = rot % 180 === 0 ? def.h : def.w;
  const cells = [];
  for (let j = 0; j < h; j += 1) {
    for (let i = 0; i < w; i += 1) {
      cells.push([x + i, y + j]);
    }
  }
  return cells;
}

export function canPlace(state, type, x, y, rot = 0, ignoreId = null) {
  const def = BUILDINGS[type];
  if (!def) return { ok: false, reason: "未知建筑" };
  if (def.unique && state.buildings.some((b) => b.type === type && b.id !== ignoreId)) {
    return { ok: false, reason: "只能有一座指挥中心" };
  }
  const cells = footprint(type, x, y, rot);
  for (const [cx, cy] of cells) {
    if (cx < 0 || cy < 0 || cx >= state.raft.width || cy >= state.raft.height) {
      return { ok: false, reason: "超出木筏" };
    }
    const tile = state.raft.tiles[cy][cx];
    if (tile && tile.buildingId !== ignoreId) return { ok: false, reason: "格子已被占用" };
  }
  return { ok: true, reason: "", cells };
}

export function occupy(tiles, cells, buildingId, level, rot) {
  const next = tiles.map((row) => row.slice());
  for (const [x, y] of cells) {
    next[y][x] = { buildingId, level, rot, occupant: null };
  }
  return next;
}

export function clearOccupy(tiles, buildingId) {
  return tiles.map((row) =>
    row.map((cell) => (cell && cell.buildingId === buildingId ? null : cell)),
  );
}

export { footprint };
