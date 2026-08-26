import { describe, expect, it } from "vitest";
import { createMatch, getView, step } from "../src/sim/index.js";
import { DT, input, playersOf } from "./helpers.js";

const OPTIONS = {
  seed: 0x51a7,
  gloveId: "cotton",
  offhandId: "spring",
  botCount: 3,
};

describe("seeded match simulation", () => {
  it("creates identical state and evolution from the same seed", () => {
    const first = createMatch({ ...OPTIONS });
    const second = createMatch({ ...OPTIONS });

    expect(getView(first)).toEqual(getView(second));

    const firstHuman = playersOf(first).find((player) => player.id === "p0");
    const secondHuman = playersOf(second).find((player) => player.id === "p0");
    expect(firstHuman).toBeDefined();
    expect(secondHuman).toBeDefined();
    expect(firstHuman?.kind).toBe("human");
    expect(secondHuman?.kind).toBe("human");

    for (let frame = 0; frame < 180; frame += 1) {
      const controls = input({
        moveX: frame < 60 ? 0.5 : 0,
        moveZ: frame < 120 ? 1 : -0.25,
        yaw: Math.PI / 5,
        slap: frame === 30 || frame === 120,
        skill: frame === 90,
      });

      step(first, { [firstHuman.id]: controls }, DT);
      step(second, { [secondHuman.id]: controls }, DT);
    }

    const firstView = getView(first);
    expect(firstView).toEqual(getView(second));
    expect(JSON.parse(JSON.stringify(firstView))).toEqual(firstView);
  });
});
