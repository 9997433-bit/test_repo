import { ITEM_NAMES, WISH_POOL } from "../../data/wishes.js";
import { GUESTS, guestById } from "../../data/guests.js";
import { BUILDINGS, buildingById } from "../../data/buildings.js";
import { recipeById } from "../../data/recipes.js";
import { dishByRecipe } from "../../data/dishes.js";
import { priceOf, stallPrice, STALL_MARKUP } from "../../data/items.js";
import { addInv, spendInv } from "../../core/store.js";
import { pickWeighted, rollWith } from "./rng.js";

export const WISH_SLOTS = 3;
export const WISH_REFRESH_HOURS = 2;
export const WISH_EXPIRE_DAYS = 3;
export const PET_COOLDOWN_MS = 20_000;

const HOUR_MS_FALLBACK = 6_000;
const HAPPINESS_STEP = 10;
const HAPPINESS_BONUS_PER_STEP = 0.04;
const MAX_HAPPINESS_BONUS = 1;
const BASE_DARK_CHANCE = 0.08;
const DEFAULT_DISH_WARMTH = 6;
const DEFAULT_DISH_HAPPINESS = 3;
const FAVORITE_WARMTH = 8;
const GUEST_BASE_STAY_DAYS = 2;
const GUEST_STAY_PER_WARMTH = 20;
const WISH_TOOL_CHANCE = 0.35;
const WISH_PEARL_CHANCE = 0.04;
const CAP_POP_PER_BUILDING = 4;
const LOG_MAX = 40;

const TOOL_WEIGHTS = [
  ["shovel", 0.4],
  ["axe", 0.35],
  ["saw", 0.25],
];
const TOOL_NAMES = { shovel: "一把锹", axe: "一把斧子", saw: "一把锯子", pearl: "一颗珍珠" };

function pushLog(state, line) {
  return [line, ...(state.log || [])].slice(0, LOG_MAX);
}

function villageMeta(state) {
  const v = state.village || {};
  return {
    wishSeq: v.wishSeq || 0,
    nextWishAt: v.nextWishAt || 0,
    cooked: v.cooked || 0,
    darkDishes: v.darkDishes || 0,
    lastDay: v.lastDay || state.meta?.day || 1,
  };
}

function withVillage(state, patch) {
  return { ...state, village: { ...(state.village || {}), ...villageMeta(state), ...patch } };
}

function normalizeMood(resources) {
  return {
    ...resources,
    happiness: Math.max(0, Math.round(resources.happiness || 0)),
    warmth: Math.max(0, Math.round(resources.warmth || 0)),
  };
}

/** 幸福指数每 10 点，心愿金币 +4%（封顶 +100%）。 */
export function happinessMult(state) {
  const happiness = Math.max(0, state.resources?.happiness || 0);
  const bonus = Math.min(
    MAX_HAPPINESS_BONUS,
    Math.floor(happiness / HAPPINESS_STEP) * HAPPINESS_BONUS_PER_STEP,
  );
  return 1 + bonus;
}

/* ---------------------------------------------------------------- 嘉宾 */

/** 蘑菇屋自带 1 个位子，Lv.4 再开 1 个，客房再加 2 个。 */
export function guestCapacity(state) {
  const level = state.meta?.level || 1;
  let cap = 1;
  if (level >= 4) cap += 1;
  if (state.buildings?.guestroom?.built) cap += 2;
  return cap;
}

function guestBuffFactor(state, target) {
  for (const seat of state.guests || []) {
    const def = guestById(seat.id);
    if (def?.buff?.target === target) return def.buff.factor;
  }
  return 1;
}

function stayDays(state) {
  const warmth = Math.max(0, state.resources?.warmth || 0);
  return GUEST_BASE_STAY_DAYS + Math.floor(warmth / GUEST_STAY_PER_WARMTH);
}

function guestUntil(seat, day) {
  return seat.untilDay || (seat.sinceDay || day) + GUEST_BASE_STAY_DAYS;
}

