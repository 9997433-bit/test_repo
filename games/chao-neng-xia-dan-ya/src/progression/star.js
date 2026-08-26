/** 碎片升星与校验（Opus-3 所有权）。升星解锁技能词条并抬高等级上限。 */
import {
  MAX_STAR,
  STAR_GOLD_COST,
  STAR_LEVEL_REQUIREMENT,
  STAR_SHARD_COST,
  levelCapForStar,
} from "./constants.js";
import { isKnownHero } from "./catalog.js";
import { ensureProgression, heroLevelOf, heroStarOf, shardsOf } from "./save.js";

export const STAR_ERRORS = {
  UNKNOWN_HERO: "UNKNOWN_HERO",
  MAX_STAR: "MAX_STAR",
  LEVEL_TOO_LOW: "LEVEL_TOO_LOW",
  NOT_ENOUGH_SHARDS: "NOT_ENOUGH_SHARDS",
  NOT_ENOUGH_GOLD: "NOT_ENOUGH_GOLD",
};

const REASONS = {
  UNKNOWN_HERO: "英雄不存在",
  MAX_STAR: "已达最高星级 5",
  LEVEL_TOO_LOW: "等级不足，无法升星",
  NOT_ENOUGH_SHARDS: "碎片不足",
  NOT_ENOUGH_GOLD: "金币不足",
};

function fail(code, extra = {}) {
  return { ok: false, code, reason: REASONS[code] ?? code, ...extra };
}

export function starShardCost(star) {
  return STAR_SHARD_COST[star] ?? Infinity;
}

export function starGoldCost(star) {
  return STAR_GOLD_COST[star] ?? Infinity;
}

export function starLevelRequirement(nextStar) {
  return STAR_LEVEL_REQUIREMENT[nextStar] ?? 0;
}

/**
 * 升星校验，不改存档。
 * 依次检查：英雄存在 → 未满星 → 等级门槛 → 碎片 → 金币。
 */
export function canStarUp(save, heroId) {
  const target = ensureProgression(save);
  const star = heroStarOf(target, heroId);
  const level = heroLevelOf(target, heroId);
  const nextStar = star + 1;
  const base = {
    from: star,
    to: star,
    level,
    shardCost: starShardCost(star),
    goldCost: starGoldCost(star),
    shards: shardsOf(target, heroId),
    requiredLevel: starLevelRequirement(nextStar),
  };

  if (!isKnownHero(heroId)) return fail(STAR_ERRORS.UNKNOWN_HERO, base);
  if (star >= MAX_STAR) return fail(STAR_ERRORS.MAX_STAR, base);
  if (level < base.requiredLevel) {
    return fail(STAR_ERRORS.LEVEL_TOO_LOW, { ...base, missingLevels: base.requiredLevel - level });
  }
  if (base.shards < base.shardCost) {
    return fail(STAR_ERRORS.NOT_ENOUGH_SHARDS, {
      ...base,
      missingShards: base.shardCost - base.shards,
    });
  }
  if (target.gold < base.goldCost) {
    return fail(STAR_ERRORS.NOT_ENOUGH_GOLD, {
      ...base,
      missingGold: base.goldCost - target.gold,
    });
  }

  return {
    ok: true,
    ...base,
    to: nextStar,
    nextLevelCap: levelCapForStar(nextStar),
  };
}

/** 通过校验则扣碎片与金币并写入星级；失败时存档保持不变。 */
export function starUpHero(save, heroId) {
  const target = ensureProgression(save);
  const check = canStarUp(target, heroId);
  if (!check.ok) return { ...check, applied: false };

  target.shards[heroId] = check.shards - check.shardCost;
  target.gold -= check.goldCost;
  target.heroStars[heroId] = check.to;
  return { ...check, applied: true, star: check.to };
}

export function starProgress(save, heroId) {
  const target = ensureProgression(save);
  const star = heroStarOf(target, heroId);
  const level = heroLevelOf(target, heroId);
  const nextStar = Math.min(star + 1, MAX_STAR);
  const shards = shardsOf(target, heroId);
  const shardCost = star >= MAX_STAR ? 0 : starShardCost(star);
  return {
    star,
    maxed: star >= MAX_STAR,
    levelCap: levelCapForStar(star),
    nextStar,
    nextLevelCap: levelCapForStar(nextStar),
    requiredLevel: star >= MAX_STAR ? 0 : starLevelRequirement(nextStar),
    levelGap: star >= MAX_STAR ? 0 : Math.max(0, starLevelRequirement(nextStar) - level),
    shards,
    shardCost,
    shardGap: star >= MAX_STAR ? 0 : Math.max(0, shardCost - shards),
    goldCost: star >= MAX_STAR ? 0 : starGoldCost(star),
  };
}
