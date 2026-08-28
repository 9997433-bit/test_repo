import { describe, expect, it } from "vitest";
import * as gloveData from "../src/data/gloves.js";
import { isGloveUnlockedForTest } from "./glove-unlock-helper.js";

const { GLOVES, GLOVE_BY_ID, MATCH } = gloveData;
const exportsUnlockHelper = typeof gloveData.isGloveUnlocked === "function";
const isGloveUnlocked = exportsUnlockHelper
  ? gloveData.isGloveUnlocked
  : isGloveUnlockedForTest;

// 首发 8 掌（P1 图鉴序，勿重排）与 P2 内容轮表尾追加的生涯 4 掌
const CANON_IDS = [
  "cotton",
  "granite",
  "gale",
  "frost",
  "spring",
  "afterimage",
  "magnet",
  "meteor",
];
const APPENDED_IDS = ["cocoon", "raven", "victor", "tumbler"];

describe("glove data contract", () => {
  it("defines all twelve gloves and indexes each one by id", () => {
    expect(GLOVES).toHaveLength(12);
    expect(new Set(GLOVES.map((glove) => glove.id)).size).toBe(12);

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

  it("keeps the original eight in dex order and appends the career four at the tail", () => {
    expect(GLOVES.slice(0, 8).map((g) => g.id)).toEqual(CANON_IDS);
    expect(GLOVES.slice(8).map((g) => g.id)).toEqual(APPENDED_IDS);
  });

  it("appended gloves only reuse the canonical skill/special vocabulary", () => {
    const canon = GLOVES.slice(0, 8);
    const skillVocab = new Set(canon.map((g) => g.skillId));
    const specialVocab = new Set(canon.map((g) => g.awakenModifiers.special));
    for (const glove of GLOVES.slice(8)) {
      expect(skillVocab.has(glove.skillId), `${glove.id}.skillId`).toBe(true);
      expect(
        specialVocab.has(glove.awakenModifiers.special),
        `${glove.id}.special`,
      ).toBe(true);
    }
  });

  it("appended glove numbers stay inside the canonical envelope", () => {
    const canon = GLOVES.slice(0, 8);
    const fields = [
      "slapRange",
      "slapAngleDeg",
      "slapPower",
      "slapCooldown",
      "windup",
      "recovery",
      "moveSpeedMul",
      "skillCooldown",
    ];
    for (const field of fields) {
      const values = canon.map((g) => g[field]);
      const min = Math.min(...values);
      const max = Math.max(...values);
      for (const glove of GLOVES.slice(8)) {
        expect(glove[field], `${glove.id}.${field}`).toBeGreaterThanOrEqual(min);
        expect(glove[field], `${glove.id}.${field}`).toBeLessThanOrEqual(max);
      }
    }
    const awakenFields = ["slapPowerMul", "slapRangeMul", "slapCooldownMul"];
    for (const field of awakenFields) {
      const values = canon.map((g) => g.awakenModifiers[field]);
      const min = Math.min(...values);
      const max = Math.max(...values);
      for (const glove of GLOVES.slice(8)) {
        const v = glove.awakenModifiers[field];
        expect(v, `${glove.id}.awaken.${field}`).toBeGreaterThanOrEqual(min);
        expect(v, `${glove.id}.awaken.${field}`).toBeLessThanOrEqual(max);
      }
    }
  });

  it("identification colors stay mutually distinct across all twelve", () => {
    const colors = GLOVES.map((g) => g.color.toLowerCase());
    expect(new Set(colors).size).toBe(GLOVES.length);
    for (const color of colors) expect(color).toMatch(/^#[0-9a-f]{6}$/);
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

  it.skipIf(!exportsUnlockHelper)(
    "career gloves unlock from cumulative save stats (scope:'career')",
    () => {
      const cases = [
        ["cocoon", "totalSlapHits", 300],
        ["raven", "portalCrossings", 20],
        ["victor", "wins", 10],
        ["tumbler", "matches", 25],
      ];
      for (const [id, stat, need] of cases) {
        expect(isGloveUnlocked(id, { stats: { [stat]: need } }), `${id} 达标`).toBe(true);
        expect(isGloveUnlocked(id, { stats: { [stat]: need - 1 } }), `${id} 差一步`).toBe(
          false,
        );
        // 存档 unlocked 名单仍是最优先的旧通路（向后兼容）
        expect(isGloveUnlocked(id, { unlocked: [id] }), `${id} 名单`).toBe(true);
      }
      // 生涯掌不吃别人的计数
      expect(isGloveUnlocked("cocoon", { stats: { wins: 999 } })).toBe(false);
    },
  );
});
