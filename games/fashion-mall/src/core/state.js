import * as BALANCE from "../data/balance.js";
import { SHOPS, PARTNERS, OUTFITS, nextLevelReady } from "../data/balance.js";
import { readSaveData, writeSave } from "./save.js";
import { settleOffline, totalOnlinePerSec, outfitItem } from "./economy.js";

/** 间隔 ≤ 该值按在线全额记账，超过按离线倍率结算。 */
export const ONLINE_GAP_MAX_SEC = 30;

const GOAL_WINDOW_MS = 8 * 60 * 1000;
const GOAL_BASE_DELTA = 560;
const GOAL_TIER_GROWTH = 1.35;
const GOAL_REWARD_RATIO = 0.35;

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

export function defaultState(now = Date.now()) {
  const state = {
    name: "未命名老板",
    introDone: false,
    gold: 40,
    goldEarned: 40,
    xp: 0,
    level: 1,
    shards: 0,
    muted: false,
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
    lastTick: now,
    goal: { tier: 1, target: 600, until: now + GOAL_WINDOW_MS, reward: { gold: 200, xp: 25 } },
    toast: "",
  };
  syncUnlocks(state);
  return state;
}

/**
 * 存档 data（全 id 形态）→ 运行时 state。按 SHOPS/PARTNERS/OUTFITS 当前表逐 id
 * 深回填，新增店铺/伙伴/槽位自动补默认值，不会因老档缺键炸掉。
 */
export function fromSaveData(data, now = Date.now()) {
  const base = defaultState(now);
  if (!data || typeof data !== "object") return base;

  const state = {
    ...base,
    name: typeof data.name === "string" && data.name ? data.name : base.name,
    introDone: !!data.introDone,
    gold: numOr(data.gold, base.gold),
    goldEarned: numOr(data.goldEarned, base.goldEarned),
    xp: numOr(data.xp, base.xp),
    level: Math.max(1, Math.trunc(numOr(data.level, base.level))),
    shards: Math.max(0, Math.trunc(numOr(data.shards, base.shards))),
    muted: !!data.muted,
    lastTick: Math.trunc(numOr(data.lastTick, now)),
    toast: "",
  };

  state.outfit = {};
  for (const slot of Object.keys(OUTFITS)) {
    state.outfit[slot] = outfitItem(slot, data.outfit?.[slot]) || OUTFITS[slot][0];
  }

  state.furniture = Array.isArray(data.furniture)
    ? BALANCE.FURNITURE.filter((f) => data.furniture.includes(f.id)).map((f) => f.id)
    : [];
  state.researchDone = Array.isArray(data.researchDone)
    ? BALANCE.RESEARCH_NODES.filter((n) => data.researchDone.includes(n.id)).map((n) => n.id)
    : [];

  state.shops = emptyShops();
  for (const shop of SHOPS) {
    const saved = data.shops?.[shop.id];
    if (!saved || typeof saved !== "object") continue;
    const slot = state.shops[shop.id];
    if (typeof saved.unlocked === "boolean") slot.unlocked = saved.unlocked;
    slot.level = Math.max(1, Math.trunc(numOr(saved.level, 1)));
    slot.staff = Math.min(shop.staffSlots, Math.max(0, Math.trunc(numOr(saved.staff, 0))));
    slot.auto = !!saved.auto;
  }

  const savedPartners = new Map(
    (Array.isArray(data.partners) ? data.partners : [])
      .filter((p) => p && typeof p.id === "string")
      .map((p) => [p.id, p]),
  );
  state.partners = PARTNERS.map((def, i) => {
    const saved = savedPartners.get(def.id);
    const assigned = saved?.assigned;
    return {
      ...def,
      owned: typeof saved?.owned === "boolean" ? saved.owned : i === 0 && !saved,
      level: Math.max(1, Math.trunc(numOr(saved?.level, 1))),
      assigned: typeof assigned === "string" && state.shops[assigned] ? assigned : null,
    };
  });

  state.goal = normalizeGoal(data.goal, state, now);
  syncUnlocks(state);
  return state;
}

