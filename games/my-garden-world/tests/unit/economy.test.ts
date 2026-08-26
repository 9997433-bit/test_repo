import { describe, expect, it } from "vitest";
import { createInitialState } from "../../src/engine/state";
import { addCoins, addExp, moodBonus, spendCoins, takeItem, addItem } from "../../src/systems/economy";
import { scoreArrangement, scoreTier } from "../../src/systems/workshop";
import { plant, harvest } from "../../src/systems/planting";

describe("economy", () => {
  it("spends coins only when affordable", () => {
    const s = createInitialState();
    s.coins = 10;
    expect(spendCoins(s, 12)).toBe(false);
    expect(spendCoins(s, 8)).toBe(true);
    expect(s.coins).toBe(2);
  });

  it("levels up when exp overflows", () => {
    const s = createInitialState();
    addExp(s, 999);
    expect(s.level).toBeGreaterThan(1);
  });

  it("inventory add/take is balanced", () => {
    const s = createInitialState();
    addItem(s, "daisy", 2);
    expect(takeItem(s, "daisy", 3)).toBe(false);
    expect(takeItem(s, "daisy", 2)).toBe(true);
    expect(s.inventory.daisy).toBeUndefined();
  });
});

describe("workshop score", () => {
  it("rewards seasonal harmony", () => {
    const low = scoreArrangement(["daisy"], "clay", "spring");
    const mid = scoreArrangement(["daisy", "peach"], "clay", "spring");
    const high = scoreArrangement(["daisy", "peach", "orchid"], "bronze", "spring");
    expect(low).toBe(0);
    expect(high).toBeGreaterThan(mid);
    expect(high).toBeLessThanOrEqual(100);
  });

  it("no longer saturates: a starter duo stays modest, only top sets peak", () => {
    // 旧公式基数 28 + 稀有度总和×6，四枝稀有花必 100；新公式给分层留出空间
    expect(scoreArrangement(["daisy", "peach"], "clay", "spring")).toBeLessThan(50);
    // 秋季顶配四色 + 青铜：够到宗师单（≥92）但不满分
    const autumnBest = scoreArrangement(["star-tulip", "spider-lily", "maple", "osmanthus"], "bronze", "autumn");
    expect(autumnBest).toBeGreaterThanOrEqual(92);
    expect(autumnBest).toBeLessThan(100);
    // 冬雪顶配是唯一满分套
    expect(scoreArrangement(["dream-rose", "snow-lotus", "plum", "camellia"], "bronze", "winter")).toBe(100);
  });

  it("the level-8 master order (≥92) is reachable with level-8 flowers in season", () => {
    const set = ["spider-lily", "maple", "osmanthus", "chrys"]; // 全部 8 阶前可得
    expect(scoreArrangement(set, "bronze", "autumn")).toBeGreaterThanOrEqual(92);
  });

  it("illegal sizes (>4 stems) score zero", () => {
    expect(scoreArrangement(["daisy", "peach", "orchid", "jasmine", "chrys"], "bronze", "spring")).toBe(0);
  });

  it("scoreTier maps bands to Chinese tier names", () => {
    expect(scoreTier(0).name).toBe("凡品");
    expect(scoreTier(49).name).toBe("凡品");
    expect(scoreTier(50).name).toBe("良品");
    expect(scoreTier(70).name).toBe("佳品");
    expect(scoreTier(85).name).toBe("精品");
    expect(scoreTier(95).name).toBe("神品");
    expect(scoreTier(100).name).toBe("神品");
  });
});

describe("moodBonus", () => {
  it("applies the resident spirit's reputation bonus, capped at 100", () => {
    const s = createInitialState();
    s.reputation = 70;
    const base = moodBonus(s);
    s.activeSpirit = "suideng"; // 口碑 +8
    expect(moodBonus(s)).toBeCloseTo(base + 8 / 400, 6);
    s.reputation = 100; // 已满：花灵不再溢出
    expect(moodBonus(s)).toBeCloseTo(1 + 30 / 400, 6);
  });
});

describe("planting", () => {
  it("rejects planting on occupied soil", () => {
    const s = createInitialState();
    addCoins(s, 200);
    expect(plant(s, 0, "daisy")).toBe(true);
    expect(plant(s, 0, "daisy")).toBe(false);
  });

  it("cannot harvest empty plot", () => {
    const s = createInitialState();
    expect(harvest(s, 0)).toBe(false);
  });
});
