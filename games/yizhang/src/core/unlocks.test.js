import { describe, expect, it } from "vitest";

import * as data from "../data/index.js";
import { GLOVES as FALLBACK_GLOVES } from "./fallback/data.js";
import { createUnlockChecker, newlyUnlocked, unlockTextOf } from "./unlocks.js";
import { createProgressTracker } from "./progress.js";
import { SELF_ID } from "./view.js";

const gloves = data.GLOVES;

describe("createUnlockChecker", () => {
  it("data 没导出 isGloveUnlocked 时用 core 的等价实现", () => {
    const check = createUnlockChecker(data, { gloves });
    expect(["data", "core"]).toContain(check.source);
    expect(check("cotton", {})).toBe(true);
    expect(check("granite", {})).toBe(false);
    expect(check("granite", { unlocked: ["cotton", "granite"] })).toBe(true);
  });

  it("data 一旦导出同名函数就以它为准", () => {
    const stub = { isGloveUnlocked: (id) => id === "meteor" };
    const check = createUnlockChecker(stub, { gloves });
    expect(check.source).toBe("data");
    expect(check("meteor", {})).toBe(true);
    expect(check("cotton", {})).toBe(false);
  });

  it("data 的实现抛错时退回本地判定，不把菜单打崩", () => {
    const boom = {
      isGloveUnlocked() {
        throw new Error("boom");
      },
    };
    const check = createUnlockChecker(boom, { gloves });
    expect(check("cotton", {})).toBe(true);
  });

  it("兜底掌表的 { type:'default' } 也算默认携带", () => {
    const check = createUnlockChecker(null, { gloves: FALLBACK_GLOVES });
    expect(check("cotton", {})).toBe(true);
    expect(check("meteor", {})).toBe(false);
  });
});

describe("unlockTextOf", () => {
  it("默认掌说初始携带，挑战掌说挑战文案", () => {
    const cotton = gloves.find((g) => g.id === "cotton");
    const granite = gloves.find((g) => g.id === "granite");
    expect(unlockTextOf(cotton, data)).toBe("初始携带");
    expect(unlockTextOf(granite, data)).toBe("单局内命中 15 次扇击");
  });
});

describe("newlyUnlocked", () => {
  it("按 data/unlocks.js 的 event + count 判定", () => {
    const progress = { slapHits: 15, kills: 0, deaths: 0, awakens: 0, dashes: 0, won: false };
    const fresh = newlyUnlocked(gloves, progress, { unlocked: ["cotton"] }, data);
    expect(fresh.map((g) => g.id)).toEqual(["granite"]);
  });

  it("零坠落胜利解锁冰霜，带坠落则不解锁", () => {
    const base = { slapHits: 0, kills: 3, deaths: 0, awakens: 0, dashes: 0, won: true };
    expect(newlyUnlocked(gloves, base, { unlocked: ["cotton"] }, data).map((g) => g.id)).toContain("frost");
    const died = { ...base, deaths: 2 };
    expect(newlyUnlocked(gloves, died, { unlocked: ["cotton"] }, data).map((g) => g.id)).not.toContain("frost");
  });

  it("已经解锁的不再重复上报", () => {
    const progress = { slapHits: 99, kills: 0, deaths: 0, awakens: 0, dashes: 0, won: false };
    const fresh = newlyUnlocked(gloves, progress, { unlocked: ["cotton", "granite"] }, data);
    expect(fresh.map((g) => g.id)).not.toContain("granite");
  });
});

describe("createProgressTracker", () => {
  const view = {
    t: 10,
    arenaRadius: 20,
    players: [
      { id: SELF_ID, x: 0, z: 0, yaw: 0 },
      { id: "b0", x: 0, z: -2, yaw: 0 }, // yaw=0 面向 -Z，即背对台心的我
    ],
  };

  it("统计扇中、觉醒、冲刺", () => {
    const t = createProgressTracker({ selfId: SELF_ID });
    t.feed(
      [
        { type: "hit", playerId: SELF_ID, targetId: "b0" },
        { type: "hit", playerId: SELF_ID, targetId: "b0" },
        { type: "awaken", playerId: SELF_ID },
        { type: "dash", playerId: SELF_ID },
        { type: "hit", playerId: "b0", targetId: SELF_ID },
      ],
      view
    );
    expect(t.progress.slapHits).toBe(2);
    expect(t.progress.awakens).toBe(1);
    expect(t.progress.dashes).toBe(1);
  });

  it("背身击杀：命中时对手背对我才算", () => {
    const t = createProgressTracker({ selfId: SELF_ID });
    t.feed([{ type: "hit", playerId: SELF_ID, targetId: "b0" }], view);
    t.feed([{ type: "ko", killerId: SELF_ID, victimId: "b0", x: 19, z: 0 }], view);
    expect(t.progress.kills).toBe(1);
    expect(t.progress.behindKills).toBe(1);
    expect(t.progress.rimKills).toBe(1);
  });

  it("冲刺 2 秒内的击杀记进 dashKills", () => {
    const t = createProgressTracker({ selfId: SELF_ID });
    t.feed([{ type: "dash", playerId: SELF_ID }], { ...view, t: 10 });
    t.feed([{ type: "ko", killerId: SELF_ID, victimId: "b0" }], { ...view, t: 11.2 });
    expect(t.progress.dashKills).toBe(1);

    const late = createProgressTracker({ selfId: SELF_ID });
    late.feed([{ type: "dash", playerId: SELF_ID }], { ...view, t: 10 });
    late.feed([{ type: "ko", killerId: SELF_ID, victimId: "b0" }], { ...view, t: 20 });
    expect(late.progress.dashKills).toBe(0);
  });

  it("自己掉下去只记 deaths", () => {
    const t = createProgressTracker({ selfId: SELF_ID });
    t.feed([{ type: "ko", victimId: SELF_ID, killerId: "b0" }], view);
    expect(t.progress.deaths).toBe(1);
    expect(t.progress.kills).toBe(0);
  });
});
