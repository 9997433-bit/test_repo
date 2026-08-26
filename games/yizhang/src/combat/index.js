// 异掌 · 战斗解算（CONTRACT `src/combat/index.js`）
//
//   resolveSlap(state, attacker, glove, now) -> hits[{ id, impulse, ... }]
//   resolveSkill(state, attacker, glove, now) -> { ok, skillId, hits, tiles, ... }
//   tickStatuses(state, dt) -> { t, hits, tiles }
//   applyAwaken(attacker, glove) -> 生效手套（觉醒期覆盖 range/power/cd）
//
// 约定：
//  * 本模块**就地写 state**（速度冲量、状态、掌意、台面 HP），并把结果回传给 sim。
//    sim 只需负责积分、边界、掉落判定，不要再重复施加一次冲量。
//  * 无 three / DOM 依赖；所有写入都是可 structuredClone 的纯 JSON。
//  * 冷却按绝对时间存 `attacker.cd = { slapAt, skillAt }`，因此 sim 可以每帧无脑调用，
//    没冷却好就返回空命中列表 / { ok:false }。
//  * 被击退者会拿到 `knockbackT`（秒）。sim 在这段时间内必须**大幅削弱地面摩擦与
//    位移控制**，否则冲量当帧就被摩擦吃掉，谁也扇不出岛。tickStatuses 负责倒计时。

import {
  ARENA,
  AWAKEN,
  DEFAULT_GLOVE_ID,
  FALLBACK_GLOVES,
  FALLBACK_GLOVE_BY_ID,
  HIT,
  IMPACT,
  METER,
  SKILLS,
  STATUS_KINDS,
} from "./constants.js";
import { applyStatus, clearAllStatuses, refreshDerived, statusSnapshot, tickPlayerStatuses } from "./statuses.js";
import { gainMeter, landHit } from "./impact.js";
import {
  SKILL_HANDLERS,
  SKILL_IDS,
  resolveGhostSlap,
  resolveMeteorImpact,
  skillConfig,
  steerDash,
} from "./skills.js";
import {
  clamp01,
  clockOf,
  combatOf,
  forwardFromYaw,
  horizDir,
  inCone,
  isBehind,
  num,
  opponentsOf,
  playerById,
  playerList,
  pushEvent,
  rightFromYaw,
  yawTo,
} from "./util.js";

// ---------------------------------------------------------------- 手套数据源

let registeredGloveById = null;

/** 数据代理的 `src/data/gloves.js` 落地后，sim 可以在启动时注册真实表。 */
export function registerGloves(gloveByIdOrList) {
  if (!gloveByIdOrList) {
    registeredGloveById = null;
    return null;
  }
  registeredGloveById = Array.isArray(gloveByIdOrList)
    ? Object.fromEntries(gloveByIdOrList.filter((g) => g && g.id).map((g) => [g.id, g]))
    : gloveByIdOrList;
  return registeredGloveById;
}

/** 可选：`../data/gloves.js` 存在时异步接管兜底表（不存在则静默保留兜底）。 */
export async function loadGloveData(specifier = "../data/gloves.js") {
  try {
    const mod = await import(/* @vite-ignore */ specifier);
    const table = mod.GLOVE_BY_ID || (Array.isArray(mod.GLOVES) ? mod.GLOVES : null);
    if (table) return registerGloves(table);
  } catch {
    /* 数据模块尚未落地：继续用 FALLBACK_GLOVE_BY_ID */
  }
  return null;
}

/** 读取优先级：state 注入 > registerGloves > 全局 > 兜底常量。 */
export function gloveTable(state) {
  const fromState =
    (state && state.gloveById) ||
    (state && state.data && state.data.GLOVE_BY_ID) ||
    (state && Array.isArray(state.gloves)
      ? Object.fromEntries(state.gloves.filter((g) => g && g.id).map((g) => [g.id, g]))
      : null);
  return fromState || registeredGloveById || (typeof globalThis !== "undefined" && globalThis.GLOVE_BY_ID) || FALLBACK_GLOVE_BY_ID;
}

export function activeGloveId(player) {
  if (!player) return DEFAULT_GLOVE_ID;
  const slot = num(player.activeSlot, 0);
  const id = slot === 1 ? player.offhandId : player.gloveId;
  return id || player.gloveId || player.offhandId || DEFAULT_GLOVE_ID;
}

const COTTON = FALLBACK_GLOVE_BY_ID[DEFAULT_GLOVE_ID];

