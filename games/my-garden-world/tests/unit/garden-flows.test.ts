import { afterEach, describe, expect, it, vi } from "vitest";
import { FLOWERS, FLOWER_MAP } from "../../src/data/flowers";
import { migrate } from "../../src/engine/save";
import {
  MAX_PLOTS,
  SCHEMA_VERSION,
  createInitialState,
  type ActiveOrder,
} from "../../src/engine/state";
import { tickGarden } from "../../src/systems/garden";
import { fulfillOrder } from "../../src/systems/orders";
import { harvest, plant, unlockPlot, waterPlot } from "../../src/systems/planting";
import { scoreArrangement } from "../../src/systems/workshop";

function makeOrder(overrides: Partial<ActiveOrder> = {}): ActiveOrder {
  return {
    uid: "order-under-test",
    templateId: "test-order",
    kind: "resident",
    title: "Test order",
    hint: "Test hint",
    dueAt: 100_000,
    coin: 20,
    exp: 18,
    waterReward: 4,
    flowerIds: ["daisy"],
    flowerCount: 1,
    ...overrides,
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("plant growth", () => {
  it("advances only watered plots through every timed stage and then wilts", () => {
    const state = createInitialState(1_000);
    const flower = FLOWER_MAP.daisy;

    expect(plant(state, 0, flower.id)).toBe(true);
    expect(state.plots[0]?.stage).toBe("seeded");

    state.now += 100;
    tickGarden(state, 100);
    expect(state.plots[0]?.stage).toBe("seeded");

    for (const expectedStage of ["sprout", "bud", "bloom"] as const) {
      const plot = state.plots[0];
      expect(plot).toBeDefined();
      if (!plot) throw new Error("expected the first garden plot");

      for (let i = plot.watered; i < flower.waterNeed; i += 1) {
        expect(waterPlot(state, plot.id)).toBe(true);
      }
      expect(waterPlot(state, plot.id)).toBe(false);

      state.now = plot.lastTick + flower.growMs;
      tickGarden(state, flower.growMs);
      expect(plot.stage).toBe(expectedStage);
      expect(plot.lastTick).toBe(state.now);
      expect(plot.watered).toBe(expectedStage === "bloom" ? flower.waterNeed : 0);
    }

    const bloom = state.plots[0];
    expect(bloom).toBeDefined();
    if (!bloom) throw new Error("expected the first garden plot");

    state.now = bloom.lastTick + flower.growMs * 1.8;
    tickGarden(state, flower.growMs * 1.8);
    expect(bloom.stage).toBe("bloom");

    state.now += 1;
    tickGarden(state, 1);
    expect(bloom.stage).toBe("wilt");
  });

  it("clears a wilted flower while granting only salvage rewards", () => {
    const state = createInitialState(5_000);
    const flower = FLOWER_MAP.daisy;
    const plot = state.plots[0];
    expect(plot).toBeDefined();
    if (!plot) throw new Error("expected the first garden plot");

    plot.flowerId = flower.id;
    plot.stage = "wilt";
    plot.plantedAt = 1_000;
    plot.lastTick = 4_000;
    const startingCoins = state.coins;

    expect(harvest(state, plot.id)).toBe(false);
    expect(state.coins).toBe(startingCoins + Math.round(flower.harvestCoin * 0.2));
    expect(state.exp).toBe(2);
    expect(state.inventory[flower.id]).toBe(0);
    expect(state.stats.harvested).toBe(0);
    expect(state.plots[0]).toMatchObject({
      id: 0,
      flowerId: null,
      stage: "empty",
    });
  });
});

describe("order fulfillment", () => {
  it("rejects unknown and under-stocked orders without paying rewards", () => {
    const state = createInitialState();
    const order = makeOrder();
    state.orders = [order];
    const startingCoins = state.coins;

    expect(fulfillOrder(state, "missing-order")).toBe(false);
    expect(fulfillOrder(state, order.uid)).toBe(false);
    expect(state.orders).toEqual([order]);
    expect(state.coins).toBe(startingCoins);
    expect(state.stats.ordersDone).toBe(0);
  });

  it("rejects custom orders when the arrangement is missing or below the score", () => {
    const state = createInitialState();
    const order = makeOrder({ kind: "custom", requireScore: 70 });
    const lowScoreArrangement = {
      id: "low-score",
      vase: "clay",
      flowerIds: ["daisy", "peach"],
      score: 69,
      name: "Low score",
      createdAt: state.now,
    };
    state.orders = [order];
    state.arrangements = [lowScoreArrangement];

    expect(fulfillOrder(state, order.uid, "unknown-arrangement")).toBe(false);
    expect(fulfillOrder(state, order.uid, lowScoreArrangement.id)).toBe(false);
    expect(state.arrangements).toEqual([lowScoreArrangement]);
    expect(state.orders).toEqual([order]);
  });

  it("consumes required flowers and applies capped rewards on success", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.25);
    const state = createInitialState();
    const order = makeOrder();
    state.orders = [order];
    state.inventory = { daisy: 1 };
    state.coins = 10;
    state.water = 39;
    state.reputation = 100;
    state.quests = [];

    expect(fulfillOrder(state, order.uid)).toBe(true);
    expect(state.inventory.daisy).toBeUndefined();
    expect(state.coins).toBe(30);
    expect(state.exp).toBe(18);
    expect(state.water).toBe(40);
    expect(state.reputation).toBe(100);
    expect(state.stats.ordersDone).toBe(1);
    expect(state.orders.some((candidate) => candidate.uid === order.uid)).toBe(false);
    expect(state.orders).toHaveLength(3);
  });

  it("consumes a qualifying custom arrangement but preserves the others", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    const state = createInitialState();
    const order = makeOrder({ kind: "custom", requireScore: 70 });
    const keeper = {
      id: "keeper",
      vase: "clay",
      flowerIds: ["daisy", "peach"],
      score: 65,
      name: "Keeper",
      createdAt: state.now,
    };
    const qualifying = {
      ...keeper,
      id: "qualifying",
      score: 85,
      name: "Qualifying",
    };
    state.orders = [order];
    state.arrangements = [keeper, qualifying];
    state.quests = [];

    expect(fulfillOrder(state, order.uid, qualifying.id)).toBe(true);
    expect(state.arrangements).toEqual([keeper]);
    expect(state.stats.ordersDone).toBe(1);
  });

  it("handles arbitrary-flower count orders on both failure and success", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.75);
    const state = createInitialState();
    const order = makeOrder({
      kind: "silk",
      flowerIds: undefined,
      flowerCount: 2,
    });
    state.orders = [order];
    state.inventory = { daisy: 2 };

    expect(fulfillOrder(state, order.uid)).toBe(false);
    expect(state.inventory).toEqual({ daisy: 2 });

    state.inventory.peach = 1;
    state.quests = [];
    expect(fulfillOrder(state, order.uid)).toBe(true);
    expect(state.inventory).toEqual({ daisy: 1 });
  });
});

