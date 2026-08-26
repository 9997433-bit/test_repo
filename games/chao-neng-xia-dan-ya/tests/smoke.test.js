import { describe, expect, it } from "vitest";
import { createWorld, stepWorld } from "../src/physics/index.js";
import { resolveHit } from "../src/combat/index.js";
import { defaultSave } from "../src/core/store.js";
import { HERO_LIST } from "../src/data/index.js";

describe("scaffold smoke", () => {
  it("steps an empty world", () => {
    const w = createWorld();
    stepWorld(w, 1 / 120);
    expect(w.time).toBeGreaterThan(0);
  });

  it("resolves a hit", () => {
    const r = resolveHit({ power: 10 }, { hp: 20 }, { combo: 2 });
    expect(r.damage).toBeGreaterThan(0);
  });

  it("has a default roster", () => {
    expect(defaultSave().roster.length).toBe(5);
    expect(HERO_LIST.length).toBeGreaterThanOrEqual(5);
  });
});
