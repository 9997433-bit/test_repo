// 视图适配层：把 sim.getView() 的真实快照收敛成渲染层内部用的形状。
//
// 这里是渲染层唯一知道「sim 长什么样」的地方，其余文件只吃本文件的输出。
// 纯数据、纯函数，不 import three，也不碰 DOM —— 所以它能在 node 里直接单测
// （见 view.test.js）。
//
// 真实契约（games/yizhang/src/sim/view.js）里渲染实际依赖的字段：
//
//   view.tick / view.time / view.phase
//   view.arena.{ radius, tileSize, cols, origin, floorY, brokenCount }
//   view.arena.tiles[] : { i, x, z, zone, seam, hp, maxHp, alive, crack }
//   view.players[]     : { id, kind, x, y, z, yaw, speed, alive, grounded,
//                          invulnT, respawnT, awakenedT, meter,
//                          gloveId, offhandId, activeSlot, activeGloveId, gloveColor,
//                          attackPhase, combo }
//   view.events[]      : { type, id, targetId, gloveId, skillId, x, y, z, power, hits, i }
//   view.hub.{ origin, floorY, walkway, spawn, portal, portalReady, portalNear,
//              interactRadius, pedestalRadius, pedestalHeight, focusGloveId,
//              mainGloveId, offGloveId }
//   view.hub.pedestals[] : { gloveId, x, y, z, yaw, row, index, unlocked,
//                            selected, slot, focused, name, color }
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
 * 本地玩家。显式指定 > view 自报 > followId > 名单里的人类 > 默认 p0 > 名单第一个。
 *
 * 每一档都要先在名单里查得到才认。壳层给的 id 未必跟 sim 对得上
 * （src/main.js 的 SELF_ID 写的是 p1，而 sim 的名单是 p0 + b0..bN），
 * 硬认下去镜头会跟一个不存在的人，直接掉回环绕机位 —— 那还不如落回 p0。
 */
