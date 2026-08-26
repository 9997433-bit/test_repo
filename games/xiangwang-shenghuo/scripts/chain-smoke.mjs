import { createInitialState } from "../src/core/engine.js";
import { harvest, plant, tickPlots } from "../src/systems/farm/index.js";
import {
  canCraft,
  collectJob,
  enqueueJob,
  feedAnimal,
  tickProduction,
} from "../src/systems/production/index.js";

function expect(condition, message) {
  if (!condition) throw new Error(message);
}

function expectState(result, operation) {
  if (!result.ok) throw new Error(`${operation}: ${result.reason}`);
  return result.state;
}

function createChainState(inv = {}) {
  const state = createInitialState();
  return {
    ...state,
    meta: { ...state.meta, level: 10 },
    resources: { ...state.resources, coin: 10_000 },
    inv: { ...state.inv, ...inv },
    buildings: {
      ...state.buildings,
      mill: { built: true, slotCount: 2 },
      feedmill: { built: true, slotCount: 3 },
      coop: { built: true, slotCount: 3 },
      kitchen: { built: true, slotCount: 2 },
    },
  };
}

function growAndHarvest(state, cropId, times = 1) {
  let next = state;
  for (let i = 0; i < times; i += 1) {
    next = expectState(plant(next, { plotId: "p1", cropId }), `plant ${cropId}`);
    const plot = next.plots.find(({ id }) => id === "p1");
    next = tickPlots(next, 0, plot.doneAt);
    next = expectState(harvest(next, { plotId: "p1" }), `harvest ${cropId}`);
  }
  return next;
}

function craftAndCollect(state, buildingId, recipeId) {
  expect(canCraft(state, recipeId), `${recipeId} should be craftable`);
  let next = expectState(
    enqueueJob(state, { buildingId, recipeId }),
    `enqueue ${recipeId}`,
  );
  const job = next.jobs.at(-1);
  next = tickProduction(next, 0, job.doneAt);
  return expectState(
    collectJob(next, { buildingId, slot: job.id }),
    `collect ${recipeId}`,
  );
}

function smokeRiceChicken() {
  let state = createChainState();
  state = growAndHarvest(state, "rice", 2);
  state = craftAndCollect(state, "mill", "mill_rice");
  state = craftAndCollect(state, "mill", "mill_rice");
  state = craftAndCollect(state, "feedmill", "feed_chicken_simple");
  state = expectState(
    feedAnimal(state, { buildingId: "coop", slot: 0 }),
    "feed chicken",
  );
  const chickenJob = state.jobs.at(-1);
  state = tickProduction(state, 0, chickenJob.doneAt);
  const readyEggs = state.jobs.filter(
    (job) =>
      job.kind === "livestock" &&
      job.productId === "egg" &&
      job.status === "done",
  ).length;
  expect(readyEggs === 1, "rice-to-chicken chain did not produce a ready egg");
  return {
    readyEggs,
    remainingChickenFeed: state.inv.chicken_feed || 0,
  };
}

function smokeSoyTofu() {
  let state = createChainState();
  state = growAndHarvest(state, "soy");
  state = craftAndCollect(state, "mill", "mill_tofu");
  expect(state.inv.tofu === 1, "soy-to-tofu chain did not produce tofu");
  return { tofu: state.inv.tofu };
}

function smokeWheatBread() {
  let state = createChainState({ egg: 1 });
  state = growAndHarvest(state, "wheat");
  state = craftAndCollect(state, "mill", "mill_flour");
  state = craftAndCollect(state, "kitchen", "bread");
  expect(state.inv.bread === 1, "wheat-to-bread chain did not produce bread");
  return { bread: state.inv.bread };
}

try {
  const report = {
    ok: true,
    chains: {
      "米-鸡": smokeRiceChicken(),
      "豆-豆腐": smokeSoyTofu(),
      "麦-面包": smokeWheatBread(),
    },
  };
  console.log(JSON.stringify(report, null, 2));
} catch (error) {
  console.error(`chain-smoke: ${error.message}`);
  process.exit(1);
}
