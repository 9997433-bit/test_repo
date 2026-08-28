// 纯模拟核心：不引入渲染层，不触碰任何浏览器全局。
// 固定步长推进，保证同 seed + 同输入序列 => 同结果。
import { createRng, nextFloat, nextInt, nextRange } from "./rng.js";
import { dist3, distPointSegment, lerpPoint, pathLengths, polar, round4, socketAngle, TAU } from "./geom.js";
import { resolveConfig, resolveCounters, resolveEnemies, resolveTowers, resolveWaves, TOWER_IDS } from "./config.js";

export const FIXED_DT = 1 / 60;
const MAX_STEPS_PER_CALL = 900; // 单次 step 最多推进 15 秒模拟时间
const SPLASH_FACTOR = 0.6;
const SOCKET_MUZZLE_Y = 2.4;
const SOCKET_HP = 100;

function makeSocket(i, cfg) {
  const theta = socketAngle(i, cfg.socketCount);
  const p = polar(theta, cfg.ringRadius, SOCKET_MUZZLE_Y);
  return {
    i,
    theta,
    x: p.x,
    y: p.y,
    z: p.z,
    towerId: null,
    cooldown: 0,
    overclockT: 0,
    overheatT: 0,
    hp: SOCKET_HP,
    kills: 0,
    damage: 0,
    shots: 0,
  };
}

/** 创建一局。options.waveCount 可裁剪波数（Round 1 冒烟只跑 5 波）。 */
export function createMatch(seed = 1, options = {}) {
  const cfg = resolveConfig();
  const towers = resolveTowers();
  const counters = resolveCounters();
  const enemyTypes = resolveEnemies();
  const requested = Number.isFinite(options.waveCount) ? Math.max(1, Math.round(options.waveCount)) : cfg.waveCount;
  const waves = resolveWaves(requested);

  const sockets = [];
  for (let i = 0; i < cfg.socketCount; i += 1) sockets.push(makeSocket(i, cfg));

  const match = {
    seed,
    rng: createRng(seed),
    cfg,
    towers,
    counters,
    enemyTypes,
    waves,
    waveCount: waves.length,
    time: 0,
    tick: 0,
    accumulator: 0,
    phase: "prep",
    phaseT: cfg.firstPrepSec,
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
  return match;
}

// ---------------------------------------------------------------- 输入处理

function towerSpec(match, towerId) {
  return typeof towerId === "string" ? match.towers[towerId] || null : null;
}

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
  const spec = towerSpec(match, towerId);
  if (!spec) return deny(match, events, "unknownTower", { socket: idx, towerId });
  const socket = match.sockets[idx];
  if (socket.towerId) return deny(match, events, "occupied", { socket: idx, towerId });
  if (match.scrap < spec.cost) return deny(match, events, "scrap", { socket: idx, towerId, cost: spec.cost });
  match.scrap -= spec.cost;
  socket.towerId = spec.id;
  socket.cooldown = spec.cd * 0.35;
  socket.overclockT = 0;
  socket.overheatT = 0;
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
  events.push({ type: "overclock", socket: idx, towerId: socket.towerId, sec: match.cfg.overclockSec, t: round4(match.time) });
}

// ---------------------------------------------------------------- 敌人

function enemyPos(match, e) {
  return polar(e.theta, effectiveRadius(match, e), e.y);
}

function effectiveRadius(match, e) {
  const r = e.radius + e.rOffset;
  return r < 0 ? 0 : r;
}

