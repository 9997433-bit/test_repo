/**
 * 气候系统 — 火炉燃料、城温、周期性寒潮。
 *
 * 温度模型：
 *   目标温度 = 基准气温 + 季节性降温 + 寒潮修正 + 火炉热量 + 城墙挡风
 *   实际温度 带热惯性地趋近目标温度（每 tick 移动 TEMP_INERTIA 比例）
 *
 * 时间推进按「天」结算寒潮：天数取 max(meta.day, floor(tick / TICKS_PER_DAY))，
 * 因此无论引擎是否自行推进 meta.day，寒潮都会准时到来。
 */
import * as CONFIG from "../config.js";
import {
  catalogOf,
  clamp,
  dayOfTick,
  ensureState,
  insulation,
  num,
  obj,
  pushLog,
} from "./city.js";

/** 温度热惯性：每 tick 向目标温度靠拢的比例。 */
export const TEMP_INERTIA = 0.34;

/** 气候默认参数（config.js 的 CLIMATE 会覆盖同名字段）。 */
export const CLIMATE_DEFAULTS = {
  baseTemp: 4,
  furnaceHeatPerLevel: 3.2,
  fuelWoodPerTick: 0.08,
  fuelCoalPerTick: 0.035,
  blizzardEveryDays: 7,
  blizzardDurationDays: 2,
  blizzardTempDelta: -14,
  freezeThreshold: -6,
  coldThreshold: 0,
  comfortThreshold: 8,
  // 以下为本系统补充的可调项
  blizzardFuelMult: 1.4,
  // 每场寒潮 +0.06 烈度 ≈ 每场多 0.84 度寒气，约每两场需要一级火炉（+3.2 度）跟进，
  // 与 data/buildings.js 的火炉前置链推进速度大致匹配。
  blizzardSeverityStep: 0.06,
  blizzardSeverityMax: 2,
  blizzardDurationGrowthDays: 30,
  seasonalDropPerDay: 0.04,
  seasonalDropCap: 6,
  windbreakCap: 6,
  minTemp: -45,
  maxTemp: 30,
};

/** 合并配置：默认值 < config.CLIMATE < 调用方 cfg。 */
export function climateConfig(cfg) {
  return { ...CLIMATE_DEFAULTS, ...obj(CONFIG.CLIMATE), ...obj(cfg) };
}

/* ------------------------------------------------------------------ *
 * 温度
 * ------------------------------------------------------------------ */

/**
 * 当前状态下的**目标**城温（纯函数，不改 state）。
 * state.climate.temp 会在 tickClimate 中带惯性趋近该值。
 */
export function cityTemperature(state, cfg) {
  const c = climateConfig(cfg);
  const climate = obj(state?.climate);
  const day = Math.max(0, Math.floor(num(state?.meta?.day, 0)));

  const seasonal = -Math.min(c.seasonalDropCap, day * c.seasonalDropPerDay);

  const severity = blizzardSeverity(state, c);
  const blizzard = climate.blizzardDaysLeft > 0 ? c.blizzardTempDelta * severity : 0;

  const level = furnaceLevel(state);
  const efficiency = clamp(num(climate.fuelEfficiency, 1), 0, 1);
  const heat = climate.furnaceLit && level > 0 ? level * c.furnaceHeatPerLevel * efficiency : 0;

  // 民居 / 厨房 / 城墙的保温与挡风：只在环境低于基准时生效
  const outdoor = c.baseTemp + seasonal + blizzard;
  const shelter = outdoor < c.baseTemp ? Math.min(c.windbreakCap, shelterWarmth(state)) : 0;

  return round2(clamp(outdoor + heat + shelter, c.minTemp, c.maxTemp));
}

/** 建筑提供的保温 / 挡风总值（warmth + windbreakPerLevel，按等级累加）。 */
export function shelterWarmth(state, catalog) {
  return insulation(state, catalog);
}

/** 已建成的取暖类建筑数量（state.city.warmthBuildings 由本系统维护）。 */
export function countWarmthBuildings(state, catalog) {
  const cat = catalogOf(catalog ?? state?.city?.catalog);
  const buildings = obj(state?.city?.buildings);
  let n = 0;
  for (const [id, entry] of Object.entries(buildings)) {
    if (Math.floor(num(entry?.level, 0)) <= 0) continue;
    if (num(cat[id]?.warmth, 0) > 0 || num(cat[id]?.windbreakPerLevel, 0) > 0) n += 1;
  }
  return n;
}

/** 当前寒潮烈度（未处于寒潮时返回已记录值，最小 1）。 */
export function blizzardSeverity(state, cfg) {
  const c = climateConfig(cfg);
  const raw = num(state?.climate?.blizzardSeverity, 1);
  return clamp(raw, 1, c.blizzardSeverityMax);
}