describe("arrangement scoring", () => {
  it("returns zero for undersized or invalid arrangements", () => {
    expect(scoreArrangement([], "clay", "spring")).toBe(0);
    expect(scoreArrangement(["daisy"], "clay", "spring")).toBe(0);
    expect(scoreArrangement(["daisy", "not-a-flower"], "clay", "spring")).toBe(0);
  });

  it("keeps every calculated score within the inclusive 0-100 bounds", () => {
    const flowerSets = [
      [],
      ["daisy"],
      ["daisy", "peach"],
      ["daisy", "peach", "orchid"],
      FLOWERS.map((flower) => flower.id),
    ];

    for (const flowerIds of flowerSets) {
      for (const vase of ["clay", "bronze", "unknown-vase"]) {
        for (const season of ["spring", "winter", "unknown-season"]) {
          const score = scoreArrangement(flowerIds, vase, season);
          expect(score).toBeGreaterThanOrEqual(0);
          expect(score).toBeLessThanOrEqual(100);
        }
      }
    }

    expect(scoreArrangement(FLOWERS.map((flower) => flower.id), "bronze", "spring")).toBe(100);
  });
});

describe("save migration", () => {
  it.each([undefined, null, false, 42, "garbage"])(
    "replaces a non-object payload (%s) with a valid initial state",
    (garbage) => {
      const migrated = migrate(garbage);

      expect(migrated.schemaVersion).toBe(SCHEMA_VERSION);
      expect(migrated.plots).toHaveLength(6);
      expect(migrated.inventory).toEqual({});
      expect(migrated.orders).toEqual([]);
      expect(migrated.quests.length).toBeGreaterThan(0);
    },
  );

  it("sanitizes malformed collection and nested fields while retaining valid values", () => {
    const migrated = migrate({
      schemaVersion: -100,
      coins: 7,
      plots: "broken",
      inventory: null,
      orders: {},
      arrangements: "broken",
      placedDecor: 42,
      unlockedFlowers: null,
      stats: null,
      quests: null,
    });

    expect(migrated.schemaVersion).toBe(SCHEMA_VERSION);
    expect(migrated.coins).toBe(7);
    expect(migrated.plots).toHaveLength(6);
    expect(migrated.inventory).toEqual({});
    expect(migrated.orders).toEqual([]);
    expect(migrated.arrangements).toEqual([]);
    expect(migrated.placedDecor).toEqual([]);
    expect(migrated.unlockedFlowers).toEqual(expect.arrayContaining(["daisy", "peach"]));
    expect(migrated.stats).toEqual({
      harvested: 0,
      ordersDone: 0,
      cancelled: 0,
      planted: 0,
    });
    expect(migrated.quests).toHaveLength(3);
  });
});

describe("plot unlocking", () => {
  it("rejects unaffordable expansion and enforces the maximum plot cap", () => {
    const poorState = createInitialState();
    poorState.coins = 0;
    expect(unlockPlot(poorState)).toBe(false);
    expect(poorState.plots).toHaveLength(6);

    const state = createInitialState();
    state.coins = 10_000;
    while (state.plots.length < MAX_PLOTS) {
      const nextId = state.plots.length;
      expect(unlockPlot(state)).toBe(true);
      expect(state.plots.at(-1)?.id).toBe(nextId);
    }

    const coinsAtCap = state.coins;
    expect(state.plots).toHaveLength(MAX_PLOTS);
    expect(unlockPlot(state)).toBe(false);
    expect(state.plots).toHaveLength(MAX_PLOTS);
    expect(state.coins).toBe(coinsAtCap);
  });
});
