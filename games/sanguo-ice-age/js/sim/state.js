/** Game state factory + pure selectors. No DOM access here. */
import {
  SAVE_VERSION,
  POPULATION,
  MORALE,
  GACHA,
  ARMY,
  STORAGE_BASE,
  WAREHOUSE_PER_LEVEL,
  WORK,
} from "../config.js";
import { BUILDINGS, BUILDING_ORDER } from "../data/buildings.js";

export function createInitialState(seed = (Date.now() % 2147483647) | 0) {
  const buildings = {};
  for (const id of BUILDING_ORDER) buildings[id] = 0;
  buildings.furnace = 1;

  const state = {
    version: SAVE_VERSION,
    seed: seed >>> 0,
    rngState: seed >>> 0,
    tick: 0,
    day: 1,
    resources: { food: 100, wood: 90, coal: 0, iron: 0 },
    morale: MORALE.base,
    population: POPULATION.start,
    temperature: 0,
    fuel: { mode: "normal", source: "auto", starved: false },
    buildings,
    army: { infantry: 0, archer: 0, cavalry: 0 },
    marches: ARMY.marchesStart,
    heroes: [], // [{ id, level, dupes }]
    team: [null, null, null],
    tokens: GACHA.startTokens,
    souls: 0,
    stage: 0,
    questIndex: 0,
    blizzard: { active: false, index: 0, endsOnDay: 0 },
    stats: {
      blizzardsSurvived: 0,
      battlesWon: 0,
      battlesLost: 0,
      recruits: 0,
      trained: 0,
      popPeak: POPULATION.start,
      popLost: 0,
      produced: { food: 0, wood: 0, coal: 0, iron: 0 },
    },
    gameOver: false,
    log: [],
    // 瞬态（不入存档）：
    flow: { food: 0, wood: 0, coal: 0, iron: 0 },
    jobs: { assigned: {}, filled: 0, total: 0 },
  };
  return state;
}

/** 重新挂上瞬态字段（读档后调用）。 */
export function rehydrate(state) {
  state.flow = state.flow || { food: 0, wood: 0, coal: 0, iron: 0 };
  state.jobs = state.jobs || { assigned: {}, filled: 0, total: 0 };
  return state;
}

export function storageCap(state) {
  return STORAGE_BASE + state.buildings.warehouse * WAREHOUSE_PER_LEVEL;
}

export function popCap(state) {
  return POPULATION.baseCap + state.buildings.house * POPULATION.housePerLevel;
}

export function troopCap(state, type) {
  const campOf = { infantry: "infantryCamp", archer: "archerCamp", cavalry: "cavalryCamp" };
  return state.buildings[campOf[type]] * ARMY.capPerCampLevel;
}

export function totalTroops(state) {
  return state.army.infantry + state.army.archer + state.army.cavalry;
}

export function jobsTotal(state) {
  let total = 0;
  for (const id of BUILDING_ORDER) {
    if (BUILDINGS[id].prod) total += state.buildings[id] * WORK.workersPerLevel;
  }
  return total;
}

export function pushLog(state, text, kind = "info") {
  state.log.push({ day: state.day, text, kind });
  if (state.log.length > 80) state.log.splice(0, state.log.length - 80);
}
