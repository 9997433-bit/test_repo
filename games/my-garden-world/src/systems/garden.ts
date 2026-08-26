import { FLOWER_MAP, type GrowthStage } from "../data/flowers";
import { emit } from "../engine/events";
import type { GameState, Plot } from "../engine/state";
import { SPIRITS } from "../data/spirits";

const NEXT: Record<Exclude<GrowthStage, "empty" | "wilt">, GrowthStage> = {
  seeded: "sprout",
  sprout: "bud",
  bud: "bloom",
  bloom: "wilt",
};

export function growthMul(state: GameState, flowerId: string): number {
  const def = FLOWER_MAP[flowerId];
  if (!def) return 1;
  let mul = def.season === state.season ? 1.35 : 0.75;
  const spirit = SPIRITS.find((s) => s.id === state.activeSpirit);
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

export function tickGarden(state: GameState, _dt: number): void {
  const spirit = SPIRITS.find((s) => s.id === state.activeSpirit);
  for (const plot of state.plots) {
    if (!plot.flowerId || plot.stage === "empty") continue;
    const def = FLOWER_MAP[plot.flowerId];
    if (!def) continue;
    if (spirit?.autoWater && plot.stage !== "bloom" && plot.stage !== "wilt" && plot.watered < def.waterNeed) {
      plot.watered = def.waterNeed;
    }
    if (plot.stage === "bloom") {
      const idle = state.now - plot.lastTick;
      if (idle > def.growMs * 1.8 && !spirit?.wiltGuard) {
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
