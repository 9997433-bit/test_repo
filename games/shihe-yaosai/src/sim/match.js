// 纯模拟核心：不引入渲染层，不触碰任何浏览器全局。
// 固定步长推进，保证同 seed + 同输入序列 => 同结果。
//
// 数值全部来自 src/data 的正式出口（见 ./config.js），本文件只实现机制：
//   hitscan(rail) / beam(prism) / burst(scatter) / aura(well) / missile(star)
// 伤害在「开火 tick」即时结算（契约 §3.5），弹道与力场环纯属视觉。
import { createRng, nextFloat, nextInt, nextRange } from "./rng.js";
import { dist3, num0, pathLengths, polar, round4, socketAngle, TAU, wrapAngle } from "./geom.js";
import {
  MAX_SHOTS,
  MUZZLE_Y,
  SOCKET_HP,
  THETA_SPREAD,
  TOWER_IDS,
  resolveConfig,
  resolveCounters,
  resolveEnemies,
  resolveTowers,
  resolveWaves,
} from "./config.js";

export const FIXED_DT = 1 / 60;
const MAX_DT = 0.1; // 契约 simMaxDt：单次 step 的 dtSec 上限
const MAX_STEPS_PER_CALL = 900; // 单次 step 最多推进 15 秒模拟时间

// 纯视觉参数（不参与结算）
const TRACER_SEC = 0.14; // 轨炮曳光存活
const PELLET_SPEED = 70; // 霰星弹丸视觉速度
const PULSE_SEC = 0.7; // 坠井脉冲环扩张时长
const AURA_PULSE_SEC = 1.1; // 坠井多久放一次脉冲环
const BEAM_SHIMMER = 2.5; // 棱镜光束的呼吸频率（周期/秒）

function makeSocket(i, cfg) {
  const theta = socketAngle(i, cfg.socketCount);
  const p = polar(theta, cfg.ringRadius, cfg.muzzleY);
  return {
    i,
    theta,
    x: p.x,
    y: p.y,
    z: p.z,
    muzzle: { x: p.x, y: p.y, z: p.z },
    towerId: null,
    level: 1,
    cooldown: 0,
    overclockT: 0,
    overheatT: 0,
    hp: 0,
    aim: null,
    beam: null,
    fieldId: 0,
    kills: 0,
    damage: 0,
    shots: 0,
  };
}

/** 创建一局。options.waveCount 可裁剪波数（冒烟只跑 5 波）。 */
export function createMatch(seed = 1, options = {}) {
  const opts = options && typeof options === "object" ? options : {};
  const cfg = resolveConfig();
  const waves = resolveWaves(opts.waveCount);

  const sockets = [];
  for (let i = 0; i < cfg.socketCount; i += 1) sockets.push(makeSocket(i, cfg));

  return {
    seed,
    rng: createRng(seed),
    cfg,
    towers: resolveTowers(),
    counters: resolveCounters(),
    enemyTypes: resolveEnemies(),
    waves,
    waveCount: waves.length,
    time: 0,
    tick: 0,
    accumulator: 0,
    phase: "prep",
    phaseT: cfg.firstWaveSec,
    wave: 1,
    waveTime: 0,
    pending: [],
    spawnedThisWave: 0,
    scrap: cfg.startScrap,
    coreHp: cfg.coreHp,
    coreMax: cfg.coreHp,
    sockets,
    enemies: [],
    shots: [],
    fields: [],
    events: [],
    paused: false,
    over: false,
    result: null,
    selectedSocket: null,
    nextEnemyId: 1,
    nextShotId: 1,
    nextFieldId: 1,
    stats: { kills: 0, leaks: 0, placed: 0, denied: 0, damage: 0, spawned: 0, wavesCleared: 0 },
  };
}

// ---------------------------------------------------------------- 输入处理

function deny(match, events, reason, extra) {
  match.stats.denied += 1;
  const e = { type: "deny", reason, t: round4(match.time) };
  if (extra) Object.assign(e, extra);
  events.push(e);
}

