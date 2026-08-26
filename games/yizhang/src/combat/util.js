// 异掌 · 战斗侧纯函数工具。不 import three，不碰 DOM。

import { ARENA, HIT } from "./constants.js";

export const TAU = Math.PI * 2;

export function clamp(v, lo, hi) {
  return v < lo ? lo : v > hi ? hi : v;
}

export function clamp01(v) {
  return clamp(v, 0, 1);
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}

export function num(v, fallback = 0) {
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}

/**
 * 朝向约定：yaw=0 面向 +Z，绕 Y 轴正方向旋转。
 * 与 three.js `Object3D.rotation.y`（本地 +Z 为前）一致，render 侧可直接套用。
 */
export function forwardFromYaw(yaw) {
  return { x: Math.sin(yaw), z: Math.cos(yaw) };
}

/** 前向的右手边。 */
export function rightFromYaw(yaw) {
  return { x: Math.cos(yaw), z: -Math.sin(yaw) };
}

/** 世界方向 -> yaw。 */
export function yawTo(dx, dz) {
  return Math.atan2(dx, dz);
}

/** 把角度差折进 (-PI, PI]。 */
export function wrapAngle(a) {
  let x = (a + Math.PI) % TAU;
  if (x < 0) x += TAU;
  return x - Math.PI;
}

/** yaw 局部 (mx,mz) -> 世界向量。 */
export function localToWorld(mx, mz, yaw) {
  const c = Math.cos(yaw);
  const s = Math.sin(yaw);
  return { x: mx * c + mz * s, z: -mx * s + mz * c };
}

/** 世界向量 -> yaw 局部 (mx,mz)。 */
export function worldToLocal(wx, wz, yaw) {
  const c = Math.cos(yaw);
  const s = Math.sin(yaw);
  return { x: wx * c - wz * s, z: wx * s + wz * c };
}

export function horizDist(a, b) {
  const dx = num(b.x) - num(a.x);
  const dz = num(b.z) - num(a.z);
  return Math.hypot(dx, dz);
}

export function horizDir(from, to) {
  const dx = num(to.x) - num(from.x);
  const dz = num(to.z) - num(from.z);
  const d = Math.hypot(dx, dz);
  if (d < 1e-6) return { x: 0, z: 1, dist: 0 };
  return { x: dx / d, z: dz / d, dist: d };
}

/** 目标是否落在 attacker 面前 angleDeg 的扇形里。 */
export function inCone(attacker, target, angleDeg) {
  const dir = horizDir(attacker, target);
  if (dir.dist === 0) return true;
  const f = forwardFromYaw(num(attacker.yaw));
  const dot = clamp(f.x * dir.x + f.z * dir.z, -1, 1);
  return Math.acos(dot) <= (angleDeg * Math.PI) / 360;
}

/** attacker 是否站在 target 背后（背刺加成用）。 */
export function isBehind(attacker, target, angleDeg = HIT.behindAngleDeg) {
  const tf = forwardFromYaw(num(target.yaw));
  const dir = horizDir(target, attacker);
  if (dir.dist === 0) return false;
  const dot = clamp(tf.x * dir.x + tf.z * dir.z, -1, 1);
  return Math.acos(dot) >= Math.PI - (angleDeg * Math.PI) / 360;
}

/** state.players 允许是数组或 { id: player } 字典。 */
export function playerList(state) {
  if (!state) return [];
  const p = state.players;
  if (Array.isArray(p)) return p;
  if (p && typeof p === "object") return Object.values(p);
  if (Array.isArray(state.entities)) return state.entities;
  return [];
}

export function playerById(state, id) {
  if (id == null) return null;
  const p = state && state.players;
  if (p && !Array.isArray(p) && typeof p === "object" && p[id]) return p[id];
  return playerList(state).find((q) => q && q.id === id) || null;
}

/** 能不能被打：活着、没无敌、不是自己。 */
export function isTargetable(target, attacker) {
  if (!target || target === attacker) return false;
  if (attacker && target.id != null && target.id === attacker.id) return false;
  if (target.alive === false) return false;
  if (num(target.respawnT) > 0) return false;
  if (num(target.invulnT) > 0) return false;
  if (hasStatus(target, "invuln")) return false;
  return true;
}

