import { makeEgg as createGameEgg } from "../src/core/sim.js";

const DEFAULT_EGG_RADIUS = 12;
const DEFAULT_BRICK_WIDTH = 38;
const DEFAULT_BRICK_HEIGHT = 18;

export const BENCHMARK_SCHEMA_VERSION = 3;
export const PHYSICS_FRAME_BUDGET_MS = 4;
export const TRAJECTORY_BUDGET_MS = 500;
export const RENDER_FRAME_SECONDS = 1 / 60;
export const FIXED_STEPS_PER_RENDER_FRAME = 2;
export const FULL_LOAD_EGGS = 30;
export const FULL_LOAD_STATICS = 200;
export const FULL_LOAD_FIELDS = 8;
export const ACTIVE_SCENARIO_WINDOW_FRAMES = 60;

export function roundMetric(value, digits = 6) {
  if (!Number.isFinite(value)) return null;
  const rounded = Number(value.toFixed(digits));
  return Object.is(rounded, -0) ? 0 : rounded;
}

export function elapsedMs(start) {
  return Number(process.hrtime.bigint() - start) / 1e6;
}

export function makeEgg(index) {
  const column = index % 8;
  const row = Math.floor(index / 8);

  return createGameEgg({
    x: 36 + column * 58 + (row % 2) * 5,
    y: 48 + row * 29,
    vx: ((index % 7) - 3) * 58,
    vy: 150 + (index % 5) * 42,
    r: DEFAULT_EGG_RADIUS,
    restitution: 0.86,
    power: 10,
  });
}

export function makeBrick(index) {
  const column = index % 10;
  const row = Math.floor(index / 10);

  return {
    id: `bench-brick-${index}`,
    kind: "brick",
    x: 11 + column * 47 + (row % 2) * 2,
    y: 180 + row * 28,
    w: DEFAULT_BRICK_WIDTH,
    h: DEFAULT_BRICK_HEIGHT,
    alive: true,
    flash: 0,
  };
}

export function makeField(index) {
  const column = index % 4;
  const row = Math.floor(index / 4);
  const direction = index % 2 === 0 ? 1 : -1;

  return {
    id: `bench-field-${index}`,
    x: column * 120,
    y: 120 + row * 280,
    w: 120,
    h: 280,
    ax: direction * (90 + row * 30),
    ay: row === 0 ? -45 : 45,
    alive: true,
  };
}

/**
 * 构造战斗实际使用的 `core/sim.js` 世界，而不是直接向上游 physics
 * 的 `statics/fields` 填数据。第一次推进会经过生产路径的 `syncStage`。
 */
export function populateWorld(
  world,
  eggCount = FULL_LOAD_EGGS,
  staticCount = FULL_LOAD_STATICS,
  fieldCount = FULL_LOAD_FIELDS,
) {
  if (
    !Array.isArray(world.eggs) ||
    !Array.isArray(world.bricks) ||
    !Array.isArray(world.fans)
  ) {
    throw new TypeError("Benchmark world must come from src/core/sim.js createWorld()");
  }

  world.eggs.push(
    ...Array.from({ length: eggCount }, (_, index) => makeEgg(index)),
  );
  world.bricks.push(
    ...Array.from({ length: staticCount }, (_, index) => makeBrick(index)),
  );
  world.fans.push(
    ...Array.from({ length: fieldCount }, (_, index) => makeField(index)),
  );
  return world;
}

export function measureSteps(world, step, stepCount) {
  const start = process.hrtime.bigint();
  for (let index = 0; index < stepCount; index += 1) step(world);
  const totalMs = elapsedMs(start);

  return {
    steps: stepCount,
    totalMs: roundMetric(totalMs, 3),
    meanStepMs: roundMetric(totalMs / stepCount),
    stepsPerSecond: roundMetric(stepCount / (totalMs / 1_000), 2),
    finalWorldTimeSeconds: roundMetric(world.time),
  };
}

function configuredStaticCount(world) {
  return (
    (world.pegs?.length ?? 0) +
    (world.bricks?.length ?? 0) +
    (world.enemies?.length ?? 0) +
    (world.slopes?.length ?? 0)
  );
}

function createScenarioWindows(factory, totalFrames, windowFrames) {
  const windows = [];
  let remainingFrames = totalFrames;

  while (remainingFrames > 0) {
    const frames = Math.min(windowFrames, remainingFrames);
    const world = factory();
    windows.push({
      world,
      frames,
      startingEggs: world.eggs.length,
      configuredStatics: configuredStaticCount(world),
      configuredFields: world.fans?.length ?? 0,
    });
    remainingFrames -= frames;
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
    maxFramesPerWindow: Math.max(...windows.map(({ frames }) => frames)),
    startingEggsPerWindow: windows[0]?.startingEggs ?? 0,
    configuredStaticsPerWindow: windows[0]?.configuredStatics ?? 0,
    configuredFieldsPerWindow: windows[0]?.configuredFields ?? 0,
    minimumEndingEggsPerWindow: Math.min(...endingEggCounts),
    endingEggsTotal: endingEggCounts.reduce((total, count) => total + count, 0),
    physicsActivity: stats,
  };
}

function runScenarioWindows(windows, runFrame, onFrame) {
  for (const { world, frames } of windows) {
    for (let index = 0; index < frames; index += 1) {
      onFrame(world, runFrame);
    }
  }
}

export function warmScenario(
  factory,
  runFrame,
  frameCount,
  windowFrames = ACTIVE_SCENARIO_WINDOW_FRAMES,
) {
  const windows = createScenarioWindows(factory, frameCount, windowFrames);
  runScenarioWindows(windows, runFrame, (world, frame) => frame(world));
}

export function percentile(sortedSamples, percentileValue) {
  if (sortedSamples.length === 0) return null;
  const rank = Math.ceil((percentileValue / 100) * sortedSamples.length);
  return sortedSamples[Math.max(0, rank - 1)];
}

export function measureScenarioFrameLatencies(
  factory,
  runFrame,
  sampleCount,
  windowFrames = ACTIVE_SCENARIO_WINDOW_FRAMES,
) {
  const windows = createScenarioWindows(factory, sampleCount, windowFrames);
  const samples = new Array(sampleCount);
  let sampleIndex = 0;

  runScenarioWindows(windows, runFrame, (world, frame) => {
    const start = process.hrtime.bigint();
    frame(world);
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

export function linearTrend(values) {
  if (values.length < 2) return 0;
  const xMean = (values.length - 1) / 2;
  const yMean =
    values.reduce((total, value) => total + value, 0) / values.length;
  let numerator = 0;
  let denominator = 0;

  for (let index = 0; index < values.length; index += 1) {
    const dx = index - xMean;
    numerator += dx * (values[index] - yMean);
    denominator += dx * dx;
  }

  return denominator === 0 ? 0 : numerator / denominator;
}

export function printStableJson(value) {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}
