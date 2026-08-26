import { performance } from "node:perf_hooks";
import { createStore, hydrateSave } from "../src/core/store.js";
import { stepSim } from "../src/core/engine.js";
import { placeBuilding, expandRaft, canPlace } from "../src/world/build.js";
import { tickWorld } from "../src/world/sim.js";
import { adjacentWalls } from "../src/world/grid.js";
import { spawnFlotsam } from "../src/explore/salvage.js";
import { beginDive } from "../src/explore/dive.js";
import { beginCast, hookCast } from "../src/explore/fishing.js";
import { simulateBattle } from "../src/combat/battle.js";
import { mulberry32 } from "../src/core/rng.js";
import { BUILDINGS } from "../src/data/buildings.js";
import { HEROES } from "../src/data/heroes.js";
import { STAGES } from "../src/data/stages.js";

const TARGET_BUILDINGS = 64;
const TARGET_RAFT_SIDE = 24;
const STOCK = 1_000_000_000;
const TSUNAMI_SIM_STEPS = 12;
const ROUND_TRIP_NOW_MS = 1_700_000_000_000;
const SHELTER_WALLS = [
  [2, 1],
  [3, 1],
  [1, 2],
  [4, 2],
  [1, 3],
  [4, 3],
  [2, 4],
  [3, 4],
];
const BUDGET_P95_MS = {
  tick: 2,
  stepSim: 4,
  spawn: 1,
  battle: 8,
};

function round(value) {
  return Math.round(value * 1_000_000) / 1_000_000;
}

function percentile(sorted, fraction) {
  return sorted[Math.max(0, Math.ceil(sorted.length * fraction) - 1)];
}

function finiteState(state) {
  const pending = [state];
  while (pending.length) {
    const value = pending.pop();
    if (typeof value === "number" && !Number.isFinite(value)) return false;
    if (Array.isArray(value)) pending.push(...value);
    else if (value && typeof value === "object") pending.push(...Object.values(value));
  }
  return true;
}

function measure(run, { samples, batch, warmup }) {
  for (let i = 0; i < warmup; i += 1) run();
  const timings = [];
  for (let sample = 0; sample < samples; sample += 1) {
    const started = performance.now();
    for (let i = 0; i < batch; i += 1) run();
    timings.push((performance.now() - started) / batch);
  }
  timings.sort((a, b) => a - b);
  return {
    unit: "ms/op",
    p50: round(percentile(timings, 0.5)),
    p95: round(percentile(timings, 0.95)),
    max: round(timings[timings.length - 1]),
    samples,
    batch,
  };
}

function placeFirstOpen(state, type) {
  for (const rot of [0, 90]) {
    for (let y = 0; y < state.raft.height; y += 1) {
      for (let x = 0; x < state.raft.width; x += 1) {
        if (!canPlace(state, type, x, y, rot).ok) continue;
        const next = placeBuilding(state, type, x, y, rot);
        if (next !== state) return next;
      }
    }
  }
  return state;
}

function assignEveryBuilding(state) {
  const fallbackHeroKey = Object.keys(HEROES)[0];
  const specialistByType = new Map();
  for (const [heroKey, hero] of Object.entries(HEROES)) {
    if (hero.assign?.likes && !specialistByType.has(hero.assign.likes)) {
      specialistByType.set(hero.assign.likes, heroKey);
    }
  }

  const heroes = state.buildings.map((building, index) => {
    const id = `bench-hero-${index}`;
    return {
      id,
      heroKey: specialistByType.get(building.type) || fallbackHeroKey,
      star: 5,
      xp: 0,
      assignedBuildingId: building.id,
      injuredUntil: 0,
    };
  });
  const occupantByBuilding = new Map(heroes.map((hero) => [hero.assignedBuildingId, hero.id]));
  return {
    ...state,
    heroes,
    buildings: state.buildings.map((building) => ({
      ...building,
      occupantHeroId: occupantByBuilding.get(building.id),
    })),
  };
}

function benchmarkState() {
  let state = createStore({ meta: { seed: 0xc0ffee } }).get();
  state = {
    ...state,
    player: { ...state.player, level: 999, hunger: 100, thirst: 100, hp: 100 },
    resources: Object.fromEntries(Object.keys(state.resources).map((key) => [key, STOCK])),
  };

  while (state.raft.width < TARGET_RAFT_SIDE) state = expandRaft(state, "right");
  while (state.raft.height < TARGET_RAFT_SIDE) state = expandRaft(state, "down");

  state = placeBuilding(state, "hq", 2, 2, 0);
  for (const [x, y] of SHELTER_WALLS) state = placeBuilding(state, "wall", x, y, 0);

  const repeatable = Object.keys(BUILDINGS).filter((type) => !BUILDINGS[type].unique);
  let cursor = 0;
  let misses = 0;
  while (state.buildings.length < TARGET_BUILDINGS && misses < repeatable.length) {
    const before = state;
    state = placeFirstOpen(state, repeatable[cursor % repeatable.length]);
    misses = state === before ? misses + 1 : 0;
    cursor += 1;
  }
  state = assignEveryBuilding(state);
  return {
    ...state,
    world: { ...state.world, weather: "tsunami", weatherTimer: 3600 },
  };
}

