import { describe, expect, it } from "vitest";
import { createBattle } from "../src/combat/battle.js";
import { reaction } from "../src/combat/elements.js";

function battle() {
  return createBattle({
    player: { id: "p", name: "徒", classId: "jian", element: "metal", hp: 200, atk: 40, qi: 200 },
    enemy: { id: "e", name: "蛾", classId: "yao", element: "wood", hp: 80, atk: 5 },
    seed: 7,
  });
}

describe("battle", () => {
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
});

describe("elements", () => {
  it("water evaporates fire", () => {
    expect(reaction("water", "fire").id).toBe("evaporate");
  });
});