/* ---------------------------------------------------------------- 心愿 */

function isActiveWish(wish) {
  return Boolean(wish) && wish.status !== "done";
}

function findWish(state, wishId) {
  if (!wishId) return null;
  return (state.wishes || []).find((w) => w && (w.wishId === wishId || w.id === wishId)) || null;
}

export function wishCandidates(state) {
  const level = state.meta?.level || 1;
  const pool = WISH_POOL.filter((w) => (w.maxLevel ?? 99) >= level);
  return pool.length ? pool : WISH_POOL;
}

/** 需求量与奖励随小镇等级抬一档，Lv.4 之前保持基线。 */
function wishTier(level) {
  return Math.min(3, 1 + Math.max(0, Math.floor((level - 4) / 3)));
}

function makeWish(base, state, seq) {
  const day = state.meta?.day || 1;
  const tier = wishTier(state.meta?.level || 1);
  const needs = {};
  for (const [id, n] of Object.entries(base.needs)) needs[id] = n * tier;
  return {
    ...base,
    wishId: `${base.id}_d${day}_${seq}`,
    needs,
    coin: Math.round(base.coin * tier * (tier > 1 ? 1.1 : 1)),
    xp: Math.round(base.xp * tier),
    tier,
    status: "open",
    createdDay: day,
  };
}

function wishIntervalMs(state) {
  const hourMs = state.meta?.hourMs || HOUR_MS_FALLBACK;
  return Math.max(1_000, Math.round(WISH_REFRESH_HOURS * hourMs * guestBuffFactor(state, "wish")));
}

function fillWishes(state, maxAdd, nowMs) {
  const all = state.wishes || [];
  const open = all.filter(isActiveWish);
  const add = Math.min(WISH_SLOTS - open.length, Math.max(0, maxAdd));
  if (add <= 0) return open.length === all.length ? state : { ...state, wishes: open };

  const candidates = wishCandidates(state);
  if (!candidates.length) return state;

  const day = state.meta?.day || 1;
  const taken = new Set(open.map((w) => w.id));
  const wishes = [...open];
  let seq = villageMeta(state).wishSeq;
  for (let i = 0; i < add; i += 1) {
    seq += 1;
    // 按「日期 + 板位」轮转心愿池，遇到板上已有的同款就顺延一格，免得三格挂着同一件事。
    const start = day + wishes.length;
    let base = candidates[start % candidates.length];
    for (let step = 0; step < candidates.length; step += 1) {
      const candidate = candidates[(start + step) % candidates.length];
      if (!taken.has(candidate.id)) {
        base = candidate;
        break;
      }
    }
    taken.add(base.id);
    wishes.push(makeWish(base, state, seq));
  }
  return withVillage({ ...state, wishes }, { wishSeq: seq, nextWishAt: nowMs + wishIntervalMs(state) });
}

/** 把心愿屋补满 3 单。 */
export function refreshWishes(state, nowMs = Date.now()) {
  return fillWishes(state, WISH_SLOTS, nowMs);
}

export function acceptWish(state, { wishId } = {}) {
  const wish = findWish(state, wishId);
  if (!wish) return { ok: false, reason: "心愿不见了", state };
  if (wish.status === "accepted") return { ok: false, reason: "这单已经接下了", state };
  const accepted = { ...wish, status: "accepted" };
  const wishes = state.wishes.map((w) => (w === wish ? accepted : w));
  return { ok: true, wish: accepted, state: { ...state, wishes } };
}

