import { describe, expect, it } from "vitest";
import { simulate } from "../src/combat/battle.js";
import { defaultState, reduce } from "../src/core/store.js";
import { towerEnemy, waveEnemy } from "../src/data/enemies.js";
import { challengeTower } from "../src/combat/tower.js";

function seeded(state, extras = {}) {
  return simulate({
    seed: 42,
    heroIds: state.party,
    foes: extras.foes ?? towerEnemy(1).foes,
    state,
    equipped: extras.equipped ?? state.equipped,
    maxTicks: 200,
  });
}

describe("combat", () => {
  it("is deterministic per seed", () => {
    let s = reduce(defaultState(), { type: "CHOOSE_FACTION", faction: "divine", name: "测", now: 1 });
    const a = seeded(s);
    const b = seeded(s);
    expect(a.winner).toBe(b.winner);
    expect(a.ticks).toBe(b.ticks);
    expect(a.frames.at(-1).units.map((u) => u.hp)).toEqual(b.frames.at(-1).units.map((u) => u.hp));
  });

  it("different seeds can diverge", () => {
    let s = reduce(defaultState(), { type: "CHOOSE_FACTION", faction: "demon", name: "测", now: 1 });
    const a = simulate({ seed: 1, heroIds: s.party, foes: towerEnemy(3).foes, state: s, equipped: s.equipped });
    const b = simulate({ seed: 99, heroIds: s.party, foes: towerEnemy(3).foes, state: s, equipped: s.equipped });
    expect(a.frames.length).toBeGreaterThan(0);
    expect(b.frames.length).toBeGreaterThan(0);
  });

  it("tower floors 5 and 10 are bosses", () => {
    expect(towerEnemy(5).boss).toBe(true);
    expect(towerEnemy(10).boss).toBe(true);
    expect(towerEnemy(6).boss).toBe(false);
  });

  it("zhenyue executes low-hp bosses", () => {
    let s = reduce(defaultState(), { type: "CHOOSE_FACTION", faction: "mortal", name: "测", now: 1 });
    const foes = [{ id: "boss", name: "残血章主", faction: "demon", role: "tank", atk: 1, hp: 30, def: 0, boss: true }];
    const r = simulate({
      seed: 7,
      heroIds: s.party,
      foes,
      state: s,
      equipped: ["zhenyue"],
      maxTicks: 80,
    });
    expect(r.winner).toBe("a");
  });

  it("wave pack grows", () => {
    expect(waveEnemy(1).foes.length).toBeLessThan(waveEnemy(8).foes.length);
  });

  it("challengeTower returns floor metadata", () => {
    let s = reduce(defaultState(), { type: "CHOOSE_FACTION", faction: "mortal", name: "测", now: 1 });
    const r = challengeTower(s, 1000);
    expect(r.floor).toBe(1);
    expect(["a", "b"]).toContain(r.winner);
  });
});
