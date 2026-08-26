import { describe, expect, it } from "vitest";
import { createBattle } from "../src/combat/battle.js";
import { unlockMo } from "../src/classes/unlock.js";
import { tickIdle } from "../src/progression/idle.js";

describe("round 2 contracts", () => {
  it("keeps a finished battle settled when tick is called again", () => {
    const battle = createBattle({
      player: {
        id: "player",
        name: "画徒",
        classId: "jian",
        element: "metal",
        hp: 100,
        atk: 100,
        qi: 100,
      },
      enemy: {
        id: "enemy",
        name: "纸傀",
        classId: "yao",
        element: "wood",
        hp: 1,
        atk: 10,
      },
      seed: 1,
    });

    battle.cast({ type: "line", precision: 1, pressure: 1 });
    const settledAt = battle.getState().t;

    expect(battle.getState().finished).toBe("win");
    expect(battle.getState().log.filter(({ kind }) => kind === "end")).toHaveLength(1);

    battle.tick(60_000);

    expect(battle.getState().finished).toBe("win");
    expect(battle.getState().t).toBe(settledAt);
    expect(battle.getState().log.filter(({ kind }) => kind === "end")).toHaveLength(1);
  });

  it("requires six distinct stroke types to unlock Mo", () => {
    const fiveTypes = ["line", "curve", "circle", "zigzag", "spiral"];
    const locked = {
      inkUnlocked: false,
      gallery: [...fiveTypes, "line"].map((type) => ({ type })),
    };

    expect(unlockMo(locked)).toBe(locked);

    const unlocked = unlockMo({
      ...locked,
      gallery: [...locked.gallery, { type: "cloud" }],
    });

    expect(unlocked.inkUnlocked).toBe(true);
  });

  it("does not grant idle rewards twice at the same timestamp", () => {
    const now = 1_700_000_000_000;
    const save = {
      realmId: "qi_refining",
      qiPills: 3,
      buns: 4,
      idleUntil: now - 10 * 60_000,
    };

    const first = tickIdle(save, now);
    const second = tickIdle(first, now);

    expect(first.idleClaimed).toBe(true);
    expect(second).toMatchObject({
      qiPills: first.qiPills,
      buns: first.buns,
      idleClaimed: false,
      idleClaim: { minutes: 0, pills: 0, buns: 0 },
    });
  });
});
