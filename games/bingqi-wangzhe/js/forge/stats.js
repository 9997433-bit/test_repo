/**
 * 兵器属性结算 — 纯函数，可在 Node 中直接 import。
 * 战斗层与 UI 层都应通过这里读取最终面板，避免各自重算导致数值漂移。
 */

import { WEAPON_BY_ID } from '../data/weapons.js';
import {
  QUALITY_STAT_MULTIPLIER,
  QUALITY_LEVEL_CAP,
  LEVEL_GROWTH,
  SKILL_SLOT_LEVELS,
  MAX_SKILL_SLOTS,
  ELEMENT_BEATS,
  ELEMENT_MULTIPLIER,
  POWER_FORMULA,
  QUALITY_RANK,
} from '../data/balance.js';

export const BASE_CRIT = 0.05;
export const BASE_CRIT_DMG = 1.5;

const ZERO_AFFIX_STATS = Object.freeze({
  elementDmg: 0,
  crit: 0,
  critDmg: 0,
  lifesteal: 0,
  combo: 0,
  mitigation: 0,
  speed: 0,
  reflect: 0,
  atkPct: 0,
  hpPct: 0,
  pierce: 0,
  firstStrike: 0,
  execute: 0,
  cdDown: 0,
});

export function getProto(protoId) {
  return WEAPON_BY_ID[protoId] ?? null;
}

/** 把 affixes[] 汇总成一张 stat 表。 */
export function sumAffixes(affixes) {
  const out = { ...ZERO_AFFIX_STATS };
  if (!Array.isArray(affixes)) return out;
  for (const a of affixes) {
    if (!a || typeof a.stat !== 'string') continue;
    const v = Number(a.value);
    if (!Number.isFinite(v)) continue;
    out[a.stat] = (out[a.stat] ?? 0) + v;
  }
  return out;
}

export function levelCapFor(quality) {
  return QUALITY_LEVEL_CAP[quality] ?? QUALITY_LEVEL_CAP.common;
}

export function skillSlotsFor(level) {
  let slots = 0;
  for (const need of SKILL_SLOT_LEVELS) {
    if (level >= need) slots += 1;
  }
  return Math.min(MAX_SKILL_SLOTS, Math.max(1, slots));
}

/**
 * 计算一把兵器实例的最终面板。
 * @param {{protoId:string, quality:string, level:number, affixes:Array}} weapon
 * @returns {object|null}
 */
export function computeWeaponStats(weapon) {
  if (!weapon || typeof weapon !== 'object') return null;
  const proto = getProto(weapon.protoId);
  if (!proto) return null;

  const quality = weapon.quality in QUALITY_STAT_MULTIPLIER ? weapon.quality : 'common';
  const level = Math.max(1, Math.floor(Number(weapon.level) || 1));
  const qMul = QUALITY_STAT_MULTIPLIER[quality];
  const af = sumAffixes(weapon.affixes);

  const atkRaw = proto.baseAtk * qMul * (1 + LEVEL_GROWTH.atk * (level - 1)) * (1 + af.atkPct);
  const hpRaw = proto.baseHp * qMul * (1 + LEVEL_GROWTH.hp * (level - 1)) * (1 + af.hpPct);

  const atk = Math.round(atkRaw);
  const hp = Math.round(hpRaw);
  const speed = Math.round((proto.baseSpeed ?? 100) + af.speed);
  const crit = Math.min(0.95, BASE_CRIT + af.crit);
  const critDmg = BASE_CRIT_DMG + af.critDmg;

  const power = Math.round(
    atk * (1 + crit * POWER_FORMULA.critWeight) * (1 + af.elementDmg) + hp * POWER_FORMULA.hpWeight,
  );

  return {
    protoId: proto.id,
    name: proto.name,
    title: proto.title,
    icon: proto.icon,
    type: proto.type,
    element: proto.element,
    quality,
    qualityRank: QUALITY_RANK[quality] ?? 0,
    level,
    levelCap: levelCapFor(quality),
    forgeStage: proto.forgeStage,
    skillId: proto.skillId,
    skillSlots: skillSlotsFor(level),
    atk,
    hp,
    speed,
    crit,
    critDmg,
    elementDmg: af.elementDmg,
    lifesteal: af.lifesteal,
    combo: af.combo,
    mitigation: af.mitigation,
    reflect: af.reflect,
    pierce: af.pierce,
    firstStrike: af.firstStrike,
    execute: af.execute,
    cdDown: af.cdDown,
    power,
  };
}

/** fire → ice → thunder → fire */
export function elementFactor(attacker, defender) {
  if (!attacker || !defender || attacker === defender) return ELEMENT_MULTIPLIER.neutral;
  if (ELEMENT_BEATS[attacker] === defender) return ELEMENT_MULTIPLIER.strong;
  if (ELEMENT_BEATS[defender] === attacker) return ELEMENT_MULTIPLIER.weak;
  return ELEMENT_MULTIPLIER.neutral;
}

/** 一组兵器的粗略战力（不含羁绊，羁绊由战斗层叠加）。 */
export function sumPower(weapons) {
  if (!Array.isArray(weapons)) return 0;
  let total = 0;
  for (const w of weapons) {
    const s = computeWeaponStats(w);
    if (s) total += s.power;
  }
  return total;
}

export default computeWeaponStats;
