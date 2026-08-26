import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createInitialState } from "../src/core/engine.js";
import {
  clearSave,
  deserialize,
  readSave,
  SAVE_KEY,
  serialize,
  writeSave,
} from "../src/core/save.js";

describe("save serialization", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-01T12:34:56.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
    localStorage.clear();
  });

  it("roundtrips a complete state with save metadata", () => {
    const state = createInitialState();
    const raw = serialize(state);
    const restored = deserialize(raw);

    expect(JSON.parse(raw)).toEqual({
      v: 1,
      savedAt: Date.now(),
      state,
    });
    expect(restored).toEqual({ savedAt: Date.now(), state });
    expect(restored.state).not.toBe(state);
  });

  it("writes, reads, and clears the jsdom localStorage slot", () => {
    const state = {
      ...createInitialState(),
      inv: { rice: 3, paddy: 2 },
    };

    writeSave(state);
    expect(localStorage.getItem(SAVE_KEY)).toBe(serialize(state));
    expect(readSave()).toEqual({ savedAt: Date.now(), state });

    clearSave();
    expect(localStorage.getItem(SAVE_KEY)).toBeNull();
    expect(readSave()).toBeNull();
  });

  it.each([
    ["empty input", null],
    ["malformed JSON", "{not-json"],
    ["unsupported version", JSON.stringify({ v: 2, state: {} })],
    ["missing state", JSON.stringify({ v: 1 })],
  ])("rejects %s", (_label, raw) => {
    expect(deserialize(raw)).toBeNull();
  });
});
