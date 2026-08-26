import { buildingDef, levelScale, yieldAt } from "./buildings.js";
import { adjacencyOnGrid, adjacencyDetailOnGrid, mansionLevel, occupancy } from "./layout.js";
import { yieldMultiplier } from "../disciples/assign.js";

export const RESOURCE_KEYS = ["qi", "herb", "wood", "ore", "stone", "pills", "jade"];

/** 洞府仙居每高一级，全府产出 +3%；Lv.1 为 1.0。 */
export const MANSION_AURA_PER_LEVEL = 0.03;

/** 挂机结算效率：底 50%，每级聚灵阵 +6%，封顶 90%。 */
export const OFFLINE_BASE = 0.5;
export const OFFLINE_PER_ARRAY_LEVEL = 0.06;
export const OFFLINE_CAP = 0.9;

function emptyLedger() {
  const out = {};
  for (const k of RESOURCE_KEYS) out[k] = 0;
  return out;
}

export function mansionAura(buildings) {
  return 1 + MANSION_AURA_PER_LEVEL * (mansionLevel(buildings) - 1);
}

/** 天地自生灵气：与建筑无关的境界底产。 */
export function ambientQi(state) {
  const realmIndex = state?.realm?.index ?? 0;
  return 0.15 + realmIndex * 0.08;
}

/**
 * 逐座建筑算产量：弟子 × 等级 × 邻接 × 府邸光环。
 * 占位表只建一次，邻接查询在同一张表上完成。
 */
function productionRows(state) {
  const buildings = state?.buildings ?? [];
  const disciples = state?.disciples ?? [];
  const grid = occupancy(buildings);
  const aura = mansionAura(buildings);
  const rows = [];
  for (const b of buildings) {
    const def = buildingDef(b.type);
    if (!def || !Object.keys(def.baseYield).length) continue;
    const level = Math.max(1, b.level ?? 1);
    const worker = disciples.find((d) => d.buildingId === b.id) ?? null;
    const workerMul = yieldMultiplier(worker, b);
    const levelMul = levelScale(level);
    const adjacency = adjacencyOnGrid(grid, b.x, b.y, b.type);
    const bonus = workerMul * adjacency * aura;
    const perSec = {};
    for (const [k, v] of Object.entries(yieldAt(b.type, level))) perSec[k] = v * bonus;
    rows.push({
      id: b.id,
      type: b.type,
      name: def.name,
      level,
      x: b.x,
      y: b.y,
      worker: worker?.name ?? null,
      workerMul,
      levelMul,
      adjacency,
      aura,
      multiplier: levelMul * bonus,
      perSec,
    });
  }
  return rows;
}

/**
 * 全府产出结算。返回资源增量，输入不被修改。
 * `opts.efficiency` 用于离线折算，默认 1（在线满效率）。
 */
export function produce(state, dtSec, opts = {}) {
  const dt = Number.isFinite(dtSec) ? dtSec : 0;
  const efficiency = Number.isFinite(opts.efficiency) ? Math.max(0, opts.efficiency) : 1;
  const add = emptyLedger();
  for (const row of productionRows(state)) {
    for (const [k, v] of Object.entries(row.perSec)) {
      add[k] = (add[k] ?? 0) + v * dt * efficiency;
    }
  }
  add.qi += ambientQi(state) * dt * efficiency;
  return add;
}

/** 每秒速率，给 HUD 与府报直接用。 */
export function productionRates(state) {
  return produce(state, 1);
}

/**
 * 产量明细：每座建筑的乘区拆解与本段时间的实际产出，外加天地灵气一行。
 */
export function produceBreakdown(state, dtSec = 1, opts = {}) {
  const dt = Number.isFinite(dtSec) ? dtSec : 0;
  const efficiency = Number.isFinite(opts.efficiency) ? Math.max(0, opts.efficiency) : 1;
  const grid = occupancy(state?.buildings ?? []);
  const rows = productionRows(state).map((row) => {
    const out = {};
    for (const [k, v] of Object.entries(row.perSec)) out[k] = v * dt * efficiency;
    return { ...row, out, sources: adjacencyDetailOnGrid(grid, row.x, row.y, row.type).sources };
  });
  const ambient = ambientQi(state) * dt * efficiency;
  return {
    dtSec: dt,
    efficiency,
    rows,
    ambient: { qi: ambient },
    total: produce(state, dt, { efficiency }),
  };
}

/** 聚灵阵越高，离线结算越接近在线。 */
export function offlineEfficiency(state) {
  const arrayLevels = (state?.buildings ?? [])
    .filter((b) => b.type === "array")
    .reduce((sum, b) => sum + Math.max(1, b.level ?? 1), 0);
  return Math.min(OFFLINE_CAP, OFFLINE_BASE + OFFLINE_PER_ARRAY_LEVEL * arrayLevels);
}

export function offlineProduce(state, elapsedSec) {
  return produce(state, elapsedSec, { efficiency: offlineEfficiency(state) });
}

/** 把产出增量并入资源表，返回新对象；非有限数值直接跳过。 */
export function applyYield(resources, add) {
  const next = { ...resources };
  for (const [k, v] of Object.entries(add ?? {})) {
    if (!Number.isFinite(v)) continue;
    next[k] = (next[k] ?? 0) + v;
  }
  return next;
}

/**
 * 建筑给全队的战力加成：丹房 +4 攻/级，锻造房 +3 攻/级，取自建筑定义。
 */
export function combatBuildingBonus(buildings) {
  const total = { atk: 0 };
  for (const b of buildings ?? []) {
    const bonus = buildingDef(b.type)?.combatBonus;
    if (!bonus) continue;
    const level = Math.max(1, b.level ?? 1);
    for (const [k, v] of Object.entries(bonus)) total[k] = (total[k] ?? 0) + v * level;
  }
  return total;
}

/** 战力加成的来源清单，战报与仙府面板可逐条列出。 */
export function combatBonusSources(buildings) {
  const rows = [];
  for (const b of buildings ?? []) {
    const def = buildingDef(b.type);
    if (!def?.combatBonus) continue;
    const level = Math.max(1, b.level ?? 1);
    const gain = {};
    for (const [k, v] of Object.entries(def.combatBonus)) gain[k] = v * level;
    rows.push({ id: b.id, type: b.type, name: def.name, level, gain });
  }
  return rows;
}
