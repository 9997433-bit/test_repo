/**
 * 存档状态 — 唯一的事实来源（single source of truth）。
 *
 * 纯数据 + 纯函数：不碰 DOM、不碰 localStorage、不调用 Date.now（时间一律由参数注入）。
 * forge / combat / ui 通过这里的原语读写资源与进度。
 */

import { HOUR, MINUTE, OFFLINE_CAP_HOURS, elapsedSince, gameDayIndex } from './clock.js';

/** 存档结构版本，字段不兼容变更时 +1 并在 MIGRATIONS 里补迁移。 */
export const SAVE_VERSION = 1;

/** 资源 ID 全集（GDD 3.1）。 */
export const RESOURCE_IDS = Object.freeze([
  'coin',
  'iron',
  'silverOre',
  'goldOre',
  'fireCrystal',
  'iceCrystal',
  'thunderCrystal',
  'luckyCharm',
  'stamina',
  'diamond',
]);

/** 资源上限；未列出的资源无上限。 */
export const RESOURCE_CAPS = Object.freeze({ stamina: 120 });

/** 体力恢复：每 6 分钟 +1（GDD 3.1）。 */
export const STAMINA_REGEN_MS = 6 * MINUTE;

/** 阵容总栏位。 */
export const LINEUP_SLOTS = 5;

/** 阵容解锁门槛：第 N 栏需要通关到第 [N-1] 关。 */
export const LINEUP_UNLOCK_STAGES = Object.freeze([0, 3, 8, 15, 25]);

/** 挂机产出的资源集合（体力单独按时间回复，不进 pending）。 */
export const IDLE_RESOURCE_IDS = Object.freeze([
  'coin',
  'iron',
  'silverOre',
  'goldOre',
  'fireCrystal',
  'iceCrystal',
  'thunderCrystal',
]);

/**
 * 挂机产出速率（每小时），按「已通关最高关卡」估算。
 * 数值为 Round 1 占位常量，Round 2 由 fable-3 的 data/balance.js 对齐后替换。
 * @param {number} highestStage 已通关最高关卡（0 = 尚未通关）
 * @returns {Record<string, number>} 每小时产出
 */
export function idleRatesPerHour(highestStage = 0) {
  const s = clampNumber(highestStage, 0, 40);
  const crystal = s >= 4 ? 0.5 + (s - 4) * 0.16 : 0;
  return {
    coin: 60 + s * 28,
    iron: 24 + s * 9,
    silverOre: s >= 6 ? 1.2 + (s - 6) * 0.45 : 0,
    goldOre: s >= 16 ? 0.6 + (s - 16) * 0.22 : 0,
    fireCrystal: crystal,
    iceCrystal: crystal,
    thunderCrystal: crystal,
  };
}

/**
 * 创建全新存档。
 * @param {{ seed?: number|string, nowMs?: number }} [options]
 * @returns {object} state
 */
export function createInitialState(options = {}) {
  const nowMs = Number.isFinite(options.nowMs) ? options.nowMs : 0;
  const seed = options.seed ?? 1;
  return {
    version: SAVE_VERSION,
    seed,
    createdAt: nowMs,
    updatedAt: nowMs,
    rngState: null,
    resources: defaultResources(),
    weapons: [],
    lineup: new Array(LINEUP_SLOTS).fill(null),
    campaign: {
      highestStage: 0,
      cleared: {},
      attempts: 0,
      lastPlayedAt: 0,
      daily: { day: -1, normal: 0, elite: 0, sweep: 0 },
    },
    arena: {
      rating: 1000,
      best: 1000,
      rank: 0,
      wins: 0,
      losses: 0,
      defense: [],
      opponents: [],
      lastRefreshAt: 0,
      daily: { day: -1, attacks: 0 },
    },
    codex: {
      discovered: {},
      forgedCount: 0,
      bestQuality: {},
    },
    flags: {
      tutorialDone: false,
      firstForgeDone: false,
      sound: true,
      music: false,
      reducedMotion: false,
      battleSpeed: 1,
      autoBattle: false,
      masterForgeDay: -1,
      lastDailyResetDay: -1,
      tzOffsetMinutes: 0,
    },
    idle: {
      lastTickMs: nowMs,
      lastCollectMs: nowMs,
      capHours: OFFLINE_CAP_HOURS,
      pending: defaultIdlePending(),
      staminaCarryMs: 0,
      wastedMs: 0,
      lastOfflineMs: 0,
    },
  };
}

