import { WISH_POOL } from "../../data/wishes.js";
import { GUESTS, guestById } from "../../data/guests.js";
import { BUILDINGS, buildingById } from "../../data/buildings.js";
import { recipeById } from "../../data/recipes.js";
import { addInv, hasInv, spendInv } from "../../core/store.js";

function happinessMult(state) {
  return 1 + Math.floor((state.resources.happiness || 0) / 10) * 0.04;
}

export function refreshWishes(state) {
  const open = (state.wishes || []).filter((w) => w.status === "open");
  const need = 3 - open.length;
  if (need <= 0) return state;
  const pool = WISH_POOL.filter((w) => w.maxLevel >= 1);
  const extra = [];
  for (let i = 0; i < need; i += 1) {
    const base = pool[(state.meta.day + i + open.length) % pool.length];
    extra.push({ ...base, wishId: `${base.id}_${state.meta.day}_${i}`, status: "open" });
  }
  return { ...state, wishes: [...open, ...extra] };
}

export function acceptWish(state, { wishId }) {
  return { ok: true, state };
}

export function deliverWish(state, { wishId }) {
  const wish = (state.wishes || []).find((w) => w.wishId === wishId || w.id === wishId);
  if (!wish) return { ok: false, reason: "心愿不见了", state };
  if (!hasInv(state, wish.needs)) return { ok: false, reason: "东西还没收齐", state };
  let next = spendInv(state, wish.needs).state;
  const coins = Math.round(wish.coin * happinessMult(state));
  next = {
    ...next,
    resources: { ...next.resources, coin: next.resources.coin + coins },
    meta: { ...next.meta, xp: next.meta.xp + wish.xp },
    wishes: next.wishes.filter((w) => w.wishId !== wish.wishId),
    log: [`心愿达成：${wish.name}，收入 ${coins} 金币`, ...next.log].slice(0, 40),
  };
  return { ok: true, state: refreshWishes(next) };
}

export function inviteGuest(state, { guestId }) {
  const g = guestById(guestId);
  if (!g) return { ok: false, reason: "村里没这个人", state };
  if ((state.guests || []).some((x) => x.id === guestId)) return { ok: false, reason: "已经在屋里坐着", state };
  return {
    ok: true,
    state: {
      ...state,
      guests: [...(state.guests || []), { id: guestId, sinceDay: state.meta.day }],
      resources: { ...state.resources, warmth: state.resources.warmth + 4 },
      log: [`${g.name}推门进来，把鞋上的泥拍了拍。`, ...state.log].slice(0, 40),
    },
  };
}

export function cook(state, { recipeId, guestId }) {
  const recipe = recipeById(recipeId);
  if (!recipe || recipe.buildingId !== "kitchen") return { ok: false, reason: "厨房不会做这个", state };
  const spent = spendInv(state, recipe.inputs);
  if (!spent.ok) return { ok: false, reason: "食材不够，别让客人饿着", state };
  const guest = guestById(guestId);
  const dark = Math.random() < 0.08;
  let warmth = spent.state.resources.warmth + (dark ? -1 : 6);
  let happiness = spent.state.resources.happiness + (dark ? -2 : 3);
  if (guest?.favorite === recipe.outputId) warmth += 8;
  const next = addInv(spent.state, recipe.outputId, recipe.outputQty);
  return {
    ok: true,
    dark,
    state: {
      ...next,
      resources: { ...next.resources, warmth, happiness },
      log: [dark ? "锅里冒出一缕可疑的烟……黑暗料理诞生了。" : `一盘${recipe.name}上桌，屋里更暖了。`, ...next.log].slice(0, 40),
    },
  };
}

export function build(state, { buildingId }) {
  const def = buildingById(buildingId);
  if (!def) return { ok: false, reason: "没有这种建筑", state };
  if (state.buildings[buildingId]?.built) return { ok: false, reason: "已经有了", state };
  if (state.meta.level < def.unlockLevel) return { ok: false, reason: "小镇等级不够", state };
  const cost = def.cost || {};
  const invCost = {};
  const resCost = {};
  for (const [k, v] of Object.entries(cost)) {
    if (k === "coin" || k === "pearl" || k === "shovel" || k === "axe" || k === "saw") resCost[k] = v;
    else invCost[k] = v;
  }
  for (const [k, v] of Object.entries(resCost)) {
    if ((state.resources[k] || 0) < v) return { ok: false, reason: "建材或金币不够", state };
  }
  const spent = Object.keys(invCost).length ? spendInv(state, invCost) : { ok: true, state };
  if (!spent.ok) return { ok: false, reason: "库存不够", state };
  const resources = { ...spent.state.resources };
  for (const [k, v] of Object.entries(resCost)) resources[k] -= v;
  if (def.kind === "pop") resources.pop += 1;
  if (def.kind === "cap") resources.popCap += 4;
  return {
    ok: true,
    state: {
      ...spent.state,
      resources,
      buildings: { ...spent.state.buildings, [buildingId]: { built: true, slots: [], slotCount: def.slots || 0 } },
      log: [`${def.name}立起来了。`, ...spent.state.log].slice(0, 40),
    },
  };
}

export function petPlay(state, { petId }) {
  const now = Date.now();
  const pets = (state.pets || []).map((p) => {
    if (p.id !== petId) return p;
    if (p.readyAt > now) return p;
    return { ...p, readyAt: now + 20_000 };
  });
  const pet = state.pets.find((p) => p.id === petId);
  if (!pet) return { ok: false, reason: "它跑去田埂了", state };
  if (pet.readyAt > now) return { ok: false, reason: "它还想再躺会儿", state };
  return {
    ok: true,
    state: {
      ...state,
      pets,
      resources: { ...state.resources, coin: state.resources.coin + 3, happiness: state.resources.happiness + 1 },
      log: [`你摸了摸${pet.name}的脑袋。`, ...state.log].slice(0, 40),
    },
  };
}

export function stallSell(state, { itemId, qty = 1 }) {
  if (!state.buildings.stall?.built) return { ok: false, reason: "摊位还没支起来", state };
  if ((state.inv[itemId] || 0) < qty) return { ok: false, reason: "货不够", state };
  const price = 8 * qty;
  const next = addInv(state, itemId, -qty);
  return {
    ok: true,
    state: {
      ...next,
      resources: { ...next.resources, coin: next.resources.coin + Math.round(price * 1.15) },
    },
  };
}

export function tickVillage(state) {
  return refreshWishes(state);
}

export { GUESTS, BUILDINGS };