function tryPlace(match, place, events) {
  if (!place || typeof place !== "object") return;
  const idx = Math.round(Number(place.socket));
  const towerId = place.towerId;
  if (match.over) return deny(match, events, "over", { socket: idx, towerId });
  if (!Number.isInteger(idx) || idx < 0 || idx >= match.sockets.length) {
    return deny(match, events, "badSocket", { socket: place.socket, towerId });
  }
  const spec = typeof towerId === "string" ? match.towers[towerId] : null;
  if (!spec) return deny(match, events, "unknownTower", { socket: idx, towerId });
  const socket = match.sockets[idx];
  if (socket.towerId) return deny(match, events, "occupied", { socket: idx, towerId });
  if (match.scrap < spec.cost) return deny(match, events, "scrap", { socket: idx, towerId, cost: spec.cost });

  match.scrap -= spec.cost;
  socket.towerId = spec.id;
  socket.level = 1;
  socket.hp = SOCKET_HP;
  socket.cooldown = spec.kind === "aura" ? 0 : spec.cd * 0.35;
  socket.overclockT = 0;
  socket.overheatT = 0;
  if (spec.kind === "aura" && socket.fieldId === 0) socket.fieldId = match.nextFieldId++;
  match.stats.placed += 1;
  events.push({ type: "place", socket: idx, towerId: spec.id, cost: spec.cost, t: round4(match.time) });
}

function tryOverclock(match, socketIndex, events) {
  const idx = Math.round(Number(socketIndex));
  if (match.over) return deny(match, events, "over", { socket: idx });
  if (!Number.isInteger(idx) || idx < 0 || idx >= match.sockets.length) {
    return deny(match, events, "badSocket", { socket: socketIndex });
  }
  const socket = match.sockets[idx];
  if (!socket.towerId) return deny(match, events, "empty", { socket: idx });
  if (socket.overheatT > 0) return deny(match, events, "overheat", { socket: idx });
  if (socket.overclockT > 0) return deny(match, events, "busy", { socket: idx });
  socket.overclockT = match.cfg.overclockSec;
  events.push({
    type: "overclock",
    socket: idx,
    towerId: socket.towerId,
    sec: round4(match.cfg.overclockSec),
    t: round4(match.time),
  });
}

// ---------------------------------------------------------------- 敌人

function enemyPos(match, e) {
  return polar(e.theta, e.radius, e.y);
}

function spawnEnemy(match, entry, events) {
  const base = match.enemyTypes[entry.kind];
  if (!base) return;
  const cfg = match.cfg;
  const lane = base.lane !== null && base.lane !== undefined ? base.lane : entry.lane;
  const laneIdx = lane >= 0 && lane < cfg.laneY.length ? lane : 0;
  const hp = Math.max(1, Math.ceil(base.hp * entry.hpMul));
  const e = {
    id: match.nextEnemyId++,
    kind: base.kind,
    name: base.name,
    sizeClass: base.sizeClass,
    scale: base.scale,
    lane: laneIdx,
    theta: entry.theta,
    drift: entry.drift,
    radius: cfg.spawnRadius,
    y: cfg.laneY[laneIdx],
    hp,
    maxHp: hp,
    armor: base.armor,
    speed0: base.speed,
    baseSpeed: base.speed,
    slow: 1,
    bounty: base.bounty,
    leak: base.leak,
    boss: base.boss,
    phases: base.phases,
    phaseIndex: base.phases ? 0 : -1,
    killedBy: null,
    wave: entry.wave,
  };
  match.enemies.push(e);
  match.stats.spawned += 1;
  events.push({
    type: "spawn",
    id: e.id,
    kind: e.kind,
    lane: e.lane,
    wave: e.wave,
    boss: e.boss,
    t: round4(match.time),
  });
}

function creditKill(match, e, events) {
  match.scrap += e.bounty;
  match.stats.kills += 1;
  const by = e.killedBy;
  const socket = by && Number.isInteger(by.socket) ? match.sockets[by.socket] : null;
  if (socket) socket.kills += 1;
  const p = enemyPos(match, e);
  events.push({
    type: "kill",
    id: e.id,
    kind: e.kind,
    lane: e.lane,
    scrap: e.bounty,
    by: by ? by.towerId : null,
    socket: by && Number.isInteger(by.socket) ? by.socket : null,
    x: round4(p.x),
    y: round4(p.y),
    z: round4(p.z),
    t: round4(match.time),
  });
}

