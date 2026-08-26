// 仙府层由别的模块所有者演进：离线折算契约（offlineEfficiency / offlineProduce）缺席时退回满效率，
// 而不是让 BOOT/RESUME 崩在导入上。
import * as production from "../mansion/production.js";
import { addRes, emptyYield, hasGain, mergeYield, nonNeg } from "./state.js";

/** 离线最多结算 8 小时。 */
export const OFFLINE_CAP_SEC = 8 * 3600;
/** 不超过 8 秒的空窗视为「没离开」，直接入账，不打扰玩家。 */
export const OFFLINE_DIRECT_SEC = 8;

export const OFFLINE_MODE = { idle: "idle", direct: "direct", banked: "banked" };

/**
 * 离线窗口：raw 是真实流逝秒数，seconds 是封顶后可结算秒数。
 * 时钟回拨（now < lastTick）与首次开档（lastTick=0）都收敛到 0。
 */
export function offlineWindow(lastTick, now) {
  const last = nonNeg(lastTick, 0);
  const at = nonNeg(now, 0);
  const rawSec = last > 0 && at > last ? (at - last) / 1000 : 0;
  const seconds = Math.min(OFFLINE_CAP_SEC, rawSec);
  return {
    rawSec,
    seconds,
    capped: rawSec > OFFLINE_CAP_SEC,
    mode: seconds > OFFLINE_DIRECT_SEC ? OFFLINE_MODE.banked : OFFLINE_MODE.direct,
  };
}

/**
 * 挂机折算率：聚灵阵总等级越高越接近在线（仙府层的 offlineEfficiency 说了算）。
 * 契约缺席时按满效率结算，宁可多给也不静默扣产出。
 */
export function offlineEfficiency(state) {
  const eff = production.offlineEfficiency?.(state);
  return Number.isFinite(eff) ? Math.max(0, eff) : 1;
}

/** 折算后的离线产出，优先走仙府层的 offlineProduce。 */
export function offlineGain(state, seconds) {
  if (typeof production.offlineProduce === "function") return production.offlineProduce(state, seconds);
  return production.produce(state, seconds, { efficiency: offlineEfficiency(state) });
}

/**
 * 结算一次离线：
 * - 未开府或窗口为 0 → 什么都不动（mode=idle）
 * - 窗口 ≤ 8s → 满效率直接进资源（mode=direct，视为「没离开」）
 * - 窗口 > 8s → 按聚灵阵折算后进挂机匣，并与上一笔未领取的产出合并（mode=banked）
 */
export function settleOffline(state, now) {
  const window = offlineWindow(state?.meta?.lastTick, now);
  const prevPending = state?.offline?.pending ?? null;
  const prevSeconds = nonNeg(state?.offline?.seconds, 0);
  const banked = window.mode === OFFLINE_MODE.banked;
  const efficiency = banked ? offlineEfficiency(state) : 1;
  const keep = {
    ...window,
    mode: OFFLINE_MODE.idle,
    efficiency,
    gain: emptyYield(),
    resources: state?.resources ?? {},
    offline: { pending: prevPending, seconds: prevSeconds, at: nonNeg(state?.offline?.at, 0) },
  };
  if (!state?.meta?.faction || window.seconds <= 0) return keep;

  const gain = banked ? offlineGain(state, window.seconds) : production.produce(state, window.seconds);
  if (!hasGain(gain)) return keep;

  if (!banked) {
    return {
      ...window,
      efficiency,
      gain,
      resources: addRes(state.resources, gain),
      offline: { pending: prevPending, seconds: prevSeconds, at: nonNeg(now, 0) },
    };
  }
  return {
    ...window,
    efficiency,
    gain,
    resources: state.resources,
    offline: {
      pending: mergeYield(prevPending, gain),
      seconds: prevSeconds + window.seconds,
      at: nonNeg(now, 0),
    },
  };
}

export function offlineSummary(offline) {
  const seconds = nonNeg(offline?.seconds, 0);
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  return hours > 0 ? `${hours} 时 ${mins} 分` : `${mins} 分`;
}