function spawnEnemy(match, entry, events) {
  const base = match.enemyTypes[entry.kind] || match.enemyTypes.small;
  const hp = Math.max(1, Math.round(base.hp * entry.hpScale));
  const lane = entry.lane;
  const e = {
    id: match.nextEnemyId++,
    kind: base.kind,
    lane,
    theta: entry.theta,
    thetaDrift: entry.thetaDrift,
    radius: match.cfg.spawnRadius,
    rOffset: 0,
    y: match.cfg.laneY[lane] !== undefined ? match.cfg.laneY[lane] : 0,
    hp,
    maxHp: hp,
    armor: base.armor,
    baseSpeed: base.speed * entry.speedScale,
    speedMul: 1,
    slowT: 0,
    scrap: base.scrap,
    leak: base.leak,
    size: base.size,
    wave: entry.wave,
  };
  match.enemies.push(e);
  match.stats.spawned += 1;
  events.push({ type: "spawn", id: e.id, kind: e.kind, lane: e.lane, wave: e.wave, t: round4(match.time) });
}

function killEnemy(match, e, index, events, byTower, bySocket) {
  match.enemies.splice(index, 1);
  match.scrap += e.scrap;
  match.stats.kills += 1;
  const credited = Number.isInteger(bySocket) ? match.sockets[bySocket] : null;
  if (credited) credited.kills += 1;
  events.push({
    type: "kill",
    id: e.id,
    kind: e.kind,
    lane: e.lane,
    scrap: e.scrap,
    by: byTower || null,
    x: round4(Math.cos(e.theta) * effectiveRadius(match, e)),
    y: round4(e.y),
    z: round4(Math.sin(e.theta) * effectiveRadius(match, e)),
    t: round4(match.time),
  });
}

function leakEnemy(match, e, index, events) {
  match.enemies.splice(index, 1);
  match.coreHp -= e.leak;
  match.stats.leaks += 1;
  events.push({ type: "leak", id: e.id, kind: e.kind, lane: e.lane, damage: e.leak, coreHp: Math.max(0, match.coreHp), t: round4(match.time) });
  if (match.coreHp <= 0 && !match.over) {
    match.coreHp = 0;
    match.over = true;
    match.result = "lose";
    match.phase = "lost";
    events.push({ type: "lose", wave: match.wave, t: round4(match.time) });
  }
}

function damageEnemy(match, e, rawDmg, towerId, events) {
  const table = match.counters[towerId] || { shell: 1, shield: 1, swarm: 1 };
  const mul = typeof table[e.armor] === "number" ? table[e.armor] : 1;
  const dealt = rawDmg * mul;
  e.hp -= dealt;
  match.stats.damage += dealt;
  return dealt;
}

// ---------------------------------------------------------------- 索敌

function inRange(match, socket, spec, e) {
  return dist3(socket, enemyPos(match, e)) <= spec.range;
}

function acquireTarget(match, socket, spec, excludeId) {
  const list = match.enemies;
  let best = null;
  let bestScore = 0;
  for (let i = 0; i < list.length; i += 1) {
    const e = list[i];
    if (excludeId && e.id === excludeId) continue;
    const p = enemyPos(match, e);
    const d = dist3(socket, p);
    if (d > spec.range) continue;
    let score;
    switch (spec.targeting) {
      case "first": // 最靠近星核的先打
        score = 1000 - effectiveRadius(match, e);
        break;
      case "nearest":
        score = 1000 - d;
        break;
      case "cluster": {
        // 周围同伴最多的目标，配合溅射
        const r = Math.max(spec.splash, 6);
        let n = 0;
        for (let j = 0; j < list.length; j += 1) {
          if (dist3(p, enemyPos(match, list[j])) <= r) n += 1;
        }
        score = n * 100 + (1000 - d) * 0.01;
        break;
      }
      case "fastest":
        score = e.baseSpeed * e.speedMul * 100 + (1000 - d) * 0.001;
        break;
      case "strongest":
        score = e.hp + (1000 - effectiveRadius(match, e)) * 0.01;
        break;
      default:
        score = 1000 - d;
        break;
    }
    if (best === null || score > bestScore) {
      best = e;
      bestScore = score;
    }
  }
  return best;
}

// ---------------------------------------------------------------- 开火

