// 对局状态构造。state 必须是纯数据：可 structuredClone、可 JSON 序列化，不放函数/类。

import { createArena, isSupported } from "./arena.js";
import { SIM_VERSION } from "./constants.js";
import { getDeps, resolveGlove } from "./deps.js";
import { pushEvent } from "./events.js";
import { createHubState, placeAtHubSpawn } from "./hub.js";
import { TAU, yawFromDir } from "./math.js";
import { createRngState, nextRange, nextU32 } from "./rng.js";

const PERSONAS = ["brute", "fox", "bully"];

function makePlayer(id, kind, slotIndex, gloveId, offhandId, persona, skinId) {
  return {
    id,
    kind, // 'human' | 'bot'
    persona: persona || null,
    // 皮肤纯装饰（ADR-26）：sim 只当不透明字符串存取，不校验、不 import skins 表
    skinId: skinId ?? null,
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
    awakened: false,
    statuses: [],

    // combat 读写的字段，开局就建好，保证 state 形状每帧稳定、可 structuredClone
    cd: { slapAt: 0, skillAt: 0 },
    busyUntil: 0,
    rootUntil: 0,
    impact: 0,
    knockbackT: 0,
    lastHitAt: -999,
    cottonChain: 0,
    dashing: false,
    dashUntil: 0,
    moveScale: 1,
    canAct: true,
    canDash: true,
    frozen: false,
    sticky: false,
    parrying: false,
    invulnerable: false,
    knockbackTakenMul: 1,

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

    // 上一帧的按键，用来做边沿触发（interact 只在安全区用）
    prev: { slap: false, skill: false, switchGlove: false, dash: false, jump: false, interact: false },
  };
}

/** 出生点：均分圆环，朝向台心。同 seed 稳定。 */
export function spawnPointFor(state, player) {
  const r = state.config.arenaRadius * 0.55;
  const a = player.spawnAngle;
  const x = Math.cos(a) * r;
  const z = Math.sin(a) * r;
  return { x, z, yaw: yawFromDir(-x, -z) };
}

/**
 * 出生点脚下可能已经被打碎，得找个还有台的落点，否则重组就是原地再摔一次。
 * 按“同角度先往里收，再绕角度找”的顺序扫，保证同 seed 稳定。
 */
export function findSpawnSpot(state, x, z, angle) {
  if (isSupported(state.arena, x, z)) return { x, z };

  const R = state.config.arenaRadius;
  for (const rf of [0.55, 0.42, 0.68, 0.3, 0.78, 0.18]) {
    for (const da of [0, 0.35, -0.35, 0.7, -0.7, 1.1, -1.1, 1.6, -1.6, 2.2, -2.2, Math.PI]) {
      const a = angle + da;
      const cx = Math.cos(a) * R * rf;
      const cz = Math.sin(a) * R * rf;
      if (isSupported(state.arena, cx, cz)) return { x: cx, z: cz };
    }
  }

  // 台面碎得差不多了：退到离理想点最近的活台块
  let best = null;
  let bd = Infinity;
  for (const t of state.arena.tiles) {
    if (!t.alive) continue;
    const d = (t.x - x) * (t.x - x) + (t.z - z) * (t.z - z);
    if (d < bd) {
      bd = d;
      best = t;
    }
  }
  return best ? { x: best.x, z: best.z } : { x: 0, z: 0 };
}

export function placeAtSpawn(state, player, airborne = false) {
  const p = spawnPointFor(state, player);
  const jitter = nextRange(state.rng, -0.6, 0.6);
  const spot = findSpawnSpot(state, p.x + jitter, p.z + jitter * 0.5, player.spawnAngle);
  player.x = spot.x;
  player.z = spot.z;
  player.y = airborne ? 2.2 : 0;
  player.yaw = yawFromDir(-player.x, -player.z); // 朝台心

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
  player.knockbackT = 0;
  player.impact = 0;
  player.cd.slapAt = 0;
  player.cd.skillAt = 0;
  player.busyUntil = 0;
  player.rootUntil = 0;
  player.cottonChain = 0;
  player.dashing = false;
  player.combo = 0;
  player.comboT = 0;
  player.statuses.length = 0;
  player.awakenedT = 0;
  player.awakened = false;
  player.meter = Math.min(player.meter, 0.35);
  player.attack.phase = "idle";
  player.attack.t = 0;
  player.attack.struck = false;
  player.dashT = 0;
  player.switchLockT = 0;
  pushEvent(state, { type: "respawn", id: player.id, x: player.x, y: player.y, z: player.z });
}

export { pushEvent };

/**
 * 传送门：安全区 -> 裂岛。loadout 原样保留，只挪位置 + 重置对局计时。
 * 没传 player 就把所有真人一起送过去。
 */
