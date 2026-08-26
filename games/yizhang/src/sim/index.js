// 异掌 · 模拟入口。ZERO import of three / DOM。
// 契约四件套：createMatch / step / getView / isMatchOver。

import { isSupported } from "./arena.js";
import { getDeps } from "./deps.js";
import { damageFloor } from "./floor.js";
import { decideMatch } from "./match.js";

export { createMatch, getPlayer, activeGlove, activeGloveId, respawnPlayer } from "./state.js";
export { step, applyHits, ZERO_INPUT } from "./step.js";
export { getView } from "./view.js";

// 依赖接线：默认就是真实 ../data/gloves.js + ../combat/index.js，install* 只给测试做替身
export { installData, installCombat, resetDeps, getDeps, resolveGlove } from "./deps.js";

// combat 同名转发，调用方不必知道 bridge 的存在
export function resolveSlap(state, attacker, glove, now) {
  return getDeps().combat.resolveSlap(state, attacker, glove, now);
}
export function resolveSkill(state, attacker, glove, now) {
  return getDeps().combat.resolveSkill(state, attacker, glove, now);
}
export function tickStatuses(state, dt) {
  return getDeps().combat.tickStatuses(state, dt);
}
export function applyAwaken(attacker, glove) {
  return getDeps().combat.applyAwaken(attacker, glove);
}

export { PHYSICS, ARENA, SIM_VERSION } from "./constants.js";
export { applyKnockback, statusMods } from "./physics.js";
export { createRngState, nextFloat, nextRange, nextU32 } from "./rng.js";
export { FACE, forwardX, forwardZ, rightX, rightZ, yawFromDir, wrapAngle } from "./math.js";
export { isSupported, tileAt, crackOf } from "./arena.js";
export { decideMatch, leaderOf } from "./match.js";

/** 生效中的对局常量与手套表（可能来自 ../data，也可能是 sim 兜底） */
export function getMatchConfig() {
  return { ...getDeps().MATCH };
}

export function getGloves() {
  return getDeps().GLOVES.map((g) => ({ ...g }));
}

/** 台面伤害入口，combat / 技能 / 测试都走这里（会发事件、计 stats） */
export function damageTileAt(state, x, z, amount) {
  return damageFloor(state, x, z, amount);
}

/** 脚下有没有台 */
export function hasFloorUnder(state, x, z) {
  return isSupported(state.arena, x, z);
}

/**
 * { over, winnerId?, reason? }
 * 不依赖 step 是否已经锁定：kills 达标或时间归零就立刻算结束，
 * 让「直接改分数再问」和「跑满 step」得到同一个答案。
 */
export function isMatchOver(state) {
  const m = state.match;
  if (m.over) return { over: true, winnerId: m.winnerId, reason: m.reason };

  const decided = decideMatch(state);
  if (!decided) return { over: false };
  return { over: true, winnerId: decided.winnerId, reason: decided.reason };
}
