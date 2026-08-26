// 主推进：一次 step 可能切成多个 <=1/60 的子步，保证不同帧率下手感一致。

import { PHYSICS } from "./constants.js";
import { damageFloor } from "./floor.js";
import { getDeps } from "./deps.js";
import {
  applyKnockback,
  integratePlayer,
  resolveGround,
  separatePlayers,
  statusMods,
} from "./physics.js";
import { activeGlove, getPlayer, pushEvent, respawnPlayer } from "./state.js";
import { forwardX, forwardZ, len2, norm2 } from "./math.js";

/** 缺省输入：不动、不出招；yaw = null 表示保持当前朝向 */
export const ZERO_INPUT = Object.freeze({
  moveX: 0,
  moveZ: 0,
  yaw: null,
  slap: false,
  skill: false,
  switchGlove: false,
  dash: false,
  jump: false,
});

function readInput(inputs, id) {
  const raw = inputs && inputs[id];
  return raw ? { ...ZERO_INPUT, ...raw } : ZERO_INPUT;
}

function checkAwaken(state, p) {
  if (p.meter < 1 || p.awakenedT > 0) return;
  p.meter = 0;
  p.awakenedT = state.config.awakenDuration;
  pushEvent(state, { type: "awaken", id: p.id, gloveId: activeGlove(p).id });
}

function addMeter(state, p, amount) {
  p.meter = Math.min(1, Math.max(0, p.meter + amount));
  checkAwaken(state, p);
}

function tickTimers(state, p, dt) {
  const dec = (v) => (v > 0 ? Math.max(0, v - dt) : 0);

  p.invulnT = dec(p.invulnT);
  p.dashCd = dec(p.dashCd);
  p.slapCd = dec(p.slapCd);
  p.skillCd = dec(p.skillCd);
  p.switchLockT = dec(p.switchLockT);
  p.kbT = dec(p.kbT);

  if (p.awakenedT > 0) {
    p.awakenedT = dec(p.awakenedT);
    if (p.awakenedT === 0) pushEvent(state, { type: "awakenEnd", id: p.id });
  }

  if (p.comboT > 0) {
    p.comboT = dec(p.comboT);
    if (p.comboT === 0) p.combo = 0;
  }

  if (p.dashT > 0) {
    p.dashT = dec(p.dashT);
    if (p.dashT === 0) {
      // 冲刺结束把速度收到略高于跑速，避免瞬间刹停
      const v = norm2(p.vx, p.vz);
      if (v.len > PHYSICS.maxSpeed * 1.1) {
        p.vx = v.x * PHYSICS.maxSpeed * 1.1;
        p.vz = v.z * PHYSICS.maxSpeed * 1.1;
      }
    }
  }

  const a = p.attack;
  if (a.phase === "windup") {
    a.t -= dt;
    if (a.t <= 0) a.phase = "strike";
  } else if (a.phase === "recovery") {
    a.t -= dt;
    if (a.t <= 0) {
      a.phase = "idle";
      a.t = 0;
    }
  }
}

