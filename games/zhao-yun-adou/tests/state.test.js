import { describe, expect, it } from "vitest";
import { stepAi } from "../src/ai/opponent.js";
import { createGame } from "../src/core/game.js";

describe("game state", () => {
  it("serializes a stable, JSON-safe snapshot shape", () => {
    const g = createGame({ seed: 20260826 });
    g.start();

    const snapshot = g.serialize();
    const shape = {
      state: Object.keys(snapshot),
      sides: Object.keys(snapshot.sides),
      side: Object.keys(snapshot.sides.player),
      cell: Object.keys(snapshot.sides.player.cells[0]),
      spawnQueue: Object.keys(snapshot.sides.player.spawnQueue[0]),
      waveSpec: Object.keys(snapshot.sides.player.spawnQueue[0].spec),
      logEntry: Object.keys(snapshot.log[0]),
    };

    expect(shape).toMatchInlineSnapshot(`
      {
        "cell": [
          "index",
          "col",
          "row",
          "unlocked",
          "unit",
        ],
        "logEntry": [
          "t",
          "type",
          "payload",
        ],
        "side": [
          "id",
          "mantou",
          "hearts",
          "recruitCount",
          "cells",
          "hand",
          "enemies",
          "spawnQueue",
          "kills",
          "haste",
          "wave",
        ],
        "sides": [
          "player",
          "ai",
        ],
        "spawnQueue": [
          "remain",
          "acc",
          "spec",
          "bossLeft",
        ],
        "state": [
          "phase",
          "winner",
          "time",
          "wave",
          "seed",
          "sides",
          "log",
        ],
        "waveSpec": [
          "wave",
          "count",
          "hp",
          "speed",
          "reward",
          "boss",
          "interval",
        ],
      }
    `);
    expect(snapshot).not.toHaveProperty("rng");
    expect(JSON.parse(JSON.stringify(snapshot))).toEqual(snapshot);
  });

  it("produces identical AI steps from the same seed", () => {
    const run = (seed) => {
      const g = createGame({ seed });
      g.start();
      for (const dt of [0.1, 0.18, 0.28, 0.56, 0.28, 0.28, 0.28, 0.84, 0.28, 0.28]) {
        stepAi(g, dt);
      }
      return g.serialize();
    };

    const first = run(8675309);
    const second = run(8675309);

    expect(first).toEqual(second);
    expect(first.sides.ai.recruitCount).toBeGreaterThan(0);
    expect(first.log.some(({ type, payload }) => type === "recruit" && payload.side === "ai")).toBe(true);
  });
});
