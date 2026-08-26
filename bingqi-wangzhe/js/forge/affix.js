/**
 * 词条投掷 — 需要显式传入 rng 适配器，绝不隐式使用 Math.random。
 */

import { AFFIXES, AFFIX_ROLL_TIERS } from '../data/affixes.js';
import { QUALITY_RANK, QUALITY_AFFIX_COUNT, QUALITY_AFFIX_POWER } from '../data/balance.js';

function tierOf(roll) {
  for (const t of AFFIX_ROLL_TIERS) {
    if (roll < t.maxRoll) return t.id;
  }
  return AFFIX_ROLL_TIERS[AFFIX_ROLL_TIERS.length - 1].id;
}

function quantize(def, raw) {
  if (def.unit === 'flat') return Math.max(1, Math.round(raw));
  return Math.round(raw * 10000) / 10000;
}

/** 该品质下可用的词条池。 */
export function affixPoolFor(quality) {
  const rank = QUALITY_RANK[quality] ?? 0;
  return AFFIXES.filter((a) => (QUALITY_RANK[a.minQuality] ?? 0) <= rank);
}

export function affixCountFor(quality) {
  return QUALITY_AFFIX_COUNT[quality] ?? 1;
}

/**
 * 投掷一组不重复的词条实例。
 * @param {object} proto 兵器原型（用于 elementLocked 词条绑定主元素）
 * @param {string} quality
 * @param {object} rngA createRngAdapter 的返回值
 * @param {number} [count]
 * @returns {Array<{id:string,name:string,stat:string,value:number,unit:string,tier:string,element:string|null,desc:string}>}
 */
export function rollAffixes(proto, quality, rngA, count) {
  if (!rngA) return [];
  const want = Math.max(0, count ?? affixCountFor(quality));
  const pool = affixPoolFor(quality).slice();
  const power = QUALITY_AFFIX_POWER[quality] ?? 1;
  const out = [];

  for (let i = 0; i < want && pool.length > 0; i += 1) {
    const def = rngA.weightedPick(pool, (a) => a.weight);
    if (!def) break;
    pool.splice(pool.indexOf(def), 1);

    const roll = rngA.float();
    const raw = (def.min + (def.max - def.min) * roll) * power;
    out.push({
      id: def.id,
      name: def.name,
      stat: def.stat,
      value: quantize(def, raw),
      unit: def.unit,
      tier: tierOf(roll),
      element: def.elementLocked ? proto.element : null,
      desc: def.desc,
    });
  }

  return out;
}

/** 重铸：保留词条种类，只重投数值（Round 2 的洗练入口预留）。 */
export function rerollAffixValues(proto, quality, affixes, rngA) {
  if (!rngA || !Array.isArray(affixes)) return [];
  const power = QUALITY_AFFIX_POWER[quality] ?? 1;
  return affixes.map((inst) => {
    const def = AFFIXES.find((a) => a.id === inst.id);
    if (!def) return inst;
    const roll = rngA.float();
    const raw = (def.min + (def.max - def.min) * roll) * power;
    return {
      ...inst,
      value: quantize(def, raw),
      tier: tierOf(roll),
      element: def.elementLocked ? proto.element : null,
    };
  });
}

export default rollAffixes;
