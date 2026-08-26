import { hashSeed, mulberry32, pickWeighted } from "../core/rng.js";

/**
 * 潜水海区。布局不写死：每次下潜由 (meta.seed, meta.tick, zone) 派生 rng 现场生成，
 * 同一 (seed, tick, zone) 必然重放出同一张图。
 */
export const DIVE_ZONES = {
  shallow: {
    id: "shallow",
    name: "浅滩",
    maxDepth: 40,
    sharks: 1,
    nodes: 4,
    wrecks: 0,
    bubbles: 3,
    oxygenBonus: 10,
    loot: [
      ["scrap", 26],
      ["plastic", 24],
      ["rope", 18],
      ["stone", 16],
      ["salt", 12],
      ["blueprint", 4],
    ],
    wreckLoot: [
      ["blueprint", 60],
      ["scrap", 40],
    ],
  },
  reef: {
    id: "reef",
    name: "珊瑚礁",
    maxDepth: 60,
    sharks: 2,
    nodes: 4,
    wrecks: 1,
    bubbles: 3,
    oxygenBonus: 0,
    loot: [
      ["rawFish", 24],
      ["plastic", 20],
      ["rope", 18],
      ["salt", 16],
      ["stone", 12],
      ["blueprint", 8],
    ],
    wreckLoot: [
      ["blueprint", 55],
      ["fillet", 30],
      ["shard", 15],
    ],
  },
  wreck: {
    id: "wreck",
    name: "沉船区",
    maxDepth: 90,
    sharks: 2,
    nodes: 4,
    wrecks: 1,
    bubbles: 2,
    oxygenBonus: 0,
    loot: [
      ["scrap", 30],
      ["stone", 18],
      ["rope", 14],
      ["plastic", 14],
      ["blueprint", 12],
      ["fillet", 8],
      ["shard", 4],
    ],
    wreckLoot: [
      ["blueprint", 50],
      ["shard", 30],
      ["scrap", 20],
    ],
  },
  trench: {
    id: "trench",
    name: "深渊裂谷",
    maxDepth: 90,
    sharks: 3,
    nodes: 5,
    wrecks: 2,
    bubbles: 4,
    oxygenBonus: -8,
    loot: [
      ["scrap", 22],
      ["stone", 20],
      ["blueprint", 20],
      ["shard", 14],
      ["fillet", 12],
      ["salt", 12],
    ],
    wreckLoot: [
      ["shard", 50],
      ["blueprint", 35],
      ["hourglass", 15],
    ],
  },
};

const SUBSTEP = 0.05;
const SWIM_SPEED = 18;
const PICKUP_R = 5;
const SHARK_BITE_R = 6;
const SHARK_AGGRO_R = 22;
const SURFACE_DEPTH = 8;

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

function dockLevel(state) {
  return (state.buildings || [])
    .filter((b) => b.type === "dive_dock")
    .reduce((best, b) => Math.max(best, b.level || 1), 0);
}

function zoneDef(zone) {
  return DIVE_ZONES[zone] || DIVE_ZONES.wreck;
}

function layoutSeed(state, zone) {
  return hashSeed(`dive|${zone}|${state.meta?.seed ?? 0}|${state.meta?.tick ?? 0}`);
}

export function startDive(state, zone = "wreck") {
  const level = dockLevel(state);
  if (!level) return { ok: false, reason: "先造潜水船坞。", code: "E_REQUIRES_BUILDING" };
  const def = zoneDef(zone);
  const seed = layoutSeed(state, def.id);
  const rng = mulberry32(seed);
  const maxDepth = def.maxDepth;
  const oxygenMax = Math.max(60, 100 + (level - 1) * 12 + def.oxygenBonus);

  const nodes = [];
  for (let i = 0; i < def.nodes; i += 1) {
    const res = pickWeighted(rng, def.loot);
    const y = round2(12 + rng() * (maxDepth - 16));
    nodes.push({
      id: `n${i + 1}`,
      x: round2(8 + rng() * 84),
      y,
      res,
      n: 1 + Math.floor(rng() * (res === "blueprint" || res === "shard" ? 1 : 4)),
      kind: "node",
      depthBand: y < maxDepth * 0.4 ? "upper" : y < maxDepth * 0.75 ? "mid" : "deep",
    });
  }
  for (let i = 0; i < def.wrecks; i += 1) {
    const res = pickWeighted(rng, def.wreckLoot);
    const y = round2(maxDepth * 0.62 + rng() * (maxDepth * 0.3));
    nodes.push({
      id: `w${i + 1}`,
      x: round2(10 + rng() * 80),
      y,
      res,
      n: 1 + Math.floor(rng() * 2),
      kind: "wreck",
      label: "沉船舱室",
      depthBand: "deep",
    });
  }

  const bubbles = [];
  for (let i = 0; i < def.bubbles; i += 1) {
    bubbles.push({
      id: `b${i + 1}`,
      x: round2(6 + rng() * 88),
      y: round2(14 + rng() * (maxDepth - 18)),
      amount: 16 + Math.floor(rng() * 14),
    });
  }

  const sharks = [];
  for (let i = 0; i < def.sharks; i += 1) {
    sharks.push({
      id: `s${i + 1}`,
      x: round2(15 + rng() * 70),
      y: round2(16 + rng() * (maxDepth - 20)),
      vx: round2((rng() < 0.5 ? -1 : 1) * (0.35 + rng() * 0.5)),
      vy: round2((rng() - 0.5) * 0.25),
      speed: round2(0.8 + rng() * 0.5),
      aggro: false,
    });
  }

  return {
    ok: true,
    zone: def.id,
    zoneName: def.name,
    seed,
    startedTick: state.meta?.tick ?? 0,
    oxygen: oxygenMax,
    oxygenMax,
    x: 50,
    depth: 0,
    maxDepth,
    loot: [],
    alive: true,
    done: false,
    sharks,
    nodes,
    bubbles,
    time: 0,
    bestDepth: 0,
    danger: 0,
    warning: false,
    surfaced: false,
    dockLevel: level,
    message: `${def.name}：氧气 ${oxygenMax}，下去别贪。`,
  };
}

