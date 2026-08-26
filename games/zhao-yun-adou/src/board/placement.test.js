import { describe, expect, it } from "vitest";
import { scanAwaken } from "./awaken.js";
import { cellDistToPath, createCells, neighbors, unlockedEmptyCells } from "./grid.js";
import { canMerge } from "./merge.js";
import {
  bestCell,
  boardCoverage,
  cellCoverage,
  coverageGaps,
  coverageWindowsFor,
  explainPlacement,
  gridCoverage,
  innerRing,
  marginalCoverage,
  outerRing,
  placementHeat,
  placementWeights,
  rangeOf,
  rankPlacements,
  recommendCells,
  recommendMelee,
  recommendRanged,
  roleOf,
  roleRange,
  specOf,
  usesLaneCoverage,
} from "./placement.js";

const unit = (id, level = 1) => ({ kind: "unit", id, glyph: id, level, cd: 0, cooldown: 0 });
const glyph = (g) => ({ kind: "glyph", glyph: g });
const hero = (id) => ({ kind: "hero", id, glyph: id, level: 5, cooldown: 0 });

/** 只留覆盖项的权重：用来验证「谁守得多」这一条主线，不受邻格调味项干扰。 */
const COVERAGE_ONLY = { fresh: 0, exclusive: 0, awaken: 0, merge: 0, ring: 0, kin: 0, room: 0 };
const FLAT = Object.fromEntries(Object.keys(placementWeights()).map((k) => [k, 0]));

function argmaxCoverage(cells, range, opts) {
  return unlockedEmptyCells(cells)
    .map((c) => ({ index: c.index, cov: cellCoverage(c.index, range, opts) }))
    .sort((a, b) => b.cov - a.cov || a.index - b.index)[0].index;
}

describe("placement: lane coverage bridge", () => {
  it("reads coverage from the combat layer", () => {
    expect(usesLaneCoverage()).toBe(true);
    const windows = coverageWindowsFor(6, 1);
    expect(windows.length).toBeGreaterThan(0);
    const span = windows.reduce((sum, w) => sum + (w.to - w.from), 0);
    expect(span).toBeCloseTo(cellCoverage(6, 1), 5);
    for (const w of windows) expect(w.to).toBeGreaterThanOrEqual(w.from);
  });

  it("gives longer coverage to longer range and none to non-combat pieces", () => {
    expect(cellCoverage(7, 2)).toBeGreaterThan(cellCoverage(7, 1));
    expect(cellCoverage(7, 0)).toBe(0);
    expect(cellCoverage(-1, 2)).toBe(0);
    expect(coverageWindowsFor(99, 2)).toEqual([]);
  });

  it("normalises cards, unit ids, role names and ranges into one spec", () => {
    expect(specOf(unit("dao"))).toMatchObject({ role: "melee", range: 1, id: "dao" });
    expect(specOf(unit("gong"))).toMatchObject({ role: "ranged", range: 2, id: "gong" });
    expect(specOf("qiang")).toMatchObject({ role: "melee", range: 1 });
    expect(specOf("ranged").range).toBe(roleRange().ranged);
    expect(rangeOf(hero("zhaoyun"))).toBe(2);
    expect(roleOf(hero("zhangfei"))).toBe("melee");
    expect(roleOf(glyph("赵"))).toBe(null);
    expect(rangeOf(glyph("赵"))).toBe(0);
    expect(rangeOf({ kind: "shovel" })).toBe(0);
    expect(specOf("nope")).toMatchObject({ role: null, range: 0 });
    expect(specOf(3)).toMatchObject({ role: "ranged", range: 3 });
  });
});

describe("placement: melee vs ranged recommendations", () => {
  it("sends melee to the cells that cover the most lane", () => {
    const cells = createCells();
    const ranked = rankPlacements(cells, "melee", { weights: COVERAGE_ONLY });
    expect(ranked[0].index).toBe(argmaxCoverage(cells, 1));
    expect(ranked[0].coverage).toBeGreaterThan(ranked[ranked.length - 1].coverage);
  });

  it("sends ranged to the segments melee cannot reach", () => {
    const cells = createCells();
    const meleeTop = recommendMelee(cells, { limit: 1 })[0];
    const rangedTop = recommendRanged(cells, { limit: 1 })[0];

    // 近战位吃的是「贴身能守的最长一段」。
    expect(cellCoverage(meleeTop, 1)).toBeGreaterThanOrEqual(cellCoverage(rangedTop, 1));
    // 远程位吃的是「只有远程够得着」的机会成本差额。
    const exclusive = (i) => cellCoverage(i, 2) - cellCoverage(i, 1);
    expect(exclusive(rangedTop)).toBeGreaterThan(exclusive(meleeTop));
    expect(recommendMelee(cells)).not.toEqual(recommendRanged(cells));
  });

  it("follows the card's own role: 刀 like melee, 弓 like ranged", () => {
    const cells = createCells();
    expect(recommendCells(cells, unit("dao"))).toEqual(recommendMelee(cells));
    expect(recommendCells(cells, unit("gong"))).toEqual(recommendRanged(cells));
    expect(recommendCells(cells, unit("qi"))).toEqual(recommendMelee(cells));
  });

  it("spreads the next unit onto lane the board does not cover yet", () => {
    const cells = createCells();
    const first = bestCell(cells, unit("dao"));
    const firstGain = marginalCoverage(cells, first, unit("dao"));
    cells[first].unit = unit("dao");

    expect(marginalCoverage(cells, first, unit("dao"))).toBe(0);
    const second = bestCell(cells, unit("dao"));
    expect(second).not.toBe(first);
    expect(marginalCoverage(cells, second, unit("dao"))).toBeLessThanOrEqual(firstGain);
    expect(marginalCoverage(cells, second, unit("dao"))).toBeGreaterThan(0);
  });
});

