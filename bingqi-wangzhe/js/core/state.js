/**
 * 存档状态 — 唯一的事实来源（single source of truth）。
 *
 * 纯数据 + 纯函数：不碰 DOM、不碰 localStorage、不调用 Date.now（时间一律由参数注入）。
 * forge / combat / ui 通过这里的原语读写资源与进度。
 *
 * 数值一律取自 `data/balance.js`（架构允许 core → data 的向下依赖，balance 是无 import 的叶子模块）：
 * Round 2 的开局资源 / 栏位门槛 / 体力规则各写一份，三处互相漂移，Round 3 起只留 balance 一份。
 */

import { HOUR, MINUTE, OFFLINE_CAP_HOURS, elapsedSince, gameDayIndex } from './clock.js';
import {
  FORGE_STAGES,
  MAX_LINEUP,
  SHARD_RESOURCE_IDS,
  SLOT_UNLOCK_STAGES,
  STAMINA_RULES,
  STARTER_KIT,
} from '../data/balance.js';

/** 存档结构版本，字段不兼容变更时 +1 并在 MIGRATIONS 里补迁移。 */
export const SAVE_VERSION = 2;

/**
 * 资源 ID 全集（GDD 3.1 + fable-3 §2 的品质碎片）。
 * 碎片由分解与关卡掉落产出，不登记就会在 hydrate 时被当作未知字段丢掉。
 */
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
  // shardCommon / shardUncommon / shardRare / shardEpic / shardLegendary / shardMythic
  ...SHARD_RESOURCE_IDS,
]);

/** 资源上限；未列出的资源无上限。 */
export const RESOURCE_CAPS = Object.freeze({ stamina: STAMINA_RULES.cap });

/** 体力上限与回复间隔（balance.STAMINA_RULES：120 上限，6 分钟 +1）。 */
export const STAMINA_MAX = STAMINA_RULES.cap;
export const STAMINA_REGEN_MS = STAMINA_RULES.regenSeconds * 1000;

/** 阵容总栏位。 */
export const LINEUP_SLOTS = MAX_LINEUP;

/**
 * 阵容解锁门槛：通关第 `SLOT_UNLOCK_STAGES[i]` 关后开第 i+1 格（0 = 开局即有）。
 * core / combat / balance 三处曾各写一份，现统一读 balance 的 [0, 2, 4, 9, 14]。
 */
export const SLOT_UNLOCK = SLOT_UNLOCK_STAGES;
export const LINEUP_UNLOCK_STAGES = SLOT_UNLOCK_STAGES;

/** 三座炉的 id（data/balance.js 的 FORGE_STAGES）。 */
export const FORGE_STAGE_IDS = Object.freeze([...FORGE_STAGES]);

/** 竞技场每日挑战次数。 */
export const ARENA_DAILY_ATTACKS = 5;

/** 竞技场初始名次：镜像榜共 20 人，新号从榜外第 21 位起。 */
export const ARENA_BASE_RANK = 21;

