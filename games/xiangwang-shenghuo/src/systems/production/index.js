import { recipeById } from "../../data/recipes.js";
import { animalByBuilding, WINTER_FEED_SURCHARGE } from "../../data/animals.js";
import { buildingById } from "../../data/buildings.js";
import { guestById } from "../../data/guests.js";
import { addInv, hasInv, spendInv } from "../../core/store.js";

export const MAX_SLOTS = 6;

/** 产量零头攒着不丢，竹仔的 1.1 倍长期真能兑现出那多出来的一成。 */
const CARRY_EPSILON = 1e-9;

/** 冬天牲口多吃两成：每次投喂记 0.2 的账，攒满一份才真的多扣一件饲料。数值事实源在 data/animals.js。 */
export { WINTER_FEED_SURCHARGE };

const BUFF_MIN = 0.5;
const BUFF_MAX = 2;

function jobList(state) {
  return Array.isArray(state?.jobs) ? state.jobs : [];
}

/** 活儿没收走就一直占着工位；"collected" 只在旧档里出现。 */
function holdsSlot(job) {
  return !!job && job.status !== "collected";
}

function jobsIn(state, buildingId) {
  return jobList(state).filter((j) => j && j.buildingId === buildingId);
}

function activeJobs(state, buildingId) {
  return jobsIn(state, buildingId).filter(holdsSlot);
}

function positive(value) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : 0;
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

/** 同一份 state + 同一个时刻只会得出同一个 id：不掷骰子，回放与存档才对得上。 */
function makeJobId(state, prefix, nowMs) {
  const taken = new Set(jobList(state).map((j) => j?.id));
  const stamp = Math.max(0, Math.floor(Number(nowMs) || 0)).toString(36);
  for (let n = 0; ; n += 1) {
    const id = `${prefix}_${stamp}_${n}`;
    if (!taken.has(id)) return id;
  }
}

/** 在座嘉宾同 target 的 buff 连乘，钳在 [0.5, 2]。core/buffs.js 落地后这里改成薄封装。 */
function guestBuffFactor(state, target) {
  const guests = Array.isArray(state?.guests) ? state.guests : [];
  const raw = guests.reduce((mult, entry) => {
    const buff = guestById(entry?.id ?? entry)?.buff;
    if (!buff || buff.target !== target) return mult;
    const factor = Number(buff.factor);
    return Number.isFinite(factor) && factor > 0 ? mult * factor : mult;
  }, 1);
  return Math.min(BUFF_MAX, Math.max(BUFF_MIN, raw));
}

/** 在座的竹仔这类嘉宾按 buff 系数抬高畜产量。 */
export function livestockYieldMultiplier(state) {
  return guestBuffFactor(state, "livestock");
}

function productionState(state) {
  const raw = state?.production;
  return raw && typeof raw === "object" ? raw : {};
}

/** Round 1 这里存的是一个共用数字，旧档就把它当作下一次投喂那种牲口的起始零头。 */
function livestockCarryBuckets(state) {
  const raw = productionState(state).livestockCarry;
  return raw && typeof raw === "object" ? raw : {};
}

/** 每种畜产品各记各的余数，喂鸡攒下的零头不会跑去补牛奶。 */
export function livestockCarry(state, productId) {
  const raw = productionState(state).livestockCarry;
  if (raw && typeof raw === "object") return positive(raw[productId]);
  return positive(raw);
}

function writeLivestockCarry(state, productId, carry) {
  const buckets = { ...livestockCarryBuckets(state) };
  if (carry > CARRY_EPSILON) buckets[productId] = carry;
  else delete buckets[productId];
  return buckets;
}

function drawYield(state, productId, base, mult) {
  const total = livestockCarry(state, productId) + base * mult;
  const qty = Math.max(1, Math.floor(total + CARRY_EPSILON));
  return { qty, carry: Math.max(0, total - qty) };
}

export function winterFeedCarry(state) {
  return positive(productionState(state).winterFeedCarry);
}

function drawFeedCost(state, season) {
  const accrued = winterFeedCarry(state) + (season === "winter" ? WINTER_FEED_SURCHARGE : 0);
  const extra = Math.floor(accrued + CARRY_EPSILON);
  return { need: 1 + extra, carry: Math.max(0, accrued - extra) };
}

/** 查询：这一口下去要扣几份饲料（冬天攒够零头的那次是 2）。没有牲口的建筑返回 0。 */
export function feedCost(state, buildingId) {
  if (!animalByBuilding(buildingId)) return 0;
  return drawFeedCost(state, state?.meta?.season).need;
}

export function canCraft(state, recipeId) {
  const recipe = recipeById(recipeId);
  if (!recipe || !state) return false;
  if ((state.meta?.level || 0) < recipe.unlockLevel) return false;
  if (!state.buildings?.[recipe.buildingId]?.built) return false;
  return hasInv(state, recipe.inputs || {});
}

