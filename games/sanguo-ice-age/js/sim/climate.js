/** 气候：世界渐冷 + 周期寒潮 + 火炉供热与燃料消耗。 */
import { CLIMATE, FUEL, TICKS_PER_DAY, clamp } from "../config.js";
import { pushLog } from "./state.js";

/** 第 i 次寒潮（i>=1）的起始日与温降。 */
export function blizzardOfIndex(i) {
  const start = CLIMATE.blizzardEveryDays * i;
  const delta = Math.max(
    CLIMATE.blizzardDeltaFloor,
    CLIMATE.blizzardTempDelta + CLIMATE.blizzardEscalation * (i - 1),
  );
  return { index: i, start, end: start + CLIMATE.blizzardDurationDays - 1, delta };
}

/** 某一天的寒潮信息：{ active, current, next }。 */
export function blizzardAtDay(day) {
  const i = Math.max(1, Math.floor(day / CLIMATE.blizzardEveryDays));
  for (const idx of [i, i + 1]) {
    const b = blizzardOfIndex(idx);
    if (day >= b.start && day <= b.end) {
      return { active: true, current: b, next: blizzardOfIndex(idx + 1) };
    }
  }
  const nextIdx = Math.floor(day / CLIMATE.blizzardEveryDays) + 1;
  return { active: false, current: null, next: blizzardOfIndex(nextIdx) };
}

export function worldBaseTemp(day) {
  return Math.max(
    CLIMATE.worldCoolingFloor,
    CLIMATE.baseTemp - CLIMATE.worldCoolingPerDay * (day - 1),
  );
}

/** 火炉当前供热（受档位与燃料是否断供影响）。 */
export function heatOutput(state) {
  const mode = FUEL.modes[state.fuel.mode];
  if (!mode || mode.heat === 0 || state.fuel.starved) return 0;
  return state.buildings.furnace * CLIMATE.furnaceHeatPerLevel * mode.heat;
}

export function computeTemperature(state) {
  const bz = blizzardAtDay(state.day);
  const delta = bz.active ? bz.current.delta : 0;
  return worldBaseTemp(state.day) + delta + heatOutput(state);
}

/** 每 tick 燃料需求（换算成木材单位）。 */
export function fuelNeedPerTick(state) {
  const mode = FUEL.modes[state.fuel.mode];
  if (!mode || mode.fuel === 0) return 0;
  const perDay = (FUEL.woodPerDayBase + FUEL.woodPerDayPerLevel * state.buildings.furnace) * mode.fuel;
  return perDay / TICKS_PER_DAY;
}

export function tempBand(temp) {
  if (temp < CLIMATE.freezeThreshold) return "freeze";
  if (temp < CLIMATE.coldThreshold) return "cold";
  if (temp >= CLIMATE.comfortThreshold) return "comfort";
  return "normal";
}

export function tickClimate(state, events) {
  // —— 燃料 ——
  const needWood = fuelNeedPerTick(state);
  if (needWood > 0) {
    const needCoal = needWood * FUEL.coalPerWoodUnit;
    const src = state.fuel.source;
    let burned = false;
    const tryCoal = () => {
      if (state.resources.coal >= needCoal) {
        state.resources.coal -= needCoal;
        return true;
      }
      return false;
    };
    const tryWood = () => {
      if (state.resources.wood >= needWood) {
        state.resources.wood -= needWood;
        return true;
      }
      return false;
    };
    if (src === "coal") burned = tryCoal();
    else if (src === "wood") burned = tryWood();
    else burned = tryWood() || tryCoal(); // 自动：先烧木，缺木才动煤（煤留作升级与高效燃料）

    if (!burned && !state.fuel.starved) {
      state.fuel.starved = true;
      pushLog(state, "燃料告罄！火炉熄灭，全城温度骤降。", "danger");
      events.push({ type: "fuel-out" });
    } else if (burned && state.fuel.starved) {
      state.fuel.starved = false;
      pushLog(state, "燃料恢复，火炉重新燃起。", "good");
      events.push({ type: "fuel-restored" });
    }
  } else {
    state.fuel.starved = false;
  }

  // —— 寒潮进出 ——
  const bz = blizzardAtDay(state.day);
  if (bz.active && !state.blizzard.active) {
    state.blizzard = { active: true, index: bz.current.index, endsOnDay: bz.current.end };
    pushLog(state, `第 ${bz.current.index} 次寒潮来袭！气温骤降 ${Math.abs(bz.current.delta)}°。`, "danger");
    events.push({ type: "blizzard-start", index: bz.current.index });
  } else if (!bz.active && state.blizzard.active) {
    state.blizzard.active = false;
    if (state.population > 0) {
      state.stats.blizzardsSurvived++;
      pushLog(state, `寒潮退去，全城上下熬过了第 ${state.blizzard.index} 次寒潮。`, "good");
      events.push({ type: "blizzard-end", index: state.blizzard.index });
    }
  }

  state.temperature = computeTemperature(state);
  return clamp(state.temperature, -60, 40);
}
