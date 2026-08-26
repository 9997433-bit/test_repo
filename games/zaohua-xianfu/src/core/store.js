import { BUILDING_TYPES, GRID_SIZE, upgradeCost, buildCost, mansionCap } from "../data/buildings.js";
import { STARTER, heroById } from "../data/heroes.js";
import { STARTER_ARTIFACTS, ARTIFACTS } from "../data/artifacts.js";
import { canPlace, countType } from "../mansion/layout.js";
import { produce, applyYield } from "../mansion/production.js";
import { makeDisciple, trainCost, canTrain, applyTrain } from "../disciples/roster.js";
import { scriptureXp } from "../disciples/train.js";
import { breakthroughChance, applyCultivate, applyBreakthrough, canCultivate } from "../progression/realm.js";
import { challengeTower, towerReward } from "../combat/tower.js";
import { challengeWave, waveReward } from "../combat/wave.js";
import { loadSave, writeSave, clearSave } from "./save.js";

let bid = 1;

export function defaultState() {
  return {
    schemaVersion: 1,
    meta: { faction: null, name: "", startedAt: 0, lastTick: 0 },
    resources: { qi: 40, herb: 20, wood: 24, ore: 18, stone: 60, pills: 2, jade: 4 },
    buildings: [],
    disciples: [],
    unlockedHeroes: [],
    party: [],
    ownedArtifacts: [...STARTER_ARTIFACTS],
    equipped: [...STARTER_ARTIFACTS],
    realm: { index: 0, layer: 1, exp: 0, heartDemon: 0 },
    tower: { floor: 1, best: 0 },
    wave: { wave: 1, best: 0 },
    combat: null,
    offline: { pending: null },
    log: [],
  };
}

function pushLog(state, text) {
  const log = [{ at: Date.now(), text }, ...state.log].slice(0, 40);
  return { ...state, log };
}

function pay(res, cost) {
  const next = { ...res };
  for (const [k, v] of Object.entries(cost)) {
    if ((next[k] ?? 0) < v) return null;
    next[k] -= v;
  }
  return next;
}

function addRes(res, add) {
  const next = { ...res };
  for (const [k, v] of Object.entries(add ?? {})) {
    if (k === "loseTax") continue;
    next[k] = (next[k] ?? 0) + v;
  }
  return next;
}

function mansionLevel(state) {
  return state.buildings.find((b) => b.type === "mansion")?.level ?? 1;
}

