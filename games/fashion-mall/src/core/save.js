import { SHOPS, PARTNERS, OUTFITS, FURNITURE, RESEARCH_NODES } from "../data/balance.js";

export const KEY = "fashion-mall-save-v1";
export const CORRUPT_KEY = "fashion-mall-save-v1.corrupt";
export const CURRENT_VERSION = 2;

const OUTFIT_SLOTS = Object.keys(OUTFITS);
const FURNITURE_IDS = new Set(FURNITURE.map((f) => f.id));
const RESEARCH_IDS = new Set(RESEARCH_NODES.map((n) => n.id));
const SHOP_IDS = new Set(SHOPS.map((s) => s.id));

function num(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function int(value, fallback) {
  return Math.trunc(num(value, fallback));
}

function store() {
  return typeof localStorage === "undefined" ? null : localStorage;
}

/** 道具槽位统一存 id：兼容 v1 的整对象与 v2 的字符串。 */
function itemId(value) {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && typeof value.id === "string") return value.id;
  return null;
}

function outfitToIds(outfit) {
  const out = {};
  for (const slot of OUTFIT_SLOTS) {
    const id = itemId(outfit?.[slot]);
    out[slot] = OUTFITS[slot].some((i) => i.id === id) ? id : OUTFITS[slot][0].id;
  }
  return out;
}

function partnersToIds(partners) {
  const saved = new Map();
  for (const p of Array.isArray(partners) ? partners : []) {
    const id = itemId(p);
    if (id) saved.set(id, p);
  }
  return PARTNERS.map((def, i) => {
    const p = saved.get(def.id) || {};
    const assigned = typeof p.assigned === "string" && SHOP_IDS.has(p.assigned) ? p.assigned : null;
    return {
      id: def.id,
      owned: typeof p.owned === "boolean" ? p.owned : i === 0,
      level: Math.max(1, int(p.level, 1)),
      assigned,
    };
  });
}

function shopsToIds(shops) {
  const out = {};
  for (const shop of SHOPS) {
    const s = shops?.[shop.id] || {};
    out[shop.id] = {
      unlocked: typeof s.unlocked === "boolean" ? s.unlocked : shop.unlockLevel <= 1,
      level: Math.max(1, int(s.level, 1)),
      staff: Math.min(shop.staffSlots, Math.max(0, int(s.staff, 0))),
      auto: !!s.auto,
    };
  }
  return out;
}

function idList(list, allowed) {
  if (!Array.isArray(list)) return [];
  const seen = new Set();
  for (const raw of list) {
    const id = itemId(raw);
    if (id && allowed.has(id)) seen.add(id);
  }
  return [...seen];
}

function goalToSave(goal, fallbackNow) {
  const g = goal && typeof goal === "object" ? goal : {};
  return {
    tier: Math.max(1, int(g.tier, 1)),
    target: Math.max(0, num(g.target, 600)),
    until: int(g.until, fallbackNow + 8 * 60 * 1000),
    reward: {
      gold: Math.max(0, int(g.reward?.gold, 200)),
      xp: Math.max(0, int(g.reward?.xp, 25)),
    },
  };
}

/**
 * 写档白名单：只序列化可持久字段。派生对象降为 id，瞬态字段（toast、
 * shops[].assignees 等）出不了档。
 */
export function toSaveData(state, now = Date.now()) {
  const s = state && typeof state === "object" ? state : {};
  return {
    name: typeof s.name === "string" ? s.name : "未命名老板",
    introDone: !!s.introDone,
    gold: Math.max(0, num(s.gold, 0)),
    goldEarned: Math.max(0, num(s.goldEarned, 0)),
    xp: Math.max(0, num(s.xp, 0)),
    level: Math.max(1, int(s.level, 1)),
    shards: Math.max(0, int(s.shards, 0)),
    muted: !!s.muted,
    outfit: outfitToIds(s.outfit),
    furniture: idList(s.furniture, FURNITURE_IDS),
    shops: shopsToIds(s.shops),
    partners: partnersToIds(s.partners),
    researchDone: idList(s.researchDone, RESEARCH_IDS),
    lastTick: int(s.lastTick, now),
    goal: goalToSave(s.goal, now),
  };
}

