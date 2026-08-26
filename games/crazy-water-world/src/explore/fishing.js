import { FISH, FISHING_RULES, SEAS } from "../data/fish.js";
import { mulberry32, pickWeighted } from "../core/rng.js";
import { EXPLORE_REASON, modOf, weatherLabel } from "./mods.js";

export const GRADES = { PERFECT: "perfect", GOOD: "good", MISS: "miss" };

/** 每一竿的窗口漂移上限：让同一条鱼在不同 tick 落在节奏条的不同位置，任何时机都可能被覆盖。 */
const WINDOW_DRIFT = 0.22;
/** 钓鱼椅每级放宽的单边窗口。 */
const CHAIR_PAD = 0.03;
/** 天气 fishing 每偏离 1 换算成的单边窗口宽放（暴雨放宽、风暴收窄）。 */
const WEATHER_PAD = 0.08;
/** 天气对节奏条速度的作用区间：咬钩率越低指针越快，但别快到不可玩。 */
const WEATHER_SWEEP = [0.5, 1.5];
/** 唯一掉落：完美收杆不翻倍（口径见 data/fish.js FISHING_RULES.perfectMult 注释）。 */
const UNIQUE_DROPS = new Set(["blueprint", "badge", "shard", "hourglass"]);

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

function round3(n) {
  return Math.round(n * 1000) / 1000;
}

function num(v, fallback) {
  return Number.isFinite(v) ? v : fallback;
}

function buildingLevel(state, type) {
  return (state.buildings || [])
    .filter((b) => b.type === type)
    .reduce((best, b) => Math.max(best, b.level || 1), 0);
}

function chairLevel(state) {
  return buildingLevel(state, "fish_chair");
}

/** 天气咬钩率倍率（0 = 该天气禁钓）。轴名由 FISHING_RULES.weatherField 给。 */
export function fishingMul(state) {
  return modOf(state, FISHING_RULES.weatherField || "fishing", 1);
}

/** 海域解锁读 SEAS[*].unlock：always / building+level / stage（按已通关数 bestStage）。 */
function seaUnlocked(state, def) {
  const u = def?.unlock || {};
  if (u.always) return true;
  if (u.building && buildingLevel(state, u.building) < num(u.level, 1)) return false;
  if (Number.isFinite(u.stage) && (state.campaign?.bestStage || 0) < u.stage) return false;
  return true;
}

/** 当前可钓鱼池：海域集合按 SEAS 解锁条件筛，鱼种按 fish.sea 归属。 */
export function fishingPool(state) {
  const open = [];
  for (const def of Object.values(SEAS)) {
    if (seaUnlocked(state, def)) open.push(def.id);
  }
  const openSet = new Set(open);
  const pool = FISH.filter((f) => openSet.has(f.sea));
  // sea 保留旧口径（near / deep），只是现在多了一档 abyss。
  const sea = openSet.has("abyss") ? "abyss" : openSet.has("deep") ? "deep" : "near";
  return { sea, seas: open, pool };
}

/** 窗口按漂移平移后整体夹回 [0,1]，宽度不变，保证 window 始终是可命中的合法区间。 */
function placeWindow(base, pad, drift) {
  const lo0 = clamp(base[0] - pad, 0, 1);
  const hi0 = clamp(base[1] + pad, 0, 1);
  const width = Math.min(0.9, Math.max(0.04, hi0 - lo0));
  const lo = clamp(lo0 + drift, 0, 1 - width);
  return [round3(lo), round3(lo + width)];
}

function perfectRatio() {
  return num(FISHING_RULES.perfectRatio, 0.35);
}

function perfectBand(window) {
  const width = window[1] - window[0];
  const half = (width * perfectRatio()) / 2;
  const mid = (window[0] + window[1]) / 2;
  return [round3(mid - half), round3(mid + half)];
}

/**
 * 单程扫描秒数。基准读 FISHING_RULES.barSweepSec（一个来回），鱼自带的 bar 越大越快；
 * 钓鱼椅等级把它拖慢，天气咬钩率低则再加速。UI 的 needle 用 sweep = travel×2。
 */
