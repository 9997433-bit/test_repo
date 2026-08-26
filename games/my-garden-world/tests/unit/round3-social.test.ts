import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  NEIGHBORS,
  NEIGHBOR_PICK_CAP,
  NEIGHBOR_WATER_CAP,
  addFriendship,
  ensureSocialDay,
  generateNeighborPlots,
  heartsOf,
  helpWater,
  neighborGarden,
  neighborRoster,
  pickNeighborFlower,
  pressingOrders,
  visitSummary,
  visitTally,
} from "../../src/engine/neighbors";
import { loadPrefs, savePrefs, setMutedPref } from "../../src/engine/prefs";
import { clearSave, loadState, migrate, resetSaveScheduler, saveState } from "../../src/engine/save";
import {
  DAILY_PICK,
  DAILY_WATER_HELP,
  SCHEMA_VERSION,
  createInitialState,
  type GameState,
} from "../../src/engine/state";
import { DAY_MS, gameDay } from "../../src/engine/time";

/**
 * Round 3 邻里层：`state.social` 的 v3 迁移、程序化邻家花园的保底与确定性、
 * 帮浇 / 借花的每日余量与交情结算，以及独立于存档的静音偏好。
 */

function openGarden(level = 20): GameState {
  const state = createInitialState(0);
  state.level = level;
  state.tutorialDone = true;
  return state;
}

function thirstyIdx(state: GameState, id: string): number {
  const plot = neighborGarden(state, id)?.plots.find((p) => p.thirsty);
  expect(plot).toBeDefined();
  return plot?.idx ?? -1;
}

function bloomIdx(state: GameState, id: string): number {
  const plot = neighborGarden(state, id)?.plots.find((p) => p.stage === "bloom" && !p.picked);
  expect(plot).toBeDefined();
  return plot?.idx ?? -1;
}

beforeEach(() => {
  resetSaveScheduler();
  localStorage.clear();
});

afterEach(() => {
  resetSaveScheduler();
  localStorage.clear();
});

describe("存档 v3：邻里状态与主题", () => {
  it("新档带一份满余量的邻里状态与空主题", () => {
    const state = createInitialState(1_000);

    expect(state.schemaVersion).toBe(SCHEMA_VERSION);
    expect(SCHEMA_VERSION).toBe(3);
    expect(state.decorTheme).toBeNull();
    expect(state.social).toEqual({
      day: 0,
      waterLeft: DAILY_WATER_HELP,
      pickLeft: DAILY_PICK,
      friendship: {},
      marks: [],
    });
  });

  it("v2 旧档补上空的邻里段，不动其余进度", () => {
    const migrated = migrate({ schemaVersion: 2, coins: 321, level: 4, lastSeenAt: 7 }, 50_000);

    expect(migrated.schemaVersion).toBe(3);
    expect(migrated.coins).toBe(321);
    expect(migrated.lastSeenAt).toBe(7);
    expect(migrated.social.waterLeft).toBe(DAILY_WATER_HELP);
    expect(migrated.social.marks).toEqual([]);
    expect(migrated.decorTheme).toBeNull();
  });

  it("改档写进来的野值一律体检掉", () => {
    const migrated = migrate(
      {
        schemaVersion: 3,
        decorTheme: "rainbow",
        social: {
          day: -5,
          waterLeft: 999,
          pickLeft: -3,
          friendship: { sister: 1e9, ghost: "many", broken: Number.NaN },
          marks: [
            { neighborId: "sister", plotIdx: 2, kind: "water" },
            { neighborId: "sister", plotIdx: -1, kind: "water" },
            { neighborId: "sister", plotIdx: 1, kind: "burn" },
            "nonsense",
          ],
        },
      },
      0,
    );

    expect(migrated.decorTheme).toBeNull();
    expect(migrated.social.day).toBe(0);
    expect(migrated.social.waterLeft).toBe(DAILY_WATER_HELP);
    expect(migrated.social.pickLeft).toBe(0);
    expect(migrated.social.friendship).toEqual({ sister: 30 });
    expect(migrated.social.marks).toEqual([{ neighborId: "sister", plotIdx: 2, kind: "water" }]);
  });

  it("邻里状态与主题都能原样往返存档", () => {
    const state = openGarden();
    state.decorTheme = "ink";
    helpWater(state, "sister", thirstyIdx(state, "sister"));

    expect(saveState(state)).toBe(true);
    const loaded = loadState();

    expect(loaded.decorTheme).toBe("ink");
    expect(loaded.social).toEqual(state.social);
  });
});

