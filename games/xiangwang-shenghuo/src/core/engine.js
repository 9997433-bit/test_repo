import { SEASONS } from "../data/crops.js";

export const HOUR_MS_DEFAULT = 6_000;
export const DAY_HOURS = 24;
export const DAYS_PER_SEASON = 7;

/** 升级所需累计经验，索引 i 对应 Lv.(i+1) */
export const LEVELS = [0, 40, 100, 180, 280, 420, 600, 820, 1100, 1450];

/** 新手引导：翻土 → 播种 → 收获 → 进屋看看 */
export const TUTORIAL_TOTAL = 4;

export function levelFor(xp) {
  let lv = 1;
  for (let i = 0; i < LEVELS.length; i += 1) if (xp >= LEVELS[i]) lv = i + 1;
  return lv;
}

export function levelProgress(xp) {
  const level = levelFor(xp);
  const base = LEVELS[level - 1] ?? 0;
  const next = LEVELS[level] ?? null;
  if (next === null) return { level, base, next: null, pct: 100 };
  const pct = Math.max(0, Math.min(100, ((xp - base) / (next - base)) * 100));
  return { level, base, next, pct };
}

export function createInitialState() {
  return {
    meta: {
      name: "新村长",
      level: 1,
      xp: 0,
      hourMs: HOUR_MS_DEFAULT,
      gameMinutes: 8 * 60,
      day: 1,
      season: "spring",
      muted: false,
      tutorialStep: 0,
    },
    resources: { coin: 80, pearl: 0, happiness: 40, warmth: 20, pop: 2, popCap: 4, shovel: 2, axe: 1, saw: 1 },
    inv: { chili: 2 },
    plots: [
      { id: "p1", status: "empty", cropId: null, plantedAt: 0, doneAt: 0, greenhouse: false },
      { id: "p2", status: "untilled", cropId: null, plantedAt: 0, doneAt: 0, greenhouse: false },
    ],
    buildings: {
      mushroom: { built: true, slots: [] },
      wish: { built: true, slots: [] },
    },
    jobs: [],
    wishes: [],
    guests: [],
    pets: [
      { id: "hua", name: "小花", kind: "dog", readyAt: 0 },
      { id: "tuan", name: "小团", kind: "cat", readyAt: 0 },
    ],
    log: ["蘑菇屋的门开了一条缝。风里有柴火和泥土的味道。"],
    ui: createInitialUi(),
  };
}

/** 纯视图状态：选中的种子、打开的房子、飘字、音效信号。存档会带上，缺失时补默认值。 */
export function createInitialUi() {
  return { seed: "rice", selected: "wish", toast: null, fx: null };
}

export function advanceTime(state, dtMs) {
  const hourMs = state.meta.hourMs || HOUR_MS_DEFAULT;
  let minutes = state.meta.gameMinutes + (dtMs / hourMs) * 60;
  let day = state.meta.day;
  let season = state.meta.season;
  let crossedDay = false;
  let crossedSeason = false;
  while (minutes >= DAY_HOURS * 60) {
    minutes -= DAY_HOURS * 60;
    day += 1;
    crossedDay = true;
    if ((day - 1) % DAYS_PER_SEASON === 0 && day > 1) {
      const i = SEASONS.indexOf(season);
      season = SEASONS[(i + 1) % SEASONS.length];
      crossedSeason = true;
    }
  }
  return {
    state: { ...state, meta: { ...state.meta, gameMinutes: minutes, day, season } },
    crossedDay,
    crossedSeason,
  };
}
