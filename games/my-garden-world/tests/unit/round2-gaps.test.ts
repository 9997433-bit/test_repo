import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DECORATIONS } from "../../src/data/decorations";
import { FLOWERS } from "../../src/data/flowers";
import { SPIRITS } from "../../src/data/spirits";
import { TUTORIAL } from "../../src/data/story";
import { applyOfflineCatchUp } from "../../src/engine/offline";
import {
  SAVE_DEBOUNCE_MS,
  flushSave,
  hasPendingSave,
  loadState,
  migrate,
  resetSaveScheduler,
  saveState,
  scheduleSave,
} from "../../src/engine/save";
import { createInitialState } from "../../src/engine/state";
import { decorArt, decorSlot } from "../../src/scene/decor-art";
import { createGardenView } from "../../src/scene/garden-view";
import { autoPlace } from "../../src/systems/decorate";
import { backfillUnlocks } from "../../src/systems/economy";
import { refreshSpirits } from "../../src/systems/spirits";
import { ensureTutorialOrder, spawnOrders } from "../../src/systems/orders";
import { ARRANGEMENT_TIERS, arrangementTier, craft } from "../../src/systems/workshop";

const SAVE_KEY = "my-garden-world:save:v1";

beforeEach(() => {
  resetSaveScheduler();
  localStorage.clear();
});

afterEach(() => {
  resetSaveScheduler();
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

  it("caps catch-up time while advancing water and protecting order deadlines", () => {
    const state = createInitialState(0);
    state.water = 0;
    state.orders = [
      {
        uid: "offline-order",
        templateId: "offline-template",
        kind: "resident",
        title: "离线订单",
        hint: "",
        dueAt: 30_000,
        coin: 10,
        exp: 5,
        waterReward: 1,
      },
    ];

    const report = applyOfflineCatchUp(state, 60_000, 16_000);

    expect(report).toMatchObject({
      elapsedMs: 60_000,
      appliedMs: 16_000,
      capped: true,
      water: 2,
    });
    expect(state.now).toBe(16_000);
    expect(state.lastSeenAt).toBe(60_000);
    expect(state.orders[0]?.dueAt).toBe(46_000);
  });
});

describe("save cadence", () => {
  it("debounces a burst and writes the latest state once the quiet window ends", () => {
    vi.useFakeTimers();
    vi.setSystemTime(10_000);
    const state = createInitialState(0);
    const setItem = vi.spyOn(Storage.prototype, "setItem");

    scheduleSave(state);
    expect(hasPendingSave()).toBe(true);
    vi.advanceTimersByTime(SAVE_DEBOUNCE_MS / 2);
    state.coins = 123;
    scheduleSave(state);

    vi.advanceTimersByTime(SAVE_DEBOUNCE_MS - 1);
    expect(setItem).not.toHaveBeenCalled();
    expect(localStorage.getItem(SAVE_KEY)).toBeNull();

    vi.advanceTimersByTime(1);
    expect(setItem).toHaveBeenCalledTimes(1);
    expect(JSON.parse(localStorage.getItem(SAVE_KEY) ?? "{}")).toMatchObject({
      schemaVersion: state.schemaVersion,
      coins: 123,
    });
    expect(hasPendingSave()).toBe(false);
  });

  it("flushes a pending save immediately and cancels its timer", () => {
    vi.useFakeTimers();
    const state = createInitialState(0);
    const setItem = vi.spyOn(Storage.prototype, "setItem");

    scheduleSave(state);
    state.fragments = 9;

    expect(flushSave()).toBe(true);
    expect(setItem).toHaveBeenCalledTimes(1);
    expect(JSON.parse(localStorage.getItem(SAVE_KEY) ?? "{}").fragments).toBe(9);
    expect(hasPendingSave()).toBe(false);

    vi.advanceTimersByTime(SAVE_DEBOUNCE_MS * 2);
    expect(setItem).toHaveBeenCalledTimes(1);
  });
});

