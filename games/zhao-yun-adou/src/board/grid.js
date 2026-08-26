import { CELL_COUNT, COLS, ROWS, START_UNLOCKED } from "../data/units.js";

export { CELL_COUNT, COLS, ROWS };

/** 正交四邻（右、左、下、上）。棋盘上一切相邻关系都只用这四个方向，不含斜向。 */
const ORTHOGONAL = Object.freeze([
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
]);

/**
 * 建一侧的 5×4 棋格。开局解锁 `START_UNLOCKED`，其余需铲子扩地。
 *
 * 字段顺序即存档快照顺序（index/col/row/unlocked/unit），改动会影响序列化契约。
 */
export function createCells() {
  return Array.from({ length: CELL_COUNT }, (_, i) => ({
    index: i,
    col: i % COLS,
    row: Math.floor(i / COLS),
    unlocked: START_UNLOCKED.includes(i),
    unit: null,
  }));
}

/** 索引是否落在棋盘内。 */
export function inBounds(index) {
  return Number.isInteger(index) && index >= 0 && index < CELL_COUNT;
}

/** 列行 → 索引；越界返回 -1。 */
export function toIndex(col, row) {
  if (!Number.isInteger(col) || !Number.isInteger(row)) return -1;
  if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return -1;
  return row * COLS + col;
}

/** 索引 → 列行；越界返回 null。 */
export function toCoord(index) {
  if (!inBounds(index)) return null;
  return { col: index % COLS, row: Math.floor(index / COLS) };
}

/**
 * 正交相邻格索引，升序返回（保证扫描顺序稳定，不受方向表书写顺序影响）。
 * 越界索引返回空数组。
 */
export function neighbors(index) {
  if (!inBounds(index)) return [];
  const c = index % COLS;
  const r = Math.floor(index / COLS);
  const out = [];
  for (const [dc, dr] of ORTHOGONAL) {
    const nc = c + dc;
    const nr = r + dr;
    if (nc >= 0 && nc < COLS && nr >= 0 && nr < ROWS) out.push(nr * COLS + nc);
  }
  return out.sort((a, b) => a - b);
}

/** 两格是否正交相邻。 */
export function isAdjacent(a, b) {
  return inBounds(a) && inBounds(b) && neighbors(a).includes(b);
}

/**
 * 格到敌军路线的距离：路线沿棋盘外沿绕行，所以取到四边的最小距离。
 * 越界索引返回 Infinity（射程判定恒不成立）。
 */
export function cellDistToPath(index) {
  if (!inBounds(index)) return Infinity;
  const c = index % COLS;
  const r = Math.floor(index / COLS);
  return Math.min(c, COLS - 1 - c, r, ROWS - 1 - r);
}

/**
 * 按 `cell.index` 取格，不假设数组下标等于索引；找不到返回 null。
 */
export function cellAt(cells, index) {
  if (!Array.isArray(cells) || !inBounds(index)) return null;
  const direct = cells[index];
  if (direct && direct.index === index) return direct;
  return cells.find((c) => c && c.index === index) || null;
}

/** 已解锁且空着，可以直接落子。 */
export function isUnlockedEmpty(cell) {
  return !!cell && cell.unlocked === true && cell.unit == null;
}

/** 已解锁且有棋子。 */
export function isOccupied(cell) {
  return !!cell && cell.unlocked === true && cell.unit != null;
}

/** 全部可落子空格，按索引升序。 */
export function unlockedEmptyCells(cells) {
  if (!Array.isArray(cells)) return [];
  return cells.filter(isUnlockedEmpty).sort((a, b) => a.index - b.index);
}

/** 全部已解锁占用格，按索引升序。 */
export function occupiedCells(cells) {
  if (!Array.isArray(cells)) return [];
  return cells.filter(isOccupied).sort((a, b) => a.index - b.index);
}

/** 第一个可落子空格；没有返回 null。 */
export function firstUnlockedEmpty(cells) {
  return unlockedEmptyCells(cells)[0] || null;
}

/** 已解锁格数量。 */
export function countUnlocked(cells) {
  if (!Array.isArray(cells)) return 0;
  return cells.reduce((n, c) => n + (c?.unlocked ? 1 : 0), 0);
}

/** 目标格的已解锁正交邻格。 */
export function unlockedNeighbors(cells, index) {
  return neighbors(index).filter((ni) => cellAt(cells, ni)?.unlocked === true);
}

/** 目标格的可落子空邻格，按索引升序。 */
export function emptyNeighbors(cells, index) {
  return neighbors(index).filter((ni) => isUnlockedEmpty(cellAt(cells, ni)));
}

/**
 * 铲子谓词：目标格仍是锁定格，且至少有一个已解锁的正交邻格。
 * 保证扩地只能从既有地盘向外长，不能在孤岛开格。
 */
export function canShovel(cells, index) {
  const cell = cellAt(cells, index);
  if (!cell || cell.unlocked) return false;
  return unlockedNeighbors(cells, index).length > 0;
}

/** 当前所有合法铲子目标，按索引升序。 */
export function shovelTargets(cells) {
  if (!Array.isArray(cells)) return [];
  return cells
    .filter((c) => c && !c.unlocked && canShovel(cells, c.index))
    .sort((a, b) => a.index - b.index);
}

/** 解锁一格；不满足 `canShovel` 时不改动棋盘并返回 false。 */
export function unlockCell(cells, index) {
  if (!canShovel(cells, index)) return false;
  cellAt(cells, index).unlocked = true;
  return true;
}
