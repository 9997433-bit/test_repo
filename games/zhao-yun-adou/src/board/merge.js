import { MAX_LEVEL } from "../data/units.js";

export function canMerge(a, b) {
  if (!a || !b) return false;
  if (a.kind !== "unit" || b.kind !== "unit") return false;
  return a.id === b.id && a.level === b.level && a.level < MAX_LEVEL;
}

export function mergeUnits(a, b) {
  if (!canMerge(a, b)) return null;
  return { ...a, level: a.level + 1 };
}

export function applyShenbing(unit) {
  if (!unit || unit.kind !== "unit" || unit.level >= MAX_LEVEL) return unit;
  return { ...unit, level: unit.level + 1 };
}