/**
 * 从任意外部输入（JSON 字符串 / 旧版对象 / 损坏数据）还原出合法 state。
 * 永不抛错：不可解析时退回全新存档。
 * @param {any} raw
 * @param {{ seed?: number|string, nowMs?: number }} [options]
 * @returns {object} state
 */
export function hydrate(raw, options = {}) {
  let input = raw;
  if (typeof input === 'string') {
    try {
      input = JSON.parse(input);
    } catch {
      input = null;
    }
  }
  const base = createInitialState(options);
  if (!input || typeof input !== 'object' || Array.isArray(input)) return base;

  const source = migrate(input);
  const state = base;

  state.version = SAVE_VERSION;
  state.seed = source.seed ?? base.seed;
  state.createdAt = toFinite(source.createdAt, base.createdAt);
  state.updatedAt = toFinite(source.updatedAt, state.createdAt);
  state.rngState = Number.isFinite(source.rngState) ? source.rngState >>> 0 : null;

  // 资源
  const res = isPlainObject(source.resources) ? source.resources : {};
  for (const id of RESOURCE_IDS) {
    state.resources[id] = clampResource(id, toFinite(res[id], base.resources[id]));
  }
  // 保留未来新增的未知资源，避免旧版本客户端吞档。
  for (const id of Object.keys(res)) {
    if (!(id in state.resources)) state.resources[id] = toFinite(res[id], 0);
  }

  // 兵器：形状由 forge 定义，这里只做最小校验并原样保留字段。
  state.weapons = Array.isArray(source.weapons)
    ? source.weapons.filter(isPlainObject).map(normalizeWeapon).filter(Boolean)
    : [];

  // 阵容：固定 5 格，只保留确实拥有的兵器，去重。
  state.lineup = normalizeLineup(source.lineup, state.weapons);

  // 关卡
  const campaign = isPlainObject(source.campaign) ? source.campaign : {};
  state.campaign.highestStage = Math.max(0, Math.floor(toFinite(campaign.highestStage, 0)));
  state.campaign.cleared = isPlainObject(campaign.cleared) ? { ...campaign.cleared } : {};
  state.campaign.attempts = Math.max(0, Math.floor(toFinite(campaign.attempts, 0)));
  state.campaign.lastPlayedAt = toFinite(campaign.lastPlayedAt, 0);
  state.campaign.daily = mergeDaily(base.campaign.daily, campaign.daily);

  // 竞技场
  const arena = isPlainObject(source.arena) ? source.arena : {};
  state.arena.rating = toFinite(arena.rating, base.arena.rating);
  state.arena.best = toFinite(arena.best, state.arena.rating);
  state.arena.rank = Math.max(0, Math.floor(toFinite(arena.rank, 0)));
  state.arena.wins = Math.max(0, Math.floor(toFinite(arena.wins, 0)));
  state.arena.losses = Math.max(0, Math.floor(toFinite(arena.losses, 0)));
  state.arena.defense = Array.isArray(arena.defense) ? arena.defense.slice(0, LINEUP_SLOTS) : [];
  state.arena.opponents = Array.isArray(arena.opponents) ? arena.opponents.slice(0, 32) : [];
  state.arena.lastRefreshAt = toFinite(arena.lastRefreshAt, 0);
  state.arena.daily = mergeDaily(base.arena.daily, arena.daily);

  // 图鉴
  const codex = isPlainObject(source.codex) ? source.codex : {};
  state.codex.discovered = isPlainObject(codex.discovered) ? { ...codex.discovered } : {};
  state.codex.forgedCount = Math.max(0, Math.floor(toFinite(codex.forgedCount, 0)));
  state.codex.bestQuality = isPlainObject(codex.bestQuality) ? { ...codex.bestQuality } : {};

  // 开关
  const flags = isPlainObject(source.flags) ? source.flags : {};
  state.flags = { ...base.flags, ...flags };
  state.flags.battleSpeed = clampNumber(toFinite(flags.battleSpeed, 1), 0.5, 4);

  // 挂机
  const idle = isPlainObject(source.idle) ? source.idle : {};
  const fallbackTick = toFinite(source.updatedAt, base.idle.lastTickMs);
  state.idle.lastTickMs = toFinite(idle.lastTickMs, fallbackTick);
  state.idle.lastCollectMs = toFinite(idle.lastCollectMs, state.idle.lastTickMs);
  state.idle.capHours = clampNumber(toFinite(idle.capHours, OFFLINE_CAP_HOURS), 0, 24);
  state.idle.staminaCarryMs = clampNumber(toFinite(idle.staminaCarryMs, 0), 0, STAMINA_REGEN_MS);
  state.idle.wastedMs = Math.max(0, toFinite(idle.wastedMs, 0));
  state.idle.lastOfflineMs = Math.max(0, toFinite(idle.lastOfflineMs, 0));
  const pending = isPlainObject(idle.pending) ? idle.pending : {};
  for (const id of IDLE_RESOURCE_IDS) {
    state.idle.pending[id] = Math.max(0, toFinite(pending[id], 0));
  }

  return state;
}

