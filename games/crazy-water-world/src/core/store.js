import { emptyResources, RESOURCE_KEYS } from "../data/resources.js";
import { RAFT_RULES } from "../data/buildings.js";
import { hashSeed } from "./rng.js";

const SAVE_KEY = "cww.save.v1";
const SCREENS = ["title", "raft", "build", "fish", "dive", "heroes", "campaign"];
const SPEEDS = [1, 2, 4];
export const OFFLINE_CAP_SECONDS = 8 * 3600;

function blankTiles(w, h) {
  return Array.from({ length: h }, () => Array.from({ length: w }, () => null));
}

function isPlainObject(v) {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

function deepMerge(base, patch) {
  if (!isPlainObject(patch)) return base;
  const out = { ...base };
  for (const [k, v] of Object.entries(patch)) {
    if (v === undefined) continue;
    out[k] = isPlainObject(v) && isPlainObject(base[k]) ? deepMerge(base[k], v) : v;
  }
  return out;
}

function num(v, fallback, min = -Infinity, max = Infinity) {
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

function int(v, fallback, min = -Infinity, max = Infinity) {
  return Math.round(num(v, fallback, min, max));
}

function bool(v, fallback) {
  return typeof v === "boolean" ? v : fallback;
}

function str(v, fallback) {
  return typeof v === "string" && v.length ? v : fallback;
}

function list(v) {
  return Array.isArray(v) ? v : [];
}

function normalizeTile(cell) {
  if (!isPlainObject(cell) || typeof cell.buildingId !== "string") return null;
  return {
    buildingId: cell.buildingId,
    level: int(cell.level, 1, 1, 99),
    rot: cell.rot === 90 ? 90 : 0,
    occupant: null,
  };
}

function obj(v) {
  return isPlainObject(v) ? v : null;
}

// 漂浮物钳域：ttl / x / vx 被手改成 NaN 会让 spawnFlotsam 的漂移与命中检测一起烂掉。
// tier / phase / shimmer / bornTick 这类附加键原样带过（只加不删）。
function normalizeFlotsam(f) {
  return {
    ...f,
    id: str(f.id, ""),
    res: str(f.res, "wood"),
    n: num(f.n, 1, 0, 1e6),
    rare: bool(f.rare, false),
    x: num(f.x, 0, -2, 2),
    y: num(f.y, 0, -2, 2),
    vx: num(f.vx, 0, -1, 1),
    ttl: num(f.ttl, 0, 0, 3600),
  };
}

// 图鉴逐条钳域：读档丢图鉴等于把首钓奖励重开一遍（§10-N1）。
function normalizeCodex(raw) {
  const src = obj(raw);
  if (!src) return {};
  const out = {};
  for (const [id, e] of Object.entries(src)) {
    if (!isPlainObject(e)) continue;
    out[id] = {
      ...e,
      id: str(e.id, id),
      name: str(e.name, id),
      sea: str(e.sea, "near"),
      rarity: str(e.rarity, "common"),
      caught: int(e.caught, 0, 0),
      perfect: int(e.perfect, 0, 0),
      missed: int(e.missed, 0, 0),
      encountered: int(e.encountered, 0, 0),
      bestAccuracy: num(e.bestAccuracy, 0, 0, 1),
      firstTick: Number.isFinite(e.firstTick) ? int(e.firstTick, 0, 0) : null,
      lastTick: int(e.lastTick, 0, 0),
    };
  }
  return out;
}

// 进行中的竿子：只认 castLine 出来的成功形状（ok + fish + 合法窗口），
// 其余一律当没抛过——半截 cast 喂给 hookCast 会算出 NaN 判定。
function normalizeCast(raw) {
  const cast = obj(raw);
  if (!cast || cast.ok !== true || !isPlainObject(cast.fish)) return null;
  const w = cast.window;
  if (!Array.isArray(w) || !Number.isFinite(w[0]) || !Number.isFinite(w[1]) || w[1] <= w[0]) return null;
  return cast;
}

// 潜水生涯统计：runs/deaths/bestDepth/bestHaul 是只增量，读档清零等于抹掉战绩。
function normalizeDiveRecord(raw) {
  const rec = obj(raw);
  if (!rec) return null;
  const last = obj(rec.lastRun);
  return {
    ...rec,
    runs: int(rec.runs, 0, 0),
    deaths: int(rec.deaths, 0, 0),
    bestDepth: num(rec.bestDepth, 0, 0),
    bestHaul: int(rec.bestHaul, 0, 0),
    lastRun: last
      ? {
          ...last,
          zone: str(last.zone, ""),
          depth: num(last.depth, 0, 0),
          loot: int(last.loot, 0, 0),
          alive: bool(last.alive, false),
          tick: int(last.tick, 0, 0),
        }
      : null,
  };
}

// explore 分支逐字段收编（原先是整段白名单，读档会丢图鉴 / 拾荒计数 / 潜水战绩，§10-N1）。
// 口径：已知字段钳回合法域，未知附加键随对象展开带过，缺失补默认值。
function normalizeExplore(raw) {
  const src = obj(raw) || {};
  const salvage = obj(src.salvage) || {};
  const fishing = obj(src.fishing) || {};
  const diveRecord = normalizeDiveRecord(src.diveRecord);
  const explore = {
    ...src,
    salvage: {
      ...salvage,
      flotsam: list(salvage.flotsam).filter(isPlainObject).map(normalizeFlotsam),
      picked: int(salvage.picked, 0, 0),
      rarePicked: int(salvage.rarePicked, 0, 0),
      lastPick: obj(salvage.lastPick),
    },
    fishing: {
      ...fishing,
      lastCatch: obj(fishing.lastCatch),
      cast: normalizeCast(fishing.cast),
      castTick: int(fishing.castTick, 0, 0),
      codex: normalizeCodex(fishing.codex),
    },
    // 会话内部的缺字段由 explore/dive.js 的 hydrate() 现场补齐，这里只保形状。
    dive: obj(src.dive),
  };
  // 没潜过就别凭空造一条空战绩（契约里 diveRecord 是可选键）。
  if (diveRecord) explore.diveRecord = diveRecord;
  else delete explore.diveRecord;
  return explore;
}

// 存档可能来自旧版本或被手改过：把每个字段钳回合法域，缺失的补默认值，
// 免得 NaN（如 weatherTimer）悄悄毒化整条模拟。
function normalize(state, base) {
  const width = int(state.raft?.width, base.raft.width, 1, 64);
  const height = int(state.raft?.height, base.raft.height, 1, 64);
  const rawTiles = Array.isArray(state.raft?.tiles) ? state.raft.tiles : [];
  const tiles = Array.from({ length: height }, (_, y) =>
    Array.from({ length: width }, (_, x) => normalizeTile(Array.isArray(rawTiles[y]) ? rawTiles[y][x] : null)),
  );

  const resources = { ...emptyResources() };
  for (const k of RESOURCE_KEYS) resources[k] = num(state.resources?.[k], 0, 0, 1e12);

  // 存档带来的 world.mods 一律作废：派生倍率归模拟量子现算（world/sim.js 每次 tickWorld
  // 盖一份新的），手改档塞进来的倍率不许进模拟。core 因此不必反向 import world/**（§10-N6）。
  const world = { ...base.world, ...(isPlainObject(state.world) ? state.world : {}) };
  delete world.mods;

  return {
    ...state,
    meta: {
      ...base.meta,
      ...state.meta,
      title: str(state.meta?.title, base.meta.title),
      version: str(state.meta?.version, base.meta.version),
      seed: int(state.meta?.seed, base.meta.seed, 0, 0xffffffff) >>> 0,
      tick: int(state.meta?.tick, 0, 0, Number.MAX_SAFE_INTEGER),
      speed: SPEEDS.includes(state.meta?.speed) ? state.meta.speed : 1,
      started: bool(state.meta?.started, false),
      screen: SCREENS.includes(state.meta?.screen) ? state.meta.screen : base.meta.screen,
    },
    player: {
      ...base.player,
      ...state.player,
      name: str(state.player?.name, base.player.name),
      hunger: num(state.player?.hunger, base.player.hunger, 0, 100),
      thirst: num(state.player?.thirst, base.player.thirst, 0, 100),
      hp: num(state.player?.hp, base.player.hp, 1, 100),
      coins: int(state.player?.coins, base.player.coins, 0),
      diamonds: int(state.player?.diamonds, base.player.diamonds, 0),
      exp: num(state.player?.exp, 0, 0),
      level: int(state.player?.level, 1, 1, 999),
    },
    resources,
    raft: { width, height, tiles },
    buildings: list(state.buildings)
      .filter((b) => isPlainObject(b) && typeof b.id === "string" && typeof b.type === "string")
      .map((b) => ({
        ...b,
        x: int(b.x, 0, 0, width - 1),
        y: int(b.y, 0, 0, height - 1),
        level: int(b.level, 1, 1, 99),
        rot: b.rot === 90 ? 90 : 0,
        occupantHeroId: typeof b.occupantHeroId === "string" ? b.occupantHeroId : null,
      })),
    residents: list(state.residents)
      .filter(isPlainObject)
      .map((r) => ({
        ...r,
        hunger: num(r.hunger, 70, 0, 100),
        thirst: num(r.thirst, 70, 0, 100),
        hp: num(r.hp, 100, 0, 100),
        mood: num(r.mood, 60, 0, 100),
        order: isPlainObject(r.order) ? r.order : null,
      })),
    heroes: list(state.heroes).filter((h) => isPlainObject(h) && typeof h.id === "string"),
    world: {
      ...world,
      timeOfDay: num(state.world?.timeOfDay, base.world.timeOfDay, 0, 1),
      weather: str(state.world?.weather, base.world.weather),
      event: typeof state.world?.event === "string" ? state.world.event : null,
      seaSeed: int(state.world?.seaSeed, base.world.seaSeed, 0, 0xffffffff) >>> 0,
      weatherTimer: num(state.world?.weatherTimer, base.world.weatherTimer, 0, 3600),
    },
    explore: normalizeExplore(state.explore),
    campaign: {
      ...base.campaign,
      ...state.campaign,
      stage: int(state.campaign?.stage, 1, 1),
      bestStage: int(state.campaign?.bestStage, 0, 0),
      idleSince: num(state.campaign?.idleSince, 0, 0, OFFLINE_CAP_SECONDS),
    },
    settings: {
      muted: bool(state.settings?.muted, base.settings.muted),
      reduceMotion: bool(state.settings?.reduceMotion, base.settings.reduceMotion),
    },
    log: list(state.log)
      .filter((l) => typeof l === "string")
      .slice(0, 24),
  };
}

export function defaultState(seed = {}) {
  const [startW, startH] = RAFT_RULES.startSize;
  const base = {
    meta: {
      title: "疯狂水世界",
      version: "0.1.0",
      seed: 20260108,
      tick: 0,
      speed: 1,
      started: false,
      screen: "title",
    },
    player: {
      name: "老大",
      hunger: 80,
      thirst: 80,
      hp: 100,
      coins: 20,
      diamonds: 0,
      exp: 0,
      level: 1,
    },
    resources: emptyResources({
      wood: 24,
      plastic: 12,
      scrap: 8,
      rope: 6,
      rawFish: 2,
      freshWater: 6,
      seed: 1,
    }),
    raft: {
      width: startW,
      height: startH,
      tiles: blankTiles(startW, startH),
    },
    buildings: [],
    residents: [
      {
        id: "r1",
        name: "摸鱼阿强",
        job: "scavenger",
        hunger: 70,
        thirst: 70,
        hp: 100,
        mood: 60,
        order: { want: "fillet", qty: 2, rewardExp: 20 },
      },
    ],
    heroes: [],
    world: {
      timeOfDay: 0.28,
      weather: "clear",
      event: null,
      seaSeed: hashSeed("waste-sea"),
      weatherTimer: 90,
    },
    explore: {
      salvage: { flotsam: [] },
      fishing: { lastCatch: null },
      dive: null,
    },
    campaign: { stage: 1, bestStage: 0, idleSince: 0, attempts: 0 },
    settings: { muted: false, reduceMotion: false },
    log: ["潮水上涨。老大，这叶破木筏就靠你了。"],
  };
  // world.mods 不在这里预算：派生倍率是世界层的活，第一个量子的 tickWorld 就会盖上，
  // 在那之前消费方走 explore/mods.js 的天气表回退（契约 §10-N6 的迁走方案）。
  return structuredClone(normalize(deepMerge(base, isPlainObject(seed) ? seed : {}), base));
}

export function createStore(seed) {
  let state = defaultState(seed);
  const subs = new Set();
  return {
    get: () => state,
    patch(partial) {
      state = { ...state, ...partial };
      for (const fn of subs) fn(state);
      return state;
    },
    replace(next) {
      state = next;
      for (const fn of subs) fn(state);
      return state;
    },
    subscribe(fn) {
      subs.add(fn);
      return () => subs.delete(fn);
    },
  };
}

// 纯：把任意来源的存档对象钳成合法 GameState，并把离线时长折进 campaign.idleSince
// （由 stepSim 结算，见 world/sim.js settleOffline）。nowMs 由调用方注入，便于测试。
export function hydrateSave(raw, nowMs) {
  if (!isPlainObject(raw)) return null;
  if (!isPlainObject(raw.meta) && !isPlainObject(raw.raft)) return null;
  const state = defaultState(raw);
  const savedAt = num(raw.meta?.savedAt, 0, 0);
  const elapsed = savedAt > 0 ? Math.min(OFFLINE_CAP_SECONDS, Math.max(0, (nowMs - savedAt) / 1000)) : 0;
  state.campaign.idleSince = Math.min(OFFLINE_CAP_SECONDS, state.campaign.idleSince + elapsed);
  return state;
}

export function saveState(state) {
  try {
    const payload = { ...state, meta: { ...state.meta, savedAt: Date.now() } };
    localStorage.setItem(SAVE_KEY, JSON.stringify(payload));
  } catch {
    /* ignore quota */
  }
}

export function loadState() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    return hydrateSave(JSON.parse(raw), Date.now());
  } catch {
    return null;
  }
}
