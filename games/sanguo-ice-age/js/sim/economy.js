/** 经济：岗位分配、产出、口粮与军粮消耗、仓储上限。 */
import { TICKS_PER_DAY, WORK, POPULATION, MORALE, ARMY, clamp } from "../config.js";
import { BUILDINGS } from "../data/buildings.js";
import { storageCap, totalTroops, pushLog } from "./state.js";
import { tempBand } from "./climate.js";

const PROD_ORDER = ["hunter", "lumber", "coalMine", "ironMine"];

export function productionFactors(state) {
  const band = tempBand(state.temperature);
  const temp = WORK.tempFactor[band] ?? 1;
  const morale = 0.5 + clamp(state.morale, 0, 100) / 200; // 0.5 ~ 1.0
  const academy = 1 + state.buildings.academy * WORK.academyBonusPerLevel;
  return { temp, morale, academy, total: temp * morale * academy, band };
}

/** 按固定优先级把人口填进岗位。 */
export function assignJobs(state) {
  let workers = Math.floor(state.population);
  const assigned = {};
  let total = 0;
  for (const id of PROD_ORDER) {
    const jobs = state.buildings[id] * WORK.workersPerLevel;
    total += jobs;
    const take = Math.min(jobs, workers);
    assigned[id] = take;
    workers -= take;
  }
  state.jobs = { assigned, filled: Math.min(total, Math.floor(state.population)), total };
  return state.jobs;
}

export function kitchenFoodSave(state) {
  return Math.min(0.4, state.buildings.kitchen * 0.04);
}

export function tickEconomy(state, events) {
  const factors = productionFactors(state);
  const jobs = assignJobs(state);
  const cap = storageCap(state);
  const flow = { food: 0, wood: 0, coal: 0, iron: 0 };

  // —— 产出 ——
  for (const id of PROD_ORDER) {
    const def = BUILDINGS[id];
    const perDay = (jobs.assigned[id] || 0) * WORK.outputPerWorkerDay[id] * factors.total;
    const amount = perDay / TICKS_PER_DAY;
    if (amount > 0) {
      const before = state.resources[def.prod];
      state.resources[def.prod] = Math.min(cap, before + amount);
      state.stats.produced[def.prod] += state.resources[def.prod] - before;
      flow[def.prod] += perDay;
    }
  }

  // —— 口粮 ——
  const eatPerDay = state.population * POPULATION.eatPerDay * (1 - kitchenFoodSave(state));
  const upkeepPerDay = totalTroops(state) * ARMY.upkeepFoodPerDayPerTroop;
  const foodNeed = (eatPerDay + upkeepPerDay) / TICKS_PER_DAY;
  flow.food -= eatPerDay + upkeepPerDay;

  if (state.resources.food >= foodNeed) {
    state.resources.food -= foodNeed;
    if (state.starving) {
      state.starving = false;
      pushLog(state, "存粮恢复，饥荒缓解。", "good");
    }
  } else {
    state.resources.food = 0;
    if (!state.starving) {
      state.starving = true;
      pushLog(state, "存粮见底！全城陷入饥荒，民心大跌。", "danger");
      events.push({ type: "starving" });
    }
  }

  state.flow = flow;
  return flow;
}

/** 饥荒时每 tick 额外民心流失在 population.js 里统一处理。 */
export function moraleStarveDrainPerTick() {
  return MORALE.starveDrain / TICKS_PER_DAY;
}
