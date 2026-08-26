import { tickGarden } from "../systems/garden";
import { emit } from "./events";
import { WATER_CAP, WATER_REGEN_MS, type GameState } from "./state";
import { advanceClock } from "./time";

/** 离园补算上限：走再久，回来最多按 2 小时结算。 */
export const OFFLINE_CAP_MS = 2 * 60 * 60 * 1000;
/** 小于这个间隔算连续游玩（切标签、掉帧），不做补算。 */
export const OFFLINE_MIN_MS = 5_000;
/** 补算步长：2s 一步，既能踩准阶段跃迁，2 小时也只有 3600 步。 */
const STEP_MS = 2_000;
/** 低于 1 分钟不打扰玩家。 */
const REPORT_MIN_MS = 60_000;

export interface OfflineReport {
  /** 真实离园时长。 */
  elapsedMs: number;
  /** 实际计入结算的时长（封顶后）。 */
  appliedMs: number;
  capped: boolean;
  /** 补充的水滴数。 */
  water: number;
  /** 阶段被推进的花圃数。 */
  grown: number;
  /** 期间新开放的花数。 */
  bloomed: number;
}

function spanLabel(ms: number): string {
  const min = Math.round(ms / 60_000);
  if (min < 60) return `${min} 分`;
  const h = Math.floor(min / 60);
  const rest = min % 60;
  return rest ? `${h} 时 ${rest} 分` : `${h} 时`;
}

/**
 * 离园补算：把模拟时钟往前推到墙钟（封顶 OFFLINE_CAP_MS），
 * 期间照常回水、催花，但不让花枯萎、也不让订单在无人时失约。
 * 加载与从后台恢复各调用一次；lastSeenAt 每次都会重置到 now，
 * 所以超出封顶的那段时间是丢弃而不是攒着下次再领。
 */
export function applyOfflineCatchUp(
  state: GameState,
  now = Date.now(),
  capMs = OFFLINE_CAP_MS,
): OfflineReport {
  const last = typeof state.lastSeenAt === "number" && Number.isFinite(state.lastSeenAt) ? state.lastSeenAt : now;
  const elapsedMs = Math.max(0, now - last);
  state.lastSeenAt = now;
  const report: OfflineReport = {
    elapsedMs,
    appliedMs: 0,
    capped: false,
    water: 0,
    grown: 0,
    bloomed: 0,
  };
  if (elapsedMs < OFFLINE_MIN_MS) return report;

  const appliedMs = Math.min(elapsedMs, Math.max(0, capMs));
  report.appliedMs = appliedMs;
  report.capped = elapsedMs > appliedMs;
  if (appliedMs <= 0) return report;

  const waterBefore = state.water;
  const stageBefore = state.plots.map((p) => p.stage);
  // 订单整体顺延：客人不会趁人不在的时候拂袖而去
  for (const order of state.orders) order.dueAt += appliedMs;

  let remain = appliedMs;
  while (remain > 0) {
    const step = Math.min(STEP_MS, remain);
    remain -= step;
    state.now += step;
    advanceClock(state, step);
    state.waterAcc += step;
    while (state.waterAcc >= WATER_REGEN_MS) {
      state.waterAcc -= WATER_REGEN_MS;
      if (state.water < WATER_CAP) state.water += 1;
    }
    // 盛放的花把静置计时一起顺延，离园不会回来满园凋零
    for (const plot of state.plots) if (plot.stage === "bloom") plot.lastTick += step;
    tickGarden(state, step);
  }

  report.water = state.water - waterBefore;
  for (let i = 0; i < state.plots.length; i += 1) {
    const stage = state.plots[i]?.stage;
    const before = stageBefore[i];
    if (!stage || !before || stage === before) continue;
    report.grown += 1;
    if (stage === "bloom") report.bloomed += 1;
  }

  if (appliedMs >= REPORT_MIN_MS) {
    const parts = [`离园 ${spanLabel(report.elapsedMs)}`];
    if (report.capped) parts.push(`按 ${spanLabel(appliedMs)}结算`);
    if (report.water > 0) parts.push(`+${report.water} 水`);
    if (report.bloomed > 0) parts.push(`${report.bloomed} 株已开放`);
    else if (report.grown > 0) parts.push(`${report.grown} 株长了一节`);
    emit({ type: "toast", text: parts.join(" · "), tone: "ok" });
  }
  return report;
}