function travelSeconds(fish, level, bite) {
  const sweep = num(FISHING_RULES.barSweepSec, 1.6) / Math.max(0.2, num(fish.bar, 1));
  const chair = 1 + Math.max(0, level - 1) * 0.06;
  const weather = clamp(bite, WEATHER_SWEEP[0], WEATHER_SWEEP[1]);
  return round3((sweep / 2) * chair * weather);
}

/** 前置检查：钓鱼椅 + 天气。UI 想在按钮上解释「为什么不能抛」直接读这里。 */
export function canCast(state) {
  const level = chairLevel(state);
  if (!level) {
    return { ok: false, reason: "先搭钓鱼椅再摸鱼，老大。", code: EXPLORE_REASON.REQUIRES_BUILDING };
  }
  const bite = fishingMul(state);
  if (!(bite > 0)) {
    return {
      ok: false,
      reason: `${weatherLabel(state)}：这浪头下没鱼咬钩，收杆。`,
      code: EXPLORE_REASON.WEATHER,
      fishing: bite,
    };
  }
  return { ok: true, reason: "", code: "", chairLevel: level, fishing: bite };
}

export function castLine(state) {
  const gate = canCast(state);
  if (!gate.ok) return gate;
  const level = gate.chairLevel;
  const bite = gate.fishing;
  const { sea, seas, pool } = fishingPool(state);
  if (!pool.length) return { ok: false, reason: "这片海空了，换个地方。", code: EXPLORE_REASON.NOT_FOUND };
  const rng = mulberry32((state.meta.seed + state.meta.tick * 17) >>> 0);
  const fish = pickWeighted(
    rng,
    pool.map((f) => [f, f.weight]),
  );
  const drift = (rng() - 0.5) * 2 * WINDOW_DRIFT;
  // 天气咬钩率直接换算成窗口宽窄：暴雨（1.2）好钓，风暴（0.5）窗口收窄。
  const pad = Math.max(0, level - 1) * CHAIR_PAD + (bite - 1) * WEATHER_PAD;
  const window = placeWindow(fish.window, pad, drift);
  const perfect = perfectBand(window);
  const travel = travelSeconds(fish, level, bite);
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
    travel,
    sweep: round3(travel * 2),
    sea,
    seas,
    fishing: bite,
    weather: weatherLabel(state),
    chairLevel: level,
    poolIds: pool.map((f) => f.id),
    tip: `${fish.name}：${sea === "near" ? "近海线" : sea === "abyss" ? "深渊线" : "深海线"}，窗口 ${Math.round(window[0] * 100)}–${Math.round(window[1] * 100)}`,
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

/** 纯判定：Perfect（窗口正中 perfectRatio）/ Good（窗口内）/ Miss（窗口外）。 */
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

function recordCodex(state, fish, result, tick) {
  const codex = codexOf(state);
  const prev = codex[fish.id];
  const entry = {
    id: fish.id,
    name: fish.name,
    sea: fish.sea,
    rarity: fish.rarity || "common",
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

/** 完美收杆按 FISHING_RULES.perfectMult 翻倍，蓝图/徽章这类唯一掉落不翻。 */
function gainsOf(fish, perfect) {
  const mult = perfect ? Math.max(1, num(FISHING_RULES.perfectMult, 2)) : 1;
  const gained = {};
  for (const [k, v] of Object.entries(fish.value)) {
    gained[k] = UNIQUE_DROPS.has(k) ? v : v * mult;
  }
  return gained;
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

  const gained = gainsOf(cast.fish, result.perfect);
  const resources = { ...state.resources };
  for (const [k, v] of Object.entries(gained)) resources[k] = (resources[k] || 0) + v;
  const baseExp = num(cast.fish.xp, 6);
  const exp = result.perfect ? Math.round(baseExp * Math.max(1, num(FISHING_RULES.perfectMult, 2))) : baseExp;
  // 首钓奖励读 fish.firstCatch（图鉴收录那一刻结算一次）。
  const bonus = newEntry ? cast.fish.firstCatch || null : null;

  return {
    ...state,
    resources,
    player: {
      ...state.player,
      exp: state.player.exp + exp,
      coins: num(state.player.coins, 0) + num(bonus?.coins, 0),
      diamonds: num(state.player.diamonds, 0) + num(bonus?.diamonds, 0),
    },
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
          bonus,
        },
      },
    },
    log: [
      result.perfect
        ? `完美收杆！${cast.fish.name}整条上岸，还多抖出一份。`
        : `钓上 ${cast.fish.name}！晚饭有着落了。`,
      ...(newEntry ? [`图鉴 +1：${cast.fish.name}${bonus?.coins ? `（首钓 +${bonus.coins} 金币）` : ""}`] : []),
      ...state.log,
    ].slice(0, 24),
  };
}

