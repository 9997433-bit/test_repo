// `src/combat/index.js` -> sim 契约的唯一适配层。ZERO three / DOM。
//
// combat 与 sim 有三处约定不一致，全部在这里收敛，别的文件不要再各自换算：
//
//  1. 朝向。sim 冻结 yaw=0 面向 -Z（见 math.js 的 FACE），combat 内部 yaw=0 面向 +Z。
//     进 combat 前把所有玩家 yaw 加 PI，出来时减回去；combat 自己改过的 yaw（疾风冲刺、
//     分身换位）按同样的相位差换算回来。
//  2. 命中结构。combat 返回 `{ id, impulse, ... }` 且**冲量已经写进目标速度**；
//     sim 的 applyHits 吃 `{ targetId, impulse, applied }`，applied=true 时不再重复施加。
//  3. 冷却与事件。出招时机由 sim 的 attack 状态机独占，进 combat 前清掉 combat 自己的
//     cd/busyUntil，避免两套冷却互相卡住；combat 推的事件先收进暂存区，翻译成 sim 事件形状
//     再进 state.events，顺便把碎地记账（brokenCount / stats）补上。

import * as combat from "../combat/index.js";
import { PHYSICS } from "./constants.js";
import { FACE, wrapAngle } from "./math.js";

/** `src/data/gloves.js` 的技能 id -> `src/combat/skills.js` 的 handler id */
export const SKILL_ALIAS = Object.freeze({
  quake_slam: "groundPound",
  wind_rush: "dashSlap",
  frost_arc: "frostArc",
  coil_counter: "parry",
  phantom_swap: "blinkSwap",
  iron_pull: "magnetPull",
  sky_fall: "meteorSlam",
});

export function combatSkillId(skillId) {
  if (!skillId) return "none";
  return SKILL_ALIAS[skillId] || skillId;
}

/** 让 combat 内部的 gloveTable 也看到真实数据（延迟觉醒等路径会用到） */
export function syncGloveTable(gloveById) {
  if (!gloveById) return combat.registerGloves(null);
  const mapped = {};
  for (const [id, g] of Object.entries(gloveById)) {
    mapped[id] = { ...g, skillId: combatSkillId(g.skillId) };
  }
  return combat.registerGloves(mapped);
}

function toCombatGlove(glove) {
  if (!glove || typeof glove !== "object") return glove;
  const skillId = combatSkillId(glove.skillId);
  return skillId === glove.skillId ? glove : { ...glove, skillId };
}

// ---------------------------------------------------------------- 调用包装

/** sim 独占出招时机：进 combat 前解开 combat 自己的冷却 / 硬直门槛 */
function unlockActor(actor) {
  if (!actor) return;
  if (!actor.cd || typeof actor.cd !== "object") actor.cd = { slapAt: 0, skillAt: 0 };
  actor.cd.slapAt = 0;
  actor.cd.skillAt = 0;
  actor.busyUntil = 0;
}

/**
 * 在 combat 的坐标 / 事件语境里跑一段逻辑。
 * yaw 用「记录移位后的值」的方式还原，没被 combat 改过的原样写回，避免每帧 wrap 累积浮点漂移。
 */
function inCombatFrame(state, fn) {
  state.t = state.time;
  const players = state.players;
  const before = [];
  for (const p of players) {
    before.push(p.yaw);
    p.yaw += FACE.combatOffset;
  }

  const simEvents = state.events;
  const scratch = [];
  state.events = scratch;

  let out;
  try {
    out = fn();
  } finally {
    state.events = simEvents;
    for (let i = 0; i < players.length; i++) {
      const p = players[i];
      const shifted = before[i] + FACE.combatOffset;
      p.yaw = p.yaw === shifted ? before[i] : wrapAngle(p.yaw - FACE.combatOffset);
    }
    digestEvents(state, scratch);
    syncPlayers(state);
  }
  return out;
}

/** combat 写在自己字段上的东西，同步到 sim 读的字段上 */
function syncPlayers(state) {
  for (const p of state.players) {
    if (Number.isFinite(p.knockbackT) && p.knockbackT > p.kbT) p.kbT = p.knockbackT;
    if (Number.isFinite(p.lastHitAt) && p.lastHitAt > p.lastHitT) p.lastHitT = p.lastHitAt;
  }
}

