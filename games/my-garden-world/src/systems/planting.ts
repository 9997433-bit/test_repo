import { FLOWER_MAP } from "../data/flowers";
import { emit } from "../engine/events";
import { MAX_PLOTS, emptyPlot, type GameState } from "../engine/state";
import { addCoins, addExp, addItem, bumpQuest, spendCoins } from "./economy";

export function plant(state: GameState, plotId: number, flowerId: string): boolean {
  const plot = state.plots[plotId];
  const def = FLOWER_MAP[flowerId];
  if (!plot || !def || plot.stage !== "empty") return false;
  if (!state.unlockedFlowers.includes(flowerId)) return false;
  if (!spendCoins(state, def.seedCost)) {
    emit({ type: "toast", text: "金币不足，买不起这袋种子", tone: "warn" });
    return false;
  }
  plot.flowerId = flowerId;
  plot.stage = "seeded";
  plot.plantedAt = state.now;
  plot.watered = 0;
  plot.fertilized = false;
  plot.lastTick = state.now;
  state.stats.planted += 1;
  bumpQuest(state, "plant3");
  emit({ type: "toast", text: `已种下${def.name}`, tone: "ok" });
  return true;
}

export function waterPlot(state: GameState, plotId: number): boolean {
  const plot = state.plots[plotId];
  const def = plot?.flowerId ? FLOWER_MAP[plot.flowerId] : undefined;
  if (!plot || !def || plot.stage === "empty" || plot.stage === "bloom" || plot.stage === "wilt") return false;
  if (plot.watered >= def.waterNeed) return false;
  if (state.water <= 0) {
    emit({ type: "toast", text: "水缸空了，等一等或去做订单", tone: "warn" });
    return false;
  }
  state.water -= 1;
  plot.watered += 1;
  if (plot.watered >= def.waterNeed) emit({ type: "toast", text: `${def.name}已浇透`, tone: "ok" });
  return true;
}

export function fertilize(state: GameState, plotId: number): boolean {
  const plot = state.plots[plotId];
  if (!plot || plot.stage === "empty" || plot.fertilized) return false;
  if (state.nectar < 1 && state.coins < 25) return false;
  if (state.nectar >= 1) state.nectar -= 1;
  else state.coins -= 25;
  plot.fertilized = true;
  emit({ type: "toast", text: "施肥完成，花期将提前", tone: "ok" });
  return true;
}

export function harvest(state: GameState, plotId: number): boolean {
  const plot = state.plots[plotId];
  const def = plot?.flowerId ? FLOWER_MAP[plot.flowerId] : undefined;
  if (!plot || !def || (plot.stage !== "bloom" && plot.stage !== "wilt")) return false;
  const wilted = plot.stage === "wilt";
  addItem(state, def.id, wilted ? 0 : 1);
  addCoins(state, wilted ? Math.round(def.harvestCoin * 0.2) : def.harvestCoin);
  addExp(state, wilted ? 2 : def.harvestExp);
  if (wilted) {
    emit({ type: "toast", text: `${def.name}已凋残，只清出些许残料`, tone: "warn" });
  } else {
    state.stats.harvested += 1;
    bumpQuest(state, "harvest3");
    emit({ type: "harvest", flowerId: def.id, plotId });
    emit({ type: "toast", text: `收得${def.name}一枝`, tone: "ok" });
  }
  state.plots[plotId] = emptyPlot(plotId);
  return !wilted;
}

export function unlockPlot(state: GameState): boolean {
  if (state.plots.length >= MAX_PLOTS) return false;
  const cost = 80 + state.plots.length * 40;
  if (!spendCoins(state, cost)) {
    emit({ type: "toast", text: `扩建需 ${cost} 金`, tone: "warn" });
    return false;
  }
  state.plots.push(emptyPlot(state.plots.length));
  emit({ type: "toast", text: "新的花圃开垦好了", tone: "ok" });
  return true;
}
