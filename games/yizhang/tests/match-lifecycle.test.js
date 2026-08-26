import { describe, expect, it } from "vitest";
import { MATCH } from "../src/data/gloves.js";
import { createMatch, isMatchOver, step } from "../src/sim/index.js";
import { DT, advance, playersOf } from "./helpers.js";

function humanPlayer(state) {
  const player = playersOf(state).find(({ id }) => id === "p0");
  expect(player, "createMatch should create human player p0").toBeDefined();
  expect(player?.kind).toBe("human");
  return player;
}

describe("falls and respawning", () => {
  it("marks a player below the fall plane and respawns after 1.2 seconds", () => {
    const state = createMatch({
      seed: 201,
      gloveId: "cotton",
      offhandId: "spring",
      botCount: 0,
    });
    const player = humanPlayer(state);
    const deathsBefore = player.deaths;

    player.invulnT = 0;
    player.y = MATCH.fallY - 0.01;
    step(state, {}, DT);

    expect(player.alive).toBe(false);
    expect(player.deaths).toBe(deathsBefore + 1);
    expect(player.respawnT).toBeGreaterThan(MATCH.respawnDelay - 2 * DT);

    advance(step, state, MATCH.respawnDelay - 3 * DT);
    expect(player.alive).toBe(false);

    advance(step, state, 4 * DT);
    expect(player.alive).toBe(true);
    expect(player.y).toBeGreaterThan(MATCH.fallY);
    expect(Math.hypot(player.x, player.z)).toBeLessThanOrEqual(
      MATCH.arenaRadius,
    );
  });

  it("starts respawning as soon as an unsupported rim crossing is detected", () => {
    const state = createMatch({
      seed: 201,
      gloveId: "cotton",
      offhandId: "spring",
      botCount: 0,
    });
    const player = humanPlayer(state);
    const deathsBefore = player.deaths;

    player.invulnT = 0;
    player.x = MATCH.arenaRadius + 0.21;
    player.y = 0;
    player.z = 0;
    player.grounded = false;

    step(state, {}, DT);
    expect(player.alive).toBe(false);
    expect(player.deaths).toBe(deathsBefore + 1);

    advance(step, state, MATCH.respawnDelay - 3 * DT);
    expect(player.alive).toBe(false);

    advance(step, state, 4 * DT);
    expect(player.alive).toBe(true);
    expect(player.y).toBeGreaterThan(MATCH.fallY);
  });
});

describe("match completion", () => {
  it("ends on the next simulation step when p0 reaches seven kills", () => {
    const state = createMatch({
      seed: 202,
      gloveId: "cotton",
      offhandId: "spring",
      botCount: 1,
    });
    const winner = humanPlayer(state);

    winner.kills = MATCH.killsToWin - 1;
    expect(isMatchOver(state)).toMatchObject({ over: false });

    winner.kills = MATCH.killsToWin;
    step(state, {}, DT);
    expect(isMatchOver(state)).toMatchObject({
      over: true,
      winnerId: winner.id,
    });
  });

  it(
    "ends when the four-minute timer reaches zero",
    () => {
      const state = createMatch({
        seed: 203,
        gloveId: "cotton",
        offhandId: "spring",
        botCount: 0,
      });
      const frames = Math.ceil(MATCH.matchSeconds / DT) + 1;

      for (let frame = 0; frame < frames; frame += 1) {
        step(state, {}, DT);
      }

      expect(isMatchOver(state)).toMatchObject({ over: true });
    },
    10_000,
  );
});
