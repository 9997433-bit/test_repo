import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  SAVE_KEY,
  defaultSave,
  loadSave,
  writeSave,
} from "../src/core/store.js";

function createStorageMock() {
  const values = new Map();

  return {
    getItem(key) {
      return values.has(key) ? values.get(key) : null;
    },
    setItem(key, value) {
      values.set(key, String(value));
    },
    removeItem(key) {
      values.delete(key);
    },
    clear() {
      values.clear();
    },
  };
}

describe("save storage", () => {
  let previousStorageDescriptor;
  let storage;

  beforeEach(() => {
    previousStorageDescriptor = Object.getOwnPropertyDescriptor(
      globalThis,
      "localStorage",
    );
    storage = createStorageMock();
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      value: storage,
    });
  });

  afterEach(() => {
    if (previousStorageDescriptor) {
      Object.defineProperty(
        globalThis,
        "localStorage",
        previousStorageDescriptor,
      );
    } else {
      delete globalThis.localStorage;
    }
  });

  it("returns a complete default save when storage is empty", () => {
    const save = loadSave();

    expect(save).toEqual(defaultSave());
    expect(save.version).toBe(1);
    expect(save.roster).toHaveLength(5);
    expect(save.settings).toEqual({ shake: true, reduceMotion: false });
  });

  it("round-trips a save through the injected storage mock", () => {
    const save = {
      ...defaultSave(),
      gold: 321,
      adventureStage: 7,
      heroLevels: { dash_duck: 4 },
      settings: { shake: false, reduceMotion: true },
    };

    expect(writeSave(save)).toBe(save);
    expect(JSON.parse(storage.getItem(SAVE_KEY))).toEqual(save);
    expect(loadSave()).toEqual(save);
  });
});
