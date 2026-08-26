// 视图适配层：把 sim.getView() 的真实快照收敛成渲染层内部用的形状。
//
// 这里是渲染层唯一知道「sim 长什么样」的地方，其余文件只吃本文件的输出。
// 纯数据、纯函数，不 import three，也不碰 DOM —— 所以它能在 node 里直接单测
// （见 view.test.js）。
//
// 真实契约（games/yizhang/src/sim/view.js）里渲染实际依赖的字段：
//
//   view.tick / view.time
//   view.arena.{ radius, tileSize, cols, origin, floorY, brokenCount }
//   view.arena.tiles[] : { i, x, z, zone, seam, hp, maxHp, alive, crack }
//   view.players[]     : { id, kind, x, y, z, yaw, speed, alive, grounded,
//                          invulnT, respawnT, awakenedT, meter,
//                          gloveId, offhandId, activeSlot, activeGloveId, gloveColor,
//                          attackPhase, combo }
//   view.events[]      : { type, id, targetId, gloveId, skillId, x, y, z, power, hits, i }
//
// 其它字段（kills / statuses / match…）由 HUD 消费，渲染不读。

import { FALLBACK_TINT, GLOVE_TINT } from './config.js';

/** 人类玩家 id。sim 的 createMatch 固定把人排在 p0。 */
export const DEFAULT_LOCAL_ID = 'p0';

/**
 * 朝向约定（全项目冻结）：yaw = 0 面向 -Z，与 src/sim/math.js 的 forwardX/forwardZ
 * 以及 three 的 mesh.rotation.y 一致。渲染层要用「前方」的地方一律走这个函数。
 */
export function forwardFromYaw(yaw) {
  return { x: -Math.sin(yaw), z: -Math.cos(yaw) };
}

const DEFAULT_RADIUS = 20;
const DEFAULT_TILE_SIZE = 2.5;

/** 一次扇击的典型击退冲量（m/s）。事件里的 power 按它归一到 1 附近。 */
const POWER_UNIT = 9;

function num(v, d = 0) {
  return Number.isFinite(v) ? v : d;
}

function clamp(v, lo, hi) {
  return v < lo ? lo : v > hi ? hi : v;
}

