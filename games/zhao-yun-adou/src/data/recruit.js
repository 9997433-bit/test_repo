import { UNIT_TABLE } from "./units.js";
import { GLYPH_POOL } from "./heroes.js";

export const RECRUIT_WEIGHTS = [
  { w: 22, v: { kind: "unit", id: "dao" } },
  { w: 22, v: { kind: "unit", id: "qiang" } },
  { w: 22, v: { kind: "unit", id: "gong" } },
  { w: 16, v: { kind: "unit", id: "qi" } },
  { w: 12, v: { kind: "glyph" } },
  { w: 4, v: { kind: "shovel" } },
  { w: 2, v: { kind: "token", id: "shenbing" } },
];

export function rollRecruit(rng) {
  const pick = rng.weighted(RECRUIT_WEIGHTS);
  if (pick.kind === "unit") {
    const row = UNIT_TABLE[pick.id];
    return { kind: "unit", id: pick.id, glyph: row.glyph, level: 1 };
  }
  if (pick.kind === "glyph") {
    return { kind: "glyph", glyph: rng.pick(GLYPH_POOL), level: 1 };
  }
  if (pick.kind === "shovel") {
    return { kind: "shovel", glyph: "铲", level: 1 };
  }
  return { kind: "token", id: "shenbing", glyph: "符", level: 1 };
}
