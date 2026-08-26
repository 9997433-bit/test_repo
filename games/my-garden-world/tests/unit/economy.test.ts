import { describe, expect, it } from "vitest";
import { createInitialState } from "../../src/engine/state";
import { addCoins, addExp, spendCoins, takeItem, addItem } from "../../src/systems/economy";
import { scoreArrangement } from "../../src/systems/workshop";
import { plant, harvest } from "../../src/systems/planting";

describe("economy", () => {
  it("spends coins only when affordable", () => {
    const s = createInitialState();
    s.coins = 10;
    expect(spendCoins(s, 12)).toBe(false);
    expect(spendCoins(s, 8)).toBe(true);
    expect(s.coins).toBe(2);
  });

  it("levels up when exp overflows", () => {
    const s = createInitialState();
    addExp(s, 999);
    expect(s.level).toBeGreaterThan(1);
  });

  it("inventory add/take is balanced", () => {
    const s = createInitialState();
    addItem(s, "daisy", 2);
    expect(takeItem(s, "daisy", 3)).toBe(false);
    expect(takeItem(s, "daisy", 2)).toBe(true);
    expect(s.inventory.daisy).toBeUndefined();
  });
});

describe("workshop score", () => {
  it("rewards seasonal harmony", () => {
    const low = scoreArrangement(["daisy"], "clay", "spring");
    const mid = scoreArrangement(["daisy", "peach"], "clay", "spring");
    const high = scoreArrangement(["daisy", "peach", "orchid"], "bronze", "spring");
    expect(low).toBe(0);
    expect(high).toBeGreaterThan(mid);
    expect(high).toBeLessThanOrEqual(100);
  });
});

describe("planting", () => {
  it("rejects planting on occupied soil", () => {
    const s = createInitialState();
    addCoins(s, 200);
    expect(plant(s, 0, "daisy")).toBe(true);
    expect(plant(s, 0, "daisy")).toBe(false);
  });

  it("cannot harvest empty plot", () => {
    const s = createInitialState();
    expect(harvest(s, 0)).toBe(false);
  });
});
