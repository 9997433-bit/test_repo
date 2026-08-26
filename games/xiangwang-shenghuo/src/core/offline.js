import { advanceTime, OFFLINE_CAP_MS } from "./engine.js";

const LOG_MAX = 40;
const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;

/** 离开这一趟有多久：真实时长、封顶后用于结算的时长、以及是否被封顶。 */
export function offlineSpan(savedAt, nowMs = Date.now()) {
  const from = Number.isFinite(savedAt) ? savedAt : nowMs;
  const elapsed = Math.max(0, nowMs - from);
  const offlineMs = Math.min(elapsed, OFFLINE_CAP_MS);
  return { elapsed, offlineMs, capped: elapsed > offlineMs };
}

export function humanGap(ms) {
  if (ms < MINUTE_MS) return "一会儿";
  if (ms < HOUR_MS) return `${Math.round(ms / MINUTE_MS)} 分钟`;
  const hours = Math.floor(ms / HOUR_MS);
  const minutes = Math.round((ms % HOUR_MS) / MINUTE_MS);
  return minutes ? `${hours} 小时 ${minutes} 分钟` : `${hours} 小时`;
}

/**
 * 读档后补上离开的那段日子。日历只按封顶后的时长推进，
 * 地里、炉子上、心愿板的绝对时间戳则各自自然到期。
 * 各系统函数由调用方注入（core 不反向依赖 systems），缺哪个就跳过哪一步。
 */
export function applyOfflineCatchup(state, savedAt, nowMs = Date.now(), systems = {}) {
  const { offlineMs, capped } = offlineSpan(savedAt, nowMs);
  if (offlineMs <= 0) return { state, offlineMs: 0, capped: false };

  const { catchUpPlots, tickProduction, tickVillage } = systems;
  let next = advanceTime(state, offlineMs).state;
  if (typeof catchUpPlots === "function") next = catchUpPlots(next, savedAt, nowMs);
  if (typeof tickProduction === "function") next = tickProduction(next, offlineMs, nowMs);
  if (typeof tickVillage === "function") next = tickVillage(next, offlineMs, nowMs);

  const line = `你出门${humanGap(offlineMs)}${capped ? "（超过 8 小时的部分不另算）" : ""}，村子自己把日子过下去了。`;
  return {
    state: { ...next, log: [line, ...(next.log || [])].slice(0, LOG_MAX) },
    offlineMs,
    capped,
  };
}