export function pickLocalId(view, opts = {}) {
  const players = Array.isArray(view?.players) ? view.players.filter(Boolean) : [];
  const has = (id) => id != null && players.some((p) => p.id === id);

  if (has(opts.localId)) return opts.localId;
  if (has(view?.localId)) return view.localId;
  if (has(view?.selfId)) return view.selfId;
  if (has(view?.playerId)) return view.playerId;
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

// ------------------------------------------------------------------ 安全区

/** 走道与传送门的兜底尺寸，只在 view 缺字段时用（真实值一律来自 sim 的布局表）。 */
const HUB_FALLBACK = {
  halfWidth: 7.5,
  length: 39,
  portalRadius: 2.4,
  interactRadius: 2,
  pedestalRadius: 0.6,
  pedestalHeight: 0.95,
};

/**
 * `view.phase`。sim 只发 'hub' / 'arena'，别的一律当成「没自报」。
 * @returns {'hub'|'arena'|null}
 */
export function readPhase(view) {
  const raw = typeof view?.phase === 'string' ? view.phase.trim().toLowerCase() : null;
  return raw === 'hub' || raw === 'arena' ? raw : null;
}

function readPedestals(hub, opts) {
  const raw = Array.isArray(hub?.pedestals) ? hub.pedestals : [];
  const out = [];
  for (let i = 0; i < raw.length; i++) {
    const ped = raw[i];
    if (!ped || typeof ped !== 'object') continue;
    const gloveId = typeof ped.gloveId === 'string' ? ped.gloveId : null;
    if (!gloveId) continue;
    const slot = ped.slot === 'main' || ped.slot === 'off' ? ped.slot : null;
    // slot 是契约里更细的那一份；只给了布尔 selected 时按主/副掌 id 倒推
    const resolvedSlot =
      slot ?? (gloveId === opts.mainGloveId ? 'main' : gloveId === opts.offGloveId ? 'off' : null);
    out.push({
      gloveId,
      x: num(ped.x),
      y: num(ped.y, opts.floorY),
      z: num(ped.z, opts.origin.z),
      yaw: num(ped.yaw),
      row: ped.row === 'right' ? 'right' : ped.row === 'left' ? 'left' : ped.x > opts.origin.x ? 'right' : 'left',
      index: Number.isFinite(ped.index) ? ped.index : Math.floor(i / 2),
      height: num(ped.height, opts.pedestalHeight),
      // 未解锁的掌照样摆出来（GOAL：可见但选不中），渲染上按「未点亮」处理
      unlocked: ped.unlocked !== false,
      slot: resolvedSlot,
      selected: ped.selected === true || resolvedSlot !== null,
      focused: ped.focused === true || (opts.focusGloveId != null && gloveId === opts.focusGloveId),
      name: typeof ped.name === 'string' ? ped.name : null,
      tint: gloveTint(gloveId, ped.color ?? ped.tint),
    });
  }
  return out;
}

/**
 * 安全区快照。
 *
 * `active` 是「这一帧要不要画安全区」：`phase` 说了算；连 phase 都没有的 view
 * （壳层自己拼的片段、老测试）就看它带没带 hub 数据。
 */
export function readHub(view) {
  const hub = view?.hub && typeof view.hub === 'object' ? view.hub : null;
  const phase = readPhase(view);
  const hasData = !!hub && Array.isArray(hub.pedestals) && hub.pedestals.length > 0;
  const active = phase === 'hub' ? true : phase === 'arena' ? false : hasData;

  const origin = {
    x: num(hub?.origin?.x, 0),
    y: num(hub?.origin?.y, 0),
    z: num(hub?.origin?.z, 0),
  };
  const floorY = num(hub?.floorY, origin.y);
  const halfWidth = Math.max(1.5, num(hub?.walkway?.halfWidth, HUB_FALLBACK.halfWidth));
  const minZ = num(hub?.walkway?.minZ, origin.z - HUB_FALLBACK.length / 2);
  const maxZ = num(hub?.walkway?.maxZ, origin.z + HUB_FALLBACK.length / 2);
  const pedestalHeight = Math.max(0.2, num(hub?.pedestalHeight, HUB_FALLBACK.pedestalHeight));

  const mainGloveId = typeof hub?.mainGloveId === 'string' ? hub.mainGloveId : null;
  const offGloveId = typeof hub?.offGloveId === 'string' ? hub.offGloveId : null;
  const focusGloveId = typeof hub?.focusGloveId === 'string' ? hub.focusGloveId : null;

  return {
    active,
    phase: phase ?? (hasData ? 'hub' : 'arena'),
    layoutId: typeof hub?.layoutId === 'string' ? hub.layoutId : null,
    origin,
    floorY,
    walkway: {
      halfWidth,
      minZ: Math.min(minZ, maxZ),
      maxZ: Math.max(minZ, maxZ),
    },
    spawn: {
      x: num(hub?.spawn?.x, origin.x),
      y: num(hub?.spawn?.y, floorY),
      z: num(hub?.spawn?.z, maxZ - 4),
      yaw: num(hub?.spawn?.yaw, 0),
    },
    portal: {
      x: num(hub?.portal?.x, origin.x),
      y: num(hub?.portal?.y, floorY),
      z: num(hub?.portal?.z, minZ + 4),
      radius: Math.max(0.8, num(hub?.portal?.radius, HUB_FALLBACK.portalRadius)),
      // 契约把 ready/near 同时放在 hub 顶层与 portal 里，两处都认
      ready: hub?.portalReady === true || hub?.portal?.ready === true,
      near: hub?.portalNear === true || hub?.portal?.near === true,
    },
    interactRadius: Math.max(0.5, num(hub?.interactRadius, HUB_FALLBACK.interactRadius)),
    pedestalRadius: Math.max(0.2, num(hub?.pedestalRadius, HUB_FALLBACK.pedestalRadius)),
    pedestalHeight,
    focusGloveId,
    mainGloveId,
    offGloveId,
    pedestals: readPedestals(hub, {
      origin,
      floorY,
      pedestalHeight,
      focusGloveId,
      mainGloveId,
      offGloveId,
    }),
  };
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
    phase: readPhase(view),
    hub: readHub(view),
    arena,
    tiles: readTiles(view, arena),
    players: readPlayers(view),
    events: readEvents(view),
  };
}
