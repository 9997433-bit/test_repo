/**
 * 人口系统 — 口粮、饥荒、冻伤、民心与人口增减。
 *
 * 所有速率以「每天」为单位书写，结算时除以 TICKS_PER_DAY，
 * 因此调整 config.js 里的 TICKS_PER_DAY 不会改变游戏平衡。
 *
 * 关键链路：
 *   口粮缺口 → hungry↑、morale↓
 *   低温     → sick↑、morale↓、冻死人口
 *   厨房     → 降低人均口粮、削弱饥荒掉士气
 *   诊所     → 降低染病率与死亡率、加速康复（数据表无 clinic 时回落到 hospital）
 *   morale <= collapseAt → state.flags.gameOver = "morale"
 */
import * as CONFIG from "../config.js";
import {
  TICKS_PER_DAY,
  assignedWorkers,
  catalogOf,
  clamp,
  defOf,
  ensureState,
  housingCapacity,
  num,
  obj,
  pushLog,
  trimWorkforce,
} from "./city.js";
import { blizzardSeverity, climateConfig } from "./climate.js";

/** 人口默认参数（config.js 的 MORALE / POPULATION 会覆盖同名字段）。 */
export const POPULATION_DEFAULTS = {
  // 民心（每天）
  base: 70,
  freezeDrain: 2.4,
  coldDrain: 0.8,
  comfortGain: 0.35,
  kitchenBonus: 0.25,
  clinicBonus: 0.15,
  starveDrain: 3.5,
  collapseAt: 15,
  // 温饱状态下民心向 base 回升，否则任何一次寒潮都会不可逆地压垮城池
  recoverPerDay: 2.5,
  recoverComfortMult: 1.6,
  amenityMoraleTarget: 4,
  sickMoraleDrain: 1.2,

  // 口粮
  foodPerPersonPerTick: 0.018,
  kitchenFoodSaveCap: 0.4,

  // 健康（每天）
  sickPerColdDegree: 0.006,
  sickMitigationCap: 0.75,
  recoverWarmPerDay: 0.25,
  recoverPerClinicLevel: 0.15,
  deathPerSickPerDay: 0.08,
  deathWarmScale: 0.4,
  starveDeathPerDay: 0.04,

  // 增长（每天）
  growthMoraleGate: 55,
  growthBase: 0.35,
  growthPerPop: 0.02,
};

/** 合并配置：默认值 < config.MORALE < config.POPULATION < 调用方 cfg。 */
export function populationConfig(cfg) {
  return {
    ...POPULATION_DEFAULTS,
    ...obj(CONFIG.MORALE),
    ...obj(CONFIG.POPULATION),
    ...obj(cfg),
  };
}

/* ------------------------------------------------------------------ *
 * 查询
 * ------------------------------------------------------------------ */

/** 闲置且健康的人口数（可派驻的工人）。 */
export function availableWorkers(state) {
  const people = obj(state?.people);
  const healthy = Math.max(0, Math.floor(num(people.pop, 0)) - Math.floor(num(people.sick, 0)));
  return Math.max(0, healthy - assignedWorkers(state));
}

/** 某建筑当前等级（供厨房/医馆减伤计算）。 */
function levelOf(state, id) {
  return Math.max(0, Math.floor(num(obj(state?.city?.buildings)[id]?.level, 0)));
}

/** 厨房带来的人均口粮节省比例（0~kitchenFoodSaveCap）。 */
export function kitchenFoodSave(state, cfg, catalog) {
  const c = populationConfig(cfg);
  const cat = catalogOf(catalog ?? state?.city?.catalog);
  const level = levelOf(state, "kitchen");
  if (level <= 0) return 0;
  const per = num(defOf(cat, "kitchen")?.foodSavePerLevel, 0.05);
  return clamp(per * level, 0, c.kitchenFoodSaveCap);
}

/**
 * 医疗建筑等级。数据表把 hospital 定义为「伤兵营」（军事），
 * 治病的是 clinic「诊所」；只有目录里没有 clinic 时才回落到 hospital。
 */
export function medicalLevel(state, catalog) {
  const cat = catalogOf(catalog ?? state?.city?.catalog);
  if (defOf(cat, "clinic")) return levelOf(state, "clinic");
  return levelOf(state, "hospital");
}

