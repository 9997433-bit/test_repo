import { describe, expect, it } from "vitest";
import { tickIdle } from "../src/progression/idle.js";
import { breakthrough } from "../src/progression/realm.js";
import { defaultSave } from "../src/core/store.js";

describe("idle", () => {
  it("caps long offline time", () => {
    const now = 1_700_000_000_000;
    const save = {
      ...defaultSave(),
      qiPills: 7,
      buns: 11,
      idleUntil: now - 20 * 60 * 60 * 1000,
    };
    const next = tickIdle(save, now);

    expect(next.idleClaim).toEqual({ minutes: 8 * 60, pills: 1920, buns: 288 });
    expect(next.qiPills).toBe(1927);
    expect(next.buns).toBe(299);
    expect(next.idleUntil).toBe(now);
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