/**
 * 导出为可安全 JSON.stringify 的普通对象（白名单 + 数值裁剪）。
 * `hydrate(serialize(s))` 必须等价于 `s`。
 * @param {object} state
 * @returns {object}
 */
export function serialize(state) {
  const s = isPlainObject(state) ? state : createInitialState();
  const resources = {};
  for (const id of Object.keys(s.resources || {})) {
    resources[id] = round(toFinite(s.resources[id], 0), 3);
  }
  const pending = {};
  const rawPending = (s.idle && s.idle.pending) || {};
  for (const id of IDLE_RESOURCE_IDS) {
    pending[id] = round(Math.max(0, toFinite(rawPending[id], 0)), 4);
  }
  return {
    version: SAVE_VERSION,
    seed: s.seed ?? 1,
    createdAt: toFinite(s.createdAt, 0),
    updatedAt: toFinite(s.updatedAt, 0),
    rngState: Number.isFinite(s.rngState) ? s.rngState >>> 0 : null,
    resources,
    weapons: Array.isArray(s.weapons) ? s.weapons.map(cloneJson) : [],
    lineup: Array.isArray(s.lineup)
      ? s.lineup.slice(0, LINEUP_SLOTS).map((id) => (typeof id === 'string' ? id : null))
      : new Array(LINEUP_SLOTS).fill(null),
    campaign: cloneJson(s.campaign) || {},
    arena: cloneJson(s.arena) || {},
    codex: cloneJson(s.codex) || {},
    flags: cloneJson(s.flags) || {},
    idle: {
      lastTickMs: toFinite(s.idle?.lastTickMs, 0),
      lastCollectMs: toFinite(s.idle?.lastCollectMs, 0),
      capHours: toFinite(s.idle?.capHours, OFFLINE_CAP_HOURS),
      pending,
      staminaCarryMs: round(toFinite(s.idle?.staminaCarryMs, 0), 0),
      wastedMs: round(toFinite(s.idle?.wastedMs, 0), 0),
      lastOfflineMs: round(toFinite(s.idle?.lastOfflineMs, 0), 0),
    },
  };
}

/**
 * 结算挂机产出与体力回复。幂等安全：可以每帧调用。
 *
 * - 单次结算的时间上限 = `idle.capHours`（默认 8 小时，GDD 3.7）。
 * - 仓库上限同样是 capHours × 每小时产出，超出部分记入 `idle.wastedMs`。
 * - 体力按真实经过时间回复（受 120 上限自然封顶），残余不足 6 分钟的部分记在 `staminaCarryMs`。
 * - 时间倒流（改系统时钟）只推进 lastTickMs，不产生收益。
 *
 * @param {object} state
 * @param {number} nowMs 注入的当前时间
 * @returns {{ elapsedMs: number, cappedMs: number, wastedMs: number, capped: boolean,
 *   gained: Record<string, number>, stamina: number, pending: Record<string, number>,
 *   rates: Record<string, number>, offline: boolean }}
 */
