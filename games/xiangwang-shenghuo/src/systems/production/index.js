import { recipeById } from "../../data/recipes.js";
import { animalByBuilding } from "../../data/animals.js";
import { buildingById } from "../../data/buildings.js";
import { addInv, hasInv, spendInv } from "../../core/store.js";

function buildingSlots(state, buildingId) {
  const def = buildingById(buildingId);
  const built = state.buildings[buildingId];
  const base = built?.slotCount || def?.slots || 2;
  return base;
}

export function canCraft(state, recipeId) {
  const recipe = recipeById(recipeId);
  if (!recipe) return false;
  if (state.meta.level < recipe.unlockLevel) return false;
  if (!state.buildings[recipe.buildingId]?.built) return false;
  return hasInv(state, recipe.inputs);
}

export function enqueueJob(state, { buildingId, recipeId }) {
  const recipe = recipeById(recipeId);
  if (!recipe || recipe.buildingId !== buildingId) return { ok: false, reason: "配方不对", state };
  if (!state.buildings[buildingId]?.built) return { ok: false, reason: "还没建这座作坊", state };
  if (state.meta.level < recipe.unlockLevel) return { ok: false, reason: "小镇等级不够", state };
  const active = state.jobs.filter((j) => j.buildingId === buildingId && j.status !== "collected");
  if (active.length >= buildingSlots(state, buildingId)) return { ok: false, reason: "生产位满了", state };
  const spent = spendInv(state, recipe.inputs);
  if (!spent.ok) return { ok: false, reason: "原料不够", state };
  const now = Date.now();
  const job = {
    id: `job_${now}_${Math.random().toString(36).slice(2, 6)}`,
    buildingId,
    recipeId,
    status: "running",
    doneAt: now + recipe.timeMs,
  };
  return { ok: true, state: { ...spent.state, jobs: [...spent.state.jobs, job] } };
}

export function collectJob(state, { buildingId, slot }) {
  const jobs = state.jobs.filter((j) => j.buildingId === buildingId);
  const job = typeof slot === "string" ? state.jobs.find((j) => j.id === slot) : jobs[slot];
  if (!job) return { ok: false, reason: "没有这单活", state };
  if (job.status !== "done") return { ok: false, reason: "还在忙", state };
  const recipe = recipeById(job.recipeId);
  let next = addInv(state, recipe.outputId, recipe.outputQty);
  next = { ...next, jobs: next.jobs.filter((j) => j.id !== job.id) };
  return { ok: true, state: next };
}

export function feedAnimal(state, { buildingId, slot }) {
  const animal = animalByBuilding(buildingId);
  if (!animal) return { ok: false, reason: "这里不养牲口", state };
  if (!state.buildings[buildingId]?.built) return { ok: false, reason: "还没建", state };
  const spent = spendInv(state, { [animal.feedId]: 1 });
  if (!spent.ok) return { ok: false, reason: "饲料不够", state };
  const now = Date.now();
  const job = {
    id: `live_${now}_${slot || 0}`,
    buildingId,
    recipeId: animal.id,
    status: "running",
    doneAt: now + animal.cycleMs,
    kind: "livestock",
    productId: animal.productId,
    qty: 1,
    xp: animal.xp,
  };
  return { ok: true, state: { ...spent.state, jobs: [...spent.state.jobs, job] } };
}

export function unlockSlot(state, { buildingId }) {
  const built = state.buildings[buildingId];
  if (!built?.built) return { ok: false, reason: "还没建", state };
  const def = buildingById(buildingId);
  const current = built.slotCount || def.slots || 2;
  if (current >= 6) return { ok: false, reason: "已经满了", state };
  const cost = 40 + current * 20;
  if (state.resources.coin < cost) return { ok: false, reason: "金币不够", state };
  return {
    ok: true,
    state: {
      ...state,
      resources: { ...state.resources, coin: state.resources.coin - cost },
      buildings: {
        ...state.buildings,
        [buildingId]: { ...built, slotCount: current + 1 },
      },
    },
  };
}

export function tickProduction(state, _dtMs, now = Date.now()) {
  const jobs = state.jobs.map((j) => {
    if (j.status === "running" && now >= j.doneAt) return { ...j, status: "done" };
    return j;
  });
  return { ...state, jobs };
}
