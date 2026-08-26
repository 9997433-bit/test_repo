import { recipeById } from "../../data/recipes.js";
import { animalByBuilding } from "../../data/animals.js";
import { buildingById } from "../../data/buildings.js";
import { guestById } from "../../data/guests.js";
import { addInv, hasInv, spendInv } from "../../core/store.js";

export const MAX_SLOTS = 6;

/** Fractional yields are carried between collections, so a x1.1 buff really pays out. */
const CARRY_EPSILON = 1e-9;

function jobList(state) {
  return Array.isArray(state?.jobs) ? state.jobs : [];
}

/** A job holds its slot until it is collected; "collected" only shows up in old saves. */
function holdsSlot(job) {
  return !!job && job.status !== "collected";
}

function jobsIn(state, buildingId) {
  return jobList(state).filter((j) => j && j.buildingId === buildingId);
}

function activeJobs(state, buildingId) {
  return jobsIn(state, buildingId).filter(holdsSlot);
}

export function buildingSlots(state, buildingId) {
  const def = buildingById(buildingId);
  const built = state?.buildings?.[buildingId];
  const raw = Number.isFinite(built?.slotCount) ? built.slotCount : def?.slots;
  if (!Number.isFinite(raw)) return 0;
  return Math.max(0, Math.min(MAX_SLOTS, Math.floor(raw)));
}

export function freeSlots(state, buildingId) {
  return Math.max(0, buildingSlots(state, buildingId) - activeJobs(state, buildingId).length);
}

function pickSlot(state, buildingId, preferred) {
  const cap = buildingSlots(state, buildingId);
  const active = activeJobs(state, buildingId);
  if (active.length >= cap) return -1;
  const taken = new Set(active.map((j) => j.slot).filter((n) => Number.isInteger(n)));
  if (Number.isInteger(preferred) && preferred >= 0 && preferred < cap && !taken.has(preferred)) return preferred;
  for (let i = 0; i < cap; i += 1) if (!taken.has(i)) return i;
  return -1;
}

function makeJobId(state, prefix) {
  const taken = new Set(jobList(state).map((j) => j?.id));
  const stamp = Date.now().toString(36);
  for (let n = 0; ; n += 1) {
    const id = `${prefix}_${stamp}_${Math.random().toString(36).slice(2, 6)}${n ? `${n}` : ""}`;
    if (!taken.has(id)) return id;
  }
}

/** Resident guests such as 竹仔 lift livestock output by their buff factor. */
export function livestockYieldMultiplier(state) {
  const guests = Array.isArray(state?.guests) ? state.guests : [];
  return guests.reduce((mult, entry) => {
    const buff = guestById(entry?.id ?? entry)?.buff;
    if (!buff || buff.target !== "livestock") return mult;
    const factor = Number(buff.factor);
    return Number.isFinite(factor) && factor > 0 ? mult * factor : mult;
  }, 1);
}

function drawYield(state, base, mult) {
  const carry = Number.isFinite(state?.production?.livestockCarry) ? state.production.livestockCarry : 0;
  const total = carry + base * mult;
  let qty = Math.floor(total + CARRY_EPSILON);
  if (qty < 1) qty = 1;
  return { qty, carry: Math.max(0, total - qty) };
}

export function canCraft(state, recipeId) {
  const recipe = recipeById(recipeId);
  if (!recipe || !state) return false;
  if ((state.meta?.level || 0) < recipe.unlockLevel) return false;
  if (!state.buildings?.[recipe.buildingId]?.built) return false;
  return hasInv(state, recipe.inputs || {});
}

export function enqueueJob(state, { buildingId, recipeId } = {}) {
  const recipe = recipeById(recipeId);
  if (!recipe || recipe.buildingId !== buildingId) return { ok: false, reason: "配方不对", state };
  if (!state.buildings?.[buildingId]?.built) return { ok: false, reason: "还没建这座作坊", state };
  if ((state.meta?.level || 0) < recipe.unlockLevel) return { ok: false, reason: "小镇等级不够", state };
  const slot = pickSlot(state, buildingId, undefined);
  if (slot < 0) return { ok: false, reason: "生产位满了", state };
  const spent = spendInv(state, recipe.inputs || {});
  if (!spent.ok) return { ok: false, reason: "原料不够", state };
  const now = Date.now();
  const job = {
    id: makeJobId(state, "job"),
    buildingId,
    recipeId,
    kind: "craft",
    status: "running",
    doneAt: now + recipe.timeMs,
    slot,
    productId: recipe.outputId,
    qty: recipe.outputQty,
    xp: recipe.xp || 0,
  };
  return { ok: true, state: { ...spent.state, jobs: [...jobList(spent.state), job] } };
}