describe("arrangement quality labels", () => {
  it("selects every quality tier at its inclusive score boundary", () => {
    expect(ARRANGEMENT_TIERS.map((tier) => tier.id)).toEqual([
      "divine",
      "fine",
      "elegant",
      "common",
    ]);
    expect(arrangementTier(0).id).toBe("common");
    expect(arrangementTier(59).id).toBe("common");
    expect(arrangementTier(60).id).toBe("elegant");
    expect(arrangementTier(74).id).toBe("elegant");
    expect(arrangementTier(75).id).toBe("fine");
    expect(arrangementTier(91).id).toBe("fine");
    expect(arrangementTier(92).id).toBe("divine");
    expect(arrangementTier(100).id).toBe("divine");
  });

  it("includes the calculated tier in a crafted arrangement name", () => {
    const state = createInitialState(200);
    state.inventory = { daisy: 1, peach: 1 };

    const art = craft(state, "clay", ["daisy", "peach"]);

    expect(art).not.toBeNull();
    expect(art?.name).toContain(arrangementTier(art?.score ?? 0).name);
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

  it("deduplicates ordinary templates even when random selection repeats", () => {
    const state = createInitialState();
    vi.spyOn(Math, "random").mockReturnValue(0);

    spawnOrders(state);

    const templateIds = state.orders.map((order) => order.templateId);
    expect(templateIds).toHaveLength(3);
    expect(new Set(templateIds).size).toBe(templateIds.length);
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

  it("backfills level-eligible flowers during migration without duplicates", () => {
    const level = 7;
    const migrated = migrate(
      {
        level,
        unlockedFlowers: ["daisy", "daisy", "dream-rose", "removed-flower"],
      },
      50_000,
    );
    const eligible = FLOWERS.filter((flower) => flower.unlockLevel <= level).map(
      (flower) => flower.id,
    );

    expect(migrated.unlockedFlowers).toEqual(expect.arrayContaining(eligible));
    expect(migrated.unlockedFlowers).toContain("dream-rose");
    expect(migrated.unlockedFlowers).not.toContain("removed-flower");
    expect(new Set(migrated.unlockedFlowers).size).toBe(migrated.unlockedFlowers.length);
  });

  it("backfills a live state's missed flowers idempotently", () => {
    const state = createInitialState();
    state.level = 7;
    state.unlockedFlowers = ["daisy"];
    const eligible = FLOWERS.filter((flower) => flower.unlockLevel <= state.level).map(
      (flower) => flower.id,
    );

    const gained = backfillUnlocks(state);

    expect(gained.length).toBeGreaterThan(0);
    expect(state.unlockedFlowers).toEqual(expect.arrayContaining(eligible));
    expect(backfillUnlocks(state)).toEqual([]);
    expect(new Set(state.unlockedFlowers).size).toBe(state.unlockedFlowers.length);
  });
});

describe("decor rendering", () => {
  it("provides bounded scene placement and SVG art for every catalog decoration", () => {
    for (const decor of DECORATIONS) {
      const slot = decorSlot(decor.id);
      const svg = decorArt(decor.id, decor.glyph);

      expect(slot.x).toBeGreaterThanOrEqual(0);
      expect(slot.x).toBeLessThanOrEqual(100);
      expect(slot.y).toBeGreaterThanOrEqual(0);
      expect(slot.y).toBeLessThanOrEqual(100);
      expect(slot.w).toBeGreaterThan(0);
      expect(["far", "near"]).toContain(slot.depth);
      expect(svg.startsWith("<svg")).toBe(true);
      expect(svg.endsWith("</svg>")).toBe(true);
    }
  });

  it("renders deterministic fallback art and placement for legacy decor ids", () => {
    expect(decorSlot("legacy-statue")).toEqual(decorSlot("legacy-statue"));
    expect(decorArt("legacy-statue", "旧")).toContain(">旧</text>");
  });

  it("renders known and legacy decor entries without duplicating them on stable updates", () => {
    const root = document.createElement("main");
    const view = createGardenView(root, () => undefined);
    const state = createInitialState();
    state.placedDecor = ["lantern", "legacy-statue"];
    autoPlace(state, "lantern");
    autoPlace(state, "legacy-statue");

    view.update(state, null, null);
    const firstNodes = [...root.querySelectorAll<HTMLElement>(".decor-chip")];
    const firstSceneNodes = [...root.querySelectorAll<HTMLElement>(".decor-scene .decor-item")];

    expect(firstNodes.map((node) => node.textContent)).toEqual(["灯 纱灯", "legacy-statue"]);
    expect(firstSceneNodes).toHaveLength(2);
    expect(firstSceneNodes.every((node) => node.querySelector("svg") !== null)).toBe(true);

    view.update(state, null, null);
    const stableNodes = [...root.querySelectorAll<HTMLElement>(".decor-chip")];
    const stableSceneNodes = [...root.querySelectorAll<HTMLElement>(".decor-scene .decor-item")];
    expect(stableNodes).toEqual(firstNodes);
    expect(stableSceneNodes).toEqual(firstSceneNodes);
    expect(stableNodes).toHaveLength(2);
  });

  it("reconciles the decor row when placements change", () => {
    const root = document.createElement("main");
    const view = createGardenView(root, () => undefined);
    const state = createInitialState();
    state.placedDecor = ["lantern"];
    autoPlace(state, "lantern");
    view.update(state, null, null);

    state.placedDecor = ["chimes"];
    state.decorAnchors = {};
    autoPlace(state, "chimes");
    view.update(state, null, null);

    const chips = [...root.querySelectorAll<HTMLElement>(".decor-chip")];
    expect(chips.map((node) => node.textContent)).toEqual(["铃 檐下风铃"]);
    expect(root.querySelector<HTMLElement>('.decor-item[data-decor="chimes"] svg')).not.toBeNull();
    expect(root.querySelector('.decor-item[data-decor="lantern"]')).toBeNull();
  });
});