describe("邻家花园的生成", () => {
  it("同一位邻居同一日必得同一座园子，隔日换一座", () => {
    const today = generateNeighborPlots("sister", 3);

    expect(generateNeighborPlots("sister", 3)).toEqual(today);
    expect(generateNeighborPlots("sister", 4)).not.toEqual(today);
    expect(generateNeighborPlots("teahouse", 3)).not.toEqual(today);
  });

  it("每位邻居每一日都留得住「有事可做」的保底", () => {
    for (const def of NEIGHBORS) {
      for (let day = 0; day < 60; day += 1) {
        const plots = generateNeighborPlots(def.id, day);
        expect(plots.length).toBeGreaterThanOrEqual(4);
        expect(plots.length).toBeLessThanOrEqual(8);
        expect(plots.filter((p) => p.flowerId).length).toBeGreaterThanOrEqual(2);
        expect(plots.some((p) => p.stage === "bloom")).toBe(true);
        expect(plots.some((p) => p.thirsty)).toBe(true);
        expect(plots.every((p) => p.flowerId === null || def.pool.includes(p.flowerId))).toBe(true);
      }
    }
  });

  it("未到结识阶的邻居只在名录里留个剪影", () => {
    const state = openGarden(1);

    const roster = neighborRoster(state);
    expect(roster.map((r) => r.unlocked)).toEqual([true, false, false]);
    expect(neighborGarden(state, "teahouse")).toBeNull();
    expect(neighborGarden(state, "sister")).not.toBeNull();
  });
});

describe("串门的活计", () => {
  it("帮浇水不耗自家水缸，涨交情与经验，痕迹当日留在圃上", () => {
    const state = openGarden();
    const water = state.water;
    const exp = state.exp;
    const idx = thirstyIdx(state, "sister");

    expect(helpWater(state, "sister", idx)).toBe(true);

    expect(state.water).toBe(water);
    expect(state.exp).toBeGreaterThan(exp);
    expect(state.social.friendship.sister).toBe(1);
    expect(state.social.waterLeft).toBe(DAILY_WATER_HELP - 1);
    const plot = neighborGarden(state, "sister")?.plots[idx];
    expect(plot?.watered).toBe(true);
    expect(plot?.thirsty).toBe(false);
    // 同一块圃不会被浇第二次
    expect(helpWater(state, "sister", idx)).toBe(false);
    expect(state.social.waterLeft).toBe(DAILY_WATER_HELP - 1);
  });

  it("一家最多浇三瓢，浇满即改口留待明日", () => {
    const state = openGarden();
    let done = 0;
    for (const plot of neighborGarden(state, "sister")?.plots ?? []) {
      if (plot.thirsty && helpWater(state, "sister", plot.idx)) done += 1;
    }

    expect(done).toBeLessThanOrEqual(NEIGHBOR_WATER_CAP);
    expect(visitTally(state, "sister").water).toBe(done);
  });

  it("借花入自家花匣，一家只借一枝", () => {
    const state = openGarden();
    const idx = bloomIdx(state, "sister");

    const flowerId = pickNeighborFlower(state, "sister", idx);

    expect(flowerId).not.toBeNull();
    expect(state.inventory[flowerId ?? ""]).toBe(1);
    expect(state.social.pickLeft).toBe(DAILY_PICK - 1);
    expect(neighborGarden(state, "sister")?.plots[idx]?.picked).toBe(true);
    const second = neighborGarden(state, "sister")?.plots.find((p) => p.stage === "bloom" && !p.picked);
    if (second) expect(pickNeighborFlower(state, "sister", second.idx)).toBeNull();
    expect(visitTally(state, "sister").pick).toBe(NEIGHBOR_PICK_CAP);
  });

  it("未开的花摘不得，全日两枝封顶", () => {
    const state = openGarden();
    const thirsty = thirstyIdx(state, "sister");
    expect(pickNeighborFlower(state, "sister", thirsty)).toBeNull();

    let picked = 0;
    for (const def of NEIGHBORS) {
      const idx = neighborGarden(state, def.id)?.plots.find((p) => p.stage === "bloom" && !p.picked)?.idx;
      if (idx !== undefined && pickNeighborFlower(state, def.id, idx)) picked += 1;
    }

    expect(picked).toBe(DAILY_PICK);
    expect(state.social.pickLeft).toBe(0);
  });

  it("回园小结按本次进园的差值报账，什么都没做就不打扰", () => {
    const state = openGarden();
    const before = visitTally(state, "sister");
    expect(visitSummary(state, "sister", before)).toBeNull();

    helpWater(state, "sister", thirstyIdx(state, "sister"));

    expect(visitSummary(state, "sister", before)).toContain("浇了 1 瓢水");
  });
});