function leakEnemy(match, e, index, events) {
  match.enemies.splice(index, 1);
  match.coreHp -= e.leak;
  match.stats.leaks += 1;
  events.push({
    type: "leak",
    id: e.id,
    kind: e.kind,
    lane: e.lane,
    damage: e.leak,
    coreHp: Math.max(0, round4(match.coreHp)),
    t: round4(match.time),
  });
  if (match.coreHp <= 0 && !match.over) {
    match.coreHp = 0;
    match.over = true;
    match.result = "lose";
    match.phase = "lost";
    events.push({ type: "lose", wave: match.wave, t: round4(match.time) });
  }
}

function applyDamage(match, e, raw, towerId, socketIndex) {
  if (e.hp <= 0 || !(raw > 0)) return 0;
  const row = match.counters[towerId];
  const mul = row && typeof row[e.armor] === "number" ? row[e.armor] : 1;
  const dealt = raw * mul;
  if (!(dealt > 0)) return 0;
  e.hp -= dealt;
  match.stats.damage += dealt;
  const socket = match.sockets[socketIndex];
  if (socket) socket.damage += dealt;
  if (e.hp <= 0) {
    e.hp = 0;
    if (!e.killedBy) e.killedBy = { towerId, socket: socketIndex };
  }
  return dealt;
}

function reapDead(match, events) {
  let dead = false;
  for (const e of match.enemies) {
    if (e.hp <= 0) {
      dead = true;
      break;
    }
  }
  if (!dead) return;
  const alive = [];
  for (const e of match.enemies) {
    if (e.hp > 0) alive.push(e);
    else creditKill(match, e, events);
  }
  match.enemies = alive;
}

/** 蚀主按血量百分比切相位：换护甲、提速、召唤小怪。 */
function updateBossPhases(match, events) {
  for (const e of match.enemies) {
    if (!e.phases || e.hp <= 0) continue;
    const pct = e.hp / e.maxHp;
    let idx = 0;
    for (let i = 0; i < e.phases.length; i += 1) {
      if (pct <= e.phases[i].hpPct) idx = i;
    }
    if (idx === e.phaseIndex) continue;
    e.phaseIndex = idx;
    const phase = e.phases[idx];
    e.armor = phase.armor;
    e.baseSpeed = e.speed0 * phase.speedMul;
    if (phase.summon && phase.summon.count > 0 && match.enemyTypes[phase.summon.kind]) {
      enqueueSummon(match, phase.summon);
    }
    events.push({
      type: "phase",
      id: e.id,
      kind: e.kind,
      phase: idx + 1,
      armor: e.armor,
      t: round4(match.time),
    });
  }
}

function enqueueSummon(match, summon) {
  const cfg = match.cfg;
  const arc = socketAngle(nextInt(match.rng, cfg.socketCount), cfg.socketCount);
  let seq = match.pending.length;
  for (let k = 0; k < summon.count; k += 1) {
    match.pending.push({
      seq: seq++,
      at: match.waveTime + k * summon.interval,
      kind: summon.kind,
      lane: summon.lane,
      theta: wrapAngle(arc + (nextFloat(match.rng) - 0.5) * THETA_SPREAD),
      drift: (nextFloat(match.rng) < 0.5 ? -1 : 1) * nextRange(match.rng, 0.01, 0.05),
      hpMul: 1,
      wave: match.wave,
    });
  }
  match.pending.sort((a, b) => a.at - b.at || a.seq - b.seq);
}

// ---------------------------------------------------------------- 索敌

function inLane(spec, e) {
  return !spec.lanes || spec.lanes.length === 0 || spec.lanes.indexOf(e.lane) >= 0;
}

/**
 * 契约 §3.4：射程内取 radius 最小者，平局取 id 最小。
 * targeting === 'maxHp' 时先比当前血量（星弩点名精英/Boss）。
 */
function acquireTarget(match, origin, spec, excludeId) {
  let best = null;
  let bestScore = 0;
  for (const e of match.enemies) {
    if (e.hp <= 0) continue;
    if (excludeId !== null && e.id === excludeId) continue;
    if (!inLane(spec, e)) continue;
    if (dist3(origin, enemyPos(match, e)) > spec.range) continue;
    const score = spec.targeting === "maxHp" ? e.hp : -e.radius;
    if (best === null || score > bestScore || (score === bestScore && e.id < best.id)) {
      best = e;
      bestScore = score;
    }
  }
  return best;
}