function makeShot(match, socket, spec, points, hits, extra) {
  const { segs, total } = pathLengths(points);
  const shot = {
    id: match.nextShotId++,
    kind: spec.shotKind || spec.id,
    towerId: spec.id,
    socket: socket.i,
    points: points.map((p) => ({ x: p.x, y: p.y, z: p.z })),
    segs,
    total: Math.max(total, 0.001),
    speed: spec.projSpeed,
    traveled: 0,
    t: 0,
    hits,
    homing: !!spec.homing,
    overclocked: socket.overclockT > 0,
  };
  if (extra) Object.assign(shot, extra);
  match.shots.push(shot);
  socket.shots += 1;
  return shot;
}

/** 棱镜折光：主光束若经过另一座棱镜 18 单位内，折一次（共 2 段）。 */
function prismPath(match, socket, spec, target) {
  const start = { x: socket.x, y: socket.y, z: socket.z };
  const targetPos = enemyPos(match, target);
  const hits = [{ dist: dist3(start, targetPos), targetId: target.id, dmg: 0, splash: 0 }];
  const points = [start, targetPos];
  if (match.cfg.prismMaxSegments < 2) return { points, hits, relayId: null };

  let relay = null;
  let relayDist = Infinity;
  for (let i = 0; i < match.sockets.length; i += 1) {
    const s = match.sockets[i];
    if (s.i === socket.i || s.towerId !== "prism") continue;
    const d = distPointSegment(s, start, targetPos);
    if (d <= match.cfg.prismBendRadius && d < relayDist) {
      relay = s;
      relayDist = d;
    }
  }
  if (!relay) return { points, hits, relayId: null };

  // 折射优先打另一个目标；没有第二个目标时，折回主目标补一段弱光。
  let second = acquireTarget(match, relay, spec, target.id);
  if (!second && dist3(relay, targetPos) <= spec.range) second = target;
  if (!second) return { points, hits, relayId: null };

  const relayPos = { x: relay.x, y: relay.y, z: relay.z };
  const secondPos = enemyPos(match, second);
  const bent = [start, relayPos, secondPos];
  const d1 = dist3(start, relayPos);
  const d2 = dist3(relayPos, secondPos);
  return {
    points: bent,
    hits: [
      { dist: d1, targetId: target.id, dmg: 0, splash: 0 },
      { dist: d1 + d2, targetId: second.id, dmg: 0, splash: 0, factor: match.cfg.prismRelayFactor },
    ],
    relayId: relay.i,
  };
}

function fire(match, socket, spec, events) {
  const target = acquireTarget(match, socket, spec, null);
  if (!target) return false;
  const dmgMul = socket.overclockT > 0 ? match.cfg.overclockMul : 1;
  const baseDmg = spec.dmg * dmgMul;
  const start = { x: socket.x, y: socket.y, z: socket.z };

  if (spec.id === "prism") {
    const path = prismPath(match, socket, spec, target);
    for (const hit of path.hits) hit.dmg = baseDmg * (hit.factor || 1);
    makeShot(match, socket, spec, path.points, path.hits, { relay: path.relayId, targetId: target.id });
    return true;
  }

  const targetPos = enemyPos(match, target);
  const hits = [
    {
      dist: dist3(start, targetPos),
      targetId: target.id,
      dmg: baseDmg,
      splash: spec.splash,
      field: spec.id === "well" ? { radius: spec.fieldRadius, sec: spec.fieldSec, slowMul: spec.slowMul, pullRate: spec.pullRate, pullMax: spec.pullMax } : null,
    },
  ];
  makeShot(match, socket, spec, [start, targetPos], hits, { targetId: target.id });
  return true;
}

// ---------------------------------------------------------------- 弹道推进

