import { describe, expect, it } from "vitest";
import { createCells } from "../src/board/grid.js";
import { applyAwaken, scanAwaken } from "../src/board/awaken.js";

describe("awaken", () => {
  it("赵 + 云 adjacent becomes 赵云", () => {
    const cells = createCells();
    cells[6].unit = { kind: "glyph", glyph: "赵" };
    cells[7].unit = { kind: "glyph", glyph: "云" };
    const plan = scanAwaken(cells);
    expect(plan[0].hero.id).toBe("zhaoyun");
    const heroes = applyAwaken(cells, plan);
    expect(heroes[0].name).toBe("赵云");
    expect(cells[6].unit.kind).toBe("hero");
    expect(cells[7].unit).toBe(null);
  });

  it("sleeping unmatched glyphs do not awaken", () => {
    const cells = createCells();
    cells[6].unit = { kind: "glyph", glyph: "赵" };
    cells[7].unit = { kind: "glyph", glyph: "飞" };
    expect(scanAwaken(cells)).toEqual([]);
  });
});