const MIGRATIONS = {
  // v1 → v2：派生对象降 id、伙伴只留可变字段、目标补 tier/reward、剔除瞬态。
  1: (d) => {
    const now = Date.now();
    const legacyGoal = d?.goal && typeof d.goal === "object" ? d.goal : {};
    const goal = goalToSave(legacyGoal, now);
    // 老档 goal.done 是一次性终态；v2 目标成环，奖励已发过的目标降为零奖励空档，
    // 下一次结算立刻续期成新目标。
    if (legacyGoal.done) {
      goal.target = 0;
      goal.reward = { gold: 0, xp: 0 };
    }
    return { ...toSaveData(d, now), goal };
  },
};

/**
 * 信封 → 当前版本的 data。认不出的信封返回 null，交给坏档流程。
 */
export function migrate(raw) {
  if (!raw || typeof raw !== "object") return null;
  let version = raw.v;
  let data = raw.data;
  if (!Number.isInteger(version) || version < 1) return null;
  if (!data || typeof data !== "object") return null;
  if (version > CURRENT_VERSION) return null;
  while (version < CURRENT_VERSION) {
    const step = MIGRATIONS[version];
    if (typeof step !== "function") return null;
    data = step(data);
    version += 1;
  }
  return data;
}

export function readRaw() {
  const ls = store();
  if (!ls) return null;
  try {
    return ls.getItem(KEY);
  } catch {
    return null;
  }
}

/** 坏档不清档：原始串挪到备份键，玩家仍可导出自救。 */
export function backupCorrupt(rawString, reason = "unknown") {
  const ls = store();
  if (!ls || typeof rawString !== "string") return false;
  try {
    ls.setItem(CORRUPT_KEY, JSON.stringify({ reason, at: Date.now(), raw: rawString }));
    return true;
  } catch {
    return false;
  }
}

export function loadCorruptBackup() {
  const ls = store();
  if (!ls) return null;
  try {
    const raw = ls.getItem(CORRUPT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function loadSave() {
  const raw = readRaw();
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    backupCorrupt(raw, "json-parse");
    return null;
  }
}

/** 走完整加载管线：返回 { data, corrupt }，data 为 null 表示应开新档。 */
export function readSaveData() {
  const raw = readRaw();
  if (!raw) return { data: null, corrupt: false };
  let envelope = null;
  try {
    envelope = JSON.parse(raw);
  } catch {
    backupCorrupt(raw, "json-parse");
    return { data: null, corrupt: true };
  }
  let data = null;
  try {
    data = migrate(envelope);
  } catch {
    data = null;
  }
  if (!data) {
    backupCorrupt(raw, "migrate-failed");
    return { data: null, corrupt: true };
  }
  return { data, corrupt: false };
}

export function writeSave(state) {
  const ls = store();
  if (!ls) return false;
  try {
    ls.setItem(
      KEY,
      JSON.stringify({ v: CURRENT_VERSION, savedAt: Date.now(), data: toSaveData(state) }),
    );
    return true;
  } catch {
    return false;
  }
}

export function exportSave(state) {
  return JSON.stringify(
    { v: CURRENT_VERSION, savedAt: Date.now(), data: toSaveData(state) },
    null,
    2,
  );
}

/** 导入走与加载完全相同的迁移管线，因此天然吃得下旧版本导出档。 */
export function importSave(json) {
  let parsed;
  try {
    parsed = typeof json === "string" ? JSON.parse(json) : json;
  } catch {
    throw new Error("存档格式无效");
  }
  const data = migrate(parsed);
  if (!data) throw new Error("存档格式无效");
  return data;
}

export function clearSave() {
  const ls = store();
  if (!ls) return;
  try {
    ls.removeItem(KEY);
  } catch {
    /* 私密模式下写入被拒，忽略 */
  }
}