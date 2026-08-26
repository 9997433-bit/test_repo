import { describe, expect, it } from "vitest";
import { createStore } from "../src/core/store.js";
import { canBuild, canPlace, expandRaft, moveBuilding, placeBuilding } from "../src/world/build.js";
import { tickWorld } from "../src/world/sim.js";

describe("world", () => {
  it("reports stable reason codes and preserves rejected state references", () => {
    const base = createStore().get();
    const occupied = placeBuilding(base, "house", 0, 0, 0);
    const broke = { ...base, resources: { ...base.resources, wood: 0 } };
    const checks = [
      [canBuild(base, "not-a-building", 0, 0, 0), "E_UNKNOWN_TYPE"],
      [canBuild(base, "dive_dock", 0, 0, 0), "E_LOCKED"],
      [canBuild(base, "house", 5, 4, 0), "E_BOUNDS"],
      [canBuild(occupied, "fish_chair", 0, 0, 0), "E_OCCUPIED"],
      [canBuild(broke, "house", 3, 3, 0), "E_COST"],
    ];

    for (const [result, reason] of checks) {
      expect(result).toMatchObject({ ok: false, reason });
      expect(result.reason).toMatch(/^E_[A-Z_]+$/);
    }
    expect(placeBuilding(base, "not-a-building", 0, 0, 0)).toBe(base);
    expect(placeBuilding(base, "dive_dock", 0, 0, 0)).toBe(base);
    expect(placeBuilding(occupied, "fish_chair", 0, 0, 0)).toBe(occupied);
    expect(placeBuilding(broke, "house", 3, 3, 0)).toBe(broke);
  });

  it("rotates a moved building by 90 degrees", () => {
    const placed = placeBuilding(createStore().get(), "house", 0, 0, 0);
    const id = placed.buildings[0].id;
    const rotated = moveBuilding(placed, id, 0, 0, 90);

    expect(rotated).not.toBe(placed);
    expect(rotated.buildings[0]).toMatchObject({ id, x: 0, y: 0, rot: 90 });
    expect(rotated.raft.tiles[0][0]?.buildingId).toBe(id);
    expect(rotated.raft.tiles[1][0]?.buildingId).toBe(id);
    expect(rotated.raft.tiles[0][1]).toBeNull();
  });

  it("enforces a unique HQ and preserves the state on rejection", () => {
    const withHq = placeBuilding(createStore().get(), "hq", 0, 0, 0);
    const check = canBuild(withHq, "hq", 3, 0, 0);

    expect(check).toMatchObject({ ok: false, reason: "E_UNIQUE" });
    expect(placeBuilding(withHq, "hq", 3, 0, 0)).toBe(withHq);
    expect(withHq.buildings.filter((building) => building.type === "hq")).toHaveLength(1);
  });

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
