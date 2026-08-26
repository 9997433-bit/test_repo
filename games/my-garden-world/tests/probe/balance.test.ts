import { describe, expect, it } from "vitest";
import { FLOWERS } from "../../src/data/flowers";
import { ORDER_TEMPLATES } from "../../src/data/orders";
import { scoreArrangement } from "../../src/systems/workshop";

describe("balance probe", () => {
  it("no seed costs more than 1.2x expected harvest", () => {
    for (const f of FLOWERS) {
      expect(f.seedCost).toBeLessThan(f.harvestCoin * 1.2);
      expect(f.growMs).toBeGreaterThan(5_000);
    }
  });

  it("orders always pay positive rewards", () => {
    for (const o of ORDER_TEMPLATES) {
      expect(o.coin).toBeGreaterThan(0);
      expect(o.timeMs).toBeGreaterThan(10_000);
    }
  });
});

// ---------------------------------------------------------------------------
// Round 3 评分基线：允许同种多枝（multiset）、任选季节、青铜瓶（花器加成最高）。
// GDD 接线清单的验证基准：各评分档首达等级 60→1 / 70→2 / 85→4 / 92→8，上限恒 92。
// ---------------------------------------------------------------------------

const SEASONS = ["spring", "summer", "autumn", "winter"] as const;

/** 2~4 枝、允许重复取同种花材的全组合。 */
function multisets(pool: string[]): string[][] {
  const out: string[][] = [];
  const walk = (start: number, acc: string[]): void => {
    if (acc.length >= 2) out.push([...acc]);
    if (acc.length === 4) return;
    for (let i = start; i < pool.length; i += 1) {
      const id = pool[i];
      if (!id) continue;
      acc.push(id);
      walk(i, acc);
      acc.pop();
    }
  };
  walk(0, []);
  return out;
}

function bestAtLevel(level: number): number {
  const pool = FLOWERS.filter((f) => f.unlockLevel <= level).map((f) => f.id);
  let best = 0;
  for (const set of multisets(pool)) {
    for (const season of SEASONS) {
      best = Math.max(best, scoreArrangement(set, "bronze", season));
    }
  }
  return best;
}

describe("arrangement score curve probe (Round 3)", () => {
  it("reaches each custom-order threshold exactly on the GDD ladder", () => {
    const first: Record<number, number> = { 60: 1, 70: 2, 85: 4, 92: 8 };
    const bests = new Map<number, number>();
    for (let lv = 1; lv <= 8; lv += 1) bests.set(lv, bestAtLevel(lv));
    for (const [thresholdKey, level] of Object.entries(first)) {
      const threshold = Number(thresholdKey);
      expect(bests.get(level)!).toBeGreaterThanOrEqual(threshold);
      if (level > 1) expect(bests.get(level - 1)!).toBeLessThan(threshold);
    }
  });

  it("caps the whole curve at 92 even with duplicate stems", () => {
    const ceiling = Math.max(...FLOWERS.map((f) => f.unlockLevel));
    expect(bestAtLevel(ceiling)).toBe(92);
  });
});
