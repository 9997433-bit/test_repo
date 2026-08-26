#!/usr/bin/env node
import {
  FIXED_DT,
  createWorld,
  predictTrajectory,
  stepWorld,
} from "../src/physics/index.js";
import {
  BENCHMARK_SCHEMA_VERSION,
  elapsedMs,
  measureSteps,
  populateWorld,
  printStableJson,
  roundMetric,
} from "./benchmark-utils.mjs";

const EMPTY_WORLD_STEPS = 10_000;
const MULTI_BODY_STEPS = 10_000;
const MULTI_BODY_EGGS = 12;
const MULTI_BODY_STATICS = 48;
const STEP_WARMUP = 1_000;
const TRAJECTORY_ITERATIONS = 1_000;
const TRAJECTORY_STEPS = 240;
const TRAJECTORY_WARMUP = 100;
const TRAJECTORY_ORIGIN = Object.freeze({ x: 240, y: 72 });
const TRAJECTORY_VELOCITY = Object.freeze({ x: 310, y: -520 });

function warmStepWorld(factory) {
  const world = factory();
  for (let index = 0; index < STEP_WARMUP; index += 1) stepWorld(world);
}

function callTrajectory(world) {
  return predictTrajectory(
    TRAJECTORY_ORIGIN,
    TRAJECTORY_VELOCITY,
    world,
    TRAJECTORY_STEPS,
  );
}

function benchmarkTrajectories() {
  const warmWorld = populateWorld(createWorld(), MULTI_BODY_EGGS, MULTI_BODY_STATICS);
  for (let index = 0; index < TRAJECTORY_WARMUP; index += 1) {
    callTrajectory(warmWorld);
  }

  const world = populateWorld(createWorld(), MULTI_BODY_EGGS, MULTI_BODY_STATICS);
  let emptyArrayResults = 0;
  let nonArrayResults = 0;
  let returnedPoints = 0;

  const start = process.hrtime.bigint();
  for (let index = 0; index < TRAJECTORY_ITERATIONS; index += 1) {
    const result = callTrajectory(world);
    if (!Array.isArray(result)) {
      nonArrayResults += 1;
    } else if (result.length === 0) {
      emptyArrayResults += 1;
    } else {
      returnedPoints += result.length;
    }
  }
  const totalMs = elapsedMs(start);

  let resultMode = "populated-arrays";
  if (emptyArrayResults === TRAJECTORY_ITERATIONS) resultMode = "all-empty-arrays";
  else if (nonArrayResults > 0) resultMode = "contains-non-array-results";
  else if (emptyArrayResults > 0) resultMode = "mixed-empty-and-populated-arrays";

  return {
    iterations: TRAJECTORY_ITERATIONS,
    requestedStepsPerPrediction: TRAJECTORY_STEPS,
    totalMs: roundMetric(totalMs, 3),
    meanCallMs: roundMetric(totalMs / TRAJECTORY_ITERATIONS),
    callsPerSecond: roundMetric(
      TRAJECTORY_ITERATIONS / (totalMs / 1_000),
      2,
    ),
    resultMode,
    emptyArrayResults,
    nonArrayResults,
    returnedPoints,
  };
}

warmStepWorld(() => createWorld());
warmStepWorld(() =>
  populateWorld(createWorld(), MULTI_BODY_EGGS, MULTI_BODY_STATICS),
);

const emptyWorld = createWorld();
const multiBodyWorld = populateWorld(
  createWorld(),
  MULTI_BODY_EGGS,
  MULTI_BODY_STATICS,
);

const report = {
  schemaVersion: BENCHMARK_SCHEMA_VERSION,
  benchmark: "chao-neng-xia-dan-ya/headless-physics",
  timingSource: "process.hrtime.bigint",
  config: {
    fixedDtSeconds: FIXED_DT,
    stepWarmup: STEP_WARMUP,
    multiBodyEggs: MULTI_BODY_EGGS,
    multiBodyStatics: MULTI_BODY_STATICS,
    trajectoryWarmup: TRAJECTORY_WARMUP,
  },
  results: {
    emptyWorld: measureSteps(emptyWorld, stepWorld, EMPTY_WORLD_STEPS),
    multiEggMultiBrick: {
      eggs: MULTI_BODY_EGGS,
      statics: MULTI_BODY_STATICS,
      ...measureSteps(multiBodyWorld, stepWorld, MULTI_BODY_STEPS),
    },
    predictTrajectory: benchmarkTrajectories(),
  },
};

printStableJson(report);