export function tickIdle(state, nowMs) {
  const s = state;
  if (!isPlainObject(s) || !isPlainObject(s.idle)) {
    return emptyTickReport(idleRatesPerHour(0));
  }
  const now = toFinite(nowMs, 0);
  const capMs = clampNumber(toFinite(s.idle.capHours, OFFLINE_CAP_HOURS), 0, 24) * HOUR;
  const span = elapsedSince(s.idle.lastTickMs, now, capMs);
  const rates = idleRatesPerHour(s.campaign?.highestStage ?? 0);
  const gained = {};

  if (span.elapsedMs <= 0) {
    s.idle.lastTickMs = now;
    return { ...emptyTickReport(rates), pending: { ...s.idle.pending } };
  }

  const hours = span.cappedMs / HOUR;
  for (const id of IDLE_RESOURCE_IDS) {
    const rate = rates[id] || 0;
    if (rate <= 0) {
      gained[id] = 0;
      continue;
    }
    const cap = rate * (capMs / HOUR);
    const before = Math.max(0, toFinite(s.idle.pending[id], 0));
    const next = Math.min(cap, before + rate * hours);
    gained[id] = Math.max(0, next - before);
    s.idle.pending[id] = next;
  }

  // 体力：整段真实时间都算，6 分钟一点，余量留到下次。
  const staminaMs = span.elapsedMs + Math.max(0, toFinite(s.idle.staminaCarryMs, 0));
  const staminaTicks = Math.floor(staminaMs / STAMINA_REGEN_MS);
  let staminaGained = 0;
  if (staminaTicks > 0) {
    const before = toFinite(s.resources.stamina, 0);
    const after = clampResource('stamina', before + staminaTicks);
    staminaGained = Math.max(0, after - before);
    s.resources.stamina = after;
  }
  s.idle.staminaCarryMs = staminaMs % STAMINA_REGEN_MS;

  s.idle.wastedMs = Math.max(0, toFinite(s.idle.wastedMs, 0)) + span.wastedMs;
  s.idle.lastOfflineMs = span.elapsedMs;
  s.idle.lastTickMs = now;
  s.updatedAt = now;

  return {
    elapsedMs: span.elapsedMs,
    cappedMs: span.cappedMs,
    wastedMs: span.wastedMs,
    capped: span.capped,
    gained,
    stamina: staminaGained,
    pending: { ...s.idle.pending },
    rates,
    offline: span.elapsedMs >= 5 * MINUTE,
  };
}

/**
 * 取走挂机仓库里的整数部分（小数留在仓库里继续累积），并写入资源。
 * forge 的 `collectIdle` 可直接复用。
 * @param {object} state
 * @param {number} [nowMs]
 * @returns {Record<string, number>} 实际领取量
 */
export function takeIdlePending(state, nowMs) {
  const collected = {};
  if (!isPlainObject(state) || !isPlainObject(state.idle)) return collected;
  for (const id of IDLE_RESOURCE_IDS) {
    const amount = Math.floor(Math.max(0, toFinite(state.idle.pending[id], 0)));
    if (amount > 0) {
      state.idle.pending[id] -= amount;
      addResource(state, id, amount);
      collected[id] = amount;
    }
  }
  if (Number.isFinite(nowMs)) {
    state.idle.lastCollectMs = nowMs;
    state.updatedAt = nowMs;
  }
  return collected;
}

/**
 * 增减资源（负数即扣除），自动夹在 [0, cap]。
 * @param {object} state
 * @param {string} id
 * @param {number} n
 * @returns {number} 变更后的数量
 */
export function addResource(state, id, n = 0) {
  if (!isPlainObject(state)) return 0;
  if (!isPlainObject(state.resources)) state.resources = defaultResources();
  if (typeof id !== 'string' || !id) return 0;
  const delta = toFinite(n, 0);
  const before = toFinite(state.resources[id], 0);
  const after = clampResource(id, before + delta);
  state.resources[id] = after;
  return after;
}

/**
 * 是否付得起（不改状态）。
 * @param {object} state
 * @param {Record<string, number>} costMap
 * @returns {boolean}
 */
export function canAfford(state, costMap) {
  if (!isPlainObject(state) || !isPlainObject(state.resources)) return false;
  if (!isPlainObject(costMap)) return true;
  for (const id of Object.keys(costMap)) {
    const cost = toFinite(costMap[id], 0);
    if (cost <= 0) continue;
    if (toFinite(state.resources[id], 0) < cost) return false;
  }
  return true;
}

/**
 * 原子扣费：全部够才扣，否则一点不动。
 * @param {object} state
 * @param {Record<string, number>} costMap
 * @returns {boolean} 是否成功
 */
export function spend(state, costMap) {
  if (!canAfford(state, costMap)) return false;
  if (!isPlainObject(costMap)) return true;
  for (const id of Object.keys(costMap)) {
    const cost = toFinite(costMap[id], 0);
    if (cost <= 0) continue;
    state.resources[id] = clampResource(id, toFinite(state.resources[id], 0) - cost);
  }
  return true;
}

/**
 * 读取资源。
 * @param {object} state
 * @param {string} id
 * @returns {number}
 */
