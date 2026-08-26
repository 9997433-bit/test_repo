import { furnitureById } from "../data/furniture.js";
import { spendInv } from "./store.js";

const LOG_MAX = 40;

/**
 * 家具还没有 village 侧的入口，先在 core 里放一层薄壳：
 * 摆过的家具只记 id（`state.furniture`，老档缺这个字段就当空数组），
 * 温馨在摆放时一次性加满，之后由 applyFurnitureWarmth 兜住下限，
 * 免得跨日衰减把「永久 +温馨」的家具吃掉。
 */
export function placedFurniture(state) {
  return Array.isArray(state?.furniture) ? state.furniture : [];
}

export function isPlaced(state, furnitureId) {
  return placedFurniture(state).includes(furnitureId);
}

/** 已摆家具的温馨总和，也是 resources.warmth 的下限。 */
export function furnitureWarmth(state) {
  return placedFurniture(state).reduce((sum, id) => sum + (furnitureById(id)?.warmth || 0), 0);
}

export function applyFurnitureWarmth(state) {
  const floor = furnitureWarmth(state);
  if (!floor) return state;
  const warmth = state?.resources?.warmth || 0;
  if (warmth >= floor) return state;
  return { ...state, resources: { ...state.resources, warmth: floor } };
}

/** coin/pearl 之类记在 resources，布匹羊毛之类记在 inv，与建造同一套扣费规则。 */
function splitCost(state, cost = {}) {
  const resCost = {};
  const invCost = {};
  for (const [k, v] of Object.entries(cost)) {
    if (Object.prototype.hasOwnProperty.call(state.resources || {}, k)) resCost[k] = v;
    else invCost[k] = v;
  }
  return { resCost, invCost };
}

export function placeFurniture(state, { furnitureId } = {}) {
  const def = furnitureById(furnitureId);
  if (!def) return { ok: false, reason: "没有这件家具", state };
  if (isPlaced(state, furnitureId)) return { ok: false, reason: "这件已经摆上了", state };
  if ((state.meta?.level || 1) < def.unlockLevel) return { ok: false, reason: "小镇等级不够", state };

  const { resCost, invCost } = splitCost(state, def.cost);
  for (const [k, v] of Object.entries(resCost)) {
    if ((state.resources?.[k] || 0) < v) return { ok: false, reason: "金币或材料不够", state };
  }
  const spent = Object.keys(invCost).length ? spendInv(state, invCost) : { ok: true, state };
  if (!spent.ok) return { ok: false, reason: "库存不够", state };

  const resources = { ...spent.state.resources };
  for (const [k, v] of Object.entries(resCost)) resources[k] -= v;
  resources.warmth = (resources.warmth || 0) + def.warmth;

  return {
    ok: true,
    warmth: def.warmth,
    state: {
      ...spent.state,
      resources,
      furniture: [...placedFurniture(spent.state), def.id],
      log: [`${def.name}摆上了，屋里一下有了住的样子。`, ...(spent.state.log || [])].slice(0, LOG_MAX),
    },
  };
}