const prepared = benchmarkState();
const shelter = prepared.buildings.find((building) => building.type === "hq");
const adjacentFenceCount = shelter ? adjacentWalls(prepared, shelter).length : 0;
const assignedBuildingCount = prepared.buildings.filter((building) => building.occupantHeroId).length;
let tickState = structuredClone(prepared);
let simState = structuredClone(prepared);
let spawnState = structuredClone(prepared);
const spawnRng = mulberry32(0x51a9e);
let battleSeed = 100;
const allies = [
  { id: "h-sam", heroKey: "sam", star: 5 },
  { id: "h-mia", heroKey: "mia", star: 5 },
  { id: "h-yilong", heroKey: "yilong", star: 5 },
  { id: "h-rambo", heroKey: "rambo", star: 5 },
  { id: "h-kan", heroKey: "kan", star: 5 },
];

let tsunamiProbeState = {
  ...prepared,
  world: { ...prepared.world, weather: "clear", weatherTimer: 3600 },
};
tsunamiProbeState = beginDive(tsunamiProbeState, "wreck");
const tsunamiDiveStarted = !!tsunamiProbeState.explore.dive?.ok;
tsunamiProbeState = {
  ...tsunamiProbeState,
  world: { ...tsunamiProbeState.world, weather: "tsunami", weatherTimer: 3600 },
};
let tsunamiStepFinite = true;
for (let i = 0; i < TSUNAMI_SIM_STEPS; i += 1) {
  tsunamiProbeState = stepSim(tsunamiProbeState);
  tsunamiStepFinite &&= finiteState(tsunamiProbeState);
}
const tsunamiDiveClosed = tsunamiProbeState.explore.dive === null;

let codexState = {
  ...prepared,
  world: { ...prepared.world, weather: "clear", weatherTimer: 3600 },
};
codexState = beginCast(codexState);
const codexCast = codexState.explore.fishing.cast;
const codexCastStarted = !!codexCast?.ok;
if (codexCastStarted) {
  codexState = hookCast(codexState, (codexCast.window[0] + codexCast.window[1]) / 2);
}
const codexBefore = codexState.explore.fishing.codex || {};
const codexHydrated = hydrateSave(
  JSON.parse(JSON.stringify({
    ...codexState,
    meta: { ...codexState.meta, savedAt: ROUND_TRIP_NOW_MS },
  })),
  ROUND_TRIP_NOW_MS,
);
const codexAfter = codexHydrated?.explore.fishing.codex || {};
const codexRoundTripRetained =
  Object.keys(codexBefore).length > 0 && JSON.stringify(codexAfter) === JSON.stringify(codexBefore);

const metrics = {
  tick: measure(() => {
    tickState = tickWorld(tickState, 0.1);
  }, { samples: 180, batch: 20, warmup: 100 }),
  stepSim: measure(() => {
    simState = stepSim(simState);
  }, { samples: 180, batch: 10, warmup: 80 }),
  spawn: measure(() => {
    const flotsam = spawnFlotsam(spawnState, spawnRng);
    spawnState = {
      ...spawnState,
      meta: { ...spawnState.meta, tick: spawnState.meta.tick + 1 },
      explore: { ...spawnState.explore, salvage: { flotsam } },
    };
  }, { samples: 180, batch: 25, warmup: 100 }),
  battle: measure(() => {
    simulateBattle(battleSeed, allies, STAGES[29].enemies);
    battleSeed += 1;
  }, { samples: 120, batch: 3, warmup: 30 }),
};

for (const [name, metric] of Object.entries(metrics)) {
  metric.budgetP95 = BUDGET_P95_MS[name];
  metric.pass = metric.p95 <= metric.budgetP95;
}

const checks = {
  buildingsAbove40: prepared.buildings.length > 40,
  denseAssignments: assignedBuildingCount > 40 && assignedBuildingCount === prepared.buildings.length,
  assignedHeroesResolve: prepared.buildings.every((building) =>
    prepared.heroes.some((hero) => hero.id === building.occupantHeroId)),
  adjacentFences: adjacentFenceCount === SHELTER_WALLS.length,
  tsunamiDiveStarted,
  tsunamiStepFinite,
  tsunamiDiveClosed,
  codexCastStarted,
  codexRoundTripRetained,
  allBudgetsPass: Object.values(metrics).every((metric) => metric.pass),
};
const report = {
  status: Object.values(checks).every(Boolean) ? "pass" : "fail",
  workload: {
    raft: [prepared.raft.width, prepared.raft.height],
    buildings: prepared.buildings.length,
    buildingTypes: new Set(prepared.buildings.map((building) => building.type)).size,
    assignedBuildings: assignedBuildingCount,
    adjacentFences: adjacentFenceCount,
    weather: prepared.world.weather,
    battleStage: STAGES[29].id,
    battleUnits: allies.length + STAGES[29].enemies.length,
  },
  tsunamiStepSim: {
    steps: TSUNAMI_SIM_STEPS,
    finite: tsunamiStepFinite,
    diveStarted: tsunamiDiveStarted,
    diveClosed: tsunamiDiveClosed,
    finalWeather: tsunamiProbeState.world.weather,
    finalTick: tsunamiProbeState.meta.tick,
  },
  saveRoundTrip: {
    method: "JSON.parse/stringify + hydrateSave",
    codexEntriesBefore: Object.keys(codexBefore).length,
    codexEntriesAfter: Object.keys(codexAfter).length,
    codexRetained: codexRoundTripRetained,
  },
  metrics,
  checks,
};
console.log(JSON.stringify(report, null, 2));
if (report.status !== "pass") process.exitCode = 1;