/** 补齐缺失字段，保证任何来源的手套对象都能直接算。 */
export function normalizeGlove(glove) {
  const g = glove && typeof glove === "object" ? glove : COTTON;
  const skillId = SKILL_IDS.includes(g.skillId) ? g.skillId : "none";
  return {
    id: g.id || DEFAULT_GLOVE_ID,
    name: g.name || COTTON.name,
    role: g.role || COTTON.role,
    color: g.color || COTTON.color,
    slapRange: num(g.slapRange, COTTON.slapRange),
    slapAngleDeg: num(g.slapAngleDeg, COTTON.slapAngleDeg),
    slapPower: num(g.slapPower, COTTON.slapPower),
    slapCooldown: num(g.slapCooldown, COTTON.slapCooldown),
    windup: num(g.windup, COTTON.windup),
    recovery: num(g.recovery, COTTON.recovery),
    skillId,
    skillCooldown: num(g.skillCooldown, COTTON.skillCooldown),
    unlock: g.unlock || COTTON.unlock,
    awakened: false,
  };
}

/** glove 可以是对象、id 字符串，或省略（走玩家当前掌）。 */
export function resolveGlove(state, attacker, glove) {
  if (glove && typeof glove === "object") return normalizeGlove(glove);
  const table = gloveTable(state);
  const id = typeof glove === "string" ? glove : activeGloveId(attacker);
  return normalizeGlove(table[id] || FALLBACK_GLOVE_BY_ID[id] || COTTON);
}

// ---------------------------------------------------------------- 觉醒

function awakenedStats(base) {
  return {
    ...base,
    slapRange: base.slapRange * AWAKEN.rangeMul,
    slapPower: base.slapPower * AWAKEN.powerMul,
    slapCooldown: base.slapCooldown * AWAKEN.cooldownMul,
    windup: base.windup * AWAKEN.windupMul,
    recovery: base.recovery * AWAKEN.recoveryMul,
    skillCooldown: base.skillCooldown * AWAKEN.skillCooldownMul,
    awakened: true,
  };
}

/**
 * 觉醒结算 + 取生效手套。
 * 掌意满（meter>=1）且不在觉醒中时消耗掌意进入 8s 觉醒；
 * 觉醒中返回被放大的 range / power / cooldown。
 */
export function applyAwaken(attacker, glove) {
  const base = normalizeGlove(glove && typeof glove === "object" ? glove : FALLBACK_GLOVE_BY_ID[glove] || COTTON);
  if (!attacker) return base;
  if (num(attacker.meter) >= 1 && num(attacker.awakenedT) <= 0 && attacker.alive !== false) {
    attacker.awakenedT = AWAKEN.duration;
    attacker.meter = 0;
    attacker.awakenGloveId = base.id;
    attacker.cottonChain = 0;
    attacker.awakenFlash = true;
  }
  if (num(attacker.awakenedT) <= 0) {
    attacker.awakened = false;
    return base;
  }
  attacker.awakened = true;
  return awakenedStats(base);
}

/** 只读版本：不触发觉醒，只取当前生效数值（AI / HUD 用）。 */
export function effectiveGlove(state, attacker, glove) {
  const base = resolveGlove(state, attacker, glove);
  return num(attacker && attacker.awakenedT) > 0 ? awakenedStats(base) : base;
}

// ---------------------------------------------------------------- 冷却与可行动

function cooldownsOf(attacker) {
  if (!attacker.cd || typeof attacker.cd !== "object") attacker.cd = { slapAt: 0, skillAt: 0 };
  if (typeof attacker.cd.slapAt !== "number") attacker.cd.slapAt = 0;
  if (typeof attacker.cd.skillAt !== "number") attacker.cd.skillAt = 0;
  return attacker.cd;
}

function actorReady(attacker) {
  if (!attacker) return false;
  if (attacker.alive === false) return false;
  if (num(attacker.respawnT) > 0) return false;
  if (attacker.frozen === true) return false;
  const list = Array.isArray(attacker.statuses) ? attacker.statuses : [];
  return !list.some((s) => s && s.kind === "freeze" && num(s.t) > 0);
}

export function canSlap(state, attacker, glove, now = clockOf(state)) {
  if (!actorReady(attacker)) return false;
  const cd = cooldownsOf(attacker);
  return now >= cd.slapAt && now >= num(attacker.busyUntil);
}

export function canSkill(state, attacker, glove, now = clockOf(state)) {
  if (!actorReady(attacker)) return false;
  const g = effectiveGlove(state, attacker, glove);
  if (g.skillId === "none") return false;
  const cd = cooldownsOf(attacker);
  return now >= cd.skillAt && now >= num(attacker.busyUntil);
}

