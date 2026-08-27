// 主推进：一次 step 可能切成多个 <=1/60 的子步，保证不同帧率下手感一致。

import { isSupported } from "./arena.js";
import { PHYSICS } from "./constants.js";
import { damageFloor } from "./floor.js";
import { getDeps } from "./deps.js";
import { playerInHub, resolveHubGround, stepHub, swapHubLoadout } from "./hub.js";
import { decideMatch } from "./match.js";
import {
  applyKnockback,
  integratePlayer,
  resolveGround,
  separatePlayers,
  statusMods,
} from "./physics.js";
import { activeGlove, enterArena, getPlayer, pushEvent, respawnPlayer } from "./state.js";
import { clamp, forwardX, forwardZ, len2, norm2 } from "./math.js";

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

/**
 * 安全区多出来的两个可选键。**没有**并进 `ZERO_INPUT`：`src/ai` 的键集断言拿 ZERO_INPUT
 * 当基准，Bot 用不到 interact，硬塞进去只会让 Bot 的 Input 形状对不上。
 * `interact`：E / 触控「选」；`interactSlot`：'main' | 'off'，不给就按「先主后副」。
 */
export const HUB_ZERO_INPUT = Object.freeze({ ...ZERO_INPUT, interact: false, interactSlot: null });

function readInput(inputs, id) {
  const raw = inputs && inputs[id];
  return raw ? { ...ZERO_INPUT, ...raw } : ZERO_INPUT;
}

/**
 * 掌意由 combat 的 landHit / tickStatuses 记账，这里只补 combat 看不到的击杀奖励。
 * 觉醒本身由 combat.tickStatuses 在 meter 满时触发，sim 不再自己开觉醒。
 */
function gainMeter(p, amount) {
  p.meter = clamp(p.meter + amount, 0, 1);
}

