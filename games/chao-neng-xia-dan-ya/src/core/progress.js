/**
 * 养成接入层。
 *
 * 真正的数值实现在 `src/progression/**`（Opus-3 所有权），本文件只做两件事：
 *   1. 按主循环原有的函数签名转发，避免四处改 import；
 *   2. 把上游返回的运行时英雄实例补上表现字段（palette 数组、元素字符串、
 *      可读大招名），交给 Canvas 与 UI 组件直接使用。
 * 不在这里做任何数值计算。
 */
import {
  MAX_LEVEL,
  MAX_STAR,
  buildLoadout as upstreamBuildLoadout,
  dexBonus,
  grantShards,
  heroAtk,
  heroLevel,
  heroStar,
  levelCapForStar,
  levelUpCost,
  starGoldCost,
  starLevelRequirement,
  starUpCost,
  tryLevelUp,
  tryStarUp,
} from "../progression/index.js";
import { decorateMember } from "./catalog.js";

export {
  MAX_LEVEL,
  MAX_STAR,
  dexBonus,
  grantShards,
  heroAtk,
  heroLevel,
  heroStar,
  levelCapForStar,
  levelUpCost,
  starGoldCost,
  starLevelRequirement,
  starUpCost,
  tryLevelUp,
  tryStarUp,
};

/** 图鉴已收集英雄数（结算页与图鉴页的进度文案用）。 */
export function dexRatio(save) {
  return Object.values(save?.dex ?? {}).filter(Boolean).length;
}

/**
 * 组建出战队伍。返回结构与上游一致，只把 `heroes` 换成带表现字段的版本，
 * 并保留 `squad`（技能触发器需要原始运行时对象）。
 *
 * @param {object} save
 * @param {{roster?: string[], flatLevel?: number|null, includeFishing?: boolean}} [opts]
 */
export function buildLoadout(save, opts = {}) {
  const loadout = upstreamBuildLoadout(save, opts);
  return {
    ...loadout,
    heroes: loadout.heroes.map((member, index) => decorateMember(member, index)),
  };
}