// ---------------------------------------------------------------- 扇击

function slapTargets(state, attacker, g) {
  const out = [];
  for (const p of opponentsOf(state, attacker)) {
    const dir = horizDir(attacker, p);
    const reach = g.slapRange + num(state && state.playerRadius, ARENA.playerRadius);
    if (dir.dist > reach) continue;
    if (Math.abs(num(p.y) - num(attacker.y)) > HIT.reachHeight) continue;
    if (!inCone(attacker, p, g.slapAngleDeg)) continue;
    out.push({ p, dir, reach });
  }
  out.sort((a, b) => a.dir.dist - b.dir.dist);
  return out;
}

function doSlap(state, attacker, g, now, chargeCooldown) {
  const hits = [];
  if (chargeCooldown) {
    const cd = cooldownsOf(attacker);
    cd.slapAt = now + g.slapCooldown;
    attacker.busyUntil = Math.max(num(attacker.busyUntil), now + g.windup + g.recovery);
    attacker.windupUntil = now + g.windup;
    attacker.recoverUntil = now + g.windup + g.recovery;
    attacker.lastSlapAt = now;
    attacker.slapSeq = num(attacker.slapSeq) + 1;
  }

  // 木棉觉醒：连挥第 3 下变强击退。
  let extraMul = 1;
  let extraLift = 0;
  let thirdHit = false;
  if (g.skillId === "none" && g.awakened) {
    attacker.cottonChain = num(attacker.cottonChain) + 1;
    if (attacker.cottonChain % 3 === 0) {
      thirdHit = true;
      extraMul = SKILLS.none.awakenThirdHitMul;
      extraLift = SKILLS.none.awakenThirdHitLift;
    }
  }

  const found = slapTargets(state, attacker, g);
  for (const { p, dir } of found) {
    // 贴脸满伤，够到边缘只有 (1 - closeBonus) 倍。
    const closeness = clamp01(1 - dir.dist / Math.max(0.001, g.slapRange));
    const power = g.slapPower * (1 - HIT.closeBonus + HIT.closeBonus * closeness);
    const hit = landHit(state, attacker, p, {
      power,
      lift: Math.min(HIT.liftMax, power * HIT.liftRatio) + extraLift,
      now,
      kind: "slap",
      skillId: null,
      dirOverride: dir,
      behind: isBehind(attacker, p),
      extraMul,
      meterDealt: METER.onHitDealt,
      meterTaken: METER.onHitTaken,
    });
    if (thirdHit) hit.thirdHit = true;
    hits.push(hit);
  }

  if (!found.length) {
    pushEvent(state, { type: "slapWhiff", attackerId: attacker.id, gloveId: g.id, t: now });
  }
  return hits;
}

/**
 * 扇击解算。命中即刻生效（冲量已写进目标速度）。
 * @returns {Array<{id:string, impulse:{x:number,y:number,z:number}}>}
 */
export function resolveSlap(state, attacker, glove, now = clockOf(state)) {
  if (!state || !attacker) return [];
  if (!actorReady(attacker)) return [];
  const g = applyAwaken(attacker, resolveGlove(state, attacker, glove));
  const cd = cooldownsOf(attacker);
  if (now < cd.slapAt || now < num(attacker.busyUntil)) return [];
  return doSlap(state, attacker, g, now, true);
}

/**
 * 带前摇的扇击：立刻进冷却与后摇，`windup` 之后由 tickStatuses 真正判定命中。
 * sim 想要「打空有后摇」的手感时用这个；要同步返回命中列表就用 resolveSlap。
 */
export function beginSlap(state, attacker, glove, now = clockOf(state)) {
  if (!state || !attacker || !actorReady(attacker)) return { ok: false, reason: "cannot-act" };
  const g = applyAwaken(attacker, resolveGlove(state, attacker, glove));
  const cd = cooldownsOf(attacker);
  if (now < cd.slapAt || now < num(attacker.busyUntil)) return { ok: false, reason: "cooldown" };
  cd.slapAt = now + g.slapCooldown;
  attacker.busyUntil = now + g.windup + g.recovery;
  attacker.windupUntil = now + g.windup;
  attacker.recoverUntil = now + g.windup + g.recovery;
  attacker.slapSeq = num(attacker.slapSeq) + 1;
  const c = combatOf(state);
  c.pending.push({ kind: "slap", at: now + g.windup, ownerId: attacker.id, gloveId: g.id, awakened: !!g.awakened });
  pushEvent(state, { type: "slapWindup", attackerId: attacker.id, gloveId: g.id, contactAt: now + g.windup, t: now });
  return { ok: true, contactAt: now + g.windup, recoverAt: attacker.recoverUntil };
}