export function deliverWish(state, { wishId, rng } = {}) {
  const wish = findWish(state, wishId);
  if (!wish) return { ok: false, reason: "心愿不见了", state };
  if (!isActiveWish(wish)) return { ok: false, reason: "这单已经交过了", state };
  const spent = spendInv(state, wish.needs || {});
  if (!spent.ok) return { ok: false, reason: "东西还没收齐", state };

  const coins = Math.max(1, Math.round((wish.coin || 0) * happinessMult(state)));
  const resources = {
    ...spent.state.resources,
    coin: (spent.state.resources.coin || 0) + coins,
    happiness: (spent.state.resources.happiness || 0) + 1,
  };

  // 锹 / 斧 / 锯只有心愿屋会掉，没有它们后面的作坊根本盖不起来。
  const gifts = [];
  if (rollWith(rng, "wish-gift", wish.wishId, wish.id, wish.coin) < WISH_TOOL_CHANCE) {
    const tool = pickWeighted(TOOL_WEIGHTS, rollWith(rng, "wish-tool", wish.wishId, wish.id));
    resources[tool] = (resources[tool] || 0) + 1;
    gifts.push(TOOL_NAMES[tool]);
  }
  if (rollWith(rng, "wish-pearl", wish.wishId, wish.id, wish.xp) < WISH_PEARL_CHANCE) {
    resources.pearl = (resources.pearl || 0) + 1;
    gifts.push(TOOL_NAMES.pearl);
  }

  const next = {
    ...spent.state,
    resources: normalizeMood(resources),
    meta: { ...spent.state.meta, xp: (spent.state.meta?.xp || 0) + (wish.xp || 0) },
    wishes: (spent.state.wishes || []).filter((w) => w !== wish),
    log: pushLog(
      spent.state,
      `心愿达成：${wish.name}，收入 ${coins} 金币${gifts.length ? `，还捎来${gifts.join("、")}` : ""}`,
    ),
  };
  return { ok: true, coins, gifts, state: refreshWishes(next) };
}

/* ---------------------------------------------------------------- 待客 */

export function inviteGuest(state, { guestId } = {}) {
  const def = guestById(guestId);
  if (!def) return { ok: false, reason: "村里没这个人", state };
  const guests = state.guests || [];
  if (guests.some((g) => g.id === guestId)) return { ok: false, reason: "已经在屋里坐着", state };
  const cap = guestCapacity(state);
  if (guests.length >= cap) {
    return { ok: false, reason: `屋里只坐得下 ${cap} 位，先添间客房`, state };
  }
  const day = state.meta?.day || 1;
  const until = day + stayDays(state);
  return {
    ok: true,
    state: {
      ...state,
      guests: [...guests, { id: guestId, sinceDay: day, untilDay: until }],
      resources: normalizeMood({ ...state.resources, warmth: (state.resources?.warmth || 0) + 4 }),
      log: pushLog(state, `${def.name}推门进来，把鞋上的泥拍了拍。说是住到第${until}日。`),
    },
  };
}

function extendStay(guests, guestId, days) {
  return (guests || []).map((g) => (g.id === guestId ? { ...g, untilDay: (g.untilDay || 0) + days } : g));
}