function handleActions(state, p, input, mods) {
  const prev = p.prev;
  const edge = (name) => !!input[name] && !prev[name];

  if (Number.isFinite(input.yaw)) p.yaw = input.yaw;

  const glove = activeGlove(p);
  const busy = p.attack.phase === "windup" || p.attack.phase === "strike";

  // Q 换掌：0.4s 收掌锁
  if (edge("switchGlove") && p.switchLockT <= 0 && !busy && mods.canAct) {
    p.activeSlot = p.activeSlot === 0 ? 1 : 0;
    p.switchLockT = state.config.switchLock;
    p.attack.phase = "idle";
    p.attack.t = 0;
    p.slapCd = Math.max(p.slapCd, state.config.switchLock * 0.5);
    pushEvent(state, {
      type: "switch",
      id: p.id,
      slot: p.activeSlot,
      gloveId: activeGlove(p).id,
    });
  }

  // Shift 短冲
  if (edge("dash") && p.dashCd <= 0 && p.dashT <= 0 && mods.canMove) {
    let dx = input.moveX || 0;
    let dz = input.moveZ || 0;
    const l = len2(dx, dz);
    if (l < 0.05) {
      dx = forwardX(p.yaw);
      dz = forwardZ(p.yaw);
    } else {
      dx /= l;
      dz /= l;
    }
    p.dashDirX = dx;
    p.dashDirZ = dz;
    p.dashT = PHYSICS.dashTime;
    p.dashCd = PHYSICS.dashCooldown;
    pushEvent(state, { type: "dash", id: p.id, x: p.x, y: p.y, z: p.z });
  }

  // 空格轻跳（含土狼时间）
  if (edge("jump") && mods.canMove && (p.grounded || p.coyoteT > 0)) {
    p.vy = PHYSICS.jumpSpeed;
    p.grounded = false;
    p.coyoteT = 0;
    pushEvent(state, { type: "jump", id: p.id, x: p.x, y: p.y, z: p.z });
  }

  // 扇击：可按住连扇，有前摇后摇
  if (input.slap && mods.canAct && p.attack.phase === "idle" && p.slapCd <= 0 && p.switchLockT <= 0) {
    p.attack.phase = "windup";
    p.attack.t = Math.max(0.01, glove.windup);
    p.attack.gloveId = glove.id;
    p.attack.struck = false;
    p.slapCd = glove.slapCooldown;
    state.stats.slaps++;
    pushEvent(state, { type: "slapStart", id: p.id, gloveId: glove.id });
  }

  // E 主动技
  if (edge("skill") && mods.canAct && p.attack.phase === "idle" && p.skillCd <= 0) {
    const deps = getDeps();
    const res = deps.combat.resolveSkill(state, p, glove, state.time);
    if (res && res.ok) {
      p.skillCd = Number.isFinite(res.cooldown) ? res.cooldown : glove.skillCooldown || 6;
      if (res.selfImpulse) {
        p.vx += res.selfImpulse.x || 0;
        p.vy += res.selfImpulse.y || 0;
        p.vz += res.selfImpulse.z || 0;
        if ((res.selfImpulse.y || 0) > 0) p.grounded = false;
      }
      pushEvent(state, {
        type: "skill",
        id: p.id,
        gloveId: glove.id,
        skillId: res.skillId || glove.skillId,
      });
      applyHits(state, p, res.hits || [], "skill");
    }
  }

  prev.slap = !!input.slap;
  prev.skill = !!input.skill;
  prev.switchGlove = !!input.switchGlove;
  prev.dash = !!input.dash;
  prev.jump = !!input.jump;
}

/** 把 combat 返回的命中列表落到物理与计分上 */
export function applyHits(state, attacker, hits, source) {
  if (!hits || hits.length === 0) return 0;
  let landed = 0;

  for (const hit of hits) {
    const target = getPlayer(state, hit.targetId);
    if (!target || !target.alive || target.invulnT > 0 || target === attacker) continue;

    const imp = hit.impulse || { x: 0, y: 0, z: 0 };
    if (hit.applied) {
      target.lastHitBy = attacker.id;
      target.lastHitT = state.time;
      target.hitsTaken++;
    } else {
      applyKnockback(state, target, imp.x || 0, imp.y || 0, imp.z || 0, attacker.id);
    }

    if (hit.statuses) {
      for (const s of hit.statuses) target.statuses.push({ ...s });
    }

    if (hit.tile) damageFloor(state, hit.tile.x, hit.tile.z, hit.tile.amount);

    attacker.hitsDealt++;
    state.stats.hits++;
    landed++;

    addMeter(state, target, PHYSICS.meterPerHitTaken);
    addMeter(state, attacker, PHYSICS.meterPerHitDealt);

    pushEvent(state, {
      type: "hit",
      id: attacker.id,
      targetId: target.id,
      source: source || "slap",
      power: hit.power || len2(imp.x || 0, imp.z || 0),
      x: hit.hitX ?? target.x,
      y: target.y,
      z: hit.hitZ ?? target.z,
    });
  }

  if (landed > 0) {
    attacker.combo++;
    attacker.comboT = PHYSICS.comboWindow;
  }
  return landed;
}

function resolveStrike(state, p) {
  const deps = getDeps();
  const glove = activeGlove(p);
  const res = deps.combat.resolveSlap(state, p, glove, state.time) || { hits: [] };
  const landed = applyHits(state, p, res.hits, "slap");

  p.attack.struck = true;
  p.attack.phase = "recovery";
  p.attack.t = Math.max(0.01, glove.recovery);
  pushEvent(state, {
    type: "slap",
    id: p.id,
    gloveId: glove.id,
    hits: landed,
    x: p.x,
    y: p.y,
    z: p.z,
    yaw: p.yaw,
  });
  return landed;
}

