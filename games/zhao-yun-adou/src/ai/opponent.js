import { canMerge } from "../board/merge.js";
import { neighbors, cellDistToPath } from "../board/grid.js";
import { UNIT_TABLE } from "../data/units.js";
import { recruitCost, HAND_LIMIT } from "../data/units.js";

function preferredCell(side, card) {
  const empty = side.cells.filter((c) => c.unlocked && !c.unit);
  if (!empty.length) return null;
  if (card.kind === "unit" && UNIT_TABLE[card.id]?.role === "ranged") {
    empty.sort((a, b) => cellDistToPath(b.index) - cellDistToPath(a.index));
  } else {
    empty.sort((a, b) => cellDistToPath(a.index) - cellDistToPath(b.index));
  }
  return empty[0];
}

export function stepAi(api, dt) {
  const side = api.state.sides.ai;
  if (api.state.phase !== "playing") return;
  side._acc = (side._acc || 0) + dt;
  if (side._acc < 0.28) return;
  side._acc = 0;

  for (let i = 0; i < side.cells.length; i++) {
    const a = side.cells[i].unit;
    if (!a) continue;
    for (const ni of neighbors(i)) {
      if (canMerge(a, side.cells[ni].unit)) {
        api.merge("ai", i, ni);
        return;
      }
    }
  }

  for (let h = 0; h < side.hand.length; h++) {
    const card = side.hand[h];
    if (card.kind === "shovel") {
      const locked = side.cells.find((c) => !c.unlocked);
      if (locked) {
        api.useShovel("ai", h, locked.index);
        return;
      }
    }
    if (card.kind === "token") {
      const up = side.cells.find((c) => c.unit?.kind === "unit" && c.unit.level < 5);
      if (up) {
        api.place("ai", h, up.index);
        return;
      }
    }
    if (card.kind === "unit") {
      const mergeCell = side.cells.find((c) => canMerge(c.unit, card));
      if (mergeCell) {
        api.place("ai", h, mergeCell.index);
        return;
      }
    }
    if (card.kind === "glyph") {
      const partner = side.cells.find(
        (c) => c.unit?.kind === "glyph" && c.unit.glyph !== card.glyph,
      );
      if (partner) {
        const nb = neighbors(partner.index).find((i) => side.cells[i].unlocked && !side.cells[i].unit);
        if (nb != null) {
          api.place("ai", h, nb);
          return;
        }
      }
    }
    const cell = preferredCell(side, card);
    if (cell && card.kind !== "shovel") {
      api.place("ai", h, cell.index);
      return;
    }
  }

  const cost = recruitCost(side.recruitCount);
  if (side.hand.length < HAND_LIMIT && side.mantou >= cost) {
    api.recruit("ai");
  }
}
