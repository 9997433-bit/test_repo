import { describe, expect, it } from "vitest";
import { STORY_CHAIN, nextStoryChapter } from "../../src/data/orders";
import { createInitialState } from "../../src/engine/state";
import { fulfillOrder, spawnOrders, tickOrders } from "../../src/systems/orders";

describe("百花盛会剧情单", () => {
  it("等级不足时不挂第一折", () => {
    const state = createInitialState();
    spawnOrders(state);
    expect(state.orders.some((o) => o.templateId === "story-invite")).toBe(false);
    expect(nextStoryChapter(0, 4)).toBeUndefined();
  });

  it("五阶起挂请帖且超时不伤口碑", () => {
    const state = createInitialState();
    state.level = 5;
    spawnOrders(state);
    const story = state.orders.find((o) => o.templateId === "story-invite");
    expect(story).toBeDefined();
    for (const o of state.orders) {
      if (o.templateId !== "story-invite") o.dueAt = state.now + 9_999_000;
    }
    const rep = state.reputation;
    const cancelled = state.stats.cancelled;
    state.now = story!.dueAt;
    tickOrders(state);
    expect(state.reputation).toBe(rep);
    expect(state.stats.cancelled).toBe(cancelled);
    expect(state.orders.some((o) => o.templateId === "story-invite")).toBe(true);
  });

  it("交付后推进折数并放出下一折", () => {
    const state = createInitialState();
    state.level = 6;
    state.storyChapter = 0;
    spawnOrders(state);
    const first = state.orders.find((o) => o.templateId === STORY_CHAIN[0]!.id);
    expect(first).toBeDefined();
    state.inventory.plum = 1;
    expect(fulfillOrder(state, first!.uid)).toBe(true);
    expect(state.storyChapter).toBe(1);
    expect(state.orders.some((o) => o.templateId === "story-trial")).toBe(true);
  });
});
