/**
 * 元素附着与元素反应。
 *
 * GDD 规则：
 * - 火 + 冰 = 蒸发：伤害 ×1.4 并移除冻结
 * - 雷 + 冰 = 超导：破甲 8s
 * - 雷 + 火 = 超载：小爆炸
 * - 同元素叠满 3 层：火 → 持续灼烧，冰 → 冻结 1.2s，雷 → 弹跳 2 次
 *
 * 结算分两步，因为反应倍率要参与伤害计算，而饱和效果又要基于最终伤害：
 * 1. `previewElement()` 只看附着状态，产出反应类型与伤害倍率
 * 2. `elementEffects()` 拿到最终伤害后，产出附着写入 / 状态 / 爆炸 / 弹跳指令
 */

import { ELEMENT, ELEMENTS, REACTION, REACTION_LABEL, STATUS } from "./constants.js";
import {
  FEEDBACK,
  PARTY_SCOPE,
  auraEffect,
  chainEffect,
  clearStatusEffect,
  energyEffect,
  explosionEffect,
  feedbackEffect,
  statusEffect,
} from "./effects.js";
import { auraEvent, reactionEvent, saturateEvent } from "./events.js";
import { modOf } from "./modifiers.js";

/** 反应查表：无序组合 → 反应名。 */
const REACTION_PAIRS = new Map([
  [`${ELEMENT.FIRE}|${ELEMENT.ICE}`, REACTION.VAPORIZE],
  [`${ELEMENT.ICE}|${ELEMENT.FIRE}`, REACTION.VAPORIZE],
  [`${ELEMENT.THUNDER}|${ELEMENT.ICE}`, REACTION.SUPERCONDUCT],
  [`${ELEMENT.ICE}|${ELEMENT.THUNDER}`, REACTION.SUPERCONDUCT],
  [`${ELEMENT.THUNDER}|${ELEMENT.FIRE}`, REACTION.OVERLOAD],
  [`${ELEMENT.FIRE}|${ELEMENT.THUNDER}`, REACTION.OVERLOAD],
]);

/** 同元素饱和后触发的状态。 */
const SATURATION = {
  [ELEMENT.FIRE]: STATUS.BURN,
  [ELEMENT.ICE]: STATUS.FREEZE,
  [ELEMENT.THUNDER]: STATUS.SHOCK,
};

/** 是否是可附着元素。 */
export function isReactiveElement(element) {
  return element === ELEMENT.FIRE || element === ELEMENT.ICE || element === ELEMENT.THUNDER;
}

/** 两种元素之间的反应，没有则返回 null。 */
export function reactionBetween(incoming, existing) {
  if (!isReactiveElement(incoming) || !isReactiveElement(existing)) return null;
  return REACTION_PAIRS.get(`${incoming}|${existing}`) ?? null;
}

/** 读取目标当前附着。优先 ctx.auras（战斗状态），其次 target.aura。 */
export function readAura(target, ctx = {}, now = ctx.now ?? 0) {
  const byId = target?.id != null ? ctx.auras?.[target.id] : null;
  const aura = byId ?? target?.aura ?? null;
  if (!aura || !isReactiveElement(aura.element) || !(aura.stacks > 0)) return null;
  if (typeof aura.expiresAt === "number" && aura.expiresAt <= now) return null;
  return { element: aura.element, stacks: aura.stacks, power: aura.power ?? 1, expiresAt: aura.expiresAt ?? null };
}

/** 反应倍率：只放大超出 1 的部分，避免羁绊把无反应命中也拉高。 */
function reactionMultiplier(base, mods) {
  return 1 + (base - 1) * modOf(mods, "reactionMult");
}

/** 触发饱和效果所需的同元素层数（属性流 3 人羁绊会降到 2）。 */
export function elementThreshold(mods = {}) {
  return Math.max(1, Math.round(ELEMENTS.STACK_MAX + modOf(mods, "elementThresholdDelta")));
}

/**
 * 附着 / 反应预演。不产出指令，只回答「这一下会发生什么、伤害乘几」。
 *
 * @returns {{
 *   element: string, applied: boolean, reaction: string|null, saturated: string|null,
 *   stacks: number, power: number, damageMult: number,
 *   prevAura: object|null, nextAura: object|null
 * }}
 */
