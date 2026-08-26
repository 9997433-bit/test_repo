import { afterEach, describe, expect, it, vi } from "vitest";
import { FLOWERS } from "../../src/data/flowers";
import { ORDER_TEMPLATES } from "../../src/data/orders";
import { SPIRITS } from "../../src/data/spirits";
import { createInitialState, xpToLevel, type ActiveOrder, type GameState } from "../../src/engine/state";
import { addExp, addItem, backfillUnlocks, effectiveReputation, moodBonus } from "../../src/systems/economy";
import { cancelOrder, fulfillOrder, spawnOrders } from "../../src/systems/orders";
import { arrangementTier, scoreArrangement, scoreBreakdown } from "../../src/systems/workshop";

const SEASONS = ["spring", "summer", "autumn", "winter"] as const;

/** 花艺台只允许 2~4 枝，玩家真正能捧出的组合就是这些。 */
function craftableSets(pool: string[]): string[][] {
  const out: string[][] = [];
  const walk = (start: number, acc: string[]): void => {
    if (acc.length >= 2) out.push([...acc]);
    if (acc.length === 4) return;
    for (let i = start; i < pool.length; i += 1) {
      const id = pool[i];
      if (!id) continue;
      acc.push(id);
      walk(i + 1, acc);
      acc.pop();
    }
  };
  walk(0, []);
  return out;
}

function bestScoreAt(level: number, season: string): number {
  const pool = FLOWERS.filter((f) => f.unlockLevel <= level).map((f) => f.id);
  let best = 0;
  for (const set of craftableSets(pool)) best = Math.max(best, scoreArrangement(set, "bronze", season));
  return best;
}

