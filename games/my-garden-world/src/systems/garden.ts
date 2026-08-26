import { FLOWER_MAP, type FlowerDef, type GrowthStage } from "../data/flowers";
import { emit } from "../engine/events";
import type { GameState, Plot } from "../engine/state";
import { SPIRITS, type SpiritDef } from "../data/spirits";

const NEXT: Record<Exclude<GrowthStage, "empty" | "wilt">, GrowthStage> = {
  seeded: "sprout",
  sprout: "bud",
  bud: "bloom",
  bloom: "wilt",
};

/** 绽放后可停留的时长倍率：闲置超过 growMs × 此值即凋残。 */
export const WILT_AFTER_MUL = 1.8;

export function activeSpirit(state: GameState): SpiritDef | undefined {
  return SPIRITS.find((s) => s.id === state.activeSpirit);
}

export function plotFlower(plot: Plot): FlowerDef | undefined {
  return plot.flowerId ? FLOWER_MAP[plot.flowerId] : undefined;
}

export function growthMul(state: GameState, flowerId: string): number {
  const def = FLOWER_MAP[flowerId];
  if (!def) return 1;
  let mul = def.season === state.season ? 1.35 : 0.75;
  const spirit = activeSpirit(state);
  if (spirit) mul *= spirit.growMul;
  return mul;
}

export function plotProgress(state: GameState, plot: Plot): number {
  if (!plot.flowerId || plot.stage === "empty") return 0;
  const def = FLOWER_MAP[plot.flowerId];
  if (!def) return 0;
  const need = def.growMs / 3;
  const elapsed = state.now - plot.lastTick;
  const fert = plot.fertilized ? 1.45 : 1;
  return Math.min(1, (elapsed * growthMul(state, plot.flowerId) * fert) / need);
}

/** 当前湿度 0..1：已浇水量与该花所需水量之比。空圃返回 0。 */
export function moisture(plot: Plot): number {
  const def = plotFlower(plot);
  if (!def || plot.stage === "empty") return 0;
  if (def.waterNeed <= 0) return 1;
  return Math.min(1, Math.max(0, plot.watered / def.waterNeed));
}

/** 生长期缺水（会卡住生长）时为真；空圃、绽放与凋残不计。 */
export function isThirsty(plot: Plot): boolean {
  const def = plotFlower(plot);
  if (!def || plot.stage === "empty" || plot.stage === "bloom" || plot.stage === "wilt") return false;
  return plot.watered < def.waterNeed;
}

/** 花期新鲜度 1..0：1 为刚绽放，0 为即将凋残。非绽放期恒为 1。 */
export function freshness(state: GameState, plot: Plot): number {
  const def = plotFlower(plot);
  if (!def || plot.stage !== "bloom") return 1;
  if (activeSpirit(state)?.wiltGuard) return 1;
  const span = def.growMs * WILT_AFTER_MUL;
  if (span <= 0) return 0;
  return Math.min(1, Math.max(0, 1 - (state.now - plot.lastTick) / span));
}

export function tickGarden(state: GameState, _dt: number): void {
  const spirit = activeSpirit(state);
  for (const plot of state.plots) {
    if (!plot.flowerId || plot.stage === "empty") continue;
    const def = FLOWER_MAP[plot.flowerId];
    if (!def) continue;
    if (spirit?.autoWater && plot.stage !== "bloom" && plot.stage !== "wilt" && plot.watered < def.waterNeed) {
      plot.watered = def.waterNeed;
    }
    if (plot.stage === "bloom") {
      const idle = state.now - plot.lastTick;
      if (idle > def.growMs * WILT_AFTER_MUL && !spirit?.wiltGuard) {
        plot.stage = "wilt";
      }
      continue;
    }
    if (plot.stage === "wilt") continue;
    if (plot.watered < def.waterNeed) continue;
    if (plotProgress(state, plot) < 1) continue;
    const next = NEXT[plot.stage as keyof typeof NEXT];
    if (!next) continue;
    plot.stage = next;
    plot.lastTick = state.now;
    if (next !== "bloom") plot.watered = 0;
    if (next === "bloom") emit({ type: "bloom", plotId: plot.id });
  }
}
