/**
 * 扫荡 — 三星关卡的重复掉落速通。
 *
 *   previewSweep(state, stageId, opts)
 *   sweepStage(state, stageId, opts, rng)
 *   sweepableStages(state)
 *
 * 与 forge.js 同规矩：逻辑层，不碰 window / document / Math.random，随机由调用方注入；
 * 只 import 同层与 data/，对 state 的读写全部走本文件的防御性访问器。
 *
 * 与「打一场」的分工：扫荡不跑战斗、不发首通奖励、不推关卡进度，
 * 只按 `stage.dropTable` 结算 N 次重复掉落，并扣 N 次扫荡体力
 * （`SWEEP_RULES.staminaCost`，每日前 `SWEEP_RULES.freeDaily` 次免体力）。
 * 因此它可以被 core/api.js 直接当成一个编排动词调用，不需要 combat。
 */

import { SWEEP_RULES } from '../data/balance.js';
import { STAGES, STAGE_BY_ID } from '../data/stages.js';
import { RESOURCE_NAME } from '../data/strings.js';
import { createRngAdapter } from './rng.js';

const fail = (reason, extra) => ({ ok: false, reason, ...(extra || {}) });

/* ------------------------------------------------------------------ *
 * 防御性 state 访问
 * ------------------------------------------------------------------ */

function ensureSweepState(state) {
  if (!state || typeof state !== 'object') return null;
  if (!state.resources || typeof state.resources !== 'object') state.resources = {};
  if (!state.campaign || typeof state.campaign !== 'object') state.campaign = {};
  const c = state.campaign;
  if (!c.stars || typeof c.stars !== 'object') c.stars = {};
  if (!c.daily || typeof c.daily !== 'object') c.daily = { day: -1, normal: 0, elite: 0, sweep: 0 };
  if (typeof c.daily.sweep !== 'number' || !Number.isFinite(c.daily.sweep)) c.daily.sweep = 0;
  return state;
}

function readRes(state, id) {
  const v = Number(state.resources?.[id]);
  return Number.isFinite(v) ? v : 0;
}

function grant(state, gains) {
  for (const [id, n] of Object.entries(gains)) {
    if (!n) continue;
    state.resources[id] = readRes(state, id) + n;
  }
}

function pushLog(state, line) {
  if (Array.isArray(state.log)) {
    state.log.push(line);
    if (state.log.length > 200) state.log.splice(0, state.log.length - 200);
  }
}

function readStars(entry) {
  if (typeof entry === 'number') return Number.isFinite(entry) ? Math.max(0, Math.floor(entry)) : 0;
  if (entry && typeof entry === 'object') {
    const n = Number(entry.stars);
    return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
  }
  return 0;
}

/**
 * 该关已拿到的星数。
 * core/state.js 记在 `campaign.stars[stageId]`（数字），
 * ui/live/liveGame.js 记在 `campaign.cleared[stageId]`（`{stars, clears}`），两种都认。
 */
export function starsOf(state, stageId) {
  const c = state?.campaign;
  if (!c) return 0;
  const fromStars = readStars(c.stars?.[stageId]);
  const legacy = c.cleared && typeof c.cleared === 'object' ? readStars(c.cleared[stageId]) : 0;
  return Math.max(fromStars, legacy);
}

/** 关卡 id（`stage_07`）或序号（7）都能解析。 */
export function resolveStage(stageId) {
  if (typeof stageId === 'number' && Number.isFinite(stageId)) {
    return STAGES[Math.floor(stageId) - 1] ?? null;
  }
  const key = String(stageId ?? '');
  if (STAGE_BY_ID[key]) return STAGE_BY_ID[key];
  const m = /(\d+)\s*$/.exec(key);
  return m ? STAGES[Number(m[1]) - 1] ?? null : null;
}

/* ------------------------------------------------------------------ *
 * 体力与次数
 * ------------------------------------------------------------------ */

export function sweepsUsedToday(state) {
  const n = Number(state?.campaign?.daily?.sweep);
  return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
}

export function freeSweepsLeft(state) {
  return Math.max(0, SWEEP_RULES.freeDaily - sweepsUsedToday(state));
}

/**
 * 连扫 `times` 次的体力账：前 `free` 次免体力，其余每次 `SWEEP_RULES.staminaCost`。
 * @returns {{ times:number, free:number, paid:number, stamina:number }}
 */
export function sweepCostFor(state, times) {
  const n = Math.max(0, Math.floor(times));
  const free = Math.min(n, freeSweepsLeft(state));
  const paid = n - free;
  return { times: n, free, paid, stamina: paid * SWEEP_RULES.staminaCost };
}

/** 当前体力最多还能扫几次。 */
export function affordableSweeps(state, max = SWEEP_RULES.maxBatch) {
  const stamina = readRes(state, 'stamina');
  const free = Math.min(max, freeSweepsLeft(state));
  const cost = SWEEP_RULES.staminaCost;
  const paid = cost > 0 ? Math.floor(stamina / cost) : max - free;
  return Math.max(0, Math.min(max, free + paid));
}

/* ------------------------------------------------------------------ *
 * 掉落
 * ------------------------------------------------------------------ */

/** 单次扫荡的掉落，与打赢一场的 `stage.dropTable` 同表同分布。 */
function rollRepeatDrops(stage, rngA) {
  const gains = {};
  for (const drop of stage.dropTable ?? []) {
    const chance = Number(drop.chance ?? 1);
    if (chance < 1 && !rngA.chance(chance)) continue;
    const n = drop.max > drop.min ? rngA.int(drop.min, drop.max) : drop.min;
    if (n > 0) gains[drop.id] = (gains[drop.id] ?? 0) + n;
  }
  return gains;
}