describe("placement: board coverage read-out", () => {
  it("reports the uncovered lane and closes it as units land", () => {
    const cells = createCells();
    const empty = boardCoverage(cells);
    expect(empty).toMatchObject({ lane: true, ratio: 0 });
    expect(empty.gaps).toEqual([{ from: 0, to: 1 }]);

    cells[bestCell(cells, unit("dao"))].unit = unit("dao");
    const one = boardCoverage(cells);
    expect(one.ratio).toBeGreaterThan(0);
    expect(one.ratio).toBeLessThan(1);
    cells[bestCell(cells, unit("dao"))].unit = unit("dao");
    const two = boardCoverage(cells);
    expect(two.ratio).toBeGreaterThan(one.ratio);
    expect(coverageGaps(cells).length).toBeGreaterThanOrEqual(0);
    for (const gap of coverageGaps(cells)) {
      expect(gap.from).toBeGreaterThanOrEqual(0);
      expect(gap.to).toBeLessThanOrEqual(1);
    }
  });

  it("ignores sleeping glyphs, locked cells and the empty board", () => {
    const cells = createCells();
    cells[7].unit = glyph("赵");
    expect(boardCoverage(cells).ratio).toBe(0);
    cells[7].unit = hero("zhaoyun");
    expect(boardCoverage(cells).ratio).toBeGreaterThan(0);
    expect(boardCoverage(null).ratio).toBe(0);
  });
});

describe("placement: board-side terms", () => {
  it("prefers a cell that sets up a merge", () => {
    const cells = createCells();
    cells[7].unit = unit("dao");
    const seat = neighbors(7).find((i) => cells[i].unlocked && !cells[i].unit);

    const withMerge = explainPlacement(cells, seat, unit("dao"));
    const withoutMerge = explainPlacement(cells, seat, unit("qiang"));
    expect(canMerge(unit("dao"), cells[7].unit)).toBe(true);
    expect(withMerge.terms.merge).toBeGreaterThan(0);
    expect(withoutMerge.terms.merge).toBe(0);
    // 刀与枪同为近战 range 1，覆盖完全一样，差额只可能来自合并项。
    expect(withMerge.coverage).toBe(withoutMerge.coverage);
    expect(withMerge.score).toBeGreaterThan(withoutMerge.score);
  });

  it("puts a name glyph where it awakens on the spot", () => {
    const cells = createCells();
    cells[7].unit = glyph("赵");
    const seat = recommendCells(cells, glyph("云"), { limit: 1 })[0];

    expect(neighbors(7)).toContain(seat);
    expect(explainPlacement(cells, seat, glyph("云")).terms.awaken).toBeGreaterThan(0);

    cells[seat].unit = glyph("云");
    const plan = scanAwaken(cells);
    expect(plan).toHaveLength(1);
    expect(plan[0].hero.id).toBe("zhaoyun");
  });

  it("splits unlocked cells into the rim and the core", () => {
    const cells = createCells();
    const rim = outerRing(cells);
    const core = innerRing(cells);
    expect(rim.length + core.length).toBe(cells.filter((c) => c.unlocked).length);
    expect(rim.every((i) => cellDistToPath(i) === 0)).toBe(true);
    expect(core.every((i) => cellDistToPath(i) >= 1)).toBe(true);
    expect(rim.some((i) => core.includes(i))).toBe(false);
  });
});

