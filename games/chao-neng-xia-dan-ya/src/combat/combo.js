/**
 * 连击与「爆蛋时刻」。
 *
 * GDD：短间隔命中叠 Combo，每层 +6% 暴伤，满 20 层触发爆蛋时刻。
 * 这里把连击拆成三个纯函数环节：
 * 1. `decayCombo()` —— 时间推进后的自然衰减
 * 2. `planCombo()`  —— 本次命中会叠到多少、是否引爆
 * 3. `burstEffects()` —— 引爆瞬间产出的指令（爆炸 + 增益窗口 + 表现）
 */

import { COMBO } from "./constants.js";
import { buffEffect, comboEffect, explosionEffect, feedbackEffect } from "./effects.js";
import { comboBreakEvent, comboBurstEvent, comboGainEvent } from "./events.js";
import { modOf } from "./modifiers.js";

/** 爆蛋时刻的增益 id，供 buff 表识别。 */
export const BURST_BUFF_ID = "combo_burst_moment";

/** 新建连击状态。 */
export function createCombo(now = 0) {
  return { value: 0, lastHitAt: now, peak: 0, bursts: 0, burstUntil: 0 };
}

/** 引爆所需层数（连击流 4 人羁绊会降低门槛）。 */
export function burstThreshold(mods = {}) {
  return Math.max(4, Math.round(COMBO.MAX + modOf(mods, "burstThresholdDelta")));
}

/** 爆蛋窗口是否生效。 */
export function isBurstActive(state = {}, now = 0) {
  const until = state.burstUntil ?? state.comboBurstUntil ?? 0;
  return until > now;
}

/**
 * 时间推进后的连击值。窗口内不衰减，窗口外按速率线性掉层。
 * 爆蛋窗口内完全不衰减（GDD 的「连击不衰减」类效果同理走 comboDecayMult）。
 */
export function decayCombo(state = {}, now = 0, mods = {}) {
  const value = state.value ?? 0;
  if (value <= 0) return 0;
  if (isBurstActive(state, now)) return value;
  const decayMult = Math.max(0.05, modOf(mods, "comboDecayMult"));
  const holdWindow = COMBO.WINDOW / decayMult + Math.max(0, modOf(mods, "comboWindowBonus"));
  const idle = now - (state.lastHitAt ?? now);
  if (idle <= holdWindow) return value;
  const lost = (idle - holdWindow) * COMBO.DECAY_PER_SEC * decayMult;
  return Math.max(0, value - lost);
}

/** 连击层数换算成结算加成。 */
export function comboBonuses(stacks = 0, mods = {}) {
  const n = Number.isFinite(stacks) ? Math.max(0, stacks) : 0;
  const highStacks = n >= COMBO.CRIT_BONUS_STACKS ? modOf(mods, "critChanceAt10") : 0;
  return {
    damageMult: (1 + n * COMBO.DAMAGE_PER_STACK) * modOf(mods, "comboDamageMult"),
    critChance: n * COMBO.CRIT_CHANCE_PER_STACK + highStacks,
    critDmg: n * (COMBO.CRIT_DMG_PER_STACK + modOf(mods, "comboCritDmgPerStack")),
  };
}

/** 爆蛋后保留的连击层数（连击流 4 人羁绊）。 */
export function keptStacks(reached = 0, mods = {}) {
  const pct = Math.min(1, Math.max(0, modOf(mods, "burstKeepStacksPct")));
  return pct > 0 ? Math.floor(Math.max(0, reached) * pct) : 0;
}

/**
 * 计算本次命中的连击变化。
 *
 * @param {object} params
 * @param {number} params.combo 命中前的连击层数
 * @param {number} [params.gain] 基础叠层（默认 1）
 * @param {object} [params.mods] 羁绊 / 增益修正
 * @returns {{ before:number, gain:number, after:number, delta:number, burst:boolean, threshold:number }}
 */
