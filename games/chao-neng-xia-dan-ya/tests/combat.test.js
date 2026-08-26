import { describe, expect, it } from "vitest";
import { resolveHit } from "../src/combat/index.js";

function expectNonDecreasing(values) {
  values.slice(1).forEach((value, index) => {
    expect(value).toBeGreaterThanOrEqual(values[index]);
  });
}

describe("resolveHit", () => {
  it("produces monotonic damage as egg power increases", () => {
    const damages = [0, 1, 5, 10, 20].map(
      (power) => resolveHit({ power }, { hp: 100 }, { combo: 0 }).damage,
    );

    expectNonDecreasing(damages);
  });

  it("handles zero-power damage without a negative or non-finite result", () => {
    const result = resolveHit({ power: 0 }, { hp: 100 }, { combo: 0 });

    expect(Number.isFinite(result.damage)).toBe(true);
    expect(result.damage).toBeGreaterThanOrEqual(0);
  });

  it("increases damage monotonically with combo and advances the combo", () => {
    const results = [0, 1, 5, 10, 20].map((combo) =>
      resolveHit({ power: 12 }, { hp: 100 }, { combo }),
    );

    expectNonDecreasing(results.map(({ damage }) => damage));
    results.forEach((result) => {
      expect(result.comboDelta).toBe(1);
    });
  });

  it("uses safe defaults for an egg with missing fields", () => {
    const result = resolveHit({}, {}, {});

    expect(Number.isFinite(result.damage)).toBe(true);
    expect(result.damage).toBeGreaterThan(0);
    expect(result.effects).toEqual([]);
    expect(result.comboDelta).toBe(1);
  });
});

describe.skip(
  "Round 2 unlock: resolveHit defines a zero-power no-damage contract",
  () => {
    it("returns exactly zero damage when egg power is zero", () => {
      expect(resolveHit({ power: 0 }, { hp: 100 }, { combo: 0 }).damage).toBe(0);
    });
  },
);
