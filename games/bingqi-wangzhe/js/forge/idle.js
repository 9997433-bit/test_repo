/**
 * 挂机产出结算 — 纯函数 + 一个显式写状态的收取入口。
 * 不读 window，不读 Date（时间一律由调用方传入 nowMs），因此可被测试完全控制。
 */

import { IDLE_RATES, IDLE, CODEX_BONUS, STAMINA } from '../data/balance.js';
import { STAGE_COUNT_TOTAL } from '../data/stages.js';
import { WEAPON_COUNT } from '../data/weapons.js';

/** 前 15 分钟按在线全额结算，其后按离线折算。 */
const ONLINE_WINDOW_MS = 15 * 60 * 1000;

export function clearedStagesOf(state) {
  const c = state?.campaign;
  // core/state.js 用 highestStage，且它的 `cleared` 是一张 map 而不是数字，
  // 所以数字字段优先，map 只在没有其他线索时按 key 数兜底。
  const candidates = [c?.maxCleared, c?.highestStage, c?.highest, c?.cleared];
  for (const raw of candidates) {
    if (typeof raw === 'number' && Number.isFinite(raw)) {
      return Math.max(0, Math.min(STAGE_COUNT_TOTAL, Math.floor(raw)));
    }
  }
  if (c?.cleared && typeof c.cleared === 'object') {
    const n = Object.values(c.cleared).filter(Boolean).length;
    return Math.max(0, Math.min(STAGE_COUNT_TOTAL, n));
  }
  return 0;
}

export function codexCountOf(state) {
  const codex = state?.codex;
  if (!codex) return 0;
  if (Array.isArray(codex)) return codex.length;
  if (codex.discovered && typeof codex.discovered === 'object') {
    return Object.keys(codex.discovered).length;
  }
  if (typeof codex.count === 'number') return codex.count;
  return 0;
}

/** 图鉴收集度加成，封顶 15%。 */
export function codexBonusOf(state) {
  const n = Math.min(WEAPON_COUNT, codexCountOf(state));
  return Math.min(CODEX_BONUS.cap, n * CODEX_BONUS.perProto);
}

/**
 * 当前每分钟产出速率（fable-3 §4）：
 *   rate = base + perStage × max(0, cleared − offsetStage)，cleared < minStage 时不产出。
 * @returns {{ rates: Record<string, number>, cleared:number, codexBonus:number }}
 */
export function idleRatesFor(state) {
  const cleared = clearedStagesOf(state);
  const bonus = 1 + Math.min(CODEX_BONUS.cap, codexBonusOf(state));
  const rates = {};
  for (const [id, def] of Object.entries(IDLE_RATES)) {
    const minStage = def.minStage ?? def.unlockStage ?? 0;
    if (cleared < minStage) continue;
    const effective = Math.max(0, cleared - (def.offsetStage ?? 0));
    const raw = (def.base + def.perStage * effective) * bonus;
    if (raw > 0) rates[id] = Math.round(raw * 1000) / 1000;
  }
  return { rates, cleared, codexBonus: codexBonusOf(state) };
}

export function lastCollectAtOf(state, nowMs) {
  const idle = state?.idle;
  const raw = idle?.lastCollectAt ?? idle?.lastAt ?? idle?.since ?? state?.createdAt;
  const n = Number(raw);
  // 0 是合法时间戳（测试与回放常用），只有非数值才回退到「此刻」。
  return Number.isFinite(n) ? Math.max(0, n) : nowMs;
}

/**
 * 有效计时：离线上限 8 小时，超出部分丢弃。
 */
export function effectiveElapsed(lastAt, nowMs) {
  const raw = Math.max(0, (Number(nowMs) || 0) - lastAt);
  return { rawMs: raw, cappedMs: Math.min(raw, IDLE.offlineCapMs), capped: raw > IDLE.offlineCapMs };
}

/** 把「有效毫秒」折算成计费分钟（在线段全额，离线段打折）。 */
export function billableMinutes(cappedMs) {
  const online = Math.min(cappedMs, ONLINE_WINDOW_MS);
  const offline = Math.max(0, cappedMs - ONLINE_WINDOW_MS);
  return (online + offline * IDLE.offlineRatio) / 60000;
}

/**
 * 只读预览，不写 state。
 */
export function previewIdle(state, nowMs) {
  const lastAt = lastCollectAtOf(state, nowMs);
  const { rawMs, cappedMs, capped } = effectiveElapsed(lastAt, nowMs);
  const { rates, cleared, codexBonus } = idleRatesFor(state);
  const minutes = billableMinutes(cappedMs);

  const gains = {};
  for (const [id, perMin] of Object.entries(rates)) {
    const n = Math.floor(perMin * minutes);
    if (n > 0) gains[id] = n;
  }

  return {
    lastAt,
    nowMs,
    rawMs,
    cappedMs,
    capped,
    capMs: IDLE.offlineCapMs,
    minutes: Math.round(minutes * 100) / 100,
    rates,
    cleared,
    codexBonus,
    gains,
    ready: rawMs >= IDLE.minCollectMs && Object.keys(gains).length > 0,
    minCollectMs: IDLE.minCollectMs,
  };
}

/**
 * 体力回复。核心层若已经在 `tickIdle` 里处理体力，就不要重复调用本函数。
 * 独立使用 `state.idle.staminaAt` 计时，天然幂等。
 */
export function regenStamina(state, nowMs) {
  if (!state || typeof state !== 'object') return { ok: false, gained: 0 };
  if (!state.idle || typeof state.idle !== 'object') state.idle = {};
  if (!state.resources || typeof state.resources !== 'object') state.resources = {};

  const last = Number(state.idle.staminaAt);
  const from = Number.isFinite(last) ? Math.max(0, last) : nowMs;
  const elapsed = Math.max(0, nowMs - from);
  const ticks = Math.floor(elapsed / STAMINA.regenMs);

  if (ticks <= 0) {
    if (!Number.isFinite(last)) state.idle.staminaAt = nowMs;
    return { ok: false, gained: 0, nextAt: from + STAMINA.regenMs };
  }

  const current = Number(state.resources.stamina) || 0;
  const gained = Math.max(0, Math.min(STAMINA.max - current, ticks * STAMINA.regenAmount));
  state.resources.stamina = current + gained;
  state.idle.staminaAt = from + ticks * STAMINA.regenMs;

  return {
    ok: gained > 0,
    gained,
    stamina: state.resources.stamina,
    nextAt: state.idle.staminaAt + STAMINA.regenMs,
  };
}

export default previewIdle;
