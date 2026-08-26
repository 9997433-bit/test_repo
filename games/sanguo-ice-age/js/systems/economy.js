/**
 * 经济系统 — 资源产出、维护消耗、仓储上限。
 *
 * 单座建筑每 tick 的产出：
 *   产出 = 等级 × amountPerTick × 驻守系数 × 气候系数 × 民心系数 × 工人系数
 *     驻守系数 = 1 + Σ(intel/200 + 建筑 garrisonBonus × 武将品质系数)
 *     气候系数 = climateOutputFactor(state)      // 0.20 ~ 1.05
 *     民心系数 = clamp(0.4 + morale/100, 0.4, 1.35)
 *     工人系数 = 无工位则 1；否则 0.4 + 0.6 × (在岗 / 工位)
 *
 * 结算后资源被夹在 [0, warehouseCap] 区间内。
 */
import * as CONFIG from "../config.js";
import {
  DEFAULT_BUILDINGS,
  RESOURCES,
  TICKS_PER_DAY,
  buildingCost,
  canAfford,
  catalogOf,
  clamp,
  defOf,
  ensureState,
  num,
  obj,
  pay,
  productionOf,
  pushLog,
  refund,
  upkeepOf,
  warehouseCap,
  workerSlots,
} from "./city.js";
import { climateOutputFactor } from "./climate.js";

// 契约要求 economy 暴露这些名字；实现放在 city.js 以保持依赖无环。
export {
  DEFAULT_BUILDINGS,
  buildingCost,
  canAfford,
  pay,
  refund,
  warehouseCap,
  productionOf,
  upkeepOf,
};

/** 建筑目录别名，便于 `import { BUILDINGS } from './economy.js'`。 */
export const BUILDINGS = DEFAULT_BUILDINGS;

/** 无工人在岗时仍保留的产出比例。 */
export const IDLE_OUTPUT_FLOOR = 0.4;

/** 民心系数区间。 */
export const MORALE_FACTOR_MIN = 0.4;
export const MORALE_FACTOR_MAX = 1.35;

/* ------------------------------------------------------------------ *
 * 系数
 * ------------------------------------------------------------------ */

/** 民心对产出的系数。 */
export function moraleFactor(state) {
  const morale = clamp(num(state?.people?.morale, num(CONFIG.MORALE?.base, 70)), 0, 100);
  return clamp(MORALE_FACTOR_MIN + morale / 100, MORALE_FACTOR_MIN, MORALE_FACTOR_MAX);
}

/** 工人在岗率对产出的系数。 */
export function workerFactor(def, entry) {
  const level = Math.max(0, Math.floor(num(entry?.level, 0)));
  const slots = workerSlots(def, level);
  if (slots <= 0) return 1;
  const fill = clamp(Math.max(0, Math.floor(num(entry?.workers, 0))) / slots, 0, 1);
  return IDLE_OUTPUT_FLOOR + (1 - IDLE_OUTPUT_FLOOR) * fill;
}

/** 品质系数（与 data/heroes.js 的品质基准倍率一致）。 */
export const QUALITY_COEF = { blue: 1, purple: 1.12, orange: 1.28, red: 1.45 };

/** 武将品质系数，未知品质按蓝将 1.0。 */
export function heroQualityCoef(hero) {
  const q = typeof hero?.quality === "string" ? hero.quality : null;
  return num(QUALITY_COEF[q], 1);
}

/**
 * 读取武将智力。
 * hero.intel 视为「当前有效智力」直接采用；
 * 只有从白板表（hero.base.intel / state.heroes.byId[id].base.intel）取值时才按等级星级成长；
 * 都拿不到时按等级星级粗估，保证不因数据缺失而崩。
 */
export function heroIntel(hero, state) {
  if (!hero || typeof hero !== "object") return 0;
  const level = Math.max(1, Math.floor(num(hero.level, 1)));
  // state.js 用 star（单数），本项目其他处写 stars，两种都认
  const stars = Math.max(0, Math.floor(num(hero.stars ?? hero.star, 0)));

  const effective = num(hero.intel ?? hero.stats?.intel ?? hero.attrs?.intel, NaN);
  if (Number.isFinite(effective)) return Math.max(0, effective);

  const entry = obj(state?.heroes?.byId)[hero.id];
  const base = num(hero.base?.intel ?? entry?.base?.intel ?? entry?.intel, NaN);
  const raw = Number.isFinite(base) ? base : 20 + level * 2 + stars * 5;
  return Math.max(0, raw * (1 + 0.06 * (level - 1)) * (1 + 0.04 * stars));
}

/**
 * 驻守武将带来的产出系数：
 *   1 + Σ( intel / 200 + 建筑 garrisonBonus × 武将品质系数 )
 * 数据表未给 garrisonBonus 时退化为纯 intel/200。
 */
export function garrisonFactor(state, buildingId, def) {
  const roster = state?.heroes?.roster;
  if (!Array.isArray(roster) || !roster.length) return 1;
  const bonus = num(def?.garrisonBonus, 0);
  let sum = 0;
  for (const hero of roster) {
    if (!hero || hero.garrisonBuildingId !== buildingId) continue;
    sum += heroIntel(hero, state) / 200 + bonus * heroQualityCoef(hero);
  }
  return 1 + sum;
}

/* ------------------------------------------------------------------ *
 * 产出预览
 * ------------------------------------------------------------------ */

