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
 *
 * 消费 `effects` 的推荐姿势（指令契约细节见 combat/effects.js 头部）：
 *
 * ```js
 * const { damage, effects, comboDelta } = resolveHit(egg, enemy, ctx);
 * const { combat, physics, party, presentation } = splitEffects(effects);
 * const plan = presentationPlan(presentation); // { hitstop, shake, floaters, sfx, ... }
 * ```
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
  RACE_ALIAS,
  REACTION,
  REACTION_LABEL,
  REACTIVE_ELEMENTS,
  RESIST_CLAMP,
  SCHOOL,
  SCHOOL_MODIFIER,
  STATUS,
} from "./constants.js";

export {
  COMBO_OP,
  DOMAIN,
  DOMAIN_ORDER,
  EFFECT,
  EFFECT_DOMAIN,
  EFFECT_SCHEMA_VERSION,
  EFFECT_TYPES,
  EGG_SCOPE,
  FEEDBACK,
  FEEDBACK_KINDS,
  PARTY_SCOPE,
  auraEffect,
  buffEffect,
  chainEffect,
  clearStatusEffect,
  comboEffect,
  damageEffect,
  domainOf,
  eggPatchEffect,
  effectsForDomain,
  effectsOfType,
  energyEffect,
  explosionEffect,
  feedbackEffect,
  fieldEffect,
  healEffect,
  isEffect,
  isKnownFeedback,
  presentationPlan,
  shieldEffect,
  sortEffects,
  spawnEggEffect,
  splitEffects,
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
  keptStacks,
  planCombo,
} from "./combo.js";

export {
  elementEffects,
  elementThreshold,
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
  raceBondTable,
  schoolBondTable,
  synergyBondTable,
  translateSynergyMod,
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
  isMainEgg,
  resistOf,
} from "./damage.js";

export { armorShredFrom, damageTakenMultFrom, hasStatus, readStatuses } from "./status.js";

export { expandAreaEffects, resolveChain, resolveExplosion } from "./area.js";

export {
  SKILLS,
  SKILL_ALIAS,
  SKILL_BY_HERO,
  canonicalSkillId,
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