function numOr(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function normalizeGoal(goal, state, now) {
  if (!goal || typeof goal !== "object") return rollNextGoal(state, now, true);
  const target = numOr(goal.target, NaN);
  const until = numOr(goal.until, NaN);
  if (!Number.isFinite(target) || !Number.isFinite(until)) return rollNextGoal(state, now, true);
  return {
    tier: Math.max(1, Math.trunc(numOr(goal.tier, 1))),
    target,
    until: Math.trunc(until),
    reward: {
      gold: Math.max(0, Math.trunc(numOr(goal.reward?.gold, 0))),
      xp: Math.max(0, Math.trunc(numOr(goal.reward?.xp, 0))),
    },
  };
}

export function hydrate(now = Date.now()) {
  const { data, corrupt } = readSaveData();
  let state;
  try {
    state = fromSaveData(data, now);
  } catch {
    state = defaultState(now);
  }
  const result = settle(state, now);
  if (result.mode === "offline" && result.gold > 0) {
    state.toast = `离线 ${result.hours.toFixed(1)} 小时，到账 ${Math.floor(result.gold)}`;
  }
  for (const note of result.notes) state.toast = note;
  if (corrupt) state.toast = "旧存档无法识别，已备份原档并开新档";
  syncUnlocks(state);
  return state;
}

/** 只负责落盘；lastTick 由 settle 独占推进，persist 不再偷改时间。 */
export function persist(state) {
  return writeSave(state);
}

export function grantGold(state, n) {
  const amount = Number(n);
  if (!Number.isFinite(amount) || amount === 0) return 0;
  state.gold += amount;
  if (amount > 0) state.goldEarned += amount;
  return amount;
}

export function grantXp(state, n) {
  const amount = Number(n);
  if (!Number.isFinite(amount)) return 0;
  state.xp += amount;
  return amount;
}

/** 伙伴驻店的单一事实来源是 partner.assigned；assignees 只是派生缓存。 */
export function syncUnlocks(state) {
  for (const shop of SHOPS) {
    const slot = state.shops[shop.id];
    if (!slot) continue;
    if (state.level >= shop.unlockLevel) slot.unlocked = true;
    slot.assignees = [];
  }
  for (const p of state.partners || []) {
    if (!p?.owned || !p.assigned) continue;
    const slot = state.shops[p.assigned];
    if (slot && !slot.assignees.includes(p.id)) slot.assignees.push(p.id);
  }
}

export function tryLevelUp(state) {
  let leveled = false;
  while (nextLevelReady(state.level, state.goldEarned, state.xp)) {
    state.level += 1;
    leveled = true;
  }
  if (leveled) syncUnlocks(state);
  return leveled;
}

/**
 * 生成下一档限时目标。数值曲线归 F3：`data/balance.js` 一旦导出 rollNextGoal
 * 就自动接管，未导出时用本地保守曲线兜底。
 */
export function rollNextGoal(state, now = Date.now(), reset = false, success = true) {
  if (typeof BALANCE.rollNextGoal === "function") {
    const goal = BALANCE.rollNextGoal(state, now, success);
    if (goal && Number.isFinite(Number(goal.target)) && Number.isFinite(Number(goal.until))) {
      return {
        tier: Math.max(1, Math.trunc(numOr(goal.tier, 1))),
        target: Number(goal.target),
        until: Math.trunc(Number(goal.until)),
        reward: {
          gold: Math.max(0, Math.trunc(numOr(goal.reward?.gold, 0))),
          xp: Math.max(0, Math.trunc(numOr(goal.reward?.xp, 0))),
        },
      };
    }
  }
  const prevTier = reset ? 0 : Math.max(1, Math.trunc(state.goal?.tier || 1));
  const tier = Math.max(1, reset ? 1 : prevTier + (success ? 1 : -1));
  const rate = Math.max(0, totalOnlinePerSec(state));
  const delta = Math.max(
    Math.round(GOAL_BASE_DELTA * GOAL_TIER_GROWTH ** (tier - 1)),
    Math.round((rate * GOAL_WINDOW_MS) / 1000 / 1.5),
  );
  return {
    tier,
    target: Math.floor(state.goldEarned + delta),
    until: now + GOAL_WINDOW_MS,
    reward: { gold: Math.round(delta * GOAL_REWARD_RATIO), xp: 20 + tier * 5 },
  };
}

/**
 * 限时目标成环：达标发奖并升档续期，超时降档续期。返回通知列表供视图弹 toast。
 */
export function advanceGoal(state, now = Date.now()) {
  const notes = [];
  if (!state.goal) {
    state.goal = rollNextGoal(state, now, true);
    return notes;
  }
  // 一次结算可能跨越多档（离线追帧），循环直到出现未达标且未超时的目标。
  for (let guard = 0; guard < 32; guard += 1) {
    const goal = state.goal;
    if (state.goldEarned >= goal.target) {
      const reward = goal.reward || { gold: 0, xp: 0 };
      grantGold(state, reward.gold);
      grantXp(state, reward.xp);
      if (reward.gold || reward.xp) {
        notes.push(`限时目标达成，奖励 ${Math.floor(reward.gold)} 金 · 阅历+${reward.xp}`);
      }
      state.goal = rollNextGoal(state, now, false, true);
      continue;
    }
    if (now > goal.until) {
      state.goal = rollNextGoal(state, now, false, false);
      notes.push("限时目标超时，换成更稳的一档重新开张");
      continue;
    }
    break;
  }
  return notes;
}

/** 单次结算管线：收入 → 目标 → 等级/解锁 → 通知。不写 lastTick。 */
export function tick(state, dtSec, now = Date.now()) {
  const before = state.goldEarned;
  const rate = totalOnlinePerSec(state);
  if (dtSec > 0) grantGold(state, rate * dtSec);
  const notes = advanceGoal(state, now);
  tryLevelUp(state);
  return { gold: state.goldEarned - before, notes };
}

/**
 * 唯一推进 state.lastTick 与时间收益的函数。短间隔按在线全额、长间隔按离线倍率，
 * 后台节流导致的大 dt 因此不再丢收益，也不会比关页更划算。
 */
export function settle(state, now = Date.now()) {
  const last = Number.isFinite(state.lastTick) ? state.lastTick : now;
  const dtSec = (now - last) / 1000;
  if (dtSec <= 0) {
    // 时钟回拨：钳为 0 并对齐，避免账目冻结或凭空发钱。
    state.lastTick = Math.min(last, now);
    return { gold: 0, hours: 0, mode: "none", notes: [] };
  }
  if (dtSec <= ONLINE_GAP_MAX_SEC) {
    const r = tick(state, dtSec, now);
    state.lastTick = now;
    return { gold: r.gold, hours: dtSec / 3600, mode: "online", notes: r.notes };
  }
  const offline = settleOffline(state, now);
  grantGold(state, offline.gold);
  state.lastTick = now;
  const notes = advanceGoal(state, now);
  tryLevelUp(state);
  return { gold: offline.gold, hours: offline.hours, mode: "offline", notes };
}