/** 某建筑本 tick 的产出（不改 state），返回 { resource: amount }。 */
export function buildingOutput(state, buildingId, buildingsCatalog, factors) {
  const cat = catalogOf(buildingsCatalog ?? state?.city?.catalog);
  const def = defOf(cat, buildingId);
  const entry = obj(state?.city?.buildings)[buildingId];
  const level = Math.max(0, Math.floor(num(entry?.level, 0)));
  if (!def || level <= 0) return {};

  const prod = productionOf(def);
  if (!Object.keys(prod).length) return {};

  const climateF = num(factors?.climate, NaN);
  const moraleF = num(factors?.morale, NaN);
  const climate = Number.isFinite(climateF) ? climateF : climateOutputFactor(state);
  const morale = Number.isFinite(moraleF) ? moraleF : moraleFactor(state);
  const hero = garrisonFactor(state, buildingId, def);
  const worker = workerFactor(def, entry);

  const out = {};
  for (const [res, perLevel] of Object.entries(prod)) {
    out[res] = level * num(perLevel, 0) * hero * climate * morale * worker;
  }
  return out;
}

/** 某建筑本 tick 的维护消耗，返回 { resource: amount }。 */
export function buildingUpkeep(state, buildingId, buildingsCatalog) {
  const cat = catalogOf(buildingsCatalog ?? state?.city?.catalog);
  const def = defOf(cat, buildingId);
  const entry = obj(state?.city?.buildings)[buildingId];
  const level = Math.max(0, Math.floor(num(entry?.level, 0)));
  if (!def || level <= 0) return {};
  const out = {};
  for (const [res, perLevel] of Object.entries(upkeepOf(def))) {
    out[res] = level * num(perLevel, 0);
  }
  return out;
}

/** 全城每 tick 净收支预览（含建筑维护，不含人口口粮）。 */
export function economyRates(state, buildingsCatalog) {
  const cat = catalogOf(buildingsCatalog ?? state?.city?.catalog);
  const climate = climateOutputFactor(state);
  const morale = moraleFactor(state);
  const production = zeroRates();
  const upkeep = zeroRates();

  for (const id of Object.keys(obj(state?.city?.buildings))) {
    const out = buildingOutput(state, id, cat, { climate, morale });
    for (const [res, v] of Object.entries(out)) production[res] = num(production[res], 0) + v;
    const cost = buildingUpkeep(state, id, cat);
    for (const [res, v] of Object.entries(cost)) upkeep[res] = num(upkeep[res], 0) + v;
  }

  const net = {};
  for (const res of Object.keys({ ...production, ...upkeep })) {
    net[res] = num(production[res], 0) - num(upkeep[res], 0);
  }
  return { production, upkeep, net, climateFactor: climate, moraleFactor: morale };
}

/* ------------------------------------------------------------------ *
 * tick
 * ------------------------------------------------------------------ */

/**
 * 经济 tick：按建筑结算产出与维护，写回资源并夹在仓储上限内。
 * 幂等安全，不抛异常，可在无 DOM 的 Node 中调用。
 */
export function tickEconomy(state, buildingsCatalog) {
  try {
    if (!state || typeof state !== "object") return state;
    const cat = catalogOf(buildingsCatalog ?? state?.city?.catalog);
    ensureState(state, cat);

    const rates = economyRates(state, cat);
    const cap = warehouseCap(state, cat);
    const res = state.resources;
    const gained = zeroRates();
    const cappedAt = [];

    const keys = new Set([...RESOURCES, ...Object.keys(rates.net)]);
    for (const key of keys) {
      const before = Math.max(0, num(res[key], 0));
      const delta = num(rates.net[key], 0);
      const limit = num(cap[key], Infinity);
      const after = clamp(before + delta, 0, limit);
      res[key] = round2(after);
      gained[key] = round3(after - before);
      if (delta > 0 && after >= limit - 1e-9) cappedAt.push(key);
    }

    const lastOverflowDay = num(state.economy?._overflowLogDay, -1);
    state.economy = {
      _overflowLogDay: lastOverflowDay,
      production: roundMap(rates.production),
      upkeep: roundMap(rates.upkeep),
      net: roundMap(rates.net),
      perDay: roundMap(scaleMap(rates.net, TICKS_PER_DAY)),
      gained,
      cap,
      cappedAt,
      climateFactor: round3(rates.climateFactor),
      moraleFactor: round3(rates.moraleFactor),
    };

    logOverflow(state, cappedAt);
    return state;
  } catch (err) {
    safeWarn("tickEconomy", err);
    return state;
  }
}

/** 仓满提示每天最多播报一次，避免刷屏。 */
function logOverflow(state, cappedAt) {
  if (!cappedAt.length) return;
  const day = Math.max(1, Math.floor(num(state?.meta?.day, 1)));
  if (num(state.economy?._overflowLogDay, -1) === day) return;
  state.economy._overflowLogDay = day;
  const names = cappedAt.map((r) => RESOURCE_NAMES[r] || r).join("、");
  pushLog(state, `仓库已满：${names}溢出，考虑扩建仓库`, "warn");
}

/** 资源中文名。 */
export const RESOURCE_NAMES = {
  food: "肉食",
  wood: "木材",
  coal: "煤炭",
  iron: "精铁",
};

/* ------------------------------------------------------------------ */

function zeroRates() {
  const o = {};
  for (const r of RESOURCES) o[r] = 0;
  return o;
}
function scaleMap(map, k) {
  const o = {};
  for (const [key, v] of Object.entries(map || {})) o[key] = num(v, 0) * k;
  return o;
}
function roundMap(map) {
  const o = {};
  for (const [key, v] of Object.entries(map || {})) o[key] = round3(num(v, 0));
  return o;
}
function round2(n) {
  return Math.round(n * 100) / 100;
}
function round3(n) {
  return Math.round(n * 1000) / 1000;
}
function safeWarn(where, err) {
  if (typeof console !== "undefined" && console.warn) {
    console.warn(`[economy] ${where} 异常：`, err?.message || err);
  }
}
