import { describe, expect, it } from "vitest";
import {
  applyAwaken,
  resolveSkill,
  resolveSlap,
  tickStatuses,
} from "../src/combat/index.js";
import { GLOVE_BY_ID } from "../src/data/gloves.js";
import { createMatch, step } from "../src/sim/index.js";
import {
  DT,
  advance,
  duelists,
  equip,
  horizontalSpeed,
  input,
  placeDuel,
  speedAlong,
} from "./helpers.js";

describe("combat module contract", () => {
  it("exports the pure-simulation combat entry points", () => {
    expect(resolveSlap).toBeTypeOf("function");
    expect(resolveSkill).toBeTypeOf("function");
    expect(tickStatuses).toBeTypeOf("function");
    expect(applyAwaken).toBeTypeOf("function");
  });
});

describe("slap cone and impulse", () => {
  it("hits a target in front and adds horizontal speed away from the attacker", () => {
    const state = createMatch({
      seed: 101,
      gloveId: "cotton",
      offhandId: "spring",
      botCount: 1,
    });
    const { attacker, target } = duelists(state);
    const glove = GLOVE_BY_ID.cotton;
    const distance = glove.slapRange * 0.7;

    equip(attacker, "cotton", "spring");
    placeDuel(attacker, target, { distance });
    const speedBefore = horizontalSpeed(target);

    step(state, { [attacker.id]: input({ slap: true }) }, DT);
    advance(step, state, glove.windup + glove.recovery + 0.1);

    expect(horizontalSpeed(target)).toBeGreaterThan(speedBefore + 0.1);
    expect(speedAlong(target, 0, 1)).toBeGreaterThan(0);
  });

  it("misses a target outside the slap cone even when it is in range", () => {
    const state = createMatch({
      seed: 102,
      gloveId: "cotton",
      offhandId: "spring",
      botCount: 1,
    });
    const { attacker, target } = duelists(state);
    const glove = GLOVE_BY_ID.cotton;
    const outsideCone = (glove.slapAngleDeg / 2 + 12) * (Math.PI / 180);

    equip(attacker, "cotton", "spring");
    placeDuel(attacker, target, {
      distance: glove.slapRange * 0.7,
      angle: outsideCone,
    });

    step(state, { [attacker.id]: input({ slap: true }) }, DT);
    advance(step, state, glove.windup + glove.recovery + 0.1);

    expect(horizontalSpeed(target)).toBeLessThan(0.05);
  });
});