export function previewElement({ element = ELEMENT.PHYSICAL, power = ELEMENTS.BASE_POWER, target, ctx = {}, now = ctx.now ?? 0, mods = {} } = {}) {
  const prevAura = readAura(target, ctx, now);
  const base = {
    element,
    applied: false,
    reaction: null,
    saturated: null,
    stacks: prevAura?.stacks ?? 0,
    power: 0,
    damageMult: 1,
    prevAura,
    nextAura: prevAura,
  };

  if (!isReactiveElement(element)) return base;

  const appliedPower = power * modOf(mods, "elementPowerMult");

  if (prevAura && prevAura.element !== element) {
    const reaction = reactionBetween(element, prevAura.element);
    if (reaction) {
      const table = {
        [REACTION.VAPORIZE]: ELEMENTS.VAPORIZE.damageMult,
        [REACTION.SUPERCONDUCT]: ELEMENTS.SUPERCONDUCT.damageMult,
        [REACTION.OVERLOAD]: ELEMENTS.OVERLOAD.damageMult,
      };
      return {
        ...base,
        applied: false,
        reaction,
        stacks: 0,
        power: appliedPower,
        damageMult: reactionMultiplier(table[reaction] ?? 1, mods),
        // 反应吃掉双方附着，下一次命中从干净状态重新起叠
        nextAura: null,
      };
    }
    // 非反应组合（理论上不会出现，留作扩展元素的兜底）：覆盖附着
    return {
      ...base,
      applied: true,
      stacks: 1,
      power: appliedPower,
      nextAura: { element, stacks: 1, power: appliedPower, expiresAt: now + ELEMENTS.AURA_DURATION * modOf(mods, "statusDurationMult") },
    };
  }

  const gain = 1 + Math.max(0, Math.round(modOf(mods, "elementStackBonus")));
  const stacks = (prevAura?.stacks ?? 0) + gain;
  const threshold = elementThreshold(mods);

  if (stacks >= threshold) {
    return {
      ...base,
      applied: true,
      saturated: SATURATION[element] ?? null,
      stacks: threshold,
      power: appliedPower,
      // 饱和后消耗附着，形成「叠 3 层放一次大的」的节奏
      nextAura: null,
    };
  }

  return {
    ...base,
    applied: true,
    stacks,
    power: Math.max(appliedPower, prevAura?.power ?? 0),
    nextAura: {
      element,
      stacks,
      power: Math.max(appliedPower, prevAura?.power ?? 0),
      expiresAt: now + ELEMENTS.AURA_DURATION * modOf(mods, "statusDurationMult"),
    },
  };
}

/**
 * 把预演结果 + 最终伤害翻译成效果指令与事件。
 *
 * @param {object} plan previewElement() 的返回值
 * @param {object} params
 * @param {number} params.damage 本次命中的最终伤害，用于换算 DoT / 爆炸 / 弹跳
 * @returns {{ effects: object[], events: object[] }}
 */
