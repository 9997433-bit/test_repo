import { CELL_COUNT, COLS, ROWS, START_UNLOCKED } from "../data/units.js";

export function createCells() {
  return Array.from({ length: CELL_COUNT }, (_, i) => ({
    index: i,
    col: i % COLS,
    row: Math.floor(i / COLS),
    unlocked: START_UNLOCKED.includes(i),
    unit: null,
  }));
}

export function neighbors(index) {
  const c = index % COLS;
  const r = Math.floor(index / COLS);
  const out = [];
  for (const [dc, dr] of [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ]) {
    const nc = c + dc;
    const nr = r + dr;
    if (nc >= 0 && nc < COLS && nr >= 0 && nr < ROWS) out.push(nr * COLS + nc);
  }
  return out;
}

export function cellDistToPath(index) {
  const c = index % COLS;
  const r = Math.floor(index / COLS);
  const edge = Math.min(c, COLS - 1 - c, r, ROWS - 1 - r);
  return edge;
}
