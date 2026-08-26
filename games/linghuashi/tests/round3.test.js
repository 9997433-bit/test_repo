import { afterEach, describe, expect, it, vi } from "vitest";
import { createBattle } from "../src/combat/battle.js";
import { createStore, defaultSave, migrate, SAVE_KEY } from "../src/core/store.js";
import { CATCH_COST, releaseBeast } from "../src/progression/beasts.js";
import { beginBattle, settleBattle } from "../src/progression/settle.js";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("Round 3 存档迁移", () => {
  it("把 v1 旧档升级到现行版本并保留玩家进度", () => {
    const legacy = {
      version: 1,
      playerName: "旧卷画徒",
      classId: "fa",
      realmId: "foundation",
      xp: 137,
      qiPills: 29,
      buns: 18,
      talents: { might: 2 },
      beasts: [{ uid: "fox-1", id: "ink_fox", name: "墨狐", passive: "crit", value: 0.08, star: 1 }],
      gallery: [{ type: "circle", precision: 0.8, at: 42 }],
      clearedStages: ["tutorial"],
      settings: { mute: true },
      tutorialDone: true,
      inkUnlocked: false,
    };

    const next = migrate(legacy);

    expect(defaultSave().version).toBeGreaterThan(legacy.version);
    expect(next).toMatchObject({
      version: defaultSave().version,
      playerName: "旧卷画徒",
      classId: "fa",
      realmId: "foundation",
      xp: 137,
      qiPills: 29,
      buns: 18,
      talents: { might: 2 },
      beasts: legacy.beasts,
      gallery: legacy.gallery,
      clearedStages: ["tutorial"],
      settings: { mute: true, reducedMotion: false },
      tutorialDone: true,
      inkUnlocked: false,
    });
  });

  it("hydrate 升级旧档前保留原始备份", () => {
    const raw = JSON.stringify({
      ...defaultSave(),
      version: 1,
      playerName: "待迁移画徒",
      xp: 88,
    });
    const setItem = vi.fn();
    vi.stubGlobal("localStorage", {
      getItem: vi.fn((key) => (key === SAVE_KEY ? raw : null)),
      setItem,
    });

    const save = createStore().hydrate();

    expect(save).toMatchObject({
      version: defaultSave().version,
      playerName: "待迁移画徒",
      xp: 88,
    });
    expect(setItem).toHaveBeenCalledWith("linghuashi.save.bak", raw);
  });
});

describe("Round 3 战斗结算", () => {
  it("同一 battleId 只发一次奖励，新战斗仍可正常结算", () => {
    const started = beginBattle({ ...defaultSave(), xp: 5, qiPills: 6 }, "tutorial", "battle-final");
    const first = settleBattle(started, { result: "win", stage: "tutorial" });
    const duplicate = settleBattle(first, { result: "win", stage: "tutorial" });

    expect(first).toMatchObject({
      xp: 45,
      qiPills: 14,
      clearedStages: ["tutorial"],
      settledBattleId: "battle-final",
    });
    expect(duplicate).toBe(first);

    const restarted = beginBattle(duplicate, "tutorial", "battle-next");
    const second = settleBattle(restarted, { result: "win", stage: "tutorial" });
    expect(second).toMatchObject({
      xp: 85,
      qiPills: 22,
      clearedStages: ["tutorial"],
      settledBattleId: "battle-next",
    });
  });
});

describe("Round 3 金雷引", () => {
  function critCount(elementHint) {
    const battle = createBattle({
      player: { id: "p", name: "画徒", classId: "jian", element: "earth", hp: 100, atk: 20, qi: 100_000 },
      enemy: { id: "e", name: "金傀", classId: "yao", element: "metal", hp: 1_000_000_000, atk: 1 },
      seed: 73,
      modifiers: { crit: 0.2 },
    });
    let count = 0;
    for (let i = 0; i < 400; i += 1) {
      const { events } = battle.cast({ type: "line", precision: 0.8, pressure: 0.5 }, elementHint);
      if (events[0]?.crit) count += 1;
    }
    return count;
  }

  it("thunder → metal 把暴击率提高约 15 个百分点", () => {
    const neutralCrits = critCount("earth");
    const conductCrits = critCount("thunder");
    const rateLift = (conductCrits - neutralCrits) / 400;

    expect(rateLift).toBeGreaterThan(0.1);
    expect(rateLift).toBeLessThan(0.2);
  });
});

describe("Round 3 灵兽放生", () => {
  it("移除指定灵兽、返还半价包子，且不能重复领取返还", () => {
    const target = { uid: "fox-1", id: "ink_fox", name: "墨狐", passive: "crit", value: 0.08, star: 1 };
    const kept = { uid: "deer-1", id: "shan_deer", name: "山海鹿", passive: "shield", value: 12, star: 1 };
    const save = { ...defaultSave(), buns: 7, beasts: [target, kept] };
    const before = structuredClone(save);

    const released = releaseBeast(save, target.uid);

    expect(released.buns).toBe(7 + CATCH_COST.buns / 2);
    expect(released.beasts).toEqual([kept]);
    expect(save).toEqual(before);

    const repeated = releaseBeast(released, target.uid);
    expect(repeated.buns).toBe(released.buns);
    expect(repeated.beasts).toEqual([kept]);
  });
});