function aimAt(socket, point) {
  socket.aim = Math.atan2(point.z - socket.z, point.x - socket.x);
}

// ---------------------------------------------------------------- 弹道（纯视觉）

function shotLife(spec, total) {
  switch (spec.shotKind) {
    case "pellet":
      return Math.max(0.08, total / PELLET_SPEED);
    case "arc":
      return spec.projectileSpeed > 0 ? Math.max(0.1, total / spec.projectileSpeed) : 0.4;
    case "pulse":
      return PULSE_SEC;
    default:
      return TRACER_SEC;
  }
}

function attachShot(match, shot) {
  while (match.shots.length >= MAX_SHOTS) {
    const dropped = match.shots.shift();
    if (dropped && dropped.beam) {
      const owner = match.sockets[dropped.socket];
      if (owner && owner.beam === dropped) owner.beam = null;
    }
  }
  match.shots.push(shot);
}

function pushShot(match, socket, spec, points, extra) {
  const { total } = pathLengths(points);
  const shot = {
    id: match.nextShotId++,
    kind: spec.shotKind,
    towerId: spec.id,
    socket: socket.i,
    points,
    life: shotLife(spec, total),
    age: 0,
    t: 0,
    beam: false,
    radius: 0,
    relay: null,
    targetId: 0,
    overclocked: socket.overclockT > 0,
  };
  if (extra) Object.assign(shot, extra);
  attachShot(match, shot);
  return shot;
}

/** 棱镜光束是常驻实体：同一座塔持续开火时 id 不变，渲染层不必反复建/毁网格。 */
function updateBeam(match, socket, spec, points, relayIndex, dt) {
  let beam = socket.beam;
  if (!beam) {
    beam = {
      id: match.nextShotId++,
      kind: spec.shotKind,
      towerId: spec.id,
      socket: socket.i,
      points,
      life: 0,
      age: 0,
      t: 0,
      beam: true,
      radius: 0,
      relay: null,
      targetId: 0,
      overclocked: false,
    };
    socket.beam = beam;
    socket.shots += 1;
    attachShot(match, beam);
  }
  beam.points = points;
  beam.relay = relayIndex;
  beam.overclocked = socket.overclockT > 0;
  beam.t = (beam.t + dt * BEAM_SHIMMER) % 1;
}

function releaseBeam(match, socket) {
  if (!socket.beam) return;
  const idx = match.shots.indexOf(socket.beam);
  if (idx >= 0) match.shots.splice(idx, 1);
  socket.beam = null;
}

function updateShots(match, dt) {
  for (let i = match.shots.length - 1; i >= 0; i -= 1) {
    const shot = match.shots[i];
    if (shot.beam) continue;
    shot.age += dt;
    if (shot.age >= shot.life) {
      match.shots.splice(i, 1);
      continue;
    }
    shot.t = shot.life > 0 ? shot.age / shot.life : 1;
  }
}

// ---------------------------------------------------------------- 开火

function fireSingle(match, socket, spec, mul) {
  const target = acquireTarget(match, socket.muzzle, spec, null);
  if (!target) return false;
  const pos = enemyPos(match, target);
  aimAt(socket, pos);
  applyDamage(match, target, spec.damage * mul, spec.id, socket.i);
  pushShot(match, socket, spec, [socket.muzzle, pos], { targetId: target.id });
  socket.shots += 1;
  return true;
}