/** 单次扫荡的期望产出（只读，给界面标数用）。 */
export function expectedSweepLoot(stage) {
  const out = {};
  for (const drop of stage.dropTable ?? []) {
    const mid = (Number(drop.min) + Number(drop.max)) / 2;
    const n = mid * Number(drop.chance ?? 1);
    if (n > 0) out[drop.id] = Math.round(n * 100) / 100;
  }
  return out;
}

/* ------------------------------------------------------------------ *
 * previewSweep
 * ------------------------------------------------------------------ */

/**
 * 扫荡前瞻：不修改 state，不需要 rng。
 * @param {object} state
 * @param {string|number} stageId
 * @param {{times?:number}} [opts]
 */
export function previewSweep(state, stageId, opts) {
  const s = ensureSweepState(state);
  if (!s) return fail('invalid_state');
  const stage = resolveStage(stageId);
  if (!stage) return fail('unknown_stage');

  const stars = starsOf(s, stage.id);
  const unlocked = stars >= SWEEP_RULES.minStars;
  const requested = Math.max(1, Math.floor(Number(opts?.times) || 1));
  const times = Math.min(requested, SWEEP_RULES.maxBatch);
  const affordable = Math.min(times, affordableSweeps(s));
  const cost = sweepCostFor(s, times);

  return {
    ok: true,
    stage: { id: stage.id, index: stage.index, name: stage.name, isElite: stage.isElite },
    stars,
    requiredStars: SWEEP_RULES.minStars,
    unlocked,
    requested,
    times,
    affordable,
    maxBatch: SWEEP_RULES.maxBatch,
    freeLeft: freeSweepsLeft(s),
    staminaCost: cost.stamina,
    staminaPerRun: SWEEP_RULES.staminaCost,
    stamina: readRes(s, 'stamina'),
    expected: expectedSweepLoot(stage),
    canSweep: unlocked && affordable > 0,
  };
}

/** 当前存档里所有能扫荡的关卡（界面列表用）。 */
export function sweepableStages(state) {
  const s = ensureSweepState(state);
  if (!s) return [];
  return STAGES.filter((stage) => starsOf(s, stage.id) >= SWEEP_RULES.minStars).map((stage) => ({
    id: stage.id,
    index: stage.index,
    name: stage.name,
    isElite: stage.isElite,
    stars: starsOf(s, stage.id),
    staminaPerRun: SWEEP_RULES.staminaCost,
    expected: expectedSweepLoot(stage),
  }));
}

/* ------------------------------------------------------------------ *
 * sweepStage
 * ------------------------------------------------------------------ */

/**
 * 扫荡一关：三星门槛 → 扣体力 → 按重复掉落表结算 N 次。
 *
 * 体力不够扫满 `times` 次时按「能扫几次扫几次」执行，返回值里的 `requested`
 * 与 `times` 会不一致 —— 一次也扫不了才失败。
 *
 * @param {object} state
 * @param {string|number} stageId  `stage_07` 或 7
 * @param {{times?:number, now?:number, rng?:object|function}} [opts]
 * @param {object|function} [rng]  core/rng.js 的 createRng() 结果，也可写在 opts.rng
 * @returns {{ok:true, times:number, gains:Record<string,number>} | {ok:false, reason:string}}
 */
export function sweepStage(state, stageId, opts, rng) {
  const s = ensureSweepState(state);
  if (!s) return fail('invalid_state');

  const stage = resolveStage(stageId);
  if (!stage) return fail('unknown_stage');

  const stars = starsOf(s, stage.id);
  if (stars < SWEEP_RULES.minStars) {
    return fail('sweep_locked', { stars, requiredStars: SWEEP_RULES.minStars });
  }

  const rngA = createRngAdapter(rng ?? opts?.rng);
  if (!rngA) return fail('no_rng');

  const requested = Math.min(
    SWEEP_RULES.maxBatch,
    Math.max(1, Math.floor(Number(opts?.times) || 1)),
  );
  const times = Math.min(requested, affordableSweeps(s));
  if (times <= 0) {
    return fail('insufficient_stamina', {
      stamina: readRes(s, 'stamina'),
      staminaPerRun: SWEEP_RULES.staminaCost,
    });
  }

  const cost = sweepCostFor(s, times);
  s.resources.stamina = readRes(s, 'stamina') - cost.stamina;
  s.campaign.daily.sweep = sweepsUsedToday(s) + times;

  const runs = [];
  const gains = {};
  for (let i = 0; i < times; i += 1) {
    const loot = rollRepeatDrops(stage, rngA);
    runs.push(loot);
    for (const [id, n] of Object.entries(loot)) gains[id] = (gains[id] ?? 0) + n;
  }
  grant(s, gains);

  const now = Number(opts?.now);
  if (Number.isFinite(now)) s.campaign.lastPlayedAt = now;

  const gainText = Object.entries(gains)
    .map(([id, n]) => `${RESOURCE_NAME[id] ?? id}×${n}`)
    .join('、');
  const line = `扫荡【${stage.name}】×${times}，得 ${gainText || '无'}。`;
  pushLog(s, line);

  return {
    ok: true,
    stage: { id: stage.id, index: stage.index, name: stage.name, isElite: stage.isElite },
    stars,
    requested,
    times,
    partial: times < requested,
    freeUsed: cost.free,
    staminaSpent: cost.stamina,
    staminaPerRun: SWEEP_RULES.staminaCost,
    stamina: s.resources.stamina,
    freeLeft: freeSweepsLeft(s),
    gains,
    runs,
    logLine: line,
  };
}

export default sweepStage;
