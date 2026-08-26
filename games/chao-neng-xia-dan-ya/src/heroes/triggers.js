/**
 * 技能触发器派发（Opus-3 所有权）。
 *
 * 战斗层在关键时机调用 `dispatchTrigger(squad, TRIGGERS.X, event)`，
 * 这里负责条件判定、冷却 / 每回合限一次、层数累积与能量入账，
 * 返回一组声明式效果交给 `src/combat` 执行。英雄层不直接改世界。
 */
import { EFFECTS, TRIGGERS } from "./constants.js";
import { addStack, gainEnergy, spendEnergy, tickTurn, ultimateCost } from "./runtime.js";

/** 各触发时机的能量收益系数（乘以英雄 energyGain）。 */
export const ENERGY_GAIN_RATE = {
  [TRIGGERS.HIT]: 1,
  [TRIGGERS.BRICK_BREAK]: 0.5,
  [TRIGGERS.PEG_HIT]: 0.2,
  [TRIGGERS.KILL]: 1.5,
  [TRIGGERS.EGG_RECYCLED]: 0.4,
  [TRIGGERS.TURN_END]: 0.6,
};

/** 触发者获得全额能量，替补按此比例分摊。 */
export const BENCH_ENERGY_SHARE = 0.35;

function isSkipped(instance, trigger) {
  if (!instance?.alive) return true;
  if (instance.cooldown > 0) return true;
  if (instance.skill?.oncePerTurn && instance.turn.fired[trigger]) return true;
  return false;
}

function adjustEvent(instance, trigger, event) {
  if (trigger !== TRIGGERS.COMBO) return event;
  const shift = instance.skillMods?.comboThreshold ?? 0;
  if (!shift) return event;
  return { ...event, combo: (event.combo ?? 0) - shift };
}

/** 把 stack 型效果换算成实际层数与总量。 */
function applyStacking(instance, effect) {
  if (!effect?.stack) return effect;
  const key = effect.stat ?? effect.key ?? effect.kind;
  const max = Number(effect.maxStacks) || Infinity;
  const stacks = addStack(instance, key, max);
  const out = { ...effect, stacks };
  if (typeof effect.mul === "number") out.totalMul = round4(effect.mul * stacks);
  if (typeof effect.value === "number") out.totalValue = round4(effect.value * stacks);
  return out;
}

function decorate(instance, effects) {
  return (effects ?? [])
    .filter(Boolean)
    .map((effect) => applyStacking(instance, { ...effect }))
    .map((effect) => ({ ...effect, source: instance.uid, heroId: instance.id }));
}

/**
 * 派发一次触发器。
 * @returns {{trigger: string, effects: object[], entries: object[], energy: object[]}}
 */
export function dispatchTrigger(squad, trigger, event = {}, ctx = {}) {
  const result = { trigger, effects: [], entries: [], energy: [] };
  if (!squad?.members?.length || trigger === TRIGGERS.AURA) return result;

  const runtimeCtx = { squad, rng: ctx.rng ?? Math.random, ...ctx };

  for (const instance of squad.members) {
    const skill = instance.skill;
    if (!skill || skill.trigger !== trigger) continue;
    if (isSkipped(instance, trigger)) continue;

    const evt = adjustEvent(instance, trigger, event);
    if (typeof skill.condition === "function" && !skill.condition(evt, instance, runtimeCtx)) {
      continue;
    }

    const effects = decorate(instance, skill.effects?.(evt, instance, runtimeCtx));
    if (skill.oncePerTurn) instance.turn.fired[trigger] = true;
    if (skill.cooldown) instance.cooldown = skill.cooldown;

    result.entries.push({
      uid: instance.uid,
      heroId: instance.id,
      heroName: instance.name,
      skillId: skill.id,
      skillName: skill.name,
      effects,
    });
    result.effects.push(...effects);
  }

  result.energy = awardEnergy(squad, trigger, event);
  return result;
}

/**
 * 能量入账。命中者拿全额，其余队友拿分摊，
 * 「返场」词条让小帅鸽自己也能吃到自己的能量。
 */