/** 深度越深水流越横，纯函数（只吃 time/depth），给移动加一点手感又不破坏可重放。 */
function currentAt(depth, time) {
  return Math.sin(depth * 0.05 + time * 0.8) * 2;
}

function num(v, fallback) {
  return Number.isFinite(v) ? v : fallback;
}

/** 旧档里的会话缺 time/oxygenMax/bubbles 等新字段，先补默认值再步进，避免算出 NaN。 */
function hydrate(session) {
  const maxDepth = num(session.maxDepth, 90);
  return {
    ...session,
    x: num(session.x, 0),
    depth: num(session.depth, 0),
    maxDepth,
    time: num(session.time, 0),
    bestDepth: num(session.bestDepth, num(session.depth, 0)),
    oxygen: num(session.oxygen, 100),
    oxygenMax: num(session.oxygenMax, Math.max(100, num(session.oxygen, 100))),
    danger: num(session.danger, 0),
    loot: Array.isArray(session.loot) ? session.loot : [],
    nodes: Array.isArray(session.nodes) ? session.nodes : [],
    bubbles: Array.isArray(session.bubbles) ? session.bubbles : [],
    sharks: (Array.isArray(session.sharks) ? session.sharks : []).map((s) => ({
      ...s,
      x: num(s.x, 0),
      y: num(s.y, 0),
      vx: num(s.vx, 0),
      vy: num(s.vy, 0),
      speed: num(s.speed, 1),
    })),
  };
}

function substep(prev, input, dt) {
  const next = {
    ...prev,
    sharks: prev.sharks.map((s) => ({ ...s })),
    nodes: prev.nodes.slice(),
    bubbles: (prev.bubbles || []).slice(),
    loot: prev.loot.slice(),
  };
  const boost = !!input.boost;
  const spd = SWIM_SPEED * (boost ? 1.35 : 1);
  const ix = clamp(Number(input.x) || 0, -1, 1);
  const iy = clamp(Number(input.y) || 0, -1, 1);

  next.time = round2(next.time + dt);
  next.x = clamp(next.x + (ix * spd + currentAt(next.depth, next.time)) * dt, 0, 100);
  next.depth = clamp(next.depth + iy * spd * dt, 0, next.maxDepth ?? 90);
  next.bestDepth = Math.max(next.bestDepth, next.depth);
  next.oxygen -= dt * (6 + next.depth * 0.04) * (boost ? 1.6 : 1);
  if (ix !== 0) next.facing = ix > 0 ? 1 : -1;

  let nearest = Infinity;
  for (const s of next.sharks) {
    const dx = next.x - s.x;
    const dy = next.depth - s.y;
    const dist = Math.hypot(dx, dy);
    s.aggro = dist < SHARK_AGGRO_R;
    if (s.aggro && dist > 0.001) {
      s.x += (dx / dist) * s.speed * 7 * dt;
      s.y += (dy / dist) * s.speed * 3 * dt;
    } else {
      s.x += s.vx * dt * 8;
      s.y += s.vy * dt * 4;
    }
    if (s.x < 0 || s.x > 100) s.vx *= -1;
    if (s.y < 10 || s.y > (next.maxDepth ?? 90)) s.vy *= -1;
    s.x = clamp(s.x, 0, 100);
    s.y = clamp(s.y, 10, next.maxDepth ?? 90);
    const after = Math.hypot(s.x - next.x, s.y - next.depth);
    nearest = Math.min(nearest, after);
    if (after < SHARK_BITE_R) {
      next.alive = false;
      next.done = true;
      next.message = "鲨鱼贴脸了。老大，命比废铁贵。";
    }
  }
  next.danger = Number.isFinite(nearest) ? round2(clamp(1 - nearest / SHARK_AGGRO_R, 0, 1)) : 0;

  if (next.alive) {
    next.bubbles = next.bubbles.filter((b) => {
      if (Math.hypot(b.x - next.x, b.y - next.depth) < PICKUP_R) {
        next.oxygen = Math.min(next.oxygenMax ?? 100, next.oxygen + b.amount);
        return false;
      }
      return true;
    });

    next.nodes = next.nodes.filter((n) => {
      if (Math.hypot(n.x - next.x, n.y - next.depth) < PICKUP_R) {
        next.loot.push(n);
        return false;
      }
      return true;
    });
  }

  next.warning = next.oxygen < 25;
  if (next.oxygen <= 0) {
    next.oxygen = 0;
    next.done = true;
    next.alive = next.alive && next.depth < SURFACE_DEPTH;
    next.message = next.alive ? "氧气见底，正好浮上来了。" : "氧气耗尽，还在下面。";
  }
  if (input.surface && next.depth < SURFACE_DEPTH && !next.done) {
    next.done = true;
    next.surfaced = true;
    next.message = "上浮。";
  }
  return next;
}

