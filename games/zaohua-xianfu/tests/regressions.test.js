import { describe, expect, it } from "vitest";
import { collectPassives } from "../src/combat/artifacts.js";
import { simulate } from "../src/combat/battle.js";
import { EVENTS } from "../src/core/events.js";
import { OFFLINE_CAP_SEC, offlineEfficiency } from "../src/core/offline.js";
import { CORRUPT_KEY, SAVE_KEY, loadSave } from "../src/core/save.js";
import { slotUsage, snapshotForSave } from "../src/core/state.js";
import { createStore, defaultState, reduce, waveLossTax } from "../src/core/store.js";
import { ARTIFACT_DROPS } from "../src/data/artifacts.js";
import { towerEnemy } from "../src/data/enemies.js";
import { adjacencyBonus } from "../src/mansion/layout.js";
import { produce } from "../src/mansion/production.js";
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

  it("equips only owned artifacts and evicts within the same slot", () => {
    const state = {
      ...bootFaction(),
      ownedArtifacts: ["qixing", "lundao", "huagu", "zhumo", "canyang", "yaoguang"],
      equipped: ["qixing", "lundao", "huagu", "zhumo"],
    };

    const rejected = reduce(state, { type: "EQUIP_ARTIFACT", artifactId: "zhuque" });
    const attack = reduce(state, { type: "EQUIP_ARTIFACT", artifactId: "canyang" });
    const defend = reduce(state, { type: "EQUIP_ARTIFACT", artifactId: "yaoguang" });

    expect(rejected).toBe(state);
    expect(attack.equipped).toEqual(["qixing", "lundao", "huagu", "canyang"]);
    expect(defend.equipped).toEqual(["lundao", "huagu", "zhumo", "yaoguang"]);
  });

  it("caps artifacts at one attack, one defend, and two utility slots", () => {
    const owned = ["qixing", "yaoguang", "lundao", "huagu", "taixu", "zhumo", "canyang"];
    let state = { ...bootFaction(), ownedArtifacts: owned, equipped: [] };

    for (const id of owned) state = reduce(state, { type: "EQUIP_ARTIFACT", artifactId: id });

    expect(state.equipped).toEqual(["yaoguang", "huagu", "taixu", "canyang"]);
    expect(slotUsage(state.equipped)).toEqual({ attack: 1, defend: 1, util: 2 });
  });

  it("forfeits only uncollected output after a failed beast wave", () => {
    const resources = { qi: 50, herb: 100, wood: 80, ore: 40, stone: 70, pills: 3, jade: 5 };
    const state = {
      ...bootFaction(),
      resources,
      meta: { ...bootFaction().meta, lastTick: 10_000 },
      offline: { pending: { herb: 12, qi: 30 }, seconds: 900, at: 10_000 },
      wave: { wave: 4, best: 2 },
      combat: { kind: "wave", result: { winner: "b", wave: 4 } },
    };

    const next = reduce(state, { type: "RESOLVE_COMBAT", now: 11_000 });

    expect(next.resources).toEqual(resources);
    expect(next.offline.pending).toBeNull();
    expect(next.meta.lastTick).toBe(11_000);
    expect(next.wave).toEqual(state.wave);
    expect(next.combat).toBeNull();
    expect(next.log[0].text).toContain("灵草");
  });

  it("keeps an empty larder harmless when a beast wave is lost", () => {
    const base = bootFaction();
    const state = {
      ...base,
      buildings: [],
      realm: { index: 0, layer: 1, exp: 0, heartDemon: 0 },
      meta: { ...base.meta, lastTick: 11_000 },
      offline: { pending: null, seconds: 0, at: 0 },
      combat: { kind: "wave", result: { winner: "b", wave: 2 } },
    };

    const next = reduce(state, { type: "RESOLVE_COMBAT", now: 11_000 });

    expect(next.resources).toEqual(state.resources);
    expect(waveLossTax(state, 11_000).total).toBeNull();
    expect(next.log[0].text).toContain("此败只失一波所得");
  });

  it("reads artifact drop nodes from the data table", () => {
    const towerFive = { ...bootFaction(), tower: { floor: 5, best: 4 }, combat: { kind: "tower", result: { winner: "a", floor: 5 } } };
    const waveFive = { ...bootFaction(), wave: { wave: 5, best: 4 }, combat: { kind: "wave", result: { winner: "a", wave: 5 } } };

    const tower = reduce(towerFive, { type: "RESOLVE_COMBAT", now: 1 });
    const wave = reduce(waveFive, { type: "RESOLVE_COMBAT", now: 1 });

    for (const drop of ARTIFACT_DROPS.filter((d) => d.via === "tower" && d.at <= 5)) {
      expect(tower.ownedArtifacts).toContain(drop.id);
    }
    for (const drop of ARTIFACT_DROPS.filter((d) => d.via === "wave" && d.at <= 5)) {
      expect(wave.ownedArtifacts).toContain(drop.id);
    }
    for (const drop of ARTIFACT_DROPS.filter((d) => d.at > 5)) {
      expect(tower.ownedArtifacts).not.toContain(drop.id);
      expect(wave.ownedArtifacts).not.toContain(drop.id);
    }
  });

  it("banks offline output through the array-driven efficiency instead of full rate", () => {
    const base = bootFaction();
    const state = { ...base, meta: { ...base.meta, lastTick: 1_000 } };
    const hours = 2;
    const now = 1_000 + hours * 3600 * 1000;

    const booted = reduce(state, { type: "BOOT", loaded: state, now });
    const efficiency = offlineEfficiency(state);

    expect(efficiency).toBeCloseTo(0.56);
    expect(booted.offline.pending.qi).toBeCloseTo(produce(state, hours * 3600).qi * efficiency);
    expect(booted.log[0].text).toContain("56%");
  });

  it("never persists a full combat transcript", () => {
    const state = bootFaction();
    const result = simulate({
      seed: 3,
      heroIds: state.party,
      foes: towerEnemy(3).foes,
      state,
      equipped: state.equipped,
    });

    const snapshot = snapshotForSave({ ...state, combat: { kind: "tower", result } });

    expect(result.frames.length).toBeGreaterThan(1);
    expect(snapshot.combat.result.frames).toHaveLength(1);
    expect(JSON.stringify(snapshot).length).toBeLessThan(8_000);
  });
});