describe("placement: contract", () => {
  it("only ever recommends unlocked empty cells", () => {
    const cells = createCells();
    cells[7].unit = unit("dao");
    const open = unlockedEmptyCells(cells).map((c) => c.index);
    const ranked = rankPlacements(cells, "ranged");
    expect(ranked.map((r) => r.index).sort((a, b) => a - b)).toEqual(open);
    expect(ranked.every((r) => r.eligible)).toBe(true);
    expect(recommendCells(cells, "ranged", { limit: 20 })).not.toContain(7);
    expect(recommendCells(cells, "ranged", { limit: 20 })).not.toContain(0);
  });

  it("is deterministic and breaks ties by ascending index", () => {
    const cells = createCells();
    expect(rankPlacements(cells, "ranged")).toEqual(rankPlacements(cells, "ranged"));
    const flat = rankPlacements(cells, "ranged", { weights: FLAT }).map((r) => r.index);
    expect(flat).toEqual(unlockedEmptyCells(cells).map((c) => c.index));
    expect(new Set(flat).size).toBe(flat.length);
  });

  it("never mutates the board", () => {
    const cells = createCells();
    cells[7].unit = unit("dao");
    const before = JSON.stringify(cells);
    rankPlacements(cells, unit("gong"));
    recommendMelee(cells);
    recommendRanged(cells);
    placementHeat(cells, glyph("赵"));
    boardCoverage(cells);
    marginalCoverage(cells, 6, unit("dao"));
    explainPlacement(cells, 6, unit("dao"));
    expect(JSON.stringify(cells)).toBe(before);
  });

  it("normalises heat to 0~1 with the best cell on top", () => {
    const cells = createCells();
    const heat = placementHeat(cells, unit("gong"));
    expect(heat).toHaveLength(unlockedEmptyCells(cells).length);
    expect(heat[0].heat).toBe(1);
    expect(heat.every((h) => h.heat >= 0 && h.heat <= 1)).toBe(true);
    expect(heat[0].index).toBe(bestCell(cells, unit("gong")));
  });

  it("survives junk input instead of throwing", () => {
    expect(recommendCells(null, "melee")).toEqual([]);
    expect(rankPlacements(undefined, "melee")).toEqual([]);
    expect(bestCell([], "melee")).toBe(-1);
    expect(bestCell(createCells(), null)).toBeGreaterThanOrEqual(0);
    expect(explainPlacement(createCells(), 99, "melee")).toBe(null);
    expect(marginalCoverage(createCells(), 99, "melee")).toBe(0);
    expect(marginalCoverage(createCells(), 6, { kind: "shovel" })).toBe(0);
    expect(recommendCells(createCells(), "melee", { limit: 0 })).toEqual([]);
    expect(recommendCells(createCells(), "melee", { samples: -5 }).length).toBe(3);
  });

  it("keeps a full board out of the recommendation list", () => {
    const cells = createCells();
    for (const cell of cells) if (cell.unlocked) cell.unit = unit("dao");
    expect(rankPlacements(cells, "melee")).toEqual([]);
    expect(bestCell(cells, "melee")).toBe(-1);
    expect(placementHeat(cells, "melee")).toEqual([]);
  });
});

describe("placement: grid-only fallback", () => {
  const OFF = { lane: false };

  it("keeps the same shape without the combat layer", () => {
    const cells = createCells();
    const ranked = rankPlacements(cells, "ranged", OFF);
    expect(ranked.map((r) => r.index).sort((a, b) => a - b)).toEqual(
      unlockedEmptyCells(cells).map((c) => c.index),
    );
    expect(Object.keys(ranked[0].terms)).toEqual(Object.keys(placementWeights()));
    expect(coverageWindowsFor(6, 1, OFF)).toEqual([]);
    expect(boardCoverage(cells, OFF)).toMatchObject({ lane: false, ratio: null, gaps: [] });
  });

  it("keeps the coarse coverage monotone in range and distance", () => {
    expect(gridCoverage(9, 2)).toBeGreaterThan(gridCoverage(9, 1));
    expect(gridCoverage(9, 1)).toBeGreaterThan(gridCoverage(6, 1));
    expect(gridCoverage(6, 1)).toBe(0);
    expect(gridCoverage(99, 2)).toBe(0);
    expect(cellCoverage(9, 1, OFF)).toBe(gridCoverage(9, 1));
  });

  it("still splits melee and ranged once the rim fills up", () => {
    const cells = createCells();
    for (const index of outerRing(cells)) {
      if (cells[index].unlocked) cells[index].unit = unit("dao");
    }
    const meleeTop = recommendMelee(cells, { ...OFF, limit: 1 })[0];
    const rangedTop = recommendRanged(cells, { ...OFF, limit: 1 })[0];
    expect(cellDistToPath(rangedTop)).toBeGreaterThanOrEqual(1);
    expect(gridCoverage(rangedTop, 2)).toBeGreaterThan(0);
    expect(gridCoverage(meleeTop, 1)).toBe(0); // 粗估口径下近战够不到里圈
    expect(marginalCoverage(cells, rangedTop, "ranged", OFF)).toBeGreaterThan(0);
  });
});