export function cook(state, { recipeId, guestId, rng } = {}) {
  const recipe = recipeById(recipeId);
  if (!recipe || recipe.buildingId !== "kitchen") return { ok: false, reason: "厨房不会做这个", state };
  if (!state.buildings?.kitchen?.built) return { ok: false, reason: "厨房还没盖起来", state };
  if ((state.meta?.level || 1) < recipe.unlockLevel) return { ok: false, reason: "小镇等级不够", state };
  const spent = spendInv(state, recipe.inputs);
  if (!spent.ok) return { ok: false, reason: "食材不够，别让客人饿着", state };

  const meta = villageMeta(state);
  // 没有注入 rng 时，翻车与否由存档自身决定，同一状态永远得到同一锅菜。
  const roll = rollWith(
    rng,
    "cook",
    recipeId,
    guestId || "-",
    state.meta?.day || 1,
    Math.floor(state.meta?.gameMinutes || 0),
    meta.cooked,
  );
  const dark = roll < BASE_DARK_CHANCE;
  const guest = guestById(guestId);
  const favorite = !dark && Boolean(guest) && guest.favorite === recipe.outputId;

  // 上桌加成来自 data/dishes.js；没登记的菜按老口径 +6 / +3。
  const dish = dishByRecipe(recipeId);
  const servedWarmth = dish ? dish.warmth : DEFAULT_DISH_WARMTH;
  const servedHappiness = dish ? dish.happiness : DEFAULT_DISH_HAPPINESS;

  const next = addInv(spent.state, recipe.outputId, recipe.outputQty);
  const resources = normalizeMood({
    ...next.resources,
    warmth: (next.resources?.warmth || 0) + (dark ? -1 : servedWarmth) + (favorite ? FAVORITE_WARMTH : 0),
    happiness: (next.resources?.happiness || 0) + (dark ? -2 : servedHappiness) + (favorite ? 2 : 0),
  });
  const guests = favorite ? extendStay(next.guests, guestId, 1) : next.guests;
  const line = dark
    ? "锅里冒出一缕可疑的烟……黑暗料理诞生了。"
    : favorite
      ? `一盘${recipe.name}正对${guest.name}的胃口，说要多留一天。`
      : `一盘${recipe.name}上桌，屋里更暖了。`;

  return {
    ok: true,
    dark,
    favorite,
    state: withVillage(
      { ...next, resources, guests, log: pushLog(next, line) },
      { cooked: meta.cooked + 1, darkDishes: meta.darkDishes + (dark ? 1 : 0) },
    ),
  };
}

/* ---------------------------------------------------------------- 村建 */

function splitCost(state, cost) {
  const resCost = {};
  const invCost = {};
  for (const [k, v] of Object.entries(cost || {})) {
    if (Object.prototype.hasOwnProperty.call(state.resources || {}, k)) resCost[k] = v;
    else invCost[k] = v;
  }
  return { resCost, invCost };
}

export function build(state, { buildingId } = {}) {
  const def = buildingById(buildingId);
  if (!def) return { ok: false, reason: "没有这种建筑", state };
  if (state.buildings?.[buildingId]?.built) return { ok: false, reason: "已经有了", state };
  if ((state.meta?.level || 1) < def.unlockLevel) return { ok: false, reason: "小镇等级不够", state };

  const pop = state.resources?.pop || 0;
  const popCap = state.resources?.popCap || 0;
  if (def.popNeed && pop < def.popNeed) {
    return { ok: false, reason: `人手不够，要 ${def.popNeed} 个人才张罗得起来`, state };
  }
  if (def.kind === "pop" && pop >= popCap) {
    return { ok: false, reason: "人口到顶了，先盖社区", state };
  }

  const { resCost, invCost } = splitCost(state, def.cost);
  for (const [k, v] of Object.entries(resCost)) {
    if ((state.resources?.[k] || 0) < v) return { ok: false, reason: "建材或金币不够", state };
  }
  const spent = Object.keys(invCost).length ? spendInv(state, invCost) : { ok: true, state };
  if (!spent.ok) return { ok: false, reason: "库存不够", state };

  const resources = { ...spent.state.resources };
  for (const [k, v] of Object.entries(resCost)) resources[k] -= v;
  if (def.kind === "pop") resources.pop = Math.min(popCap, pop + 1);
  if (def.kind === "cap") resources.popCap = popCap + CAP_POP_PER_BUILDING;

  const moved = def.kind === "pop" ? "，又多了一户人家" : def.kind === "cap" ? "，村子住得下更多人了" : "";
  return {
    ok: true,
    state: {
      ...spent.state,
      resources: normalizeMood(resources),
      buildings: {
        ...spent.state.buildings,
        [buildingId]: { built: true, slots: [], slotCount: def.slots || 0 },
      },
      log: pushLog(spent.state, `${def.name}立起来了${moved}。`),
    },
  };
}

/* ---------------------------------------------------------------- 萌宠 */