/** 竞技战绩最多保留多少条。 */
export const ARENA_LOG_LIMIT = 12;

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
 * 挂机产出速率（每小时）的**估算值**，只用于 UI 展示与 `tickIdle` 的报告字段。
 *
 * 真正决定发放量的是 `forge/idle.js` 的 `idleRatesFor()`（读 balance.IDLE_RATES，按分钟计）。
 * core 这份不参与入账，两者不一致也不会造成多发或少发。
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
    campaign: defaultCampaign(),
    arena: defaultArena(),
    codex: {
      discovered: {},
      forgedCount: 0,
      bestQuality: {},
    },
    forge: defaultForgeState(),
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
      // 以下三项由 forge/idle.js 读写；必须随档保存，否则读档后离线收益会被重复发放。
      lastCollectAt: nowMs,
      lastAt: nowMs,
      staminaAt: nowMs,
      totalCollected: 0,
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
  state.campaign.stars = normalizeStars(campaign.stars);
  state.campaign.cleared = Math.max(
    0,
    Math.floor(toFinite(campaign.cleared, toFinite(campaign.highestStage, 0))),
  );
  state.campaign.highestStage = Math.max(
    state.campaign.cleared,
    Math.floor(Math.max(0, toFinite(campaign.highestStage, 0))),
  );
  state.campaign.attempts = Math.max(0, Math.floor(toFinite(campaign.attempts, 0)));
  state.campaign.lastPlayedAt = toFinite(campaign.lastPlayedAt, 0);
  state.campaign.daily = mergeDaily(base.campaign.daily, campaign.daily);

  // 竞技场
  const arena = isPlainObject(source.arena) ? source.arena : {};
  state.arena.rating = toFinite(arena.rating, base.arena.rating);
  state.arena.score = state.arena.rating;
  state.arena.best = Math.max(state.arena.rating, toFinite(arena.best, state.arena.rating));
  state.arena.rank = Math.max(1, Math.floor(toFinite(arena.rank, base.arena.rank)));
  state.arena.wins = Math.max(0, Math.floor(toFinite(arena.wins, 0)));
  state.arena.losses = Math.max(0, Math.floor(toFinite(arena.losses, 0)));
  state.arena.defense = Array.isArray(arena.defense) ? arena.defense.slice(0, LINEUP_SLOTS) : [];
  state.arena.opponents = Array.isArray(arena.opponents) ? arena.opponents.slice(0, 32) : [];
  state.arena.log = normalizeArenaLog(arena.log);
  state.arena.lastRefreshAt = toFinite(arena.lastRefreshAt, 0);
  state.arena.daily = mergeDaily(base.arena.daily, arena.daily);

  // 图鉴：discovered 是权威记录，顶层的 protoId → 次数只是给 UI 读的镜像。
  const codex = isPlainObject(source.codex) ? source.codex : {};
  state.codex.discovered = isPlainObject(codex.discovered) ? cloneJson(codex.discovered) ?? {} : {};
  state.codex.forgedCount = Math.max(0, Math.floor(toFinite(codex.forgedCount, 0)));
  state.codex.bestQuality = isPlainObject(codex.bestQuality) ? { ...codex.bestQuality } : {};
  syncCodexMirror(state);

  // 锻造：保底计数 / 大师熔炉 / uid 序号
  state.forge = normalizeForgeState(source.forge, state.weapons);

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
  // forge/idle.js 的计时锚点：缺失时退回本次 tick 时间，宁可少发也不能重复发。
  state.idle.lastCollectAt = toFinite(idle.lastCollectAt, state.idle.lastCollectMs);
  state.idle.lastAt = toFinite(idle.lastAt, state.idle.lastCollectAt);
  state.idle.staminaAt = toFinite(idle.staminaAt, state.idle.lastTickMs);
  state.idle.totalCollected = Math.max(0, Math.floor(toFinite(idle.totalCollected, 0)));

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
  // 先按全集写一遍，碎片这类新资源即使当前 state 里缺字段也必须落档。
  for (const id of RESOURCE_IDS) resources[id] = round(toFinite(s.resources?.[id], 0), 3);
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
    // forge 必须随档：保底计数丢了会重开 8 锤保底，uid 序号丢了会锻出重复 uid。
    forge: cloneJson(normalizeForgeState(s.forge, s.weapons)),
    flags: cloneJson(s.flags) || {},
    idle: {
      lastTickMs: toFinite(s.idle?.lastTickMs, 0),
      lastCollectMs: toFinite(s.idle?.lastCollectMs, 0),
      capHours: toFinite(s.idle?.capHours, OFFLINE_CAP_HOURS),
      pending,
      staminaCarryMs: round(toFinite(s.idle?.staminaCarryMs, 0), 0),
      wastedMs: round(toFinite(s.idle?.wastedMs, 0), 0),
      lastOfflineMs: round(toFinite(s.idle?.lastOfflineMs, 0), 0),
      lastCollectAt: toFinite(s.idle?.lastCollectAt, toFinite(s.idle?.lastCollectMs, 0)),
      lastAt: toFinite(s.idle?.lastAt, toFinite(s.idle?.lastCollectMs, 0)),
      staminaAt: toFinite(s.idle?.staminaAt, toFinite(s.idle?.lastTickMs, 0)),
      totalCollected: Math.max(0, Math.floor(toFinite(s.idle?.totalCollected, 0))),
    },
  };
}

/**
 * 结算体力回复与时间锚点。幂等安全：可以每帧调用。
 *
 * **不发资源**：挂机产出的唯一入账口是 `forge.collectIdle`（经 `core/api.js` 暴露成
 * `game.collectIdle`）。core 若再按小时费率往 `idle.pending` 记一笔，同一段时间就会
 * 兑现两次 —— Round 2 的双计挂机正是这么来的，所以这里只保留体力与计时。
 *
 * - 体力按真实经过时间回复（受 STAMINA_RULES.cap 自然封顶），残余不足一格的部分记在 `staminaCarryMs`。
 * - `idle.capHours`（默认 8 小时）仍用来统计被浪费的离线时长 `wastedMs`。
 * - 时间倒流（改系统时钟）只推进 lastTickMs，不产生收益。
 *
 * @param {object} state
 * @param {number} nowMs 注入的当前时间
 * @returns {{ elapsedMs: number, cappedMs: number, wastedMs: number, capped: boolean,
 *   gained: Record<string, number>, stamina: number, pending: Record<string, number>,
 *   rates: Record<string, number>, offline: boolean }} `gained` 恒为全 0，仅为兼容旧调用点保留
 */
