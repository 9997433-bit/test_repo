import { FISH } from "../data/fish.js";
import { mulberry32, pickWeighted } from "../core/rng.js";

export const GRADES = { PERFECT: "perfect", GOOD: "good", MISS: "miss" };

/** 每一竿的窗口漂移上限：让同一条鱼在不同 tick 落在节奏条的不同位置，任何时机都可能被覆盖。 */
const WINDOW_DRIFT = 0.22;
/** Perfect 判定占窗口宽度的比例（居中）。 */
const PERFECT_RATIO = 0.4;
/** 钓鱼椅每级放宽的单边窗口。 */
const CHAIR_PAD = 0.03;

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

function round3(n) {
  return Math.round(n * 1000) / 1000;
}

function chairLevel(state) {
  return (state.buildings || [])
    .filter((b) => b.type === "fish_chair")
    .reduce((best, b) => Math.max(best, b.level || 1), 0);
}

/** 有潜水船坞才开深海与远洋鱼池——灯笼鱼这类蓝图鱼的唯一入口。 */
export function fishingPool(state) {
  const sea = (state.buildings || []).some((b) => b.type === "dive_dock") ? "deep" : "near";
  const pool = FISH.filter((f) => f.sea === "near" || f.sea === sea || (sea === "deep" && f.sea === "far"));
  return { sea, pool };
}

/** 窗口按漂移平移后整体夹回 [0,1]，宽度不变，保证 window 始终是可命中的合法区间。 */
function placeWindow(base, pad, drift) {
  const lo0 = clamp(base[0] - pad, 0, 1);
  const hi0 = clamp(base[1] + pad, 0, 1);
  const width = Math.min(0.9, Math.max(0.04, hi0 - lo0));
  const lo = clamp(lo0 + drift, 0, 1 - width);
  return [round3(lo), round3(lo + width)];
}

function perfectBand(window) {
  const width = window[1] - window[0];
  const half = (width * PERFECT_RATIO) / 2;
  const mid = (window[0] + window[1]) / 2;
  return [round3(mid - half), round3(mid + half)];
}

/** 鱼越稀有节奏条越快；钓鱼椅等级把它拖慢一点。 */
function travelSeconds(fish, level) {
  const base = clamp(0.8 + fish.weight * 0.02, 0.8, 1.6);
  return round3(base * (1 + Math.max(0, level - 1) * 0.06));
}

export function castLine(state) {
  const level = chairLevel(state);
  if (!level) return { ok: false, reason: "先搭钓鱼椅再摸鱼，老大。", code: "E_REQUIRES_BUILDING" };
  const { sea, pool } = fishingPool(state);
  const rng = mulberry32((state.meta.seed + state.meta.tick * 17) >>> 0);
  const fish = pickWeighted(
    rng,
    pool.map((f) => [f, f.weight]),
  );
  const drift = (rng() - 0.5) * 2 * WINDOW_DRIFT;
  const window = placeWindow(fish.window, Math.max(0, level - 1) * CHAIR_PAD, drift);
  const perfect = perfectBand(window);
  return {
    ok: true,
    id: `cast-${state.meta.tick}`,
    fish,
    window,
    seed: state.meta.tick,
    perfect,
    good: window,
    baseWindow: fish.window,
    biteAt: round3((perfect[0] + perfect[1]) / 2),
    travel: travelSeconds(fish, level),
    sea,
    chairLevel: level,
    poolIds: pool.map((f) => f.id),
    tip: `${fish.name}：${sea === "deep" ? "深海线" : "近海线"}，窗口 ${Math.round(window[0] * 100)}–${Math.round(window[1] * 100)}`,
  };
}

/** 节奏条光标位置（0..1 三角波）。elapsed 是抛竿后的模拟秒数，UI 拿它画来回扫动的指针。 */
export function castCursor(cast, elapsed) {
  if (!cast?.ok) return 0;
  const travel = cast.travel || 1.2;
  const t = Math.max(0, Number(elapsed) || 0);
  const p = (t / travel) % 2;
  return round3(p <= 1 ? p : 2 - p);
}

/** 纯判定：Perfect（窗口正中 40%）/ Good（窗口内）/ Miss（窗口外）。 */
export function gradeCast(cast, timing01) {
  const t = Number(timing01);
  if (!cast?.ok || !Number.isFinite(t)) {
    return { grade: GRADES.MISS, hit: false, perfect: false, timing: 0, offset: 1, accuracy: 0 };
  }
  const [lo, hi] = cast.window;
  const band = cast.perfect || perfectBand(cast.window);
  const mid = (lo + hi) / 2;
  const half = Math.max(1e-6, (hi - lo) / 2);
  const hit = t >= lo && t <= hi;
  const isPerfect = hit && t >= band[0] && t <= band[1];
  return {
    grade: isPerfect ? GRADES.PERFECT : hit ? GRADES.GOOD : GRADES.MISS,
    hit,
    perfect: isPerfect,
    timing: round3(t),
    offset: round3(t - mid),
    accuracy: round3(clamp(1 - Math.abs(t - mid) / half, 0, 1)),
  };
}

