import { describe, expect, it } from "vitest";
import { createGame } from "../src/core/game.js";
import { recruitCost } from "../src/data/units.js";

describe("game contract", () => {
  it("pauses simulation updates and resumes from the same game time", () => {
    const game = createGame({ seed: 11 });
    game.start();
    game.tick(0.02);

    expect(game.pause()).toBe(true);
    expect(game.paused).toBe(true);
    const pausedSnapshot = game.serialize({ rng: true });

    expect(game.tick(10)).toBe(0);
    expect(game.serialize({ rng: true })).toEqual(pausedSnapshot);

    expect(game.resume()).toBe(true);
    expect(game.paused).toBe(false);
    expect(game.tick(0.02)).toBe(1);
    expect(game.state.time).toBeCloseTo(pausedSnapshot.time + 0.02);
    expect(
      game.state.log.filter(({ type }) => type === "pause" || type === "resume").map(({ type }) => type),
    ).toEqual(["pause", "resume"]);
  });

  it("merges matching units from one board cell into another", () => {
    const game = createGame({ seed: 12 });
    game.start();
    const side = game.state.sides.player;
    side.cells[6].unit = { kind: "unit", id: "dao", glyph: "刀", level: 1, cd: 0.1 };
    side.cells[7].unit = { kind: "unit", id: "dao", glyph: "刀", level: 1, cooldown: 0.2 };

    expect(game.merge("player", { index: 6 }, 7)).toBe(true);
    expect(side.cells[6].unit).toBe(null);
    expect(side.cells[7].unit).toMatchObject({
      kind: "unit",
      id: "dao",
      glyph: "刀",
      level: 2,
      cooldown: 0.2,
    });
    expect(game.state.log.at(-1)).toMatchObject({
      type: "merge",
      payload: { side: "player", cellIndex: 7, level: 2 },
    });
  });

  it("uses the shared recruitCost function for quoted and charged costs", () => {
    const game = createGame({ seed: 13 });
    game.start();
    const side = game.state.sides.player;
    const recruitCount = 4;
    side.recruitCount = recruitCount;
    side.mantou = recruitCost(recruitCount);

    expect(game.recruitCost("player")).toBe(recruitCost(recruitCount));

    const result = game.recruit("player");

    expect(result.cost).toBe(recruitCost(recruitCount));
    expect(side.mantou).toBe(0);
    expect(side.recruitCount).toBe(recruitCount + 1);
  });

  it("loads a JSON snapshot and restores its exact random continuation", () => {
    const source = createGame({ seed: 14 });
    source.start();
    source.state.sides.player.mantou = 100;
    source.recruit("player");
    source.tick(0.02);
    const snapshot = JSON.parse(JSON.stringify(source.serialize({ rng: true })));

    const restored = createGame({ seed: 999 });
    expect(restored.load(snapshot)).toBe(true);
    expect(restored.serialize({ rng: true })).toEqual({
      ...snapshot,
      log: [
        ...snapshot.log,
        {
          t: snapshot.time,
          type: "load",
          payload: { seed: snapshot.seed, phase: snapshot.phase },
        },
      ],
    });

    const expectedNextRecruit = source.recruit("player");
    const restoredNextRecruit = restored.recruit("player");
    expect(restoredNextRecruit).toEqual(expectedNextRecruit);
  });
});
