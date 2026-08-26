/**
 * 战斗状态机（纯函数 reducer）。
 *
 * 只负责 combat 域的账本：元素附着、状态（灼烧/冻结/感电/破甲）、限时增益、连击。
 * 物理域（spawn_egg / egg_patch / field）、队伍域（heal / shield / energy）、
 * 表现域（feedback）的指令一律原样放进 `pending`，交给对应模块执行——
 * 战斗层不越界改物理，也不碰 DOM。
 *
 * 所有函数返回新对象，不修改入参。
 */

import { COMBO, ELEMENT, STATUS } from "./constants.js";
import { advanceCombo, createCombo, decayCombo, planCombo } from "./combo.js";
import { EFFECT, damageEffect } from "./effects.js";
import { statusEndEvent, statusTickEvent } from "./events.js";
import { modsFromBuffs } from "./modifiers.js";

/** 新建战斗状态。 */
export function createCombatState(init = {}) {
  return {
    time: init.time ?? 0,
    auras: { ...(init.auras ?? {}) },
    statuses: { ...(init.statuses ?? {}) },
    buffs: [...(init.buffs ?? [])],
    combo: { ...createCombo(init.time ?? 0), ...(init.combo ?? {}) },
    stats: { totalDamage: 0, hits: 0, crits: 0, reactions: 0, bursts: 0, ...(init.stats ?? {}) },
  };
}

function withStatus(statuses, targetId, status, entry) {
  const forTarget = { ...(statuses[targetId] ?? {}) };
  if (entry === null) delete forTarget[status];
  else forTarget[status] = entry;
  const next = { ...statuses };
  if (Object.keys(forTarget).length === 0) delete next[targetId];
  else next[targetId] = forTarget;
  return next;
}

/** 可叠层的状态；其余状态重复施加只刷新时长与强度。 */
const STACKABLE = new Set([STATUS.VULNERABLE]);

function mergeStatus(prev, fx, now) {
  const duration = fx.duration ?? 0;
  const expiresAt = duration > 0 ? now + duration : null;
  if (!prev) {
    return {
      status: fx.status,
      potency: fx.potency ?? 1,
      stacks: fx.stacks ?? 1,
      interval: fx.interval ?? 0,
      nextTickAt: (fx.interval ?? 0) > 0 ? now + fx.interval : null,
      expiresAt,
      source: fx.source ?? null,
      meta: fx.meta ?? null,
    };
  }
  return {
    ...prev,
    // 刷新：取更强的强度与更晚的到期；只有可叠层状态才累加层数
    potency: Math.max(prev.potency ?? 0, fx.potency ?? 1),
    stacks: STACKABLE.has(fx.status)
      ? Math.min(9, (prev.stacks ?? 1) + (fx.stacks ?? 1))
      : Math.max(prev.stacks ?? 1, fx.stacks ?? 1),
    interval: fx.interval ?? prev.interval ?? 0,
    nextTickAt: prev.nextTickAt ?? ((fx.interval ?? 0) > 0 ? now + fx.interval : null),
    expiresAt: expiresAt == null || prev.expiresAt == null ? expiresAt ?? prev.expiresAt : Math.max(prev.expiresAt, expiresAt),
    meta: fx.meta ?? prev.meta ?? null,
  };
}

/**
 * 应用一批效果指令。
 *
 * @returns {{ state:object, events:object[], pending:object[], damage:object[] }}
 *   `pending` 是本层不负责执行、需要交给物理 / 队伍 / 表现层的指令。
 */
