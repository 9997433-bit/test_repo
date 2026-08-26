import { describe, expect, it } from "vitest";
import {
  GLOVES,
  GLOVE_BY_ID,
  MATCH,
  isGloveUnlocked,
} from "../src/data/gloves.js";

const REQUIRED_FIELDS = [
  "id",
  "name",
  "role",
  "color",
  "slapRange",
  "slapAngleDeg",
  "slapPower",
  "slapCooldown",
  "windup",
  "recovery",
  "skillId",
  "skillCooldown",
  "unlock",
];

describe("glove data contract", () => {
  it("defines all eight gloves and indexes each one by id", () => {
    expect(GLOVES).toHaveLength(8);
    expect(new Set(GLOVES.map((glove) => glove.id)).size).toBe(8);

    for (const glove of GLOVES) {
      expect(glove).toEqual(
        expect.objectContaining(
          Object.fromEntries(
            REQUIRED_FIELDS.map((field) => [field, expect.anything()]),
          ),
        ),
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

  it("keeps cotton unlocked and challenge gloves locked without progress", () => {
    expect(isGloveUnlocked).toBeTypeOf("function");
    expect(isGloveUnlocked("cotton", {})).toBe(true);

    for (const glove of GLOVES.filter(({ id }) => id !== "cotton")) {
      expect(isGloveUnlocked(glove.id, {})).toBe(false);
    }
  });
});
