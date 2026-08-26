import { describe, expect, it } from "vitest";
import { FLOWER_MAP } from "../../src/data/flowers";
import { NEIGHBORS, NEIGHBOR_MAP } from "../../src/data/neighbors";
import { createInitialState, type GameState } from "../../src/engine/state";
import { DAY_MS, gameDay } from "../../src/engine/time";
import {
  HEART_STEP,
  MAX_FRIENDSHIP,
  PICKS_PER_DAY,
  WATER_PER_NEIGHBOR,
  hearts,
  neighborGarden,
  neighborRoster,
  pickLeftFor,
  rollSocialDay,
  visitPick,
  visitWater,
  waterLeftFor,
} from "../../src/systems/neighbors";

function ready(level = 10): GameState {
  const s = createInitialState(0);
  s.level = level;
  s.tutorialDone = true;
  return s;
}

const thirstyIdx = (s: GameState, n: string): number =>
  neighborGarden(s, n).plots.findIndex((p) => (p.stage === "sprout" || p.stage === "bud") && p.watered < p.waterNeed);
const bloomIdx = (s: GameState, n: string, skip: number[] = []): number =>
  neighborGarden(s, n).plots.findIndex((p) => p.stage === "bloom" && !skip.includes(p.idx));

describe("neighbor data", () => {
  it("has three acquaintances at levels 1/3/5 with sane gardens", () => {
    expect(NEIGHBORS.map((n) => n.unlockLevel)).toEqual([1, 3, 5]);
    for (const n of NEIGHBORS) {
      expect(n.plotCount).toBeGreaterThanOrEqual(4);
      expect(n.plotCount).toBeLessThanOrEqual(8);
      expect(n.greetings.length).toBeGreaterThanOrEqual(3);
      for (const f of n.favorites) expect(FLOWER_MAP[f]).toBeDefined();
    }
  });
});

describe("neighbor garden generation", () => {
  it("is deterministic per neighbor per game day, and changes across days", () => {
    const s = ready();
    s.now = 5 * DAY_MS + 12_345;
    const a = neighborGarden(s, "a-zi");
    const b = neighborGarden(s, "a-zi");
    expect(a).toEqual(b);
    expect(a.day).toBe(gameDay(s));

    const daysDiffer = Array.from({ length: 6 }, (_, d) => {
      const t = ready();
      t.now = d * DAY_MS + 10;
      return JSON.stringify(neighborGarden(t, "a-zi").plots);
    });
    expect(new Set(daysDiffer).size).toBeGreaterThan(1);
  });

  it("always guarantees ≥2 flowered, ≥1 bloom, ≥1 thirsty plot (串门必有事可做)", () => {
    for (let day = 0; day < 40; day++) {
      for (const n of NEIGHBORS) {
        const s = ready();
        s.now = day * DAY_MS + 1;
        const g = neighborGarden(s, n.id);
        expect(g.plots).toHaveLength(n.plotCount);
        const flowered = g.plots.filter((p) => p.flowerId);
        expect(flowered.length).toBeGreaterThanOrEqual(2);
        expect(flowered.some((p) => p.stage === "bloom")).toBe(true);
        expect(
          g.plots.some((p) => (p.stage === "sprout" || p.stage === "bud") && p.watered < p.waterNeed),
        ).toBe(true);
        for (const p of flowered) expect(n.favorites).toContain(p.flowerId!);
      }
    }
  });
});