export function reduce(state, action) {
  switch (action.type) {
    case "BOOT": {
      const loaded = action.loaded ?? loadSave();
      const now = action.now ?? Date.now();
      if (!loaded) return { ...defaultState(), meta: { ...defaultState().meta, lastTick: now } };
      const elapsed = Math.min(8 * 3600, Math.max(0, (now - (loaded.meta?.lastTick ?? now)) / 1000));
      const yieldAdd = produce(loaded, elapsed);
      return {
        ...loaded,
        offline: { pending: elapsed > 8 ? yieldAdd : null },
        meta: { ...loaded.meta, lastTick: now },
        resources: elapsed > 8 ? loaded.resources : applyYield(loaded.resources, yieldAdd),
      };
    }
    case "CHOOSE_FACTION": {
      if (state.meta.faction) return state;
      const faction = action.faction;
      const starters = STARTER[faction];
      const now = action.now ?? Date.now();
      const disciples = starters.map((id, i) =>
        makeDisciple(id, {
          id: `d-${id}`,
          diligent: 14 + i * 2,
          force: 12 + i * 3,
          profession: 1,
        }),
      );
      const buildings = [
        { id: "b-mansion", type: "mansion", level: 1, x: 2, y: 2 },
        { id: "b-array", type: "array", level: 1, x: 3, y: 2 },
        { id: "b-field", type: "field", level: 1, x: 2, y: 3 },
      ];
      bid = 10;
      return pushLog(
        {
          ...state,
          meta: { faction, name: action.name || "无名仙尊", startedAt: now, lastTick: now },
          buildings,
          disciples,
          unlockedHeroes: [...starters],
          party: starters.slice(0, 6),
        },
        `${FACTION_NAME[faction]}开府，仙途自此始。`,
      );
    }
    case "TICK": {
      if (!state.meta.faction) return state;
      const dt = Math.min(2, action.dt ?? 0.1);
      const now = action.now ?? Date.now();
      let resources = applyYield(state.resources, produce(state, dt));
      const disciples = scriptureXp(state, dt);
      return { ...state, resources, disciples, meta: { ...state.meta, lastTick: now } };
    }
    case "BUILD": {
      const { buildingType: type, x, y } = action;
      const def = BUILDING_TYPES[type];
      if (!def || !state.meta.faction) return state;
      if (!canPlace(state.buildings, x, y)) return state;
      if (def.unique && countType(state.buildings, type)) return state;
      const cap = mansionCap(mansionLevel(state));
      if (state.buildings.length >= cap.plots) return pushLog(state, "地块已满，先升洞府仙居。");
      if ((def.unlockAt ?? 1) > mansionLevel(state)) return pushLog(state, "洞府等级不足，未解锁此建筑。");
      const cost = buildCost(type);
      const paid = pay(state.resources, cost);
      if (!paid) return pushLog(state, "资源不足，营造中止。");
      const building = { id: `b-${bid++}`, type, level: 1, x, y };
      return pushLog(
        { ...state, resources: paid, buildings: [...state.buildings, building] },
        `新成${def.name}。`,
      );
    }
    case "UPGRADE": {
      const b = state.buildings.find((x) => x.id === action.id);
      if (!b) return state;
      const cap = mansionCap(mansionLevel(state));
      if (b.level >= cap.maxBuildingLevel && b.type !== "mansion") {
        return pushLog(state, "先升洞府仙居，方可再升此楼。");
      }
      if (b.type === "mansion" && b.level >= 12) return state;
      const cost = upgradeCost(b.type, b.level + 1);
      const paid = pay(state.resources, cost);
      if (!paid) return pushLog(state, "资源不足，无法升级。");
      const buildings = state.buildings.map((x) => (x.id === b.id ? { ...x, level: x.level + 1 } : x));
      return pushLog({ ...state, resources: paid, buildings }, `${BUILDING_TYPES[b.type].name}升至 ${b.level + 1} 级。`);
    }
    case "ASSIGN": {
      const disciples = state.disciples.map((d) =>
        d.id === action.discipleId
          ? { ...d, buildingId: action.buildingId }
          : action.buildingId && d.buildingId === action.buildingId
            ? { ...d, buildingId: null }
            : d,
      );
      return { ...state, disciples };
    }
    case "RECRUIT": {
      const hero = heroById(action.heroId);
      if (!hero || state.unlockedHeroes.includes(hero.id)) return state;
      const cost = { jade: 6 + (hero.role === "dps" ? 2 : 0), stone: 40 };
      const paid = pay(state.resources, cost);
      if (!paid) return pushLog(state, "仙玉或灵石不足，仙友未至。");
      const disciples = [...state.disciples, makeDisciple(hero.id, { id: `d-${hero.id}` })];
      const party = state.party.length < 6 ? [...state.party, hero.id] : state.party;
      return pushLog(
        { ...state, resources: paid, disciples, unlockedHeroes: [...state.unlockedHeroes, hero.id], party },
        `${hero.name}入府。`,
      );
    }
    case "TRAIN": {
      const d = state.disciples.find((x) => x.id === action.discipleId);
      if (!d || !canTrain(state.resources, d)) return pushLog(state, "丹药或灵草不足。");
      const cost = trainCost(d.profession);
      const paid = pay(state.resources, cost);
      const disciples = state.disciples.map((x) => (x.id === d.id ? applyTrain(x) : x));
      return pushLog({ ...state, resources: paid, disciples }, `${d.name}专业升至 ${d.profession + 1}。`);
    }
    case "CULTIVATE": {
      if (!canCultivate(state)) return state;
      const patch = applyCultivate(state);
      return { ...state, ...patch };
    }
    case "BREAKTHROUGH": {
      const chance = breakthroughChance(state);
      if (chance <= 0) return pushLog(state, "修为未满，不可破境。");
      const rng = action.rng ?? Math.random;
      const result = applyBreakthrough(state, rng);
      if (result.ok) return pushLog(result.state, "破境成功，天地为之侧目。");
      return pushLog(result.state, "心魔反噬，破境失败。下次更稳。");
    }
    case "SET_PARTY": {
      const ids = (action.heroIds ?? []).filter((id) => state.unlockedHeroes.includes(id)).slice(0, 6);
      const mc = state.unlockedHeroes.find((id) => id.startsWith("mc-"));
      if (mc && !ids.includes(mc)) ids.unshift(mc);
      return { ...state, party: ids.slice(0, 6) };
    }
    case "EQUIP_ARTIFACT": {
      const id = action.artifactId;
      if (!state.ownedArtifacts.includes(id)) return state;
      let equipped = state.equipped.filter((x) => x !== id);
      if (equipped.length >= 4) equipped = equipped.slice(1);
      equipped = [...equipped, id];
      return { ...state, equipped };
    }
    case "START_TOWER": {
      const result = challengeTower(state, action.now ?? Date.now());
      return { ...state, combat: { kind: "tower", result } };
    }
    case "START_WAVE": {
      const result = challengeWave(state, action.now ?? Date.now());
      return { ...state, combat: { kind: "wave", result } };
    }
    case "RESOLVE_COMBAT": {
      const c = state.combat;
      if (!c) return state;
      const win = c.result.winner === "a";
      if (c.kind === "tower") {
        const reward = towerReward(c.result.floor, win);
        let tower = { ...state.tower };
        let owned = state.ownedArtifacts;
        if (win) {
          tower = { floor: tower.floor + 1, best: Math.max(tower.best, tower.floor) };
          if (tower.best === 5 && !owned.includes("zhumo")) owned = [...owned, "zhumo"];
          if (tower.best === 10 && !owned.includes("wanhun")) owned = [...owned, "wanhun"];
          if (tower.best === 15 && !owned.includes("zhuque")) owned = [...owned, "zhuque"];
        }
        return pushLog(
          { ...state, resources: addRes(state.resources, reward), tower, ownedArtifacts: owned, combat: null },
          win ? `登天塔第 ${c.result.floor} 层已破。` : "此层未克，且回府再炼。",
        );
      }
      const reward = waveReward(c.result.wave, win, state.resources);
      let resources = state.resources;
      let wave = { ...state.wave };
      if (win) {
        resources = addRes(resources, reward);
        wave = { wave: wave.wave + 1, best: Math.max(wave.best, wave.wave) };
        let owned = state.ownedArtifacts;
        if (wave.best === 5 && !owned.includes("canyang")) owned = [...owned, "canyang"];
        if (wave.best === 8 && !owned.includes("yaoguang")) owned = [...owned, "yaoguang"];
        return pushLog({ ...state, resources, wave, ownedArtifacts: owned, combat: null }, `兽潮第 ${c.result.wave} 波已退。`);
      }
      const tax = reward.loseTax ?? {};
      resources = {
        ...resources,
        herb: Math.max(0, resources.herb - (tax.herb ?? 0)),
        wood: Math.max(0, resources.wood - (tax.wood ?? 0)),
        ore: Math.max(0, resources.ore - (tax.ore ?? 0)),
      };
      return pushLog({ ...state, resources, combat: null }, "兽潮破门，散失三成未入库资源。");
    }
    case "COLLECT_OFFLINE": {
      if (!state.offline?.pending) return state;
      return {
        ...state,
        resources: applyYield(state.resources, state.offline.pending),
        offline: { pending: null },
      };
    }
    case "RESET": {
      clearSave();
      return defaultState();
    }
    default:
      return state;
  }
}

const FACTION_NAME = { mortal: "人族", divine: "神族", demon: "魔族" };

export function createStore() {
  let state = defaultState();
  const subs = new Set();
  const persist = () => writeSave(state);
  let lastPersist = 0;

  return {
    get: () => state,
    dispatch(action) {
      state = reduce(state, action);
      const now = action.now ?? Date.now();
      if (action.type !== "TICK" || now - lastPersist > 4000) {
        persist();
        lastPersist = now;
      }
      for (const fn of subs) fn(state, action);
      return state;
    },
    subscribe(fn) {
      subs.add(fn);
      return () => subs.delete(fn);
    },
  };
}

export const ALL_ARTIFACTS = ARTIFACTS;
export const GRID = GRID_SIZE;