describe("跨日与交情", () => {
  it("换了游戏日就补满余量、抹去当日痕迹", () => {
    const state = openGarden();
    helpWater(state, "sister", thirstyIdx(state, "sister"));
    pickNeighborFlower(state, "sister", bloomIdx(state, "sister"));
    expect(state.social.marks.length).toBe(2);

    state.now += DAY_MS;
    expect(ensureSocialDay(state)).toBe(true);

    expect(state.social.day).toBe(gameDay(state));
    expect(state.social.waterLeft).toBe(DAILY_WATER_HELP);
    expect(state.social.pickLeft).toBe(DAILY_PICK);
    expect(state.social.marks).toEqual([]);
    // 交情是长期账，不随日子抹掉
    expect(state.social.friendship.sister).toBe(1);
    expect(ensureSocialDay(state)).toBe(false);
  });

  it("交情每涨一档心送一枚碎片，满档封顶", () => {
    const state = openGarden();
    const fragments = state.fragments;

    addFriendship(state, "sister", 6);
    expect(heartsOf(state.social.friendship.sister ?? 0)).toBe(1);
    expect(state.fragments).toBe(fragments + 1);

    addFriendship(state, "sister", 999);
    expect(state.social.friendship.sister).toBe(30);
    expect(heartsOf(state.social.friendship.sister ?? 0)).toBe(5);
    addFriendship(state, "sister", 10);
    expect(state.social.friendship.sister).toBe(30);
  });

  it("家里有客将至时数得出来", () => {
    const state = openGarden();
    expect(pressingOrders(state)).toBe(0);

    state.orders.push({
      uid: "u1",
      templateId: "r-welcome",
      kind: "resident",
      title: "邻家阿姊要一束雏菊",
      hint: "",
      dueAt: state.now + 5_000,
      coin: 10,
      exp: 5,
      waterReward: 1,
    });

    expect(pressingOrders(state)).toBe(1);
    expect(pressingOrders(state, 1_000)).toBe(0);
  });
});

describe("静音偏好独立于花园进度", () => {
  it("默认不静音，写过之后读得回来", () => {
    expect(loadPrefs().muted).toBe(false);

    expect(setMutedPref(true)).toBe(true);
    expect(loadPrefs().muted).toBe(true);

    savePrefs({ muted: false });
    expect(loadPrefs().muted).toBe(false);
  });

  it("重整山河清掉存档，耳朵的偏好还在", () => {
    setMutedPref(true);

    clearSave();

    expect(loadPrefs().muted).toBe(true);
  });

  it("偏好格子被写坏时退回默认，不把游戏带崩", () => {
    localStorage.setItem("my-garden-world:prefs:v1", "{oops");

    expect(loadPrefs()).toEqual({ muted: false });
  });
});
