// 对局状态构造。state 必须是纯数据：可 structuredClone、可 JSON 序列化，不放函数/类。

import { createArena } from "./arena.js";
import { PHYSICS, SIM_VERSION } from "./constants.js";
import { getDeps, resolveGlove } from "./deps.js";
import { TAU } from "./math.js";
import { createRngState, nextRange, nextU32 } from "./rng.js";

const PERSONAS = ["brute", "fox", "bully"];

function makePlayer(id, kind, slotIndex, gloveId, offhandId, persona) {
  return {
    id,
    kind, // 'human' | 'bot'
    persona: persona || null,
    spawnSlot: slotIndex,
    spawnAngle: 0,

    x: 0,
    y: 0,
    z: 0,
    yaw: 0,
    vx: 0,
    vy: 0,
    vz: 0,

    gloveId, // 主掌 = slot 0
    offhandId, // 副掌 = slot 1
    activeSlot: 0,
    switchLockT: 0,

    meter: 0,
    awakenedT: 0,
    statuses: [],

    alive: true,
    invulnT: 0,
    respawnT: 0,
    kills: 0,
    deaths: 0,
    streak: 0,
    bestStreak: 0,

    grounded: true,
    coyoteT: 0,
    jumpHeld: false,

    dashT: 0,
    dashCd: 0,
    dashDirX: 0,
    dashDirZ: 0,

    slapCd: 0,
    skillCd: 0,
    attack: { phase: "idle", t: 0, gloveId, struck: false },

    combo: 0,
    comboT: 0,
    knockScale: 1,
    kbT: 0,

    lastHitBy: null,
    lastHitT: -999,
    hitsDealt: 0,
    hitsTaken: 0,

    // 上一帧的按键，用来做边沿触发
    prev: { slap: false, skill: false, switchGlove: false, dash: false, jump: false },
  };
}

/** 出生点：均分圆环，朝向台心。同 seed 稳定。 */
export function spawnPointFor(state, player) {
  const r = state.config.arenaRadius * 0.55;
  const a = player.spawnAngle;
  const x = Math.cos(a) * r;
  const z = Math.sin(a) * r;
  // yaw 约定：0 面向 -Z；朝台心即朝 (-x,-z)
  const yaw = Math.atan2(x, z) + Math.PI;
  return { x, z, yaw };
}

export function placeAtSpawn(state, player, airborne = false) {
  const p = spawnPointFor(state, player);
  const jitter = nextRange(state.rng, -0.6, 0.6);
  player.x = p.x + jitter;
  player.z = p.z + jitter * 0.5;
  player.y = airborne ? 2.2 : 0;
  player.yaw = p.yaw;
  player.vx = 0;
  player.vy = 0;
  player.vz = 0;
  player.grounded = !airborne;
}

export function respawnPlayer(state, player) {
  placeAtSpawn(state, player, true);
  player.alive = true;
  player.respawnT = 0;
  player.invulnT = state.config.invulnTime;
  player.knockScale = 1;
  player.kbT = 0;
  player.combo = 0;
  player.comboT = 0;
  player.statuses.length = 0;
  player.awakenedT = 0;
  player.meter = Math.min(player.meter, 0.35);
  player.attack.phase = "idle";
  player.attack.t = 0;
  player.attack.struck = false;
  player.dashT = 0;
  player.switchLockT = 0;
  pushEvent(state, { type: "respawn", id: player.id, x: player.x, y: player.y, z: player.z });
}

export function pushEvent(state, ev) {
  if (state.events.length >= PHYSICS.maxEvents) return;
  ev.t = state.time;
  state.events.push(ev);
}

export function getPlayer(state, id) {
  for (const p of state.players) if (p.id === id) return p;
  return null;
}

export function activeGloveId(player) {
  return player.activeSlot === 0 ? player.gloveId : player.offhandId;
}

export function activeGlove(player) {
  return resolveGlove(activeGloveId(player));
}

/**
 * createMatch(opts)
 * opts: { seed, gloveId, offhandId, botCount = 3, botPersonas?, config? }
 */
export function createMatch(opts = {}) {
  const deps = getDeps();
  const seed = Number.isFinite(opts.seed) ? opts.seed >>> 0 : 1;
  const rng = createRngState(seed);

  const config = { ...deps.MATCH, ...(opts.config || {}) };
  const gloveId = deps.GLOVE_BY_ID[opts.gloveId] ? opts.gloveId : "cotton";
  const fallbackOff = deps.GLOVES.find((g) => g.id !== gloveId)?.id || gloveId;
  const offhandId = deps.GLOVE_BY_ID[opts.offhandId] ? opts.offhandId : fallbackOff;

  const botCount = Number.isFinite(opts.botCount) ? Math.max(0, Math.floor(opts.botCount)) : 3;
  const personas = opts.botPersonas && opts.botPersonas.length ? opts.botPersonas : PERSONAS;

  const players = [makePlayer("p0", "human", 0, gloveId, offhandId, null)];
  const botOffPool = deps.GLOVES.filter((g) => g.id !== "cotton");
  for (let i = 0; i < botCount; i++) {
    const off = botOffPool.length ? botOffPool[nextU32(rng) % botOffPool.length].id : "cotton";
    players.push(
      makePlayer(`b${i}`, "bot", i + 1, "cotton", off, personas[i % personas.length]),
    );
  }

  const state = {
    version: SIM_VERSION,
    seed,
    rng,
    time: 0,
    tick: 0,
    config,
    arena: createArena(config.arenaRadius, rng),
    players,
    events: [],
    match: { over: false, winnerId: null, reason: null, secondsLeft: config.matchSeconds },
    stats: { slaps: 0, hits: 0, kos: 0, tilesBroken: 0 },
  };

  const n = players.length;
  for (let i = 0; i < n; i++) {
    players[i].spawnAngle = (i / n) * TAU;
    placeAtSpawn(state, players[i], false);
  }

  return state;
}
