import { describe, expect, it } from "vitest";
import { createInitialState } from "../src/core/engine.js";
import { plant, harvest, tickPlots, seasonFactor } from "../src/systems/farm/index.js";
import { enqueueJob, collectJob, canCraft, tickProduction } from "../src/systems/production/index.js";
import { deliverWish, refreshWishes, build } from "../src/systems/village/index.js";

describe("season factor", () => {
  it("in-season is 1, off-season is 0.55, greenhouse ignores", () => {
    const rice = { seasons: ["spring", "summer"] };
    expect(seasonFactor(rice, "spring")).toBe(1);
    expect(seasonFactor(rice, "winter")).toBe(0.55);
    expect(seasonFactor(rice, "winter", true)).toBe(1);
  });
});

describe("farm loop", () => {
  it("plants and harvests rice into paddy", () => {
    let s = createInitialState();
    s = { ...s, resources: { ...s.resources, coin: 200 } };
    const planted = plant(s, { plotId: "p1", cropId: "rice" });
    expect(planted.ok).toBe(true);
    const grown = tickPlots(planted.state, 0, planted.state.plots[0].doneAt);
    const got = harvest(grown, { plotId: "p1" });
    expect(got.ok).toBe(true);
    expect(got.state.inv.paddy).toBeGreaterThanOrEqual(2);
  });
});

describe("mill chain", () => {
  it("paddy becomes rice at mill", () => {
    let s = createInitialState();
    s = {
      ...s,
      meta: { ...s.meta, level: 3 },
      inv: { ...s.inv, paddy: 4 },
      buildings: { ...s.buildings, mill: { built: true, slotCount: 2 } },
    };
    expect(canCraft(s, "mill_rice")).toBe(true);
    const q = enqueueJob(s, { buildingId: "mill", recipeId: "mill_rice" });
    expect(q.ok).toBe(true);
    const done = tickProduction(q.state, 0, q.state.jobs[0].doneAt);
    const c = collectJob(done, { buildingId: "mill", slot: done.jobs[0].id });
    expect(c.ok).toBe(true);
    expect(c.state.inv.rice).toBe(1);
  });
});

describe("wishes", () => {
  it("delivers rice wish when inventory is enough", () => {
    let s = refreshWishes(createInitialState());
    s = { ...s, inv: { ...s.inv, rice: 4 } };
    const wish = s.wishes.find((w) => w.needs.rice);
    if (!wish) {
      s = { ...s, wishes: [{ id: "w_rice", wishId: "w_rice_x", name: "黄米饭", needs: { rice: 2 }, coin: 28, xp: 12, status: "open" }] };
    }
    const target = s.wishes.find((w) => w.needs.rice);
    const d = deliverWish(s, { wishId: target.wishId });
    expect(d.ok).toBe(true);
    expect(d.state.resources.coin).toBeGreaterThan(s.resources.coin);
  });
});

describe("build gate", () => {
  it("rejects mill at level 1", () => {
    const s = createInitialState();
    const r = build(s, { buildingId: "mill" });
    expect(r.ok).toBe(false);
  });
});
