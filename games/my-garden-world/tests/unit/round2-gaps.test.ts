import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FLOWERS } from "../../src/data/flowers";
import { SPIRITS } from "../../src/data/spirits";
import { TUTORIAL } from "../../src/data/story";
import { loadState, saveState } from "../../src/engine/save";
import { startLoop } from "../../src/engine/loop";
import { createInitialState } from "../../src/engine/state";
import { createGardenView } from "../../src/scene/garden-view";
import { refreshSpirits } from "../../src/systems/spirits";
import { ensureTutorialOrder, spawnOrders } from "../../src/systems/orders";
import { craft } from "../../src/systems/workshop";

const SAVE_KEY = "my-garden-world:save:v1";

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  localStorage.clear();
});

describe("offline progress prerequisites", () => {
  it("roundtrips the simulation timestamp needed to calculate elapsed offline time", () => {
    const state = createInitialState(12_345);
    state.now = 67_890;

    saveState(state);

    expect(loadState().now).toBe(67_890);
  });

  it.skip("settles bounded offline progress when a production settlement API is added", () => {
    // No offline settlement function is exported yet. Keeping this explicit avoids
    // pretending that save/load timestamp persistence advances the simulation.
  });
});

describe("save cadence", () => {
  it("coalesces animation frames into one periodic save after 1.5 seconds", () => {
    vi.useFakeTimers({
      toFake: ["performance", "requestAnimationFrame", "cancelAnimationFrame"],
    });
    const state = createInitialState(0);
    const setItem = vi.spyOn(Storage.prototype, "setItem");
    const stop = startLoop(() => state, () => undefined);

    vi.advanceTimersByTime(1_499);
    expect(setItem).not.toHaveBeenCalled();
    expect(localStorage.getItem(SAVE_KEY)).toBeNull();

    vi.advanceTimersByTime(32);
    expect(setItem).toHaveBeenCalledTimes(1);
    expect(JSON.parse(localStorage.getItem(SAVE_KEY) ?? "{}")).toMatchObject({
      schemaVersion: state.schemaVersion,
    });

    stop();
  });
});

describe("arrangement quality labels", () => {
  it("labels scores below 85 as 小景 and scores from 85 as 精品", () => {
    const lowState = createInitialState(100);
    lowState.inventory = { daisy: 2 };
    const low = craft(lowState, "clay", ["daisy", "daisy"]);

    expect(low).not.toBeNull();
    expect(low?.score).toBeLessThan(85);
    expect(low?.name).toContain("小景");

    const highState = createInitialState(200);
    highState.inventory = { daisy: 1, peach: 1 };
    const high = craft(highState, "clay", ["daisy", "peach"]);

    expect(high).not.toBeNull();
    expect(high?.score).toBeGreaterThanOrEqual(85);
    expect(high?.name).toContain("精品");
  });
});

describe("order deduplication boundaries", () => {
  it("does not duplicate the tutorial safety order across repeated checks", () => {
    const state = createInitialState();
    state.tutorialStep = TUTORIAL.findIndex((beat) => beat.goal === "order");
    state.orders = [];

    ensureTutorialOrder(state);
    ensureTutorialOrder(state);
    ensureTutorialOrder(state);

    expect(state.orders.filter((order) => order.templateId === "r-welcome")).toHaveLength(1);
  });

  it("leaves an already-full order queue unchanged", () => {
    const state = createInitialState();
    vi.spyOn(Math, "random")
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(0.1)
      .mockReturnValueOnce(0.2)
      .mockReturnValue(0.3);
    spawnOrders(state);
    const originalOrders = [...state.orders];

    spawnOrders(state);

    expect(state.orders).toEqual(originalOrders);
  });

  it.skip("deduplicates ordinary order templates when a production dedupe API is added", () => {
    // spawnOrders currently permits repeated templates; there is no separate
    // normalizer/deduper to exercise without enforcing a not-yet-shipped policy.
  });
});

describe("unlock backfill", () => {
  it("backfills every eligible spirit and stays duplicate-free", () => {
    const state = createInitialState();
    state.level = 13;
    state.unlockedSpirits = [];

    refreshSpirits(state);
    refreshSpirits(state);

    const eligible = SPIRITS.filter((spirit) => spirit.unlockLevel <= state.level).map(
      (spirit) => spirit.id,
    );
    expect(state.unlockedSpirits).toEqual(eligible);
    expect(new Set(state.unlockedSpirits).size).toBe(state.unlockedSpirits.length);
  });

  it.skip("backfills level-eligible flowers when a production flower backfill API is added", () => {
    // addExp only handles levels crossed during the current call. There is no
    // exported migration/refresh function for old saves missing earlier flowers.
    expect(FLOWERS.length).toBeGreaterThan(0);
  });
});

describe("decor rendering", () => {
  it("renders known and legacy decor entries without duplicating them on stable updates", () => {
    const root = document.createElement("main");
    const view = createGardenView(root, () => undefined);
    const state = createInitialState();
    state.placedDecor = ["lantern", "legacy-statue"];

    view.update(state, null, null);
    const firstNodes = [...root.querySelectorAll<HTMLElement>(".decor-chip")];

    expect(firstNodes.map((node) => node.textContent)).toEqual(["灯 纱灯", "legacy-statue"]);

    view.update(state, null, null);
    const stableNodes = [...root.querySelectorAll<HTMLElement>(".decor-chip")];
    expect(stableNodes).toEqual(firstNodes);
    expect(stableNodes).toHaveLength(2);
  });

  it("reconciles the decor row when placements change", () => {
    const root = document.createElement("main");
    const view = createGardenView(root, () => undefined);
    const state = createInitialState();
    state.placedDecor = ["lantern"];
    view.update(state, null, null);

    state.placedDecor = ["chimes"];
    view.update(state, null, null);

    const chips = [...root.querySelectorAll<HTMLElement>(".decor-chip")];
    expect(chips.map((node) => node.textContent)).toEqual(["铃 檐下风铃"]);
  });
});