/**
 * 气候对产出的系数：越冷产出越低。
 *   >= 舒适阈值        1.05
 *   寒冷~舒适          0.85 → 1.05
 *   冰点~寒冷          0.55 → 0.85
 *   低于冰点           0.55 起继续下滑，最低 0.20
 */
export function climateOutputFactor(state, cfg) {
  const c = climateConfig(cfg);
  const t = num(state?.climate?.temp, c.baseTemp);
  if (t >= c.comfortThreshold) return 1.05;
  if (t >= c.coldThreshold) {
    const k = (t - c.coldThreshold) / Math.max(1e-6, c.comfortThreshold - c.coldThreshold);
    return 0.85 + 0.2 * k;
  }
  if (t >= c.freezeThreshold) {
    const k = (t - c.freezeThreshold) / Math.max(1e-6, c.coldThreshold - c.freezeThreshold);
    return 0.55 + 0.3 * k;
  }
  return clamp(0.55 + (t - c.freezeThreshold) * 0.02, 0.2, 0.55);
}

/** UI 用的温度档位文案。 */
export function climateLabel(state, cfg) {
  const c = climateConfig(cfg);
  const t = num(state?.climate?.temp, c.baseTemp);
  if (state?.climate?.blizzardDaysLeft > 0) return "寒潮";
  if (t < c.freezeThreshold) return "酷寒";
  if (t < c.coldThreshold) return "严寒";
  if (t < c.comfortThreshold) return "湿冷";
  return "温暖";
}

/* ------------------------------------------------------------------ *
 * 火炉
 * ------------------------------------------------------------------ */

function furnaceLevel(state) {
  const a = num(state?.city?.furnaceLevel, 0);
  const b = num(state?.city?.buildings?.furnace?.level, 0);
  return Math.max(0, Math.floor(Math.max(a, b)));
}

/** 点燃火炉。 */
export function lightFurnace(state) {
  if (!state || typeof state !== "object") return false;
  state.climate = obj(state.climate);
  if (state.climate.furnaceLit === true) return true;
  if (furnaceLevel(state) <= 0) return false;
  state.climate.furnaceLit = true;
  pushLog(state, "火炉重新点燃，暖意在城中散开", "good");
  return true;
}

/** 熄灭火炉（省燃料）。 */
export function extinguishFurnace(state) {
  if (!state || typeof state !== "object") return false;
  state.climate = obj(state.climate);
  if (state.climate.furnaceLit === false) return true;
  state.climate.furnaceLit = false;
  state.climate.fuelEfficiency = 0;
  pushLog(state, "火炉已封火，燃料停止消耗", "warn");
  return true;
}

/**
 * 本 tick 的燃料消耗。优先烧煤（热值高、消耗少），不足时补木材。
 * 燃料完全耗尽则熄火。返回 { coal, wood, efficiency }。
 */
export function burnFuel(state, cfg) {
  const c = climateConfig(cfg);
  const climate = (state.climate = obj(state.climate));
  const res = (state.resources = obj(state.resources));
  const level = furnaceLevel(state);

  if (climate.furnaceLit !== true || level <= 0) {
    climate.fuelEfficiency = 0;
    climate.fuelBurn = { coal: 0, wood: 0 };
    return { coal: 0, wood: 0, efficiency: 0 };
  }

  const intensity = climate.blizzardDaysLeft > 0 ? c.blizzardFuelMult : 1;
  const coalNeed = Math.max(0, c.fuelCoalPerTick * level * intensity);
  const woodNeed = Math.max(0, c.fuelWoodPerTick * level * intensity);

  let remaining = 1; // 尚未满足的热量份额

  let coalUse = 0;
  if (coalNeed > 0) {
    coalUse = Math.min(Math.max(0, num(res.coal, 0)), coalNeed * remaining);
    res.coal = Math.max(0, num(res.coal, 0) - coalUse);
    remaining = Math.max(0, remaining - coalUse / coalNeed);
  }

  let woodUse = 0;
  if (remaining > 1e-6 && woodNeed > 0) {
    woodUse = Math.min(Math.max(0, num(res.wood, 0)), woodNeed * remaining);
    res.wood = Math.max(0, num(res.wood, 0) - woodUse);
    remaining = Math.max(0, remaining - woodUse / woodNeed);
  }

  const efficiency = clamp(1 - remaining, 0, 1);
  climate.fuelEfficiency = round2(efficiency);
  climate.fuelBurn = { coal: round3(coalUse), wood: round3(woodUse) };

  if (remaining > 1e-6) {
    climate.furnaceLit = false;
    climate.fuelEfficiency = 0;
    pushLog(state, "燃料耗尽，火炉熄灭了！", "bad");
  }

  return { coal: coalUse, wood: woodUse, efficiency };
}

