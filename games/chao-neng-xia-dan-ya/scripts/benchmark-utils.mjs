import {
  createEgg,
  makeBrick as createBrick,
} from "../src/physics/index.js";

const DEFAULT_EGG_RADIUS = 12;
const DEFAULT_BRICK_WIDTH = 38;
const DEFAULT_BRICK_HEIGHT = 18;

export const BENCHMARK_SCHEMA_VERSION = 2;
export const PHYSICS_FRAME_BUDGET_MS = 4;
export const PHYSICS_STEP_BUDGET_MS = PHYSICS_FRAME_BUDGET_MS / 2;
export const ACTIVE_SCENARIO_WINDOW_STEPS = 240;

export function roundMetric(value, digits = 6) {
  if (!Number.isFinite(value)) return null;
  const rounded = Number(value.toFixed(digits));
  return Object.is(rounded, -0) ? 0 : rounded;
}

export function elapsedMs(start) {
  return Number(process.hrtime.bigint() - start) / 1e6;
}

export function makeEgg(index) {
  const column = index % 6;
  const row = Math.floor(index / 6);
  const x = 70 + column * 68 + (row % 2) * 8;
  const y = 72 + row * 42;
  const vx = ((index % 5) - 2) * 72;
  const vy = 80 + (index % 4) * 35;

  return createEgg({
    id: `bench-egg-${index}`,
    x,
    y,
    vx,
    vy,
    r: DEFAULT_EGG_RADIUS,
    restitution: 0.86,
    mass: 1,
  });
}

export function makeBrick(index) {
  const column = index % 10;
  const row = Math.floor(index / 10);
  const x = 34 + column * 46 + (row % 2) * 9;
  const y = 230 + row * 48;

  return createBrick({
    id: `bench-brick-${index}`,
    kind: "brick",
    x,
    y,
    w: DEFAULT_BRICK_WIDTH,
    h: DEFAULT_BRICK_HEIGHT,
    restitution: 0.82,
    hp: 1_000_000,
    breakable: false,
  });
}

function addBodies(world, collectionName, methodName, bodies) {
  if (Array.isArray(world[collectionName])) {
    world[collectionName].push(...bodies);
    return;
  }

  if (world[collectionName] instanceof Map) {
    for (const body of bodies) world[collectionName].set(body.id, body);
    return;
  }

  if (typeof world[methodName] === "function") {
    for (const body of bodies) world[methodName](body);
    return;
  }

  throw new TypeError(
    `World must expose ${collectionName} as an Array/Map or implement ${methodName}()`,
  );
}

export function populateWorld(world, eggCount, staticCount) {
  const eggs = Array.from({ length: eggCount }, (_, index) => makeEgg(index));
  const statics = Array.from({ length: staticCount }, (_, index) => makeBrick(index));

  addBodies(world, "eggs", "addEgg", eggs);
  addBodies(world, "statics", "addStatic", statics);
  return world;
}

export function measureSteps(world, stepWorld, stepCount) {
  const start = process.hrtime.bigint();
  for (let index = 0; index < stepCount; index += 1) stepWorld(world);
  const totalMs = elapsedMs(start);

  return {
    steps: stepCount,
    totalMs: roundMetric(totalMs, 3),
    meanStepMs: roundMetric(totalMs / stepCount),
    stepsPerSecond: roundMetric(stepCount / (totalMs / 1_000), 2),
    finalWorldTimeSeconds: roundMetric(world.time),
  };
}

function createScenarioWindows(factory, totalSteps, windowSteps) {
  const windows = [];
  let remainingSteps = totalSteps;

  while (remainingSteps > 0) {
    const steps = Math.min(windowSteps, remainingSteps);
    const world = factory();
    windows.push({
      world,
      steps,
      startingEggs: world.eggs.length,
      startingStatics: world.statics.length,
    });
    remainingSteps -= steps;
  }

  return windows;
}