function impact(match, shot, hit, events) {
  const point = shot.points[shot.points.length - 1];
  const hitPoint = shot.hits.length > 1 && hit === shot.hits[0] ? shot.points[1] : point;
  let primary = null;
  let primaryIndex = -1;
  for (let i = 0; i < match.enemies.length; i += 1) {
    if (match.enemies[i].id === hit.targetId) {
      primary = match.enemies[i];
      primaryIndex = i;
      break;
    }
  }
  const center = primary ? enemyPos(match, primary) : hitPoint;

  if (primary) {
    damageEnemy(match, primary, hit.dmg, shot.towerId, events);
  }
  if (hit.splash > 0) {
    for (let i = 0; i < match.enemies.length; i += 1) {
      const e = match.enemies[i];
      if (primary && e.id === primary.id) continue;
      if (dist3(center, enemyPos(match, e)) <= hit.splash) {
        damageEnemy(match, e, hit.dmg * SPLASH_FACTOR, shot.towerId, events);
      }
    }
  }
  if (hit.field) {
    match.fields.push({
      id: match.nextFieldId++,
      x: center.x,
      y: center.y,
      z: center.z,
      radius: hit.field.radius,
      life: hit.field.sec,
      maxLife: hit.field.sec,
      slowMul: hit.field.slowMul,
      pullRate: hit.field.pullRate,
      pullMax: hit.field.pullMax,
      socket: shot.socket,
    });
  }
  // 死亡结算
  for (let i = match.enemies.length - 1; i >= 0; i -= 1) {
    if (match.enemies[i].hp <= 0) killEnemy(match, match.enemies[i], i, events, shot.towerId, shot.socket);
  }
  if (primaryIndex >= 0) {
    const socket = match.sockets[shot.socket];
    if (socket) socket.damage += hit.dmg;
  }
}

function updateShots(match, dt, events) {
  for (let i = match.shots.length - 1; i >= 0; i -= 1) {
    const shot = match.shots[i];
    if (shot.homing) {
      const target = match.enemies.find((e) => e.id === shot.hits[0].targetId);
      if (target) {
        const p = enemyPos(match, target);
        shot.points[shot.points.length - 1] = p;
        const { segs, total } = pathLengths(shot.points);
        shot.segs = segs;
        shot.total = Math.max(total, 0.001);
        shot.hits[0].dist = shot.total;
      }
    }
    shot.traveled += shot.speed * dt;
    shot.t = Math.min(1, shot.traveled / shot.total);
    for (let h = 0; h < shot.hits.length; h += 1) {
      const hit = shot.hits[h];
      if (!hit.done && shot.traveled >= hit.dist) {
        hit.done = true;
        impact(match, shot, hit, events);
      }
    }
    if (shot.traveled >= shot.total) {
      for (const hit of shot.hits) {
        if (!hit.done) {
          hit.done = true;
          impact(match, shot, hit, events);
        }
      }
      match.shots.splice(i, 1);
    }
  }
}

// ---------------------------------------------------------------- 塔与场

function updateSockets(match, dt, events) {
  for (const socket of match.sockets) {
    if (!socket.towerId) continue;
    const spec = match.towers[socket.towerId];
    if (!spec) continue;
    if (socket.overclockT > 0) {
      socket.overclockT -= dt;
      if (socket.overclockT <= 0) {
        socket.overclockT = 0;
        socket.overheatT = match.cfg.overheatSec;
        events.push({ type: "overheat", socket: socket.i, towerId: socket.towerId, sec: match.cfg.overheatSec, t: round4(match.time) });
      }
    }
    if (socket.overheatT > 0) {
      socket.overheatT -= dt;
      if (socket.overheatT <= 0) {
        socket.overheatT = 0;
        socket.cooldown = 0;
        events.push({ type: "ready", socket: socket.i, towerId: socket.towerId, t: round4(match.time) });
      }
      continue; // 过热期间完全停火
    }
    socket.cooldown -= dt;
    if (socket.cooldown <= 0) {
      if (fire(match, socket, spec, events)) socket.cooldown = spec.cd;
      else socket.cooldown = 0;
    }
  }
}

function updateFields(match, dt) {
  for (let i = match.fields.length - 1; i >= 0; i -= 1) {
    const f = match.fields[i];
    f.life -= dt;
    if (f.life <= 0) match.fields.splice(i, 1);
  }
}

