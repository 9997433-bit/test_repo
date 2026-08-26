import { SEASONS } from "../data/crops.js";

export const HOUR_MS_DEFAULT = 6_000;
export const DAY_HOURS = 24;
export const DAYS_PER_SEASON = 7;

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
    resources: { coin: 80, pearl: 0, happiness: 40, warmth: 20, pop: 2, popCap: 4, shovel: 1, axe: 0, saw: 0 },
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
  };
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
