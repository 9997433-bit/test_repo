import { describe, expect, it } from "vitest";
import { HEROES, HERO_LIST } from "../src/data/index.js";

describe("hero data", () => {
  it("has a unique, non-empty id for every hero", () => {
    const ids = HERO_LIST.map(({ id }) => id);

    expect(ids.every((id) => typeof id === "string" && id.length > 0)).toBe(
      true,
    );
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("keeps table keys aligned with hero ids", () => {
    Object.entries(HEROES).forEach(([key, hero]) => {
      expect(hero.id).toBe(key);
    });
  });
});

describe("Round 2 unlock: the complete 18-hero roster is landed", () => {
  it("contains every hero promised by the GDD", () => {
    expect(HERO_LIST).toHaveLength(18);
  });
});