function applyFields(match, dt) {
  for (const e of match.enemies) {
    let slow = 1;
    let pulled = false;
    const p = enemyPos(match, e);
    for (const f of match.fields) {
      if (dist3(p, f) <= f.radius) {
        if (f.slowMul < slow) slow = f.slowMul;
        // 坠井：降速为主，同时把轨道半径偏移微微往内拽
        const limit = -Math.abs(f.pullMax);
        e.rOffset = Math.max(limit, e.rOffset - f.pullRate * dt);
        pulled = true;
      }
    }
    e.speedMul = slow;
    e.slowT = slow < 1 ? 0.25 : Math.max(0, e.slowT - dt);
    if (!pulled && e.rOffset < 0) e.rOffset = Math.min(0, e.rOffset + 0.25 * dt);
  }
}

function moveEnemies(match, dt, events) {
  const leakR = match.cfg.coreRadius;
  for (let i = match.enemies.length - 1; i >= 0; i -= 1) {
    const e = match.enemies[i];
    e.radius -= e.baseSpeed * e.speedMul * dt;
    e.theta += e.thetaDrift * dt;
    if (e.theta > TAU) e.theta -= TAU;
    else if (e.theta < 0) e.theta += TAU;
    if (effectiveRadius(match, e) <= leakR) leakEnemy(match, e, i, events);
  }
}

// ---------------------------------------------------------------- 波次

function buildWaveQueue(match, wave) {
  const rng = match.rng;
  const flat = [];
  for (const group of wave.spawns) {
    for (let n = 0; n < group.count; n += 1) flat.push(group.kind);
  }
  // Fisher-Yates（Boss 固定压轴）
  const boss = flat.filter((k) => k === "etch-lord");
  const rest = flat.filter((k) => k !== "etch-lord");
  for (let i = rest.length - 1; i > 0; i -= 1) {
    const j = nextInt(rng, i + 1);
    const tmp = rest[i];
    rest[i] = rest[j];
    rest[j] = tmp;
  }
  const order = rest.concat(boss);
  const laneCount = match.cfg.laneY.length;
  // 每波挑几条入侵弧，同弧敌人成团推进：既好看，也让溅射/折光有意义。
  const arcCount = 2 + (wave.index % 3);
  const arcs = [];
  for (let i = 0; i < arcCount; i += 1) {
    arcs.push(socketAngle(nextInt(rng, match.cfg.socketCount), match.cfg.socketCount));
  }
  const queue = [];
  for (let i = 0; i < order.length; i += 1) {
    const lane = nextInt(rng, laneCount);
    const arc = arcs[nextInt(rng, arcs.length)];
    const jitter = nextRange(rng, -0.14, 0.14);
    queue.push({
      at: i * wave.interval,
      kind: order[i],
      lane,
      theta: arc + jitter,
      thetaDrift: (nextFloat(rng) < 0.5 ? -1 : 1) * nextRange(rng, 0.01, 0.05),
      hpScale: wave.hpScale,
      speedScale: wave.speedScale,
      wave: wave.index,
    });
  }
  return queue;
}

function startWave(match, events) {
  const wave = match.waves[match.wave - 1];
  match.phase = "wave";
  match.waveTime = 0;
  match.pending = buildWaveQueue(match, wave);
  match.spawnedThisWave = 0;
  events.push({ type: "wave", wave: wave.index, count: match.pending.length, boss: !!wave.boss, t: round4(match.time) });
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
    const entry = match.pending.shift();
    spawnEnemy(match, entry, events);
    match.spawnedThisWave += 1;
  }
  if (match.pending.length === 0 && match.enemies.length === 0) {
    const wave = match.waves[match.wave - 1];
    match.scrap += wave.bonus;
    match.stats.wavesCleared += 1;
    events.push({ type: "waveClear", wave: wave.index, bonus: wave.bonus, scrap: Math.round(match.scrap), t: round4(match.time) });
    if (match.wave >= match.waveCount) {
      match.over = true;
      match.result = "win";
      match.phase = "won";
      events.push({ type: "win", wave: match.wave, coreHp: match.coreHp, t: round4(match.time) });
    } else {
      match.wave += 1;
      match.phase = "prep";
      match.phaseT = match.cfg.prepSec;
    }
  }
}

