/**
 * 伤害管线。
 *
 * 纯函数：给定蛋、目标、修正与随机源，产出伤害数值与逐段拆解（breakdown）。
 * 拆解会原样带回给调用方，方便 HUD 调试面板、基准脚本与单测断言每一段倍率。
 *
 * 顺序：基础攻击 → 流派 → 羁绊攻击 → 连击 → 碰撞 → 元素反应 → 爆蛋窗口
 *      → 全局伤害倍率 → 暴击 → 易伤 → 护甲 → 抗性 → 下限 1
 */

import { ARMOR_K, COLLISION, CRIT, DEFAULT_EGG_POWER, ELEMENT, REACTIVE_ELEMENTS, RESIST_CLAMP, SCHOOL_MODIFIER } from "./constants.js";
import { comboBonuses } from "./combo.js";
import { modOf } from "./modifiers.js";
import { makeRng, roll } from "./rng.js";
import { armorShredFrom, damageTakenMultFrom, readStatuses } from "./status.js";

/**
 * 蛋的基础攻击力，逐级兜底以适配不同调用方。
 * 第一个「写了」的字段说了算：显式 0 就是 0 威力（零威力零伤是对外契约），
 * 一个字段都没写才用默认值。
 */
export function baseAttack(egg = {}, ctx = {}) {
  const candidates = [egg.power, egg.damage, egg.atk, ctx.hero?.atk, ctx.caster?.atk];
  for (const value of candidates) {
    if (typeof value === "number" && Number.isFinite(value)) return Math.max(0, value);
  }
  return DEFAULT_EGG_POWER;
}

/** 主蛋（玩家发射的那一枚）：分裂 / 召唤出来的小蛋 isMain 为假。 */
export function isMainEgg(egg = {}) {
  return egg.isMain === true || egg.main === true;
}

/** 蛋所属流派：蛋自带优先，其次施放英雄。 */
export function eggSchool(egg = {}, ctx = {}) {
  return egg.school ?? ctx.hero?.school ?? ctx.caster?.school ?? null;
}

/** 蛋携带的元素。 */
export function eggElement(egg = {}, ctx = {}) {
  return egg.element ?? ctx.element ?? ELEMENT.PHYSICAL;
}

function clampResist(value) {
  return Math.min(RESIST_CLAMP.max, Math.max(RESIST_CLAMP.min, value));
}

/** 目标对某元素的抗性。 */
export function resistOf(target = {}, element = ELEMENT.PHYSICAL) {
  const table = target.resist ?? target.resists ?? null;
  const raw = table?.[element] ?? (element === ELEMENT.PHYSICAL ? target.physicalResist ?? 0 : 0);
  return clampResist(Number.isFinite(raw) ? raw : 0);
}

/** 护甲减伤系数。脏数据（NaN / 负护甲）按无甲处理，不让 NaN 渗进伤害。 */
export function armorMitigation(armor = 0, shred = 0) {
  const safeArmor = Number.isFinite(armor) ? armor : 0;
  const safeShred = Number.isFinite(shred) ? Math.min(0.95, shred) : 0;
  const effective = Math.max(0, safeArmor * (1 - safeShred));
  return ARMOR_K / (ARMOR_K + effective);
}

/**
 * 碰撞流：把碰撞次数换成伤害倍率。
 * 羁绊来的每次碰撞加成（collisionDamageBonus）单独按 collisionDamageCap 封顶，
 * 与数据表「每次碰撞 +3%，上限 +30%」的口径一致；0 表示没设上限。
 */
export function collisionMultiplier(egg = {}, mods = {}, schoolMod = {}) {
  const hits = Math.min(COLLISION.MAX_STACKS, Math.max(0, Math.floor(egg.collisions ?? egg.bounces ?? 0)));
  if (hits <= 0) return 1;
  const scale = modOf(mods, "collisionDamageMult") * (schoolMod.collisionDamageMult ?? 1);
  const cap = modOf(mods, "collisionDamageCap");
  const bonus = hits * modOf(mods, "collisionDamageBonus");
  return 1 + hits * COLLISION.DAMAGE_PER_HIT * scale + (cap > 0 ? Math.min(cap, bonus) : bonus);
}