// invulnT / awakenedT / statuses / knockbackT / impact 由 combat.tickStatuses 倒计时，
// 这里只管 sim 自己的计时器，避免同一个字段被扣两次。
function tickTimers(state, p, dt) {
  const dec = (v) => (v > 0 ? Math.max(0, v - dt) : 0);

  p.dashCd = dec(p.dashCd);
  p.slapCd = dec(p.slapCd);
  p.skillCd = dec(p.skillCd);
  p.switchLockT = dec(p.switchLockT);
  p.kbT = dec(p.kbT);

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

  /**
   * 安全区空挥闸：站在安全区体积里的人不启动扇击 / 主动技 / 冲刺。
   * combat 早就拒绝在安全区结算，但闸门在 sim 这边——不拦住的话，大厅按住鼠标照样
   * 发 `slapStart`/`slap`（hits:0）并把 `stats.slaps` 记上去。走、看、跳、换掌、
   * interact 不受影响。
   */
  const gated = playerInHub(state, p);

  // Q 换掌：arena 是槽位切换 + 0.4s 收掌锁；hub 是主副交换、无锁（契约 §4.4）
  if (edge("switchGlove")) {
    if (gated) {
      swapHubLoadout(state, p);
    } else if (p.switchLockT <= 0 && !busy && mods.canAct) {
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
  }

  // Shift 短冲
  if (!gated && edge("dash") && p.dashCd <= 0 && p.dashT <= 0 && mods.canMove) {
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
  if (
    !gated &&
    input.slap &&
    mods.canAct &&
    p.attack.phase === "idle" &&
    p.slapCd <= 0 &&
    p.switchLockT <= 0
  ) {
    p.attack.phase = "windup";
    p.attack.t = Math.max(0.01, glove.windup);
    p.attack.gloveId = glove.id;
    p.attack.struck = false;
    p.slapCd = glove.slapCooldown;
    state.stats.slaps++;
    pushEvent(state, { type: "slapStart", id: p.id, gloveId: glove.id });
  }

  // E 主动技
  if (!gated && edge("skill") && mods.canAct && p.attack.phase === "idle" && p.skillCd <= 0) {
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

/**
 * 把 combat 返回的命中列表落到物理与计分上。
 * `hit.applied` 为 true 表示 combat 已经把冲量写进目标速度（真实 combat 的常态），
 * 这时 sim 只补自己那份记账：失控窗口、受击倍率、连段、事件。
 */
export function applyHits(state, attacker, hits, source) {
  if (!hits || hits.length === 0) return 0;
  let landed = 0;

  for (const hit of hits) {
    const target = getPlayer(state, hit.targetId);
    if (!target || !target.alive || target === attacker) continue;

    const imp = hit.impulse || { x: 0, y: 0, z: 0 };

    // 安全区不吃击退。combat 的 applied 命中已经把冲量写进速度了，这里退回去。
    if (playerInHub(state, target)) {
      if (hit.applied) {
        target.vx -= imp.x || 0;
        target.vy -= imp.y || 0;
        target.vz -= imp.z || 0;
      }
      continue;
    }

    if (hit.applied) {
      target.lastHitBy = attacker.id;
      target.lastHitT = state.time;
      target.lastHitAt = state.time;
      target.hitsTaken++;
      target.kbT = Math.max(target.kbT, target.knockbackT || 0, PHYSICS.knockControlLock);
      target.knockScale = Math.min(PHYSICS.knockScaleMax, target.knockScale + PHYSICS.knockGrowth);
      if ((imp.y || 0) > 0) {
        target.grounded = false;
        target.coyoteT = 0;
      }
    } else {
      if (target.invulnT > 0) continue;
      applyKnockback(state, target, imp.x || 0, imp.y || 0, imp.z || 0, attacker.id);
    }

    if (hit.statuses) {
      for (const s of hit.statuses) target.statuses.push({ ...s });
    }

    if (hit.tile) damageFloor(state, hit.tile.x, hit.tile.z, hit.tile.amount);

    attacker.hitsDealt++;
    state.stats.hits++;
    landed++;

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

/** combat 延迟结算（陨掌落地 / 疾风冲刺接触 / 残影假掌）回来的命中，按各自的攻击者记账 */
function applyDelayedHits(state, hits) {
  if (!hits || hits.length === 0) return;
  for (const hit of hits) {
    const attacker = getPlayer(state, hit.attackerId);
    if (!attacker) continue;
    applyHits(state, attacker, [hit], "skill");
  }
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
    gainMeter(killer, PHYSICS.meterPerKill);
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

/** 判定并锁定胜负。判据与 isMatchOver 共用 decideMatch。 */
function updateMatch(state) {
  const m = state.match;
  m.secondsLeft = Math.max(0, state.config.matchSeconds - (state.time - (m.startTime || 0)));
  if (m.over) return;

  const decided = decideMatch(state);
  if (!decided) return;

  m.over = true;
  m.winnerId = decided.winnerId;
  m.reason = decided.reason;
  pushEvent(state, { type: "matchOver", winnerId: m.winnerId, reason: m.reason });
}

/**
 * 出盘：水平半径超过 arenaRadius + 0.2 且脚下没台，就是掉出去了。
 * 一掉到台面高度以下就判，不等 y < fallY——`tests/match-lifecycle` 要的是
 * 「越缘即开始重生计时」，掉到 -8 再判会让重生晚整整 0.8s。
 */
function isOffDisk(state, p) {
  if (p.grounded) return false;
  if (p.y > state.arena.floorY) return false;
  if (len2(p.x, p.z) <= state.arena.radius + 0.2) return false;
  return !isSupported(state.arena, p.x, p.z);
}

function subStep(state, inputs, dt) {
  const deps = getDeps();
  state.time += dt;
  state.t = state.time;
  state.tick++;

  const ticked = deps.combat.tickStatuses(state, dt);
  applyDelayedHits(state, ticked && ticked.hits);

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
    const entry = { p, input: readInput(inputs, p.id), mods: statusMods(p, state.time) };
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
    // 安全区是实心走道 + 隐形墙，裂岛才有台块与缺口
    if (playerInHub(state, p)) resolveHubGround(state, p, dt);
    else resolveGround(state, p, dt);
  }

  // 出招在位移之后结算，命中用的是当帧位置
  for (const p of state.players) {
    if (p.alive && p.attack.phase === "strike") resolveStrike(state, p);
  }

  // 靠近台座 / 装备 / 传送门。传送会把 phase 切成 arena，所以放在掉落判定之前。
  stepHub(state, frame, (p) => enterArena(state, p));

  for (const p of state.players) {
    if (!p.alive) continue;
    if (playerInHub(state, p)) continue; // 安全区不判掉落 KO
    if (p.y < state.config.fallY) knockOut(state, p, "fell");
    else if (isOffDisk(state, p)) knockOut(state, p, "fell");
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