export function awardEnergy(squad, trigger, event = {}) {
  const rate = ENERGY_GAIN_RATE[trigger];
  if (!rate || !squad?.members?.length) return [];
  const activeUid = event.heroUid ?? squad.members[squad.active]?.uid;
  const log = [];

  for (const instance of squad.members) {
    if (!instance.alive) continue;
    const share = instance.uid === activeUid ? 1 : BENCH_ENERGY_SHARE;
    const gained = gainEnergy(instance, instance.stats.energyGain * rate * share);
    if (gained) log.push({ uid: instance.uid, gained: round2(gained), energy: round2(instance.energy) });
  }
  return log;
}

/** 大招是否可放，附带失败原因，便于 HUD 灰显与提示。 */
export function canCastUltimate(squad, target, event = {}) {
  const instance = resolveMember(squad, target);
  if (!instance) return { ok: false, code: "NO_HERO", reason: "英雄不在场" };
  const ult = instance.skill?.ult;
  if (!ult) return { ok: false, code: "NO_ULT", reason: "该英雄没有大招" };
  if (!instance.alive) return { ok: false, code: "DEAD", reason: "英雄已倒下" };

  const cost = ultimateCost(instance);
  if (instance.energy < cost) {
    return { ok: false, code: "NO_ENERGY", reason: "能量不足", cost, energy: instance.energy };
  }
  const needCombo = (ult.requiresCombo ?? 0) + (instance.skillMods?.comboThreshold ?? 0);
  if (needCombo > 0 && (event.combo ?? 0) < needCombo) {
    return { ok: false, code: "NO_COMBO", reason: `需要 ${needCombo} 层连击`, needCombo };
  }
  if (typeof ult.condition === "function" && !ult.condition(event, instance, { squad })) {
    return { ok: false, code: "CONDITION", reason: "释放条件未满足" };
  }
  return { ok: true, cost, instance, ult };
}

/** 释放大招：扣能量并返回效果。校验失败时不消耗任何资源。 */
export function castUltimate(squad, target, event = {}, ctx = {}) {
  const check = canCastUltimate(squad, target, event);
  if (!check.ok) return { ...check, effects: [] };

  const { instance, ult, cost } = check;
  spendEnergy(instance, cost);
  const effects = decorate(instance, ult.effects?.(event, instance, { squad, rng: ctx.rng ?? Math.random, ...ctx }));
  instance.log.push({ turn: squad.turn, skill: ult.name });

  return {
    ok: true,
    uid: instance.uid,
    heroId: instance.id,
    heroName: instance.name,
    skillName: ult.name,
    cost,
    energy: instance.energy,
    effects,
  };
}

function resolveMember(squad, target) {
  if (!squad?.members?.length) return null;
  if (target == null) return squad.members[squad.active] ?? null;
  if (typeof target === "number") return squad.members[target] ?? null;
  if (typeof target === "object") return target;
  return squad.byUid?.[target] ?? squad.byId?.[target] ?? null;
}

/** 战斗开局：派发 BATTLE_START 并把「开局能量」词条结算掉。 */
export function startBattle(squad, event = {}, ctx = {}) {
  if (!squad) return { trigger: TRIGGERS.BATTLE_START, effects: [], entries: [], energy: [] };
  squad.turn = 0;
  for (const instance of squad.members) {
    instance.turn = { fired: {}, stacks: {} };
    instance.cooldown = 0;
    const start = instance.skillMods?.startEnergy ?? 0;
    if (start) gainEnergy(instance, start);
  }
  return dispatchTrigger(squad, TRIGGERS.BATTLE_START, event, ctx);
}

/** 回合结束：先派发 TURN_END，再统一走回合切换清理。 */
export function endTurn(squad, event = {}, ctx = {}) {
  const result = dispatchTrigger(squad, TRIGGERS.TURN_END, event, ctx);
  if (squad) {
    squad.turn += 1;
    for (const instance of squad.members) tickTurn(instance);
  }
  return result;
}

/** 把一批效果按 kind 归类，方便战斗层分发给各子系统。 */
export function groupEffects(effects = []) {
  const groups = {};
  for (const key of Object.values(EFFECTS)) groups[key] = [];
  for (const effect of effects) {
    if (!groups[effect.kind]) groups[effect.kind] = [];
    groups[effect.kind].push(effect);
  }
  return groups;
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

function round4(n) {
  return Math.round(n * 1e4) / 1e4;
}