export function petPlay(state, { petId, now = Date.now() } = {}) {
  const pet = (state.pets || []).find((p) => p.id === petId);
  if (!pet) return { ok: false, reason: "它跑去田埂了", state };
  if ((pet.readyAt || 0) > now) return { ok: false, reason: "它还想再躺会儿", state };

  const coin = 3 + (state.buildings?.petyard?.built ? 2 : 0);
  const happiness = pet.kind === "cat" ? 2 : 1;
  const pets = state.pets.map((p) => (p.id === petId ? { ...p, readyAt: now + PET_COOLDOWN_MS } : p));
  return {
    ok: true,
    coin,
    state: {
      ...state,
      pets,
      resources: normalizeMood({
        ...state.resources,
        coin: (state.resources?.coin || 0) + coin,
        happiness: (state.resources?.happiness || 0) + happiness,
      }),
      log: pushLog(state, `你摸了摸${pet.name}的脑袋。`),
    },
  };
}

/* ---------------------------------------------------------------- 摆摊 */

export function stallSell(state, { itemId, qty = 1 } = {}) {
  if (!state.buildings?.stall?.built) return { ok: false, reason: "摊位还没支起来", state };
  const n = Math.floor(Number(qty));
  if (!Number.isFinite(n) || n < 1) return { ok: false, reason: "至少也得摆一件出去", state };
  if ((state.inv?.[itemId] || 0) < n) return { ok: false, reason: "货不够", state };
  if (!priceOf(itemId)) return { ok: false, reason: "这东西没人收", state };

  // 茶婆婆坐镇（buff.target === "stall"，factor > 1）时能多卖出一点。
  const coin = Math.round(stallPrice(itemId, n) * guestBuffFactor(state, "stall"));
  const next = addInv(state, itemId, -n);
  return {
    ok: true,
    coin,
    state: {
      ...next,
      resources: normalizeMood({ ...next.resources, coin: (next.resources?.coin || 0) + coin }),
      log: pushLog(next, `摊上卖掉 ${ITEM_NAMES[itemId] || itemId}×${n}，收进 ${coin} 金币。`),
    },
  };
}

/* ---------------------------------------------------------------- 心跳 */

function rolloverDays(state) {
  const meta = villageMeta(state);
  const day = state.meta?.day || 1;
  if (day <= meta.lastDay) return state.village ? state : withVillage(state, { lastDay: day });

  const elapsed = day - meta.lastDay;
  const guests = state.guests || [];
  const staying = guests.filter((g) => guestUntil(g, day) >= day);
  const left = guests.filter((g) => !staying.includes(g));

  // 挂太久没人管的心愿会被撤下，否则等级不够的单子会一直占着板位。
  const wishes = (state.wishes || []).filter(isActiveWish);
  const kept = wishes.filter((w) => day - (w.createdDay || day) < WISH_EXPIRE_DAYS);
  const dropped = wishes.length - kept.length;

  let next = {
    ...state,
    guests: staying,
    wishes: kept,
    resources: normalizeMood({ ...state.resources, warmth: (state.resources?.warmth || 0) - elapsed }),
  };
  for (const seat of left) {
    const def = guestById(seat.id);
    if (def) next = { ...next, log: pushLog(next, `${def.name}收拾好行李，说下回再来。`) };
  }
  if (dropped) next = { ...next, log: pushLog(next, `${dropped} 条心愿等太久，被从墙上取了下来。`) };
  return withVillage(next, { lastDay: day });
}

function refillWishSlot(state, nowMs) {
  const open = (state.wishes || []).filter(isActiveWish);
  if (open.length >= WISH_SLOTS) return state;
  if (!open.length) return refreshWishes(state, nowMs);
  const meta = villageMeta(state);
  if (!meta.nextWishAt) return withVillage(state, { nextWishAt: nowMs + wishIntervalMs(state) });
  if (nowMs < meta.nextWishAt) return state;
  return fillWishes(state, 1, nowMs);
}

export function tickVillage(state, _dtMs, nowMs = Date.now()) {
  return refillWishSlot(rolloverDays(state), nowMs);
}

export { GUESTS, BUILDINGS, priceOf, stallPrice, STALL_MARKUP };
