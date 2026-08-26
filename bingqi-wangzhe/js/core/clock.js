/**
 * 时钟 — 所有「现在几点」必须经由注入的 now，方便测试与离线结算回放。
 * 逻辑层禁止直接调用 Date.now()，统一走 clock.nowMs()。
 */

export const SECOND = 1000;
export const MINUTE = 60 * SECOND;
export const HOUR = 60 * MINUTE;
export const DAY = 24 * HOUR;

/** 离线结算封顶：8 小时（见 GDD 3.7）。 */
export const OFFLINE_CAP_HOURS = 8;
export const OFFLINE_CAP_MS = OFFLINE_CAP_HOURS * HOUR;

/** 每日刷新时间（本地 04:00，避免午夜在线玩家被打断）。 */
export const DAILY_RESET_HOUR = 4;

/**
 * @typedef {Object} Clock
 * @property {() => number} nowMs        当前时间戳（毫秒）
 * @property {(ms: number) => number} setNow    仅测试/回放：固定时间
 * @property {(ms: number) => number} advance   仅测试/回放：推进时间
 * @property {(fn: () => number) => void} setSource 替换时间源
 * @property {(sinceMs: number, capMs?: number) => { elapsedMs: number, cappedMs: number, wastedMs: number }} elapsed
 */

/**
 * 创建时钟。
 * @param {(() => number)|number|{ now?: () => number }} [now] 时间源：函数、固定时间戳，或 { now }
 * @returns {Clock}
 */
export function createClock(now) {
  let source = toSource(now);

  function nowMs() {
    const value = Number(source());
    return Number.isFinite(value) ? value : 0;
  }

  function setSource(fn) {
    source = toSource(fn);
  }

  function setNow(ms) {
    const fixed = Number(ms) || 0;
    source = () => fixed;
    return fixed;
  }

  function advance(ms) {
    const target = nowMs() + (Number(ms) || 0);
    return setNow(target);
  }

  /**
   * 计算自 sinceMs 起经过的时间，并按 capMs 封顶。
   * @param {number} sinceMs
   * @param {number} [capMs=OFFLINE_CAP_MS]
   */
  function elapsed(sinceMs, capMs = OFFLINE_CAP_MS) {
    return elapsedSince(sinceMs, nowMs(), capMs);
  }

  return { nowMs, setNow, advance, setSource, elapsed };
}

/**
 * 纯函数版本的经过时间计算（不依赖时钟实例）。
 * @param {number} sinceMs
 * @param {number} nowMs
 * @param {number} [capMs=OFFLINE_CAP_MS]
 * @returns {{ elapsedMs: number, cappedMs: number, wastedMs: number, capped: boolean }}
 */
export function elapsedSince(sinceMs, nowMs, capMs = OFFLINE_CAP_MS) {
  const from = Number.isFinite(sinceMs) ? sinceMs : nowMs;
  // 时间倒流（改系统时钟 / 跨设备存档）时按 0 处理，绝不产生负收益。
  const elapsedMs = Math.max(0, (Number(nowMs) || 0) - from);
  const cap = Number.isFinite(capMs) && capMs >= 0 ? capMs : Infinity;
  const cappedMs = Math.min(elapsedMs, cap);
  return {
    elapsedMs,
    cappedMs,
    wastedMs: elapsedMs - cappedMs,
    capped: elapsedMs > cappedMs,
  };
}

/**
 * 判断两个时间戳是否跨过了每日刷新点（UTC 偏移由 tzOffsetMinutes 提供）。
 * @param {number} lastMs
 * @param {number} nowMs
 * @param {number} [tzOffsetMinutes=0] 分钟，东八区传 480
 */
export function isNewGameDay(lastMs, nowMs, tzOffsetMinutes = 0) {
  if (!Number.isFinite(lastMs)) return true;
  return gameDayIndex(nowMs, tzOffsetMinutes) > gameDayIndex(lastMs, tzOffsetMinutes);
}

/**
 * 游戏日序号：以 DAILY_RESET_HOUR 为分界。
 * @param {number} ms
 * @param {number} [tzOffsetMinutes=0]
 */
export function gameDayIndex(ms, tzOffsetMinutes = 0) {
  const shifted = (Number(ms) || 0) + tzOffsetMinutes * MINUTE - DAILY_RESET_HOUR * HOUR;
  return Math.floor(shifted / DAY);
}

/**
 * 把毫秒格式化成 `1天02:03` / `02:03:04` / `03:04`，供 UI 直接使用（纯函数）。
 * @param {number} ms
 * @returns {string}
 */
export function formatDuration(ms) {
  const total = Math.max(0, Math.floor((Number(ms) || 0) / 1000));
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const pad = (n) => String(n).padStart(2, '0');
  if (days > 0) return `${days}天${pad(hours)}:${pad(minutes)}`;
  if (hours > 0) return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  return `${pad(minutes)}:${pad(seconds)}`;
}

/**
 * @param {any} now
 * @returns {() => number}
 */
function toSource(now) {
  if (typeof now === 'function') return now;
  if (typeof now === 'number' && Number.isFinite(now)) return () => now;
  if (now && typeof now === 'object' && typeof now.now === 'function') return () => now.now();
  return () => Date.now();
}

export default createClock;
