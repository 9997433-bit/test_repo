import { SHOPS, PARTNERS, OUTFITS } from "../data/balance.js";
import { nextLevelReady } from "../data/balance.js";
import { loadSave, writeSave } from "./save.js";
import { settleOffline, totalOnlinePerSec } from "./economy.js";

function emptyShops() {
  const shops = {};
  for (const shop of SHOPS) {
    shops[shop.id] = {
      unlocked: shop.unlockLevel <= 1,
      level: 1,
      staff: 0,
      auto: false,
      assignees: [],
    };
  }
  return shops;
}

export function defaultState() {
  return {
    name: "未命名老板",
    introDone: false,
    gold: 40,
    goldEarned: 40,
    xp: 0,
    level: 1,
    shards: 0,
    outfit: {
      hair: OUTFITS.hair[0],
      top: OUTFITS.top[0],
      bottom: OUTFITS.bottom[0],
      shoes: OUTFITS.shoes[0],
      acc: OUTFITS.acc[0],
    },
    furniture: [],
    shops: emptyShops(),
    partners: PARTNERS.map((p, i) => ({
      ...p,
      owned: i === 0,
      level: 1,
      assigned: i === 0 ? "fastfood" : null,
    })),
    researchDone: [],
    lastTick: Date.now(),
    goal: { target: 600, until: Date.now() + 8 * 60 * 1000, done: false },
    toast: "",
  };
}

export function hydrate() {
  const raw = loadSave();
  const state = { ...defaultState(), ...(raw?.data || raw || {}) };
  if (!state.shops) state.shops = emptyShops();
  const offline = settleOffline(state);
  if (offline.gold > 0) {
    grantGold(state, offline.gold);
    state.toast = `离线 ${offline.hours.toFixed(1)} 小时，到账 ${offline.gold}`;
  }
  state.lastTick = Date.now();
  syncUnlocks(state);
  return state;
}

export function persist(state) {
  state.lastTick = Date.now();
  writeSave(state);
}

export function grantGold(state, n) {
  state.gold += n;
  state.goldEarned += n;
}

export function grantXp(state, n) {
  state.xp += n;
}

export function syncUnlocks(state) {
  for (const shop of SHOPS) {
    if (state.level >= shop.unlockLevel) state.shops[shop.id].unlocked = true;
  }
  for (const p of state.partners) {
    if (p.assigned && state.shops[p.assigned]) {
      const list = state.shops[p.assigned].assignees;
      if (!list.includes(p.id)) list.push(p.id);
    }
  }
}

export function tryLevelUp(state) {
  if (!nextLevelReady(state.level, state.goldEarned, state.xp)) return false;
  state.level += 1;
  syncUnlocks(state);
  return true;
}

export function tick(state, dtSec) {
  const rate = totalOnlinePerSec(state);
  grantGold(state, rate * dtSec);
  if (!state.goal.done && state.goldEarned >= state.goal.target) {
    state.goal.done = true;
    grantXp(state, 25);
    grantGold(state, 200);
    state.toast = "限时经营目标完成！阅历+25";
  }
  tryLevelUp(state);
}
