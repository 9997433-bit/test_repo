import { emptyResources } from "../data/resources.js";
import { hashSeed } from "./rng.js";

const SAVE_KEY = "cww.save.v1";

function blankTiles(w, h) {
  return Array.from({ length: h }, () => Array.from({ length: w }, () => null));
}

export function defaultState(seed = {}) {
  const raftW = seed.raft?.width ?? 6;
  const raftH = seed.raft?.height ?? 5;
  const base = {
    meta: {
      title: "疯狂水世界",
      version: "0.1.0",
      seed: seed.meta?.seed ?? 20260108,
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
      width: raftW,
      height: raftH,
      tiles: blankTiles(raftW, raftH),
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
    campaign: { stage: 1, bestStage: 0, idleSince: 0 },
    settings: { muted: false, reduceMotion: false },
    log: ["潮水上涨。老大，这叶破木筏就靠你了。"],
  };
  return structuredClone({ ...base, ...seed, meta: { ...base.meta, ...seed.meta } });
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

export function saveState(state) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  } catch {
    /* ignore quota */
  }
}

export function loadState() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
