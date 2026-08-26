/**
 * 战斗层公共出口。
 *
 * 契约（见 .agent_workspace/ARCHITECTURE.md）：
 * `resolveHit(egg, target, ctx) → { damage, effects, comboDelta, events }`
 *
 * 本层全部是纯函数：
 * - 不引用 DOM / window / document
 * - 不修改传入的蛋、目标、世界对象
 * - 不直接操作物理积分器，所有物理副作用以 `spawn_egg` / `egg_patch` / `field` 指令表达
 */

export { resolveHit, applyHit, resolveMods, PHYSICAL } from "./resolve.js";

export {
  ARMOR_K,
  COLLISION,
  COMBO,
  CRIT,
  DEFAULT_EGG_POWER,
  ELEMENT,
  ELEMENTS,
  RACE,
  REACTION,
  REACTION_LABEL,
  REACTIVE_ELEMENTS,
  RESIST_CLAMP,
  SCHOOL,
  SCHOOL_MODIFIER,
  STATUS,
} from "./constants.js";

export {
  EFFECT,
  EFFECT_DOMAIN,
  auraEffect,
  buffEffect,
  chainEffect,
  clearStatusEffect,
  comboEffect,
  damageEffect,
  eggPatchEffect,
  effectsForDomain,
  effectsOfType,
  energyEffect,
  explosionEffect,
  feedbackEffect,
  fieldEffect,
  healEffect,
  shieldEffect,
  spawnEggEffect,
  statusEffect,
} from "./effects.js";

export { EVENT } from "./events.js";

export {
  BURST_BUFF_ID,
  advanceCombo,
  breakCombo,
  burstEffects,
  burstHitEffects,
  burstThreshold,
  comboBonuses,
  createCombo,
  decayCombo,
  isBurstActive,
  planCombo,
} from "./combo.js";

export {
  elementEffects,
  isReactiveElement,
  previewElement,
  reactionBetween,
  readAura,
  resolveElement,
} from "./elements.js";

export {
  BOND_THRESHOLDS,
  BOND_TIER,
  CROWN_AURA,
  DEFAULT_RACE_BONDS,
  DEFAULT_SCHOOL_BONDS,
  bondModsFrom,
  bondTier,
  computeBonds,
  describeBonds,
} from "./bonds.js";

export {
  MOD_SPEC,
  mergeMods,
  modOf,
  modsFromBuffs,
  neutralMods,
} from "./modifiers.js";

export {
  applyShield,
  armorMitigation,
  baseAttack,
  collisionMultiplier,
  computeDamage,
  eggElement,
  eggSchool,
  resistOf,
} from "./damage.js";

export { armorShredFrom, damageTakenMultFrom, hasStatus, readStatuses } from "./status.js";

export { expandAreaEffects, resolveChain, resolveExplosion } from "./area.js";

export {
  SKILLS,
  SKILL_BY_HERO,
  castSkill,
  getSkill,
  skillCost,
  skillIdFor,
} from "./skills.js";

export {
  activeMods,
  applyEffects,
  contextFromState,
  createCombatState,
  tickCombat,
} from "./state.js";

export { hash32, makeRng, mixSeed, rngFrom, roll } from "./rng.js";
