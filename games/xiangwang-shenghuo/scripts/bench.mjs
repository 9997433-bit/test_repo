import { createInitialState, advanceTime } from "../src/core/engine.js";
import { tickPlots, plant } from "../src/systems/farm/index.js";
import { enqueueJob, feedAnimal, tickProduction } from "../src/systems/production/index.js";
import { tickVillage } from "../src/systems/village/index.js";

const N = Number.parseInt(process.env.BENCH_TICKS || "100000", 10);
const WARMUP_TICKS = Math.min(5_000, Math.max(100, Math.floor(N / 10)));
const MAX_MS_PER_TICK = 2;

if (!Number.isSafeInteger(N) || N <= 0) {
  console.error("bench: BENCH_TICKS must be a positive integer");
  process.exit(1);
}

function expectState(result, operation) {
  if (!result.ok) throw new Error(`bench setup: ${operation}: ${result.reason}`);
  return result.state;
}

function step(state) {
  const stepped = advanceTime(state, 16);
  return tickVillage(tickProduction(tickPlots(stepped.state, 16), 16));
}

let initial = createInitialState();
initial = {
  ...initial,
  meta: { ...initial.meta, level: 10 },
  resources: { ...initial.resources, coin: 10_000 },
  inv: {
    ...initial.inv,
    paddy: 20,
    soybean: 20,
    wheat: 20,
    rice: 20,
    flour: 20,
    corn: 20,
    egg: 20,
    chicken_feed: 20,
  },
  buildings: {
    ...initial.buildings,
    mill: { built: true, slotCount: 2 },
    feedmill: { built: true, slotCount: 3 },
    coop: { built: true, slotCount: 3 },
    kitchen: { built: true, slotCount: 2 },
  },
};
initial = expectState(plant(initial, { plotId: "p1", cropId: "rice" }), "plant rice");
initial = expectState(
  enqueueJob(initial, { buildingId: "mill", recipeId: "mill_rice" }),
  "queue rice",
);
initial = expectState(
  enqueueJob(initial, { buildingId: "mill", recipeId: "mill_tofu" }),
  "queue tofu",
);
initial = expectState(
  enqueueJob(initial, { buildingId: "feedmill", recipeId: "feed_chicken" }),
  "queue chicken feed",
);
initial = expectState(
  enqueueJob(initial, { buildingId: "kitchen", recipeId: "bread" }),
  "queue bread",
);
initial = expectState(
  feedAnimal(initial, { buildingId: "coop", slot: 0 }),
  "feed chicken",
);

let s = initial;
for (let i = 0; i < WARMUP_TICKS; i += 1) s = step(s);

const t0 = performance.now();
for (let i = 0; i < N; i += 1) {
  const stepped = advanceTime(s, 16);
  s = tickVillage(tickProduction(tickPlots(stepped.state, 16), 16));
}
const ms = performance.now() - t0;
const per = ms / N;
const report = {
  ticks: N,
  warmupTicks: WARMUP_TICKS,
  activeJobs: s.jobs.length,
  ms: Number(ms.toFixed(3)),
  msPerTick: Number(per.toFixed(6)),
  ticksPerSecond: Math.round(1000 / per),
  maxMsPerTick: MAX_MS_PER_TICK,
  ok: per < MAX_MS_PER_TICK,
};
console.log(JSON.stringify(report, null, 2));
if (!report.ok) process.exit(1);