function makeOrder(over: Partial<ActiveOrder> = {}): ActiveOrder {
  return {
    uid: "u-1",
    templateId: "r-welcome",
    kind: "resident",
    title: "测试订单",
    hint: "",
    dueAt: Number.MAX_SAFE_INTEGER,
    coin: 10,
    exp: 0,
    waterReward: 0,
    flowerIds: ["daisy"],
    flowerCount: 1,
    ...over,
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("arrangement quality tiers", () => {
  it("spreads craftable bouquets across tiers instead of saturating at 100", () => {
    const tally = { 凡品: 0, 雅品: 0, 精品: 0, 神品: 0 } as Record<string, number>;
    let total = 0;
    let max = 0;

    for (const set of craftableSets(FLOWERS.map((f) => f.id))) {
      for (const season of SEASONS) {
        // 青铜是加成最高的花瓶：对「评分易满」而言这是最坏情况
        const score = scoreArrangement(set, "bronze", season);
        tally[arrangementTier(score).name] = (tally[arrangementTier(score).name] ?? 0) + 1;
        total += 1;
        max = Math.max(max, score);
      }
    }

    // Round 1 的旧公式里任意 4 枝中等花材就能顶到 100；现在满分只属于超出瓶口的花海
    expect(max).toBeLessThan(100);
    expect(max).toBeGreaterThanOrEqual(92);
    expect((tally.神品 ?? 0) / total).toBeLessThan(0.01);
    expect((tally.凡品 ?? 0) / total).toBeGreaterThan(0.05);
    expect(tally.雅品 ?? 0).toBeGreaterThan(tally.精品 ?? 0);
  });

  it("keeps every custom order's requireScore reachable near its minLevel", () => {
    for (const t of ORDER_TEMPLATES) {
      if (!t.requireScore) continue;
      // 允许比 minLevel 多 1 阶的宽限：季节轮转与花种解锁本就存在错位
      const best = Math.max(...SEASONS.map((s) => bestScoreAt(t.minLevel + 1, s)));
      expect(best).toBeGreaterThanOrEqual(t.requireScore);
    }
  });

  it("ranks seasonal harmony above raw rarity", () => {
    const legendaryMixed = FLOWERS.filter((f) => f.rarity === 5).map((f) => f.id);
    const springQuad = ["peach", "orchid", "magnolia", "peony"];

    expect(legendaryMixed).toHaveLength(4);
    expect(scoreArrangement(springQuad, "bronze", "spring")).toBeGreaterThan(
      scoreArrangement(legendaryMixed, "bronze", "spring"),
    );
    expect(arrangementTier(scoreArrangement(springQuad, "bronze", "spring")).id).toBe("divine");
  });

  it("keeps the breakdown consistent with the published score", () => {
    const parts = scoreBreakdown(["peach", "orchid", "magnolia", "peony"], "bronze", "spring");
    const sum = parts.rarity + parts.palette + parts.season + parts.harmony + parts.fullness + parts.vase;

    expect(parts.total).toBe(scoreArrangement(["peach", "orchid", "magnolia", "peony"], "bronze", "spring"));
    // total 只比分项之和多一个固定底分，不存在藏在别处的隐形加成
    expect(parts.total - Math.round(sum)).toBeGreaterThanOrEqual(0);
    expect(parts.total - Math.round(sum)).toBeLessThanOrEqual(8);
    expect(scoreBreakdown(["daisy"], "clay", "spring").total).toBe(0);
    expect(scoreBreakdown(["daisy", "not-a-flower"], "clay", "spring")).toMatchObject({ total: 0, rarity: 0 });
  });
});

describe("spirit reputation wiring", () => {
  function withSpirit(id: string): GameState {
    const state = createInitialState(0);
    state.unlockedSpirits = SPIRITS.map((s) => s.id);
    state.activeSpirit = id;
    return state;
  }

  it("folds the active spirit's reputationBonus into moodBonus", () => {
    const plain = createInitialState(0);
    const suideng = SPIRITS.find((s) => s.id === "suideng");
    expect(suideng?.reputationBonus).toBe(8);

    expect(moodBonus(plain)).toBeCloseTo(1, 6);
    expect(effectiveReputation(withSpirit("suideng"))).toBe(78);
    expect(moodBonus(withSpirit("suideng"))).toBeCloseTo(1 + 8 / 400, 6);
    // 菊月是纯加速灵，不该凭空涨口碑
    expect(moodBonus(withSpirit("juyue"))).toBeCloseTo(1, 6);
  });

  it("ignores a spirit that has not awakened and never exceeds the 100 cap", () => {
    const unearned = createInitialState(0);
    unearned.activeSpirit = "suideng";
    unearned.unlockedSpirits = [];
    expect(effectiveReputation(unearned)).toBe(70);
    expect(moodBonus(unearned)).toBeCloseTo(1, 6);

    const famous = withSpirit("suideng");
    famous.reputation = 100;
    expect(effectiveReputation(famous)).toBe(100);
  });

  it("pays the spirit bonus out through freshly spawned order rewards", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    const plain = createInitialState(0);
    plain.reputation = 100;
    spawnOrders(plain);

    const blessed = createInitialState(0);
    blessed.reputation = 96;
    blessed.unlockedSpirits = ["suideng"];
    blessed.activeSpirit = "suideng";
    spawnOrders(blessed);

    const first = plain.orders[0];
    const second = blessed.orders[0];
    expect(first?.templateId).toBe(second?.templateId);
    // 96 口碑 + 岁灯 8 会被压回 100 上限，与纯 100 口碑同酬
    expect(second?.coin).toBe(first?.coin);

    const modest = createInitialState(0);
    modest.reputation = 70;
    spawnOrders(modest);
    expect((second?.coin ?? 0) > (modest.orders[0]?.coin ?? 0)).toBe(true);
  });
});

describe("order spawning", () => {
  it("fills the board without repeating a template", () => {
    let seed = 7;
    vi.spyOn(Math, "random").mockImplementation(() => {
      seed = (seed * 48271) % 0x7fffffff;
      return seed / 0x7fffffff;
    });
    const state = createInitialState(0);
    state.level = 12;

    spawnOrders(state);

    const ids = state.orders.map((o) => o.templateId);
    expect(ids).toHaveLength(5);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("does not re-post the template that was just delivered", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    const state = createInitialState(0);
    addItem(state, "daisy", 1);
    state.orders = [makeOrder({ templateId: "r-welcome" })];

    expect(fulfillOrder(state, "u-1")).toBe(true);
    expect(state.orders).toHaveLength(3);
    expect(state.orders.map((o) => o.templateId)).not.toContain("r-welcome");
  });

  it("does not re-post the template that just expired", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    const state = createInitialState(0);
    state.orders = [makeOrder({ templateId: "r-welcome" })];

    cancelOrder(state, "u-1", true);

    expect(state.orders).toHaveLength(3);
    expect(state.orders.map((o) => o.templateId)).not.toContain("r-welcome");
    expect(new Set(state.orders.map((o) => o.templateId)).size).toBe(3);
  });

  it("tops up a partially filled board without colliding with what is already posted", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.999999);
    const state = createInitialState(0);
    state.level = 12;
    const seeded = ORDER_TEMPLATES.filter((t) => t.minLevel <= state.level).slice(0, 4);
    state.orders = seeded.map((t, i) => makeOrder({ uid: `u-${i}`, templateId: t.id }));

    spawnOrders(state);

    expect(state.orders).toHaveLength(5);
    expect(new Set(state.orders.map((o) => o.templateId)).size).toBe(5);
  });
});

describe("unlock backfill", () => {
  it("grants every level-eligible flower on level up, not just the exact tier", () => {
    const state = createInitialState(0);
    state.level = 6;
    state.unlockedFlowers = ["daisy"];

    addExp(state, xpToLevel(6));

    expect(state.level).toBe(7);
    const eligible = FLOWERS.filter((f) => f.unlockLevel <= 7).map((f) => f.id);
    expect(state.unlockedFlowers).toEqual(expect.arrayContaining(eligible));
    // 旧写法 `unlockLevel === level` 只会补上 7 阶的睡莲，落下 6 阶及以前的花种
    expect(state.unlockedFlowers).toContain("peony");
    expect(state.unlockedFlowers).toContain("waterlily");
    expect(new Set(state.unlockedFlowers).size).toBe(state.unlockedFlowers.length);
  });

  it("is idempotent and never grants flowers above the current level", () => {
    const state = createInitialState(0);
    state.level = 5;
    state.unlockedFlowers = [];

    const gained = backfillUnlocks(state);

    expect(gained).toEqual(FLOWERS.filter((f) => f.unlockLevel <= 5).map((f) => f.id));
    expect(backfillUnlocks(state)).toEqual([]);
    expect(state.unlockedFlowers).not.toContain("spider-lily");
  });
});
