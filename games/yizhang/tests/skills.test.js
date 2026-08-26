import { afterEach, beforeEach, describe, expect, it } from "vitest";
import * as gloveData from "../src/data/gloves.js";
import { createMatch, resetDeps, step } from "../src/sim/index.js";
import {
  DT,
  advance,
  duelists,
  equip,
  horizontalDistance,
  input,
  placeDuel,
  speedAlong,
} from "./helpers.js";

const { GLOVE_BY_ID } = gloveData;

beforeEach(() => {
  resetDeps();
});

afterEach(() => {
  resetDeps();
});

describe("glove skills", () => {
  it("spring parry reflects an incoming slap impulse toward the attacker", () => {
    const state = createMatch({
      seed: 301,
      gloveId: "cotton",
      offhandId: "spring",
      botCount: 1,
    });
    const { attacker, target: defender } = duelists(state);
    const cotton = GLOVE_BY_ID.cotton;

    equip(attacker, "cotton", "magnet");
    equip(defender, "spring", "cotton");
    placeDuel(attacker, defender, {
      distance: cotton.slapRange * 0.65,
    });

    step(
      state,
      {
        [attacker.id]: input({ slap: true }),
        [defender.id]: input({ yaw: Math.PI, skill: true }),
      },
      DT,
    );
    advance(step, state, Math.min(0.45, cotton.windup + 0.2));

    // The defender is at -Z and faces the attacker; reflection sends the
    // attacker away from the defender toward +Z.
    expect(speedAlong(attacker, 0, 1)).toBeGreaterThan(0.1);
  });

  it("magnet pull reduces horizontal distance to a target in front", () => {
    const state = createMatch({
      seed: 302,
      gloveId: "magnet",
      offhandId: "cotton",
      botCount: 1,
    });
    const { attacker, target } = duelists(state);

    equip(attacker, "magnet", "cotton");
    equip(target, "cotton", "spring");
    placeDuel(attacker, target, { distance: 4 });
    const distanceBefore = horizontalDistance(attacker, target);

    step(state, { [attacker.id]: input({ skill: true }) }, DT);
    advance(step, state, 0.5);

    expect(horizontalDistance(attacker, target)).toBeLessThan(
      distanceBefore - 0.1,
    );
  });
});