export function elementEffects(plan, { damage = 0, target = null, position = null, now = 0, mods = {}, sourceId = null } = {}) {
  const effects = [];
  const events = [];
  if (!plan) return { effects, events };

  const targetId = target?.id ?? null;
  const at = position ?? (target && typeof target.x === "number" ? { x: target.x, y: target.y } : { x: 0, y: 0 });
  const durationMult = modOf(mods, "statusDurationMult");
  const reactionScale = modOf(mods, "reactionMult");

  // 附着写入（含反应 / 饱和后的清空）
  if (plan.nextAura !== plan.prevAura && targetId != null) {
    effects.push(
      plan.nextAura
        ? auraEffect({ targetId, element: plan.nextAura.element, stacks: plan.nextAura.stacks, power: plan.nextAura.power, expiresAt: plan.nextAura.expiresAt })
        : auraEffect({ targetId, element: null, stacks: 0, power: 0, expiresAt: null }),
    );
    if (plan.nextAura) {
      events.push(auraEvent({ targetId, element: plan.nextAura.element, stacks: plan.nextAura.stacks }));
    }
  }

  if (plan.reaction) {
    events.push(reactionEvent({ targetId, reaction: plan.reaction, label: REACTION_LABEL[plan.reaction], incoming: plan.element, consumed: plan.prevAura?.element ?? null, damage }));
    effects.push(feedbackEffect({ kind: FEEDBACK.FLOATER, text: REACTION_LABEL[plan.reaction], tone: plan.reaction, intensity: 1, at, targetId }));

    // 属性流 4 人羁绊：每次元素反应全队回能
    const energy = modOf(mods, "energyOnReaction");
    if (energy > 0) effects.push(energyEffect({ scope: PARTY_SCOPE.TEAM, amount: energy, source: sourceId }));

    if (plan.reaction === REACTION.VAPORIZE) {
      // 蒸发移除冻结
      effects.push(clearStatusEffect({ targetId, status: STATUS.FREEZE, reason: REACTION.VAPORIZE }));
    } else if (plan.reaction === REACTION.SUPERCONDUCT) {
      effects.push(
        statusEffect({
          targetId,
          status: STATUS.ARMOR_BREAK,
          duration: ELEMENTS.SUPERCONDUCT.duration * durationMult,
          potency: ELEMENTS.SUPERCONDUCT.armorShred,
          source: sourceId,
        }),
      );
    } else if (plan.reaction === REACTION.OVERLOAD) {
      effects.push(
        explosionEffect({
          x: at.x,
          y: at.y,
          radius: ELEMENTS.OVERLOAD.radius,
          damage: damage * ELEMENTS.OVERLOAD.ratio * reactionScale,
          element: ELEMENT.FIRE,
          kind: REACTION.OVERLOAD,
          sourceId,
          excludeIds: targetId != null ? [targetId] : [],
        }),
      );
      effects.push(feedbackEffect({ kind: FEEDBACK.SHAKE, intensity: 0.6, duration: 0.18, at, targetId }));
    }
    return { effects, events };
  }

  if (plan.saturated) {
    events.push(saturateEvent({ targetId, element: plan.element, status: plan.saturated, stacks: plan.stacks }));

    if (plan.saturated === STATUS.BURN) {
      const burn = ELEMENTS.BURN;
      effects.push(
        statusEffect({
          targetId,
          status: STATUS.BURN,
          duration: burn.duration * durationMult,
          interval: burn.interval,
          potency: Math.max(1, damage * burn.ratio),
          source: sourceId,
          meta: { element: ELEMENT.FIRE },
        }),
      );
    } else if (plan.saturated === STATUS.FREEZE) {
      effects.push(
        statusEffect({
          targetId,
          status: STATUS.FREEZE,
          duration: ELEMENTS.FREEZE.duration * durationMult,
          potency: ELEMENTS.FREEZE.damageTakenMult,
          source: sourceId,
          meta: { element: ELEMENT.ICE },
        }),
      );
    } else if (plan.saturated === STATUS.SHOCK) {
      const shock = ELEMENTS.SHOCK;
      effects.push(
        statusEffect({ targetId, status: STATUS.SHOCK, duration: shock.duration * durationMult, potency: 1, source: sourceId, meta: { element: ELEMENT.THUNDER } }),
      );
      effects.push(
        chainEffect({
          fromId: targetId,
          x: at.x,
          y: at.y,
          hops: shock.hops,
          damage: damage * shock.ratio,
          element: ELEMENT.THUNDER,
          falloff: shock.falloff,
          radius: shock.radius,
          excludeIds: targetId != null ? [targetId] : [],
        }),
      );
    }
    effects.push(feedbackEffect({ kind: FEEDBACK.ELEMENT_BURST, tone: plan.element, intensity: 0.8, at, targetId }));
  }

  return { effects, events };
}

/** 预演 + 生成指令的一步式封装，供已知伤害的场景（技能、DoT）使用。 */
export function resolveElement(params = {}) {
  const plan = previewElement(params);
  const { effects, events } = elementEffects(plan, params);
  return { ...plan, effects, events };
}
