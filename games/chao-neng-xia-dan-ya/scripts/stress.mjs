#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { FIXED_DT, createWorld, stepWorld } from "../src/core/sim.js";
import {
  ACTIVE_SCENARIO_WINDOW_FRAMES,
  BENCHMARK_SCHEMA_VERSION,
  FIXED_STEPS_PER_RENDER_FRAME,
  FULL_LOAD_EGGS,
  FULL_LOAD_FIELDS,
  FULL_LOAD_STATICS,
  PHYSICS_FRAME_BUDGET_MS,
  RENDER_FRAME_SECONDS,
  linearTrend,
  measureScenarioFrameLatencies,
  populateWorld,
  printStableJson,
  roundMetric,
  warmScenario,
} from "./benchmark-utils.mjs";

const GC_CHILD_FLAG = "--benchmark-gc-child";
const WARMUP_FRAMES = 300;
const SAMPLE_FRAMES = 3_000;
const MEMORY_WARMUP_WAVES = 5;
const MEMORY_WAVES = 50;
const FRAMES_PER_MEMORY_WAVE = 60;
const RETAINED_HEAP_BUDGET_BYTES = 2 * 1024 * 1024;
const TREND_BUDGET_BYTES_PER_WAVE = 64 * 1024;

function relaunchWithExposedGc() {
  if (typeof globalThis.gc === "function") return;
  if (process.argv.includes(GC_CHILD_FLAG)) {
    throw new Error("stress.mjs requires global.gc in its benchmark child");
  }

  const child = spawnSync(
    process.execPath,
    [
      "--expose-gc",
      fileURLToPath(import.meta.url),
      GC_CHILD_FLAG,
    ],
    { stdio: "inherit" },
  );
  if (child.error) throw child.error;
  process.exit(child.status ?? 1);
}

relaunchWithExposedGc();

function createStressWorld() {
  return populateWorld(
    createWorld(),
    FULL_LOAD_EGGS,
    FULL_LOAD_STATICS,
    FULL_LOAD_FIELDS,
  );
}

function runRenderFrame(world) {
  stepWorld(world, RENDER_FRAME_SECONDS);
}

function runWave() {
  let world = createStressWorld();
  for (let frame = 0; frame < FRAMES_PER_MEMORY_WAVE; frame += 1) {
    runRenderFrame(world);
  }

  const activity = {
    bounces: world.stats.bounces,
    brickHits: world.stats.brickHits,
    eggHits: world.stats.eggHits,
    recycled: world.stats.recycled,
    endingEggs: world.eggs.length,
  };

  for (const egg of world.eggs) egg.alive = false;
  for (const brick of world.bricks) brick.alive = false;
  for (const fan of world.fans) {
    fan.alive = false;
    if (fan._field) fan._field.active = false;
  }
  stepWorld(world, FIXED_DT);
  world = null;
  return activity;
}

function collectHeapSample() {
  globalThis.gc();
  globalThis.gc();
  return process.memoryUsage().heapUsed;
}