describe("visitWater", () => {
  it("fills the plot for free, grants friendship and exp, capped per neighbor per day", () => {
    const s = ready();
    const waterBefore = s.water;
    const expBefore = s.exp;
    let watered = 0;
    for (const p of neighborGarden(s, "a-zi").plots) {
      if (visitWater(s, "a-zi", p.idx)) watered += 1;
    }
    expect(watered).toBeGreaterThanOrEqual(1);
    expect(watered).toBeLessThanOrEqual(WATER_PER_NEIGHBOR);
    expect(s.water).toBe(waterBefore); // 不耗自家水缸
    expect(s.exp).toBe(expBefore + watered * 2);
    expect(s.social.friendship["a-zi"]).toBe(watered);
    expect(waterLeftFor(s, "a-zi")).toBe(WATER_PER_NEIGHBOR - watered);

    // 同一圃不能重复浇；已浇痕迹当日保留
    const first = s.social.marks.find((m) => m.k === "water")!;
    expect(visitWater(s, "a-zi", first.p)).toBe(false);
  });

  it("rejects watering for locked neighbors and refuses a sated plot", () => {
    const s = ready(1); // 东篱客 5 阶才结识
    expect(visitWater(s, "east-hermit", 0)).toBe(false);
    const idx = neighborGarden(s, "a-zi").plots.findIndex((p) => p.stage === "bloom");
    expect(visitWater(s, "a-zi", idx)).toBe(false);
  });

  it("awards a fragment each time a friendship heart fills", () => {
    const s = ready();
    const frags = s.fragments;
    s.social.friendship["a-zi"] = HEART_STEP - 1;
    const idx = thirstyIdx(s, "a-zi");
    expect(visitWater(s, "a-zi", idx)).toBe(true);
    expect(s.social.friendship["a-zi"]).toBe(HEART_STEP);
    expect(s.fragments).toBe(frags + 1);
    expect(hearts(MAX_FRIENDSHIP)).toBe(5);
  });
});

describe("visitPick", () => {
  it("only picks blooming plots, adds to inventory, one per neighbor and two per day", () => {
    const s = ready();
    const growing = thirstyIdx(s, "a-zi");
    expect(visitPick(s, "a-zi", growing)).toBeNull(); // 花未开摘不得

    const b1 = bloomIdx(s, "a-zi");
    const got = visitPick(s, "a-zi", b1);
    expect(got).not.toBeNull();
    expect(s.inventory[got!]).toBe(1);
    expect(pickLeftFor(s, "a-zi")).toBe(0);

    // 同邻居第二枝被拒（含同圃重复）
    const b2 = bloomIdx(s, "a-zi", [b1]);
    if (b2 >= 0) expect(visitPick(s, "a-zi", b2)).toBeNull();
    expect(visitPick(s, "a-zi", b1)).toBeNull();

    // 换一家可借第二枝；全局第三枝被拒
    const t1 = bloomIdx(s, "tea-keeper");
    expect(visitPick(s, "tea-keeper", t1)).not.toBeNull();
    const e1 = bloomIdx(s, "east-hermit");
    expect(visitPick(s, "east-hermit", e1)).toBeNull();
    expect(s.social.marks.filter((m) => m.k === "pick")).toHaveLength(PICKS_PER_DAY);
  });
});

describe("day rollover", () => {
  it("clears marks and restores quotas at the next game day, friendship persists", () => {
    const s = ready();
    visitWater(s, "a-zi", thirstyIdx(s, "a-zi"));
    visitPick(s, "a-zi", bloomIdx(s, "a-zi"));
    expect(s.social.marks.length).toBe(2);
    const friendship = s.social.friendship["a-zi"];

    s.now += DAY_MS; // 翌日
    rollSocialDay(s);
    expect(s.social.day).toBe(gameDay(s));
    expect(s.social.marks).toHaveLength(0);
    expect(waterLeftFor(s, "a-zi")).toBe(WATER_PER_NEIGHBOR);
    expect(pickLeftFor(s, "a-zi")).toBe(1);
    expect(s.social.friendship["a-zi"]).toBe(friendship);
  });

  it("neighborRoster reports lock state and today's allowance", () => {
    const s = ready(3);
    const roster = neighborRoster(s);
    expect(roster.map((r) => r.unlocked)).toEqual([true, true, false]);
    expect(roster[0]!.waterLeft).toBe(WATER_PER_NEIGHBOR);
    expect(roster[0]!.def).toBe(NEIGHBOR_MAP["a-zi"]);
  });
});
