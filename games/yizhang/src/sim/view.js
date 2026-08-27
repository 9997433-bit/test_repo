// 渲染快照：纯 JSON，不含 class / 函数 / 引用共享的可变对象。

import { crackOf } from "./arena.js";
import { resolveGlove } from "./deps.js";
import { hubView } from "./hub.js";
import { activeGloveId } from "./state.js";
import { len2, round4 } from "./math.js";

function tileView(t) {
  return {
    i: t.i,
    x: round4(t.x),
    z: round4(t.z),
    zone: t.zone,
    seam: t.seam,
    hp: Math.round(t.hp),
    maxHp: t.maxHp,
    alive: t.alive,
    crack: round4(crackOf(t)),
  };
}

function playerView(p) {
  const gid = activeGloveId(p);
  const glove = resolveGlove(gid);
  return {
    id: p.id,
    kind: p.kind,
    persona: p.persona,

    x: round4(p.x),
    y: round4(p.y),
    z: round4(p.z),
    yaw: round4(p.yaw),
    vx: round4(p.vx),
    vy: round4(p.vy),
    vz: round4(p.vz),
    speed: round4(len2(p.vx, p.vz)),

    gloveId: p.gloveId,
    offhandId: p.offhandId,
    activeSlot: p.activeSlot,
    activeGloveId: gid,
    gloveName: glove.name,
    gloveColor: glove.color,
    switchLockT: round4(p.switchLockT),

    meter: round4(p.meter),
    awakenedT: round4(p.awakenedT),
    awakened: p.awakenedT > 0,
    // combat 用 `kind`，sim 早期用 `id`，view 两个都给，渲染端随便读哪个
    statuses: p.statuses.map((s) => {
      const id = s.kind ?? s.id ?? null;
      return { id, kind: id, t: round4(s.t), mag: s.mag ?? null };
    }),

    alive: p.alive,
    invulnT: round4(p.invulnT),
    respawnT: round4(p.respawnT),
    kills: p.kills,
    deaths: p.deaths,
    streak: p.streak,

    grounded: p.grounded,
    dashT: round4(p.dashT),
    dashCd: round4(p.dashCd),
    slapCd: round4(p.slapCd),
    skillCd: round4(p.skillCd),
    attackPhase: p.attack.phase,
    attackT: round4(p.attack.t),
    combo: p.combo,
    knockScale: round4(p.knockScale),
  };
}

/**
 * 安全区快照。台座补上掌的名字 / 识别色 / 一句说明，UI 不用再去翻数据表；
 * `selected` 是布尔（契约字段），`slot` 给出是主掌还是副掌。
 */
function hubSnapshot(state) {
  const view = hubView(state);
  view.pedestals = view.pedestals.map((ped) => {
    const glove = resolveGlove(ped.gloveId);
    return {
      ...ped,
      x: round4(ped.x),
      y: round4(ped.y),
      z: round4(ped.z),
      yaw: round4(ped.yaw),
      name: glove.name,
      color: glove.color,
      desc: glove.desc ?? null,
      role: glove.role ?? null,
    };
  });
  return view;
}

export function getView(state) {
  const c = state.config;
  return {
    version: state.version,
    seed: state.seed,
    time: round4(state.time),
    tick: state.tick,
    phase: state.phase,
    hub: hubSnapshot(state),
    config: {
      dt: c.dt,
      arenaRadius: c.arenaRadius,
      playerRadius: c.playerRadius,
      playerHeight: c.playerHeight,
      fallY: c.fallY,
      respawnDelay: c.respawnDelay,
      invulnTime: c.invulnTime,
      matchSeconds: c.matchSeconds,
      killsToWin: c.killsToWin,
      switchLock: c.switchLock,
      awakenDuration: c.awakenDuration,
    },
    match: {
      over: state.match.over,
      winnerId: state.match.winnerId,
      reason: state.match.reason,
      secondsLeft: round4(state.match.secondsLeft),
    },
    arena: {
      radius: state.arena.radius,
      tileSize: state.arena.tileSize,
      cols: state.arena.cols,
      origin: state.arena.origin,
      floorY: state.arena.floorY,
      brokenCount: state.arena.brokenCount,
      tiles: state.arena.tiles.map(tileView),
    },
    players: state.players.map(playerView),
    events: state.events.map((e) => ({ ...e })),
    stats: { ...state.stats },
  };
}
