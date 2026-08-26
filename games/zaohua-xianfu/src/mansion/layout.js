import { GRID_SIZE, buildingDef, buildingName, mansionCap } from "./buildings.js";

const DIRS = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];

/** 邻接乘区下限，防止极端堆叠把产量压成 0；正常布局够不着。 */
export const MIN_ADJACENCY = 0.5;

/**
 * 邻接规则表：`from` 为邻居类型，`to` 为受影响的建筑类型（`"*"` 兜底）。
 * 先匹配先生效，故专项规则必须排在通配规则前面。
 * `perLevel` 是邻居每高一级的追加值，Lv.1 时为 0，保证基准数值稳定。
 */
export const ADJACENCY_RULES = [
  { from: "leypulse", to: ["field"], value: 0.15, perLevel: 0.02, label: "灵脉滋田" },
  { from: "leypulse", to: ["woodcut", "quarry"], value: 0.1, perLevel: 0.015, label: "灵脉润坊" },
  { from: "leypulse", to: ["array"], value: 0.12, perLevel: 0.015, label: "脉阵相引" },
  { from: "leypulse", to: "*", value: 0.06, perLevel: 0.01, label: "灵脉余泽" },
  { from: "array", to: ["alchemy", "forge", "scripture"], value: 0.08, perLevel: 0.01, label: "灵气灌注" },
  { from: "array", to: ["field", "woodcut", "quarry"], value: 0.04, perLevel: 0.005, label: "灵气润物" },
  { from: "scripture", to: ["alchemy", "forge"], value: 0.06, label: "丹方参研" },
  { from: "mansion", to: "*", value: 0.05, label: "府邸荫庇" },
  { from: "forge", to: ["field"], value: -0.08, label: "炉火燎田" },
  { from: "alchemy", to: ["field"], value: -0.05, label: "药烟熏苗" },
];

export function inBounds(x, y) {
  return Number.isFinite(x) && Number.isFinite(y) && x >= 0 && y >= 0 && x < GRID_SIZE && y < GRID_SIZE;
}

export function occupancy(buildings) {
  const grid = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(null));
  for (const b of buildings ?? []) {
    if (inBounds(b.x, b.y)) grid[b.y][b.x] = b;
  }
  return grid;
}

export function buildingAt(buildings, x, y) {
  return (buildings ?? []).find((b) => b.x === x && b.y === y) ?? null;
}

export function canPlace(buildings, x, y) {
  if (!inBounds(x, y)) return false;
  return buildingAt(buildings, x, y) === null;
}

export function countType(buildings, type) {
  return (buildings ?? []).filter((b) => b.type === type).length;
}

export function mansionLevel(buildings) {
  return (buildings ?? []).find((b) => b.type === "mansion")?.level ?? 1;
}

export function neighbors(buildings, x, y) {
  return neighborsOnGrid(occupancy(buildings), x, y);
}

function neighborsOnGrid(grid, x, y) {
  const out = [];
  for (const [dx, dy] of DIRS) {
    const n = grid[y + dy]?.[x + dx];
    if (n) out.push(n);
  }
  return out;
}

function ruleFor(fromType, toType) {
  for (const rule of ADJACENCY_RULES) {
    if (rule.from !== fromType) continue;
    if (rule.to === "*" || rule.to.includes(toType)) return rule;
  }
  return null;
}

/**
 * 邻接明细：返回乘区与每条邻接的来源，供 UI 逐条解释「为什么这块地产得多」。
 * `grid` 由调用方复用，产量循环里不必为每座建筑重建一次占位表。
 */
export function adjacencyDetailOnGrid(grid, x, y, typeHint) {
  const self = grid[y]?.[x] ?? null;
  const type = typeHint ?? self?.type ?? null;
  const sources = [];
  let bonus = 0;
  let penalty = 0;
  for (const n of neighborsOnGrid(grid, x, y)) {
    const rule = ruleFor(n.type, type);
    if (!rule) continue;
    const level = Math.max(1, n.level ?? 1);
    const value = rule.value + (rule.perLevel ?? 0) * (level - 1);
    if (value === 0) continue;
    if (value > 0) bonus += value;
    else penalty += -value;
    sources.push({
      id: n.id,
      type: n.type,
      name: buildingName(n.type),
      level,
      label: rule.label,
      value,
    });
  }
  const multiplier = Math.max(MIN_ADJACENCY, 1 + bonus - penalty);
  return { multiplier, bonus, penalty, sources };
}

export function adjacencyOnGrid(grid, x, y, typeHint) {
  return adjacencyDetailOnGrid(grid, x, y, typeHint).multiplier;
}

export function adjacencyDetail(buildings, x, y, typeHint) {
  return adjacencyDetailOnGrid(occupancy(buildings), x, y, typeHint);
}

/**
 * 邻接产量乘区。灵田每邻一条 Lv.1 灵脉 +15%，等级更高的灵脉再多给一点。
 */
export function adjacencyBonus(buildings, x, y, typeHint) {
  return adjacencyDetail(buildings, x, y, typeHint).multiplier;
}

export function emptyPlots(buildings) {
  const grid = occupancy(buildings);
  const out = [];
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      if (!grid[y][x]) out.push({ x, y });
    }
  }
  return out;
}

export function plotUsage(buildings) {
  const list = buildings ?? [];
  const cap = mansionCap(mansionLevel(list));
  return {
    used: list.length,
    plots: cap.plots,
    free: Math.max(0, cap.plots - list.length),
    maxBuildingLevel: cap.maxBuildingLevel,
  };
}

/** 给定建筑类型，挑邻接乘区最高的空地；同分时取离洞府近的一块。 */
export function bestPlotFor(buildings, type) {
  const list = buildings ?? [];
  const grid = occupancy(list);
  const home = list.find((b) => b.type === "mansion");
  let best = null;
  for (const { x, y } of emptyPlots(list)) {
    const multiplier = adjacencyOnGrid(grid, x, y, type);
    const dist = home ? Math.abs(home.x - x) + Math.abs(home.y - y) : 0;
    if (!best || multiplier > best.multiplier + 1e-9 || (Math.abs(multiplier - best.multiplier) < 1e-9 && dist < best.dist)) {
      best = { x, y, multiplier, dist };
    }
  }
  if (!best) return null;
  return { x: best.x, y: best.y, multiplier: best.multiplier };
}

/** 风水满分对应的平均邻接乘区：全府平均 ×1.35 即视为布局到位。 */
export const HARMONY_SPAN = 0.35;

/**
 * 布局体检：逐座建筑的邻接乘区，外加 0-100 风水评分。
 * 评分只看吃邻接的产出建筑；灵脉是喂人的地脉节点，自身不参与打分。
 */
export function layoutReport(buildings) {
  const list = buildings ?? [];
  const grid = occupancy(list);
  const rows = list.map((b) => {
    const def = buildingDef(b.type);
    const detail = adjacencyDetailOnGrid(grid, b.x, b.y, b.type);
    return {
      id: b.id,
      type: b.type,
      name: buildingName(b.type),
      role: def?.role ?? "support",
      level: Math.max(1, b.level ?? 1),
      x: b.x,
      y: b.y,
      produces: Object.keys(def?.baseYield ?? {}).length > 0,
      multiplier: detail.multiplier,
      sources: detail.sources,
    };
  });
  const scored = rows.filter((r) => r.produces && r.role !== "vein");
  const average = scored.length ? scored.reduce((sum, r) => sum + r.multiplier, 0) / scored.length : 1;
  const score = Math.round(Math.min(1, Math.max(0, (average - 1) / HARMONY_SPAN)) * 100);
  return { score, average, rows };
}
