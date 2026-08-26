/**
 * 命中结算入口。
 *
 * `resolveHit(egg, target, ctx)` 是整个战斗层唯一的对外结算函数：
 * 纯函数、不改入参、不碰 DOM、不碰物理世界，只返回
 * `{ damage, effects, comboDelta, events }`（外加一批便于 HUD / 单测的附加字段）。
 *
 * 调用方拿到结果后自行决定：扣血、播特效、把 effects 分发给各层。
 *
 * 对外契约（缺字段的蛋也必须满足）：
 * - `damage`：有限的非负整数；蛋显式写了 0 威力就是 0 伤害，什么都没写才吃默认威力
 * - `effects`：恒为数组，元素是效果指令；一次普通命中至少带一条飘字指令，不会是空数组。
 *   数组按 combat → physics → party → presentation 稳定分段（见 effects.js 的指令契约），
 *   调用方可以直接 `splitEffects()` 分流，或对尾部的表现层指令 `presentationPlan()` 折叠成一帧计划
 * - `comboDelta`：有限数；普通命中 +1（叠层羁绊更多），爆蛋时刻为负（清零或保留部分层数）
 * - `events`：恒为数组
 */

import { COMBO, ELEMENT } from "./constants.js";
import { BURST_BUFF_ID, advanceCombo, burstEffects, burstHitEffects, comboGain, isBurstActive, planCombo } from "./combo.js";
import { applyShield, computeDamage, eggElement, eggSchool } from "./damage.js";
import { elementEffects, previewElement } from "./elements.js";
import { FEEDBACK, feedbackEffect, sortEffects } from "./effects.js";
import { blockedEvent, critEvent, hitEvent, killEvent, shieldAbsorbEvent } from "./events.js";
import { bondModsFrom } from "./bonds.js";
import { mergeMods, modOf, modsFromBuffs } from "./modifiers.js";
import { rngFrom } from "./rng.js";
import { SCHOOL_MODIFIER } from "./constants.js";
import { applyEffects } from "./state.js";

/** 把 ctx 里所有修正来源合并成一张表。 */
export function resolveMods(ctx = {}, now = ctx.now ?? 0) {
  return mergeMods(bondModsFrom(ctx), modsFromBuffs(ctx.buffs ?? [], now), ctx.mods ?? null);
}

/** 命中点：优先显式传入，其次目标坐标，最后蛋坐标。 */
function hitPointOf(egg, target, ctx) {
  if (ctx.hitPoint && typeof ctx.hitPoint.x === "number") return { x: ctx.hitPoint.x, y: ctx.hitPoint.y };
  if (target && typeof target.x === "number") return { x: target.x, y: target.y ?? 0 };
  if (egg && typeof egg.x === "number") return { x: egg.x, y: egg.y ?? 0 };
  return { x: 0, y: 0 };
}

/** 爆蛋窗口倍率。若窗口增益已经在 ctx.buffs 里，就不重复乘一次。 */
function burstMultiplier(ctx, mods, now) {
  const buffed = (ctx.buffs ?? []).some((b) => b?.id === BURST_BUFF_ID && (b.expiresAt == null || b.expiresAt > now));
  if (buffed) return 1;
  return isBurstActive({ burstUntil: ctx.burstUntil ?? 0 }, now) ? COMBO.BURST_DAMAGE_MULT * modOf(mods, "burstDamageMult") : 1;
}

/** 本次命中的基础连击叠层。辅助 / 直殴主蛋不叠层的规则来自流派表。 */
function comboGainOf(egg, ctx) {
  if (typeof ctx.comboGain === "number") return ctx.comboGain;
  if (egg?.noCombo) return 0;
  const school = eggSchool(egg, ctx);
  const fromSchool = SCHOOL_MODIFIER[school]?.comboGain;
  // 只有连击流才有额外规则；其余流派仍按基础 1 层叠加
  return school === "combo" ? 1 + (fromSchool ?? 0) : 1;
}