export function applyEffects(state, effects = [], now = state?.time ?? 0) {
  let next = { ...state, auras: { ...state.auras }, statuses: { ...state.statuses }, buffs: [...state.buffs], combo: { ...state.combo } };
  const events = [];
  const pending = [];
  const damage = [];

  for (const fx of effects) {
    if (!fx || typeof fx !== "object") continue;

    switch (fx.type) {
      case EFFECT.AURA: {
        if (fx.targetId == null) break;
        if (!fx.element || !(fx.stacks > 0)) {
          const auras = { ...next.auras };
          delete auras[fx.targetId];
          next.auras = auras;
        } else {
          next.auras = { ...next.auras, [fx.targetId]: { element: fx.element, stacks: fx.stacks, power: fx.power ?? 1, expiresAt: fx.expiresAt ?? null } };
        }
        break;
      }
      case EFFECT.STATUS: {
        if (fx.targetId == null || !fx.status) break;
        const prev = next.statuses[fx.targetId]?.[fx.status] ?? null;
        next.statuses = withStatus(next.statuses, fx.targetId, fx.status, mergeStatus(prev, fx, now));
        break;
      }
      case EFFECT.CLEAR_STATUS: {
        if (fx.targetId == null || !fx.status) break;
        if (next.statuses[fx.targetId]?.[fx.status]) {
          next.statuses = withStatus(next.statuses, fx.targetId, fx.status, null);
          events.push(statusEndEvent({ targetId: fx.targetId, status: fx.status, reason: fx.reason ?? "cleared" }));
        }
        break;
      }
      case EFFECT.BUFF: {
        const expiresAt = (fx.duration ?? 0) > 0 ? now + fx.duration : null;
        const idx = next.buffs.findIndex((b) => b.id === fx.id && b.targetId === (fx.targetId ?? null));
        const entry = { id: fx.id, scope: fx.scope ?? "team", targetId: fx.targetId ?? null, mods: { ...(fx.mods ?? {}) }, stacks: fx.stacks ?? 1, expiresAt, source: fx.source ?? null };
        if (idx >= 0) next.buffs = next.buffs.map((b, i) => (i === idx ? { ...entry, stacks: Math.max(b.stacks ?? 1, entry.stacks) } : b));
        else next.buffs = [...next.buffs, entry];
        break;
      }
      case EFFECT.COMBO: {
        if (fx.op === "burst") {
          // value = 引爆后保留的层数，默认清零；连击流 4 人羁绊会留一部分
          const kept = Math.max(0, Math.floor(fx.value ?? 0));
          next.combo = { ...next.combo, value: kept, lastHitAt: now, bursts: (next.combo.bursts ?? 0) + 1, burstUntil: now + (fx.duration || COMBO.BURST_DURATION) };
          next.stats = { ...next.stats, bursts: (next.stats?.bursts ?? 0) + 1 };
        } else if (fx.op === "reset") {
          next.combo = { ...next.combo, value: 0, lastHitAt: now };
        } else if (fx.op === "set") {
          next.combo = { ...next.combo, value: Math.max(0, fx.value), lastHitAt: now };
        } else if (fx.op === "add") {
          const plan = planCombo({ combo: next.combo.value, gain: fx.value, mods: activeMods(next, now) });
          next.combo = advanceCombo(next.combo, plan, now);
        } else if (fx.op === "hold") {
          next.combo = { ...next.combo, lastHitAt: now + (fx.duration ?? 0) };
        }
        break;
      }
      case EFFECT.DAMAGE: {
        damage.push({ targetId: fx.targetId, amount: fx.amount, element: fx.element, kind: fx.kind });
        next.stats = { ...next.stats, totalDamage: (next.stats?.totalDamage ?? 0) + (fx.amount ?? 0) };
        break;
      }
      default:
        pending.push(fx);
    }
  }

  return { state: next, events, pending, damage };
}

/** 当前生效的增益修正（爆蛋窗口、光环、临时 BUFF）。 */
export function activeMods(state, now = state?.time ?? 0) {
  return modsFromBuffs(state?.buffs ?? [], now);
}

/**
 * 推进战斗时间：过期清理 + DoT 结算 + 连击衰减。
 *
 * @returns {{ state:object, events:object[], effects:object[], damage:object[] }}
 *   `effects` 是本次 tick 产出的直接伤害指令（灼烧跳伤），由模式层扣血。
 */
export function tickCombat(state, dt = 0) {
  const now = (state?.time ?? 0) + dt;
  const events = [];
  const damage = [];

  const auras = {};
  for (const [id, aura] of Object.entries(state.auras ?? {})) {
    if (aura?.expiresAt != null && aura.expiresAt <= now) continue;
    auras[id] = aura;
  }

  const statuses = {};
  for (const [id, table] of Object.entries(state.statuses ?? {})) {
    const kept = {};
    for (const [key, entry] of Object.entries(table ?? {})) {
      if (entry?.expiresAt != null && entry.expiresAt <= now) {
        events.push(statusEndEvent({ targetId: id, status: key, reason: "expired" }));
        continue;
      }
      let current = entry;
      if ((current.interval ?? 0) > 0 && current.nextTickAt != null) {
        let ticks = 0;
        let nextTickAt = current.nextTickAt;
        while (nextTickAt <= now && (current.expiresAt == null || nextTickAt <= current.expiresAt) && ticks < 64) {
          ticks += 1;
          nextTickAt += current.interval;
        }
        if (ticks > 0) {
          const amount = Math.max(1, Math.round((current.potency ?? 0) * ticks));
          damage.push({ targetId: id, amount, element: current.meta?.element ?? ELEMENT.FIRE, kind: key === STATUS.BURN ? "burn" : "dot" });
          events.push(statusTickEvent({ targetId: id, status: key, amount, ticks }));
          current = { ...current, nextTickAt };
        }
      }
      kept[key] = current;
    }
    if (Object.keys(kept).length) statuses[id] = kept;
  }

  const buffs = (state.buffs ?? []).filter((b) => b.expiresAt == null || b.expiresAt > now);
  const comboValue = decayCombo(state.combo ?? createCombo(now), now, modsFromBuffs(buffs, now));

  const next = {
    ...state,
    time: now,
    auras,
    statuses,
    buffs,
    combo: { ...state.combo, value: comboValue, burstUntil: (state.combo?.burstUntil ?? 0) > now ? state.combo.burstUntil : 0 },
    stats: { ...state.stats, totalDamage: (state.stats?.totalDamage ?? 0) + damage.reduce((s, d) => s + d.amount, 0) },
  };

  return {
    state: next,
    events,
    damage,
    effects: damage.map((d) => damageEffect({ targetId: d.targetId, amount: d.amount, element: d.element, kind: d.kind })),
  };
}

/** 把战斗状态折叠成 resolveHit 需要的只读上下文片段。 */
export function contextFromState(state, extra = {}) {
  return {
    now: state?.time ?? 0,
    auras: state?.auras ?? {},
    statuses: state?.statuses ?? {},
    combo: Math.floor(state?.combo?.value ?? 0),
    burstUntil: state?.combo?.burstUntil ?? 0,
    buffs: state?.buffs ?? [],
    ...extra,
  };
}
