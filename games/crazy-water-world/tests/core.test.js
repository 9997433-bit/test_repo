import { describe, expect, it } from "vitest";
import { stepSim } from "../src/core/engine.js";
import { defaultState, hydrateSave } from "../src/core/store.js";

describe("core simulation", () => {
  it("serializes identical stepSim inputs byte-for-byte identically", () => {
    const state = defaultState({
      meta: { seed: 123456, tick: 37 },
      world: { weatherTimer: 0 },
    });

    const first = JSON.stringify(stepSim(state));
    const second = JSON.stringify(stepSim(state));
    expect(first).toBe(second);
  });

  it("hydrates an old save without weatherTimer into finite simulation values", () => {
    const raw = defaultState();
    delete raw.world.weatherTimer;

    const hydrated = hydrateSave(raw, 1_000);
    expect(Number.isFinite(hydrated.world.weatherTimer)).toBe(true);
    expect(Number.isNaN(hydrated.world.weatherTimer)).toBe(false);
    expect(Number.isFinite(stepSim(hydrated).world.weatherTimer)).toBe(true);
  });
});
