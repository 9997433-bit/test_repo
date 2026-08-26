import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createInitialState } from "../src/core/engine.js";
import { plant, harvest, tickPlots, seasonFactor } from "../src/systems/farm/index.js";
import { enqueueJob, collectJob, canCraft, tickProduction } from "../src/systems/production/index.js";
import { deliverWish, refreshWishes, build } from "../src/systems/village/index.js";

describe("season factor", () => {
  const rice = { seasons: ["spring", "summer"] };

  it("in-season is 1, off-season is 0.55, greenhouse ignores", () => {
    expect(seasonFactor(rice, "spring")).toBe(1);
    expect(seasonFactor(rice, "winter")).toBe(0.55);
    expect(seasonFactor(rice, "winter", true)).toBe(1);
  });

  it("does not penalize an unknown crop definition", () => {
    expect(seasonFactor(undefined, "winter")).toBe(1);
  });
});

describe("farm loop", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-01T00:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("charges seed cost, grows, and harvests the official rice yield", () => {
    const initial = createInitialState();
    const planted = plant(initial, { plotId: "p1", cropId: "rice" });

    expect(planted.ok).toBe(true);
    expect(planted.state.resources.coin).toBe(initial.resources.coin - 8);
    expect(planted.state.plots[0]).toMatchObject({
      status: "growing",
      cropId: "rice",
      plantedAt: Date.now(),
      doneAt: Date.now() + 18_000,
    });

    const tooEarly = tickPlots(planted.state, 0, planted.state.plots[0].doneAt - 1);
    expect(tooEarly.plots[0].status).toBe("growing");

    const grown = tickPlots(planted.state, 0, planted.state.plots[0].doneAt);
    const got = harvest(grown, { plotId: "p1" });

    expect(got.ok).toBe(true);
    expect(got.state.inv.paddy).toBe(2);
    expect(got.state.meta.xp).toBe(initial.meta.xp + 6);
    expect(got.state.plots[0]).toMatchObject({
      status: "empty",
      cropId: null,
      plantedAt: 0,
      doneAt: 0,
    });
  });

  it("applies the off-season growth penalty", () => {
    const initial = createInitialState();
    const winter = { ...initial, meta: { ...initial.meta, season: "winter" } };
    const planted = plant(winter, { plotId: "p1", cropId: "rice" });

    expect(planted.ok).toBe(true);
    expect(planted.state.plots[0].doneAt - planted.state.plots[0].plantedAt).toBe(
      Math.round(18_000 / 0.55),
    );
  });
});

describe("mill chain", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-01T00:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("spends two paddy and produces one rice at the mill", () => {
    const initial = createInitialState();
    const ready = {
      ...initial,
      meta: { ...initial.meta, level: 3 },
      inv: { ...initial.inv, paddy: 4 },
      buildings: { ...initial.buildings, mill: { built: true, slotCount: 2 } },
    };

    expect(canCraft(ready, "mill_rice")).toBe(true);
    const queued = enqueueJob(ready, { buildingId: "mill", recipeId: "mill_rice" });
    expect(queued.ok).toBe(true);
    expect(queued.state.inv.paddy).toBe(2);
    expect(queued.state.jobs[0]).toMatchObject({
      buildingId: "mill",
      recipeId: "mill_rice",
      status: "running",
      doneAt: Date.now() + 10_000,
    });

    const premature = collectJob(queued.state, {
      buildingId: "mill",
      slot: queued.state.jobs[0].id,
    });
    expect(premature).toMatchObject({ ok: false, reason: "还在忙" });

    const done = tickProduction(queued.state, 0, queued.state.jobs[0].doneAt);
    const collected = collectJob(done, { buildingId: "mill", slot: done.jobs[0].id });
    expect(collected.ok).toBe(true);
    expect(collected.state.inv).toMatchObject({ paddy: 2, rice: 1 });
    expect(collected.state.jobs).toHaveLength(0);
  });

  it.todo("collects completed livestock jobs through the public collection API");
});

describe("wishes", () => {
  it.todo("marks an open wish accepted once wish acceptance has a status model");

  it("fills the board to three deterministic wishes", () => {
    const refreshed = refreshWishes(createInitialState());

    expect(refreshed.wishes).toHaveLength(3);
    expect(refreshed.wishes.map((wish) => wish.id)).toEqual(["w_veg", "w_rice", "w_egg"]);
    expect(refreshed.wishes.every((wish) => wish.status === "open")).toBe(true);
  });

  it("spends requested items and pays the happiness-adjusted reward", () => {
    const initial = createInitialState();
    const riceWish = {
      id: "w_rice",
      wishId: "w_rice_test",
      name: "黄米饭",
      needs: { rice: 2 },
      coin: 28,
      xp: 12,
      status: "open",
    };
    const ready = {
      ...initial,
      inv: { ...initial.inv, rice: 2 },
      wishes: [riceWish],
    };

    const delivered = deliverWish(ready, { wishId: riceWish.wishId });

    expect(delivered.ok).toBe(true);
    expect(delivered.state.inv.rice).toBeUndefined();
    expect(delivered.state.resources.coin).toBe(112);
    expect(delivered.state.meta.xp).toBe(12);
    expect(delivered.state.wishes).toHaveLength(3);
    expect(delivered.state.log[0]).toContain("收入 32 金币");
  });
});

describe("build gate", () => {
  it("rejects mill at level 1", () => {
    const s = createInitialState();
    const r = build(s, { buildingId: "mill" });
    expect(r.ok).toBe(false);
  });

  it("spends resource and inventory construction costs exactly", () => {
    const initial = createInitialState();
    const ready = {
      ...initial,
      meta: { ...initial.meta, level: 9 },
      resources: { ...initial.resources, coin: 300 },
      inv: { ...initial.inv, cloth: 2 },
    };

    const built = build(ready, { buildingId: "guestroom" });

    expect(built.ok).toBe(true);
    expect(built.state.resources.coin).toBe(20);
    expect(built.state.inv.cloth).toBeUndefined();
    expect(built.state.buildings.guestroom).toMatchObject({ built: true, slotCount: 0 });
  });
});
