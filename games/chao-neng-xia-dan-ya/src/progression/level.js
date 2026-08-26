/** 金币升级与校验（Opus-3 所有权）。 */
import {
  MAX_LEVEL,
  MIN_LEVEL,
  clampInt,
  cumulativeGoldCost,
  levelCapForStar,
  levelGoldCost,
} from "./constants.js";
import { isKnownHero } from "./catalog.js";
import { ensureProgression, heroLevelOf, heroStarOf } from "./save.js";

export const LEVEL_ERRORS = {
  UNKNOWN_HERO: "UNKNOWN_HERO",
  BAD_AMOUNT: "BAD_AMOUNT",
  MAX_LEVEL: "MAX_LEVEL",
  LEVEL_CAP: "LEVEL_CAP",
  NOT_ENOUGH_GOLD: "NOT_ENOUGH_GOLD",
};

const REASONS = {
  UNKNOWN_HERO: "英雄不存在",
  BAD_AMOUNT: "升级级数必须为正整数",
  MAX_LEVEL: "已达最高等级 40",
  LEVEL_CAP: "已达当前星级的等级上限，请先升星",
  NOT_ENOUGH_GOLD: "金币不足",
};

function fail(code, extra = {}) {
  return { ok: false, code, reason: REASONS[code] ?? code, ...extra };
}

/**
 * 升级校验，不改存档。
 * @returns {{ok: boolean, code?: string, reason?: string, from: number, to: number, cost: number, cap: number}}
 */
export function canLevelUp(save, heroId, amount = 1) {
  const target = ensureProgression(save);
  const from = heroLevelOf(target, heroId);
  const star = heroStarOf(target, heroId);
  const cap = levelCapForStar(star);
  const base = { from, to: from, cost: 0, cap, star, gold: target.gold };

  if (!isKnownHero(heroId)) return fail(LEVEL_ERRORS.UNKNOWN_HERO, base);

  const steps = Math.floor(Number(amount));
  if (!Number.isFinite(steps) || steps <= 0) return fail(LEVEL_ERRORS.BAD_AMOUNT, base);

  if (from >= MAX_LEVEL) return fail(LEVEL_ERRORS.MAX_LEVEL, base);
  if (from >= cap) return fail(LEVEL_ERRORS.LEVEL_CAP, base);

  const to = Math.min(from + steps, cap, MAX_LEVEL);
  const cost = cumulativeGoldCost(from, to);
  if (to === from) return fail(LEVEL_ERRORS.LEVEL_CAP, base);
  if (target.gold < cost) {
    return fail(LEVEL_ERRORS.NOT_ENOUGH_GOLD, { ...base, to, cost, missing: cost - target.gold });
  }

  return { ok: true, from, to, cost, cap, star, gold: target.gold };
}

/** 通过校验则扣金币并写入等级；失败时存档保持不变。 */
export function levelUpHero(save, heroId, amount = 1) {
  const target = ensureProgression(save);
  const check = canLevelUp(target, heroId, amount);
  if (!check.ok) return { ...check, applied: 0 };

  target.gold -= check.cost;
  target.heroLevels[heroId] = check.to;
  return { ...check, applied: check.to - check.from, level: check.to };
}

/** 当前金币最多能升多少级（用于「一键升级」按钮）。 */
export function maxAffordableLevelUps(save, heroId) {
  const target = ensureProgression(save);
  if (!isKnownHero(heroId)) return 0;
  const from = heroLevelOf(target, heroId);
  const cap = Math.min(levelCapForStar(heroStarOf(target, heroId)), MAX_LEVEL);
  let gold = target.gold;
  let steps = 0;
  for (let l = from; l < cap; l += 1) {
    const cost = levelGoldCost(l);
    if (cost > gold) break;
    gold -= cost;
    steps += 1;
  }
  return steps;
}

export function levelProgress(save, heroId) {
  const target = ensureProgression(save);
  const level = heroLevelOf(target, heroId);
  const star = heroStarOf(target, heroId);
  const cap = levelCapForStar(star);
  return {
    level,
    star,
    cap,
    atCap: level >= cap,
    atMax: level >= MAX_LEVEL,
    nextCost: level >= cap ? Infinity : levelGoldCost(level),
    costToCap: cumulativeGoldCost(level, cap),
  };
}

export function normalizeLevel(level, star) {
  return clampInt(level, MIN_LEVEL, Math.min(levelCapForStar(star), MAX_LEVEL));
}
