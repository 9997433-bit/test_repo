/*
 * Classic RTS attack-type x armor-type damage factors,
 * plus the classic armor damage-reduction formula.
 */
(function (global) {
  'use strict';

  var Config = global.WC3.Config;

  var ATTACK_TYPES = ['normal', 'pierce', 'siege', 'magic', 'chaos', 'hero', 'spells'];
  var ARMOR_TYPES = ['unarmored', 'light', 'medium', 'heavy', 'fortified', 'hero', 'divine'];

  //                unarm light medium heavy fort  hero  divine
  var TABLE = {
    normal:  [1.00, 1.00, 1.50, 1.00, 0.70, 1.00, 0.05],
    pierce:  [1.50, 2.00, 0.75, 1.00, 0.35, 0.50, 0.05],
    siege:   [1.00, 1.00, 0.50, 1.00, 1.50, 0.50, 0.05],
    magic:   [1.00, 1.25, 0.75, 1.50, 0.35, 0.50, 0.05],
    chaos:   [1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00],
    hero:    [1.00, 1.00, 1.00, 1.00, 0.50, 1.00, 0.05],
    spells:  [1.00, 1.00, 1.00, 1.00, 1.00, 0.70, 0.05]
  };

  var ARMOR_INDEX = {};
  ARMOR_TYPES.forEach(function (a, i) { ARMOR_INDEX[a] = i; });

  /** Multiplier applied before armor reduction. */
  function factor(attackType, armorType) {
    var row = TABLE[attackType];
    if (!row) return 1;
    var i = ARMOR_INDEX[armorType];
    if (i === undefined) return 1;
    return row[i];
  }

  /**
   * WC3 armor reduction. Positive armor reduces, negative armor amplifies.
   *   reduction = (k * armor) / (1 + k * armor)
   */
  function armorMultiplier(armor) {
    var k = Config.ARMOR_REDUCTION_K;
    if (armor >= 0) return 1 - (k * armor) / (1 + k * armor);
    return 2 - Math.pow(0.94, -armor);
  }

  /**
   * Full damage pipeline.
   * @returns {number} damage actually applied (never negative)
   */
  function computeDamage(base, attackType, armorType, armor) {
    var d = base * factor(attackType, armorType) * armorMultiplier(armor || 0);
    return d > 0 ? d : 0;
  }

  /** Air units can only be hit by pierce / magic / chaos attacks (design rule). */
  var AIR_CAPABLE = { pierce: true, magic: true, chaos: true };
  function canHitAir(attackType) {
    return !!AIR_CAPABLE[attackType];
  }

  var API = {
    ATTACK_TYPES: ATTACK_TYPES,
    ARMOR_TYPES: ARMOR_TYPES,
    TABLE: TABLE,
    factor: factor,
    armorMultiplier: armorMultiplier,
    computeDamage: computeDamage,
    canHitAir: canHitAir
  };

  global.WC3.Damage = API;

  if (typeof module === 'object' && module.exports) module.exports = API;
})(typeof globalThis !== 'undefined' ? globalThis : this);