/** 霰星：以主目标为中心，aoeRadius 内 radius 最小的至多 maxTargets 个各吃一次伤害。 */
function fireBurst(match, socket, spec, mul) {
  const primary = acquireTarget(match, socket.muzzle, spec, null);
  if (!primary) return false;
  const center = enemyPos(match, primary);
  aimAt(socket, center);

  const hits = [];
  for (const e of match.enemies) {
    if (e.hp <= 0 || !inLane(spec, e)) continue;
    const p = enemyPos(match, e);
    if (e.id !== primary.id && dist3(center, p) > spec.aoeRadius) continue;
    hits.push({ e, p });
  }
  hits.sort((a, b) => a.e.radius - b.e.radius || a.e.id - b.e.id);

  const count = Math.min(hits.length, spec.maxTargets);
  for (let i = 0; i < count; i += 1) {
    applyDamage(match, hits[i].e, spec.damage * mul, spec.id, socket.i);
    pushShot(match, socket, spec, [socket.muzzle, hits[i].p], { targetId: hits[i].e.id });
  }
  socket.shots += 1;
  return true;
}

/**
 * 棱镜：段1 打主目标，段2 经另一座棱镜折射后打次目标（伤害 × refractFalloff）。
 * 折射判定为「主目标距另一座棱镜炮口 ≤ refractRange」，取最近者，只折一次。
 */
function fireBeam(match, socket, spec, mul, dt) {
  const target = acquireTarget(match, socket.muzzle, spec, null);
  if (!target) {
    releaseBeam(match, socket);
    return;
  }
  const aPos = enemyPos(match, target);
  aimAt(socket, aPos);

  const tickDamage = spec.dps * dt * mul;
  applyDamage(match, target, tickDamage, spec.id, socket.i);

  const points = [socket.muzzle, aPos];
  let relayIndex = null;
  if (spec.refractRange > 0) {
    let relay = null;
    let relayDist = Infinity;
    for (const other of match.sockets) {
      if (other.i === socket.i || other.towerId !== spec.id) continue;
      const d = dist3(aPos, other.muzzle);
      if (d <= spec.refractRange && d < relayDist) {
        relay = other;
        relayDist = d;
      }
    }
    if (relay) {
      const second = acquireTarget(match, relay.muzzle, spec, target.id);
      if (second) {
        applyDamage(match, second, tickDamage * spec.refractFalloff, spec.id, socket.i);
        points.push(enemyPos(match, second));
        relayIndex = relay.i;
      }
    }
  }
  updateBeam(match, socket, spec, points, relayIndex, dt);
}

/** 坠井：射程内全体持续掉血；减速在 applySlow 里统一取最大值，不叠乘。 */
function fireAura(match, socket, spec, mul, dt) {
  const tickDamage = spec.dps * dt * mul;
  for (const e of match.enemies) {
    if (e.hp <= 0 || !inLane(spec, e)) continue;
    if (dist3(socket.muzzle, enemyPos(match, e)) > spec.range) continue;
    applyDamage(match, e, tickDamage, spec.id, socket.i);
  }
  socket.cooldown -= dt;
  if (socket.cooldown <= 0) {
    socket.cooldown = AURA_PULSE_SEC;
    pushShot(match, socket, spec, [socket.muzzle, socket.muzzle], { radius: spec.range });
    socket.shots += 1;
  }
}

// ---------------------------------------------------------------- 每 tick 阶段

function updateTimers(match, dt, events) {
  for (const socket of match.sockets) {
    if (!socket.towerId) continue;
    if (socket.overclockT > 0) {
      socket.overclockT -= dt;
      if (socket.overclockT <= 0) {
        socket.overclockT = 0;
        socket.overheatT = match.cfg.overheatSec;
        events.push({
          type: "overheat",
          socket: socket.i,
          towerId: socket.towerId,
          sec: round4(match.cfg.overheatSec),
          t: round4(match.time),
        });
      }
    } else if (socket.overheatT > 0) {
      socket.overheatT -= dt;
      if (socket.overheatT <= 0) {
        socket.overheatT = 0;
        socket.cooldown = 0;
        events.push({ type: "ready", socket: socket.i, towerId: socket.towerId, t: round4(match.time) });
      }
    }
  }
}

function applySlow(match) {
  for (const e of match.enemies) e.slow = 1;
  for (const socket of match.sockets) {
    if (!socket.towerId || socket.overheatT > 0) continue;
    const spec = match.towers[socket.towerId];
    if (!spec || spec.kind !== "aura" || spec.slowMul >= 1) continue;
    for (const e of match.enemies) {
      if (!inLane(spec, e)) continue;
      if (dist3(socket.muzzle, enemyPos(match, e)) > spec.range) continue;
      if (spec.slowMul < e.slow) e.slow = spec.slowMul;
    }
  }
}

