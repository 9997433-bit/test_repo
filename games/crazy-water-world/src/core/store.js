import { emptyResources, RESOURCE_KEYS } from "../data/resources.js";
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

  return {
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
    residents: list(state.residents).filter(isPlainObject),
    heroes: list(state.heroes).filter((h) => isPlainObject(h) && typeof h.id === "string"),
    world: {
      ...base.world,
      ...state.world,
      timeOfDay: num(state.world?.timeOfDay, base.world.timeOfDay, 0, 1),
      weather: str(state.world?.weather, base.world.weather),
      event: typeof state.world?.event === "string" ? state.world.event : null,
      seaSeed: int(state.world?.seaSeed, base.world.seaSeed, 0, 0xffffffff) >>> 0,
      weatherTimer: num(state.world?.weatherTimer, base.world.weatherTimer, 0, 3600),
    },
    explore: {
      salvage: { flotsam: list(state.explore?.salvage?.flotsam).filter(isPlainObject) },
      fishing: { lastCatch: isPlainObject(state.explore?.fishing?.lastCatch) ? state.explore.fishing.lastCatch : null },
      dive: isPlainObject(state.explore?.dive) ? state.explore.dive : null,
    },
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
      width: 6,
      height: 5,
      tiles: blankTiles(6, 5),
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
