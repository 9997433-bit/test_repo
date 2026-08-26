import { describe, expect, it, vi } from "vitest";
import { FLOWERS } from "../../src/data/flowers";
import { OFFLINE_CAP_MS, applyOfflineCatchUp } from "../../src/engine/offline";
import { loadState, migrate, saveState } from "../../src/engine/save";
import {
  MAX_PLOTS,
  createInitialState,
  emptyPlot,
  xpToLevel,
  type ActiveOrder,
} from "../../src/engine/state";
import { addExp, takeItem } from "../../src/systems/economy";
import { cancelOrder, fulfillOrder, spawnOrders, tickOrders } from "../../src/systems/orders";

const ORDER_TIMEOUT_WAVES = 250;
const DUPLICATE_ORDER_REFILLS = 250;
const ORDER_STORM_BUDGET_MS = 250;
const SAVE_SIZE_BUDGET_BYTES = 64 * 1024;

describe("order timeout storm probe", () => {
  it("expires and replenishes repeated full-capacity order waves", () => {
    let randomSeed = 17;
    const random = vi.spyOn(Math, "random").mockImplementation(() => {
      randomSeed = (randomSeed * 48271) % 0x7fffffff;
      return randomSeed / 0x7fffffff;
    });

    try {
      const state = createInitialState(0);
      state.level = 12;
      state.storyChapter = 5;
      spawnOrders(state);
      const orderCap = 5;
      expect(state.orders).toHaveLength(orderCap);

      const startedAt = performance.now();
      for (let wave = 0; wave < ORDER_TIMEOUT_WAVES; wave += 1) {
        state.now = Math.max(...state.orders.map((order) => order.dueAt));
        tickOrders(state);
        expect(state.orders).toHaveLength(orderCap);
        expect(state.orders.every((order) => order.dueAt > state.now)).toBe(true);
      }
      const elapsedMs = performance.now() - startedAt;

      console.info(
        `[probe] ${ORDER_TIMEOUT_WAVES}-wave order timeout storm: ${elapsedMs.toFixed(2)} ms`,
      );
      expect(elapsedMs).toBeLessThanOrEqual(ORDER_STORM_BUDGET_MS);
      expect(state.stats.cancelled).toBe(ORDER_TIMEOUT_WAVES * orderCap);
      expect(state.reputation).toBe(30);
    } finally {
      random.mockRestore();
    }
  });
});

describe("save/load roundtrip probe", () => {
  it(`roundtrips a busy garden below ${SAVE_SIZE_BUDGET_BYTES / 1024} KiB`, () => {
    localStorage.clear();
    try {
      const state = createInitialState(1_800_000);
      state.level = 12;
      state.plots = Array.from({ length: MAX_PLOTS }, (_, id) => emptyPlot(id));
      state.inventory = Object.fromEntries(FLOWERS.map((flower, index) => [flower.id, index + 1]));
      state.unlockedFlowers = FLOWERS.map((flower) => flower.id);
      state.arrangements = Array.from({ length: 100 }, (_, index) => ({
        id: `arrangement-${index}`,
        vase: "celadon",
        flowerIds: FLOWERS.slice(index % 8, (index % 8) + 4).map((flower) => flower.id),
        score: 70 + (index % 31),
        name: `陈列作品 ${index}`,
        createdAt: state.now - index * 1_000,
      }));
      state.placedDecor = Array.from({ length: 100 }, (_, index) => `decor-${index}`);
      spawnOrders(state);

      const serialized = JSON.stringify(state);
      const sizeBytes = new TextEncoder().encode(serialized).byteLength;
      saveState(state);
      const restored = loadState();

      console.info(`[probe] busy save payload: ${sizeBytes} bytes`);
      expect(sizeBytes).toBeLessThanOrEqual(SAVE_SIZE_BUDGET_BYTES);
      expect(restored).toEqual(JSON.parse(serialized));
    } finally {
      localStorage.clear();
    }
  });
});

describe("legacy save migration backfill probe", () => {
  it("fills every current top-level field without overwriting legacy progress", () => {
    const defaults = createInitialState(900_000);
    const migrated = migrate({
      schemaVersion: 0,
      startedAt: 12_000,
      now: 34_000,
      coins: 321,
      level: 7,
      inventory: { daisy: 9 },
      unlockedFlowers: ["daisy", "peach"],
    });

    expect(Object.keys(migrated).sort()).toEqual(Object.keys(defaults).sort());
    expect(migrated).toMatchObject({
      startedAt: 12_000,
      now: 34_000,
      coins: 321,
      level: 7,
      inventory: { daisy: 9 },
    });
    // v2 迁移按等级回填解锁花种：旧档已有条目保持原序在前，缺的按 FLOWERS 顺序补齐
    expect(migrated.unlockedFlowers.slice(0, 2)).toEqual(["daisy", "peach"]);
    expect(new Set(migrated.unlockedFlowers)).toEqual(
      new Set(FLOWERS.filter((flower) => flower.unlockLevel <= 7).map((flower) => flower.id)),
    );
    expect(migrated.schemaVersion).toBe(defaults.schemaVersion);
    expect(migrated.plots).toEqual(defaults.plots);
    expect(migrated.orders).toEqual([]);
    expect(migrated.arrangements).toEqual([]);
    expect(migrated.placedDecor).toEqual([]);
    expect(migrated.quests).toEqual(defaults.quests);
    expect(migrated.stats).toEqual(defaults.stats);
  });
});