function moveEnemies(match, dt, events) {
  const leakR = match.cfg.coreRadius;
  for (let i = match.enemies.length - 1; i >= 0; i -= 1) {
    const e = match.enemies[i];
    if (e.hp <= 0) continue;
    e.radius -= e.baseSpeed * e.slow * dt;
    e.theta = wrapAngle(e.theta + e.drift * dt);
    if (e.radius <= leakR) {
      e.radius = leakR;
      leakEnemy(match, e, i, events);
    }
  }
}

function updateTowers(match, dt) {
  for (const socket of match.sockets) {
    socket.aim = null;
    if (!socket.towerId) {
      releaseBeam(match, socket);
      continue;
    }
    const spec = match.towers[socket.towerId];
    if (!spec) continue;
    if (socket.overheatT > 0) {
      releaseBeam(match, socket);
      continue;
    }
    const mul = socket.overclockT > 0 ? match.cfg.overclockMul : 1;
    if (spec.kind === "beam") {
      fireBeam(match, socket, spec, mul, dt);
      continue;
    }
    if (spec.kind === "aura") {
      fireAura(match, socket, spec, mul, dt);
      continue;
    }
    socket.cooldown -= dt;
    if (socket.cooldown > 0) continue;
    const fired = spec.kind === "burst" ? fireBurst(match, socket, spec, mul) : fireSingle(match, socket, spec, mul);
    socket.cooldown = fired ? spec.cd : 0;
  }
}

/** 坠井光环环：常驻可视化，id 跟插座绑定，渲染层可以增量更新。 */
function updateFields(match) {
  match.fields.length = 0;
  for (const socket of match.sockets) {
    if (!socket.towerId) continue;
    const spec = match.towers[socket.towerId];
    if (!spec || spec.kind !== "aura") continue;
    match.fields.push({
      id: socket.fieldId,
      socket: socket.i,
      x: socket.x,
      y: socket.y,
      z: socket.z,
      radius: spec.range,
      slowMul: spec.slowMul,
      active: socket.overheatT <= 0,
    });
  }
}

// ---------------------------------------------------------------- 波次

function buildWaveQueue(match, wave) {
  const rng = match.rng;
  const cfg = match.cfg;
  const queue = [];
  let seq = 0;
  for (const group of wave.groups) {
    // 同组共用一段入侵弧：成团推进才让霰星溅射与棱镜折光有意义。
    const arc = socketAngle(nextInt(rng, cfg.socketCount), cfg.socketCount);
    for (let k = 0; k < group.count; k += 1) {
      queue.push({
        seq: seq++,
        at: group.delay + k * group.interval,
        kind: group.kind,
        lane: group.lane,
        theta: wrapAngle(arc + (nextFloat(rng) - 0.5) * THETA_SPREAD),
        drift: (nextFloat(rng) < 0.5 ? -1 : 1) * nextRange(rng, 0.01, 0.05),
        hpMul: wave.hpMul,
        wave: wave.index,
      });
    }
  }
  queue.sort((a, b) => a.at - b.at || a.seq - b.seq);
  return queue;
}

function startWave(match, events) {
  const wave = match.waves[match.wave - 1];
  match.phase = "wave";
  match.phaseT = 0;
  match.waveTime = 0;
  match.pending = buildWaveQueue(match, wave);
  match.spawnedThisWave = 0;
  events.push({
    type: "waveStart",
    wave: wave.index,
    count: match.pending.length,
    boss: wave.boss,
    t: round4(match.time),
  });
  // 兼容 Round 1 消费方：'wave' 与 'waveStart' 同义。
  events.push({ type: "wave", wave: wave.index, count: match.pending.length, boss: wave.boss, t: round4(match.time) });
}