// ---------------------------------------------------------------- 技能

/**
 * 主动技解算。木棉没有主动，返回 { ok:false, reason:'no-skill' }。
 * @returns {{ok:boolean, skillId:string, hits:Array, tiles:Array, reason?:string}}
 */
export function resolveSkill(state, attacker, glove, now = clockOf(state)) {
  const empty = (reason, skillId = "none") => ({ ok: false, skillId, reason, hits: [], tiles: [] });
  if (!state || !attacker) return empty("no-actor");
  if (!actorReady(attacker)) return empty("cannot-act");

  const g = applyAwaken(attacker, resolveGlove(state, attacker, glove));
  if (g.skillId === "none") return empty("no-skill", "none");

  const cd = cooldownsOf(attacker);
  if (now < cd.skillAt) return empty("cooldown", g.skillId);
  if (now < num(attacker.busyUntil)) return empty("busy", g.skillId);

  const cfg = skillConfig(g.skillId, !!g.awakened);
  const handler = SKILL_HANDLERS[g.skillId] || SKILL_HANDLERS.none;
  const result = handler({ state, attacker, glove: g, cfg, now, awakened: !!g.awakened });
  if (!result || result.ok === false) return result || empty("failed", g.skillId);

  cd.skillAt = now + g.skillCooldown;
  attacker.lastSkillAt = now;
  attacker.lastSkillId = g.skillId;
  refreshDerived(attacker);
  return { hits: [], tiles: [], ...result, awakened: !!g.awakened, cooldown: g.skillCooldown };
}

// ---------------------------------------------------------------- 每帧推进

function tickDashes(state, now, sink) {
  const c = combatOf(state);
  if (!c.dashes.length) return;
  const keep = [];
  for (const d of c.dashes) {
    const owner = playerById(state, d.ownerId);
    if (!owner || owner.alive === false) continue;
    if (now >= d.until) {
      owner.dashing = false;
      owner.vx = num(owner.vx) * 0.45;
      owner.vz = num(owner.vz) * 0.45;
      continue;
    }
    owner.vx = d.dirX * d.speed;
    owner.vz = d.dirZ * d.speed;
    owner.yaw = yawTo(d.dirX, d.dirZ);
    owner.dashing = true;

    for (const p of opponentsOf(state, owner)) {
      if (d.hitIds.filter((x) => x === p.id).length >= d.hitsPerTarget) continue;
      const dir = horizDir(owner, p);
      if (dir.dist > d.hitRadius + ARENA.playerRadius) continue;
      if (Math.abs(num(p.y) - num(owner.y)) > HIT.reachHeight) continue;
      d.hitIds.push(p.id);
      sink.hits.push(
        landHit(state, owner, p, {
          power: d.impulse,
          lift: d.lift,
          now,
          kind: "skill",
          skillId: "dashSlap",
          dirOverride: dir,
          meterDealt: METER.onSkillHit,
        }),
      );
    }
    keep.push(d);
  }
  c.dashes = keep;
}

function runPending(state, now, sink) {
  const c = combatOf(state);
  if (!c.pending.length) return;
  const keep = [];
  for (const q of c.pending) {
    if (num(q.at) > now) {
      keep.push(q);
      continue;
    }
    const owner = playerById(state, q.ownerId);
    if (q.kind === "meteorSlam") {
      const res = resolveMeteorImpact(state, owner, q, now);
      sink.hits.push(...res.hits);
      sink.tiles.push(...res.tiles);
    } else if (q.kind === "ghostSlap") {
      sink.hits.push(...resolveGhostSlap(state, owner, q, now));
    } else if (q.kind === "slap") {
      if (owner && actorReady(owner)) {
        const table = gloveTable(state);
        const base = normalizeGlove(table[q.gloveId] || FALLBACK_GLOVE_BY_ID[q.gloveId]);
        const g = q.awakened ? awakenedStats(base) : base;
        sink.hits.push(...doSlap(state, owner, g, now, false));
      }
    }
  }
  c.pending = keep;
}

function tickGhosts(state, dt) {
  const c = combatOf(state);
  if (!c.ghosts.length) return;
  c.ghosts = c.ghosts.filter((gh) => {
    gh.ttl = num(gh.ttl) - dt;
    return gh.ttl > 0;
  });
}

