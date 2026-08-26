import {
  ITEM_NAMES,
  WISH_POOL,
  WISH_PEARL_DROP,
  WISH_REFRESH_MIN,
  WISH_TOOL_DROP,
  TOOL_DROP_WEIGHTS,
  TOOL_PITY_DROUGHT,
  TOOL_PITY_ORDER,
} from "../../data/wishes.js";
import { GUESTS, guestById } from "../../data/guests.js";
import { BUILDINGS, buildingById } from "../../data/buildings.js";
import { recipeById, recipesByBuilding } from "../../data/recipes.js";
import { dishById, dishByOutput, dishByRecipe } from "../../data/dishes.js";
import { FURNITURE, furnitureById } from "../../data/furniture.js";
import { priceOf, stallPrice, STALL_MARKUP } from "../../data/items.js";
import { addInv, spendInv } from "../../core/store.js";
import { furnitureWarmth, isPlaced, placedFurniture } from "../../core/furniture.js";
import { pickWeighted, rollWith } from "./rng.js";

const MINUTES_PER_HOUR = 60;

export const WISH_SLOTS = 3;
/** 数值事实源是 data/wishes.js 的 WISH_REFRESH_MIN（120 游戏分钟），这里只换算成游戏时。 */
export const WISH_REFRESH_HOURS = WISH_REFRESH_MIN / MINUTES_PER_HOUR;
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
const GUEST_MAX_STAY_DAYS = 4;
const GUEST_STAY_PER_WARMTH = 20;
const CAP_POP_PER_BUILDING = 4;
const LOG_MAX = 40;
// docs/GDD.md「家具与温馨」的两级阈值：一屋子暖气换一格心愿位、换一次加倍出菜。
const COOK_CRIT_WARMTH = 60;
const COOK_CRIT_CHANCE = 0.1;
const WISH_BONUS_SLOT_WARMTH = 100;
const MIN_BUFF_FACTOR = 0.5;
const MAX_BUFF_FACTOR = 2;

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
    // 工具保底的两个计数：pityStep = 开局必掉序列走到第几步，drought = 连续几单没见工具。
    pityStep: v.pityStep || 0,
    drought: v.drought || 0,
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

/**
 * 在座嘉宾里所有 buff.target 命中的系数连乘，钳在 [0.5, 2]。
 * 契约 §8 的应用点里村落占三个：wish（灯哥 0.85 缩短补位间隔）、stall（茶婆婆 1.1 抬售价）、
 * kitchen（灶台叔叔 0.8 压低 cook 翻车率）；kitchen 的另一半——厨房工单时长——在
 * production.enqueueJob 上消费，两处互不重叠。
 */
export function guestBuffFactor(state, target) {
  let factor = 1;
  for (const seat of state.guests || []) {
    const def = guestById(seat?.id);
    if (def?.buff?.target === target) factor *= def.buff.factor;
  }
  return Math.min(MAX_BUFF_FACTOR, Math.max(MIN_BUFF_FACTOR, factor));
}

function stayDays(state) {
  const warmth = Math.max(0, state.resources?.warmth || 0);
  return GUEST_BASE_STAY_DAYS + Math.floor(warmth / GUEST_STAY_PER_WARMTH);
}

function guestUntil(seat, day) {
  return seat.untilDay || (seat.sinceDay || day) + GUEST_BASE_STAY_DAYS;
}

/* ---------------------------------------------------------------- 家具 */

/**
 * 家具的规范实现在 core/furniture.js（契约 §5.9）：落盘是家具 id 的字符串数组，
 * 买家具走 core 的 placeFurniture。村落这边只借读取端算温馨保底盘（rolloverDays 日衰减），
 * 导出名保留给读过旧版的调用方。
 */
export { placedFurniture, furnitureWarmth };
export { isPlaced as hasFurniture };

/* ---------------------------------------------------------------- 心愿 */

function isActiveWish(wish) {
  return Boolean(wish) && wish.status !== "done";
}

function findWish(state, wishId) {
  if (!wishId) return null;
  return (state.wishes || []).find((w) => w && (w.wishId === wishId || w.id === wishId)) || null;
}

/** 温馨度 ≥100 时心愿墙常驻第 4 格（GDD「家具与温馨」阈值）。 */
export function wishSlots(state) {
  const warmth = Math.max(0, state.resources?.warmth || 0);
  return WISH_SLOTS + (warmth >= WISH_BONUS_SLOT_WARMTH ? 1 : 0);
}