function codexOf(state) {
  return state.explore?.fishing?.codex || {};
}

/** Perfect 额外再给一份主产物（取 value 里最大的一项），整数不掺小数。 */
function primaryEntry(value) {
  let best = null;
  for (const [k, v] of Object.entries(value)) {
    if (!best || v > best[1]) best = [k, v];
  }
  return best;
}

function recordCodex(state, fish, result, tick) {
  const codex = codexOf(state);
  const prev = codex[fish.id];
  const entry = {
    id: fish.id,
    name: fish.name,
    sea: fish.sea,
    caught: (prev?.caught || 0) + (result.hit ? 1 : 0),
    perfect: (prev?.perfect || 0) + (result.perfect ? 1 : 0),
    missed: (prev?.missed || 0) + (result.hit ? 0 : 1),
    encountered: (prev?.encountered || 0) + 1,
    bestAccuracy: Math.max(prev?.bestAccuracy || 0, result.accuracy),
    firstTick: prev?.firstTick ?? (result.hit ? tick : null),
    lastTick: tick,
  };
  return { codex: { ...codex, [fish.id]: entry }, newEntry: result.hit && !(prev?.caught > 0) };
}

export function resolveHook(state, cast, timing01) {
  if (!cast?.ok) return state;
  const tick = state.meta?.tick ?? 0;
  const result = gradeCast(cast, timing01);
  const fishing = state.explore.fishing || {};
  const { codex, newEntry } = recordCodex(state, cast.fish, result, tick);

  if (!result.hit) {
    return {
      ...state,
      explore: {
        ...state.explore,
        fishing: {
          ...fishing,
          cast: null,
          codex,
          lastCatch: {
            miss: true,
            name: cast.fish.name,
            id: cast.fish.id,
            grade: GRADES.MISS,
            perfect: false,
            timing: result.timing,
            window: cast.window,
            accuracy: result.accuracy,
            gained: {},
            exp: 0,
            newEntry: false,
          },
        },
      },
      log: [`${cast.fish.name}跑了。手生，再来。`, ...state.log].slice(0, 24),
    };
  }

  const gained = {};
  for (const [k, v] of Object.entries(cast.fish.value)) gained[k] = v;
  if (result.perfect) {
    const primary = primaryEntry(cast.fish.value);
    if (primary) gained[primary[0]] = (gained[primary[0]] || 0) + primary[1];
  }
  const resources = { ...state.resources };
  for (const [k, v] of Object.entries(gained)) resources[k] = (resources[k] || 0) + v;
  const exp = result.perfect ? 12 : 6;

  return {
    ...state,
    resources,
    player: { ...state.player, exp: state.player.exp + exp },
    explore: {
      ...state.explore,
      fishing: {
        ...fishing,
        cast: null,
        codex,
        lastCatch: {
          miss: false,
          name: cast.fish.name,
          id: cast.fish.id,
          grade: result.grade,
          perfect: result.perfect,
          timing: result.timing,
          window: cast.window,
          accuracy: result.accuracy,
          gained,
          exp,
          newEntry,
        },
      },
    },
    log: [
      result.perfect
        ? `完美收杆！${cast.fish.name}整条上岸，还多抖出一份。`
        : `钓上 ${cast.fish.name}！晚饭有着落了。`,
      ...(newEntry ? [`图鉴 +1：${cast.fish.name}`] : []),
      ...state.log,
    ].slice(0, 24),
  };
}

/** 把 cast 写进 state.explore.fishing.cast，刷新不丢；缺钓鱼椅返回原引用。 */
export function beginCast(state) {
  const cast = castLine(state);
  if (!cast.ok) return state;
  return {
    ...state,
    explore: {
      ...state.explore,
      fishing: { ...(state.explore.fishing || {}), cast, castTick: state.meta?.tick ?? 0 },
    },
  };
}

/** 用 state 里存的 cast 收杆。没有在钓的竿子就返回原引用。 */
export function hookCast(state, timing01) {
  const cast = state.explore?.fishing?.cast;
  if (!cast?.ok) return state;
  return resolveHook(state, cast, timing01);
}

/** 图鉴面板数据：全鱼种 + 是否已收录 + 当前是否在可钓池内。 */
export function fishCodex(state) {
  const codex = codexOf(state);
  const { pool } = fishingPool(state);
  const inPool = new Set(pool.map((f) => f.id));
  const entries = FISH.map((f) => {
    const e = codex[f.id];
    return {
      id: f.id,
      name: f.name,
      sea: f.sea,
      value: f.value,
      known: !!e?.caught,
      caught: e?.caught || 0,
      perfect: e?.perfect || 0,
      missed: e?.missed || 0,
      encountered: e?.encountered || 0,
      bestAccuracy: e?.bestAccuracy || 0,
      available: inPool.has(f.id),
    };
  });
  return { total: FISH.length, known: entries.filter((e) => e.known).length, entries };
}
