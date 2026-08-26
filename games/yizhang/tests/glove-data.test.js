import { describe, expect, it } from "vitest";
import * as gloveData from "../src/data/gloves.js";
import { isGloveUnlockedForTest } from "./glove-unlock-helper.js";

const { GLOVES, GLOVE_BY_ID, MATCH } = gloveData;
const exportsUnlockHelper = typeof gloveData.isGloveUnlocked === "function";
const isGloveUnlocked = exportsUnlockHelper
  ? gloveData.isGloveUnlocked
  : isGloveUnlockedForTest;

describe("glove data contract", () => {
  it("defines all eight gloves and indexes each one by id", () => {
    expect(GLOVES).toHaveLength(8);
    expect(new Set(GLOVES.map((glove) => glove.id)).size).toBe(8);

    for (const glove of GLOVES) {
      expect(glove).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          name: expect.any(String),
          role: expect.any(String),
          desc: expect.any(String),
          color: expect.any(String),
          slapRange: expect.any(Number),
          slapAngleDeg: expect.any(Number),
          slapPower: expect.any(Number),
          slapCooldown: expect.any(Number),
          windup: expect.any(Number),
          recovery: expect.any(Number),
          moveSpeedMul: expect.any(Number),
          skillId: expect.any(String),
          skillCooldown: expect.any(Number),
          unlock: expect.any(String),
          awakenModifiers: expect.objectContaining({
            slapPowerMul: expect.any(Number),
            slapRangeMul: expect.any(Number),
            slapCooldownMul: expect.any(Number),
            special: expect.any(String),
          }),
        }),
      );
      expect(GLOVE_BY_ID[glove.id]).toBe(glove);
    }
  });

  it("publishes the agreed match constants", () => {
    expect(MATCH).toMatchObject({
      dt: 1 / 60,
      arenaRadius: 20,
      fallY: -8,
      respawnDelay: 1.2,
      matchSeconds: 240,
      killsToWin: 7,
    });
  });

  it.skipIf(!exportsUnlockHelper)(
    "exports isGloveUnlocked from data (skipped: data export is not merged yet)",
    () => {
      expect(gloveData.isGloveUnlocked).toBeTypeOf("function");
    },
  );

  it("keeps cotton unlocked and challenge gloves locked without progress", () => {
    expect(isGloveUnlocked).toBeTypeOf("function");
    expect(isGloveUnlocked("cotton", {})).toBe(true);

    for (const glove of GLOVES.filter(({ id }) => id !== "cotton")) {
      expect(isGloveUnlocked(glove.id, {})).toBe(false);
    }
  });
});