/**
 * 每帧推进：状态倒计时、掌意/击退累积衰减、觉醒计时、
 * 疾风冲刺接触判定、陨掌落地与残影假挥掌的延迟结算。
 * @returns {{t:number, hits:Array, tiles:Array}}
 */
export function tickStatuses(state, dt) {
  const sink = { hits: [], tiles: [] };
  if (!state || !(dt > 0)) return { t: clockOf(state), ...sink };

  const c = combatOf(state);
  const now = typeof state.t === "number" && Number.isFinite(state.t) ? state.t : c.clock + dt;
  c.clock = now;

  for (const p of playerList(state)) {
    if (!p) continue;
    if (p.alive === false) {
      if (Array.isArray(p.statuses) && p.statuses.length) clearAllStatuses(p);
      p.impact = 0;
      p.cottonChain = 0;
      p.awakenedT = 0;
      p.awakened = false;
      p.dashing = false;
      continue;
    }

    tickPlayerStatuses(p, dt);

    if (num(p.awakenedT) > 0) {
      p.awakenedT = Math.max(0, num(p.awakenedT) - dt);
      p.awakened = p.awakenedT > 0;
      if (!p.awakened) {
        p.cottonChain = 0;
        pushEvent(state, { type: "awakenEnd", playerId: p.id, t: now });
      }
    } else if (num(p.meter) >= 1) {
      applyAwaken(p, resolveGlove(state, p));
    }
    if (p.awakenFlash) {
      p.awakenFlash = false;
      pushEvent(state, { type: "awaken", playerId: p.id, gloveId: p.awakenGloveId || activeGloveId(p), duration: AWAKEN.duration, t: now });
    }

    if (num(p.knockbackT) > 0) p.knockbackT = Math.max(0, num(p.knockbackT) - dt);
    if (num(p.impact) > 0) p.impact = Math.max(0, num(p.impact) - IMPACT.decayPerSec * dt);
    if (num(p.awakenedT) <= 0 && num(p.meter) > 0) {
      p.meter = clamp01(num(p.meter) - METER.decayPerSec * dt);
    }
    if (p.dashing && now >= num(p.dashUntil)) p.dashing = false;
  }

  tickDashes(state, now, sink);
  runPending(state, now, sink);
  tickGhosts(state, dt);

  return { t: now, ...sink };
}

// ---------------------------------------------------------------- 辅助导出

/** 击杀记账：sim 判定掉落出局后调用，把功劳算给最后命中者。 */
export function creditKill(state, victim, now = clockOf(state), graceSeconds = 5) {
  if (!victim) return null;
  const killerId = victim.lastHitBy;
  const killer = killerId != null && killerId !== victim.id ? playerById(state, killerId) : null;
  const fresh = killer && now - num(victim.lastHitAt) <= graceSeconds;
  victim.deaths = num(victim.deaths) + 1;
  if (fresh) {
    killer.kills = num(killer.kills) + 1;
    gainMeter(killer, METER.onKill);
  }
  victim.impact = 0;
  victim.cottonChain = 0;
  clearAllStatuses(victim);
  pushEvent(state, { type: "kill", killerId: fresh ? killer.id : null, victimId: victim.id, t: now });
  return fresh ? killer.id : null;
}

/** 重组：清状态、给无敌帧。 */
export function respawn(state, player, now = clockOf(state), invulnTime = ARENA.invulnTime) {
  if (!player) return player;
  clearAllStatuses(player);
  player.alive = true;
  player.respawnT = 0;
  player.impact = 0;
  player.vx = 0;
  player.vy = 0;
  player.vz = 0;
  player.cd = { slapAt: 0, skillAt: 0 };
  player.busyUntil = 0;
  player.cottonChain = 0;
  applyStatus(player, "invuln", invulnTime, { srcId: player.id });
  pushEvent(state, { type: "respawn", playerId: player.id, t: now });
  return player;
}

export {
  AWAKEN,
  METER,
  IMPACT,
  HIT,
  SKILLS,
  STATUS_KINDS,
  FALLBACK_GLOVES,
  FALLBACK_GLOVE_BY_ID,
  applyStatus,
  clearAllStatuses,
  refreshDerived,
  statusSnapshot,
  skillConfig,
  steerDash,
  forwardFromYaw,
  rightFromYaw,
  yawTo,
  isBehind,
  inCone,
  horizDir,
  playerList,
  playerById,
  opponentsOf,
};