export function planCombo({ combo = 0, gain = 1, mods = {} } = {}) {
  const before = Number.isFinite(combo) ? Math.max(0, Math.floor(combo)) : 0;
  const threshold = burstThreshold(mods);
  const raw = (gain + modOf(mods, "comboGain")) * modOf(mods, "comboGainMult");
  const applied = gain <= 0 ? 0 : Math.max(1, Math.round(raw));
  const reached = before + applied;

  if (applied > 0 && reached >= threshold) {
    // 引爆：连击清零（连击流 4 人羁绊可保留一部分层数），进入爆蛋窗口
    const kept = keptStacks(reached, mods);
    return { before, gain: applied, after: kept, delta: kept - before, burst: true, threshold, reached, kept };
  }
  return { before, gain: applied, after: reached, delta: reached - before, burst: false, threshold, reached };
}

/**
 * 爆蛋时刻产出的指令。
 *
 * @param {object} params
 * @param {number} params.damage 触发爆蛋的那一击伤害，用作爆炸基数
 * @param {number} [params.kept] 引爆后保留的连击层数（`planCombo().kept`）
 */
export function burstEffects({ damage = 0, at = { x: 0, y: 0 }, mods = {}, sourceId = null, targetId = null, element = "physical", now = 0, kept = 0 } = {}) {
  const burstMult = modOf(mods, "burstDamageMult");
  const duration = COMBO.BURST_DURATION;
  const effects = [
    comboEffect({ op: "burst", value: kept, duration, source: sourceId }),
    buffEffect({
      id: BURST_BUFF_ID,
      scope: "team",
      duration,
      mods: { damageMult: COMBO.BURST_DAMAGE_MULT * burstMult, comboDecayMult: 0 },
      source: sourceId,
    }),
    explosionEffect({
      x: at.x,
      y: at.y,
      radius: COMBO.BURST_RADIUS,
      damage: damage * COMBO.BURST_RATIO * burstMult,
      element,
      kind: "combo_burst",
      sourceId,
    }),
    feedbackEffect({ kind: "hitstop", duration: 0.12, intensity: 1, at }),
    feedbackEffect({ kind: "shake", duration: 0.35, intensity: 1.4, at }),
    feedbackEffect({ kind: "floater", text: "爆蛋时刻!", tone: "burst", intensity: 1.4, at }),
  ];
  const events = [comboBurstEvent({ targetId, sourceId, threshold: burstThreshold(mods), duration, expiresAt: now + duration, damage: damage * COMBO.BURST_RATIO * burstMult })];
  return { effects, events };
}

/** 爆蛋窗口内每次命中附带的小爆炸。 */
export function burstHitEffects({ damage = 0, at = { x: 0, y: 0 }, element = "physical", sourceId = null, targetId = null } = {}) {
  return [
    explosionEffect({
      x: at.x,
      y: at.y,
      radius: COMBO.BURST_HIT_RADIUS,
      damage: damage * COMBO.BURST_HIT_RATIO,
      element,
      kind: "burst_echo",
      sourceId,
      excludeIds: targetId != null ? [targetId] : [],
    }),
  ];
}

/**
 * 应用一次连击变化，返回新的连击状态（不修改入参）。
 */
export function advanceCombo(state = createCombo(), plan, now = 0) {
  const next = {
    value: plan.after,
    lastHitAt: now,
    peak: Math.max(state.peak ?? 0, plan.reached ?? plan.after),
    bursts: (state.bursts ?? 0) + (plan.burst ? 1 : 0),
    burstUntil: plan.burst ? now + COMBO.BURST_DURATION : (state.burstUntil ?? 0),
  };
  return next;
}

/** 连击中断（蛋回收 / 空放）。 */
export function breakCombo(state = createCombo(), now = 0, reason = "recycle") {
  return {
    state: { ...state, value: 0, lastHitAt: now },
    events: (state.value ?? 0) > 0 ? [comboBreakEvent({ from: state.value, reason })] : [],
  };
}

/** 连击增长事件（供 HUD 升调音效）。 */
export function comboGain(plan, extra = {}) {
  return comboGainEvent({ from: plan.before, to: plan.after, gain: plan.gain, threshold: plan.threshold, burst: plan.burst, ...extra });
}
