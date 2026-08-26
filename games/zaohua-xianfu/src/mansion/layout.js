import { GRID_SIZE } from "../data/buildings.js";

const DIRS = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];

export function occupancy(buildings) {
  const grid = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(null));
  for (const b of buildings) {
    if (b.x >= 0 && b.y >= 0 && b.x < GRID_SIZE && b.y < GRID_SIZE) {
      grid[b.y][b.x] = b;
    }
  }
  return grid;
}

export function canPlace(buildings, x, y) {
  if (x < 0 || y < 0 || x >= GRID_SIZE || y >= GRID_SIZE) return false;
  return !buildings.some((b) => b.x === x && b.y === y);
}

export function adjacencyBonus(buildings, x, y) {
  const grid = occupancy(buildings);
  let pulses = 0;
  for (const [dx, dy] of DIRS) {
    const n = grid[y + dy]?.[x + dx];
    if (n?.type === "leypulse") pulses += 1;
  }
  return 1 + pulses * 0.15;
}

export function countType(buildings, type) {
  return buildings.filter((b) => b.type === type).length;
}