/** 把 cast 写进 state.explore.fishing.cast，刷新不丢；缺钓鱼椅或天气禁钓返回原引用。 */
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

/** 天气翻脸时把线收回来：不记图鉴、不算空军，只清竿子并播报。 */
function forceReel(state, cast) {
  const fishing = state.explore.fishing || {};
  return {
    ...state,
    explore: {
      ...state.explore,
      fishing: {
        ...fishing,
        cast: null,
        lastCatch: {
          miss: true,
          forced: true,
          name: cast.fish?.name || "鱼",
          id: cast.fish?.id || null,
          grade: GRADES.MISS,
          perfect: false,
          timing: 0,
          window: cast.window,
          accuracy: 0,
          gained: {},
          exp: 0,
          newEntry: false,
        },
      },
    },
    log: [`${weatherLabel(state)}：强制收杆，线先留着命要紧。`, ...state.log].slice(0, 24),
  };
}

/**
 * 天气巡检：正在钓且当前天气 fishing = 0（海啸）就强制收杆。
 * 没竿子或天气还能钓时返回原引用。
 */
export function syncFishingWeather(state) {
  const cast = state.explore?.fishing?.cast;
  if (!cast?.ok) return state;
  if (fishingMul(state) > 0) return state;
  return forceReel(state, cast);
}

/** 用 state 里存的 cast 收杆。没有在钓的竿子就返回原引用；天气禁钓时按强制收杆处理。 */
export function hookCast(state, timing01) {
  const cast = state.explore?.fishing?.cast;
  if (!cast?.ok) return state;
  if (!(fishingMul(state) > 0)) return forceReel(state, cast);
  return resolveHook(state, cast, timing01);
}

/** 图鉴面板数据：全鱼种 + 是否已收录 + 当前是否在可钓池内。 */
export function fishCodex(state) {
  const codex = codexOf(state);
  const { pool, seas } = fishingPool(state);
  const inPool = new Set(pool.map((f) => f.id));
  const entries = FISH.map((f) => {
    const e = codex[f.id];
    return {
      id: f.id,
      name: f.name,
      sea: f.sea,
      seaName: SEAS[f.sea]?.name || f.sea,
      rarity: f.rarity || "common",
      value: f.value,
      lore: f.lore || "",
      known: !!e?.caught,
      caught: e?.caught || 0,
      perfect: e?.perfect || 0,
      missed: e?.missed || 0,
      encountered: e?.encountered || 0,
      bestAccuracy: e?.bestAccuracy || 0,
      available: inPool.has(f.id),
    };
  });
  return { total: FISH.length, known: entries.filter((e) => e.known).length, seas, entries };
}

/** 钓鱼屏 HUD 快照：能不能抛、为什么不能、当前天气倍率与开放海域。 */
export function fishingHud(state) {
  const gate = canCast(state);
  const { sea, seas } = fishingPool(state);
  const cast = state.explore?.fishing?.cast || null;
  return {
    canCast: gate.ok,
    reason: gate.ok ? "" : gate.reason,
    code: gate.ok ? "" : gate.code,
    chairLevel: chairLevel(state),
    fishing: fishingMul(state),
    weather: weatherLabel(state),
    sea,
    seas,
    casting: !!cast?.ok,
    fish: cast?.ok ? cast.fish.name : null,
    window: cast?.ok ? cast.window : null,
    sweep: cast?.ok ? cast.sweep : 0,
    lastCatch: state.explore?.fishing?.lastCatch || null,
  };
}
