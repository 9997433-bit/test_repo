import { describe, expect, it } from "vitest";
import { createInitialState } from "../src/core/engine.js";
import { feedAnimal } from "../src/systems/production/index.js";

describe("livestock economy", () => {
  it("charges 20% extra winter feed with deterministic carry", () => {
    const initial = createInitialState();
    let state = {
      ...initial,
      meta: { ...initial.meta, season: "winter" },
      inv: { ...initial.inv, chicken_feed: 10 },
      buildings: { ...initial.buildings, coop: { built: true, slotCount: 6 } },
    };
    const remainingFeed = [];
    const winterCarry = [];

    for (let feed = 0; feed < 5; feed += 1) {
      const result = feedAnimal(state, { buildingId: "coop" });
      expect(result.ok).toBe(true);
      state = result.state;
      remainingFeed.push(state.inv.chicken_feed);
      winterCarry.push(state.production.winterFeedCarry);
    }

    expect(remainingFeed).toEqual([9, 8, 7, 6, 4]);
    [0.2, 0.4, 0.6, 0.8, 0].forEach((expected, index) => {
      expect(winterCarry[index]).toBeCloseTo(expected);
    });
  });

  it("keeps fractional livestock yield carry per species", () => {
    const initial = createInitialState();
    let state = {
      ...initial,
      inv: {
        ...initial.inv,
        chicken_feed: 10,
        sheep_feed: 6,
      },
      buildings: {
        ...initial.buildings,
        coop: { built: true, slotCount: 1 },
        sheepfold: { built: true, slotCount: 1 },
      },
      guests: [{ id: "kid_bamboo" }],
    };

    const feedAndRelease = (buildingId) => {
      const result = feedAnimal(state, { buildingId });
      expect(result.ok).toBe(true);
      const job = result.state.jobs.at(-1);
      state = { ...result.state, jobs: [] };
      return job.qty;
    };

    const firstChickenYields = Array.from({ length: 4 }, () => feedAndRelease("coop"));
    const sheepYields = Array.from({ length: 6 }, () => feedAndRelease("sheepfold"));
    const remainingChickenYields = Array.from({ length: 6 }, () =>
      feedAndRelease("coop"),
    );

    expect(sheepYields).toEqual([1, 1, 1, 1, 1, 1]);
    expect([...firstChickenYields, ...remainingChickenYields]).toEqual([
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      2,
    ]);
  });
});
