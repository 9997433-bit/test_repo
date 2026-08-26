import { findHeroByGlyphs } from "../data/heroes.js";
import { neighbors } from "./grid.js";

export function scanAwaken(cells) {
  const used = new Set();
  const awakened = [];
  for (const cell of cells) {
    if (!cell.unit || cell.unit.kind !== "glyph" || used.has(cell.index)) continue;
    for (const ni of neighbors(cell.index)) {
      if (used.has(ni)) continue;
      const other = cells[ni].unit;
      if (!other || other.kind !== "glyph") continue;
      const hero = findHeroByGlyphs(cell.unit.glyph, other.glyph);
      if (!hero) continue;
      used.add(cell.index);
      used.add(ni);
      awakened.push({ keepIndex: cell.index, dropIndex: ni, hero });
      break;
    }
  }
  return awakened;
}

export function applyAwaken(cells, plan) {
  for (const { keepIndex, dropIndex, hero } of plan) {
    cells[keepIndex].unit = {
      kind: "hero",
      id: hero.id,
      glyph: hero.name,
      level: 5,
      cooldown: hero.skill.cd * 0.35,
      atkBonus: 0,
    };
    cells[dropIndex].unit = null;
  }
  return plan.map((p) => p.hero);
}
