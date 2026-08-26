#!/usr/bin/env node
import { FIXED_DT, createWorld, stepWorld } from "../src/physics/index.js";
import {
  ACTIVE_SCENARIO_WINDOW_STEPS,
  BENCHMARK_SCHEMA_VERSION,
  PHYSICS_FRAME_BUDGET_MS,
  PHYSICS_STEP_BUDGET_MS,
  measureScenarioStepLatencies,
  populateWorld,
  printStableJson,
  roundMetric,
  warmScenario,
} from "./benchmark-utils.mjs";

const EGG_COUNT = 24;
const STATIC_COUNT = 80;
const WARMUP_STEPS = 600;
const SAMPLE_STEPS = 3_000;

function createStressWorld() {
  return populateWorld(createWorld(), EGG_COUNT, STATIC_COUNT);
}

warmScenario(createStressWorld, stepWorld, WARMUP_STEPS);
const latency = measureScenarioStepLatencies(
  createStressWorld,
  stepWorld,
  SAMPLE_STEPS,
);

const report = {
  schemaVersion: BENCHMARK_SCHEMA_VERSION,
  benchmark: "chao-neng-xia-dan-ya/physics-stress",
  implementation: "src/physics/index.js",
  timingSource: "process.hrtime.bigint",
  config: {
    fixedDtSeconds: FIXED_DT,
    eggs: EGG_COUNT,
    statics: STATIC_COUNT,
    layout: "dense-brick-grid",
    warmupSteps: WARMUP_STEPS,
    sampleSteps: SAMPLE_STEPS,
    activeScenarioWindowSteps: ACTIVE_SCENARIO_WINDOW_STEPS,
    percentileMethod: "nearest-rank",
    timerOverheadIncluded: true,
  },
  latency: {
    ...latency,
  },
  budget: {
    renderFrameMs: roundMetric(1_000 / 60),
    physicsFrameBudgetMs: PHYSICS_FRAME_BUDGET_MS,
    fixedStepsPerRenderFrame: 2,
    physicsStepBudgetMs: PHYSICS_STEP_BUDGET_MS,
    estimatedP99PhysicsFrameMs: roundMetric(latency.p99Ms * 2),
    estimatedP99BudgetUtilizationPercent: roundMetric(
      ((latency.p99Ms * 2) / PHYSICS_FRAME_BUDGET_MS) * 100,
      2,
    ),
    estimatedP99WithinBudget:
      latency.p99Ms * 2 < PHYSICS_FRAME_BUDGET_MS,
  },
};

printStableJson(report);