export function getResource(state, id) {
  return toFinite(state?.resources?.[id], 0);
}

/**
 * 当前已解锁的阵容栏位数（1–5）。
 * @param {object} state
 * @returns {number}
 */
export function unlockedLineupSlots(state) {
  const stage = Math.max(0, toFinite(state?.campaign?.highestStage, 0));
  let slots = 1;
  for (let i = 1; i < LINEUP_UNLOCK_STAGES.length; i += 1) {
    if (stage >= LINEUP_UNLOCK_STAGES[i]) slots = i + 1;
  }
  return slots;
}

/**
 * 跨过每日刷新点时清零每日计数。
 * @param {object} state
 * @param {number} nowMs
 * @returns {boolean} 是否发生了刷新
 */
export function resetDaily(state, nowMs) {
  if (!isPlainObject(state)) return false;
  const tz = toFinite(state.flags?.tzOffsetMinutes, 0);
  const day = gameDayIndex(nowMs, tz);
  if (state.flags.lastDailyResetDay === day) return false;
  state.flags.lastDailyResetDay = day;
  state.campaign.daily = { day, normal: 0, elite: 0, sweep: 0 };
  state.arena.daily = { day, attacks: 0 };
  state.updatedAt = toFinite(nowMs, state.updatedAt);
  return true;
}

/* ------------------------------------------------------------------ */
/* 内部工具                                                             */
/* ------------------------------------------------------------------ */

function defaultResources() {
  return {
    coin: 200,
    iron: 30,
    silverOre: 0,
    goldOre: 0,
    fireCrystal: 0,
    iceCrystal: 0,
    thunderCrystal: 0,
    luckyCharm: 1,
    stamina: 60,
    diamond: 0,
  };
}

function defaultIdlePending() {
  const pending = {};
  for (const id of IDLE_RESOURCE_IDS) pending[id] = 0;
  return pending;
}

function emptyTickReport(rates) {
  const gained = {};
  for (const id of IDLE_RESOURCE_IDS) gained[id] = 0;
  return {
    elapsedMs: 0,
    cappedMs: 0,
    wastedMs: 0,
    capped: false,
    gained,
    stamina: 0,
    pending: { ...gained },
    rates,
    offline: false,
  };
}

/** 版本迁移入口；当前只有 v1。 */
function migrate(source) {
  let data = source;
  const version = Math.floor(toFinite(data.version, 0));
  if (version > SAVE_VERSION) {
    // 未来版本存档：不猜字段，按缺省兜底（hydrate 的合并逻辑会保住已知字段）。
    return data;
  }
  // v0 -> v1：早期原型没有 idle 段，交给 hydrate 的缺省合并即可。
  data = { ...data, version: SAVE_VERSION };
  return data;
}

function normalizeWeapon(weapon) {
  const uid = weapon.uid ?? weapon.instanceId ?? weapon.id;
  if (uid === undefined || uid === null || uid === '') return null;
  return { ...weapon, uid: String(uid) };
}

function normalizeLineup(lineup, weapons) {
  const owned = new Set(weapons.map((w) => w.uid));
  const slots = new Array(LINEUP_SLOTS).fill(null);
  if (!Array.isArray(lineup)) return slots;
  const used = new Set();
  for (let i = 0; i < LINEUP_SLOTS; i += 1) {
    const raw = lineup[i];
    const uid = raw === null || raw === undefined ? null : String(raw);
    if (uid && owned.has(uid) && !used.has(uid)) {
      slots[i] = uid;
      used.add(uid);
    }
  }
  return slots;
}

function mergeDaily(base, value) {
  const merged = { ...base };
  if (isPlainObject(value)) {
    for (const key of Object.keys(merged)) {
      merged[key] = Math.floor(toFinite(value[key], merged[key]));
    }
  }
  return merged;
}

function clampResource(id, value) {
  const cap = RESOURCE_CAPS[id];
  const n = Math.max(0, toFinite(value, 0));
  return cap === undefined ? n : Math.min(cap, n);
}

function clampNumber(value, min, max) {
  const n = toFinite(value, min);
  return Math.min(max, Math.max(min, n));
}

function toFinite(value, fallback = 0) {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function round(value, digits) {
  const factor = 10 ** digits;
  return Math.round(toFinite(value, 0) * factor) / factor;
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function cloneJson(value) {
  if (value === undefined) return undefined;
  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return undefined;
  }
}
