import { createHash } from "node:crypto";
import { performance } from "node:perf_hooks";
import { createStore } from "../src/core/store.js";
import { placeBuilding, expandRaft, canPlace } from "../src/world/build.js";
import { tickWorld } from "../src/world/sim.js";
import { BUILDINGS } from "../src/data/buildings.js";
import { WEATHERS } from "../src/data/weather.js";
import { STAGES } from "../src/data/stages.js";
import { simulateBattle } from "../src/combat/battle.js";

const MAP_SIDE = 32;
const TARGET_BUILDINGS = 240;
const STOCK = 1_000_000_000;
const WEATHER_CYCLES = 20;
const EXTREME_DT = [0.001, 0.1, 1, 30, 600];
const SEEDS_PER_STAGE = 128;

function round(value) {
  return Math.round(value * 1_000) / 1_000;
}

function finiteState(state) {
  const scalars = [
    state.player.hp,
    state.player.hunger,
    state.player.thirst,
    state.world.timeOfDay,
    state.world.weatherTimer,
    state.campaign.idleSince,
    ...Object.values(state.resources),
  ];
  return scalars.every(Number.isFinite);
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

const weatherStarted = performance.now();
let weatherState = structuredClone(prepared);
let weatherFinite = true;
let minHp = weatherState.player.hp;
const weatherExposure = Object.fromEntries(Object.keys(WEATHERS).map((weather) => [weather, 0]));
for (let cycle = 0; cycle < WEATHER_CYCLES; cycle += 1) {
  for (const weather of Object.keys(WEATHERS)) {
    for (const dt of EXTREME_DT) {
      weatherState = {
        ...weatherState,
        meta: { ...weatherState.meta, tick: weatherState.meta.tick + 1 },
        world: { ...weatherState.world, weather, weatherTimer: dt + 1 },
      };
      weatherState = tickWorld(weatherState, dt);
      weatherExposure[weather] += 1;
      minHp = Math.min(minHp, weatherState.player.hp);
      weatherFinite &&= finiteState(weatherState);
    }
  }
}
const weatherElapsedMs = performance.now() - weatherStarted;

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
  weatherFinite,
  allStagesScanned: stageScan.length === STAGES.length,
  allSeedCasesScanned: battleCases === STAGES.length * SEEDS_PER_STAGE,
};
const structuralPass = Object.values(checks).every(Boolean);
const report = {
  status: structuralPass ? (mismatchCount ? "pass_with_determinism_findings" : "pass") : "fail",
  largeMap: {
    raft: [prepared.raft.width, prepared.raft.height],
    buildings: prepared.buildings.length,
    buildingTypes: new Set(prepared.buildings.map((building) => building.type)).size,
    setupElapsedMs: round(setupElapsedMs),
  },
  extremeWeather: {
    cycles: WEATHER_CYCLES,
    dtSeconds: EXTREME_DT,
    simulations: WEATHER_CYCLES * Object.keys(WEATHERS).length * EXTREME_DT.length,
    exposure: weatherExposure,
    finite: weatherFinite,
    minHp: round(minHp),
    elapsedMs: round(weatherElapsedMs),
  },
  battleStageScan: {
    stages: STAGES.length,
    seedsPerStage: SEEDS_PER_STAGE,
    cases: battleCases,
    elapsedMs: round(battleElapsedMs),
    results: stageScan,
  },
  rngSeedScan: {
    deterministic: mismatchCount === 0,
    mismatches: mismatchCount,
    mismatchSamples: mismatches,
    uniqueSignatures: signatures.size,
    digest: digest.digest("hex"),
    note: "Same-input mismatches are reported only; battle code is not modified.",
  },
  checks,
};

console.log(JSON.stringify(report, null, 2));
if (!structuralPass) process.exitCode = 1;
