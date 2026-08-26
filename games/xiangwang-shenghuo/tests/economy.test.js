import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createInitialState } from "../src/core/engine.js";
import { plant, harvest, tickPlots, seasonFactor } from "../src/systems/farm/index.js";
import {
  enqueueJob,
  collectJob,
  canCraft,
  feedAnimal,
  tickProduction,
} from "../src/systems/production/index.js";
import {
  acceptWish,
  deliverWish,
  refreshWishes,
  wishCandidates,
  build,
} from "../src/systems/village/index.js";

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

  it("applies a plot greenhouse locally and a built greenhouse globally", () => {
    const initial = createInitialState();
    const winter = {
      ...initial,
      meta: { ...initial.meta, season: "winter" },
      plots: initial.plots.map((plot) => ({
        ...plot,
        status: "empty",
        greenhouse: plot.id === "p1",
      })),
    };

    const localFirst = plant(winter, { plotId: "p1", cropId: "rice" });
    const localBoth = plant(localFirst.state, { plotId: "p2", cropId: "rice" });

    expect(localBoth.ok).toBe(true);
    expect(localBoth.state.plots[0].doneAt - localBoth.state.plots[0].plantedAt).toBe(
      18_000,
    );
    expect(localBoth.state.plots[1].doneAt - localBoth.state.plots[1].plantedAt).toBe(
      Math.round(18_000 / 0.55),
    );

    const global = {
      ...winter,
      buildings: { ...winter.buildings, greenhouse: { built: true } },
      plots: winter.plots.map((plot) => ({ ...plot, greenhouse: false })),
    };
    const globalFirst = plant(global, { plotId: "p1", cropId: "rice" });
    const globalBoth = plant(globalFirst.state, { plotId: "p2", cropId: "rice" });

    expect(globalBoth.ok).toBe(true);
    expect(
      globalBoth.state.plots.map((plot) => plot.doneAt - plot.plantedAt),
    ).toEqual([18_000, 18_000]);
  });

  it.skip("rejects crops above the town level (pending farm unlockLevel gate)", () => {
    const initial = createInitialState();
    const result = plant(initial, { plotId: "p1", cropId: "corn" });

    expect(result.ok).toBe(false);
    expect(result.reason).toBe("小镇等级不够");
    expect(result.state).toBe(initial);
    expect(result.state.resources.coin).toBe(initial.resources.coin);
    expect(result.state.plots[0]).toEqual(initial.plots[0]);
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

  it("collects completed livestock jobs through the public collection API", () => {
    const initial = createInitialState();
    const ready = {
      ...initial,
      inv: { ...initial.inv, chicken_feed: 1 },
      buildings: { ...initial.buildings, coop: { built: true, slotCount: 3 } },
    };

    const fed = feedAnimal(ready, { buildingId: "coop" });
    expect(fed.ok).toBe(true);
    expect(fed.state.inv.chicken_feed).toBeUndefined();
    expect(fed.state.jobs[0]).toMatchObject({
      buildingId: "coop",
      kind: "livestock",
      productId: "egg",
      qty: 1,
      xp: 5,
    });

    const done = tickProduction(fed.state, 0, fed.state.jobs[0].doneAt);
    const collected = collectJob(done, {
      buildingId: "coop",
      slot: done.jobs[0].id,
    });

    expect(collected.ok).toBe(true);
    expect(collected.state.inv.egg).toBe(1);
    expect(collected.state.meta.xp).toBe(initial.meta.xp + 5);
    expect(collected.state.jobs).toHaveLength(0);
  });
});

describe("wishes", () => {
  it("marks an open wish accepted without mutating the input state", () => {
    const initial = createInitialState();
    const openWish = {
      id: "w_veg",
      wishId: "w_veg_test",
      name: "一棵白菜",
      needs: { cabbage: 1 },
      coin: 14,
      xp: 8,
      status: "open",
    };
    const ready = { ...initial, wishes: [openWish] };

    const accepted = acceptWish(ready, { wishId: openWish.wishId });

    expect(accepted.ok).toBe(true);
    expect(accepted.wish).toMatchObject({ wishId: openWish.wishId, status: "accepted" });
    expect(accepted.state.wishes).toEqual([accepted.wish]);
    expect(ready.wishes).toEqual([openWish]);

    const repeated = acceptWish(accepted.state, { wishId: openWish.wishId });
    expect(repeated).toEqual({
      ok: false,
      reason: "这单已经接下了",
      state: accepted.state,
    });
  });

  it.skip("filters the deterministic first board by minLevel (pending village gate)", () => {
    const initial = createInitialState();
    const candidates = wishCandidates(initial);
    const refreshed = refreshWishes(initial);

    expect(candidates.every((wish) => wish.minLevel <= initial.meta.level)).toBe(true);
    expect(refreshed.wishes).toHaveLength(3);
    expect(refreshed.wishes.map((wish) => wish.id)).toEqual(["w_veg", "w_soy", "w_wheat"]);
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
