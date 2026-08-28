// 结算收口：**先** recordMatch 把这一局并进生涯累计，**再**判定解锁。
// 这里锁的就是这条次序——反过来的话，靠这一局才刚好达标的生涯掌要等到下一局
// 结束才报得出来（main.js finishMatch 的注释指向本文件）。

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import * as data from "../data/index.js";
import { STORY_TRIGGER, markSeenPatch, seenIdsOf } from "./story-flow.js";
import {
  careerMeets,
  newlyUnlocked,
  newlyUnlockedAll,
  newlyUnlockedCareer,
  progressMeets,
} from "./unlocks.js";
import { createMatchProgress } from "./unlocks.js";

const gloves = data.GLOVES;

function fakeStorage(seed) {
  const map = new Map(seed ? [["yizhang-save-v1", JSON.stringify(seed)]] : []);
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: (k) => map.delete(k),
    raw: map,
  };
}

async function freshStorageModule(seed) {
  globalThis.localStorage = fakeStorage(seed);
  vi.resetModules();
  return import("./storage.js");
}

function gloveOf(id) {
  return gloves.find((g) => g.id === id);
}

/** 差一点就达标的存档：多打一场 / 多扇一掌 / 多过一次门就到线。 */
function brinkSave() {
  return {
    version: 1,
    unlocked: ["cotton"],
    stats: {
      matches: 24,
      kills: 40,
      deaths: 30,
      wins: 9,
      bestKills: 4,
      totalSlapHits: 299,
      portalCrossings: 19,
    },
  };
}

beforeEach(() => {
  vi.resetModules();
});

afterEach(() => {
  delete globalThis.localStorage;
});

describe("careerMeets", () => {
  it("对照存档 stats 的累计字段，到线才算", () => {
    const cocoon = gloveOf("cocoon");
    expect(careerMeets(cocoon, { stats: { totalSlapHits: 299 } }, data)).toBe(false);
    expect(careerMeets(cocoon, { stats: { totalSlapHits: 300 } }, data)).toBe(true);
    expect(careerMeets(cocoon, { stats: { totalSlapHits: 4000 } }, data)).toBe(true);
  });

  it("老档缺 stats / 字段写坏一律当没达标，不抛", () => {
    const raven = gloveOf("raven");
    expect(careerMeets(raven, {}, data)).toBe(false);
    expect(careerMeets(raven, { stats: null }, data)).toBe(false);
    expect(careerMeets(raven, { stats: { portalCrossings: "20" } }, data)).toBe(false);
    expect(careerMeets(raven, { stats: { portalCrossings: NaN } }, data)).toBe(false);
    expect(careerMeets(null, { stats: { portalCrossings: 99 } }, data)).toBe(false);
  });

  it("单局挑战掌不吃生涯判定（scope 不是 career）", () => {
    expect(careerMeets(gloveOf("granite"), { stats: { totalSlapHits: 9999 } }, data)).toBe(false);
    expect(careerMeets(gloveOf("cotton"), { stats: { matches: 9999 } }, data)).toBe(false);
  });
});

describe("生涯掌不许被局内结算误报", () => {
  it("progressMeets 对 career 规格恒 false", () => {
    const monster = { ...createMatchProgress(), slapHits: 9999, kills: 99, won: true };
    for (const id of ["cocoon", "raven", "victor", "tumbler"]) {
      expect(progressMeets(gloveOf(id), monster, data), id).toBe(false);
    }
  });

  it("newlyUnlocked 只报单局挑战掌", () => {
    const monster = { ...createMatchProgress(), slapHits: 9999, kills: 99, won: true };
    const ids = newlyUnlocked(gloves, monster, { unlocked: ["cotton"] }, data).map((g) => g.id);
    expect(ids).not.toContain("cocoon");
    expect(ids).not.toContain("tumbler");
    expect(ids).toContain("granite");
  });
});

describe("newlyUnlockedCareer", () => {
  it("到线的生涯掌才报，已经拿到的不重复报", () => {
    const save = { unlocked: ["cotton"], stats: { totalSlapHits: 300, portalCrossings: 20, wins: 3, matches: 4 } };
    expect(newlyUnlockedCareer(gloves, save, data).map((g) => g.id)).toEqual(["cocoon", "raven"]);

    const owned = { ...save, unlocked: ["cotton", "cocoon"] };
    expect(newlyUnlockedCareer(gloves, owned, data).map((g) => g.id)).toEqual(["raven"]);
  });

  it("空档一只都不报", () => {
    expect(newlyUnlockedCareer(gloves, { unlocked: ["cotton"], stats: {} }, data)).toEqual([]);
  });
});

