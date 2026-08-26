import { describe, expect, it } from "vitest";
import { simulateBattle } from "../src/combat/battle.js";
import { stepSim } from "../src/core/engine.js";
import { createStore } from "../src/core/store.js";
import { STAGES } from "../src/data/stages.js";
import { applyBattleInjuries, assignHero, canAssign, isInjured, recruit, starUp } from "../src/heroes/roster.js";
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

  it("keeps a fallen hero injured until ticks expire, then allows reassignment", () => {
    let s = placeBuilding(createStore().get(), "house", 0, 0, 0);
    s = recruit(s, "sam");
    const buildingId = s.buildings[0].id;
    s = assignHero(s, "h-sam", buildingId);

    s = applyBattleInjuries(s, { leftover: [{ id: "h-sam", side: "ally", hp: 0 }] }, 0.1);
    const injured = s.heroes.find((hero) => hero.id === "h-sam");
    expect(isInjured(s, injured)).toBe(true);
    expect(canAssign(s, "h-sam", buildingId)).toMatchObject({ ok: false, reason: "E_LOCKED" });

    s = stepSim(s);
    expect(isInjured(s, s.heroes.find((hero) => hero.id === "h-sam"))).toBe(false);
    s = assignHero(s, "h-sam", buildingId);
    expect(s.heroes.find((hero) => hero.id === "h-sam")?.assignedBuildingId).toBe(buildingId);
    expect(s.buildings.find((building) => building.id === buildingId)?.occupantHeroId).toBe("h-sam");
  });

  it("keeps sampled opening, boss, and late stages at five enemies", () => {
    for (const stageIndex of [0, 4, 9, 19, 29]) {
      expect(STAGES[stageIndex].enemies).toHaveLength(5);
    }
  });
});
