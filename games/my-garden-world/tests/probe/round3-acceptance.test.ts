import { describe, expect, it, vi } from "vitest";
import { FLOWERS, type FlowerDef, type Season } from "../../src/data/flowers";
import { ORDER_TEMPLATES } from "../../src/data/orders";
import { createInitialState } from "../../src/engine/state";
import { spawnOrders } from "../../src/systems/orders";
import { VASES, arrangementTier, scoreArrangement } from "../../src/systems/workshop";

const SEASONS: Season[] = ["spring", "summer", "autumn", "winter"];
const STEM_COUNTS = [2, 3, 4];

function* combinations(
  pool: FlowerDef[],
  count: number,
  allowRepeats: boolean,
  start = 0,
  prefix: FlowerDef[] = [],
): Generator<FlowerDef[]> {
  if (prefix.length === count) {
    yield prefix;
    return;
  }

  for (let index = start; index < pool.length; index += 1) {
    yield* combinations(
      pool,
      count,
      allowRepeats,
      allowRepeats ? index : index + 1,
      [...prefix, pool[index]!],
    );
  }
}

function arrangementScore(flowers: FlowerDef[], vase: string, season: Season): number {
  return scoreArrangement(
    flowers.map((flower) => flower.id),
    vase,
    season,
  );
}

function bestScore(
  pool: FlowerDef[],
  allowRepeats: boolean,
  vaseIds: string[] = VASES.map((vase) => vase.id),
): number {
  let best = 0;
  for (const stemCount of STEM_COUNTS) {
    for (const flowers of combinations(pool, stemCount, allowRepeats)) {
      for (const season of SEASONS) {
        for (const vaseId of vaseIds) {
          best = Math.max(best, arrangementScore(flowers, vaseId, season));
        }
      }
    }
  }
  return best;
}

describe("Round 3 order-weight acceptance probe", () => {
  it("uses template weights when the live order board is filled", () => {
    let randomCall = 0;
    const random = vi.spyOn(Math, "random").mockImplementation(() => {
      const isTemplatePick = randomCall % 2 === 0;
      randomCall += 1;
      return isTemplatePick ? 0.8 : 0.123;
    });

    try {
      const state = createInitialState(0);
      state.level = 1;

      spawnOrders(state);

      expect(state.orders.map((order) => order.templateId)).toEqual([
        "r-inn",
        "r-yingchun",
        "r-morning",
      ]);
    } finally {
      random.mockRestore();
    }
  });
});

describe("Round 3 arrangement-score acceptance probes", () => {
  it("caps the complete repeatable 2-4 stem matrix at the three canonical 92-point recipes", () => {
    let maximum = -Infinity;
    let winners: string[] = [];

    for (const stemCount of STEM_COUNTS) {
      for (const flowers of combinations(FLOWERS, stemCount, true)) {
        for (const season of SEASONS) {
          for (const vase of VASES) {
            const score = arrangementScore(flowers, vase.id, season);
            const signature = `${season}|${vase.id}|${flowers
              .map((flower) => flower.id)
              .join("+")}`;
            if (score > maximum) {
              maximum = score;
              winners = [signature];
            } else if (score === maximum) {
              winners.push(signature);
            }
          }
        }
      }
    }

    expect(maximum).toBe(92);
    expect(winners).toEqual([
      "autumn|bronze|amaranth+maple+spider-lily+star-tulip",
      "autumn|bronze|amaranth+spider-lily+spider-lily+star-tulip",
      "autumn|bronze|chrys+osmanthus+maple+spider-lily",
    ]);
  });

  it("keeps the unique-stem bronze distribution on the accepted rarity curve", () => {
    const counts = { common: 0, elegant: 0, fine: 0, divine: 0 };

    for (const stemCount of STEM_COUNTS) {
      for (const flowers of combinations(FLOWERS, stemCount, false)) {
        for (const season of SEASONS) {
          const tier = arrangementTier(arrangementScore(flowers, "bronze", season));
          counts[tier.id] += 1;
        }
      }
    }

    expect(counts).toEqual({
      common: 27_391,
      elegant: 22_962,
      fine: 1_349,
      divine: 2,
    });
  });

  it("reaches each score milestone at the accepted earliest level", () => {
    const targets = [60, 70, 85, 92] as const;
    const earliest = new Map<number, number>();

    for (let level = 1; level <= 15; level += 1) {
      const unlocked = FLOWERS.filter((flower) => flower.unlockLevel <= level);
      const best = bestScore(unlocked, true);
      for (const target of targets) {
        if (best >= target && !earliest.has(target)) earliest.set(target, level);
      }
    }

    expect(Object.fromEntries(earliest)).toEqual({
      60: 1,
      70: 2,
      85: 4,
      92: 8,
    });
  });

  it("keeps every custom order attainable by one level after it appears", () => {
    const bestByOrder = Object.fromEntries(
      ORDER_TEMPLATES.filter((order) => order.kind === "custom").map((order) => {
        const unlocked = FLOWERS.filter(
          (flower) => flower.unlockLevel <= order.minLevel + 1,
        );
        return [order.id, bestScore(unlocked, false, ["bronze"])];
      }),
    );

    expect(bestByOrder).toEqual({
      "c-teahouse": 73,
      "c-spring": 75,
      "c-gallery": 86,
      "c-ink": 86,
      "c-master": 92,
    });
  });
});
