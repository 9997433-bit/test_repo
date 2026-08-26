import { hashSeed, mulberry32, pickWeighted } from "../core/rng.js";
import { DIVE_ZONES, DIVE_RULES } from "../data/dive.js";
import { EXPLORE_REASON, modOf, weatherLabel } from "./mods.js";

/**
 * 海区与通用常数全部来自 data/dive.js（唯一真源，原先 explore 这边那份写死的
 * shallow/reef/wreck/trench 已删）。布局不写死：每次下潜由 (meta.seed, meta.tick, zone)
 * 派生 rng 现场生成，同一 (seed, tick, zone) 必然重放出同一张图。
 */
export { DIVE_ZONES, DIVE_RULES };

export const DEFAULT_ZONE = "wreck";

const SUBSTEP = 0.05;
const SHARK_AGGRO_R = 22;
/** 冲刺的移速与氧耗系数（手感常数，表里没有）。 */
const BOOST_SPEED = 1.35;
const BOOST_O2 = 1.6;
/** 深度标尺：UI 的海底舞台按 90 米满格绘制，海区表只调氧耗与掉落，不调标尺。 */
const MAX_DEPTH = 90;

function num(v, fallback) {
  return Number.isFinite(v) ? v : fallback;
}

function rule(field, fallback) {
  return num(DIVE_RULES?.[field], fallback);
}

const SWIM_SPEED = rule("moveSpd", 18);
const PICKUP_R = rule("collectRadius", 5);
const SHARK_BITE_R = rule("sharkRadius", 6);
const SURFACE_DEPTH = rule("surfaceDepth", 8);
/** 鲨鱼不上浮到这条线以上：浮到 SURFACE_DEPTH 以内就一定咬不到，上浮永远是活路。 */
const SHARK_MIN_Y = SURFACE_DEPTH + SHARK_BITE_R;

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

/** 天气氧耗倍率（0 = 该天气禁潜）。轴名由 DIVE_RULES.weatherField 给。 */
export function diveO2Mul(state) {
  return modOf(state, DIVE_RULES.weatherField || "diveO2", 1);
}

function layoutSeed(state, zone) {
  return hashSeed(`dive|${zone}|${state.meta?.seed ?? 0}|${state.meta?.tick ?? 0}`);
}

/** [min,max] 区间掷一个整数；表里写单值或缺省都能兜住。 */
function rollCount(rng, range, fallback) {
  const lo = Math.round(num(Array.isArray(range) ? range[0] : range, fallback));
  const hi = Math.round(num(Array.isArray(range) ? range[1] : range, lo));
  return lo + Math.floor(rng() * Math.max(1, hi - lo + 1));
}

function bandOf(y) {
  return y < MAX_DEPTH * 0.4 ? "upper" : y < MAX_DEPTH * 0.75 ? "mid" : "deep";
}

/**
 * 前置检查：海区存在 → 船坞等级 → 关卡进度 → 天气。
 * UI 拿它给海区按钮上锁并写原因，不用自己复读解锁表。
 */
export function canDive(state, zone = DEFAULT_ZONE) {
  const def = DIVE_ZONES[zone];
  if (!def) return { ok: false, reason: "没这个海区。", code: EXPLORE_REASON.UNKNOWN_TYPE };
  const level = dockLevel(state);
  if (!level) return { ok: false, reason: "先造潜水船坞。", code: EXPLORE_REASON.REQUIRES_BUILDING };
  const needDock = num(def.unlock?.dockLevel, 1);
  if (level < needDock) {
    return { ok: false, reason: `${def.name}要 ${needDock} 级潜水船坞。`, code: EXPLORE_REASON.LOCKED };
  }
  const needStage = num(def.unlock?.stage, 0);
  if (needStage > 0 && (state.campaign?.bestStage || 0) < needStage) {
    return { ok: false, reason: `${def.name}要先打到第 ${needStage} 关。`, code: EXPLORE_REASON.LOCKED };
  }
  const o2 = diveO2Mul(state);
  if (!(o2 > 0)) {
    return { ok: false, reason: `${weatherLabel(state)}：这浪头下水就是喂鲨，等等。`, code: EXPLORE_REASON.WEATHER, diveO2: o2 };
  }
  return { ok: true, reason: "", code: "", zone: def.id, dockLevel: level, diveO2: o2 };
}

/** 海区选择面板数据：每个海区的解锁状态与拒绝原因。 */
export function diveZones(state) {
  return Object.values(DIVE_ZONES).map((def) => {
    const gate = canDive(state, def.id);
    return {
      id: def.id,
      name: def.name,
      flavor: def.flavor || "",
      oxygen: num(def.oxygen, 100),
      sharks: num(def.sharks?.count, 0),
      rareChance: num(def.rareChance, 0),
      unlocked: gate.ok,
      reason: gate.ok ? "" : gate.reason,
      code: gate.ok ? "" : gate.code,
    };
  });
}