export function enqueueJob(state, { buildingId, recipeId } = {}, nowMs = Date.now()) {
  const recipe = recipeById(recipeId);
  if (!recipe || recipe.buildingId !== buildingId) return { ok: false, reason: "配方不对", state };
  if (!state.buildings?.[buildingId]?.built) return { ok: false, reason: "还没建这座作坊", state };
  if ((state.meta?.level || 0) < recipe.unlockLevel) return { ok: false, reason: "小镇等级不够", state };
  const slot = pickSlot(state, buildingId, undefined);
  if (slot < 0) return { ok: false, reason: "生产位满了", state };
  const spent = spendInv(state, recipe.inputs || {});
  if (!spent.ok) return { ok: false, reason: "原料不够", state };
  // buff target 与 buildingId 同名，一行同时管住灶台叔叔（kitchen 0.8）和苇姐（weavery 0.85）；没人对口就是 1 倍。
  const timeMs = Math.max(1, Math.round(recipe.timeMs * guestBuffFactor(state, buildingId)));
  const job = {
    id: makeJobId(state, "job", nowMs),
    buildingId,
    recipeId,
    kind: "craft",
    status: "running",
    doneAt: nowMs + timeMs,
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

function isLivestockJob(job, recipe, animal) {
  if (job?.kind === "livestock") return true;
  return !recipe && !!animal;
}

/**
 * job.xp 是入队时的快照，但旧档（或配方表后来才补上 xp）会留 0。
 * 这时回落到配方/动物表当下的 xp，别让玩家白干一单。
 */
function collectXp(job, recipe, animal) {
  const snapshot = positive(job?.xp);
  if (snapshot > 0) return snapshot;
  const fromRecipe = positive(recipe?.xp);
  if (fromRecipe > 0) return fromRecipe;
  if (isLivestockJob(job, recipe, animal)) return positive(animal?.xp);
  return 0;
}

export function collectJob(state, { buildingId, slot } = {}) {
  const job = findJob(state, buildingId, slot);
  if (!job) return { ok: false, reason: "没有这单活", state };
  if (job.status !== "done") return { ok: false, reason: "还在忙", state };
  const recipe = recipeById(job.recipeId);
  const animal = animalByBuilding(job.buildingId);
  const productId =
    job.productId || recipe?.outputId || (isLivestockJob(job, recipe, animal) ? animal?.productId : null);
  const rawQty = Number.isFinite(job.qty)
    ? job.qty
    : recipe?.outputQty ?? (isLivestockJob(job, recipe, animal) ? 1 : 0);
  const qty = Math.max(0, Math.floor(rawQty));
  if (!productId || qty <= 0) return { ok: false, reason: "这单活坏了", state };
  let next = addInv(state, productId, qty);
  const xp = collectXp(job, recipe, animal);
  if (xp > 0) next = { ...next, meta: { ...next.meta, xp: (next.meta?.xp || 0) + xp } };
  // 按数组位置删：旧档里可能有好几单共用一个 id。
  const at = jobList(next).indexOf(job);
  return { ok: true, state: { ...next, jobs: jobList(next).filter((_, i) => i !== at) } };
}

export function feedAnimal(state, { buildingId, slot } = {}, nowMs = Date.now()) {
  const animal = animalByBuilding(buildingId);
  if (!animal) return { ok: false, reason: "这里不养牲口", state };
  if (!state.buildings?.[buildingId]?.built) return { ok: false, reason: "还没建", state };
  const pen = pickSlot(state, buildingId, slot);
  if (pen < 0) return { ok: false, reason: "圈里满了", state };
  const feed = drawFeedCost(state, state.meta?.season);
  const spent = spendInv(state, { [animal.feedId]: feed.need });
  // 扣料失败时两个余数桶都不动，玩家不会因为一次没喂上就白记一笔冬账。
  if (!spent.ok) return { ok: false, reason: "饲料不够", state };
  const drawn = drawYield(spent.state, animal.productId, 1, livestockYieldMultiplier(spent.state));
  const job = {
    id: makeJobId(spent.state, "live", nowMs),
    buildingId,
    recipeId: animal.id,
    kind: "livestock",
    status: "running",
    doneAt: nowMs + animal.cycleMs,
    slot: pen,
    productId: animal.productId,
    qty: drawn.qty,
    xp: animal.xp,
  };
  return {
    ok: true,
    state: {
      ...spent.state,
      jobs: [...jobList(spent.state), job],
      production: {
        ...productionState(spent.state),
        livestockCarry: writeLivestockCarry(spent.state, animal.productId, drawn.carry),
        winterFeedCarry: feed.carry,
      },
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
