import { describe, expect, it } from "vitest";
import { createStore } from "../src/core/store.js";
import { canPlace, placeBuilding, expandRaft } from "../src/world/build.js";
import { tickWorld } from "../src/world/sim.js";

describe("world", () => {
  it("rejects overlapping placement", () => {
    const store = createStore();
    let s = placeBuilding(store.get(), "house", 0, 0, 0);
    expect(s.buildings).toHaveLength(1);
    expect(canPlace(s, "house", 0, 0, 0).ok).toBe(false);
    s = placeBuilding(s, "house", 0, 0, 0);
    expect(s.buildings).toHaveLength(1);
  });

  it("ticks produce fish when a chair exists", () => {
    let s = createStore().get();
    s = placeBuilding(s, "fish_chair", 3, 1, 0);
    const before = s.resources.rawFish;
    s = tickWorld(s, 20);
    expect(s.resources.rawFish).toBeGreaterThan(before);
  });

  it("expandRaft grows width", () => {
    const s = expandRaft(createStore().get(), "right");
    expect(s.raft.width).toBe(7);
  });
});