export function startDive(state, zone = DEFAULT_ZONE) {
  const gate = canDive(state, zone);
  if (!gate.ok) return gate;
  const def = DIVE_ZONES[gate.zone];
  const level = gate.dockLevel;
  const seed = layoutSeed(state, def.id);
  const rng = mulberry32(seed);
  const oxygenMax = Math.max(40, num(def.oxygen, 100) + rule("oxygenPerDockLevel", 12) * (level - 1));

  const nodes = [];
  const count = rollCount(rng, def.nodeCount, 3);
  const table = (def.nodes || []).map((e) => [e, num(e.w, 1)]);
  for (let i = 0; i < count && table.length; i += 1) {
    const entry = pickWeighted(rng, table);
    const n = rollCount(rng, entry.n, 1);
    const y = round2(12 + rng() * (MAX_DEPTH - 16));
    nodes.push({
      id: `n${i + 1}`,
      x: round2(8 + rng() * 84),
      y,
      res: entry.res,
      n,
      kind: "node",
      rare: false,
      depthBand: bandOf(y),
    });
  }
  // 稀有点：整次下潜最多一个，按 rareChance 掷，坐标压在深水段（值钱的东西不摆在门口）。
  const rares = (def.rares || []).map((e) => [e, num(e.w, 1)]);
  if (rares.length && rng() < num(def.rareChance, 0)) {
    const entry = pickWeighted(rng, rares);
    const n = rollCount(rng, entry.n, 1);
    nodes.push({
      id: "r1",
      x: round2(10 + rng() * 80),
      y: round2(MAX_DEPTH * 0.62 + rng() * (MAX_DEPTH * 0.3)),
      res: entry.res,
      n,
      kind: "rare",
      rare: true,
      label: "稀有点",
      depthBand: "deep",
    });
  }

  const bubbles = [];
  const bubbleCount = Math.max(2, Math.round(num(def.nodeCount?.[0], 3) * 0.75));
  for (let i = 0; i < bubbleCount; i += 1) {
    bubbles.push({
      id: `b${i + 1}`,
      x: round2(6 + rng() * 88),
      y: round2(14 + rng() * (MAX_DEPTH - 18)),
      amount: 16 + Math.floor(rng() * 14),
    });
  }

  const sharks = [];
  const sharkSpeed = num(def.sharks?.speed, 1);
  for (let i = 0; i < num(def.sharks?.count, 0); i += 1) {
    sharks.push({
      id: `s${i + 1}`,
      x: round2(15 + rng() * 70),
      y: round2(16 + rng() * (MAX_DEPTH - 20)),
      vx: round2((rng() < 0.5 ? -1 : 1) * (0.35 + rng() * 0.5)),
      vy: round2((rng() - 0.5) * 0.25),
      speed: round2((0.8 + rng() * 0.5) * sharkSpeed),
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
    maxDepth: MAX_DEPTH,
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
    // 氧耗三件套跟着会话走：diveStep 是纯函数拿不到 state，advanceDive 每步再刷新倍率。
    o2Base: num(def.o2DrainBase, 6),
    o2PerDepth: num(def.o2DrainPerDepth, 0.04),
    o2Mult: gate.diveO2,
    weather: weatherLabel(state),
    message: `${def.name}：氧气 ${oxygenMax}，${def.flavor || "下去别贪。"}`,
  };
}

/** 深度越深水流越横，纯函数（只吃 time/depth），给移动加一点手感又不破坏可重放。 */
function currentAt(depth, time) {
  return Math.sin(depth * 0.05 + time * 0.8) * 2;
}

/** 旧档里的会话缺 time/oxygenMax/bubbles/o2* 等新字段，先补默认值再步进，避免算出 NaN。 */
function hydrate(session) {
  const maxDepth = num(session.maxDepth, MAX_DEPTH);
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
    o2Base: num(session.o2Base, 6),
    o2PerDepth: num(session.o2PerDepth, 0.04),
    o2Mult: num(session.o2Mult, 1),
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
  const spd = SWIM_SPEED * (boost ? BOOST_SPEED : 1);
  const ix = clamp(Number(input.x) || 0, -1, 1);
  const iy = clamp(Number(input.y) || 0, -1, 1);

  next.time = next.time + dt;
  next.x = clamp(next.x + (ix * spd + currentAt(next.depth, next.time)) * dt, 0, 100);
  next.depth = clamp(next.depth + iy * spd * dt, 0, next.maxDepth ?? MAX_DEPTH);
  next.bestDepth = Math.max(next.bestDepth, next.depth);
  // 氧耗 = (海区基准 + 深度×每米加成) × 天气 diveO2 × 冲刺。
  const drain = (next.o2Base + next.depth * next.o2PerDepth) * next.o2Mult;
  next.oxygen -= dt * drain * (boost ? BOOST_O2 : 1);
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
    if (s.y < SHARK_MIN_Y || s.y > (next.maxDepth ?? MAX_DEPTH)) s.vy *= -1;
    s.x = clamp(s.x, 0, 100);
    s.y = clamp(s.y, SHARK_MIN_Y, next.maxDepth ?? MAX_DEPTH);
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
 * opts.o2Mult 可覆盖会话里存的天气氧耗倍率（advanceDive 每步刷新用）。
 * 会话已结束或不是 ok 会话时返回原引用。
 */
export function diveStep(session, input, dt, opts = {}) {
  if (!session?.ok || session.done) return session;
  const total = clamp(Number(dt) || 0, 0, 2);
  if (total <= 0) return session;
  const inp = input || {};
  const steps = Math.max(1, Math.ceil(total / SUBSTEP));
  const slice = total / steps;
  let cur = hydrate(session);
  if (Number.isFinite(opts?.o2Mult)) cur = { ...cur, o2Mult: opts.o2Mult };
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
  // 旧会话把稀有点记成 kind:"wreck"，两种口径都认。
  const rare = session.alive ? loot.filter((n) => n.rare || n.kind === "wreck" || n.kind === "rare").length : 0;
  return {
    ...state,
    resources,
    player: {
      ...state.player,
      hp: session.alive ? state.player.hp : Math.max(8, state.player.hp - rule("failHpLoss", 18)),
      exp: state.player.exp + loot.length * rule("xpPerLoot", 10),
    },
    explore: { ...state.explore, dive: null, diveRecord: diveRecordOf(state, session, loot) },
    log: [
      session.alive
        ? `上浮成功，捞到 ${loot.length} 件深海货${rare ? `（含稀有点 ${rare}）` : ""}。`
        : "差点喂鲨。老大，氧气管不是吸管。",
      ...state.log,
    ].slice(0, 24),
  };
}

/** 会话写进 state.explore.dive，刷新/存档不丢；缺船坞、等级不够或天气禁潜返回原引用。 */
export function beginDive(state, zone = DEFAULT_ZONE) {
  const session = startDive(state, zone);
  if (!session.ok) return state;
  return {
    ...state,
    explore: { ...state.explore, dive: session },
    log: [`下潜${session.zoneName}。氧气 ${session.oxygenMax}。`, ...state.log].slice(0, 24),
  };
}

/** 天气翻脸（diveO2 = 0）时把人捞上来：会话直接结束，战利品照算。 */
function forceSurface(state, session) {
  return {
    ...state,
    explore: {
      ...state.explore,
      dive: {
        ...session,
        done: true,
        surfaced: true,
        forced: true,
        message: `${weatherLabel(state)}：紧急上浮，别贪那点铁。`,
      },
    },
    log: [`${weatherLabel(state)}：把老大从水里拽上来了。`, ...state.log].slice(0, 24),
  };
}

/** 天气巡检：正在潜且当前天气 diveO2 = 0（海啸）就强制结束会话，否则原引用。 */
export function syncDiveWeather(state) {
  const cur = state.explore?.dive;
  if (!cur?.ok || cur.done) return state;
  if (diveO2Mul(state) > 0) return state;
  return forceSurface(state, cur);
}

/** 按 dt 推进 state 里的会话（每步按当前天气刷新氧耗倍率）；没有在潜的会话就返回原引用。 */
export function advanceDive(state, input, dt) {
  const cur = state.explore?.dive;
  if (!cur?.ok || cur.done) return state;
  const o2Mult = diveO2Mul(state);
  if (!(o2Mult > 0)) return forceSurface(state, cur);
  const next = diveStep(cur, input, dt, { o2Mult });
  if (next === cur) return state;
  return { ...state, explore: { ...state.explore, dive: next } };
}

/** UI HUD 用的只读快照，未下潜时返回 active:false。 */
export function diveHud(state) {
  const s = state.explore?.dive;
  if (!s?.ok) {
    return {
      active: false,
      zone: null,
      oxygen: 0,
      oxygenPct: 0,
      depth: 0,
      loot: 0,
      danger: 0,
      warning: false,
      diveO2: diveO2Mul(state),
      weather: weatherLabel(state),
    };
  }
  return {
    active: !s.done,
    zone: s.zone,
    zoneName: s.zoneName,
    oxygen: Math.round(s.oxygen),
    oxygenMax: s.oxygenMax ?? 100,
    oxygenPct: round2(clamp(s.oxygen / (s.oxygenMax || 100), 0, 1)),
    depth: Math.round(s.depth),
    maxDepth: s.maxDepth,
    time: round2(s.time || 0),
    loot: (s.loot || []).length,
    nodes: (s.nodes || []).length,
    bubbles: (s.bubbles || []).length,
    danger: s.danger || 0,
    warning: !!s.warning,
    alive: !!s.alive,
    done: !!s.done,
    forced: !!s.forced,
    // diveO2 是当下天气的倍率，o2Mult 是这次下潜正在按的倍率（UI 的 diveStep 路径
    // 只在开潜那一刻取值，两者不等就说明天气中途翻脸了）。
    diveO2: diveO2Mul(state),
    o2Mult: num(s.o2Mult, 1),
    weather: weatherLabel(state),
    startWeather: s.weather || "",
    message: s.message || "",
  };
}
