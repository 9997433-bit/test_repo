import { describe, expect, it } from "vitest";
import {
  FIXED_DT,
  createWorld,
  predictTrajectory,
  stepWorld,
} from "../src/physics/index.js";
import {
  createWorld as createBattleWorld,
  makeEgg,
  predictTrajectory as predictBattleTrajectory,
  stepWorld as stepBattleWorld,
} from "../src/core/sim.js";

describe("physics stepping", () => {
  it("samples the fixed-step world clock deterministically", () => {
    const world = createWorld();
    const samples = [];

    for (let i = 0; i < 4; i += 1) {
      stepWorld(world);
      samples.push(world.time);
    }

    samples.forEach((sample, index) => {
      expect(sample).toBeCloseTo(FIXED_DT * (index + 1), 12);
    });
  });

  it("steps an empty world without manufacturing entities", () => {
    const world = createWorld();

    expect(() => stepWorld(world, FIXED_DT)).not.toThrow();
    expect(world.eggs).toEqual([]);
    expect(world.statics).toEqual([]);
    expect(world.fields).toEqual([]);
    expect(world.time).toBeCloseTo(FIXED_DT, 12);
  });

  it("keeps the world clock finite when an egg has NaN velocity", () => {
    const world = createWorld();
    world.eggs.push({
      id: "nan-speed",
      x: 100,
      y: 100,
      vx: Number.NaN,
      vy: Number.NaN,
    });

    expect(() => stepWorld(world, FIXED_DT)).not.toThrow();
    expect(Number.isFinite(world.time)).toBe(true);
    expect(world.eggs).toHaveLength(1);
  });

  it("exposes trajectory prediction as a side-effect-free sample array", () => {
    const world = createWorld();
    const before = structuredClone(world);
    const samples = predictTrajectory(
      { x: 240, y: 40 },
      { x: 120, y: 360 },
      world,
      12,
    );

    expect(Array.isArray(samples)).toBe(true);
    expect(world).toEqual(before);
  });
});

describe(
  "Round 2 unlock: predictTrajectory returns one sample per requested step",
  () => {
    it("honors the requested ballistic prediction length", () => {
      const samples = predictTrajectory(
        { x: 240, y: 40 },
        { x: 120, y: 360 },
        createWorld(),
        12,
      );

      expect(samples).toHaveLength(12);
    });
  },
);

describe(
  "Round 2 unlock: stepWorld integrates eggs and recycles y > 820",
  () => {
    it("removes an egg after it leaves the bottom boundary", () => {
      const world = createWorld();
      world.eggs.push({
        id: "escaped",
        x: 240,
        y: 821,
        vx: 0,
        vy: 20,
        radius: 12,
      });

      stepWorld(world, FIXED_DT);

      expect(world.eggs).toHaveLength(0);
    });
  },
);

describe("active battle physics adapter", () => {
  it("keeps prediction and a live shot on the same upstream fixed-step path", () => {
    const world = createBattleWorld();
    const origin = { x: 240, y: 92 };
    const velocity = { x: 120, y: 240 };
    const steps = 24;
    const prediction = predictBattleTrajectory(origin, velocity, world, {
      maxBounces: 99,
      maxSteps: steps,
    });
    const egg = makeEgg({
      x: origin.x,
      y: origin.y,
      vx: velocity.x,
      vy: velocity.y,
    });

    expect(world.time).toBe(0);
    world.eggs.push(egg);
    for (let i = 0; i < steps; i += 1) {
      stepBattleWorld(world, FIXED_DT);
    }

    const [predictedX, predictedY] = prediction.points.at(-1);
    expect(egg.x).toBeCloseTo(predictedX, 10);
    expect(egg.y).toBeCloseTo(predictedY, 10);
    expect(world.time).toBeCloseTo(steps * FIXED_DT, 12);
  });
});
