import { describe, expect, it } from "vitest";
import { createGame } from "../src/core/game.js";
import { recruitCost } from "../src/data/units.js";

describe("game loop", () => {
  it("recruit spends mantou and fills hand", () => {
    const g = createGame({ seed: 7 });
    g.start();
    const before = g.state.sides.player.mantou;
    const r = g.recruit("player");
    expect(r.card.glyph).toBeTruthy();
    expect(g.state.sides.player.hand).toHaveLength(1);
    expect(g.state.sides.player.mantou).toBe(before - recruitCost(0));
  });

  it("leak reduces hearts and can end the match", () => {
    const g = createGame({ seed: 1 });
    g.start();
    g.state.sides.player.hearts = 1;
    g.state.sides.player.enemies.push({
      id: 99,
      t: 0.99,
      hp: 10,
      maxHp: 10,
      speed: 400,
      reward: 1,
      boss: false,
      glyph: "兵",
      stun: 0,
      shield: 0,
    });
    g.tick(1);
    expect(g.state.sides.player.hearts).toBe(0);
    expect(g.state.phase).toBe("over");
    expect(g.state.winner).toBe("ai");
  });

  it("place onto unlocked empty cell", () => {
    const g = createGame({ seed: 3 });
    g.start();
    g.state.sides.player.hand.push({ kind: "unit", id: "dao", glyph: "刀", level: 1 });
    expect(g.place("player", 0, 6)).toBe(true);
    expect(g.state.sides.player.cells[6].unit.glyph).toBe("刀");
  });
});