/**
 * 结算一次命中。
 *
 * @param {object} egg 蛋 { power|damage|atk, element, school, critChance, critMult, collisions, forceCrit, ... }
 * @param {object} target 目标 { id, hp, armor, resist, shield, statuses, x, y }
 * @param {object} [ctx] 上下文
 *   { now, combo, burstUntil, auras, statuses, buffs, team|bonds, mods, hero, seed, rng, hitIndex, hitPoint }
 * @returns {{
 *   damage:number, effects:object[], comboDelta:number, events:object[],
 *   crit:boolean, element:string, reaction:string|null, saturated:string|null,
 *   combo:number, comboBefore:number, burst:boolean, killed:boolean,
 *   hpAfter:number, absorbed:number, overkill:number, breakdown:object
 * }}
 */
export function resolveHit(egg = {}, target = {}, ctx = {}) {
  const now = ctx.now ?? 0;
  const mods = resolveMods(ctx, now);
  const at = hitPointOf(egg, target, ctx);
  const sourceId = egg?.ownerId ?? ctx.hero?.id ?? ctx.caster?.id ?? null;
  const targetId = target?.id ?? null;
  const comboBefore = Number.isFinite(ctx.combo) ? Math.max(0, Math.floor(ctx.combo)) : 0;
  const element = eggElement(egg, ctx);

  // 无敌 / 已死目标：不结算伤害，也不叠连击
  if (target?.invulnerable || (typeof target?.hp === "number" && target.hp <= 0)) {
    return {
      damage: 0,
      effects: [],
      comboDelta: 0,
      events: [blockedEvent({ targetId, sourceId, reason: target?.invulnerable ? "invulnerable" : "dead" })],
      crit: false,
      element,
      reaction: null,
      saturated: null,
      combo: comboBefore,
      comboBefore,
      burst: false,
      killed: false,
      hpAfter: target?.hp ?? 0,
      absorbed: 0,
      overkill: 0,
      breakdown: null,
    };
  }

  // 1. 元素预演：先拿到反应倍率，饱和效果稍后按最终伤害换算
  const plan = previewElement({ element, power: egg?.elementPower ?? 1, target, ctx, now, mods });

  // 2. 伤害管线
  const rng = rngFrom(ctx, egg?.id ?? "egg", targetId ?? "target", ctx.hitIndex ?? 0, comboBefore);
  const burstMult = burstMultiplier(ctx, mods, now);
  const dmg = computeDamage({
    egg,
    target,
    ctx,
    mods,
    comboStacks: comboBefore,
    reactionMult: plan.damageMult,
    burstMult,
    element,
    rng,
    now,
  });

  // 3. 护盾吸收
  const shield = applyShield(dmg.amount, target, ctx);
  const hp = typeof target?.hp === "number" ? target.hp : Infinity;
  const hpAfter = hp - shield.hpDamage;
  const killed = Number.isFinite(hp) && hpAfter <= 0;

  // 4. 连击与爆蛋时刻
  const plannedCombo = planCombo({ combo: comboBefore, gain: comboGainOf(egg, ctx), mods });

  // 5. 汇总指令与事件
  const effects = [];
  const events = [];

  const elemental = elementEffects(plan, { damage: dmg.amount, target, position: at, now, mods, sourceId });
  effects.push(...elemental.effects);
  events.push(...elemental.events);

  if (plannedCombo.burst) {
    const burst = burstEffects({ damage: dmg.amount, at, mods, sourceId, targetId, element, now, kept: plannedCombo.kept ?? 0 });
    effects.push(...burst.effects);
    events.push(...burst.events);
  } else if (burstMult > 1 || isBurstActive({ burstUntil: ctx.burstUntil ?? 0 }, now)) {
    effects.push(...burstHitEffects({ damage: dmg.amount, at, element, sourceId, targetId }));
  }

  effects.push(
    feedbackEffect({ kind: FEEDBACK.FLOATER, text: String(dmg.amount), tone: dmg.crit ? "crit" : element, intensity: dmg.crit ? 1.2 : 0.7, at, targetId }),
  );
  if (dmg.crit) effects.push(feedbackEffect({ kind: FEEDBACK.HITSTOP, duration: 0.03, intensity: 0.6, at, targetId }));

  events.push(
    hitEvent({
      targetId,
      sourceId,
      damage: dmg.amount,
      element,
      crit: dmg.crit,
      combo: plannedCombo.after,
      reaction: plan.reaction,
      at,
    }),
  );
  if (dmg.crit) events.push(critEvent({ targetId, sourceId, damage: dmg.amount, multiplier: dmg.critMult }));
  if (shield.absorbed > 0) events.push(shieldAbsorbEvent({ targetId, absorbed: shield.absorbed, left: shield.shieldLeft }));
  events.push(comboGain(plannedCombo, { targetId }));
  if (killed) events.push(killEvent({ targetId, sourceId, overkill: -hpAfter, element }));

  return {
    damage: dmg.amount,
    // 分段排序放在最后一步：产出侧只管按语义 push，消费侧永远拿到同一种顺序
    effects: sortEffects(effects),
    // 普通命中恒为 +1（叠层羁绊会更多）；爆蛋时刻是负数（清零 / 保留部分层数），但一定是有限数
    comboDelta: Number.isFinite(plannedCombo.delta) ? plannedCombo.delta : 0,
    events,
    crit: dmg.crit,
    element,
    reaction: plan.reaction,
    saturated: plan.saturated,
    combo: plannedCombo.after,
    comboBefore,
    burst: plannedCombo.burst,
    burstActive: burstMult > 1,
    killed,
    hpAfter: Number.isFinite(hp) ? hpAfter : hp,
    absorbed: shield.absorbed,
    overkill: killed ? -hpAfter : 0,
    breakdown: dmg.breakdown,
  };
}

