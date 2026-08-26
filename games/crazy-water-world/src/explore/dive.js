import { hashSeed, mulberry32, pickWeighted } from "../core/rng.js";
import { DIVE_ZONES, DIVE_RULES } from "../data/dive.js";
import { EXPLORE_REASON, modOf, weatherLabel } from "./mods.js";

/**
 * 海区与通用常数全部来自 data/dive.js（唯一真源，原先 explore 这边那份写死的
 * shallow/reef/wreck/trench 已删）。布局不写死：每次下潜由 (meta.seed, meta.tick, zone)
 * 派生 rng 现场生成，同一 (seed, tick, zone) 必然重放出同一张图。
 *
 * 三处收口（Round 3）：
 *   氧耗   —— 只有 diveDrain 一个算式，纯步进（diveStep）与 state 路径（advanceDive）
 *             共用；倍率 0（天气禁潜）在两条路上都是强制上浮，不是「白送氧气」。
 *   拒绝   —— canDive 把「海区门槛（顺序冻结）+ 人还在水下」一次说全，每条附上要多少/现在多少。
 *   结账   —— 每场下潜带 runId，finishDive 按台账幂等：巡检与 UI 抢着结算也只入一次袋。
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

/** 结账记档最多留最近这么多次下潜：够挡住重复结账，又不会把存档撑肥。 */
const SETTLED_KEEP = 8;

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
  return (state?.buildings || [])
    .filter((b) => b.type === "dive_dock")
    .reduce((best, b) => Math.max(best, b.level || 1), 0);
}

/**
 * 氧耗倍率钳域：非有限数或负数一律回退。负倍率会让氧气倒着涨，
 * 0 是「这天气不许下水」的约定值（禁潜），两者都不能悄悄放行。
 */
function o2MultOf(v, fallback) {
  return Number.isFinite(v) && v >= 0 ? v : fallback;
}

/** 会话的氧耗两件套：会话自己写了就用自己的，旧档缺字段按它那片海区的表补（不再一律按沉船）。 */
function drainOf(session) {
  const def = DIVE_ZONES[session?.zone];
  return {
    base: num(session?.o2Base, num(def?.o2DrainBase, 6)),
    perDepth: num(session?.o2PerDepth, num(def?.o2DrainPerDepth, 0.04)),
  };
}

/**
 * 每秒氧耗的唯一算式：(海区基准 + 深度×每米加成) × 天气倍率 ×(冲刺 1.6)。
 * diveStep 的子步与 advanceDive 的每次推进都只认这一处 —— 两条路径的氧耗按定义一致，
 * 差别只剩「倍率从哪儿取」：advanceDive 每次推进现问天气，纯步进用会话上存的那份。
 */
