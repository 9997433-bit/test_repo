import { createHash } from "node:crypto";
import { performance } from "node:perf_hooks";
import { createStore, hydrateSave } from "../src/core/store.js";
import { stepSim } from "../src/core/engine.js";
import { placeBuilding, expandRaft, canPlace } from "../src/world/build.js";
import { tickWorld } from "../src/world/sim.js";
import { beginDive } from "../src/explore/dive.js";
import { beginCast, hookCast } from "../src/explore/fishing.js";
import { BUILDINGS } from "../src/data/buildings.js";
import { STAGES } from "../src/data/stages.js";
import { simulateBattle } from "../src/combat/battle.js";

const MAP_SIDE = 32;
const TARGET_BUILDINGS = 240;
const STOCK = 1_000_000_000;
const TSUNAMI_CYCLES = 20;
const TSUNAMI_DT = [0.001, 0.1, 1, 30, 600, 3600];
const TSUNAMI_SIM_STEPS = 256;
const CODEX_ROUND_TRIPS = 32;
const ROUND_TRIP_NOW_MS = 1_700_000_000_000;
const SEEDS_PER_STAGE = 128;

function round(value) {
  return Math.round(value * 1_000) / 1_000;
}

function finiteState(state) {
  const pending = [state];
  while (pending.length) {
    const value = pending.pop();
    if (typeof value === "number" && !Number.isFinite(value)) return false;
    if (Array.isArray(value)) {
      pending.push(...value);
    } else if (value && typeof value === "object") {
      pending.push(...Object.values(value));
    }
  }
  return true;
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

function largeState() {
  let state = createStore({ meta: { seed: 0xdecafbad } }).get();
  state = {
    ...state,
    player: { ...state.player, level: 999, hunger: 100, thirst: 100, hp: 100 },
    resources: Object.fromEntries(Object.keys(state.resources).map((key) => [key, STOCK])),
  };
  while (state.raft.width < MAP_SIDE) state = expandRaft(state, "right");
  while (state.raft.height < MAP_SIDE) state = expandRaft(state, "down");

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

const setupStarted = performance.now();
const prepared = largeState();
const setupElapsedMs = performance.now() - setupStarted;

const tsunamiStarted = performance.now();
let tsunamiState = structuredClone(prepared);
let tsunamiFinite = true;
let tsunamiRetained = true;
let minHp = tsunamiState.player.hp;
let tsunamiTicks = 0;
for (let cycle = 0; cycle < TSUNAMI_CYCLES; cycle += 1) {
  for (const dt of TSUNAMI_DT) {
    tsunamiState = {
      ...tsunamiState,
      meta: { ...tsunamiState.meta, tick: tsunamiState.meta.tick + 1 },
      world: { ...tsunamiState.world, weather: "tsunami", weatherTimer: dt + 1 },
    };
    tsunamiState = tickWorld(tsunamiState, dt);
    tsunamiTicks += 1;
    minHp = Math.min(minHp, tsunamiState.player.hp);
    tsunamiFinite &&= finiteState(tsunamiState);
    tsunamiRetained &&= tsunamiState.world.weather === "tsunami";
  }
}
const tsunamiElapsedMs = performance.now() - tsunamiStarted;

const tsunamiSimStarted = performance.now();
let tsunamiSimState = {
  ...prepared,
  world: { ...prepared.world, weather: "clear", weatherTimer: 3600 },
};
tsunamiSimState = beginDive(tsunamiSimState, "wreck");
const tsunamiDiveStarted = !!tsunamiSimState.explore.dive?.ok;
tsunamiSimState = {
  ...tsunamiSimState,
  world: { ...tsunamiSimState.world, weather: "tsunami", weatherTimer: 3600 },
};
let tsunamiSimFinite = true;
let tsunamiSimRetained = true;
for (let i = 0; i < TSUNAMI_SIM_STEPS; i += 1) {
  tsunamiSimState = stepSim(tsunamiSimState);
  tsunamiSimFinite &&= finiteState(tsunamiSimState);
  tsunamiSimRetained &&= tsunamiSimState.world.weather === "tsunami";
}
const tsunamiDiveClosed = tsunamiSimState.explore.dive === null;
const tsunamiSimElapsedMs = performance.now() - tsunamiSimStarted;

const codexStarted = performance.now();
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
const codexExpected = codexState.explore.fishing.codex || {};
const codexExpectedJson = JSON.stringify(codexExpected);
let codexRoundTripsRetained = Object.keys(codexExpected).length > 0;
for (let i = 0; i < CODEX_ROUND_TRIPS; i += 1) {
  const raw = JSON.parse(JSON.stringify({
    ...codexState,
    meta: { ...codexState.meta, savedAt: ROUND_TRIP_NOW_MS },
  }));
  codexState = hydrateSave(raw, ROUND_TRIP_NOW_MS);
  codexRoundTripsRetained &&= JSON.stringify(codexState?.explore.fishing.codex || {}) === codexExpectedJson;
}
const codexElapsedMs = performance.now() - codexStarted;

const allies = [
  { id: "stress-sam", heroKey: "sam", star: 5 },
  { id: "stress-mia", heroKey: "mia", star: 5 },
  { id: "stress-yilong", heroKey: "yilong", star: 5 },
  { id: "stress-rambo", heroKey: "rambo", star: 5 },
  { id: "stress-kan", heroKey: "kan", star: 5 },
];
const battleStarted = performance.now();
const digest = createHash("sha256");
const signatures = new Set();
const mismatches = [];
let mismatchCount = 0;
let invalidBattleShapeCount = 0;
let nonFiniteBattleCount = 0;
const stageScan = [];
let battleCases = 0;

for (const stage of STAGES) {
  const winners = { ally: 0, enemy: 0, draw: 0 };
  let durationTotal = 0;
  let minDuration = Infinity;
  let maxDuration = -Infinity;
  for (let seedIndex = 0; seedIndex < SEEDS_PER_STAGE; seedIndex += 1) {
    const seed = (Math.imul(seedIndex + 1, 2654435761) ^ stage.id) >>> 0;
    const first = simulateBattle(seed, allies, stage.enemies);
    const second = simulateBattle(seed, allies, stage.enemies);
    const firstJson = JSON.stringify(first);
    const secondJson = JSON.stringify(second);
    if (firstJson !== secondJson) {
      mismatchCount += 1;
      if (mismatches.length < 20) mismatches.push({ stage: stage.id, seed });
    }
    if (first.truncated || first.leftover.length !== allies.length + stage.enemies.length) {
      invalidBattleShapeCount += 1;
    }
    if (!finiteState(first)) nonFiniteBattleCount += 1;
    winners[first.winner] += 1;
    durationTotal += first.duration;
    minDuration = Math.min(minDuration, first.duration);
    maxDuration = Math.max(maxDuration, first.duration);
    digest.update(`${stage.id}:${seed}:${firstJson}\n`);
    signatures.add(`${stage.id}:${firstJson}`);
    battleCases += 1;
  }
  stageScan.push({
    stage: stage.id,
    boss: stage.boss,
    winners,
    duration: {
      min: minDuration,
      mean: round(durationTotal / SEEDS_PER_STAGE),
      max: maxDuration,
    },
  });
}
const battleElapsedMs = performance.now() - battleStarted;

const checks = {
  maxMap: prepared.raft.width === MAP_SIDE && prepared.raft.height === MAP_SIDE,
  denseBuild: prepared.buildings.length >= 200,
  allBuildingTypes: new Set(prepared.buildings.map((building) => building.type)).size === Object.keys(BUILDINGS).length,
  tsunamiTickFinite: tsunamiFinite,
  tsunamiWeatherRetained: tsunamiRetained,
  tsunamiDiveStarted,
  tsunamiStepSimFinite: tsunamiSimFinite,
  tsunamiStepSimWeatherRetained: tsunamiSimRetained,
  tsunamiDiveClosed,
  codexCastStarted,
  codexRoundTripsRetained,
  exactlyThirtyStages: STAGES.length === 30 && stageScan.length === 30,
  fiveHeroLineup: allies.length === 5,
  fiveEnemiesPerStage: STAGES.every((stage) => stage.enemies.length === 5),
  allBattlesFiveVsFive: invalidBattleShapeCount === 0,
  allSeedCasesScanned: battleCases === STAGES.length * SEEDS_PER_STAGE,
  finiteBattleResults: nonFiniteBattleCount === 0,
  deterministicBattleResults: mismatchCount === 0,
};
const pass = Object.values(checks).every(Boolean);
const report = {
  status: pass ? "pass" : "fail",
  largeMap: {
    raft: [prepared.raft.width, prepared.raft.height],
    buildings: prepared.buildings.length,
    buildingTypes: new Set(prepared.buildings.map((building) => building.type)).size,
    setupElapsedMs: round(setupElapsedMs),
  },
  tsunamiTickScan: {
    weather: "tsunami",
    cycles: TSUNAMI_CYCLES,
    dtSeconds: TSUNAMI_DT,
    ticks: tsunamiTicks,
    finite: tsunamiFinite,
    retainedWeather: tsunamiRetained,
    minHp: round(minHp),
    elapsedMs: round(tsunamiElapsedMs),
  },
  tsunamiStepSimScan: {
    steps: TSUNAMI_SIM_STEPS,
    finite: tsunamiSimFinite,
    retainedWeather: tsunamiSimRetained,
    diveStarted: tsunamiDiveStarted,
    diveClosed: tsunamiDiveClosed,
    finalTick: tsunamiSimState.meta.tick,
    elapsedMs: round(tsunamiSimElapsedMs),
  },
  saveRoundTripScan: {
    method: "JSON.parse/stringify + hydrateSave",
    roundTrips: CODEX_ROUND_TRIPS,
    codexEntries: Object.keys(codexExpected).length,
    codexRetained: codexRoundTripsRetained,
    elapsedMs: round(codexElapsedMs),
  },
  battleStageScan: {
    format: `${allies.length}v${STAGES[0]?.enemies.length || 0}`,
    stages: STAGES.length,
    seedsPerStage: SEEDS_PER_STAGE,
    cases: battleCases,
    invalidBattleShapes: invalidBattleShapeCount,
    nonFiniteResults: nonFiniteBattleCount,
    elapsedMs: round(battleElapsedMs),
    results: stageScan,
  },
  rngSeedScan: {
    deterministic: mismatchCount === 0,
    mismatches: mismatchCount,
    mismatchSamples: mismatches,
    uniqueSignatures: signatures.size,
    digest: digest.digest("hex"),
    note: "Every stage/seed pair is simulated twice and compared byte-for-byte.",
  },
  checks,
};

console.log(JSON.stringify(report, null, 2));
if (!pass) process.exitCode = 1;