/** 诊所带来的染病/死亡减免比例（0~sickMitigationCap）。 */
export function clinicMitigation(state, cfg, catalog) {
  const c = populationConfig(cfg);
  const level = medicalLevel(state, catalog);
  if (level <= 0) return 0;
  return clamp(level * c.clinicBonus, 0, c.sickMitigationCap);
}

/** 全城每 tick 口粮需求。 */
export function foodDemand(state, cfg, catalog) {
  const c = populationConfig(cfg);
  const pop = Math.max(0, Math.floor(num(state?.people?.pop, 0)));
  const perPerson = Math.max(0, c.foodPerPersonPerTick) * (1 - kitchenFoodSave(state, c, catalog));
  return pop * perPerson;
}

/* ------------------------------------------------------------------ *
 * tick
 * ------------------------------------------------------------------ */

/**
 * 人口 tick：吃饭 → 民心 → 疾病 → 生死 → 结算上限与失败判定。
 * 幂等安全，不抛异常，可在无 DOM 的 Node 中调用。
 */
export function tickPopulation(state, cfg) {
  try {
    if (!state || typeof state !== "object") return state;
    const c = populationConfig(cfg);
    const cc = climateConfig();
    const cat = catalogOf(state?.city?.catalog);
    ensureState(state, cat);

    const people = state.people;
    const acc = ensureAccumulators(people);
    const pop = Math.max(0, Math.floor(num(people.pop, 0)));
    const temp = num(state.climate.temp, cc.baseTemp);
    const severity = blizzardSeverity(state, cc);
    const perTick = 1 / Math.max(1, TICKS_PER_DAY);

    /* --- 1. 吃饭 --- */
    const demand = foodDemand(state, c, cat);
    const stock = Math.max(0, num(state.resources.food, 0));
    const eaten = Math.min(stock, demand);
    state.resources.food = round2(Math.max(0, stock - eaten));
    const deficit = demand > 1e-9 ? clamp(1 - eaten / demand, 0, 1) : 0;
    people.hungry = Math.min(pop, Math.round(pop * deficit));

    /* --- 2. 民心 --- */
    let morale = clamp(num(people.morale, c.base), 0, 100);
    let delta = 0;

    if (deficit > 0) {
      const relief = 1 - kitchenFoodSave(state, c, cat) * 0.5;
      delta -= c.starveDrain * deficit * relief * perTick;
    }

    if (temp < cc.freezeThreshold) {
      delta -= c.freezeDrain * severity * perTick;
    } else if (temp < cc.coldThreshold) {
      delta -= c.coldDrain * perTick;
    } else if (temp >= cc.comfortThreshold) {
      delta += c.comfortGain * perTick;
    }

    if (pop > 0) {
      delta -= (Math.min(pop, num(people.sick, 0)) / pop) * c.sickMoraleDrain * perTick;
    }

    // 温饱且不至冻僵时，民心向「基准 + 民生建筑加成」回升
    const medical = medicalLevel(state, cat);
    const target = clamp(
      c.base +
        (c.kitchenBonus * levelOf(state, "kitchen") + c.clinicBonus * medical) *
          c.amenityMoraleTarget,
      0,
      100,
    );
    people.moraleTarget = round2(target);
    if (deficit <= 0 && temp >= cc.coldThreshold && morale < target) {
      const speed = temp >= cc.comfortThreshold ? c.recoverComfortMult : 1;
      delta += Math.min(c.recoverPerDay * speed * perTick, target - morale);
    }

    morale = clamp(morale + delta, 0, 100);
    people.morale = round2(morale);

    /* --- 3. 疾病 --- */
    const mitigation = clinicMitigation(state, c, cat);
    let sick = clamp(Math.floor(num(people.sick, 0)), 0, pop);

    if (temp < cc.coldThreshold && pop > 0) {
      const degrees = cc.coldThreshold - temp;
      const rate = degrees * c.sickPerColdDegree * pop * (1 - mitigation) * severity;
      acc.sick += rate * perTick;
    }

    const recoverRate =
      temp >= cc.coldThreshold
        ? c.recoverWarmPerDay + c.recoverPerClinicLevel * medical
        : c.recoverPerClinicLevel * medical;
    if (sick > 0 && recoverRate > 0) acc.heal += sick * recoverRate * perTick;

    const newlySick = Math.min(Math.floor(acc.sick), Math.max(0, pop - sick));
    if (newlySick > 0) {
      acc.sick -= newlySick;
      sick += newlySick;
      pushLog(state, `寒气侵体，新增 ${newlySick} 名病患`, "warn");
    }
    acc.sick = Math.max(0, Math.min(acc.sick, 50));

    const healed = Math.min(Math.floor(acc.heal), sick);
    if (healed > 0) {
      acc.heal -= healed;
      sick -= healed;
      pushLog(state, `诊所救治，${healed} 人痊愈`, "good");
    }
    acc.heal = Math.max(0, Math.min(acc.heal, 50));

    /* --- 4. 生死 --- */
    if (sick > 0) {
      const scale = temp < cc.freezeThreshold ? severity : c.deathWarmScale;
      acc.death += sick * c.deathPerSickPerDay * (1 - mitigation) * scale * perTick;
    }
    if (deficit > 0.5 && pop > 0) {
      acc.death += pop * c.starveDeathPerDay * deficit * perTick;
    }

    let nextPop = pop;
    const deaths = Math.min(Math.floor(acc.death), nextPop);
    if (deaths > 0) {
      acc.death -= deaths;
      nextPop -= deaths;
      sick = Math.max(0, sick - deaths);
      pushLog(state, deficit > 0.5 ? `饥寒交迫，${deaths} 人殒命` : `${deaths} 人冻毙于风雪`, "bad");
    }
    acc.death = Math.max(0, Math.min(acc.death, 50));

    const popCap = housingCapacity(state, cat);
    people.popCap = popCap;

    const canGrow =
      morale >= c.growthMoraleGate &&
      deficit <= 0 &&
      temp >= cc.coldThreshold &&
      nextPop < popCap &&
      !state.flags?.gameOver;
    if (canGrow) {
      const drive = clamp((morale - c.growthMoraleGate) / Math.max(1, 100 - c.growthMoraleGate), 0, 1);
      acc.growth += (c.growthBase + nextPop * c.growthPerPop) * drive * perTick;
    } else {
      acc.growth = Math.max(0, acc.growth - perTick * 0.1);
    }
    const born = Math.min(Math.floor(acc.growth), Math.max(0, popCap - nextPop));
    if (born > 0) {
      acc.growth -= born;
      nextPop += born;
      pushLog(state, `${born} 名流民闻讯来投`, "good");
    }
    acc.growth = Math.max(0, Math.min(acc.growth, 20));

    /* --- 5. 收尾 --- */
    people.pop = clamp(Math.floor(nextPop), 0, popCap);
    people.sick = clamp(Math.floor(sick), 0, people.pop);
    people.hungry = clamp(Math.floor(people.hungry), 0, people.pop);
    trimWorkforce(state);
    people.available = availableWorkers(state);

    // state.js 把 flags.gameOver 初始化为 false，故用真值判断而非 == null。
    // gameOver 存失败原因字符串（真值），同时写一份 gameOverReason 供只认布尔的消费方。
    state.flags = obj(state.flags);
    if (!state.flags.gameOver) {
      if (people.morale <= c.collapseAt) {
        state.flags.gameOver = "morale";
        state.flags.gameOverReason = "morale";
        pushLog(state, "民心尽失，流民四散——城池陷落。", "bad");
      } else if (people.pop <= 0) {
        state.flags.gameOver = "extinct";
        state.flags.gameOverReason = "extinct";
        pushLog(state, "最后一名子民倒在雪中，城池就此湮没。", "bad");
      }
    }

    return state;
  } catch (err) {
    safeWarn("tickPopulation", err);
    return state;
  }
}

/* ------------------------------------------------------------------ */

/** 小数累加器，避免使用随机数，保证模拟可复现。 */
function ensureAccumulators(people) {
  if (!people._acc || typeof people._acc !== "object") people._acc = {};
  const acc = people._acc;
  acc.sick = num(acc.sick, 0);
  acc.heal = num(acc.heal, 0);
  acc.death = num(acc.death, 0);
  acc.growth = num(acc.growth, 0);
  return acc;
}

function round2(n) {
  return Math.round(n * 100) / 100;
}
function safeWarn(where, err) {
  if (typeof console !== "undefined" && console.warn) {
    console.warn(`[population] ${where} 异常：`, err?.message || err);
  }
}
