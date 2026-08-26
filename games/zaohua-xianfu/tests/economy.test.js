import { describe, expect, it } from "vitest";
import { reduce, defaultState } from "../src/core/store.js";
import { produce } from "../src/mansion/production.js";
import { adjacencyBonus } from "../src/mansion/layout.js";

function bootFaction(faction = "mortal") {
  let s = defaultState();
  s = reduce(s, { type: "CHOOSE_FACTION", faction, name: "测", now: 1 });
  return s;
}

describe("economy", () => {
  it("choosing faction plants mansion + field + array", () => {
    const s = bootFaction();
    expect(s.buildings.map((b) => b.type).sort()).toEqual(["array", "field", "mansion"]);
    expect(s.party[0]).toBe("mc-mortal");
  });

  it("ley pulse boosts adjacent field", () => {
    const buildings = [
      { id: "f", type: "field", level: 1, x: 1, y: 1 },
      { id: "p", type: "leypulse", level: 1, x: 2, y: 1 },
    ];
    expect(adjacencyBonus(buildings, 1, 1)).toBeCloseTo(1.15);
    expect(adjacencyBonus(buildings, 4, 4)).toBe(1);
  });

  it("production is positive and field benefits from pulse", () => {
    const base = {
      ...bootFaction(),
      buildings: [
        { id: "m", type: "mansion", level: 2, x: 0, y: 0 },
        { id: "f", type: "field", level: 1, x: 1, y: 1 },
      ],
      disciples: [],
    };
    const pulsed = {
      ...base,
      buildings: [...base.buildings, { id: "p", type: "leypulse", level: 1, x: 2, y: 1 }],
    };
    expect(produce(pulsed, 10).herb).toBeGreaterThan(produce(base, 10).herb);
  });

  it("build spends resources and occupies tile", () => {
    let s = bootFaction();
    s = { ...s, resources: { ...s.resources, wood: 99, ore: 99, stone: 99 } };
    s = reduce(s, { type: "BUILD", buildingType: "woodcut", x: 0, y: 0 });
    expect(s.buildings.some((b) => b.type === "woodcut" && b.x === 0 && b.y === 0)).toBe(true);
    expect(s.resources.wood).toBeLessThan(99);
  });

  it("cannot double-place mansion", () => {
    let s = bootFaction();
    s = { ...s, resources: { ...s.resources, wood: 99, ore: 99, stone: 99 } };
    const n = s.buildings.length;
    s = reduce(s, { type: "BUILD", buildingType: "mansion", x: 0, y: 0 });
    expect(s.buildings.length).toBe(n);
  });
});