export function diveDrain(session, opts = {}) {
  const { base, perDepth } = drainOf(session);
  const mult = o2MultOf(opts.o2Mult, o2MultOf(session?.o2Mult, 1));
  return (base + num(session?.depth, 0) * perDepth) * mult * (opts.boost ? BOOST_O2 : 1);
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

/** 正在水下（未结束）的会话；没在潜返回 null。done 但还没结账的不算「在潜」。 */
function activeDive(state) {
  const cur = state?.explore?.dive;
  return cur?.ok === true && !cur.done ? cur : null;
}

/**
 * 海区本身开没开：海区存在 → 有船坞 → dockLevel → stage → 天气（顺序冻结）。
 * 每条拒绝除了人话还带上「要多少 / 现在多少」，UI 与测试不用去解析文案。
 */
function zoneGate(state, zone) {
  const def = DIVE_ZONES[zone];
  if (!def) return { ok: false, reason: "没这个海区。", code: EXPLORE_REASON.UNKNOWN_TYPE, zone };
  const level = dockLevel(state);
  const needDock = num(def.unlock?.dockLevel, 1);
  if (!level) {
    return {
      ok: false,
      reason: "先造潜水船坞。",
      code: EXPLORE_REASON.REQUIRES_BUILDING,
      zone: def.id,
      building: "dive_dock",
      dockLevel: 0,
      needDockLevel: needDock,
    };
  }
  if (level < needDock) {
    return {
      ok: false,
      reason: `${def.name}要 ${needDock} 级潜水船坞，现在 ${level} 级。`,
      code: EXPLORE_REASON.LOCKED,
      zone: def.id,
      dockLevel: level,
      needDockLevel: needDock,
    };
  }
  const needStage = num(def.unlock?.stage, 0);
  const bestStage = num(state?.campaign?.bestStage, 0);
  if (needStage > 0 && bestStage < needStage) {
    return {
      ok: false,
      reason: `${def.name}要先打到第 ${needStage} 关，现在第 ${bestStage} 关。`,
      code: EXPLORE_REASON.LOCKED,
      zone: def.id,
      dockLevel: level,
      bestStage,
      needStage,
    };
  }
  const o2 = diveO2Mul(state);
  if (!(o2 > 0)) {
    return {
      ok: false,
      reason: `${weatherLabel(state)}：这浪头下水就是喂鲨，等等。`,
      code: EXPLORE_REASON.WEATHER,
      zone: def.id,
      dockLevel: level,
      diveO2: o2,
      weather: weatherLabel(state),
    };
  }
  return { ok: true, reason: "", code: "", zone: def.id, dockLevel: level, diveO2: o2 };
}

/**
 * 「这会儿能不能下这片海」= 海区门槛（顺序冻结：海区存在 → 船坞 → dockLevel → stage → 天气）
 * 再加一条终检：人已经在水下就不许再开一次 —— 否则 beginDive 会把没结账的会话连同战利品盖掉。
 * UI 拿它给海区按钮上锁并写原因，不用自己复读解锁表。
 */
export function canDive(state, zone = DEFAULT_ZONE) {
  const gate = zoneGate(state, zone);
  if (!gate.ok) return gate;
  const busy = activeDive(state);
  if (busy) {
    return {
      ...gate,
      ok: false,
      reason: `老大还在${busy.zoneName || "水"}下面，先上浮再挑海区。`,
      code: EXPLORE_REASON.BUSY,
      busyZone: busy.zone,
    };
  }
  return gate;
}

/**
 * 海区选择面板数据。unlocked / reason / code 说的是「这片海区开了没有」（不含在潜与否），
 * available / blockReason / blockCode 说的是「此刻能不能点下潜」—— 潜水中三片海区照样显示已开。
 */
export function diveZones(state) {
  const busy = activeDive(state);
  return Object.values(DIVE_ZONES).map((def) => {
    const gate = zoneGate(state, def.id);
    const now = gate.ok && busy ? canDive(state, def.id) : gate;
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
      needDockLevel: num(def.unlock?.dockLevel, 1),
      needStage: num(def.unlock?.stage, 0),
      available: now.ok,
      blockReason: now.ok ? "" : now.reason,
      blockCode: now.ok ? "" : now.code,
    };
  });
}

/**
 * 一次下潜的身份证：结账幂等靠它认人。同一 tick 里死了再下也不会撞号 ——
 * 结完账 diveRecord.runs 就 +1，序号跟着变。
 */
function runIdOf(state, zoneId, seed, tick) {
  return `${zoneId}#${seed}#${tick}#${num(state?.explore?.diveRecord?.runs, 0)}`;
}

/** 旧档会话没有 runId：用 (海区, 布局种子, 起潜 tick) 兜一个等价键，照样能认出是同一场。 */
function runKeyOf(session) {
  const id = session?.runId;
  return typeof id === "string" && id ? id : `${session?.zone ?? "?"}#${session?.seed ?? 0}#${session?.startedTick ?? 0}`;
}

