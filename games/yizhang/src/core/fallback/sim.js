// 占位模拟。src/sim/index.js（Opus-1）缺席时顶上，导出签名与契约一致：
//   createMatch(opts) / step(state, inputs, dt) / getView(state) / isMatchOver(state)
// 目标是「竖切能玩、HUD 有真数据可显示」，不是最终手感。state 保持纯 JSON，可 structuredClone。

import { GLOVE_BY_ID, GLOVES, MATCH, BOT_NAMES, BOT_PERSONAS } from "./data.js";

const TAU = Math.PI * 2;
const CORE_RADIUS = 6; // 中心台永不塌，避免出现无法站立的死局
const GRAVITY = -26;
const MOVE_SPEED = 7.6;
const GROUND_ACCEL = 46;
const AIR_ACCEL = 12;
const GROUND_DRAG = 9;
const AIR_DRAG = 0.35;
const JUMP_V = 8.4;
const DASH_IMPULSE = 15;
const DASH_CD = 2.4;
const SLAP_ACTIVE = 0.06;
const RAIL_SPEED = 11; // 低于这个水平速度会被护栏挡住
const CHUNK_HP = 100;

function rand(state) {
  let a = (state.rngA + 0x6d2b79f5) >>> 0;
  state.rngA = a;
  let t = a;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

function angleDelta(a, b) {
  let d = (b - a) % TAU;
  if (d > Math.PI) d -= TAU;
  if (d < -Math.PI) d += TAU;
  return d;
}

function chunkIndexAt(x, z) {
  let ang = Math.atan2(z, x);
  if (ang < 0) ang += TAU;
  return Math.floor((ang / TAU) * 4) % 4;
}

function groundAt(state, x, z) {
  const r = Math.hypot(x, z);
  if (r <= CORE_RADIUS) return true;
  if (r > state.arena.radius) return false;
  return state.arena.chunks[chunkIndexAt(x, z)].alive;
}

function emit(state, event) {
  state.events.push({ eid: state.nextEventId++, t: state.t, ...event });
}

function makePlayer(state, id, opts) {
  const glove = GLOVE_BY_ID[opts.gloveId] || GLOVES[0];
  return {
    id,
    name: opts.name,
    kind: opts.kind,
    persona: opts.persona || null,
    x: opts.x,
    y: 0,
    z: opts.z,
    yaw: Math.atan2(-opts.z, -opts.x),
    vx: 0,
    vy: 0,
    vz: 0,
    gloveId: opts.gloveId,
    offhandId: opts.offhandId,
    activeSlot: 0,
    color: glove.color,
    meter: 0,
    awakenedT: 0,
    statuses: [],
    alive: true,
    grounded: true,
    invulnT: MATCH.invulnTime,
    respawnT: 0,
    kills: 0,
    deaths: 0,
    stagger: 0,
    combo: 0,
    slapPhase: "idle",
    slapT: 0,
    slapCd: 0,
    skillCd: 0,
    dashCd: 0,
    switchLockT: 0,
    lastHitBy: null,
    lastHitT: -99,
    facingHitT: -99,
  };
}

export function createMatch(opts = {}) {
  const botCount = Math.max(0, Math.min(5, opts.botCount ?? 3));
  const state = {
    fallback: true,
    seed: opts.seed >>> 0 || 1,
    rngA: (opts.seed >>> 0 || 1) ^ 0x9e3779b9,
    t: 0,
    timeLeft: MATCH.matchSeconds,
    over: false,
    winnerId: null,
    reason: null,
    nextEventId: 1,
    events: [],
    arena: {
      radius: MATCH.arenaRadius,
      coreRadius: CORE_RADIUS,
      chunks: [0, 1, 2, 3].map((i) => ({
        id: `chunk${i}`,
        a0: (i / 4) * TAU,
        a1: ((i + 1) / 4) * TAU,
        hp: CHUNK_HP,
        maxHp: CHUNK_HP,
        alive: true,
        cracks: 0,
      })),
    },
    players: [],
  };

  const spawnR = CORE_RADIUS + 4;
  const total = botCount + 1;
  state.players.push(
    makePlayer(state, "p1", {
      name: opts.playerName || "你",
      kind: "human",
      gloveId: opts.gloveId || "cotton",
      offhandId: opts.offhandId || opts.gloveId || "cotton",
      x: Math.cos(0) * spawnR,
      z: Math.sin(0) * spawnR,
    })
  );
  for (let i = 0; i < botCount; i += 1) {
    const ang = ((i + 1) / total) * TAU;
    const persona = BOT_PERSONAS[i % BOT_PERSONAS.length];
    const pool = GLOVES[(i * 3 + 1) % GLOVES.length];
    const pool2 = GLOVES[(i * 5 + 2) % GLOVES.length];
    state.players.push(
      makePlayer(state, `bot${i + 1}`, {
        name: BOT_NAMES[i % BOT_NAMES.length],
        kind: "bot",
        persona,
        gloveId: pool.id,
        offhandId: pool2.id,
        x: Math.cos(ang) * spawnR,
        z: Math.sin(ang) * spawnR,
      })
    );
  }
  return state;
}

function activeGlove(p) {
  const id = p.activeSlot === 0 ? p.gloveId : p.offhandId;
  return GLOVE_BY_ID[id] || GLOVES[0];
}

function statusMul(p, id) {
  const hit = p.statuses.find((s) => s.id === id);
  return hit ? hit.mul ?? 1 : 1;
}

function hasStatus(p, id) {
  return p.statuses.some((s) => s.id === id);
}

function addStatus(p, status) {
  const existing = p.statuses.find((s) => s.id === status.id);
  if (existing) {
    existing.t = Math.max(existing.t, status.t);
    return;
  }
  p.statuses.push({ ...status });
}

function gainMeter(p, amount) {
  if (p.awakenedT > 0) return;
  p.meter = Math.min(1, p.meter + amount);
}

function tryAwaken(state, p) {
  if (p.meter < 1 || p.awakenedT > 0) return;
  p.meter = 0;
  p.awakenedT = MATCH.awakenDuration;
  emit(state, { type: "awaken", playerId: p.id, gloveId: activeGlove(p).id });
}

function damageChunk(state, x, z, amount) {
  const r = Math.hypot(x, z);
  if (r <= CORE_RADIUS || r > state.arena.radius) return;
  const chunk = state.arena.chunks[chunkIndexAt(x, z)];
  if (!chunk.alive) return;
  chunk.hp -= amount;
  chunk.cracks = Math.min(3, chunk.cracks + 1);
  if (chunk.hp <= 0) {
    chunk.hp = 0;
    chunk.alive = false;
    emit(state, { type: "chunkBreak", chunkId: chunk.id });
  } else {
    emit(state, { type: "chunkCrack", chunkId: chunk.id, x, z });
  }
}

function applyKnockback(state, attacker, target, power, upward) {
  const dx = target.x - attacker.x;
  const dz = target.z - attacker.z;
  const len = Math.hypot(dx, dz) || 1;
  const scale = power * (1 + target.stagger * 1.5);
  target.vx += (dx / len) * scale;
  target.vz += (dz / len) * scale;
  target.vy = Math.max(target.vy, upward);
  target.grounded = false;
  target.stagger = Math.min(1.6, target.stagger + 0.16);
  target.lastHitBy = attacker.id;
  target.lastHitT = state.t;
}

function coneHits(state, attacker, range, angleDeg, filter) {
  const half = (angleDeg * Math.PI) / 360;
  const out = [];
  for (const other of state.players) {
    if (other.id === attacker.id || !other.alive) continue;
    if (other.invulnT > 0) continue;
    const dx = other.x - attacker.x;
    const dz = other.z - attacker.z;
    const dist = Math.hypot(dx, dz);
    if (dist > range + MATCH.playerRadius) continue;
    if (Math.abs(other.y - attacker.y) > 3.2) continue;
    const toAng = Math.atan2(dz, dx);
    if (Math.abs(angleDelta(attacker.yaw, toAng)) > half) continue;
    if (filter && !filter(other, dist)) continue;
    out.push(other);
  }
  return out;
}

function resolveSlapHits(state, attacker) {
  const glove = activeGlove(attacker);
  const awake = attacker.awakenedT > 0;
  const range = glove.slapRange * (awake ? 1.18 : 1);
  let power = glove.slapPower * (awake ? 1.35 : 1);
  attacker.combo += 1;
  if (glove.id === "cotton" && awake && attacker.combo % 3 === 0) power *= 1.9;

  const hits = coneHits(state, attacker, range, glove.slapAngleDeg);
  emit(state, {
    type: "slap",
    playerId: attacker.id,
    gloveId: glove.id,
    hit: hits.length > 0,
    awakened: awake,
  });
  if (!hits.length) {
    attacker.combo = 0;
    return;
  }

  for (const target of hits) {
    if (hasStatus(target, "parry")) {
      applyKnockback(state, target, attacker, power * 0.9, 4.2);
      gainMeter(target, 0.2);
      emit(state, { type: "parry", playerId: target.id, againstId: attacker.id });
      if (target.awakenedT > 0) target.vy = Math.max(target.vy, 6);
      continue;
    }
    const fromBehind = Math.abs(angleDelta(target.yaw, attacker.yaw)) < 1.1;
    const finalPower = power * (fromBehind ? 1.25 : 1);
    applyKnockback(state, attacker, target, finalPower, 3.4);
    gainMeter(attacker, 0.13);
    gainMeter(target, 0.08);
    if (finalPower >= 13) damageChunk(state, target.x, target.z, 26);
    emit(state, {
      type: "hit",
      playerId: attacker.id,
      targetId: target.id,
      power: finalPower,
      behind: fromBehind,
      x: target.x,
      y: target.y,
      z: target.z,
    });
  }
  tryAwaken(state, attacker);
}

function resolveSkill(state, p) {
  const glove = activeGlove(p);
  const awake = p.awakenedT > 0;
  emit(state, { type: "skill", playerId: p.id, gloveId: glove.id, skillId: glove.skillId });

  switch (glove.skillId) {
    case "quake": {
      damageChunk(state, p.x, p.z, awake ? 70 : 34);
      for (const other of state.players) {
        if (other.id === p.id || !other.alive || other.invulnT > 0) continue;
        const d = Math.hypot(other.x - p.x, other.z - p.z);
        if (d > 5.5) continue;
        applyKnockback(state, p, other, 13 * (1 - d / 8), 7.5);
        gainMeter(p, 0.1);
      }
      break;
    }
    case "rush": {
      p.vx += Math.cos(p.yaw) * (awake ? 21 : 18);
      p.vz += Math.sin(p.yaw) * (awake ? 21 : 18);
      addStatus(p, { id: "rush", t: 0.45 });
      break;
    }
    case "frostArc": {
      for (const other of coneHits(state, p, 5.2, 140)) {
        if (awake) addStatus(other, { id: "freeze", t: 0.8, mul: 0 });
        else addStatus(other, { id: "slow", t: 2.2, mul: 0.48 });
        applyKnockback(state, p, other, 3.5, 1.2);
        gainMeter(p, 0.09);
      }
      break;
    }
    case "parry": {
      addStatus(p, { id: "parry", t: 0.5 });
      break;
    }
    case "blink": {
      const dist = awake ? 7.5 : 6;
      emit(state, { type: "afterimage", playerId: p.id, x: p.x, y: p.y, z: p.z, yaw: p.yaw });
      const nx = p.x + Math.cos(p.yaw) * dist;
      const nz = p.z + Math.sin(p.yaw) * dist;
      if (Math.hypot(nx, nz) <= state.arena.radius + 1) {
        p.x = nx;
        p.z = nz;
      }
      addStatus(p, { id: "phase", t: 0.35 });
      break;
    }
    case "pull": {
      const targets = coneHits(state, p, 9, 90).slice(0, awake ? 2 : 1);
      for (const other of targets) {
        const dx = p.x - other.x;
        const dz = p.z - other.z;
        const len = Math.hypot(dx, dz) || 1;
        other.vx += (dx / len) * 16;
        other.vz += (dz / len) * 16;
        other.vy = Math.max(other.vy, 2);
        if (awake) addStatus(other, { id: "stick", t: 0.6, mul: 0.3 });
        gainMeter(p, 0.1);
      }
      break;
    }
    case "meteorFall": {
      p.vy = 15;
      p.grounded = false;
      addStatus(p, { id: "meteor", t: 1.6 });
      break;
    }
    default:
      break;
  }
  tryAwaken(state, p);
}

function meteorLanding(state, p) {
  const awake = p.awakenedT > 0;
  emit(state, { type: "meteorLand", playerId: p.id, x: p.x, z: p.z });
  damageChunk(state, p.x, p.z, awake ? 90 : 45);
  if (awake) {
    for (const chunk of state.arena.chunks) {
      const mid = (chunk.a0 + chunk.a1) / 2;
      damageChunk(state, Math.cos(mid) * 12, Math.sin(mid) * 12, 22);
    }
  }
  for (const other of state.players) {
    if (other.id === p.id || !other.alive || other.invulnT > 0) continue;
    const d = Math.hypot(other.x - p.x, other.z - p.z);
    if (d > 6) continue;
    applyKnockback(state, p, other, 16 * (1 - d / 9), 8);
    gainMeter(p, 0.12);
  }
}

function killCredit(state, victim) {
  victim.alive = false;
  victim.deaths += 1;
  victim.respawnT = MATCH.respawnDelay;
  victim.combo = 0;
  victim.stagger = 0;
  victim.statuses.length = 0;
  victim.slapPhase = "idle";
  victim.slapT = 0;

  const recent = state.t - victim.lastHitT <= 4.5;
  const killer = recent ? state.players.find((q) => q.id === victim.lastHitBy) : null;
  if (killer && killer.id !== victim.id) {
    killer.kills += 1;
    gainMeter(killer, 0.2);
    tryAwaken(state, killer);
  }
  emit(state, {
    type: "kill",
    killerId: killer ? killer.id : null,
    victimId: victim.id,
    method: killer ? "slap" : "fall",
  });
}

function respawn(state, p) {
  const ang = rand(state) * TAU;
  const r = CORE_RADIUS * 0.6;
  p.x = Math.cos(ang) * r;
  p.z = Math.sin(ang) * r;
  p.y = 1.2;
  p.vx = 0;
  p.vy = 0;
  p.vz = 0;
  p.yaw = Math.atan2(-p.z, -p.x);
  p.alive = true;
  p.invulnT = MATCH.invulnTime;
  p.meter = Math.max(0, p.meter - 0.25);
  p.awakenedT = 0;
  emit(state, { type: "respawn", playerId: p.id });
}

function stepPlayer(state, p, input, dt) {
  p.slapCd = Math.max(0, p.slapCd - dt);
  p.skillCd = Math.max(0, p.skillCd - dt);
  p.dashCd = Math.max(0, p.dashCd - dt);
  p.switchLockT = Math.max(0, p.switchLockT - dt);
  p.invulnT = Math.max(0, p.invulnT - dt);
  p.stagger = Math.max(0, p.stagger - dt * 0.11);
  if (p.awakenedT > 0) p.awakenedT = Math.max(0, p.awakenedT - dt);

  for (let i = p.statuses.length - 1; i >= 0; i -= 1) {
    p.statuses[i].t -= dt;
    if (p.statuses[i].t <= 0) p.statuses.splice(i, 1);
  }

  if (!p.alive) {
    p.respawnT -= dt;
    if (p.respawnT <= 0) respawn(state, p);
    return;
  }

  if (typeof input.yaw === "number" && Number.isFinite(input.yaw)) p.yaw = input.yaw;

  const frozen = hasStatus(p, "freeze");
  const speedMul = statusMul(p, "slow") * statusMul(p, "freeze") * statusMul(p, "stick");
  const locked = p.slapPhase === "windup" || p.slapPhase === "active";

  let mx = frozen ? 0 : input.moveX || 0;
  let mz = frozen ? 0 : input.moveZ || 0;
  const mag = Math.hypot(mx, mz);
  if (mag > 1) {
    mx /= mag;
    mz /= mag;
  }
  if (locked) {
    mx *= 0.25;
    mz *= 0.25;
  }

  const accel = p.grounded ? GROUND_ACCEL : AIR_ACCEL;
  const target = MOVE_SPEED * speedMul;
  p.vx += (mx * target - p.vx * (p.grounded ? 1 : 0.12)) * Math.min(1, accel * dt * 0.1);
  p.vz += (mz * target - p.vz * (p.grounded ? 1 : 0.12)) * Math.min(1, accel * dt * 0.1);

  const drag = p.grounded ? GROUND_DRAG : AIR_DRAG;
  if (mag < 0.02) {
    const damp = Math.max(0, 1 - drag * dt);
    p.vx *= damp;
    p.vz *= damp;
  }

  if (input.jump && p.grounded && !frozen && !locked) {
    p.vy = JUMP_V;
    p.grounded = false;
    emit(state, { type: "jump", playerId: p.id });
  }
  if (input.dash && p.dashCd <= 0 && !frozen) {
    const dirX = mag > 0.05 ? mx : Math.cos(p.yaw);
    const dirZ = mag > 0.05 ? mz : Math.sin(p.yaw);
    p.vx += dirX * DASH_IMPULSE;
    p.vz += dirZ * DASH_IMPULSE;
    p.dashCd = DASH_CD;
    addStatus(p, { id: "dash", t: 0.22 });
    emit(state, { type: "dash", playerId: p.id });
  }
  if (input.switchGlove && p.switchLockT <= 0 && p.gloveId !== p.offhandId) {
    p.activeSlot = p.activeSlot === 0 ? 1 : 0;
    p.switchLockT = MATCH.switchLock;
    p.combo = 0;
    p.color = activeGlove(p).color;
    emit(state, { type: "switch", playerId: p.id, gloveId: activeGlove(p).id });
  }

  const glove = activeGlove(p);
  if (input.skill && p.skillCd <= 0 && glove.skillId !== "none" && !frozen && !locked) {
    p.skillCd = glove.skillCooldown * (p.awakenedT > 0 ? 0.75 : 1);
    resolveSkill(state, p);
  }
  if (input.slap && p.slapCd <= 0 && p.slapPhase === "idle" && !frozen) {
    p.slapPhase = "windup";
    p.slapT = glove.windup;
    p.slapCd = (glove.slapCooldown + glove.windup + glove.recovery) * (p.awakenedT > 0 ? 0.8 : 1);
  }

  if (p.slapPhase !== "idle") {
    p.slapT -= dt;
    if (p.slapT <= 0) {
      if (p.slapPhase === "windup") {
        p.slapPhase = "active";
        p.slapT = SLAP_ACTIVE;
        resolveSlapHits(state, p);
      } else if (p.slapPhase === "active") {
        p.slapPhase = "recovery";
        p.slapT = glove.recovery;
      } else {
        p.slapPhase = "idle";
        p.slapT = 0;
      }
    }
  }

  p.vy += GRAVITY * dt;
  const prevGrounded = p.grounded;
  p.x += p.vx * dt;
  p.y += p.vy * dt;
  p.z += p.vz * dt;

  const supported = groundAt(state, p.x, p.z);
  if (supported && p.y <= 0 && p.vy <= 0) {
    p.y = 0;
    p.vy = 0;
    if (!prevGrounded) {
      if (hasStatus(p, "meteor")) meteorLanding(state, p);
      emit(state, { type: "land", playerId: p.id, x: p.x, z: p.z, impact: p.stagger });
    }
    p.grounded = true;
  } else {
    p.grounded = false;
  }

  // 低护栏：轻推被挡下，重击照样飞出去。
  const r = Math.hypot(p.x, p.z);
  const horizSpeed = Math.hypot(p.vx, p.vz);
  if (p.grounded && r > state.arena.radius - 0.55 && horizSpeed < RAIL_SPEED) {
    const k = (state.arena.radius - 0.55) / (r || 1);
    p.x *= k;
    p.z *= k;
    p.vx *= 0.35;
    p.vz *= 0.35;
  }

  const outside = r > state.arena.radius + 0.2 && !p.grounded;
  if (p.y < MATCH.fallY || (outside && p.y < -1.5)) {
    emit(state, { type: "ringout", playerId: p.id });
    killCredit(state, p);
  }
}

export function step(state, inputs, dt) {
  if (state.over) return state;
  state.events.length = 0;
  const delta = dt || MATCH.dt;

  for (const p of state.players) {
    const input = (inputs && inputs[p.id]) || {};
    stepPlayer(state, p, input, delta);
  }

  state.t += delta;
  state.timeLeft = Math.max(0, state.timeLeft - delta);

  const leader = state.players.reduce((a, b) => (b.kills > a.kills ? b : a), state.players[0]);
  if (leader && leader.kills >= MATCH.killsToWin) {
    state.over = true;
    state.winnerId = leader.id;
    state.reason = "kills";
  } else if (state.timeLeft <= 0) {
    state.over = true;
    state.winnerId = leader ? leader.id : null;
    state.reason = "time";
  }
  return state;
}

export function getView(state) {
  return {
    fallback: true,
    t: state.t,
    timeLeft: state.timeLeft,
    over: state.over,
    winnerId: state.winnerId,
    reason: state.reason,
    arena: {
      radius: state.arena.radius,
      coreRadius: state.arena.coreRadius,
      chunks: state.arena.chunks.map((c) => ({
        id: c.id,
        a0: c.a0,
        a1: c.a1,
        alive: c.alive,
        hp: c.hp,
        maxHp: c.maxHp,
        cracks: c.cracks,
      })),
    },
    players: state.players.map((p) => ({
      id: p.id,
      name: p.name,
      kind: p.kind,
      persona: p.persona,
      x: p.x,
      y: p.y,
      z: p.z,
      yaw: p.yaw,
      vx: p.vx,
      vy: p.vy,
      vz: p.vz,
      gloveId: p.activeSlot === 0 ? p.gloveId : p.offhandId,
      mainId: p.gloveId,
      offhandId: p.offhandId,
      activeSlot: p.activeSlot,
      color: activeGlove(p).color,
      meter: p.meter,
      awakenedT: p.awakenedT,
      statuses: p.statuses.map((s) => ({ id: s.id, t: s.t })),
      alive: p.alive,
      grounded: p.grounded,
      invulnT: p.invulnT,
      respawnT: p.respawnT,
      kills: p.kills,
      deaths: p.deaths,
      stagger: p.stagger,
      slapPhase: p.slapPhase,
      slapCd: p.slapCd,
      skillCd: p.skillCd,
      dashCd: p.dashCd,
      switchLockT: p.switchLockT,
    })),
    events: state.events.map((e) => ({ ...e })),
  };
}

export function isMatchOver(state) {
  return { over: !!state.over, winnerId: state.winnerId || undefined, reason: state.reason || undefined };
}

export const cooldownMax = {
  dash: DASH_CD,
};