/**
 * 在战斗状态机上结算一次命中：自动读取附着 / 状态 / 连击，并把 combat 域指令写回。
 * 物理域与表现域指令通过 `pending` 交还调用方。
 *
 * @returns {{ state:object, result:object, pending:object[], events:object[], damage:object[] }}
 */
export function applyHit(state, egg, target, ctx = {}) {
  const now = ctx.now ?? state?.time ?? 0;
  const merged = {
    ...ctx,
    now,
    auras: ctx.auras ?? state?.auras ?? {},
    statuses: ctx.statuses ?? state?.statuses ?? {},
    buffs: ctx.buffs ?? state?.buffs ?? [],
    combo: ctx.combo ?? Math.floor(state?.combo?.value ?? 0),
    burstUntil: ctx.burstUntil ?? state?.combo?.burstUntil ?? 0,
  };

  const result = resolveHit(egg, target, merged);
  const applied = applyEffects(state, result.effects, now);

  const plan = { after: result.combo, reached: result.comboBefore + (result.burst ? 1 : Math.max(0, result.comboDelta)), burst: result.burst };
  const nextState = {
    ...applied.state,
    // 爆蛋指令已经在 applyEffects 里处理过连击清零，这里只同步非引爆情况
    combo: result.burst ? applied.state.combo : advanceCombo(applied.state.combo, plan, now),
    stats: {
      ...applied.state.stats,
      hits: (applied.state.stats?.hits ?? 0) + 1,
      crits: (applied.state.stats?.crits ?? 0) + (result.crit ? 1 : 0),
      reactions: (applied.state.stats?.reactions ?? 0) + (result.reaction ? 1 : 0),
      totalDamage: (applied.state.stats?.totalDamage ?? 0) + result.damage,
    },
  };

  return {
    state: nextState,
    result,
    pending: applied.pending,
    events: [...result.events, ...applied.events],
    damage: [{ targetId: target?.id ?? null, amount: result.damage, element: result.element, kind: "hit" }, ...applied.damage],
  };
}

/** 物理层无元素时的兜底常量，供调用方直接引用。 */
export const PHYSICAL = ELEMENT.PHYSICAL;
