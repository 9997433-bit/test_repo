import { describe, expect, it } from "vitest";
import { createBattle } from "../src/combat/battle.js";
import { reaction } from "../src/combat/elements.js";
import { computeMods, defaultMods } from "../src/combat/mods.js";
import { defaultSave } from "../src/core/store.js";

function battle(player = {}) {
  return createBattle({
    player: { id: "p", name: "徒", classId: "jian", element: "metal", hp: 200, atk: 40, qi: 200, ...player },
    enemy: { id: "e", name: "蛾", classId: "yao", element: "wood", hp: 80, atk: 5 },
    seed: 7,
    ...overrides,
  });
}

describe("battle casts", () => {
  it("line cast reduces enemy hp", () => {
    const b = battle();
    b.cast({ type: "line", precision: 0.9, pressure: 0.6 });
    expect(b.getState().enemy.hp).toBeLessThan(80);
  });
  it("circle grants shield", () => {
    const b = battle();
    b.cast({ type: "circle", precision: 1, pressure: 0.5 });
    expect(b.getState().player.shield).toBeGreaterThan(0);
  });
  it("cloud heals", () => {
    const b = battle();
    b.getState().player.hp = 40;
    b.cast({ type: "cloud", precision: 1, pressure: 0.5 });
    expect(b.getState().player.hp).toBeGreaterThan(40);
  });
  it("does not cast when qi is insufficient", () => {
    const b = battle({ qi: 0 });
    const result = b.cast({ type: "line", precision: 1, pressure: 0.5 });

    expect(result.events).toEqual([]);
    expect(b.getState().player.qi).toBe(0);
    expect(b.getState().enemy.hp).toBe(80);
    expect(b.getState().log[0]).toMatchObject({ kind: "warn" });
  });
  it("uses shield before reducing player hp", () => {
    const unshielded = battle();
    const shielded = battle();
    shielded.getState().player.shield = 3;

    unshielded.tick(1800);
    shielded.tick(1800);

    expect(shielded.getState().player.shield).toBe(0);
    expect(shielded.getState().player.hp - unshielded.getState().player.hp).toBeCloseTo(3, 8);
  });
  it("triggers enemy attacks across repeated ticks", () => {
    const b = battle();

    for (let i = 0; i < 18; i += 1) b.tick(200);

    const enemyAttacks = b.getState().log.filter((entry) => entry.kind === "enemy");
    expect(b.getState().t).toBe(3600);
    expect(enemyAttacks).toHaveLength(2);
    expect(b.getState().player.hp).toBeLessThan(200);
  });
});

describe("elements", () => {
  it("water evaporates fire", () => {
    expect(reaction("water", "fire").id).toBe("evaporate");
  });
  it("thunder conducts through metal with crit bonus", () => {
    expect(reaction("thunder", "metal").crit).toBeGreaterThan(0);
  });
});
