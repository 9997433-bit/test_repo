import { describe, expect, it } from "vitest";
import { createInitialState } from "../src/core/engine.js";
import { addInv, spendInv } from "../src/core/store.js";
import { seasonFactor } from "../src/systems/farm/index.js";
import { canCraft, enqueueJob } from "../src/systems/production/index.js";
import { deliverWish, stallSell } from "../src/systems/village/index.js";

const expectNonNegativeInventory = (state) => {
  expect(Object.values(state.inv).every((quantity) => quantity >= 0)).toBe(true);
};

describe("economy invariants", () => {
  it("never leaves zero or negative quantities in inventory", () => {
    const initial = {
      ...createInitialState(),
      inv: { rice: 2, paddy: 1 },
    };

    const exactSpend = spendInv(initial, { rice: 2 });
    expect(exactSpend.ok).toBe(true);
    expect(exactSpend.state.inv.rice).toBeUndefined();
    expectNonNegativeInventory(exactSpend.state);

    const overdraw = spendInv(initial, { rice: 3 });
    expect(overdraw).toEqual({ ok: false, reason: "材料不够", state: initial });
    expectNonNegativeInventory(overdraw.state);

    const directDecrease = addInv(initial, "paddy", -5);
    expect(directDecrease.inv.paddy).toBeUndefined();
    expectNonNegativeInventory(directDecrease);
  });

  it("spends multi-item requirements atomically", () => {
    const initial = {
      ...createInitialState(),
      inv: { rice: 2 },
    };

    const result = spendInv(initial, { rice: 1, corn: 1 });

    expect(result.ok).toBe(false);
    expect(result.state).toBe(initial);
    expect(result.state.inv.rice).toBe(2);
    expectNonNegativeInventory(result.state);
  });

  it("cannot craft or enqueue a recipe without its inputs", () => {
    const initial = createInitialState();
    const mill = {
      ...initial,
      meta: { ...initial.meta, level: 2 },
      buildings: { ...initial.buildings, mill: { built: true, slotCount: 2 } },
    };

    expect(canCraft(mill, "mill_rice")).toBe(false);

    const queued = enqueueJob(mill, {
      buildingId: "mill",
      recipeId: "mill_rice",
    });
    expect(queued).toEqual({ ok: false, reason: "原料不够", state: mill });
    expect(queued.state.jobs).toHaveLength(0);
    expectNonNegativeInventory(queued.state);
  });

  it("cannot deliver a wish without all requested items", () => {
    const initial = createInitialState();
    const wish = {
      id: "w_combo",
      wishId: "w_combo_test",
      name: "一桌家常",
      needs: { rice: 1, tofu: 1, egg: 1 },
      coin: 90,
      xp: 36,
      status: "open",
    };
    const missingItems = {
      ...initial,
      inv: { rice: 1, tofu: 1 },
      wishes: [wish],
    };

    const delivered = deliverWish(missingItems, { wishId: wish.wishId });

    expect(delivered).toEqual({
      ok: false,
      reason: "东西还没收齐",
      state: missingItems,
    });
    expect(delivered.state.resources.coin).toBe(initial.resources.coin);
    expect(delivered.state.meta.xp).toBe(initial.meta.xp);
    expect(delivered.state.wishes).toEqual([wish]);
    expectNonNegativeInventory(delivered.state);
  });

  it("uses an exact 0.55 growth factor outside a crop's seasons", () => {
    const rice = { seasons: ["spring", "summer"] };

    expect(seasonFactor(rice, "autumn")).toBe(0.55);
    expect(seasonFactor(rice, "winter")).toBe(0.55);
  });

  it.each([-1, -1.25, Number.NEGATIVE_INFINITY])(
    "rejects negative stall quantity %s without changing stock or coins",
    (qty) => {
      const initial = createInitialState();
      const ready = {
        ...initial,
        inv: { ...initial.inv, paddy: 2 },
        buildings: { ...initial.buildings, stall: { built: true } },
      };

      const result = stallSell(ready, { itemId: "paddy", qty });

      expect(result).toEqual({
        ok: false,
        reason: "至少也得摆一件出去",
        state: ready,
      });
      expect(result.state.inv.paddy).toBe(2);
      expect(result.state.resources.coin).toBe(initial.resources.coin);
      expectNonNegativeInventory(result.state);
    },
  );

  it.skip(
    "rejects non-positive inventory transaction quantities (pending core validation)",
    () => {
      const initial = { ...createInitialState(), inv: { rice: 2 } };

      for (const quantity of [0, -1]) {
        const result = spendInv(initial, { rice: quantity });
        expect(result.ok).toBe(false);
        expect(result.state).toBe(initial);
        expect(result.state.inv.rice).toBe(2);
      }
    },
  );
});
