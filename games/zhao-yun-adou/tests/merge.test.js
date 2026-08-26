import { describe, expect, it } from "vitest";
import { canMerge, mergeUnits, applyShenbing } from "../src/board/merge.js";

describe("merge", () => {
  it("same unit same level merges", () => {
    const a = { kind: "unit", id: "dao", level: 1 };
    const b = { kind: "unit", id: "dao", level: 1 };
    expect(canMerge(a, b)).toBe(true);
    expect(mergeUnits(a, b).level).toBe(2);
  });

  it("rejects different ids or max level", () => {
    expect(canMerge({ kind: "unit", id: "dao", level: 1 }, { kind: "unit", id: "gong", level: 1 })).toBe(
      false,
    );
    expect(canMerge({ kind: "unit", id: "dao", level: 5 }, { kind: "unit", id: "dao", level: 5 })).toBe(
      false,
    );
  });

  it("shenbing upgrades a unit", () => {
    expect(applyShenbing({ kind: "unit", id: "qi", level: 3 }).level).toBe(4);
  });
});
