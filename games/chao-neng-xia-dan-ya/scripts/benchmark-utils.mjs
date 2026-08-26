const DEFAULT_EGG_RADIUS = 12;
const DEFAULT_BRICK_WIDTH = 38;
const DEFAULT_BRICK_HEIGHT = 18;

export const BENCHMARK_SCHEMA_VERSION = 1;
export const PHYSICS_FRAME_BUDGET_MS = 4;
export const PHYSICS_STEP_BUDGET_MS = PHYSICS_FRAME_BUDGET_MS / 2;

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

  return {
    id: `bench-egg-${index}`,
    type: "egg",
    shape: "circle",
    x,
    y,
    vx,
    vy,
    radius: DEFAULT_EGG_RADIUS,
    restitution: 0.86,
    mass: 1,
    active: true,
    alive: true,
    position: { x, y },
    velocity: { x: vx, y: vy },
  };
}

export function makeBrick(index) {
  const column = index % 10;
  const row = Math.floor(index / 10);
  const x = 34 + column * 46 + (row % 2) * 9;
  const y = 230 + row * 48;

  return {
    id: `bench-brick-${index}`,
    type: "aabb",
    kind: "brick",
    material: "brick",
    x,
    y,
    width: DEFAULT_BRICK_WIDTH,
    height: DEFAULT_BRICK_HEIGHT,
    w: DEFAULT_BRICK_WIDTH,
    h: DEFAULT_BRICK_HEIGHT,
    restitution: 0.82,
    hp: 1_000_000,
    solid: true,
    active: true,
  };
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

export function printStableJson(value) {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}
