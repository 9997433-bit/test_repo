import { describe, expect, it } from "vitest";
import { createCells } from "../src/board/grid.js";
import { applyAwaken, scanAwaken } from "../src/board/awaken.js";
import { HEROES } from "../src/data/heroes.js";

describe("awaken", () => {
  it.each(HEROES)("awakens $name from either glyph order", (hero) => {
    const cells = createCells();
    cells[6].unit = { kind: "glyph", glyph: hero.glyphs[1] };
    cells[7].unit = { kind: "glyph", glyph: hero.glyphs[0] };

    const plan = scanAwaken(cells);

    expect(plan).toHaveLength(1);
    expect(plan[0]).toMatchObject({ keepIndex: 6, dropIndex: 7, hero: { id: hero.id } });
    const heroes = applyAwaken(cells, plan);
    expect(heroes).toEqual([hero]);
    expect(cells[6].unit).toEqual({
      kind: "hero",
      id: hero.id,
      glyph: hero.name,
      level: 5,
      cooldown: hero.skill.cd * 0.35,
      atkBonus: 0,
    });
    expect(cells[7].unit).toBe(null);
  });

  it("sleeping unmatched glyphs do not awaken", () => {
    const cells = createCells();
    cells[6].unit = { kind: "glyph", glyph: "赵" };
    cells[7].unit = { kind: "glyph", glyph: "飞" };
    expect(scanAwaken(cells)).toEqual([]);
  });
});