/**
 * 完整伤害结算。
 *
 * @param {object} params
 * @param {object} params.egg 蛋（只读）
 * @param {object} params.target 目标（只读）
 * @param {object} [params.ctx] 战斗上下文
 * @param {object} [params.mods] 已合并的修正表
 * @param {number} [params.comboStacks] 命中前连击层数
 * @param {number} [params.reactionMult] 元素反应倍率
 * @param {number} [params.burstMult] 爆蛋窗口倍率
 * @param {Function} [params.rng] 随机源
 * @returns {{ amount:number, preMitigation:number, crit:boolean, critMult:number, breakdown:object }}
 */
export function computeDamage({
  egg = {},
  target = {},
  ctx = {},
  mods = {},
  comboStacks = 0,
  reactionMult = 1,
  burstMult = 1,
  element = null,
  // 默认也要是确定性的：战斗层不允许出现 Math.random
  rng = makeRng(1),
  now = ctx.now ?? 0,
} = {}) {
  const hitElement = element ?? eggElement(egg, ctx);
  const school = eggSchool(egg, ctx);
  const schoolMod = SCHOOL_MODIFIER[school] ?? {};
  const statuses = readStatuses(target, ctx, now);
  const combo = comboBonuses(comboStacks, mods);

  const base = baseAttack(egg, ctx);
  const schoolMult = schoolMod.damageMult ?? 1;
  const atkMult = modOf(mods, "atkMult");
  const flat = modOf(mods, "flatDamage") + (egg.flatDamage ?? 0);
  const collisionMult = collisionMultiplier(egg, mods, schoolMod);
  const mainEggMult = isMainEgg(egg) ? Math.max(1, modOf(mods, "mainEggMult")) : 1;
  const elementMult = REACTIVE_ELEMENTS.includes(hitElement) ? modOf(mods, "elementDamageMult") : 1;
  const globalMult = modOf(mods, "damageMult") * (egg.damageMult ?? 1);

  let value =
    (base * schoolMult * atkMult * mainEggMult + flat) *
    combo.damageMult *
    collisionMult *
    elementMult *
    reactionMult *
    burstMult *
    globalMult;

  const critChance = Math.min(
    CRIT.MAX_CHANCE,
    Math.max(0, (egg.critChance ?? ctx.critChance ?? CRIT.BASE_CHANCE) + modOf(mods, "critChance") + combo.critChance),
  );
  const critMult = Math.max(1, (egg.critMult ?? CRIT.BASE_MULT) + modOf(mods, "critDmg") + combo.critDmg);
  const crit = egg.forceCrit === true || (egg.forceCrit !== false && roll(rng, critChance));
  if (crit) value *= critMult;

  const preMitigation = value;

  const vulnerability = damageTakenMultFrom(statuses);
  value *= vulnerability;

  const shred = Math.min(0.95, modOf(mods, "armorShred") + armorShredFrom(statuses) + (egg.armorShred ?? 0));
  const mitigation = armorMitigation(target.armor ?? 0, shred);
  value *= mitigation;

  const resist = resistOf(target, hitElement);
  value *= 1 - resist;

  // 下限 1 只保护「打得到但打得少」的情况；真的零威力就是零伤。
  // 字段缺失 / 脏数据算出 NaN 时同样收敛到 0，保证 damage 永远是有限数。
  const amount = Number.isFinite(value) && value > 0 ? Math.max(1, Math.round(value)) : 0;

  return {
    amount,
    preMitigation,
    crit,
    critMult,
    critChance,
    element: hitElement,
    breakdown: {
      base,
      school,
      schoolMult,
      atkMult,
      flat,
      comboStacks,
      comboMult: combo.damageMult,
      collisionMult,
      mainEggMult,
      elementMult,
      reactionMult,
      burstMult,
      globalMult,
      crit,
      critMult: crit ? critMult : 1,
      vulnerability,
      armor: target.armor ?? 0,
      armorShred: shred,
      mitigation,
      resist,
    },
  };
}

/**
 * 护盾吸收。返回护盾承担与真实掉血，不修改入参。
 */
export function applyShield(amount, target = {}, ctx = {}) {
  const shield = Math.max(0, target.shield ?? ctx.shields?.[target?.id] ?? 0);
  if (shield <= 0) return { absorbed: 0, hpDamage: amount, shieldLeft: 0 };
  const absorbed = Math.min(shield, amount);
  return { absorbed, hpDamage: amount - absorbed, shieldLeft: shield - absorbed };
}
