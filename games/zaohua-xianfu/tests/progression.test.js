import { describe, expect, it } from "vitest";
import { defaultState, reduce } from "../src/core/store.js";
import { breakthroughChance, applyBreakthrough } from "../src/progression/realm.js";
import { yieldMultiplier } from "../src/disciples/assign.js";

describe("progression", () => {
  it("cannot break through without exp", () => {
    const s = reduce(defaultState(), { type: "CHOOSE_FACTION", faction: "mortal", name: "测", now: 1 });
    expect(breakthroughChance(s)).toBe(0);
  });

  it("failed breakthrough raises heart demon and keeps realm", () => {
    const s = reduce(defaultState(), { type: "CHOOSE_FACTION", faction: "mortal", name: "测", now: 1 });
    s.realm.exp = 9999;
    s.resources.pills = 10;
    const fail = applyBreakthrough(s, () => 0.99);
    expect(fail.ok).toBe(false);
    expect(fail.state.realm.index).toBe(0);
    expect(fail.state.realm.heartDemon).toBe(1);
    expect(fail.state.resources.pills).toBeLessThan(10);
  });

  it("success advances layer", () => {
    const s = reduce(defaultState(), { type: "CHOOSE_FACTION", faction: "mortal", name: "测", now: 1 });
    s.realm.exp = 9999;
    const win = applyBreakthrough(s, () => 0);
    expect(win.ok).toBe(true);
    expect(win.state.realm.layer).toBe(2);
  });

  it("diligent disciples boost gathering", () => {
    const mul = yieldMultiplier({ diligent: 20, force: 1, profession: 2 }, { type: "field" });
    const idle = yieldMultiplier(null, { type: "field" });
    expect(mul).toBeGreaterThan(idle);
  });

  it("cultivate spends qi", () => {
    let s = reduce(defaultState(), { type: "CHOOSE_FACTION", faction: "divine", name: "测", now: 1 });
    const qi = s.resources.qi;
    s = reduce(s, { type: "CULTIVATE" });
    expect(s.resources.qi).toBe(qi - 4);
    expect(s.realm.exp).toBeGreaterThan(0);
  });
});
