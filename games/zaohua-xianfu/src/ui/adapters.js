/**
 * UI 与仙府/产量层之间的薄适配层。
 * 仙府层（mansion/**）由别的模块所有者演进，这里做能力探测与兜底，
 * 让界面在契约函数缺席时降级而不是白屏。
 */
import * as table from "../data/buildings.js";
import * as facade from "../mansion/buildings.js";
import * as production from "../mansion/production.js";
import * as layout from "../mansion/layout.js";

export const GRID_SIZE = Number.isFinite(facade.GRID_SIZE)
  ? facade.GRID_SIZE
  : Number.isFinite(table.GRID_SIZE)
    ? table.GRID_SIZE
    : 6;

export function buildingDef(type) {
  return facade.buildingDef?.(type) ?? table.BUILDING_TYPES?.[type] ?? null;
}

export function buildingName(type) {
  return buildingDef(type)?.name ?? String(type ?? "");
}

export function buildingGlyph(type) {
  return buildingDef(type)?.glyph ?? "府";
}

export function buildingIds() {
  return Object.keys(table.BUILDING_TYPES ?? facade.BUILDING_TYPES ?? {});
}

export function upgradeCost(type, level) {
  const fn = facade.upgradeCost ?? table.upgradeCost;
  return fn ? fn(type, level) : {};
}

export function buildCost(type) {
  const fn = facade.buildCost ?? table.buildCost;
  return fn ? fn(type) : upgradeCost(type, 1);
}

export function mansionCap(level) {
  const fn = facade.mansionCap ?? table.mansionCap;
  if (fn) return fn(level);
  const lv = Math.max(1, level ?? 1);
  return { maxBuildingLevel: lv, plots: Math.min(GRID_SIZE * GRID_SIZE, 4 + lv * 2) };
}

export function mansionLevel(buildings) {
  return layout.mansionLevel?.(buildings) ?? (buildings ?? []).find((b) => b.type === "mansion")?.level ?? 1;
}

export function maxLevelFor(type, level) {
  if (facade.maxLevelFor) return facade.maxLevelFor(type, level);
  if (type === "mansion") return facade.MANSION_MAX_LEVEL ?? 12;
  return mansionCap(level).maxBuildingLevel;
}

export function costShortfall(resources, cost) {
  if (facade.costShortfall) return facade.costShortfall(resources, cost);
  const lack = {};
  for (const [k, v] of Object.entries(cost ?? {})) {
    const gap = v - (resources?.[k] ?? 0);
    if (gap > 0) lack[k] = gap;
  }
  return lack;
}

export function canAfford(resources, cost) {
  return Object.keys(costShortfall(resources, cost)).length === 0;
}

export function occupancy(buildings) {
  if (layout.occupancy) return layout.occupancy(buildings);
  const grid = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(null));
  for (const b of buildings ?? []) {
    if (grid[b.y]) grid[b.y][b.x] = b;
  }
  return grid;
}

export function adjacencyDetail(buildings, x, y, typeHint) {
  if (layout.adjacencyDetail) return layout.adjacencyDetail(buildings, x, y, typeHint);
  const multiplier = layout.adjacencyBonus?.(buildings, x, y, typeHint) ?? 1;
  return { multiplier, sources: [] };
}

export function bestPlotFor(buildings, type) {
  return layout.bestPlotFor?.(buildings, type) ?? null;
}

export function layoutScore(buildings) {
  return layout.layoutReport?.(buildings)?.score ?? null;
}

/** 每秒产量总表。 */
export function rates(state) {
  if (production.productionRates) return production.productionRates(state);
  return production.produce?.(state, 1) ?? {};
}

/** 逐座建筑的乘区拆解；仙府层未提供时返回空表，界面自动省略该段。 */
export function breakdownRows(state) {
  if (!production.produceBreakdown) return [];
  return production.produceBreakdown(state, 1)?.rows ?? [];
}

export function offlineEfficiency(state) {
  return production.offlineEfficiency?.(state) ?? null;
}

/** 营造候选：优先用仙府层的 catalog，缺席时按数据表自算。 */
export function catalog(level, ctx = {}) {
  if (facade.catalog) return facade.catalog(level, ctx);
  const lv = Math.max(1, level ?? 1);
  const cap = mansionCap(lv);
  const buildings = ctx.buildings ?? [];
  const free = Number.isFinite(ctx.plotsFree) ? ctx.plotsFree : cap.plots - buildings.length;
  return buildingIds().map((id) => {
    const def = buildingDef(id);
    const cost = buildCost(id);
    const built = buildings.filter((b) => b.type === id).length;
    const lack = ctx.resources ? costShortfall(ctx.resources, cost) : {};
    const unlocked = (def?.unlockAt ?? 1) <= lv;
    let reason = null;
    if (!unlocked) reason = `洞府 Lv.${def?.unlockAt ?? 1} 解锁`;
    else if (def?.unique && built > 0) reason = "全府仅可有一座";
    else if (free <= 0) reason = "地块已满，先升洞府仙居";
    else if (Object.keys(lack).length) reason = "资源不足";
    return {
      id,
      name: def?.name ?? id,
      glyph: def?.glyph ?? "府",
      desc: def?.desc ?? "",
      cost,
      lack,
      unlocked,
      built,
      affordable: Object.keys(lack).length === 0,
      buildable: reason === null,
      reason,
    };
  });
}