describe("offline catch-up probe", () => {
  it("bounds a long absence while settling a maximum-size busy garden", () => {
    const state = createInitialState(0);
    state.level = 15;
    state.water = 0;
    state.activeSpirit = "suideng";
    state.plots = Array.from({ length: MAX_PLOTS }, (_, id) => ({
      ...emptyPlot(id),
      flowerId: "dream-rose",
      stage: "seeded" as const,
      plantedAt: 0,
      lastTick: 0,
    }));
    spawnOrders(state);
    const deadlines = new Map(state.orders.map((order) => [order.uid, order.dueAt]));

    const report = applyOfflineCatchUp(state, OFFLINE_CAP_MS * 4);

    expect(report).toMatchObject({
      elapsedMs: OFFLINE_CAP_MS * 4,
      appliedMs: OFFLINE_CAP_MS,
      capped: true,
      water: 40,
      grown: MAX_PLOTS,
      bloomed: MAX_PLOTS,
    });
    expect(state.now).toBe(OFFLINE_CAP_MS);
    expect(state.lastSeenAt).toBe(OFFLINE_CAP_MS * 4);
    expect(state.water).toBe(40);
    expect(state.plots.every((plot) => plot.stage === "bloom")).toBe(true);
    expect(
      state.orders.every(
        (order) => order.dueAt === (deadlines.get(order.uid) ?? 0) + OFFLINE_CAP_MS,
      ),
    ).toBe(true);
  });
});

describe("duplicate active-order probe", () => {
  it(`keeps template ids unique across ${DUPLICATE_ORDER_REFILLS} adversarial refills`, () => {
    let randomCall = 0;
    const random = vi.spyOn(Math, "random").mockImplementation(() => {
      const call = randomCall;
      randomCall += 1;
      return call % 2 === 0 ? 0 : (Math.floor(call / 2) + 1) / 10_000;
    });

    try {
      const state = createInitialState(0);
      state.level = 12;
      state.storyChapter = 5;
      spawnOrders(state);

      for (let refill = 0; refill < DUPLICATE_ORDER_REFILLS; refill += 1) {
        const templateIds = state.orders.map((order) => order.templateId);
        expect(new Set(templateIds).size).toBe(templateIds.length);

        const leaving = state.orders[refill % state.orders.length];
        expect(leaving).toBeDefined();
        cancelOrder(state, leaving!.uid);

        const replenishedIds = state.orders.map((order) => order.templateId);
        expect(state.orders).toHaveLength(5);
        expect(new Set(replenishedIds).size).toBe(replenishedIds.length);
        expect(replenishedIds).not.toContain(leaving!.templateId);
      }

      expect(state.stats.cancelled).toBe(DUPLICATE_ORDER_REFILLS);
    } finally {
      random.mockRestore();
    }
  });
});

describe("duplicate order submission probe", () => {
  it("settles an order uid at most once when delivery is replayed", () => {
    const state = createInitialState(0);
    const order: ActiveOrder = {
      uid: "probe-order",
      templateId: "probe-template",
      kind: "resident",
      title: "探针订单",
      hint: "",
      dueAt: 60_000,
      coin: 25,
      exp: 10,
      waterReward: 3,
      flowerIds: ["daisy"],
      flowerCount: 1,
    };
    state.inventory.daisy = 2;
    state.orders = [order];

    expect(fulfillOrder(state, order.uid)).toBe(true);
    const settledState = structuredClone(state);

    expect(fulfillOrder(state, order.uid)).toBe(false);
    expect(state).toEqual(settledState);
    expect(state.stats.ordersDone).toBe(1);
    expect(state.inventory.daisy).toBe(1);
    expect(state.orders.some((candidate) => candidate.uid === order.uid)).toBe(false);
  });
});

describe("inventory underflow probe", () => {
  it("never makes stock negative when withdrawals exceed available inventory", () => {
    const state = createInitialState(0);
    state.inventory.daisy = 3;

    expect(takeItem(state, "daisy", 1)).toBe(true);
    expect(state.inventory.daisy).toBe(2);
    expect(takeItem(state, "daisy", 3)).toBe(false);
    expect(state.inventory.daisy).toBe(2);
    expect(takeItem(state, "daisy", 2)).toBe(true);
    expect(takeItem(state, "daisy", 1)).toBe(false);
    expect(state.inventory.daisy).toBeUndefined();
    expect(Object.values(state.inventory).every((count) => count >= 0)).toBe(true);
  });
});

describe("level-up unlock monotonicity probe", () => {
  it("only adds flower unlocks while crossing every configured level", () => {
    const state = createInitialState(0);
    const highestUnlockLevel = Math.max(...FLOWERS.map((flower) => flower.unlockLevel));

    while (state.level < highestUnlockLevel) {
      const unlockedBefore = new Set(state.unlockedFlowers);
      addExp(state, xpToLevel(state.level));
      const unlockedAfter = new Set(state.unlockedFlowers);

      expect([...unlockedBefore].every((flowerId) => unlockedAfter.has(flowerId))).toBe(true);
      expect(state.unlockedFlowers).toHaveLength(unlockedAfter.size);
      for (const flower of FLOWERS.filter((candidate) => candidate.unlockLevel <= state.level)) {
        expect(unlockedAfter.has(flower.id)).toBe(true);
      }
    }

    expect(new Set(state.unlockedFlowers)).toEqual(new Set(FLOWERS.map((flower) => flower.id)));
  });
});
