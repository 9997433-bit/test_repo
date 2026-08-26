import { describe, expect, it } from "vitest";
import { collectPassives } from "../src/combat/artifacts.js";
import { simulate } from "../src/combat/battle.js";
import { loadSave } from "../src/core/save.js";
import { defaultState, reduce } from "../src/core/store.js";
import { towerEnemy } from "../src/data/enemies.js";
import { adjacencyBonus } from "../src/mansion/layout.js";
import { applyBreakthrough } from "../src/progression/realm.js";

function bootFaction(faction = "mortal") {
  return reduce(defaultState(), { type: "CHOOSE_FACTION", faction, name: "回归测试", now: 1 });
}

describe("regressions", () => {
  it("rejects malformed, incompatible, and unreadable saves", () => {
    expect(loadSave({ getItem: () => "{broken-json" })).toBeNull();
    expect(loadSave({ getItem: () => JSON.stringify({ schemaVersion: 999, state: {} }) })).toBeNull();
    expect(
      loadSave({
        getItem: () => {
          throw new Error("storage unavailable");
        },
      }),
    ).toBeNull();
  });

  it("rejects a second unique mansion without charging resources", () => {
    const state = {
      ...bootFaction(),
      resources: { qi: 999, herb: 999, wood: 999, ore: 999, stone: 999, pills: 999, jade: 999 },
    };

    const next = reduce(state, { type: "BUILD", buildingType: "mansion", x: 0, y: 0 });

    expect(next).toBe(state);
    expect(next.resources).toEqual(state.resources);
    expect(next.buildings.filter((building) => building.type === "mansion")).toHaveLength(1);
  });

  it("stacks only cardinal ley-pulse adjacency bonuses", () => {
    const buildings = [
      { id: "field", type: "field", level: 1, x: 2, y: 2 },
      { id: "east", type: "leypulse", level: 1, x: 3, y: 2 },
      { id: "west", type: "leypulse", level: 1, x: 1, y: 2 },
      { id: "south", type: "leypulse", level: 1, x: 2, y: 3 },
      { id: "north", type: "leypulse", level: 1, x: 2, y: 1 },
      { id: "diagonal", type: "leypulse", level: 1, x: 3, y: 3 },
    ];

    expect(adjacencyBonus(buildings, 2, 2)).toBeCloseTo(1.6);
    expect(adjacencyBonus([buildings[0], buildings.at(-1)], 2, 2)).toBe(1);
  });

  it("crosses into the next realm after the final successful layer", () => {
    const state = {
      ...bootFaction(),
      resources: { ...bootFaction().resources, pills: 2 },
      realm: { index: 0, layer: 9, exp: 80, heartDemon: 3 },
    };

    const result = applyBreakthrough(state, () => 0);

    expect(result.ok).toBe(true);
    expect(result.state.realm).toEqual({ index: 1, layer: 1, exp: 0, heartDemon: 0 });
    expect(result.state.resources.pills).toBe(1);
  });

  it("produces the complete same combat transcript for the same seed", () => {
    const state = bootFaction("divine");
    const input = {
      seed: 20260826,
      heroIds: state.party,
      foes: towerEnemy(4).foes,
      state,
      equipped: state.equipped,
      maxTicks: 120,
    };

    expect(simulate(input)).toEqual(simulate(input));
  });

  it("composes passive artifacts while ignoring non-passive effects", () => {
    const passives = collectPassives(["huagu", "taixu", "lundao", "zhuque", "unknown"]);

    expect(passives.crit).toBeCloseTo(0.2);
    expect(passives.ultHaste).toBeCloseTo(0.18);
    expect(passives.basicMul).toBeCloseTo(1.16);
    expect(passives.skillMul).toBe(1);
  });

  it("equips only owned artifacts and evicts the oldest fifth slot", () => {
    const state = {
      ...bootFaction(),
      ownedArtifacts: ["qixing", "lundao", "huagu", "taixu", "qinglong"],
      equipped: ["qixing", "lundao", "huagu", "taixu"],
    };

    const rejected = reduce(state, { type: "EQUIP_ARTIFACT", artifactId: "zhuque" });
    const equipped = reduce(state, { type: "EQUIP_ARTIFACT", artifactId: "qinglong" });

    expect(rejected).toBe(state);
    expect(equipped.equipped).toEqual(["lundao", "huagu", "taixu", "qinglong"]);
  });

  it("charges the 30 percent resource tax after a failed beast wave", () => {
    const state = {
      ...bootFaction(),
      resources: { qi: 50, herb: 100, wood: 80, ore: 40, stone: 70, pills: 3, jade: 5 },
      wave: { wave: 4, best: 2 },
      combat: { kind: "wave", result: { winner: "b", wave: 4 } },
    };

    const next = reduce(state, { type: "RESOLVE_COMBAT" });

    expect(next.resources).toEqual({ qi: 50, herb: 70, wood: 56, ore: 28, stone: 70, pills: 3, jade: 5 });
    expect(next.wave).toEqual(state.wave);
    expect(next.combat).toBeNull();
  });
});