function updateWaves(match, dt, events) {
  if (match.over) return;
  if (match.phase === "prep") {
    match.phaseT -= dt;
    if (match.phaseT <= 0) {
      match.phaseT = 0;
      startWave(match, events);
    }
    return;
  }
  if (match.phase !== "wave") return;

  match.waveTime += dt;
  while (match.pending.length > 0 && match.pending[0].at <= match.waveTime) {
    spawnEnemy(match, match.pending.shift(), events);
    match.spawnedThisWave += 1;
  }
  if (match.pending.length > 0 || match.enemies.length > 0) return;

  const wave = match.waves[match.wave - 1];
  match.scrap += wave.bonus;
  match.stats.wavesCleared += 1;
  events.push({
    type: "waveClear",
    wave: wave.index,
    bonus: wave.bonus,
    scrap: Math.round(match.scrap),
    t: round4(match.time),
  });
  if (match.wave >= match.waveCount) {
    match.over = true;
    match.result = "win";
    match.phase = "won";
    events.push({ type: "win", wave: match.wave, coreHp: Math.max(0, round4(match.coreHp)), t: round4(match.time) });
  } else {
    match.wave += 1;
    match.phase = "prep";
    match.phaseT = match.cfg.interWaveSec;
  }
}

// ---------------------------------------------------------------- 主循环

function tickSim(match, dt, events) {
  match.time += dt;
  match.tick += 1;
  updateWaves(match, dt, events); // 1. 出怪
  updateTimers(match, dt, events); // 2. 过载 / 过热计时
  applySlow(match); // 3. 坠井减速（多井取最大，不叠乘）
  moveEnemies(match, dt, events); // 4. 推进与漏敌
  updateTowers(match, dt); // 5. 全塔结算伤害
  updateBossPhases(match, events); // 6. 蚀主相位
  reapDead(match, events); // 7. 统一结算击杀
  updateShots(match, dt); // 8. 弹道老化（纯视觉）
  updateFields(match); // 9. 力场环快照（纯视觉）
}

export function step(match, input = {}, dtSec = FIXED_DT) {
  if (!match || typeof match !== "object") throw new Error("step: match required");
  const events = [];
  const cmd = input && typeof input === "object" ? input : {};

  if (Number.isInteger(cmd.selectedSocket) || cmd.selectedSocket === null) {
    match.selectedSocket = cmd.selectedSocket;
  }
  if (cmd.place) tryPlace(match, cmd.place, events);
  if (Number.isFinite(cmd.overclockSocket)) tryOverclock(match, cmd.overclockSocket, events);

  match.paused = !!cmd.pause;
  if (match.paused || match.over) {
    match.events = events;
    return { events };
  }

  const raw = Number.isFinite(dtSec) && dtSec > 0 ? dtSec : 0;
  match.accumulator += raw > MAX_DT ? MAX_DT : raw;
  let steps = 0;
  while (match.accumulator >= FIXED_DT && steps < MAX_STEPS_PER_CALL) {
    match.accumulator -= FIXED_DT;
    steps += 1;
    tickSim(match, FIXED_DT, events);
    if (match.over) {
      match.accumulator = 0;
      break;
    }
  }
  if (steps >= MAX_STEPS_PER_CALL) match.accumulator = 0;

  match.events = events;
  return { events };
}

// ---------------------------------------------------------------- 视图

function viewPoint(p) {
  return { x: round4(p.x), y: round4(p.y), z: round4(p.z) };
}

const EMPTY_VIEW = {
  backend: "sim",
  time: 0,
  tick: 0,
  phase: "prep",
  phaseT: 0,
  status: "playing",
  interWaveT: 0,
  paused: false,
  over: false,
  result: null,
  wave: 0,
  waveCount: 0,
  waveTotal: 0,
  scrap: 0,
  coreHp: 0,
  coreMax: 0,
  coreRadius: 0,
  ringRadius: 0,
  spawnRadius: 0,
  laneY: [],
  selectedSocket: null,
  sockets: [],
  enemies: [],
  shots: [],
  fields: [],
  events: [],
  stats: { kills: 0, leaks: 0, placed: 0, denied: 0, spawned: 0, wavesCleared: 0, damage: 0 },
};

/**
 * 纯读快照。返回值恒为 JSON-pure：无 -0、无 NaN/Infinity、无 undefined、无类实例。
 * 所有数字都过 round4 / num0，因为 `JSON.stringify(-0) === "0"` 会让 JSON 往返不相等。
 */
