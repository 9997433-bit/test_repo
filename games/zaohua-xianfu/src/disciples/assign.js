export const POST_KINDS = {
  gather: { id: "gather", name: "灵植采集", types: ["field", "woodcut", "quarry"], key: "diligent", keyName: "勤勉" },
  craft: { id: "craft", name: "丹器阵法", types: ["alchemy", "forge", "array"], key: "force", keyName: "武力" },
  study: { id: "study", name: "藏经研习", types: ["scripture"], key: "profession", keyName: "专业" },
  chore: { id: "chore", name: "府中杂役", types: ["mansion", "leypulse"], key: "profession", keyName: "专业" },
};

export function postKind(buildingType) {
  return Object.values(POST_KINDS).find((k) => k.types.includes(buildingType)) ?? POST_KINDS.chore;
}

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

/** 同一套系数的可读拆解：total 直接取自 yieldMultiplier，避免与产量口径漂移。 */
export function yieldBreakdown(disciple, building) {
  const total = yieldMultiplier(disciple, building);
  if (!disciple || !building) return { total, kind: POST_KINDS.chore, parts: [] };
  const prof = disciple.profession ?? 1;
  const diligent = disciple.diligent ?? 10;
  const force = disciple.force ?? 10;
  const kind = postKind(building.type);
  const parts =
    kind.id === "gather"
      ? [
          { label: "勤勉", add: diligent * 0.018 },
          { label: "专业", add: prof * 0.06 },
        ]
      : kind.id === "craft"
        ? [
            { label: "武力", add: force * 0.01 },
            { label: "专业", add: prof * 0.05 },
          ]
        : kind.id === "study"
          ? [{ label: "专业", add: prof * 0.08 }]
          : [{ label: "专业", add: prof * 0.03 }];
  return { total, kind, parts };
}

/** 以各类岗位的样板建筑试算，给出该弟子最擅长的去处。 */
export function recommendKind(disciple) {
  const probes = [
    [POST_KINDS.gather, { type: "field" }],
    [POST_KINDS.craft, { type: "alchemy" }],
    [POST_KINDS.study, { type: "scripture" }],
  ];
  let best = { kind: POST_KINDS.gather, mul: 0 };
  for (const [kind, probe] of probes) {
    const mul = yieldMultiplier(disciple, probe);
    if (mul > best.mul) best = { kind, mul };
  }
  return best;
}
