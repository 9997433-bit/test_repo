import { describe, expect, it } from "vitest";
import { tickIdle } from "../src/progression/idle.js";
import { breakthrough } from "../src/progression/realm.js";
import { defaultSave } from "../src/core/store.js";

describe("idle", () => {
  it("caps long offline time", () => {
    const save = { ...defaultSave(), idleUntil: Date.now() - 20 * 60 * 60 * 1000 };
    const next = tickIdle(save, Date.now());
    expect(next.qiPills).toBeGreaterThan(0);
    expect(next.idleClaim.minutes).toBeLessThanOrEqual(8 * 60);
  });
});

describe("realm", () => {
  it("blocks breakthrough without xp", () => {
    const next = breakthrough({ ...defaultSave(), xp: 0 });
    expect(next.realmId).toBe("qi_refining");
  });
  it("promotes when xp is enough", () => {
    const next = breakthrough({ ...defaultSave(), xp: 80 });
    expect(next.realmId).toBe("foundation");
  });
});
