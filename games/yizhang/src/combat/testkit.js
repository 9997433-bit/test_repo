// 异掌 · combat/ai 自测用的最小驱动器。
// 不是正式 sim（那是 src/sim 的活），只提供积分 + 掉落判定，
// 让 combat 与 bots 能在没有 sim 的情况下自证。

import { FALLBACK_GLOVE_BY_ID } from "./constants.js";
import { forwardFromYaw, localToWorld, num } from "./util.js";
import { creditKill, resolveSkill, resolveSlap, respawn, tickStatuses } from "./index.js";

export function makePlayer(id, opts = {}) {
  return {
    id,
    kind: opts.kind || "bot",
    persona: opts.persona || null,
    x: num(opts.x),
    y: num(opts.y),
    z: num(opts.z),
    yaw: num(opts.yaw),
    vx: 0,
    vy: 0,
    vz: 0,
    gloveId: opts.gloveId || "cotton",
    offhandId: opts.offhandId || "gale",
    activeSlot: 0,
    meter: num(opts.meter),
    awakenedT: num(opts.awakenedT),
    statuses: [],
    alive: true,
    invulnT: 0,
    respawnT: 0,
    kills: 0,
    deaths: 0,
    impact: 0,
    grounded: true,
    cd: { slapAt: 0, skillAt: 0 },
    busyUntil: 0,
  };
}

export function makeTiles(ringRadius = 6, count = 8, hp = 100) {
  const tiles = [];
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2;
    tiles.push({
      id: `tile${i}`,
      x: Math.cos(a) * ringRadius,
      z: Math.sin(a) * ringRadius,
      r: 1.5,
      hp,
      maxHp: hp,
      broken: false,
    });
  }
  return tiles;
}

export function makeState(players, opts = {}) {
  return {
    t: 0,
    seed: num(opts.seed, 1),
    arena: { radius: num(opts.arenaRadius, 20) },
    tiles: opts.tiles || [],
    players,
    events: [],
    gloveById: opts.gloveById || FALLBACK_GLOVE_BY_ID,
  };
}

const MOVE_SPEED = 9;
const ACCEL = 45;
const FRICTION = 7;
const GRAVITY = -26;

/**
 * 一步最小模拟：应用输入 -> 战斗 tick -> 积分 -> 掉落判定。
 * @param {object} state
 * @param {Record<string, object>} inputs
 * @param {number} dt
 * @param {{moveSpace?: 'local'|'world'}} opts
 */
export function stepSim(state, inputs = {}, dt = 1 / 60, opts = {}) {
  const moveSpace = opts.moveSpace || "local";
  const now = state.t;

  for (const p of state.players) {
    if (!p.alive) {
      p.respawnT = Math.max(0, num(p.respawnT) - dt);
      if (p.respawnT <= 0) {
        p.x = 0;
        p.y = 0;
        p.z = 0;
        respawn(state, p, now);
      }
      continue;
    }
    const inp = inputs[p.id];
    if (!inp) continue;
    if (typeof inp.yaw === "number" && Number.isFinite(inp.yaw)) p.yaw = inp.yaw;

    const raw = { x: num(inp.moveX), z: num(inp.moveZ) };
    const world = moveSpace === "local" ? localToWorld(raw.x, raw.z, p.yaw) : raw;
    const scale = num(p.moveScale, 1);
    const wantVx = world.x * MOVE_SPEED * scale;
    const wantVz = world.z * MOVE_SPEED * scale;
    if (!p.dashing) {
      p.vx += (wantVx - p.vx) * Math.min(1, ACCEL * dt * 0.1 + 0.12);
      p.vz += (wantVz - p.vz) * Math.min(1, ACCEL * dt * 0.1 + 0.12);
    }
    if (inp.jump && p.grounded && p.canAct !== false) {
      p.vy = 9;
      p.grounded = false;
    }
    if (inp.dash && p.canDash !== false) {
      const f = forwardFromYaw(p.yaw);
      p.vx += f.x * 9;
      p.vz += f.z * 9;
    }
    if (inp.slap) resolveSlap(state, p, undefined, now);
    if (inp.skill) resolveSkill(state, p, undefined, now);
  }

  tickStatuses(state, dt);

  const R = state.arena.radius;
  for (const p of state.players) {
    if (!p.alive) continue;
    p.vy += GRAVITY * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.z += p.vz * dt;
    const r = Math.hypot(p.x, p.z);
    const onTile = r <= R;
    if (onTile && p.y <= 0) {
      p.y = 0;
      p.vy = 0;
      p.grounded = true;
      const damp = Math.exp(-FRICTION * dt * (p.dashing ? 0.1 : 1));
      if (!p.dashing) {
        p.vx *= damp;
        p.vz *= damp;
      }
    } else {
      p.grounded = false;
    }
    if (p.y < -8) {
      p.alive = false;
      p.respawnT = 1.2;
      creditKill(state, p, state.t);
    }
  }

  state.t += dt;
  return state;
}

export function counter(seed = 1) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s >>>= 0;
    s ^= s >> 17;
    s ^= s << 5;
    s >>>= 0;
    return s / 4294967296;
  };
}
