/** 人口与民心：严寒/饥荒/民心崩溃导致流失；温饱安居带来增长。 */
import { TICKS_PER_DAY, MORALE, POPULATION, WALL, clamp } from "../config.js";
import { popCap, pushLog } from "./state.js";
import { tempBand } from "./climate.js";

export function clinicRelief(state) {
  return Math.min(0.6, state.buildings.clinic * MORALE.clinicReliefPerLevel);
}

export function wallProtect(state) {
  return Math.min(WALL.blizzardProtectMax, state.buildings.wall * WALL.blizzardProtectPerLevel);
}

export function tickPopulation(state, events) {
  const band = tempBand(state.temperature);
  const relief = clinicRelief(state);
  const wall = state.blizzard.active ? wallProtect(state) : 0;
  const perTick = 1 / TICKS_PER_DAY;

  // —— 民心 ——
  let moraleDelta = 0;
  if (band === "freeze") moraleDelta -= MORALE.freezeDrain * (1 - relief) * (1 - wall);
  else if (band === "cold") moraleDelta -= MORALE.coldDrain * (1 - relief);
  else if (band === "comfort") moraleDelta += MORALE.comfortGain;
  else moraleDelta += MORALE.comfortGain * 0.35;
  moraleDelta += state.buildings.kitchen * MORALE.kitchenGainPerLevel;
  if (state.starving) moraleDelta -= MORALE.starveDrain;
  state.morale = clamp(state.morale + moraleDelta * perTick, 0, MORALE.max);

  // —— 人口流失 ——
  let lossRate = 0;
  const causes = [];
  if (band === "freeze") {
    lossRate += POPULATION.freezeLossPerDay * (1 - Math.min(0.6, state.buildings.clinic * POPULATION.clinicLossReducePerLevel)) * (1 - wall);
    causes.push("冻毙");
  }
  if (state.starving) {
    lossRate += POPULATION.starveLossPerDay;
    causes.push("饿殍");
  }
  if (state.morale <= MORALE.collapseAt) {
    lossRate += POPULATION.fleeLossPerDay;
    causes.push("出逃");
  }

  if (lossRate > 0 && state.population > 0) {
    const before = Math.floor(state.population);
    state.population = Math.max(0, state.population - state.population * lossRate * perTick);
    const after = Math.floor(state.population);
    if (after < before) {
      state.stats.popLost += before - after;
      pushLog(state, `${causes.join("、")}：失去 ${before - after} 名百姓（余 ${after}）。`, "danger");
      events.push({ type: "pop-loss", amount: before - after });
    }
    if (state.population <= 0.5) {
      state.population = 0;
      if (!state.gameOver) {
        state.gameOver = true;
        pushLog(state, "城中再无人烟……冰原吞没了一切。", "danger");
        events.push({ type: "game-over" });
      }
    }
    return;
  }

  // —— 增长 ——
  const cap = popCap(state);
  const warm = band === "comfort" || band === "normal";
  if (warm && !state.starving && state.morale >= 50 && state.population < cap && state.population > 0) {
    const growth = state.population * POPULATION.growthPerDay * (state.morale / 100) * perTick;
    const before = Math.floor(state.population);
    state.population = Math.min(cap, state.population + growth);
    const after = Math.floor(state.population);
    if (after > before) {
      pushLog(state, `流民来投，人口增至 ${after}。`, "good");
      events.push({ type: "pop-gain", amount: after - before });
    }
    state.stats.popPeak = Math.max(state.stats.popPeak, state.population);
  }
}
