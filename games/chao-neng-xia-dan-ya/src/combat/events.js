/**
 * 战斗事件记录。
 *
 * 与 `effects` 的区别：effect 是「请执行」的指令，event 是「已发生」的事实。
 * 事件只做广播（core/events 总线 → HUD / 音频 / 统计），执行方不应据此改状态。
 */

export const EVENT = {
  HIT: "combat:hit",
  CRIT: "combat:crit",
  BLOCKED: "combat:blocked",
  SHIELD_ABSORB: "combat:shield-absorb",
  KILL: "combat:kill",
  AURA: "combat:aura",
  SATURATE: "combat:saturate",
  REACTION: "combat:reaction",
  COMBO_GAIN: "combat:combo-gain",
  COMBO_BREAK: "combat:combo-break",
  COMBO_BURST: "combat:combo-burst",
  STATUS_TICK: "combat:status-tick",
  STATUS_END: "combat:status-end",
  SKILL_CAST: "combat:skill-cast",
  SKILL_FAILED: "combat:skill-failed",
  BOND_ACTIVE: "combat:bond-active",
};

function event(type, payload) {
  return { type, ...payload };
}

export const hitEvent = (p) => event(EVENT.HIT, p);
export const critEvent = (p) => event(EVENT.CRIT, p);
export const blockedEvent = (p) => event(EVENT.BLOCKED, p);
export const shieldAbsorbEvent = (p) => event(EVENT.SHIELD_ABSORB, p);
export const killEvent = (p) => event(EVENT.KILL, p);
export const auraEvent = (p) => event(EVENT.AURA, p);
export const saturateEvent = (p) => event(EVENT.SATURATE, p);
export const reactionEvent = (p) => event(EVENT.REACTION, p);
export const comboGainEvent = (p) => event(EVENT.COMBO_GAIN, p);
export const comboBreakEvent = (p) => event(EVENT.COMBO_BREAK, p);
export const comboBurstEvent = (p) => event(EVENT.COMBO_BURST, p);
export const statusTickEvent = (p) => event(EVENT.STATUS_TICK, p);
export const statusEndEvent = (p) => event(EVENT.STATUS_END, p);
export const skillCastEvent = (p) => event(EVENT.SKILL_CAST, p);
export const skillFailedEvent = (p) => event(EVENT.SKILL_FAILED, p);
export const bondActiveEvent = (p) => event(EVENT.BOND_ACTIVE, p);
