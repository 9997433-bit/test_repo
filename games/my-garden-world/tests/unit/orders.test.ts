import { describe, expect, it } from "vitest";
import { createInitialState, WATER_CAP, type ActiveOrder } from "../../src/engine/state";
import { addItem } from "../../src/systems/economy";
import { ensureTutorialOrder, fulfillOrder, orderReady, qualifyingArrangements } from "../../src/systems/orders";
import { TUTORIAL } from "../../src/data/story";

function makeOrder(over: Partial<ActiveOrder>): ActiveOrder {
  return {
    uid: "test-1",
    templateId: "t",
    kind: "resident",
    title: "测试订单",
    hint: "",
    dueAt: Number.MAX_SAFE_INTEGER,
    coin: 10,
    exp: 5,
    waterReward: 2,
    ...over,
  };
}

describe("orderReady", () => {
  it("checks specific flowers against inventory", () => {
    const s = createInitialState();
    const o = makeOrder({ flowerIds: ["daisy", "jasmine"] });
    expect(orderReady(s, o)).toBe(false);
    addItem(s, "daisy", 1);
    expect(orderReady(s, o)).toBe(false);
    addItem(s, "jasmine", 1);
    expect(orderReady(s, o)).toBe(true);
  });

  it("counts total stems, not distinct kinds (fixes keys.length bug)", () => {
    const s = createInitialState();
    addItem(s, "daisy", 3);
    expect(orderReady(s, makeOrder({ flowerCount: 2 }))).toBe(true);
    expect(orderReady(s, makeOrder({ flowerCount: 4 }))).toBe(false);
  });

  it("duplicate flower requirements need enough of each", () => {
    const s = createInitialState();
    addItem(s, "daisy", 1);
    expect(orderReady(s, makeOrder({ flowerIds: ["daisy", "daisy"] }))).toBe(false);
    addItem(s, "daisy", 1);
    expect(orderReady(s, makeOrder({ flowerIds: ["daisy", "daisy"] }))).toBe(true);
  });
});

describe("fulfillOrder", () => {
  it("is transactional: failure never consumes materials", () => {
    const s = createInitialState();
    addItem(s, "daisy", 1);
    s.orders = [makeOrder({ flowerIds: ["daisy", "jasmine"] })];
    expect(fulfillOrder(s, "test-1")).toBe(false);
    expect(s.inventory.daisy).toBe(1);
  });

  it("generic orders consume cheapest flowers first", () => {
    const s = createInitialState();
    addItem(s, "star-tulip", 1);
    addItem(s, "daisy", 2);
    s.orders = [makeOrder({ flowerCount: 2 })];
    expect(fulfillOrder(s, "test-1")).toBe(true);
    expect(s.inventory["star-tulip"]).toBe(1);
    expect(s.inventory.daisy).toBeUndefined();
  });

  it("custom orders consume the chosen qualifying arrangement", () => {
    const s = createInitialState();
    s.arrangements = [
      { id: "a-low", vase: "clay", flowerIds: ["daisy", "peach"], score: 60, name: "低分", createdAt: 0 },
      { id: "a-mid", vase: "clay", flowerIds: ["daisy", "peach"], score: 75, name: "中分", createdAt: 0 },
      { id: "a-high", vase: "clay", flowerIds: ["daisy", "peach"], score: 95, name: "高分", createdAt: 0 },
    ];
    const o = makeOrder({ requireScore: 70 });
    const pool = qualifyingArrangements(s, o);
    expect(pool.map((a) => a.id)).toEqual(["a-mid", "a-high"]);
    s.orders = [o];
    expect(fulfillOrder(s, "test-1", "a-mid")).toBe(true);
    expect(s.arrangements.map((a) => a.id)).toContain("a-high");
    expect(s.arrangements.map((a) => a.id)).not.toContain("a-mid");
  });

  it("rejects when no arrangement qualifies", () => {
    const s = createInitialState();
    s.arrangements = [{ id: "a1", vase: "clay", flowerIds: ["daisy", "peach"], score: 50, name: "弱", createdAt: 0 }];
    s.orders = [makeOrder({ requireScore: 85 })];
    expect(fulfillOrder(s, "test-1", "a1")).toBe(false);
    expect(s.arrangements).toHaveLength(1);
  });

  it("caps water reward at WATER_CAP", () => {
    const s = createInitialState();
    s.water = WATER_CAP - 1;
    addItem(s, "daisy", 1);
    s.orders = [makeOrder({ flowerIds: ["daisy"], waterReward: 10 })];
    expect(fulfillOrder(s, "test-1")).toBe(true);
    expect(s.water).toBe(WATER_CAP);
  });
});

describe("ensureTutorialOrder", () => {
  it("guarantees a daisy order during the order tutorial step", () => {
    const s = createInitialState();
    s.tutorialStep = TUTORIAL.findIndex((b) => b.goal === "order");
    s.tutorialDone = false;
    s.orders = [makeOrder({ flowerIds: ["jasmine"] })];
    ensureTutorialOrder(s);
    expect(s.orders.some((o) => o.flowerIds?.includes("daisy"))).toBe(true);
  });

  it("does nothing after tutorial or on other steps", () => {
    const s = createInitialState();
    s.tutorialDone = true;
    s.orders = [];
    ensureTutorialOrder(s);
    expect(s.orders).toHaveLength(0);
  });
});
