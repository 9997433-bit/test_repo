/**
 * 养成上下文（Opus-3 所有权）。
 *
 * 英雄运行时只认这个结构，不直接读存档，也不知道肉鸽/冒险的差异从哪来。
 * 冒险上下文来自账号存档（等级 / 星级 / 图鉴 / 钓鱼），
 * 肉鸽上下文来自 run 对象（临时等级 / 神器），两者字段同构、来源互斥。
 */
import {
  ATK_PER_LEVEL,
  ATK_PER_STAR,
  CRIT_PER_STAR,
  ENERGY_PER_STAR,
  HP_PER_LEVEL,
  HP_PER_STAR,
  MAX_LEVEL,
  MIN_STAR,
  ROGUE_ATK_PER_LEVEL,
  ROGUE_BASE_STAR,
  ROGUE_MAX_LEVEL,
} from "./constants.js";
import { ensureProgression, heroLevelOf, heroStarOf } from "./save.js";
import { dexAttackBonus, raceTech } from "./dex.js";
import { heroDef } from "./catalog.js";
import { aggregateFishingBuff } from "./fishing.js";
import { rogueArtifactMods, rogueLevelOf, rogueStarOf } from "./rogue.js";

/** `energyPerLevel: 0` = 能量回复的等级加成走数据表段位（`LEVEL_BAND_BONUSES`）。 */
const ACCOUNT_GROWTH = {
  atkPerLevel: ATK_PER_LEVEL,
  atkPerStar: ATK_PER_STAR,
  hpPerLevel: HP_PER_LEVEL,
  hpPerStar: HP_PER_STAR,
  energyPerLevel: 0,
  energyPerStar: ENERGY_PER_STAR,
  critPerStar: CRIT_PER_STAR,
  maxLevel: MAX_LEVEL,
};

/** 肉鸽不读账号养成表，等级曲线（含能量）全部由 run 自带。 */
const ROGUE_GROWTH = {
  atkPerLevel: ROGUE_ATK_PER_LEVEL,
  atkPerStar: 0,
  hpPerLevel: 0.05,
  hpPerStar: 0,
  energyPerLevel: 0.02,
  energyPerStar: 0,
  critPerStar: 0,
  maxLevel: ROGUE_MAX_LEVEL,
};

/** 冒险 / 爬塔 / 讨伐共用：吃满账号养成。 */
export function buildAdventureContext(save, { includeFishing = true, includeRaceTech = true } = {}) {
  const target = ensureProgression(save);
  const dexBonus = dexAttackBonus(target);
  const fishing = includeFishing
    ? aggregateFishingBuff(target)
    : { atk: 0, crit: 0, extraEggs: 0, eggPower: 0, sources: [] };
  const tech = includeRaceTech ? raceTech(target) : { byRace: {}, bonus: {} };

  return {
    mode: "adventure",
    source: "save",
    roster: [...target.roster],
    growth: ACCOUNT_GROWTH,
    levelOf: (heroId) => heroLevelOf(target, heroId),
    starOf: (heroId) => heroStarOf(target, heroId),
    heroAtkMul: (heroId) => 1 + (tech.bonus[heroDef(heroId)?.race] ?? 0),
    dexBonus,
    fishing,
    raceTech: tech,
    globalAtkMul: (1 + dexBonus) * (1 + fishing.atk),
    critBonus: fishing.crit,
    extraEggs: fishing.extraEggs,
    eggPowerMul: 1 + fishing.eggPower,
    energyMul: 1,
    breakdown: { dex: dexBonus, fishing: fishing.atk, artifacts: 0 },
  };
}

/**
 * 肉鸽：完全不读存档。即使传进来 save 也只用于判空，
 * 数值一律来自 run 的临时等级与神器。
 */
export function buildRogueContext(run) {
  const artifacts = rogueArtifactMods(run);
  return {
    mode: "rogue",
    source: "run",
    roster: [...(run?.squad ?? [])],
    growth: ROGUE_GROWTH,
    levelOf: (heroId) => rogueLevelOf(run, heroId),
    starOf: () => rogueStarOf(),
    heroAtkMul: () => 1,
    dexBonus: 0,
    fishing: { atk: 0, crit: 0, extraEggs: 0, eggPower: 0, sources: [] },
    raceTech: { byRace: {}, bonus: {} },
    globalAtkMul: 1 + artifacts.atk,
    critBonus: artifacts.crit,
    extraEggs: Math.floor(artifacts.extraEggs),
    eggPowerMul: 1 + artifacts.eggPower,
    energyMul: 1 + artifacts.energy,
    artifacts: [...(run?.artifacts ?? [])],
    breakdown: { dex: 0, fishing: 0, artifacts: artifacts.atk },
  };
}

/** 无存档无 run 的裸上下文，供预览、单测与数值对拍使用。 */
export function neutralContext({ level = 1, star = MIN_STAR } = {}) {
  return {
    mode: "preview",
    source: "none",
    roster: [],
    growth: ACCOUNT_GROWTH,
    levelOf: () => level,
    starOf: () => star,
    heroAtkMul: () => 1,
    dexBonus: 0,
    fishing: { atk: 0, crit: 0, extraEggs: 0, eggPower: 0, sources: [] },
    raceTech: { byRace: {}, bonus: {} },
    globalAtkMul: 1,
    critBonus: 0,
    extraEggs: 0,
    eggPowerMul: 1,
    energyMul: 1,
    breakdown: { dex: 0, fishing: 0, artifacts: 0 },
  };
}

export { ACCOUNT_GROWTH, ROGUE_GROWTH, ROGUE_BASE_STAR };
