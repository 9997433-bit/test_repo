#!/usr/bin/env node
import {
  FIXED_DT,
  createWorld,
  predictTrajectory,
  stepWorld,
} from "../src/core/sim.js";
import {
  ACTIVE_SCENARIO_WINDOW_FRAMES,
  BENCHMARK_SCHEMA_VERSION,
  FIXED_STEPS_PER_RENDER_FRAME,
  FULL_LOAD_EGGS,
  FULL_LOAD_FIELDS,
  FULL_LOAD_STATICS,
  PHYSICS_FRAME_BUDGET_MS,
  RENDER_FRAME_SECONDS,
  TRAJECTORY_BUDGET_MS,
  elapsedMs,
  measureScenarioFrameLatencies,
  measureSteps,
  populateWorld,
  printStableJson,
  roundMetric,
  warmScenario,
} from "./benchmark-utils.mjs";

const EMPTY_WORLD_STEPS = 10_000;
const FULL_LOAD_FRAMES = 1_000;
const EMPTY_STEP_WARMUP = 1_000;
const FRAME_WARMUP = 300;
const TRAJECTORY_ITERATIONS = 1_000;
const TRAJECTORY_STEPS = 90;
const TRAJECTORY_MAX_BOUNCES = 3;
const TRAJECTORY_WARMUP = 100;
const TRAJECTORY_ORIGIN = Object.freeze({ x: 240, y: 72 });
const TRAJECTORY_VELOCITY = Object.freeze({ x: 310, y: 520 });

function runFixedStep(world) {
  stepWorld(world, FIXED_DT);
}

function runRenderFrame(world) {
  stepWorld(world, RENDER_FRAME_SECONDS);
}

function createFullLoadWorld() {
  return populateWorld(
    createWorld(),
    FULL_LOAD_EGGS,
    FULL_LOAD_STATICS,
    FULL_LOAD_FIELDS,
  );
}

function callTrajectory(world) {
  return predictTrajectory(
    TRAJECTORY_ORIGIN,
    TRAJECTORY_VELOCITY,
    world,
    {
      maxSteps: TRAJECTORY_STEPS,
      maxBounces: TRAJECTORY_MAX_BOUNCES,
    },
  );
}

function benchmarkTrajectories() {
  const warmWorld = createFullLoadWorld();
  for (let index = 0; index < TRAJECTORY_WARMUP; index += 1) {
    callTrajectory(warmWorld);
  }

  const world = createFullLoadWorld();
  let emptyPointResults = 0;
  let invalidResults = 0;
  let returnedPoints = 0;
  let returnedBounces = 0;

  const start = process.hrtime.bigint();
  for (let index = 0; index < TRAJECTORY_ITERATIONS; index += 1) {
    const result = callTrajectory(world);
    if (!result || !Array.isArray(result.points)) {
      invalidResults += 1;
    } else if (result.points.length === 0) {
      emptyPointResults += 1;
    } else {
      returnedPoints += result.points.length;
      returnedBounces += result.bounces;
    }
  }
  const totalMs = elapsedMs(start);

  return {
    iterations: TRAJECTORY_ITERATIONS,
    requestedStepsPerPrediction: TRAJECTORY_STEPS,
    maxBounces: TRAJECTORY_MAX_BOUNCES,
    totalMs: roundMetric(totalMs, 3),
    meanCallMs: roundMetric(totalMs / TRAJECTORY_ITERATIONS),
    callsPerSecond: roundMetric(
      TRAJECTORY_ITERATIONS / (totalMs / 1_000),
      2,
    ),
    resultMode:
      invalidResults === 0 && emptyPointResults === 0
        ? "populated-results"
        : "invalid-or-empty-results",
    emptyPointResults,
    invalidResults,
    returnedPoints,
    returnedBounces,
  };
}

const warmEmptyWorld = createWorld();
for (let index = 0; index < EMPTY_STEP_WARMUP; index += 1) {
  runFixedStep(warmEmptyWorld);
}
warmScenario(createFullLoadWorld, runRenderFrame, FRAME_WARMUP);

const emptyWorld = createWorld();
const fullLoadFrames = measureScenarioFrameLatencies(
  createFullLoadWorld,
  runRenderFrame,
  FULL_LOAD_FRAMES,
);
const trajectory = benchmarkTrajectories();
const criteria = {
  fullLoadFrameP95UnderBudget:
    fullLoadFrames.p95Ms < PHYSICS_FRAME_BUDGET_MS,
  trajectoryTotalUnderBudget: trajectory.totalMs < TRAJECTORY_BUDGET_MS,
  fullLoadRemainedActive:
    fullLoadFrames.workload.minimumEndingEggsPerWindow > 0 &&
    fullLoadFrames.workload.physicsActivity.bounces > 0,
  trajectoryReturnedPoints:
    trajectory.invalidResults === 0 &&
    trajectory.emptyPointResults === 0 &&
    trajectory.returnedPoints > 0,
};

const report = {
  schemaVersion: BENCHMARK_SCHEMA_VERSION,
  benchmark: "chao-neng-xia-dan-ya/in-use-battle-physics",
  implementation: "src/core/sim.js -> src/physics/index.js",
  timingSource: "process.hrtime.bigint",
  config: {
    fixedDtSeconds: FIXED_DT,
    renderFrameSeconds: RENDER_FRAME_SECONDS,
    fixedStepsPerRenderFrame: FIXED_STEPS_PER_RENDER_FRAME,
    emptyStepWarmup: EMPTY_STEP_WARMUP,
    frameWarmup: FRAME_WARMUP,
    activeScenarioWindowFrames: ACTIVE_SCENARIO_WINDOW_FRAMES,
    fullLoadEggs: FULL_LOAD_EGGS,
    fullLoadStatics: FULL_LOAD_STATICS,
    fullLoadFields: FULL_LOAD_FIELDS,
    trajectoryWarmup: TRAJECTORY_WARMUP,
  },
  budgets: {
    fullLoadFrameP95Ms: PHYSICS_FRAME_BUDGET_MS,
    trajectoryTotalMs: TRAJECTORY_BUDGET_MS,
  },
  results: {
    emptyWorld: measureSteps(emptyWorld, runFixedStep, EMPTY_WORLD_STEPS),
    fullLoadFrames,
    predictTrajectory: trajectory,
  },
  criteria,
  pass: Object.values(criteria).every(Boolean),
};

printStableJson(report);
if (!report.pass) process.exitCode = 1;