/**
 * 纯步进。dt 大时内部按 0.05s 拆分，低帧率下不会穿过鲨鱼或资源点。
 * 会话已结束或不是 ok 会话时返回原引用。
 */
export function diveStep(session, input, dt) {
  if (!session?.ok || session.done) return session;
  const total = clamp(Number(dt) || 0, 0, 2);
  if (total <= 0) return session;
  const inp = input || {};
  const steps = Math.max(1, Math.ceil(total / SUBSTEP));
  const slice = total / steps;
  let cur = hydrate(session);
  for (let i = 0; i < steps; i += 1) {
    cur = substep(cur, inp, slice);
    if (cur.done) break;
  }
  return cur;
}

function diveRecordOf(state, session, loot) {
  const prev = state.explore?.diveRecord || {};
  return {
    runs: (prev.runs || 0) + 1,
    deaths: (prev.deaths || 0) + (session.alive ? 0 : 1),
    bestDepth: round2(Math.max(prev.bestDepth || 0, session.bestDepth || 0)),
    bestHaul: Math.max(prev.bestHaul || 0, session.alive ? loot.length : 0),
    lastRun: {
      zone: session.zone,
      depth: round2(session.bestDepth || 0),
      loot: loot.length,
      alive: !!session.alive,
      tick: state.meta?.tick ?? 0,
    },
  };
}

/**
 * session 缺省取 state.explore.dive。传入 {ok:false} 或 null 属调用方违规：
 * 不抛异常，只在 explore.dive 上有残留会话时清掉，否则返回原引用。
 */
export function finishDive(state, session = state.explore?.dive ?? null) {
  if (!session || session.ok !== true) {
    if ((state.explore?.dive ?? null) === null) return state;
    return { ...state, explore: { ...state.explore, dive: null } };
  }
  const loot = Array.isArray(session.loot) ? session.loot : [];
  const resources = { ...state.resources };
  if (session.alive) {
    for (const n of loot) resources[n.res] = (resources[n.res] || 0) + n.n;
  }
  const rare = session.alive ? loot.filter((n) => n.kind === "wreck").length : 0;
  return {
    ...state,
    resources,
    player: {
      ...state.player,
      hp: session.alive ? state.player.hp : Math.max(8, state.player.hp - 18),
      exp: state.player.exp + loot.length * 10,
    },
    explore: { ...state.explore, dive: null, diveRecord: diveRecordOf(state, session, loot) },
    log: [
      session.alive
        ? `上浮成功，捞到 ${loot.length} 件深海货${rare ? `（含沉船舱室 ${rare}）` : ""}。`
        : "差点喂鲨。老大，氧气管不是吸管。",
      ...state.log,
    ].slice(0, 24),
  };
}

/** 会话写进 state.explore.dive，刷新/存档不丢；缺潜水船坞返回原引用。 */
export function beginDive(state, zone = "wreck") {
  const session = startDive(state, zone);
  if (!session.ok) return state;
  return {
    ...state,
    explore: { ...state.explore, dive: session },
    log: [`下潜${session.zoneName}。氧气 ${session.oxygenMax}。`, ...state.log].slice(0, 24),
  };
}

/** 按 dt 推进 state 里的会话；没有在潜的会话就返回原引用。 */
export function advanceDive(state, input, dt) {
  const cur = state.explore?.dive;
  if (!cur?.ok || cur.done) return state;
  const next = diveStep(cur, input, dt);
  if (next === cur) return state;
  return { ...state, explore: { ...state.explore, dive: next } };
}

/** UI HUD 用的只读快照，未下潜时返回 active:false。 */
export function diveHud(state) {
  const s = state.explore?.dive;
  if (!s?.ok) {
    return { active: false, zone: null, oxygen: 0, oxygenPct: 0, depth: 0, loot: 0, danger: 0, warning: false };
  }
  return {
    active: !s.done,
    zone: s.zone,
    zoneName: s.zoneName,
    oxygen: Math.round(s.oxygen),
    oxygenPct: round2(clamp(s.oxygen / (s.oxygenMax || 100), 0, 1)),
    depth: Math.round(s.depth),
    maxDepth: s.maxDepth,
    loot: (s.loot || []).length,
    nodes: (s.nodes || []).length,
    bubbles: (s.bubbles || []).length,
    danger: s.danger || 0,
    warning: !!s.warning,
    alive: !!s.alive,
    done: !!s.done,
    message: s.message || "",
  };
}
