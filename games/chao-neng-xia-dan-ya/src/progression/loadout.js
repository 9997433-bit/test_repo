/**
 * 主循环兼容层（Opus-3 所有权）。
 *
 * `src/core/progress.js`（Opus-4 的临时实现）声明的接口是
 * `buildLoadout(save, opts) → { heroes, bonds, ... }`，并注明「后续可整体替换为上游实现」。
 * 本文件按同样的签名与返回字段实现，因此主循环把 import 从
 * `../core/progress.js` 换成 `../progression/index.js` 即可切换，
 * 同时额外拿到 `squad`（技能触发器所需的运行时对象）。
 */
import { createSquad } from "../heroes/squad.js";
import { MAX_LEVEL, MAX_STAR, clampInt, levelGoldCost } from "./constants.js";
import { heroDef } from "./catalog.js";
import { addShards, ensureProgression, heroLevelOf, heroStarOf } from "./save.js";
import { buildAdventureContext, neutralContext } from "./context.js";
import { dexAttackBonus, raceTech } from "./dex.js";
import { aggregateFishingBuff } from "./fishing.js";
import { levelUpHero } from "./level.js";
import { starShardCost, starUpHero } from "./star.js";
import { computeHeroStats } from "../heroes/stats.js";

export { MAX_LEVEL, MAX_STAR };

export function heroLevel(save, id) {
  return heroLevelOf(ensureProgression(save), id);
}

export function heroStar(save, id) {
  return heroStarOf(ensureProgression(save), id);
}

export function levelUpCost(level) {
  return levelGoldCost(clampInt(level, 1, MAX_LEVEL));
}

export function starUpCost(star) {
  return starShardCost(clampInt(star, 1, MAX_STAR));
}

/** 单体攻击力（不含羁绊 / 光环），面板与排序用。 */
export function heroAtk(save, id) {
  const def = heroDef(id);
  if (!def) return 0;
  return computeHeroStats(def, buildAdventureContext(ensureProgression(save))).atk;
}

/** 与 `core/progress.dexBonus` 同签名的简化版（只看英雄栏）。 */
export function dexBonus(save, catalogSize = 20) {
  const owned = Object.values(ensureProgression(save).dex ?? {}).filter(Boolean).length;
  return Math.min(0.15, (owned / Math.max(1, catalogSize)) * 0.15);
}

/**
 * 组建一支出战队伍。
 * @param {object} save
 * @param {{roster?: string[], flatLevel?: number|null, includeFishing?: boolean}} [opts]
 *        `flatLevel` 用于肉鸽等「不带养成」的模式：等级抹平、星级归 1、
 *        图鉴与钓鱼 BUFF 全部失效。
 */
export function buildLoadout(save, opts = {}) {
  const target = ensureProgression(save);
  const flat = opts.flatLevel ?? null;
  const roster = opts.roster ?? target.roster;

  const ctx = flat
    ? { ...neutralContext({ level: flat, star: 1 }), mode: "flat", source: "flat" }
    : buildAdventureContext(target, { includeFishing: opts.includeFishing !== false });

  const squad = createSquad(roster, ctx, { save: flat ? null : target });
  const fishing = flat ? { atk: 0, crit: 0, extraEggs: 0, eggPower: 0 } : aggregateFishingBuff(target);

  return {
    squad,
    heroes: squad.members,
    bonds: squad.bonds.active,
    schoolCounts: squad.bonds.counts,
    atkBonus: squad.bonds.atkBonus,
    dexBonus: flat ? 0 : dexAttackBonus(target),
    raceTech: flat ? { byRace: {}, bonus: {} } : raceTech(target),
    fishBuff: flat ? null : (target.fishBuff ?? null),
    critBonus: fishing.crit,
    extraEggs: fishing.extraEggs,
    warnings: squad.warnings,
  };
}

/** 与 `core/progress` 同名同签名的写操作，返回结构是其超集。 */
export function grantShards(save, id, amount) {
  return addShards(save, id, amount);
}

export function tryLevelUp(save, id) {
  const result = levelUpHero(save, id, 1);
  return result.ok
    ? { ok: true, cost: result.cost, level: result.to }
    : { ok: false, reason: result.reason, code: result.code };
}

export function tryStarUp(save, id) {
  const result = starUpHero(save, id);
  return result.ok
    ? { ok: true, cost: result.shardCost, star: result.to }
    : { ok: false, reason: result.reason, code: result.code };
}
