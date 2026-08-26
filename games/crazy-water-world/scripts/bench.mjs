import { performance } from "node:perf_hooks";
import { createStore } from "../src/core/store.js";
import { stepSim } from "../src/core/engine.js";
import { placeBuilding, expandRaft, canPlace } from "../src/world/build.js";
import { tickWorld } from "../src/world/sim.js";
import { spawnFlotsam } from "../src/explore/salvage.js";
import { simulateBattle } from "../src/combat/battle.js";
import { mulberry32 } from "../src/core/rng.js";
import { BUILDINGS } from "../src/data/buildings.js";
import { STAGES } from "../src/data/stages.js";

const TARGET_BUILDINGS = 64;
const TARGET_RAFT_SIDE = 24;
const STOCK = 1_000_000_000;
const BUDGET_P95_MS = {
  tick: 2.5,
  stepSim: 4,
  spawn: 1.5,
  battle: 12,
};

function round(value) {
  return Math.round(value * 1_000_000) / 1_000_000;
}

function percentile(sorted, fraction) {
  return sorted[Math.max(0, Math.ceil(sorted.length * fraction) - 1)];
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

function benchmarkState() {
  let state = createStore({ meta: { seed: 0xc0ffee } }).get();
  state = {
    ...state,
    player: { ...state.player, level: 999, hunger: 100, thirst: 100, hp: 100 },
    resources: Object.fromEntries(Object.keys(state.resources).map((key) => [key, STOCK])),
  };

  while (state.raft.width < TARGET_RAFT_SIDE) state = expandRaft(state, "right");
  while (state.raft.height < TARGET_RAFT_SIDE) state = expandRaft(state, "down");

  state = placeFirstOpen(state, "hq");
  const repeatable = Object.keys(BUILDINGS).filter((type) => !BUILDINGS[type].unique);
  let cursor = 0;
  let misses = 0;
  while (state.buildings.length < TARGET_BUILDINGS && misses < repeatable.length) {
    const before = state;
    state = placeFirstOpen(state, repeatable[cursor % repeatable.length]);
    misses = state === before ? misses + 1 : 0;
    cursor += 1;
  }
  return state;
}

const prepared = benchmarkState();
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
  buildingsAbove20: prepared.buildings.length > 20,
  allBudgetsPass: Object.values(metrics).every((metric) => metric.pass),
};
const report = {
  status: Object.values(checks).every(Boolean) ? "pass" : "fail",
  workload: {
    raft: [prepared.raft.width, prepared.raft.height],
    buildings: prepared.buildings.length,
    buildingTypes: new Set(prepared.buildings.map((building) => building.type)).size,
    battleStage: STAGES[29].id,
    battleUnits: allies.length + STAGES[29].enemies.length,
  },
  metrics,
  checks,
};
console.log(JSON.stringify(report, null, 2));
if (report.status !== "pass") process.exitCode = 1;