export function opponentsOf(state, attacker) {
  return playerList(state).filter((p) => isTargetable(p, attacker));
}

export function hasStatus(player, kind) {
  const list = player && player.statuses;
  if (!Array.isArray(list)) return false;
  for (const s of list) {
    if (s && s.kind === kind && num(s.t) > 0) return true;
  }
  return false;
}

export function getStatus(player, kind) {
  const list = player && player.statuses;
  if (!Array.isArray(list)) return null;
  let best = null;
  for (const s of list) {
    if (s && s.kind === kind && num(s.t) > 0) {
      if (!best || num(s.t) > num(best.t)) best = s;
    }
  }
  return best;
}

export function arenaRadius(state) {
  return num(state && state.arena && state.arena.radius, num(state && state.arenaRadius, ARENA.radius));
}

export function tileRadius(tile, state) {
  if (tile) {
    if (typeof tile.r === "number") return tile.r;
    if (typeof tile.radius === "number") return tile.radius;
    if (typeof tile.half === "number") return tile.half;
    if (typeof tile.size === "number") return tile.size / 2;
    if (typeof tile.w === "number") return Math.max(tile.w, num(tile.d, tile.w)) / 2;
  }
  // src/sim 的方格台面只在 arena 上记一次边长。
  const size = num(state && state.arena && state.arena.tileSize, 0);
  if (size > 0) return size / 2;
  return ARENA.tileRadius;
}

export function tileList(state) {
  if (!state) return [];
  if (Array.isArray(state.tiles)) return state.tiles;
  if (state.arena && Array.isArray(state.arena.tiles)) return state.arena.tiles;
  return [];
}

export function isTileAlive(tile) {
  if (!tile) return false;
  if (tile.broken === true || tile.destroyed === true) return false;
  if (tile.alive === false) return false;
  return num(tile.hp, ARENA.tileHp) > 0;
}

export function pushEvent(state, event) {
  if (!state) return event;
  if (!Array.isArray(state.events)) state.events = [];
  state.events.push(event);
  if (state.events.length > HIT.maxEvents) {
    state.events.splice(0, state.events.length - HIT.maxEvents);
  }
  return event;
}

/** combat 自己的暂存区（纯 JSON，可 structuredClone）。 */
export function combatOf(state) {
  if (!state.combat || typeof state.combat !== "object") {
    state.combat = { clock: 0, pending: [], dashes: [], ghosts: [], seq: 1 };
  }
  const c = state.combat;
  if (typeof c.clock !== "number") c.clock = 0;
  if (!Array.isArray(c.pending)) c.pending = [];
  if (!Array.isArray(c.dashes)) c.dashes = [];
  if (!Array.isArray(c.ghosts)) c.ghosts = [];
  if (typeof c.seq !== "number") c.seq = 1;
  return c;
}

/** 时钟：宿主给了 `t`（testkit）或 `time`（src/sim）就跟宿主，否则 combat 自己攒。 */
export function clockOf(state) {
  if (!state) return 0;
  if (typeof state.t === "number" && Number.isFinite(state.t)) return state.t;
  if (typeof state.time === "number" && Number.isFinite(state.time)) return state.time;
  return combatOf(state).clock;
}

/**
 * 宿主是不是 `src/sim`：sim 的 player 自带前后摇状态机（`attack.phase`）与
 * 两条冷却计时（`slapCd` / `skillCd`），它已经闸过一道出招节奏。
 * 这种玩家上 combat 不再叠自己的冷却与无敌帧倒计时，否则两套计时会互相吃掉。
 */
export function simDrivenPlayer(player) {
  return !!(
    player &&
    player.attack &&
    typeof player.attack.phase === "string" &&
    typeof player.slapCd === "number" &&
    typeof player.skillCd === "number"
  );
}

export function nextId(state, prefix) {
  const c = combatOf(state);
  return `${prefix}${c.seq++}`;
}
