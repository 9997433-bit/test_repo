import { FLOWER_MAP, type GrowthStage } from "../data/flowers";
import { SPIRITS } from "../data/spirits";
import { WATER_CAP, WATER_REGEN_MS, type GameState } from "../engine/state";
import { FERT_MUL, NEXT_STAGE, growthMul } from "./garden";

/** 低于此离园时长不结算（页面切换的小间隙不算"离园"）。 */
export const OFFLINE_MIN_MS = 30_000;
/** 离线生长的时长封顶：回水与生长最多按 2 小时计。 */
export const OFFLINE_GROWTH_CAP_MS = 2 * 60 * 60_000;

export interface OfflineReport {
  awayMs: number;
  settledMs: number;
  waterGained: number;
  stageAdvances: number;
  /** 离线期间开到盛放的花（flowerId，可重复）。 */
  bloomed: string[];
}

/**
 * 回归结算（原作核心留存机制）。规则偏善意：
 * - 生长：浇够水的阶段按真实时长推进；带「自动浇水」的花灵可以连推多段直至盛放。
 * - 不惩罚：离线期间花不枯萎；已盛放的花保留，且回来后至少还有大半个花期的宽限再谈枯萎。
 * - 订单计时暂停：dueAt 整体顺延，客人愿意等你回来。
 * - 回水：按离线时长回满水缸（受上限约束）。
 * 生长倍率取存档时刻的季节（离线跨季不逐段重算，误差可接受）。
 */
export function settleOffline(state: GameState, wallNow: number): OfflineReport | null {
  const awayMs = wallNow - state.now;
  if (awayMs < OFFLINE_MIN_MS) return null;
  const savedNow = state.now;
  const settledMs = Math.min(awayMs, OFFLINE_GROWTH_CAP_MS);
  const report: OfflineReport = { awayMs, settledMs, waterGained: 0, stageAdvances: 0, bloomed: [] };

  const acc = state.waterAcc + settledMs;
  const drops = Math.floor(acc / WATER_REGEN_MS);
  report.waterGained = Math.max(0, Math.min(WATER_CAP - state.water, drops));
  state.water += report.waterGained;
  state.waterAcc = acc % WATER_REGEN_MS;

  const spirit = SPIRITS.find((s) => s.id === state.activeSpirit);
  for (const plot of state.plots) {
    const def = plot.flowerId ? FLOWER_MAP[plot.flowerId] : undefined;
    if (!def || plot.stage === "empty" || plot.stage === "wilt") continue;

    if (plot.stage === "bloom") {
      const idle = Math.max(0, savedNow - plot.lastTick);
      plot.lastTick = wallNow - Math.min(idle, def.growMs * 0.9);
      continue;
    }

    let elapsed = Math.max(0, savedNow - plot.lastTick);
    let budget = settledMs;
    let guard = 0;
    while (guard++ < 6) {
      if (plot.watered < def.waterNeed) {
        if (!spirit?.autoWater) break;
        plot.watered = def.waterNeed;
      }
      const mul = growthMul(state, def.id) * (plot.fertilized ? FERT_MUL : 1);
      const needRealMs = def.growMs / 3 / mul;
      const remain = Math.max(0, needRealMs - elapsed);
      if (budget < remain) {
        elapsed += budget;
        break;
      }
      budget -= remain;
      const next: GrowthStage | undefined = NEXT_STAGE[plot.stage as keyof typeof NEXT_STAGE];
      if (!next || next === "wilt") break;
      plot.stage = next;
      report.stageAdvances += 1;
      elapsed = 0;
      if (next === "bloom") {
        report.bloomed.push(def.id);
        break;
      }
      plot.watered = 0;
    }
    plot.lastTick = wallNow - elapsed;
  }

  for (const o of state.orders) o.dueAt += awayMs;
  state.now = wallNow;
  return report;
}

export function formatAway(ms: number): string {
  const mins = Math.max(1, Math.round(ms / 60_000));
  if (mins < 60) return `${mins} 分钟`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h} 时 ${m} 分` : `${h} 时`;
}