function summarizeScenarioWindows(windows) {
  const endingEggCounts = windows.map(({ world }) => world.eggs.length);
  const stats = windows.reduce(
    (total, { world }) => {
      total.bounces += world.stats.bounces;
      total.brickHits += world.stats.brickHits;
      total.eggHits += world.stats.eggHits;
      total.recycled += world.stats.recycled;
      return total;
    },
    { bounces: 0, brickHits: 0, eggHits: 0, recycled: 0 },
  );

  return {
    windows: windows.length,
    maxStepsPerWindow: Math.max(...windows.map(({ steps }) => steps)),
    startingEggsPerWindow: windows[0]?.startingEggs ?? 0,
    staticsPerWindow: windows[0]?.startingStatics ?? 0,
    minimumEndingEggsPerWindow: Math.min(...endingEggCounts),
    endingEggsTotal: endingEggCounts.reduce((total, count) => total + count, 0),
    physicsActivity: stats,
  };
}

function runScenarioWindows(windows, stepWorld, onStep) {
  for (const { world, steps } of windows) {
    for (let index = 0; index < steps; index += 1) {
      onStep(world, stepWorld);
    }
  }
}

export function warmScenario(
  factory,
  stepWorld,
  stepCount,
  windowSteps = ACTIVE_SCENARIO_WINDOW_STEPS,
) {
  const windows = createScenarioWindows(factory, stepCount, windowSteps);
  runScenarioWindows(windows, stepWorld, (world, step) => step(world));
}

export function measureScenarioSteps(
  factory,
  stepWorld,
  stepCount,
  windowSteps = ACTIVE_SCENARIO_WINDOW_STEPS,
) {
  const windows = createScenarioWindows(factory, stepCount, windowSteps);
  const start = process.hrtime.bigint();
  runScenarioWindows(windows, stepWorld, (world, step) => step(world));
  const totalMs = elapsedMs(start);

  return {
    steps: stepCount,
    totalMs: roundMetric(totalMs, 3),
    meanStepMs: roundMetric(totalMs / stepCount),
    stepsPerSecond: roundMetric(stepCount / (totalMs / 1_000), 2),
    workload: summarizeScenarioWindows(windows),
  };
}

export function percentile(sortedSamples, percentileValue) {
  if (sortedSamples.length === 0) return null;
  const rank = Math.ceil((percentileValue / 100) * sortedSamples.length);
  return sortedSamples[Math.max(0, rank - 1)];
}

export function measureStepLatencies(world, stepWorld, sampleCount) {
  const samples = new Array(sampleCount);

  for (let index = 0; index < sampleCount; index += 1) {
    const start = process.hrtime.bigint();
    stepWorld(world);
    samples[index] = elapsedMs(start);
  }

  const totalMs = samples.reduce((total, sample) => total + sample, 0);
  const sorted = [...samples].sort((left, right) => left - right);

  return {
    samples: sampleCount,
    totalMs: roundMetric(totalMs, 3),
    meanMs: roundMetric(totalMs / sampleCount),
    p50Ms: roundMetric(percentile(sorted, 50)),
    p95Ms: roundMetric(percentile(sorted, 95)),
    p99Ms: roundMetric(percentile(sorted, 99)),
    maxMs: roundMetric(sorted.at(-1)),
    finalWorldTimeSeconds: roundMetric(world.time),
  };
}

export function measureScenarioStepLatencies(
  factory,
  stepWorld,
  sampleCount,
  windowSteps = ACTIVE_SCENARIO_WINDOW_STEPS,
) {
  const windows = createScenarioWindows(factory, sampleCount, windowSteps);
  const samples = new Array(sampleCount);
  let sampleIndex = 0;

  runScenarioWindows(windows, stepWorld, (world, step) => {
    const start = process.hrtime.bigint();
    step(world);
    samples[sampleIndex] = elapsedMs(start);
    sampleIndex += 1;
  });

  const totalMs = samples.reduce((total, sample) => total + sample, 0);
  const sorted = [...samples].sort((left, right) => left - right);

  return {
    samples: sampleCount,
    totalMs: roundMetric(totalMs, 3),
    meanMs: roundMetric(totalMs / sampleCount),
    p50Ms: roundMetric(percentile(sorted, 50)),
    p95Ms: roundMetric(percentile(sorted, 95)),
    p99Ms: roundMetric(percentile(sorted, 99)),
    maxMs: roundMetric(sorted.at(-1)),
    workload: summarizeScenarioWindows(windows),
  };
}

export function printStableJson(value) {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}