/** combat 事件形状 -> sim 事件形状；顺带补碎地记账 */
function digestEvents(state, list) {
  if (!list.length) return;
  for (const e of list) {
    switch (e.type) {
      case "tileBreak":
        creditTileBreak(state, e);
        break;
      case "awaken":
        push(state, { type: "awaken", id: e.playerId, gloveId: e.gloveId || null });
        break;
      case "awakenEnd":
        push(state, { type: "awakenEnd", id: e.playerId });
        break;
      case "parry":
        push(state, {
          type: "parry",
          id: e.parrierId,
          targetId: e.attackerId,
          power: e.power || 0,
        });
        break;
      case "meteorImpact":
        push(state, {
          type: "meteorImpact",
          id: e.attackerId,
          x: e.x,
          z: e.z,
          radius: e.radius,
        });
        break;
      case "ghostSlap":
        push(state, { type: "ghostSlap", id: e.attackerId, targetId: e.targetId });
        break;
      default:
        // slap / slapWhiff / skillHit / skillCast / kill / respawn：sim 自己已经发过等价事件
        break;
    }
  }
}

function push(state, ev) {
  if (state.events.length >= PHYSICS.maxEvents) return;
  ev.t = state.time;
  state.events.push(ev);
}

/** combat 直接把 tile.alive 置 false，brokenCount / stats / 事件得由这里补齐 */
function creditTileBreak(state, e) {
  // combat 的 tile 事件只带坐标（sim 的台块用 `i` 不用 `id`），按坐标回查
  const t = state.arena.tiles.find((q) => q.x === e.x && q.z === e.z);
  if (!t || t.counted) return;
  t.counted = true;
  t.alive = false;
  t.hp = 0;
  state.arena.brokenCount++;
  state.stats.tilesBroken++;
  push(state, { type: "tileBreak", i: t.i, x: t.x, z: t.z, hp: 0, maxHp: t.maxHp });
}

// ---------------------------------------------------------------- 命中转换

function toSimHits(raw) {
  const list = Array.isArray(raw) ? raw : Array.isArray(raw && raw.hits) ? raw.hits : [];
  const out = [];
  for (const h of list) {
    if (!h || !h.id) continue;
    if (h.parried) continue; // 被弹开：combat 已把冲量反打回攻击者，别再记一次受击
    const imp = h.impulse || { x: 0, y: 0, z: 0 };
    out.push({
      targetId: h.id,
      attackerId: h.attackerId || null,
      power: h.power || 0,
      impulse: { x: imp.x || 0, y: imp.y || 0, z: imp.z || 0 },
      applied: true,
      skillId: h.skillId || null,
    });
  }
  return out;
}

// ---------------------------------------------------------------- sim 契约

export function resolveSlap(state, attacker, glove, now) {
  return inCombatFrame(state, () => {
    unlockActor(attacker);
    const raw = combat.resolveSlap(state, attacker, toCombatGlove(glove), now);
    return { hits: toSimHits(raw) };
  });
}

export function resolveSkill(state, attacker, glove, now) {
  return inCombatFrame(state, () => {
    unlockActor(attacker);
    const res = combat.resolveSkill(state, attacker, toCombatGlove(glove), now);
    if (!res || res.ok === false) {
      return { ok: false, reason: (res && res.reason) || "no-skill", hits: [] };
    }
    return {
      ok: true,
      skillId: res.skillId,
      cooldown: res.cooldown,
      hits: toSimHits(res),
      selfImpulse: null,
    };
  });
}

/** 返回 combat 延迟结算（陨掌落地 / 疾风冲刺接触 / 残影假掌）的命中，交给 sim 记账 */
export function tickStatuses(state, dt) {
  return inCombatFrame(state, () => {
    const res = combat.tickStatuses(state, dt);
    return { hits: toSimHits(res) };
  });
}

export function applyAwaken(attacker, glove) {
  return combat.applyAwaken(attacker, toCombatGlove(glove));
}
