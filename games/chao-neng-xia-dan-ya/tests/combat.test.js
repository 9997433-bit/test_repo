import { describe, expect, it } from "vitest";
import { resolveHit } from "../src/combat/index.js";
import { resolveStrike, CAPS } from "../src/core/adapters.js";

function expectNonDecreasing(values) {
  values.slice(1).forEach((value, index) => {
    expect(value).toBeGreaterThanOrEqual(values[index]);
  });
}

describe("resolveHit", () => {
  it("produces monotonic damage as egg power increases", () => {
    const damages = [1, 5, 10, 20].map(
      (power) =>
        resolveHit(
          { power, forceCrit: false },
          { hp: 100 },
          { combo: 0 },
        ).damage,
    );

    expectNonDecreasing(damages);
  });

  it("treats explicit zero power as authoritative over fallback attack fields", () => {
    const result = resolveHit(
      { power: 0, damage: 99, atk: 99, forceCrit: true },
      { hp: 100 },
      { combo: 0, hero: { atk: 99 } },
    );

    expect(Number.isFinite(result.damage)).toBe(true);
    expect(result.damage).toBe(0);
  });

  it("increases damage monotonically with combo and returns finite combo deltas", () => {
    const results = [0, 1, 5, 10, 20].map((combo) =>
      resolveHit({ power: 12, forceCrit: false }, { hp: 100 }, { combo }),
    );

    expectNonDecreasing(results.map(({ damage }) => damage));
    results.forEach((result) => {
      expect(Number.isFinite(result.comboDelta)).toBe(true);
    });
  });

  it("uses safe defaults for an egg with missing fields", () => {
    const result = resolveHit({}, {}, {});

    expect(Number.isFinite(result.damage)).toBe(true);
    expect(result.damage).toBeGreaterThan(0);
    expect(Array.isArray(result.effects)).toBe(true);
    expect(result.effects).toEqual(
      expect.arrayContaining([expect.objectContaining({ kind: "floater" })]),
    );
    expect(Number.isFinite(result.comboDelta)).toBe(true);
  });
});

describe("Round 3 unlock: resolveHit zero-power contract", () => {
  it("returns exactly zero damage when egg power is zero", () => {
    expect(
      resolveHit(
        { power: 0, forceCrit: false },
        { hp: 100 },
        { combo: 0 },
      ).damage,
    ).toBe(0);
  });
});

describe("active combat adapter", () => {
  it("uses the real resolveHit result without falling back", () => {
    const egg = {
      id: "adapter-egg",
      power: 12,
      element: "physical",
      forceCrit: false,
    };
    const target = { id: "adapter-target", hp: 100, armor: 10 };
    const ctx = { combo: 3, seed: 7 };
    const direct = resolveHit(egg, target, ctx);

    expect(CAPS.combat).toBe(true);
    const adapted = resolveStrike(egg, target, ctx);
    expect(adapted.damage).toBe(direct.damage);
    expect(adapted.effects).toEqual(direct.effects);
    expect(adapted.comboDelta).toBe(direct.comboDelta);
  });
});