export function getView(match) {
  if (!match || typeof match !== "object") return structuredCloneLike(EMPTY_VIEW);

  const cfg = match.cfg;
  const status = match.result === "win" ? "won" : match.result === "lose" ? "lost" : "playing";

  return {
    backend: "sim",
    time: round4(match.time),
    tick: num0(match.tick),
    phase: match.phase,
    phaseT: round4(match.phaseT),
    status,
    interWaveT: match.phase === "prep" ? round4(match.phaseT) : 0,
    paused: !!match.paused,
    over: !!match.over,
    result: match.result === undefined ? null : match.result,
    wave: num0(match.wave),
    waveCount: num0(match.waveCount),
    waveTotal: num0(match.waveCount),
    scrap: num0(Math.round(match.scrap)),
    coreHp: Math.max(0, round4(match.coreHp)),
    coreMax: round4(match.coreMax),
    coreRadius: round4(cfg.coreRadius),
    ringRadius: round4(cfg.ringRadius),
    spawnRadius: round4(cfg.spawnRadius),
    laneY: cfg.laneY.map(round4),
    selectedSocket: Number.isInteger(match.selectedSocket) ? match.selectedSocket : null,
    sockets: match.sockets.map((s) => {
      const spec = s.towerId ? match.towers[s.towerId] : null;
      return {
        i: num0(s.i),
        towerId: s.towerId === undefined ? null : s.towerId,
        level: num0(s.level),
        overclockT: round4(Math.max(0, s.overclockT)),
        overheatT: round4(Math.max(0, s.overheatT)),
        overclocked: s.overclockT > 0,
        overheat: s.overheatT > 0,
        overheated: s.overheatT > 0,
        hp: round4(s.hp),
        cooldown: round4(Math.max(0, s.cooldown)),
        cooldownT: round4(Math.max(0, s.cooldown)),
        range: spec ? round4(spec.range) : 0,
        theta: round4(s.theta),
        aim: s.aim === null || s.aim === undefined ? null : round4(s.aim),
        x: round4(s.x),
        y: round4(s.y),
        z: round4(s.z),
        kills: num0(s.kills),
      };
    }),
    enemies: match.enemies.map((e) => ({
      id: num0(e.id),
      lane: num0(e.lane),
      radius: round4(e.radius),
      y: round4(e.y),
      hp: round4(Math.max(0, e.hp)),
      maxHp: round4(e.maxHp),
      armor: e.armor,
      kind: e.kind,
      sizeClass: e.sizeClass,
      size: round4(e.scale),
      scale: round4(e.scale),
      theta: round4(e.theta),
      x: round4(Math.cos(e.theta) * e.radius),
      z: round4(Math.sin(e.theta) * e.radius),
      slow: round4(e.slow),
      slowed: e.slow < 1,
      boss: !!e.boss,
    })),
    shots: match.shots.map((s) => ({
      id: num0(s.id),
      kind: s.kind,
      towerId: s.towerId,
      socket: num0(s.socket),
      from: viewPoint(s.points[0]),
      to: viewPoint(s.points[s.points.length - 1]),
      points: s.points.map(viewPoint),
      t: round4(Math.min(1, Math.max(0, s.t))),
      radius: round4(s.radius),
      relay: Number.isInteger(s.relay) ? s.relay : null,
      beam: !!s.beam,
      overclocked: !!s.overclocked,
    })),
    fields: match.fields.map((f) => ({
      id: num0(f.id),
      socket: num0(f.socket),
      x: round4(f.x),
      y: round4(f.y),
      z: round4(f.z),
      radius: round4(f.radius),
      slowMul: round4(f.slowMul),
      active: !!f.active,
      t: round4((match.time / AURA_PULSE_SEC) % 1),
    })),
    events: (match.events || []).map((e) => ({ ...e })),
    stats: {
      kills: num0(match.stats.kills),
      leaks: num0(match.stats.leaks),
      placed: num0(match.stats.placed),
      denied: num0(match.stats.denied),
      spawned: num0(match.stats.spawned),
      wavesCleared: num0(match.stats.wavesCleared),
      damage: round4(match.stats.damage),
    },
  };
}

function structuredCloneLike(value) {
  return JSON.parse(JSON.stringify(value));
}

export const TOWER_LIST = TOWER_IDS.slice();
export { TAU, MUZZLE_Y };
