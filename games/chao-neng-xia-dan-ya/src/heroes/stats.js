/**
 * 英雄属性成长（Opus-3 所有权）。
 *
 * 攻击链路（顺序固定，便于 UI 逐项展示与数值对拍）：
 *   基础攻 × 等级乘区 × 星级乘区 × 全局乘区(图鉴 × 钓鱼 / 神器) × 种族科技 × 光环乘区
 */
import {
  EGG_RADIUS_MAX,
  EGG_RADIUS_MIN,
  LEVELS_PER_RADIUS_STEP,
  STARS_PER_RADIUS_STEP,
  clamp,
} from "../progression/constants.js";
import { neutralContext } from "../progression/context.js";
import { DEFAULT_BASE_STATS } from "./constants.js";

/** 从数据表条目读基础属性，缺项走兜底。 */
export function baseStatsOf(def) {
  const base = { ...DEFAULT_BASE_STATS };
  if (!def) return base;
  for (const key of Object.keys(base)) {
    const value = Number(def[key]);
    if (Number.isFinite(value)) base[key] = value;
  }
  return base;
}

export function levelAtkMul(level, growth) {
  return 1 + Math.max(0, level - 1) * (growth?.atkPerLevel ?? 0);
}

export function starAtkMul(star, growth) {
  return 1 + Math.max(0, star - 1) * (growth?.atkPerStar ?? 0);
}

export function eggRadiusFor(baseRadius, level, star) {
  const levelSteps = Math.floor(Math.max(0, level - 1) / LEVELS_PER_RADIUS_STEP);
  const starSteps = Math.floor(Math.max(0, star - 1) / STARS_PER_RADIUS_STEP);
  return clamp(baseRadius + levelSteps + starSteps, EGG_RADIUS_MIN, EGG_RADIUS_MAX);
}

/**
 * 计算一名英雄在给定上下文下的最终属性。
 * @param {object} def 数据表英雄条目
 * @param {object} ctx 养成上下文（见 progression/context.js）
 * @param {{auraAtkMul?: number, auraEnergyMul?: number, auraCritBonus?: number, extraEggs?: number}} auras
 */
export function computeHeroStats(def, ctx = neutralContext(), auras = {}) {
  const base = baseStatsOf(def);
  const growth = ctx.growth ?? {};
  const level = Math.max(1, Math.floor(ctx.levelOf?.(def?.id) ?? 1));
  const star = Math.max(1, Math.floor(ctx.starOf?.(def?.id) ?? 1));

  const lvlMul = levelAtkMul(level, growth);
  const strMul = starAtkMul(star, growth);
  const globalMul = Number(ctx.globalAtkMul) || 1;
  const raceMul = Number(ctx.heroAtkMul?.(def?.id)) || 1;
  const auraMul = Number(auras.auraAtkMul) || 1;

  const atk = base.atk * lvlMul * strMul * globalMul * raceMul * auraMul;
  const hp =
    base.hp *
    (1 + Math.max(0, level - 1) * (growth.hpPerLevel ?? 0)) *
    (1 + Math.max(0, star - 1) * (growth.hpPerStar ?? 0));
  const energyGain =
    base.energyGain *
    (1 + Math.max(0, level - 1) * (growth.energyPerLevel ?? 0)) *
    (1 + Math.max(0, star - 1) * (growth.energyPerStar ?? 0)) *
    (Number(ctx.energyMul) || 1) *
    (Number(auras.auraEnergyMul) || 1);

  const critRate = clamp(
    base.critRate +
      Math.max(0, star - 1) * (growth.critPerStar ?? 0) +
      (Number(ctx.critBonus) || 0) +
      (Number(auras.auraCritBonus) || 0),
    0,
    0.95,
  );

  return {
    level,
    star,
    atk: round2(atk),
    hp: Math.round(hp),
    energyMax: base.energyMax,
    energyGain: round2(energyGain),
    critRate: round4(critRate),
    critMul: base.critMul,
    eggRadius: eggRadiusFor(base.eggRadius, level, star),
    eggPower: round4(base.eggPower * (Number(ctx.eggPowerMul) || 1)),
    eggs: base.eggs + (Math.floor(ctx.extraEggs) || 0) + (Math.floor(auras.extraEggs) || 0),
    atkBreakdown: {
      base: base.atk,
      level: round4(lvlMul),
      star: round4(strMul),
      global: round4(globalMul),
      raceTech: round4(raceMul),
      aura: round4(auraMul),
      dex: round4(ctx.breakdown?.dex ?? 0),
      fishing: round4(ctx.breakdown?.fishing ?? 0),
      artifacts: round4(ctx.breakdown?.artifacts ?? 0),
    },
  };
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

function round4(n) {
  return Math.round(n * 1e4) / 1e4;
}
