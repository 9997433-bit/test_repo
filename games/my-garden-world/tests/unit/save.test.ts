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
});
