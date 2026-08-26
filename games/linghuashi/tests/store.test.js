import { afterEach, describe, expect, it, vi } from "vitest";
import { createStore, defaultSave, SAVE_KEY } from "../src/core/store.js";

afterEach(() => {
  vi.unstubAllGlobals();
});

function stubStored(raw) {
  const getItem = vi.fn(() => raw);
  vi.stubGlobal("localStorage", { getItem });
  return getItem;
}

describe("store hydrate", () => {
  it("keeps the current state when persisted JSON is malformed", () => {
    const getItem = stubStored("{not valid json");
    const initial = { ...defaultSave(), playerName: "测试画徒", xp: 23 };
    const store = createStore(initial);

    expect(store.hydrate()).toEqual(initial);
    expect(getItem).toHaveBeenCalledWith(SAVE_KEY);
  });

  it("keeps the current state when the persisted version is unsupported", () => {
    stubStored(JSON.stringify({ version: 99, playerName: "旧版坏档", xp: 999 }));
    const initial = { ...defaultSave(), playerName: "当前画徒", xp: 17 };
    const store = createStore(initial);

    expect(store.hydrate()).toEqual(initial);
  });
});
