import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  SAVE_DEBOUNCE_MS,
  SAVE_MAX_WAIT_MS,
  clearSave,
  flushSave,
  hasPendingSave,
  loadState,
  migrate,
  resetSaveScheduler,
  saveState,
  scheduleSave,
} from "../../src/engine/save";
import { SCHEMA_VERSION, createInitialState } from "../../src/engine/state";
import { FLOWERS } from "../../src/data/flowers";

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

describe("save migrate", () => {
  it("fills missing fields from garbage payload", () => {
    const s = migrate({ coins: 7, plots: null });
    expect(s.schemaVersion).toBe(SCHEMA_VERSION);
    expect(s.coins).toBe(7);
    expect(s.plots.length).toBeGreaterThan(0);
    expect(s.inventory).toEqual({});
  });

  it("keeps an existing wall-clock anchor and stamps one for v1 saves", () => {
    expect(migrate({ schemaVersion: 2, lastSeenAt: 4_242 }, 90_000).lastSeenAt).toBe(4_242);
    // 旧档没有可信锚点：以本次加载为准，不补发一笔凭空的离线收益
    expect(migrate({ schemaVersion: 1, now: 1_000 }, 90_000).lastSeenAt).toBe(90_000);
  });

  it("backfills flowers the legacy save never recorded at its own level", () => {
    const migrated = migrate({ level: 5, unlockedFlowers: ["daisy"] }, 0);
    const eligible = FLOWERS.filter((f) => f.unlockLevel <= 5).map((f) => f.id);

    expect(migrated.unlockedFlowers[0]).toBe("daisy");
    expect(migrated.unlockedFlowers).toEqual(expect.arrayContaining(eligible));
    expect(migrated.unlockedFlowers.some((id) => (FLOWERS.find((f) => f.id === id)?.unlockLevel ?? 0) > 5)).toBe(
      false,
    );
  });
});

describe("save scheduling", () => {
  it("stops deferring once the max wait elapses under continuous activity", () => {
    vi.useFakeTimers();
    vi.setSystemTime(0);
    const state = createInitialState(0);
    const setItem = vi.spyOn(Storage.prototype, "setItem");

    for (let t = 0; t < SAVE_MAX_WAIT_MS - 100; t += 100) {
      state.coins += 1;
      scheduleSave(state);
      vi.advanceTimersByTime(100);
    }
    expect(setItem).not.toHaveBeenCalled();

    state.coins += 1;
    scheduleSave(state);
    vi.advanceTimersByTime(100);
    expect(setItem).toHaveBeenCalledTimes(1);
    expect(JSON.parse(localStorage.getItem(SAVE_KEY) ?? "{}").coins).toBe(state.coins);
  });

  it("skips a rewrite when the payload has not changed", () => {
    const state = createInitialState(0);
    const setItem = vi.spyOn(Storage.prototype, "setItem");

    expect(saveState(state)).toBe(true);
    expect(flushSave(state)).toBe(false);
    expect(setItem).toHaveBeenCalledTimes(1);

    state.coins += 5;
    expect(flushSave(state)).toBe(true);
    expect(setItem).toHaveBeenCalledTimes(2);
  });

  it("drops a pending write when the session is reloaded or reset", () => {
    vi.useFakeTimers();
    const state = createInitialState(0);
    const setItem = vi.spyOn(Storage.prototype, "setItem");

    scheduleSave(state);
    expect(hasPendingSave()).toBe(true);
    loadState();
    expect(hasPendingSave()).toBe(false);

    vi.advanceTimersByTime(SAVE_DEBOUNCE_MS * 4);
    expect(setItem).not.toHaveBeenCalled();

    saveState(state);
    scheduleSave(state);
    clearSave();
    expect(hasPendingSave()).toBe(false);
    expect(localStorage.getItem(SAVE_KEY)).toBeNull();
  });
});