function measureWaveMemory() {
  for (let wave = 0; wave < MEMORY_WARMUP_WAVES; wave += 1) {
    runWave();
    collectHeapSample();
  }

  const baselineHeapBytes = collectHeapSample();
  const samples = [];
  const activity = {
    bounces: 0,
    brickHits: 0,
    eggHits: 0,
    recycled: 0,
    minimumEndingEggs: Number.POSITIVE_INFINITY,
  };

  for (let wave = 0; wave < MEMORY_WAVES; wave += 1) {
    const waveActivity = runWave();
    activity.bounces += waveActivity.bounces;
    activity.brickHits += waveActivity.brickHits;
    activity.eggHits += waveActivity.eggHits;
    activity.recycled += waveActivity.recycled;
    activity.minimumEndingEggs = Math.min(
      activity.minimumEndingEggs,
      waveActivity.endingEggs,
    );
    samples.push(collectHeapSample());
  }

  const finalHeapBytes = samples.at(-1);
  const retainedDeltaBytes = finalHeapBytes - baselineHeapBytes;
  const trendBytesPerWave = linearTrend(samples);
  const strictlyMonotonicGrowth = samples.every(
    (sample, index) => index === 0 || sample > samples[index - 1],
  );
  const noRetainedGrowthTrend =
    !strictlyMonotonicGrowth &&
    retainedDeltaBytes <= RETAINED_HEAP_BUDGET_BYTES &&
    trendBytesPerWave <= TREND_BUDGET_BYTES_PER_WAVE;

  return {
    waves: MEMORY_WAVES,
    warmupWaves: MEMORY_WARMUP_WAVES,
    framesPerWave: FRAMES_PER_MEMORY_WAVE,
    gcMode: "forced-between-waves",
    baselineHeapBytes,
    finalHeapBytes,
    retainedDeltaBytes,
    minimumHeapBytes: Math.min(...samples),
    maximumHeapBytes: Math.max(...samples),
    trendBytesPerWave: roundMetric(trendBytesPerWave, 2),
    retainedHeapBudgetBytes: RETAINED_HEAP_BUDGET_BYTES,
    trendBudgetBytesPerWave: TREND_BUDGET_BYTES_PER_WAVE,
    strictlyMonotonicGrowth,
    noRetainedGrowthTrend,
    workload: activity,
  };
}

warmScenario(createStressWorld, runRenderFrame, WARMUP_FRAMES);
const frameLatency = measureScenarioFrameLatencies(
  createStressWorld,
  runRenderFrame,
  SAMPLE_FRAMES,
);
const memory = measureWaveMemory();
const criteria = {
  fullLoadFrameP95UnderBudget:
    frameLatency.p95Ms < PHYSICS_FRAME_BUDGET_MS,
  fullLoadRemainedActive:
    frameLatency.workload.minimumEndingEggsPerWindow > 0 &&
    frameLatency.workload.physicsActivity.bounces > 0,
  fiftyWaveWorkloadActive:
    memory.workload.minimumEndingEggs > 0 &&
    memory.workload.bounces > 0,
  noRetainedGrowthTrend: memory.noRetainedGrowthTrend,
};

const report = {
  schemaVersion: BENCHMARK_SCHEMA_VERSION,
  benchmark: "chao-neng-xia-dan-ya/in-use-battle-physics-stress",
  implementation: "src/core/sim.js -> src/physics/index.js",
  timingSource: "process.hrtime.bigint",
  config: {
    fixedDtSeconds: FIXED_DT,
    renderFrameSeconds: RENDER_FRAME_SECONDS,
    fixedStepsPerRenderFrame: FIXED_STEPS_PER_RENDER_FRAME,
    eggs: FULL_LOAD_EGGS,
    statics: FULL_LOAD_STATICS,
    fields: FULL_LOAD_FIELDS,
    layout: "dense-brick-grid-with-wind-fields",
    warmupFrames: WARMUP_FRAMES,
    sampleFrames: SAMPLE_FRAMES,
    activeScenarioWindowFrames: ACTIVE_SCENARIO_WINDOW_FRAMES,
    percentileMethod: "nearest-rank",
    timerOverheadIncluded: true,
  },
  frameLatency,
  memory,
  budget: {
    renderFrameMs: roundMetric(1_000 / 60),
    physicsFrameBudgetMs: PHYSICS_FRAME_BUDGET_MS,
    fixedStepsPerRenderFrame: FIXED_STEPS_PER_RENDER_FRAME,
    measuredP95BudgetUtilizationPercent: roundMetric(
      (frameLatency.p95Ms / PHYSICS_FRAME_BUDGET_MS) * 100,
      2,
    ),
    measuredP95WithinBudget:
      frameLatency.p95Ms < PHYSICS_FRAME_BUDGET_MS,
  },
  criteria,
  pass: Object.values(criteria).every(Boolean),
};

printStableJson(report);