export function enterArena(state, player = null) {
  const list = player ? [player] : state.players.filter((p) => p.kind === "human");

  state.phase = "arena";
  for (const p of list) {
    placeAtSpawn(state, p, false);
    p.invulnT = Math.max(p.invulnT, state.config.invulnTime); // 刚落地就被扇太亏
    pushEvent(state, { type: "enterArena", id: p.id, x: p.x, y: p.y, z: p.z });
  }

  // 在大厅里挑掌的时间不算进对局时长
  state.match.startTime = state.time;
  state.match.secondsLeft = state.config.matchSeconds;
  state.match.over = false;
  state.match.winnerId = null;
  state.match.reason = null;

  if (state.hub) {
    state.hub.enteredArenaAt = state.time;
    state.hub.focusGloveId = null;
    state.hub.portalNear = false;
  }
  return state;
}

/** 回程（Round 2 对局结束后再选掌）：把真人送回安全区，装备保留。 */
export function enterHub(state, player = null) {
  const list = player ? [player] : state.players.filter((p) => p.kind === "human");
  state.phase = "hub";
  let i = 0;
  for (const p of list) {
    placeAtHubSpawn(state, p, i++);
    p.alive = true;
    p.respawnT = 0;
    p.statuses.length = 0;
    p.attack.phase = "idle";
    p.attack.t = 0;
    p.knockScale = 1;
    p.kbT = 0;
    pushEvent(state, { type: "enterHub", id: p.id, x: p.x, y: p.y, z: p.z });
  }
  if (state.hub) {
    state.hub.focusGloveId = null;
    state.hub.portalNear = false;
  }
  return state;
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

/** 皮肤标签只做形状兜底：不是非空字符串就当没给（ADR-26，合法性归消费端 resolveSkin）。 */
function asSkinId(v) {
  return typeof v === "string" && v.length > 0 ? v : null;
}

/** 开局在哪：默认安全区。`phase:'arena'` / `skipHub` / `config.skipHub` 直接进岛。 */
function resolvePhase(opts, config) {
  if (opts.phase === "arena" || opts.phase === "hub") return opts.phase;
  if (opts.skipHub === true || config.skipHub === true) return "arena";
  return "hub";
}

/**
 * createMatch(opts)
 * opts: {
 *   seed, gloveId, offhandId, botCount = 3, botPersonas?, config?,
 *   skinId?: string,              // 人类皮肤：不透明字符串原样存取，缺省 null（ADR-26）
 *   botSkinIds?: (string|null)[], // 与 bot 序号对齐（b0 取 [0]…），缺省 null
 *   phase?: 'hub' | 'arena',      // 缺省 'hub'（开局在安全区）
 *   skipHub?: boolean,            // 等价于 phase:'arena'，config.skipHub 也认
 *   unlocked?: string[] | Set | Record<string, boolean> | 'all',
 * }
 *
 * 缺省已解锁 = `unlock === "default"` 的掌 + 调用方明确带进来的 gloveId / offhandId。
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
  const botSkinIds = Array.isArray(opts.botSkinIds) ? opts.botSkinIds : [];

  const players = [makePlayer("p0", "human", 0, gloveId, offhandId, null, asSkinId(opts.skinId))];
  const botOffPool = deps.GLOVES.filter((g) => g.id !== "cotton");
  for (let i = 0; i < botCount; i++) {
    const off = botOffPool.length ? botOffPool[nextU32(rng) % botOffPool.length].id : "cotton";
    players.push(
      makePlayer(
        `b${i}`,
        "bot",
        i + 1,
        "cotton",
        off,
        personas[i % personas.length],
        asSkinId(botSkinIds[i]),
      ),
    );
  }

  const state = {
    version: SIM_VERSION,
    seed,
    rng,
    time: 0,
    // combat 读 `state.t` 当时钟，与 `state.time` 同步（见 combat-bridge）
    t: 0,
    tick: 0,
    config,
    // combat 的扇形判定读这个平铺字段来加身位
    playerRadius: config.playerRadius,
    arena: createArena(config.arenaRadius, rng),
    players,
    events: [],
    combat: { clock: 0, pending: [], dashes: [], ghosts: [], seq: 1 },
    // startTime：比赛计时的起点。从安全区传送进岛时会重置成当时的 time，
    // 让「在大厅里挑掌」不吃掉对局时长。
    match: {
      over: false,
      winnerId: null,
      reason: null,
      startTime: 0,
      secondsLeft: config.matchSeconds,
    },
    stats: { slaps: 0, hits: 0, kos: 0, tilesBroken: 0 },
    phase: resolvePhase(opts, config),
    hub: null,
  };

  // 先按裂岛出生点摆一遍：rng 消耗顺序不变，phase 只决定真人要不要再挪进安全区
  const n = players.length;
  for (let i = 0; i < n; i++) {
    players[i].spawnAngle = (i / n) * TAU;
    placeAtSpawn(state, players[i], false);
  }

  // 每局自带一份布局，别和 deps 缓存共享可变对象
  state.hub = createHubState(opts, deps, structuredClone(deps.HUB));
  if (state.phase === "hub") {
    let humanIndex = 0;
    for (const p of players) {
      if (p.kind !== "human") continue; // Bot 留在裂岛等人，安全区不放 Bot
      placeAtHubSpawn(state, p, humanIndex++);
    }
  }

  return state;
}