/** 已结账的下潜号码；存档被手改成别的形状时当作没结过（宁可漏挡也不能崩）。 */
function settledRuns(state) {
  const raw = state?.explore?.diveRecord?.settled;
  return Array.isArray(raw) ? raw.filter((k) => typeof k === "string") : [];
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

  const startedTick = state.meta?.tick ?? 0;
  return {
    ok: true,
    zone: def.id,
    zoneName: def.name,
    seed,
    startedTick,
    runId: runIdOf(state, def.id, seed, startedTick),
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
    // 氧耗三件套跟着会话走：diveStep 是纯函数拿不到 state，advanceDive 每次推进再刷新倍率。
    o2Base: num(def.o2DrainBase, 6),
    o2PerDepth: num(def.o2DrainPerDepth, 0.04),
    o2Mult: o2MultOf(gate.diveO2, 1),
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
  const drain = drainOf(session);
  return {
    ...session,
    runId: runKeyOf(session),
    x: num(session.x, 0),
    depth: num(session.depth, 0),
    maxDepth,
    time: num(session.time, 0),
    bestDepth: num(session.bestDepth, num(session.depth, 0)),
    oxygen: num(session.oxygen, 100),
    oxygenMax: num(session.oxygenMax, Math.max(100, num(session.oxygen, 100))),
    danger: num(session.danger, 0),
    o2Base: drain.base,
    o2PerDepth: drain.perDepth,
    o2Mult: o2MultOf(session.o2Mult, 1),
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
  next.oxygen -= dt * diveDrain(next, { boost });
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
 * 天气禁潜（diveO2 = 0）时那条会话长什么样，只在这儿定义一次：
 * 纯步进与 advanceDive / 巡检拽上来的会话字段逐个对得上，播报也是同一句。
 */
function surfacedByWeather(session, label) {
  return {
    ...session,
    done: true,
    surfaced: true,
    forced: true,
    message: `${label}：紧急上浮，别贪那点铁。`,
  };
}

/**
 * 纯步进。dt 大时内部按 0.05s 拆分，低帧率下不会穿过鲨鱼或资源点。
 * opts.o2Mult 覆盖会话里存的天气氧耗倍率（advanceDive 每次推进现问天气用），
 * opts.weather 只在强制上浮那句播报里出现。
 * 会话已结束或不是 ok 会话时返回原引用。
 */
export function diveStep(session, input, dt, opts = {}) {
  if (!session?.ok || session.done) return session;
  const o2Mult = o2MultOf(opts?.o2Mult, o2MultOf(session.o2Mult, 1));
  // 禁潜倍率不是「白送氧气」：倍率 0 一律当场强制上浮。以前纯步进这条路会算出
  // 氧耗 0 —— 海啸里直调 diveStep 能无限潜水，跟 advanceDive 的判定正好相反。
  if (!(o2Mult > 0)) return surfacedByWeather(session, opts?.weather || session.weather || "这天气");
  const total = clamp(Number(dt) || 0, 0, 2);
  if (total <= 0) return session;
  const inp = input || {};
  const steps = Math.max(1, Math.ceil(total / SUBSTEP));
  const slice = total / steps;
  let cur = { ...hydrate(session), o2Mult };
  for (let i = 0; i < steps; i += 1) {
    cur = substep(cur, inp, slice);
    if (cur.done) break;
  }
  return cur;
}

function diveRecordOf(state, session, loot, runKey) {
  const prev = state.explore?.diveRecord || {};
  return {
    ...prev,
    runs: (prev.runs || 0) + 1,
    deaths: (prev.deaths || 0) + (session.alive ? 0 : 1),
    bestDepth: round2(Math.max(prev.bestDepth || 0, session.bestDepth || 0)),
    bestHaul: Math.max(prev.bestHaul || 0, session.alive ? loot.length : 0),
    // 结账台账：认过号的下潜不再入第二次袋（巡检与 UI 谁先喊都一样）。
    settled: [...settledRuns(state), runKey].slice(-SETTLED_KEEP),
    lastRun: {
      zone: session.zone,
      runId: runKey,
      depth: round2(session.bestDepth || 0),
      loot: loot.length,
      alive: !!session.alive,
      tick: state.meta?.tick ?? 0,
    },
  };
}

/** 清掉挂在 state 上的残留会话；本来就没有就还回原引用。 */
function dropDive(state) {
  if ((state.explore?.dive ?? null) === null) return state;
  return { ...state, explore: { ...state.explore, dive: null } };
}

/**
 * session 缺省取 state.explore.dive。传入 {ok:false} 或 null 属调用方违规：
 * 不抛异常，只在 explore.dive 上有残留会话时清掉，否则返回原引用。
 *
 * 幂等 [附加]：每场下潜按 runId 记一笔台账，认过号的再喊一次只清残留会话、不二次入袋。
 * 量子巡检（stepSim 给 done 会话补的那次结账）与 UI 手上的会话副本因此可以抢着结算，
 * 战利品、经验、掉血、生涯统计都只算一遍。
 */
export function finishDive(state, session = state.explore?.dive ?? null) {
  if (!session || session.ok !== true) return dropDive(state);
  const runKey = runKeyOf(session);
  if (settledRuns(state).includes(runKey)) {
    const live = state.explore?.dive ?? null;
    return live && runKeyOf(live) === runKey ? dropDive(state) : state;
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
    explore: { ...state.explore, dive: null, diveRecord: diveRecordOf(state, session, loot, runKey) },
    log: [
      session.alive
        ? `上浮成功，捞到 ${loot.length} 件深海货${rare ? `（含稀有点 ${rare}）` : ""}。`
        : "差点喂鲨。老大，氧气管不是吸管。",
      ...state.log,
    ].slice(0, 24),
  };
}

/**
 * 会话写进 state.explore.dive，刷新/存档不丢；缺船坞、等级不够、天气禁潜或人还在水下
 * （canDive 的 E_BUSY）返回原引用。
 * 上一场已经结束却还没结账的会话先当场结账再开新的 —— 谁也别想把战利品盖没了。
 */
export function beginDive(state, zone = DEFAULT_ZONE) {
  const pending = state.explore?.dive;
  const base = pending?.ok === true && pending.done ? finishDive(state, pending) : state;
  const session = startDive(base, zone);
  if (!session.ok) return base;
  return {
    ...base,
    explore: { ...base.explore, dive: session },
    log: [`下潜${session.zoneName}。氧气 ${session.oxygenMax}。`, ...base.log].slice(0, 24),
  };
}

/** 天气翻脸（diveO2 = 0）时把人捞上来：会话直接结束（战利品留给 finishDive 结账）。 */
function forceSurface(state, session) {
  const label = weatherLabel(state);
  return {
    ...state,
    explore: { ...state.explore, dive: surfacedByWeather(session, label) },
    log: [`${label}：把老大从水里拽上来了。`, ...state.log].slice(0, 24),
  };
}

/** 天气巡检：正在潜且当前天气 diveO2 = 0（海啸）就强制结束会话，否则原引用。 */
export function syncDiveWeather(state) {
  const cur = state.explore?.dive;
  if (!cur?.ok || cur.done) return state;
  if (diveO2Mul(state) > 0) return state;
  return forceSurface(state, cur);
}

/**
 * 按 dt 推进 state 里的会话；没有在潜的会话就返回原引用。
 * 每次推进现问一次天气倍率，并把它写回会话（o2Mult）——所以推进后 diveHud 的
 * o2Mult 与 diveO2 必然相等，纯步进接着算也是同一份倍率，两条路径氧耗不会分叉。
 */
export function advanceDive(state, input, dt) {
  const cur = state.explore?.dive;
  if (!cur?.ok || cur.done) return state;
  const o2Mult = diveO2Mul(state);
  const label = weatherLabel(state);
  // 禁潜倍率交给 forceSurface：会话字段与 diveStep 那条路完全同形，只多一行播报。
  if (!(o2Mult > 0)) return forceSurface(state, cur);
  const next = diveStep(cur, input, dt, { o2Mult, weather: label });
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
      drain: 0,
      diveO2: diveO2Mul(state),
      weather: weatherLabel(state),
    };
  }
  return {
    active: !s.done,
    zone: s.zone,
    zoneName: s.zoneName,
    runId: runKeyOf(s),
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
    // 当下每秒烧多少氧（含深度加成，不含冲刺）——与 diveStep 子步用的是同一个算式。
    drain: round2(diveDrain(s)),
    // diveO2 是当下天气的倍率，o2Mult 是这次下潜正在按的倍率。走 advanceDive 推进的会话
    // 每次推进都会把倍率刷成当下天气，两者不等只可能出现在「没人推进」的静止帧。
    diveO2: diveO2Mul(state),
    o2Mult: o2MultOf(s.o2Mult, 1),
    weather: weatherLabel(state),
    startWeather: s.weather || "",
    message: s.message || "",
  };
}