describe("newlyUnlockedAll", () => {
  it("单局与生涯两条路并成一张名单，同一只掌只报一次", () => {
    const progress = { ...createMatchProgress(), slapHits: 15 };
    const save = { unlocked: ["cotton"], stats: { totalSlapHits: 315, matches: 25 } };
    const ids = newlyUnlockedAll(gloves, progress, save, data).map((g) => g.id);
    expect(ids).toContain("granite"); // 单局 15 掌
    expect(ids).toContain("cocoon"); // 生涯 300 掌
    expect(ids).toContain("tumbler"); // 生涯 25 场
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("次序：先 recordMatch 再判定", () => {
  it("这一局把扇中数推过 300：记完再判 ⇒ 当场报出铁茧", async () => {
    const { recordMatch, loadSave } = await freshStorageModule(brinkSave());
    const progress = { ...createMatchProgress(), slapHits: 1, kills: 2 };

    recordMatch({ kills: 2, deaths: 0, won: false, slapHits: progress.slapHits });
    const after = loadSave();
    expect(after.stats.totalSlapHits).toBe(300);
    expect(newlyUnlockedAll(gloves, progress, after, data).map((g) => g.id)).toContain("cocoon");
  });

  it("次序反过来（先判定后 recordMatch）就漏报——这正是不许对调的原因", async () => {
    const { recordMatch, loadSave } = await freshStorageModule(brinkSave());
    const progress = { ...createMatchProgress(), slapHits: 1, kills: 2 };

    const before = loadSave();
    expect(newlyUnlockedAll(gloves, progress, before, data).map((g) => g.id)).not.toContain("cocoon");
    recordMatch({ kills: 2, deaths: 0, won: false, slapHits: progress.slapHits });
  });

  it("第 25 场打完当场报出不倒；第 10 胜当场报出常胜", async () => {
    const { recordMatch, loadSave } = await freshStorageModule(brinkSave());
    recordMatch({ kills: 5, deaths: 1, won: true, slapHits: 0 });
    const after = loadSave();
    expect(after.stats.matches).toBe(25);
    expect(after.stats.wins).toBe(10);
    const ids = newlyUnlockedAll(gloves, createMatchProgress(), after, data).map((g) => g.id);
    expect(ids).toContain("tumbler");
    expect(ids).toContain("victor");
  });

  it("过第 20 次门当场记数，这一局打完就报出渡鸦", async () => {
    const { recordPortalCrossing, recordMatch, loadSave } = await freshStorageModule(brinkSave());
    recordPortalCrossing();
    expect(loadSave().stats.portalCrossings).toBe(20);
    recordMatch({ kills: 0, deaths: 3, won: false, slapHits: 0 });
    const ids = newlyUnlockedAll(gloves, createMatchProgress(), loadSave(), data).map((g) => g.id);
    expect(ids).toContain("raven");
  });

  it("recordMatch 累计 totalSlapHits，且不擦掉 portalCrossings", async () => {
    const { recordMatch, recordPortalCrossing, loadSave } = await freshStorageModule(null);
    recordPortalCrossing();
    recordMatch({ kills: 1, deaths: 0, won: true, slapHits: 7 });
    recordMatch({ kills: 0, deaths: 2, won: false, slapHits: 5 });
    const stats = loadSave().stats;
    expect(stats.totalSlapHits).toBe(12);
    expect(stats.portalCrossings).toBe(1);
    expect(stats.matches).toBe(2);
    expect(stats.wins).toBe(1);
  });

  it("slapHits 缺省不加数（老调用点不传也不炸）", async () => {
    const { recordMatch, loadSave } = await freshStorageModule(null);
    recordMatch({ kills: 1, deaths: 0, won: false });
    expect(loadSave().stats.totalSlapHits).toBe(0);
  });
});

describe("story.seen 落在存档里（不改 storage.js 字段）", () => {
  it("updateSave 打 story 补丁，读回来还在，且别的字段不动", async () => {
    const { loadSave, updateSave } = await freshStorageModule({
      version: 1,
      unlocked: ["cotton", "granite"],
      stats: { matches: 2, kills: 1, deaths: 1, wins: 0, bestKills: 1 },
    });

    let save = loadSave();
    expect(seenIdsOf(save)).toEqual([]);

    save = updateSave(markSeenPatch(save, "arrive"));
    save = updateSave(markSeenPatch(save, "portal"));
    expect(seenIdsOf(save)).toEqual(["arrive", "portal"]);
    expect(save.unlocked).toEqual(["cotton", "granite"]);
    expect(save.stats.matches).toBe(2);

    // 换一场对局也不会被 recordMatch 擦掉
    const { recordMatch } = await import("./storage.js");
    const next = recordMatch({ kills: 0, deaths: 0, won: false, slapHits: 3 });
    expect(seenIdsOf(next)).toEqual(["arrive", "portal"]);
  });

  it("五拍全放过之后，存档里就是这五个 id", async () => {
    const { loadSave, updateSave } = await freshStorageModule(null);
    let save = loadSave();
    for (const id of ["arrive", "first_glove", "portal", "first_blood", "first_win"]) {
      const patch = markSeenPatch(save, id);
      save = patch ? updateSave(patch) : save;
    }
    expect(seenIdsOf(save).sort()).toEqual(data.STORY.map((b) => b.id).sort());
    expect(Object.values(STORY_TRIGGER)).toHaveLength(data.STORY.length);
  });
});
