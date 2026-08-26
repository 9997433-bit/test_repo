import { describe, expect, it } from "vitest";
import { advanceClock } from "../../src/engine/time";
import {
  MAX_PLOTS,
  WATER_CAP,
  WATER_REGEN_MS,
  createInitialState,
  emptyPlot,
  type GameState,
} from "../../src/engine/state";
import { tickGarden } from "../../src/systems/garden";
import { tickOrders } from "../../src/systems/orders";
import { tickSpirits } from "../../src/systems/spirits";

const TICK_COUNT = 500;
const TICK_MS = 100;
const SIMULATION_BUDGET_MS = 100;

function createBusyGarden(): GameState {
  const state = createInitialState(0);
  state.level = 12;
  state.activeSpirit = "chiguang";
  state.unlockedSpirits = ["juyue", "chiguang", "rainbow"];
  state.plots = Array.from({ length: MAX_PLOTS }, (_, id) => ({
    ...emptyPlot(id),
    flowerId: "dream-rose",
    stage: "seeded" as const,
    plantedAt: 0,
    watered: 3,
    fertilized: true,
    lastTick: 0,
  }));
  return state;
}

function tick(state: GameState): void {
  state.now += TICK_MS;
  advanceClock(state, TICK_MS);
  state.waterAcc += TICK_MS;
  while (state.waterAcc >= WATER_REGEN_MS) {
    state.waterAcc -= WATER_REGEN_MS;
    if (state.water < WATER_CAP) state.water += 1;
  }
  tickGarden(state, TICK_MS);
  tickOrders(state);
  tickSpirits(state, TICK_MS);
}

describe("garden simulation performance probe", () => {
  it(`runs ${TICK_COUNT} busy-garden ticks within ${SIMULATION_BUDGET_MS} ms`, () => {
    const warmup = createBusyGarden();
    for (let i = 0; i < 25; i += 1) tick(warmup);

    const state = createBusyGarden();
    const startedAt = performance.now();
    for (let i = 0; i < TICK_COUNT; i += 1) tick(state);
    const elapsedMs = performance.now() - startedAt;

    console.info(`[probe] 500-tick garden simulation: ${elapsedMs.toFixed(2)} ms`);
    expect(elapsedMs).toBeLessThanOrEqual(SIMULATION_BUDGET_MS);
    expect(state.plots).toHaveLength(MAX_PLOTS);
    expect(state.orders).toHaveLength(5);
    expect(state.unlockedSpirits).toEqual(["juyue", "chiguang", "rainbow"]);
  });
});