/** 只留 minLevel ≤ 当前等级 ≤ maxLevel 的单子：Lv.1 不该抽到暖锅，满级也不该被引导单占位。 */
export function wishCandidates(state) {
  const level = state.meta?.level || 1;
  const inRange = WISH_POOL.filter(
    (w) => (w.minLevel ?? 1) <= level && (w.maxLevel ?? 99) >= level,
  );
  if (inRange.length) return inRange;
  // 数据表被改坏时的兜底：宁可给一张够得着的旧单，也不要空墙。
  const unlocked = WISH_POOL.filter((w) => (w.minLevel ?? 1) <= level);
  return unlocked.length ? unlocked : WISH_POOL;
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

function wrap(index, length) {
  return ((index % length) + length) % length;
}

function fillWishes(state, maxAdd, nowMs) {
  const all = state.wishes || [];
  const open = all.filter(isActiveWish);
  const add = Math.min(wishSlots(state) - open.length, Math.max(0, maxAdd));
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
    // 池子现在按等级过滤，Lv.1 只剩 4 条（晒谷/白菜/泡豆子/两把麦子），
    // 所以首屏是「白菜、泡豆子、两把麦子」，晒谷第 2 日轮上——四样都出自 Lv.1 作物。
    const start = day + wishes.length;
    let base = candidates[wrap(start, candidates.length)];
    for (let step = 0; step < candidates.length; step += 1) {
      const candidate = candidates[wrap(start + step, candidates.length)];
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

/** 把心愿屋补满（默认 3 单，温馨度够高时 4 单）。 */
export function refreshWishes(state, nowMs = Date.now()) {
  return fillWishes(state, wishSlots(state), nowMs);
}

export function acceptWish(state, { wishId } = {}) {
  const wish = findWish(state, wishId);
  if (!wish) return { ok: false, reason: "心愿不见了", state };
  if (wish.status === "accepted") return { ok: false, reason: "这单已经接下了", state };
  const accepted = { ...wish, status: "accepted" };
  const wishes = state.wishes.map((w) => (w === wish ? accepted : w));
  return { ok: true, wish: accepted, state: { ...state, wishes } };
}

/**
 * 锹 / 斧 / 锯只有心愿屋会掉，没有它们后面的作坊根本盖不起来，所以掉率带两级保底
 * （口径与常量都在 data/wishes.js）：
 * 1) 新档前三单按 TOOL_PITY_ORDER 必掉 斧 → 锯 → 锹，正好解锁磨坊 / 饲料厂 / 鸡舍；
 * 2) 之后基础 WISH_TOOL_DROP，连续 TOOL_PITY_DROUGHT 单空手则下一单按权重必掉。
 * 有效掉率 ≈ 0.29，通关 70–90 单期望 23–29 件，对上全程工具需求。
 */
function drawTool(state, wish, rng) {
  const { pityStep, drought } = villageMeta(state);
  const byWeight = () =>
    pickWeighted(TOOL_DROP_WEIGHTS, rollWith(rng, "wish-tool", wish.wishId, wish.id));

  if (pityStep < TOOL_PITY_ORDER.length) {
    return { tool: TOOL_PITY_ORDER[pityStep], pityStep: pityStep + 1, drought: 0 };
  }
  if (drought >= TOOL_PITY_DROUGHT) return { tool: byWeight(), pityStep, drought: 0 };
  if (rollWith(rng, "wish-gift", wish.wishId, wish.id, wish.coin) < WISH_TOOL_DROP) {
    return { tool: byWeight(), pityStep, drought: 0 };
  }
  return { tool: null, pityStep, drought: drought + 1 };
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

  const gifts = [];
  const drawn = drawTool(state, wish, rng);
  if (drawn.tool) {
    resources[drawn.tool] = (resources[drawn.tool] || 0) + 1;
    gifts.push(TOOL_NAMES[drawn.tool]);
  }
  if (rollWith(rng, "wish-pearl", wish.wishId, wish.id, wish.xp) < WISH_PEARL_DROP) {
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
  // 交完不当场补满：空出来的格子留给 tickVillage 每 2 游戏时补 1 位的节拍（契约 §5.1），
  // 否则灯哥的补位 buff 与整个节奏设计都只在过期/换单路径上生效。
  return {
    ok: true,
    coins,
    gifts,
    state: withVillage(next, { pityStep: drawn.pityStep, drought: drawn.drought }),
  };
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
  return (guests || []).map((g) => {
    if (g.id !== guestId) return g;
    // 最爱可以留客，但留不成常住户：封在进门后第 4 天。
    const cap = (g.sinceDay || 0) + GUEST_MAX_STAY_DAYS;
    const until = g.untilDay || 0;
    return { ...g, untilDay: Math.max(until, Math.min(cap, until + days)) };
  });
}

/**
 * 支持三种写法：配方 id（"dish_hotpot"）、菜品 id、产物 id（"hotpot"）。
 * 只认厨房出品，别的作坊配方一律不接。
 */
export function kitchenRecipe(recipeId) {
  if (!recipeId) return null;
  const direct = recipeById(recipeId);
  if (direct?.buildingId === "kitchen") return direct;
  const dish = dishById(recipeId) || dishByOutput(recipeId);
  const viaDish = dish ? recipeById(dish.recipeId) : null;
  if (viaDish?.buildingId === "kitchen") return viaDish;
  return recipesByBuilding("kitchen").find((r) => r.outputId === recipeId) || null;
}

/** 厨房能做的所有菜，带上呈现层数据，供 UI 直接铺菜单。 */
export function kitchenMenu(state) {
  const level = state.meta?.level || 1;
  return recipesByBuilding("kitchen").map((recipe) => {
    const dish = dishByRecipe(recipe.id);
    return {
      recipeId: recipe.id,
      name: dish?.name || recipe.name,
      outputId: recipe.outputId,
      inputs: recipe.inputs,
      warmth: dish ? dish.warmth : DEFAULT_DISH_WARMTH,
      happiness: dish ? dish.happiness : DEFAULT_DISH_HAPPINESS,
      desc: dish?.desc || "",
      unlocked: level >= recipe.unlockLevel,
      unlockLevel: recipe.unlockLevel,
    };
  });
}

export function cook(state, { recipeId, dishId, guestId, rng } = {}) {
  const recipe = kitchenRecipe(recipeId || dishId);
  if (!recipe) return { ok: false, reason: "厨房不会做这个", state };
  if (!state.buildings?.kitchen?.built) return { ok: false, reason: "厨房还没盖起来", state };
  if ((state.meta?.level || 1) < recipe.unlockLevel) return { ok: false, reason: "小镇等级不够", state };
  const spent = spendInv(state, recipe.inputs);
  if (!spent.ok) return { ok: false, reason: "食材不够，别让客人饿着", state };

  const meta = villageMeta(state);
  const warmth = Math.max(0, state.resources?.warmth || 0);
  // 没有注入 rng 时，翻车与否由存档自身决定，同一状态永远得到同一锅菜。
  const seed = [recipe.id, guestId || "-", state.meta?.day || 1, Math.floor(state.meta?.gameMinutes || 0), meta.cooked];
  // 灶台叔叔坐镇时翻车率 8% → 6.4%（契约 §8 的 kitchen 应用点，工时那半边在 enqueueJob）。
  const dark = rollWith(rng, "cook", ...seed) < BASE_DARK_CHANCE * guestBuffFactor(state, "kitchen");
  const crit =
    !dark && warmth >= COOK_CRIT_WARMTH && rollWith(rng, "cook-crit", ...seed) < COOK_CRIT_CHANCE;
  const guest = guestById(guestId);
  const favorite = !dark && Boolean(guest) && guest.favorite === recipe.outputId;

  // 上桌加成来自 data/dishes.js；没登记的菜按老口径 +6 / +3。
  const dish = dishByRecipe(recipe.id);
  const servedWarmth = dish ? dish.warmth : DEFAULT_DISH_WARMTH;
  const servedHappiness = dish ? dish.happiness : DEFAULT_DISH_HAPPINESS;

  const qty = recipe.outputQty * (crit ? 2 : 1);
  const next = addInv(spent.state, recipe.outputId, qty);
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
      : crit
        ? `屋里暖和，手也稳，${recipe.name}一锅出了两份。`
        : `一盘${recipe.name}上桌，屋里更暖了。`;

  return {
    ok: true,
    dark,
    favorite,
    crit,
    qty,
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
  if (!priceOf(itemId)) return { ok: false, reason: "这个卖不出价", state };

  // 茶婆婆坐镇（buff.target === "stall"，factor 1.1）时能多卖出一点。
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

  // 每日 −1 温馨，但摆出来的家具是保底盘，掉不到它以下。
  const floor = furnitureWarmth(state);
  const warmth = Math.max(floor, (state.resources?.warmth || 0) - elapsed);

  let next = {
    ...state,
    guests: staying,
    wishes: kept,
    resources: normalizeMood({ ...state.resources, warmth }),
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
  const meta = villageMeta(state);
  // 板满时把计时器停掉。不停的话它会在满板期间一路走过期，交完单的下一帧就立刻补位，
  // 等于把刚拆掉的「交付即补满」又装了回去；停表后每个空位都从空出来的那一刻起算 2 游戏时。
  if (open.length >= wishSlots(state)) {
    return meta.nextWishAt ? withVillage(state, { nextWishAt: 0 }) : state;
  }
  if (!open.length) return refreshWishes(state, nowMs);
  if (!meta.nextWishAt) return withVillage(state, { nextWishAt: nowMs + wishIntervalMs(state) });
  if (nowMs < meta.nextWishAt) return state;
  return fillWishes(state, 1, nowMs);
}

export function tickVillage(state, _dtMs, nowMs = Date.now()) {
  return refillWishSlot(rolloverDays(state), nowMs);
}

export { GUESTS, BUILDINGS, FURNITURE, furnitureById, priceOf, stallPrice, STALL_MARKUP };
