import { describe, expect, it } from "vitest";
import { createGame } from "../src/core/game.js";
import { HAND_LIMIT, recruitCost } from "../src/data/units.js";

describe("game loop", () => {
  it("charges the escalating recruit cost and fills the hand", () => {
    const g = createGame({ seed: 7 });
    g.start();
    const side = g.state.sides.player;
    side.mantou = 100;

    const results = [g.recruit("player"), g.recruit("player"), g.recruit("player")];

    expect(results.map((result) => result.cost)).toEqual([
      recruitCost(0),
      recruitCost(1),
      recruitCost(2),
    ]);
    expect(results.map((result) => result.cost)).toEqual([10, 14, 18]);
    expect(results.every((result) => result.card.glyph)).toBe(true);
    expect(side.hand).toHaveLength(3);
    expect(side.recruitCount).toBe(3);
    expect(side.mantou).toBe(58);
  });

  it("rejects recruitment without mutation when the hand is full", () => {
    const g = createGame({ seed: 7 });
    g.start();
    const side = g.state.sides.player;
    side.hand = Array.from({ length: HAND_LIMIT }, () => ({
      kind: "unit",
      id: "dao",
      glyph: "刀",
      level: 1,
    }));
    side.mantou = 0;

    expect(g.recruit("player")).toEqual({ error: "hand-full" });
    expect(side.hand).toHaveLength(HAND_LIMIT);
    expect(side.mantou).toBe(0);
    expect(side.recruitCount).toBe(0);
  });

  it("uses a shovel to unlock a locked cell", () => {
    const g = createGame({ seed: 3 });
    g.start();
    const side = g.state.sides.player;
    side.hand.push({ kind: "shovel", glyph: "铲", level: 1 });

    expect(side.cells[0].unlocked).toBe(false);
    expect(g.useShovel("player", 0, 0)).toBe(true);
    expect(side.cells[0].unlocked).toBe(true);
    expect(side.hand).toEqual([]);
    expect(g.state.log.at(-1)).toMatchObject({
      type: "expand",
      payload: { side: "player", cellIndex: 0 },
    });
  });

  it("uses a token to upgrade an existing unit", () => {
    const g = createGame({ seed: 3 });
    g.start();
    const side = g.state.sides.player;
    side.cells[6].unit = { kind: "unit", id: "qi", glyph: "骑", level: 3 };
    side.hand.push({ kind: "token", id: "shenbing", glyph: "符", level: 1 });

    expect(g.place("player", 0, 6)).toBe(true);
    expect(side.cells[6].unit).toMatchObject({ kind: "unit", id: "qi", level: 4 });
    expect(side.hand).toEqual([]);
    expect(g.state.log.at(-1)).toMatchObject({
      type: "token",
      payload: { side: "player", cellIndex: 6 },
    });
  });

  it("keeps a token in hand when its target cell is empty", () => {
    const g = createGame({ seed: 3 });
    g.start();
    const side = g.state.sides.player;
    side.hand.push({ kind: "token", id: "shenbing", glyph: "符", level: 1 });

    expect(g.place("player", 0, 6)).toBe(false);
    expect(side.cells[6].unit).toBe(null);
    expect(side.hand).toHaveLength(1);
  });

  it("grants wave-scaled mantou compensation for a leak", () => {
    const g = createGame({ seed: 1 });
    g.start();
    const side = g.state.sides.player;
    g.state.wave = 4;
    side.wave = 4;
    side.mantou = 20;
    side.spawnQueue = [];
    g.state.sides.ai.spawnQueue = [];
    side.enemies.push({
      id: 99,
      t: 0.99,
      hp: 10,
      maxHp: 10,
      speed: 520,
      reward: 1,
      boss: false,
      glyph: "兵",
      stun: 0,
      shield: 0,
    });

    g.tick(0.02);

    expect(side.hearts).toBe(2);
    expect(side.mantou).toBe(36);
    expect(side.enemies).toEqual([]);
    expect(g.state.log).toContainEqual({
      t: 0.02,
      type: "leak",
      payload: { side: "player", hearts: 2 },
    });
  });

  it("resolves a double knockout by kill count", () => {
    const g = createGame({ seed: 1 });
    g.start();
    const { player, ai } = g.state.sides;
    player.hearts = 1;
    ai.hearts = 1;
    player.kills = 4;
    ai.kills = 5;
    player.spawnQueue = [];
    ai.spawnQueue = [];
    const leakingEnemy = {
      t: 0.99,
      hp: 10,
      maxHp: 10,
      speed: 520,
      reward: 1,
      boss: false,
      glyph: "兵",
      stun: 0,
      shield: 0,
    };
    player.enemies.push({ ...leakingEnemy, id: 100 });
    ai.enemies.push({ ...leakingEnemy, id: 101 });

    g.tick(0.02);

    expect([player.hearts, ai.hearts]).toEqual([0, 0]);
    expect(g.state.phase).toBe("over");
    expect(g.state.winner).toBe("ai");
    expect(g.state.log.at(-1)).toMatchObject({
      type: "game-over",
      payload: { winner: "ai" },
    });
  });

  it("place onto unlocked empty cell", () => {
    const g = createGame({ seed: 3 });
    g.start();
    g.state.sides.player.hand.push({ kind: "unit", id: "dao", glyph: "刀", level: 1 });
    expect(g.place("player", 0, 6)).toBe(true);
    expect(g.state.sides.player.cells[6].unit.glyph).toBe("刀");
  });
});