/* ------------------------------------------------------------------ *
 * 寒潮
 * ------------------------------------------------------------------ */

/**
 * 立刻开启一场寒潮。持续天数随游戏进程缓慢增长，烈度逐次递增。
 */
export function startBlizzard(state, cfg) {
  try {
    if (!state || typeof state !== "object") return state;
    const c = climateConfig(cfg);
    ensureState(state);
    const climate = state.climate;
    const day = Math.max(0, Math.floor(num(state.meta.day, 0)));

    const count = Math.max(0, Math.floor(num(climate.blizzardCount, 0)));
    climate.blizzardCount = count + 1;
    climate.blizzardSeverity = clamp(
      1 + count * c.blizzardSeverityStep,
      1,
      c.blizzardSeverityMax,
    );

    const extraDays = Math.floor(day / Math.max(1, c.blizzardDurationGrowthDays));
    climate.blizzardDaysLeft = Math.max(1, Math.floor(c.blizzardDurationDays + extraDays));
    climate.nextBlizzardIn = Math.max(1, Math.floor(c.blizzardEveryDays));
    climate.blizzardTotalDays = climate.blizzardDaysLeft;

    pushLog(
      state,
      `寒潮来袭！预计持续 ${climate.blizzardDaysLeft} 天，烈度 ${climate.blizzardSeverity.toFixed(2)}`,
      "bad",
    );
    return state;
  } catch (err) {
    safeWarn("startBlizzard", err);
    return state;
  }
}

/** 结束当前寒潮。 */
export function endBlizzard(state, cfg) {
  const c = climateConfig(cfg);
  const climate = (state.climate = obj(state.climate));
  climate.blizzardDaysLeft = 0;
  climate.nextBlizzardIn = Math.max(1, Math.floor(c.blizzardEveryDays));
  pushLog(state, "寒潮退去，天光重现", "good");
  return state;
}

/** 跨天结算：递减寒潮/倒计时。 */
function advanceDay(state, c) {
  const climate = state.climate;
  if (climate.blizzardDaysLeft > 0) {
    climate.blizzardDaysLeft = Math.max(0, climate.blizzardDaysLeft - 1);
    if (climate.blizzardDaysLeft === 0) endBlizzard(state, c);
    return;
  }
  climate.nextBlizzardIn = Math.max(0, Math.floor(num(climate.nextBlizzardIn, c.blizzardEveryDays)) - 1);
  if (climate.nextBlizzardIn <= 0) {
    startBlizzard(state, c);
  } else if (climate.nextBlizzardIn === 1) {
    pushLog(state, "斥候来报：北风转急，明日恐有寒潮", "warn");
  }
}

/* ------------------------------------------------------------------ *
 * tick
 * ------------------------------------------------------------------ */

/**
 * 气候 tick：燃料 → 跨天寒潮结算 → 温度趋近。
 * 幂等安全，不抛异常，可在无 DOM 的 Node 中调用。
 */
export function tickClimate(state, cfg) {
  try {
    if (!state || typeof state !== "object") return state;
    const c = climateConfig(cfg);
    ensureState(state);
    const climate = state.climate;

    burnFuel(state, c);

    // 天数：兼容「引擎推进 meta.day」与「只推进 tick」两种情况（与 state.dayOfTick 同为 1 基）
    const day = Math.max(Math.floor(num(state.meta.day, 1)), dayOfTick(state.meta.tick));
    state.meta.day = day;

    if (!Number.isFinite(climate._dayMark)) climate._dayMark = day;
    let guard = 0;
    while (climate._dayMark < day && guard++ < 400) {
      climate._dayMark += 1;
      advanceDay(state, c);
    }
    climate._dayMark = day;

    const target = cityTemperature(state, c);
    const prev = num(climate.temp, target);
    const next = prev + (target - prev) * TEMP_INERTIA;
    climate.temp = Math.abs(target - next) < 0.05 ? target : round2(next);
    climate.targetTemp = target;
    climate.outputFactor = round3(climateOutputFactor(state, c));
    climate.label = climateLabel(state, c);
    climate.severity = blizzardSeverity(state, c);
    state.city.warmthBuildings = countWarmthBuildings(state);

    return state;
  } catch (err) {
    safeWarn("tickClimate", err);
    return state;
  }
}

/* ------------------------------------------------------------------ */

function round2(n) {
  return Math.round(n * 100) / 100;
}
function round3(n) {
  return Math.round(n * 1000) / 1000;
}
function safeWarn(where, err) {
  if (typeof console !== "undefined" && console.warn) {
    console.warn(`[climate] ${where} 异常：`, err?.message || err);
  }
}
