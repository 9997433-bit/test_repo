import { afterEach, describe, expect, it, vi } from "vitest";
import { ORDER_TEMPLATES, pickWeighted } from "../../src/data/orders";
import { createInitialState } from "../../src/engine/state";
import { spawnOrders } from "../../src/systems/orders";
import { scoreArrangement, scoreBreakdown } from "../../src/systems/workshop";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("weighted order draw (pickWeighted wiring)", () => {
  it("handles boundary rolls and degenerate pools", () => {
    expect(pickWeighted([], 0.5)).toBeUndefined();
    const pool = [
      { id: "a", weight: 4 },
      { id: "b", weight: 1 },
    ];
    expect(pickWeighted(pool, 0)?.id).toBe("a");
    // 0.79×5=3.95 落在 a 的权重段内；0.81×5=4.05 越过便是 b
    expect(pickWeighted(pool, 0.79)?.id).toBe("a");
    expect(pickWeighted(pool, 0.81)?.id).toBe("b");
    expect(pickWeighted(pool, 1)?.id).toBe("b");
    expect(pickWeighted([{ id: "z", weight: 0 }], 0.5)?.id).toBe("z");
  });

  it("spawnOrders draws by template weight, not by uniform index", () => {
    // 1 阶候选池：r-welcome(权4) 领衔，其余权 3。roll=0.17 时
    // 加权命中 r-welcome（0.17×22=3.74 < 4）；旧均匀抽取会落在下标 1（r-tea）。
    vi.spyOn(Math, "random").mockReturnValue(0.17);
    const state = createInitialState(0);
    spawnOrders(state);
    expect(state.orders[0]?.templateId).toBe("r-welcome");
  });

  it("weight data follows the GDD ladder: residents common, group orders rare", () => {
    for (const t of ORDER_TEMPLATES) {
      expect(t.weight).toBeGreaterThanOrEqual(1);
      if (t.kind === "group") expect(t.weight).toBe(1);
    }
    const maxResident = Math.max(...ORDER_TEMPLATES.filter((t) => t.kind === "resident").map((t) => t.weight));
    expect(maxResident).toBeGreaterThanOrEqual(3);
  });
});

describe("hue/role scoring (Round 3 深化)", () => {
  it("scores the three known divine autumn builds at exactly 92", () => {
    const divine = [
      ["star-tulip", "spider-lily", "maple", "amaranth"],
      ["star-tulip", "spider-lily", "spider-lily", "amaranth"],
      ["chrys", "osmanthus", "maple", "spider-lily"],
    ];
    for (const set of divine) {
      expect(scoreArrangement(set, "bronze", "autumn")).toBe(92);
    }
  });

  it("prefers two-hue palettes over hex-unique rainbows", () => {
    // 双色相映 12 > 三色 6：同为春季三枝，配色档位随色系数变化
    const twoHue = scoreBreakdown(["peach", "peony", "daisy"], "clay", "spring"); // 粉粉金 → 2 系
    const threeHue = scoreBreakdown(["peach", "orchid", "daisy"], "clay", "spring"); // 粉翠金 → 3 系
    expect(twoHue.palette).toBe(12);
    expect(threeHue.palette).toBe(6);
  });

  it("rewards exactly one focal stem and penalizes duplicates", () => {
    // 恰一枝主花 +4；双主花喧宾夺主记 0
    const oneFocal = scoreBreakdown(["peony", "peach"], "clay", "spring");
    const twoFocal = scoreBreakdown(["peony", "waterlily"], "clay", "spring");
    expect(oneFocal.composition).toBeGreaterThan(twoFocal.composition);
    // 同种花材第 2 枝起每枝 −4
    const dup = scoreBreakdown(["peony", "peach", "peach"], "clay", "spring");
    const uniq = scoreBreakdown(["peony", "peach", "orchid"], "clay", "spring");
    expect(dup.composition).toBe(uniq.composition - 4);
  });

  it("keeps the published totals aligned with the GDD baseline", () => {
    // 春四重奏 86（精品）；四稀有杂季 65；24 枝花海 80——曲线不再顶满
    expect(scoreArrangement(["peach", "orchid", "magnolia", "peony"], "bronze", "spring")).toBe(86);
    const legendary = ["dawn-begonia", "flame-lotus", "star-tulip", "dream-rose"];
    expect(scoreArrangement(legendary, "bronze", "spring")).toBe(65);
  });
});