/** '#e3c988' / 0xe3c988 / 'e3c988' 都收；认不出返回 null。 */
export function parseColor(value) {
  if (Number.isFinite(value)) return value >>> 0;
  if (typeof value !== 'string') return null;
  const hex = value.trim().replace(/^#/, '');
  if (!/^[0-9a-fA-F]{6}$/.test(hex)) return null;
  return Number.parseInt(hex, 16);
}

/**
 * 手套识别色。优先用 view 自带的 gloveColor（它直接来自 src/data/gloves.js），
 * 拿不到再按 id 查渲染层的镜像表，最后才退回中性灰。
 */
export function gloveTint(gloveId, color) {
  return parseColor(color) ?? GLOVE_TINT[gloveId] ?? FALLBACK_TINT;
}

/**
 * 本地玩家。显式指定 > view 自报 > 名单里的人类 > 默认 p0 > 名单第一个。
 * followId 可能是别的模块留下的陈旧值，只有确实在名单里才认。
 */
export function pickLocalId(view, opts = {}) {
  const players = Array.isArray(view?.players) ? view.players.filter(Boolean) : [];
  const has = (id) => id != null && players.some((p) => p.id === id);

  if (opts.localId != null) return opts.localId;
  const declared = view?.localId ?? view?.selfId ?? view?.playerId;
  if (declared != null) return declared;
  if (has(opts.followId)) return opts.followId;

  const human = players.find((p) => p.kind === 'human' || p.isLocal === true);
  if (human) return human.id;
  if (has(DEFAULT_LOCAL_ID)) return DEFAULT_LOCAL_ID;
  return players[0]?.id ?? DEFAULT_LOCAL_ID;
}

export function readArena(view) {
  const a = view?.arena ?? {};
  const radius = num(a.radius, num(view?.arenaRadius, num(view?.config?.arenaRadius, DEFAULT_RADIUS)));
  const tileSize = num(a.tileSize, DEFAULT_TILE_SIZE);
  const cols = num(a.cols, Math.ceil((radius * 2) / tileSize));
  return {
    radius,
    tileSize,
    cols,
    origin: num(a.origin, -(cols * tileSize) / 2),
    floorY: num(a.floorY, 0),
    brokenCount: num(a.brokenCount, 0),
  };
}

function tileBroken(t) {
  if (t.alive === false) return true;
  if (t.broken === true || t.destroyed === true) return true;
  return num(t.hp, 1) <= 0;
}

/**
 * 台面。数组里有什么就渲染什么 —— 渲染层不自己造网格，
 * 所以「sim 里没有的格子」天然就是洞，不会出现画面上有台、脚下没台的情况。
 */
export function readTiles(view, arena) {
  const raw = view?.arena?.tiles ?? view?.tiles;
  if (!Array.isArray(raw)) return [];
  const out = [];
  for (let n = 0; n < raw.length; n++) {
    const t = raw[n];
    if (!t || typeof t !== 'object') continue;
    if (!Number.isFinite(t.x)) continue;
    const index = Number.isFinite(t.i) ? t.i : n;
    const maxHp = num(t.maxHp, num(t.hpMax, 1));
    const hp = num(t.hp, maxHp);
    const broken = tileBroken(t);
    out.push({
      key: String(t.id ?? index),
      index,
      x: t.x,
      z: num(t.z, num(t.y, 0)),
      size: num(t.size, arena.tileSize),
      seam: t.seam === true,
      zone: num(t.zone, 0),
      hp,
      maxHp,
      // crack 是 sim 直接给的 0..1 破损度；缺席时用 hp 反推
      crack: broken ? 1 : clamp(Number.isFinite(t.crack) ? t.crack : 1 - hp / Math.max(maxHp, 1e-6), 0, 1),
      broken,
    });
  }
  return out;
}

export function readPlayers(view) {
  const raw = Array.isArray(view?.players) ? view.players : [];
  const out = [];
  for (const p of raw) {
    if (!p || p.id == null) continue;
    const activeGloveId = p.activeGloveId ?? p.gloveId ?? null;
    const activeSlot = num(p.activeSlot, 0);
    const mainId = p.gloveId ?? activeGloveId;
    const offhandId = p.offhandId ?? activeGloveId;
    out.push({
      id: p.id,
      kind: p.kind ?? 'bot',
      x: num(p.x),
      y: num(p.y),
      z: num(p.z),
      yaw: num(p.yaw),
      speed: num(p.speed, Math.hypot(num(p.vx), num(p.vz))),
      alive: p.alive !== false,
      grounded: p.grounded !== false,
      invulnT: num(p.invulnT),
      respawnT: num(p.respawnT),
      awakenedT: num(p.awakenedT),
      awakened: p.awakened === true || num(p.awakenedT) > 0,
      meter: num(p.meter),
      combo: num(p.combo),
      attackPhase: p.attackPhase ?? p.phase ?? 'idle',
      activeSlot,
      mainId,
      offhandId,
      activeGloveId,
      // 主/副掌各有识别色；view 的 gloveColor 说的是当前激活的那只
      tint: gloveTint(activeGloveId, p.gloveColor ?? p.color),
      mainTint: gloveTint(mainId, activeSlot === 0 ? (p.gloveColor ?? p.color) : null),
      offTint: gloveTint(offhandId, activeSlot === 1 ? (p.gloveColor ?? p.color) : null),
    });
  }
  return out;
}

// sim（src/sim/step.js、floor.js）与 combat（src/combat/*）各有一套事件名，
// 两边都会写进同一个 state.events，所以这里一起认。
const EVENT_KIND = {
  // sim
  slapstart: 'swing',
  slap: 'slap',
  hit: 'hit',
  skill: 'skill',
  ko: 'ko',
  awaken: 'awaken',
  awakenend: 'awakenEnd',
  dash: 'dash',
  jump: 'jump',
  respawn: 'respawn',
  switch: 'switch',
  tilecrack: 'tileCrack',
  tilebreak: 'tileBreak',
  matchover: 'matchOver',
  // combat
  slapwindup: 'swing',
  slapwhiff: 'slap',
  ghostslap: 'slap',
  skillcast: 'skill',
  skillhit: 'hit',
  meteorimpact: 'heavy',
  parry: 'heavy',
  kill: 'ko',
};

function eventKey(type) {
  return String(type ?? '').toLowerCase().replace(/[_\-\s]/g, '');
}

export function eventKind(type) {
  return EVENT_KIND[eventKey(type)] ?? null;
}

function eventPower(e, kind) {
  const raw = e.power ?? e.impulse ?? e.strength ?? e.damage;
  if (Number.isFinite(raw)) return clamp(raw / POWER_UNIT, 0.3, 2.6);
  return kind === 'heavy' ? 1.6 : 1;
}

/**
 * 事件归一。sim 的事件没有稳定 id，靠 tick 去重（见 renderer._consumeEvents），
 * 所以这里只做形状转换，不做去重。
 */
export function readEvents(view) {
  const raw = Array.isArray(view?.events) ? view.events : [];
  const out = [];
  for (const e of raw) {
    if (!e) continue;
    const key = eventKey(e.type ?? e.kind);
    const kind = EVENT_KIND[key] ?? null;
    if (!kind) continue;

    // actorId 是「动手的人」，targetId 是「挨着的人」。
    // sim 的 ko 用 { id: 掉下去的人, by: 凶手 }，combat 的 kill 用 killerId / victimId，
    // 两边方向相反，所以倒过来的那一种单独摆平。
    let actorId =
      e.attackerId ?? e.playerId ?? e.ownerId ?? e.killerId ?? e.by ?? e.attacker ?? e.owner ?? e.id ?? null;
    let targetId = e.targetId ?? e.target ?? e.victimId ?? null;
    if (kind === 'ko') {
      targetId = e.victimId ?? e.id ?? targetId;
      actorId = e.killerId ?? e.by ?? null;
    }

    out.push({
      kind,
      type: e.type ?? kind,
      actorId,
      targetId,
      gloveId: e.gloveId ?? null,
      skillId: e.skillId ?? null,
      // 台面事件：i 是 sim 的 tile 下标，combat 走的是 tileId
      tileIndex: Number.isFinite(e.i) ? e.i : null,
      tileId: e.tileId ?? null,
      x: Number.isFinite(e.x) ? e.x : null,
      y: Number.isFinite(e.y) ? e.y : null,
      z: Number.isFinite(e.z) ? e.z : null,
      yaw: Number.isFinite(e.yaw) ? e.yaw : null,
      // 扇空：sim 数 hits，combat 直接发 slapWhiff
      hits: Number.isFinite(e.hits) ? e.hits : key === 'slapwhiff' ? 0 : null,
      power: eventPower(e, kind),
      t: num(e.t, num(view?.time, 0)),
    });
  }
  return out;
}

/**
 * 主入口。
 * @param {object} raw sim.getView() 的返回（可能被 core/interp 插值过）
 * @param {{localId?: any, followId?: any}} [opts]
 */
export function readView(raw, opts = {}) {
  const view = raw && typeof raw === 'object' ? raw : {};
  const arena = readArena(view);
  return {
    time: num(view.time, num(view.t, 0)),
    // tick 是事件去重的唯一依据：同一 tick 的事件只放一次特效
    tick: Number.isFinite(view.tick) ? view.tick : null,
    alpha: num(view.alpha, 1),
    over: view.match?.over === true || view.over === true,
    localId: pickLocalId(view, opts),
    arena,
    tiles: readTiles(view, arena),
    players: readPlayers(view),
    events: readEvents(view),
  };
}