// ---------------------------------------------------------------- 主循环

function tickSim(match, dt, events) {
  match.time += dt;
  match.tick += 1;
  updateWaves(match, dt, events);
  updateFields(match, dt);
  applyFields(match, dt);
  moveEnemies(match, dt, events);
  updateSockets(match, dt, events);
  updateShots(match, dt, events);
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

  const dt = Number.isFinite(dtSec) && dtSec > 0 ? dtSec : 0;
  match.accumulator += dt;
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

export function getView(match) {
  if (!match || typeof match !== "object") {
    return {
      backend: "sim",
      wave: 0,
      waveCount: 0,
      scrap: 0,
      coreHp: 0,
      coreMax: 0,
      sockets: [],
      enemies: [],
      shots: [],
      fields: [],
      events: [],
    };
  }
  const cfg = match.cfg;
  return {
    backend: "sim",
    time: round4(match.time),
    tick: match.tick,
    phase: match.phase,
    phaseT: round4(match.phaseT),
    paused: !!match.paused,
    over: !!match.over,
    result: match.result,
    wave: match.wave,
    waveCount: match.waveCount,
    scrap: Math.round(match.scrap),
    coreHp: Math.max(0, round4(match.coreHp)),
    coreMax: match.coreMax,
    coreRadius: cfg.coreRadius,
    ringRadius: cfg.ringRadius,
    spawnRadius: cfg.spawnRadius,
    laneY: cfg.laneY.slice(),
    selectedSocket: match.selectedSocket === undefined ? null : match.selectedSocket,
    sockets: match.sockets.map((s) => ({
      i: s.i,
      towerId: s.towerId,
      overclockT: round4(s.overclockT),
      overheatT: round4(s.overheatT),
      hp: s.hp,
      cooldown: round4(Math.max(0, s.cooldown)),
      range: s.towerId && match.towers[s.towerId] ? match.towers[s.towerId].range : 0,
      theta: round4(s.theta),
      x: round4(s.x),
      y: round4(s.y),
      z: round4(s.z),
      kills: s.kills,
    })),
    enemies: match.enemies.map((e) => {
      const r = effectiveRadius(match, e);
      return {
        id: e.id,
        lane: e.lane,
        radius: round4(r),
        y: round4(e.y),
        hp: round4(Math.max(0, e.hp)),
        maxHp: e.maxHp,
        armor: e.armor,
        kind: e.kind,
        theta: round4(e.theta),
        x: round4(Math.cos(e.theta) * r),
        z: round4(Math.sin(e.theta) * r),
        size: e.size,
        slowed: e.speedMul < 1,
        pull: round4(-e.rOffset),
      };
    }),
    shots: match.shots.map((s) => ({
      id: s.id,
      kind: s.kind,
      towerId: s.towerId,
      socket: s.socket,
      from: viewPoint(s.points[0]),
      to: viewPoint(s.points[s.points.length - 1]),
      points: s.points.map(viewPoint),
      t: round4(s.t),
      overclocked: !!s.overclocked,
    })),
    fields: match.fields.map((f) => ({
      id: f.id,
      x: round4(f.x),
      y: round4(f.y),
      z: round4(f.z),
      radius: round4(f.radius),
      t: round4(1 - f.life / f.maxLife),
    })),
    events: (match.events || []).map((e) => ({ ...e })),
    stats: {
      kills: match.stats.kills,
      leaks: match.stats.leaks,
      placed: match.stats.placed,
      denied: match.stats.denied,
      spawned: match.stats.spawned,
      wavesCleared: match.stats.wavesCleared,
      damage: round4(match.stats.damage),
    },
  };
}

export const TOWER_LIST = TOWER_IDS;