function knockOut(state, p, reason) {
  p.alive = false;
  p.deaths++;
  p.streak = 0;
  p.respawnT = state.config.respawnDelay;
  p.vx = 0;
  p.vy = 0;
  p.vz = 0;
  p.attack.phase = "idle";
  p.attack.t = 0;
  p.dashT = 0;
  p.kbT = 0;
  state.stats.kos++;

  let killer = null;
  if (p.lastHitBy && state.time - p.lastHitT <= PHYSICS.killCreditWindow) {
    const k = getPlayer(state, p.lastHitBy);
    if (k && k !== p) killer = k;
  }
  if (killer) {
    killer.kills++;
    killer.streak++;
    if (killer.streak > killer.bestStreak) killer.bestStreak = killer.streak;
    addMeter(state, killer, PHYSICS.meterPerKill);
  }

  pushEvent(state, {
    type: "ko",
    id: p.id,
    by: killer ? killer.id : null,
    reason: reason || "fell",
    x: p.x,
    y: p.y,
    z: p.z,
  });
  p.lastHitBy = null;
}

function leaderOf(state) {
  let best = null;
  for (const p of state.players) {
    if (!best) {
      best = p;
      continue;
    }
    if (p.kills > best.kills) best = p;
    else if (p.kills === best.kills && p.deaths < best.deaths) best = p;
  }
  return best;
}

function updateMatch(state) {
  const m = state.match;
  m.secondsLeft = Math.max(0, state.config.matchSeconds - state.time);
  if (m.over) return;

  for (const p of state.players) {
    if (p.kills >= state.config.killsToWin) {
      m.over = true;
      m.winnerId = p.id;
      m.reason = "kills";
      pushEvent(state, { type: "matchOver", winnerId: p.id, reason: "kills" });
      return;
    }
  }

  if (state.time >= state.config.matchSeconds) {
    const best = leaderOf(state);
    m.over = true;
    m.winnerId = best ? best.id : null;
    m.reason = "time";
    pushEvent(state, { type: "matchOver", winnerId: m.winnerId, reason: "time" });
  }
}

function subStep(state, inputs, dt) {
  const deps = getDeps();
  state.time += dt;
  state.tick++;

  deps.combat.tickStatuses(state, dt);

  for (const p of state.players) {
    if (!p.alive) {
      p.respawnT = Math.max(0, p.respawnT - dt);
      p.invulnT = Math.max(0, p.invulnT - dt);
      if (p.respawnT === 0) respawnPlayer(state, p);
      continue;
    }
    tickTimers(state, p, dt);
  }

  const frame = [];
  for (const p of state.players) {
    if (!p.alive) continue;
    const entry = { p, input: readInput(inputs, p.id), mods: statusMods(p) };
    frame.push(entry);
    handleActions(state, p, entry.input, entry.mods);
  }

  for (const e of frame) {
    if (!e.p.alive) continue;
    integratePlayer(state, e.p, e.input, e.mods, dt);
  }

  separatePlayers(state);

  for (const p of state.players) {
    if (!p.alive) continue;
    resolveGround(state, p, dt);
  }

  // 出招在位移之后结算，命中用的是当帧位置
  for (const p of state.players) {
    if (p.alive && p.attack.phase === "strike") resolveStrike(state, p);
  }

  for (const p of state.players) {
    if (p.alive && p.y < state.config.fallY) knockOut(state, p, "fell");
  }

  updateMatch(state);
}

/**
 * step(state, inputs, dt)
 * inputs: Record<playerId, Input>，缺省视为零输入。原地更新并返回 state。
 */
export function step(state, inputs, dt) {
  const total = Math.min(
    PHYSICS.maxDt,
    Number.isFinite(dt) && dt > 0 ? dt : state.config.dt,
  );
  state.events.length = 0;

  const n = Math.max(1, Math.ceil(total / PHYSICS.maxSubStep - 1e-9));
  const sub = total / n;
  for (let i = 0; i < n; i++) subStep(state, inputs, sub);

  return state;
}