function findJob(state, buildingId, slot) {
  const scoped = buildingId == null ? jobList(state) : jobsIn(state, buildingId);
  if (typeof slot === "string") return scoped.find((j) => j.id === slot) || null;
  if (Number.isInteger(slot)) return scoped.find((j) => j.slot === slot) || scoped[slot] || null;
  return scoped.find((j) => j.status === "done") || null;
}

export function collectJob(state, { buildingId, slot } = {}) {
  const job = findJob(state, buildingId, slot);
  if (!job) return { ok: false, reason: "没有这单活", state };
  if (job.status !== "done") return { ok: false, reason: "还在忙", state };
  const recipe = recipeById(job.recipeId);
  const animal = animalByBuilding(job.buildingId);
  const productId = job.productId || recipe?.outputId || (job.kind === "livestock" ? animal?.productId : null);
  const rawQty = Number.isFinite(job.qty) ? job.qty : recipe?.outputQty ?? (job.kind === "livestock" ? 1 : 0);
  const qty = Math.max(0, Math.floor(rawQty));
  if (!productId || qty <= 0) return { ok: false, reason: "这单活坏了", state };
  let next = addInv(state, productId, qty);
  const xp = Number.isFinite(job.xp) ? job.xp : 0;
  if (xp > 0) next = { ...next, meta: { ...next.meta, xp: (next.meta?.xp || 0) + xp } };
  // Removed by position: old saves can hold several jobs sharing one id.
  const at = jobList(next).indexOf(job);
  return { ok: true, state: { ...next, jobs: jobList(next).filter((_, i) => i !== at) } };
}

export function feedAnimal(state, { buildingId, slot } = {}) {
  const animal = animalByBuilding(buildingId);
  if (!animal) return { ok: false, reason: "这里不养牲口", state };
  if (!state.buildings?.[buildingId]?.built) return { ok: false, reason: "还没建", state };
  const pen = pickSlot(state, buildingId, slot);
  if (pen < 0) return { ok: false, reason: "圈里满了", state };
  const spent = spendInv(state, { [animal.feedId]: 1 });
  if (!spent.ok) return { ok: false, reason: "饲料不够", state };
  const { qty, carry } = drawYield(spent.state, 1, livestockYieldMultiplier(spent.state));
  const now = Date.now();
  const job = {
    id: makeJobId(spent.state, "live"),
    buildingId,
    recipeId: animal.id,
    kind: "livestock",
    status: "running",
    doneAt: now + animal.cycleMs,
    slot: pen,
    productId: animal.productId,
    qty,
    xp: animal.xp,
  };
  return {
    ok: true,
    state: {
      ...spent.state,
      jobs: [...jobList(spent.state), job],
      production: { ...(spent.state.production || {}), livestockCarry: carry },
    },
  };
}

export function unlockSlot(state, { buildingId } = {}) {
  const built = state.buildings?.[buildingId];
  if (!built?.built) return { ok: false, reason: "还没建", state };
  const def = buildingById(buildingId);
  if (!def?.slots) return { ok: false, reason: "这里没有工位", state };
  const current = buildingSlots(state, buildingId);
  if (current >= MAX_SLOTS) return { ok: false, reason: "已经满了", state };
  const cost = 40 + current * 20;
  if ((state.resources?.coin || 0) < cost) return { ok: false, reason: "金币不够", state };
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
  const jobs = jobList(state)
    .filter((j) => j && j.status !== "collected")
    .map((j) => (j.status === "running" && now >= j.doneAt ? { ...j, status: "done" } : j));
  return { ...state, jobs };
}
