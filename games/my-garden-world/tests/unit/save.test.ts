import { describe, expect, it } from "vitest";
import { migrate } from "../../src/engine/save";
import { SCHEMA_VERSION } from "../../src/engine/state";

describe("save migrate", () => {
  it("fills missing fields from garbage payload", () => {
    const s = migrate({ coins: 7, plots: null });
    expect(s.schemaVersion).toBe(SCHEMA_VERSION);
    expect(s.coins).toBe(7);
    expect(s.plots.length).toBeGreaterThan(0);
    expect(s.inventory).toEqual({});
  });

  it("backfills flowers and spirits owed by level for old saves", () => {
    const s = migrate({ level: 8, unlockedFlowers: ["daisy"], unlockedSpirits: [] });
    // 8 阶老档应静默补齐 8 阶以下的所有花种与花灵
    expect(s.unlockedFlowers).toEqual(expect.arrayContaining(["daisy", "peony", "waterlily", "spider-lily"]));
    expect(s.unlockedFlowers).not.toContain("snow-lotus"); // 9 阶
    expect(s.unlockedSpirits).toEqual(["juyue", "chiguang"]);
    expect(s.unlockedSpirits).not.toContain("rainbow"); // 10 阶
  });

  it("keeps already-unlocked entries and sanitizes a broken spirit list", () => {
    const s = migrate({ level: 1, unlockedFlowers: ["star-tulip"], unlockedSpirits: "broken" });
    expect(s.unlockedFlowers).toContain("star-tulip");
    expect(s.unlockedSpirits).toEqual([]);
  });
});