export function tickIdle(state, nowMs) {
  const s = state;
  if (!isPlainObject(s) || !isPlainObject(s.idle)) {
    return emptyTickReport(idleRatesPerHour(0));
  }
  const now = toFinite(nowMs, 0);
  const capMs = clampNumber(toFinite(s.idle.capHours, OFFLINE_CAP_HOURS), 0, 24) * HOUR;
  const span = elapsedSince(s.idle.lastTickMs, now, capMs);
  const rates = idleRatesPerHour(s.campaign?.cleared ?? s.campaign?.highestStage ?? 0);
  const gained = {};

  if (span.elapsedMs <= 0) {
    s.idle.lastTickMs = now;
    return { ...emptyTickReport(rates), pending: { ...s.idle.pending } };
  }

  // 资源仓库不再由 core 累进；`gained` 全 0 是给旧调用点的兼容形状。
  for (const id of IDLE_RESOURCE_IDS) gained[id] = 0;

  // 体力：整段真实时间都算，一格一点，余量留到下次。
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
  // forge/idle.js 的 regenStamina() 按 staminaAt 计时；对齐后两边不会重复回体力。
  s.idle.staminaAt = now - s.idle.staminaCarryMs;

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
 *
 * `tickIdle` 不再往仓库累进，因此新档的 `idle.pending` 恒为 0；本函数只用来一次性
 * 兑现旧档里遗留的仓库余额，兑现后即清零，不会与 `forge.collectIdle` 重复入账。
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
  const campaign = state?.campaign;
  const stage = Math.max(
    0,
    toFinite(campaign?.cleared, 0),
    toFinite(campaign?.highestStage, 0),
  );
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

/**
 * 全新的锻造子树：保底计数 / 大师熔炉 / uid 序号。
 * 形状与 forge/forge.js 的 `ensureForgeState()` 完全一致，避免两边各写一份。
 * @returns {object}
 */
export function defaultForgeState() {
  const pity = {};
  for (const stage of FORGE_STAGE_IDS) pity[stage] = { epic: 0, legendary: 0 };
  return {
    pity,
    masterForge: { dayKey: -1, used: 0 },
    totalForged: 0,
    serial: 0,
  };
}

/**
 * 把 `codex.discovered` 的收录次数镜像成 `codex[protoId] = count`。
 *
 * 图鉴的权威记录是 `discovered`（含首次/最佳品质），但 UI 适配层按
 * `state.codex[protoId]` 读次数，因此每次写图鉴后都要同步一次镜像。
 * @param {object} state
 * @returns {object} state.codex
 */
export function syncCodexMirror(state) {
  if (!isPlainObject(state)) return {};
  if (!isPlainObject(state.codex)) state.codex = { discovered: {}, forgedCount: 0, bestQuality: {} };
  const codex = state.codex;
  const discovered = isPlainObject(codex.discovered) ? codex.discovered : {};
  for (const key of Object.keys(codex)) {
    if (RESERVED_CODEX_KEYS.has(key)) continue;
    if (!(key in discovered)) delete codex[key];
  }
  for (const [protoId, entry] of Object.entries(discovered)) {
    const count = isPlainObject(entry) ? Math.max(1, Math.floor(toFinite(entry.count, 1))) : 1;
    codex[protoId] = count;
  }
  return codex;
}

/* ------------------------------------------------------------------ */
/* 内部工具                                                             */
/* ------------------------------------------------------------------ */

const RESERVED_CODEX_KEYS = new Set(['discovered', 'forgedCount', 'bestQuality']);

function defaultCampaign() {
  return {
    /** 已通关的最高关卡序号；forge/idle 与 combat/lineup 都按数字读这个字段。 */
    cleared: 0,
    highestStage: 0,
    /** stageId → 0..3 星 */
    stars: {},
    attempts: 0,
    lastPlayedAt: 0,
    daily: { day: -1, normal: 0, elite: 0, sweep: 0 },
  };
}

function defaultArena() {
  return {
    rating: 1000,
    /** combat/engine.js 读 `arena.score`，与 rating 同值。 */
    score: 1000,
    best: 1000,
    rank: ARENA_BASE_RANK,
    wins: 0,
    losses: 0,
    defense: [],
    opponents: [],
    log: [],
    lastRefreshAt: 0,
    daily: { day: -1, attacks: 0 },
  };
}

function normalizeForgeState(raw, weapons) {
  const forge = defaultForgeState();
  const source = isPlainObject(raw) ? raw : {};
  const pity = isPlainObject(source.pity) ? source.pity : {};
  for (const stage of FORGE_STAGE_IDS) {
    const entry = isPlainObject(pity[stage]) ? pity[stage] : {};
    forge.pity[stage].epic = Math.max(0, Math.floor(toFinite(entry.epic, 0)));
    forge.pity[stage].legendary = Math.max(0, Math.floor(toFinite(entry.legendary, 0)));
  }
  const mf = isPlainObject(source.masterForge) ? source.masterForge : {};
  forge.masterForge.dayKey = Math.floor(toFinite(mf.dayKey, -1));
  forge.masterForge.used = Math.max(0, Math.floor(toFinite(mf.used, 0)));
  forge.totalForged = Math.max(0, Math.floor(toFinite(source.totalForged, 0)));
  forge.serial = Math.max(
    0,
    Math.floor(toFinite(source.serial, 0)),
    highestWeaponSerial(weapons),
  );
  return forge;
}

/** uid 形如 `w17ab`；序号必须单调递增，否则读档后会锻出重复 uid。 */
function highestWeaponSerial(weapons) {
  if (!Array.isArray(weapons)) return 0;
  let max = 0;
  for (const weapon of weapons) {
    const match = /^w(\d+)/.exec(String(weapon?.uid ?? ''));
    if (match) max = Math.max(max, Number(match[1]));
  }
  return max;
}

function normalizeStars(raw) {
  const out = {};
  if (!isPlainObject(raw)) return out;
  for (const [stageId, value] of Object.entries(raw)) {
    const stars = Math.floor(toFinite(value, 0));
    if (stars > 0) out[stageId] = clampNumber(stars, 0, 3);
  }
  return out;
}

function normalizeArenaLog(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(isPlainObject)
    .slice(0, ARENA_LOG_LIMIT)
    .map((entry) => ({
      at: toFinite(entry.at, 0),
      foe: String(entry.foe ?? ''),
      win: Boolean(entry.win),
      rankChange: Math.floor(toFinite(entry.rankChange, 0)),
    }));
}

/**
 * 开局礼包：balance.STARTER_KIT（360 铜钱 / 60 精铁 = 精铁炉 3 锤）+ 1 张幸运符，
 * 体力按 STAMINA_RULES.startFull 直接给满。
 *
 * 之前的 200/30/60 只够 1 锤，首锤若出低 roll 就卡在第 1 关；满体力则保证
 * 1–20 关（16×3 + 4×6 = 72 体力）在首个小时内打得完。
 */
export const STARTER_RESOURCES = Object.freeze({
  ...STARTER_KIT,
  luckyCharm: 1,
  stamina: STAMINA_RULES.startFull ? STAMINA_RULES.cap : 0,
});

function defaultResources() {
  const resources = {};
  for (const id of RESOURCE_IDS) resources[id] = 0;
  for (const [id, amount] of Object.entries(STARTER_RESOURCES)) {
    resources[id] = clampResource(id, amount);
  }
  return resources;
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

/** 版本迁移入口。 */
function migrate(source) {
  let data = source;
  const version = Math.floor(toFinite(data.version, 0));
  if (version > SAVE_VERSION) {
    // 未来版本存档：不猜字段，按缺省兜底（hydrate 的合并逻辑会保住已知字段）。
    return data;
  }
  // v0 -> v1：早期原型没有 idle 段，交给 hydrate 的缺省合并即可。
  // v1 -> v2：campaign.cleared 从「已通关关卡字典」改成「已通关最高关序号」，
  //           原字典里的值即星数，迁到 campaign.stars。
  if (version <= 1 && isPlainObject(data.campaign) && isPlainObject(data.campaign.cleared)) {
    const legacy = data.campaign.cleared;
    const stars = { ...normalizeStars(legacy), ...normalizeStars(data.campaign.stars) };
    for (const stageId of Object.keys(legacy)) {
      if (legacy[stageId] && !(stageId in stars)) stars[stageId] = 1;
    }
    data = {
      ...data,
      campaign: {
        ...data.campaign,
        stars,
        cleared: Math.max(
          Math.floor(toFinite(data.campaign.highestStage, 0)),
          highestStageIndexOf(Object.keys(legacy)),
        ),
      },
    };
  }
  data = { ...data, version: SAVE_VERSION };
  return data;
}

/** `stage_07` → 7；用于把旧存档的关卡字典折算成最高关序号。 */
function highestStageIndexOf(stageIds) {
  let max = 0;
  for (const id of stageIds) {
    const match = /(\d+)\s*$/.exec(String(id));
    if (match) max = Math.max(max, Number(match[1]));
  }
  return max;
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
