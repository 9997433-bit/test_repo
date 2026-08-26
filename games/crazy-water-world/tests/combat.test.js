import { describe, expect, it } from "vitest";
import { simulateBattle } from "../src/combat/battle.js";
import { recruit, assignHero, starUp } from "../src/heroes/roster.js";
import { createStore } from "../src/core/store.js";
import { placeBuilding } from "../src/world/build.js";

describe("combat + heroes", () => {
  it("produces byte-identical JSON snapshots for the same seed", () => {
    const allies = [
      { id: "h-sam", heroKey: "sam", star: 3 },
      { id: "h-yilong", heroKey: "yilong", star: 2 },
      { id: "h-mia", heroKey: "mia", star: 2 },
    ];
    const enemies = [
      { key: "raider", name: "海盗", hp: 200, atk: 20, def: 5, spd: 90, lane: "front" },
      { key: "gunner", name: "火枪", hp: 140, atk: 24, def: 3, spd: 100, lane: "back" },
    ];
    const a = simulateBattle(42, allies, enemies);
    const b = simulateBattle(42, allies, enemies);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
    expect(["ally", "enemy", "draw"]).toContain(a.winner);
  });

  it("recruits and assigns without duplicating", () => {
    let s = createStore().get();
    s = { ...s, player: { ...s.player, level: 5 } };
    s = placeBuilding(s, "radio", 4, 0, 0);
    s = recruit(s, "sam");
    s = recruit(s, "sam");
    expect(s.heroes.filter((h) => h.heroKey === "sam")).toHaveLength(1);
    s = assignHero(s, "h-sam", s.buildings[0].id);
    expect(s.heroes[0].assignedBuildingId).toBe(s.buildings[0].id);
    s = { ...s, resources: { ...s.resources, shard: 99 } };
    s = starUp(s, "h-sam");
    expect(s.heroes[0].star).toBe(2);
  });
});
