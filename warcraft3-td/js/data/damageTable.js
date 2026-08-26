/* Warcraft III attack × armor damage factor table (TFT 1.30+ flavoured).
 * See DESIGN.md §1. This module is DOM-free so the node tests can require it. */
(function (root) {
  'use strict';
  const NS = (root.WC3TD = root.WC3TD || {});

  const ATTACK_TYPES = ['normal', 'pierce', 'siege', 'magic', 'chaos', 'hero', 'spells'];
  const ARMOR_TYPES = ['unarmored', 'light', 'medium', 'heavy', 'fortified', 'hero', 'divine'];

  //                unarm light medium heavy fort  hero  divine
  const TABLE = {
    normal: [1.00, 1.00, 1.50, 1.00, 0.70, 1.00, 0.05],
    pierce: [1.50, 2.00, 0.75, 1.00, 0.35, 0.50, 0.05],
    siege:  [1.00, 1.00, 0.50, 1.00, 1.50, 0.50, 0.05],
    magic:  [1.00, 1.25, 0.75, 1.50, 0.35, 0.50, 0.05],
    chaos:  [1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00],
    hero:   [1.00, 1.00, 1.00, 1.00, 0.50, 1.00, 0.05],
    spells: [1.00, 1.00, 1.00, 1.00, 1.00, 0.70, 0.05]
  };

  const ARMOR_INDEX = {};
  ARMOR_TYPES.forEach((a, i) => { ARMOR_INDEX[a] = i; });

  /** Type multiplier for an attack type against an armor type. */
  function factor(attackType, armorType) {
    const row = TABLE[attackType];
    if (!row) throw new Error('unknown attack type: ' + attackType);
    const idx = ARMOR_INDEX[armorType];
    if (idx === undefined) throw new Error('unknown armor type: ' + armorType);
    return row[idx];
  }

  /** WC3 armor-value mitigation. Positive armor reduces, negative armor amplifies. */
  function armorMultiplier(armorValue) {
    const k = NS.Config ? NS.Config.armorReductionPerPoint : 0.06;
    if (armorValue >= 0) return 1 - (k * armorValue) / (1 + k * armorValue);
    return 2 - Math.pow(1 - k, -armorValue);
  }

  /**
   * Full WC3 damage pipeline.
   * base -> +flat bonus vs armor type -> × attack/armor factor -> × armor value -> × situational
   * Returns a detailed breakdown so the UI can show "×1.50" like WC3 does.
   */
  function resolve(opts) {
    const base = opts.base || 0;
    const attackType = opts.attackType || 'normal';
    const armorType = opts.armorType || 'unarmored';
    const armorValue = opts.armorValue || 0;
    const bonus = (opts.bonusVsArmor && opts.bonusVsArmor[armorType]) || 0;
    const typeFactor = factor(attackType, armorType);
    const armorFactor = armorMultiplier(armorValue);
    const extra = opts.multiplier === undefined ? 1 : opts.multiplier;
    const raw = (base + bonus) * typeFactor * armorFactor * extra;
    return {
      amount: Math.max(0, raw),
      typeFactor,
      armorFactor,
      bonus,
      multiplier: extra
    };
  }

  /** Convenience: just the number. */
  function compute(opts) { return resolve(opts).amount; }

  /** Can this attack type physically reach a flying target? (DESIGN.md §3) */
  function attackTypeHitsAir(attackType) {
    const list = (NS.Config && NS.Config.flyingAttackTypes) || ['pierce', 'magic', 'chaos'];
    return list.indexOf(attackType) !== -1;
  }

  NS.DamageTable = {
    ATTACK_TYPES, ARMOR_TYPES, TABLE,
    factor, armorMultiplier, resolve, compute, attackTypeHitsAir
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
