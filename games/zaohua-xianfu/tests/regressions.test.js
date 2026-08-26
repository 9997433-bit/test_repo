import { describe, expect, it } from "vitest";
import { collectPassives } from "../src/combat/artifacts.js";
import { simulate } from "../src/combat/battle.js";
import { EVENTS } from "../src/core/events.js";
import { OFFLINE_CAP_SEC } from "../src/core/offline.js";
import { CORRUPT_KEY, SAVE_KEY, loadSave } from "../src/core/save.js";
import { createStore, defaultState, reduce } from "../src/core/store.js";
import { artifactById } from "../src/data/artifacts.js";
import { towerEnemy } from "../src/data/enemies.js";
import { adjacencyBonus } from "../src/mansion/layout.js";
import { applyBreakthrough } from "../src/progression/realm.js";

function bootFaction(faction = "mortal") {
  return reduce(defaultState(), { type: "CHOOSE_FACTION", faction, name: "回归测试", now: 1 });
}

function memoryStorage(initial = {}) {
  const entries = new Map(Object.entries(initial));
  return {
    getItem(key) {
      return entries.get(key) ?? null;
    },
    setItem(key, value) {
      entries.set(key, String(value));
    },
    removeItem(key) {
      entries.delete(key);
    },
  };
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

  it("backs up a malformed save, emits the corruption event, and boots a fresh state", () => {
    const malformed = "{broken-json";
    const storage = memoryStorage({ [SAVE_KEY]: malformed });
    const store = createStore({ storage });
    const events = [];
    store.events.on(EVENTS.saveCorrupt, (event) => events.push(event));

    const state = store.dispatch({ type: "BOOT", now: 42_000 });

    expect(storage.getItem(CORRUPT_KEY)).toBe(malformed);
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({ status: "corrupt" });
    expect(events[0].reason).toMatch(/^json:/);
    expect(state.meta).toEqual({ faction: null, name: "", startedAt: 0, lastTick: 42_000 });
    expect(state.buildings).toEqual([]);
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

  it("allocates a building id above the highest persisted numeric id", () => {
    const booted = bootFaction();
    const state = {
      ...booted,
      resources: { ...booted.resources, wood: 999, ore: 999, stone: 999 },
      buildings: [...booted.buildings, { id: "b-7", type: "woodcut", level: 1, x: 0, y: 1 }],
    };

    const next = reduce(state, { type: "BUILD", buildingType: "quarry", x: 0, y: 0 });

    expect(next.buildings.find((building) => building.x === 0 && building.y === 0)?.id).toBe("b-8");
    expect(new Set(next.buildings.map((building) => building.id)).size).toBe(next.buildings.length);
  });

  it("applies exactly 8 seconds directly and caps banked offline time at 8 hours", () => {
    const booted = bootFaction();
    const lastTick = 10_000;
    const saved = { ...booted, meta: { ...booted.meta, lastTick } };

    const direct = reduce(defaultState(), { type: "BOOT", loaded: saved, now: lastTick + 8_000 });
    const atCap = reduce(defaultState(), {
      type: "BOOT",
      loaded: saved,
      now: lastTick + OFFLINE_CAP_SEC * 1000,
    });
    const beyondCap = reduce(defaultState(), {
      type: "BOOT",
      loaded: saved,
      now: lastTick + (OFFLINE_CAP_SEC + 3600) * 1000,
    });

    expect(direct.offline).toMatchObject({ pending: null, seconds: 0 });
    expect(direct.resources.qi).toBeGreaterThan(saved.resources.qi);
    expect(direct.resources.herb).toBeGreaterThan(saved.resources.herb);
    expect(atCap.resources).toEqual(saved.resources);
    expect(atCap.offline.seconds).toBe(OFFLINE_CAP_SEC);
    expect(atCap.offline.pending?.qi).toBeGreaterThan(0);
    expect(beyondCap.offline.seconds).toBe(OFFLINE_CAP_SEC);
    expect(beyondCap.offline.pending).toEqual(atCap.offline.pending);
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

  it("TODO(AD-8): preserves current four-item FIFO regardless of artifact slot type", () => {
    const state = {
      ...bootFaction(),
      ownedArtifacts: ["qixing", "lundao", "huagu", "taixu", "qinglong"],
      equipped: ["qixing", "lundao", "huagu", "taixu"],
    };

    const rejected = reduce(state, { type: "EQUIP_ARTIFACT", artifactId: "zhuque" });
    const equipped = reduce(state, { type: "EQUIP_ARTIFACT", artifactId: "qinglong" });

    expect(rejected).toBe(state);
    expect(equipped.equipped).toEqual(["lundao", "huagu", "taixu", "qinglong"]);
    expect(equipped.equipped.map((id) => artifactById(id)?.slot)).toEqual(["util", "util", "util", "util"]);
  });

  it("TODO(AD-12): charges the current 30 percent inventory tax after a failed beast wave", () => {
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
