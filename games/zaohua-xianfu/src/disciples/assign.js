export function yieldMultiplier(disciple, building) {
  if (!disciple || !building) return 1;
  const prof = disciple.profession ?? 1;
  const diligent = disciple.diligent ?? 10;
  const force = disciple.force ?? 10;
  if (building.type === "field" || building.type === "woodcut" || building.type === "quarry") {
    return 1 + diligent * 0.018 + prof * 0.06;
  }
  if (building.type === "alchemy" || building.type === "forge" || building.type === "array") {
    return 1 + force * 0.01 + prof * 0.05;
  }
  if (building.type === "scripture") {
    return 1 + prof * 0.08;
  }
  return 1 + prof * 0.03;
}
