import { describe, expect, it } from "vitest";
import { FLOWERS } from "../../src/data/flowers";
import { ORDER_TEMPLATES } from "../../src/data/orders";

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
