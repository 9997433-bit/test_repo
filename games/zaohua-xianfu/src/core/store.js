import { BUILDING_TYPES, GRID_SIZE, upgradeCost, buildCost, mansionCap } from "../data/buildings.js";
import { STARTER, heroById } from "../data/heroes.js";
import { ARTIFACTS } from "../data/artifacts.js";
import { canPlace, countType } from "../mansion/layout.js";
import { produce } from "../mansion/production.js";
import { makeDisciple, trainCost, canTrain, applyTrain } from "../disciples/roster.js";
import { scriptureXp } from "../disciples/train.js";
import { breakthroughChance, applyCultivate, applyBreakthrough, canCultivate } from "../progression/realm.js";
import { challengeTower, towerReward } from "../combat/tower.js";
import { challengeWave, waveReward } from "../combat/wave.js";
import { backupCorrupt, clearSave, readSave, writeSaveDetailed, SAVE_STATUS } from "./save.js";
import { createBus, EVENTS } from "./events.js";
import { OFFLINE_MODE, offlineSummary, settleOffline } from "./offline.js";
import {
  ARTIFACT_SLOTS,
  MANSION_MAX_LEVEL,
  MAX_LOG,
  addRes,
  clamp,
  defaultState,
  int,
  nextBuildingId,
  normalizeParty,
  normalizeState,
  num,
  pay,
  snapshotForSave,
  spendRes,
} from "./state.js";

export { defaultState };

/** TICK 单帧最多推进 2 秒逻辑时间；长空窗走离线结算而不是灌进 TICK。 */
export const MAX_TICK_SEC = 2;
export const PERSIST_INTERVAL_MS = 4000;

const FACTION_NAME = { mortal: "人族", divine: "神族", demon: "魔族" };

const TOWER_ARTIFACTS = [
  [5, "zhumo"],
  [10, "wanhun"],
  [15, "zhuque"],
];
const WAVE_ARTIFACTS = [
  [5, "canyang"],
  [8, "yaoguang"],
];

function pushLog(state, text, at) {
  const stamp = num(at, Date.now());
  const log = [{ at: stamp, text }, ...state.log].slice(0, MAX_LOG);
  return { ...state, log };
}

function mansionLevel(state) {
  return state.buildings.find((b) => b.type === "mansion")?.level ?? 1;
}

function coord(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return -1;
  const i = Math.trunc(n);
  return i >= 0 && i < GRID_SIZE ? i : -1;
}

function grantArtifacts(owned, table, best) {
  let out = owned;
  for (const [need, id] of table) {
    if (best >= need && !out.includes(id)) out = [...out, id];
  }
  return out;
}

function applySettlement(state, settled, now) {
  const next = {
    ...state,
    resources: settled.resources,
    offline: settled.offline,
    meta: { ...state.meta, lastTick: now },
  };
  if (settled.mode !== OFFLINE_MODE.banked) return next;
  return pushLog(next, `离世 ${offlineSummary(settled.offline)}，挂机匣已收妥产出。`, now);
}

export function reduce(state, action) {
  switch (action.type) {
    case "BOOT": {
      const now = num(action.now, Date.now());
      const raw = action.loaded !== undefined ? action.loaded : readSave().state;
      const base = defaultState();
      if (!raw) return { ...base, meta: { ...base.meta, lastTick: now } };
      const loaded = normalizeState(raw);
      return applySettlement(loaded, settleOffline(loaded, now), now);
    }
    /** 页面重新可见/长时间掉帧后补结算，避免这段时间的产出凭空蒸发。 */
    case "RESUME": {
      if (!state.meta.faction) return state;
      const now = num(action.now, Date.now());
      const settled = settleOffline(state, now);
      if (settled.mode === OFFLINE_MODE.idle) return state;
      return applySettlement(state, settled, now);
    }
    case "CHOOSE_FACTION": {
      if (state.meta.faction) return state;
      const faction = action.faction;
      const starters = STARTER[faction];
      if (!starters) return state;
      const now = num(action.now, Date.now());
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
      return pushLog(
        {
          ...state,
          meta: { faction, name: action.name || "无名仙尊", startedAt: now, lastTick: now },
          buildings,
          disciples,
          unlockedHeroes: [...starters],
          party: normalizeParty(starters, starters, faction),
        },
        `${FACTION_NAME[faction]}开府，仙途自此始。`,
        now,
      );
    }
    case "TICK": {
      if (!state.meta.faction) return state;
      const dt = clamp(num(action.dt, 0.1), 0, MAX_TICK_SEC);
      if (dt <= 0) return state;
      const now = Math.max(num(action.now, Date.now()), state.meta.lastTick);
      return {
        ...state,
        resources: addRes(state.resources, produce(state, dt)),
        disciples: scriptureXp(state, dt),
        meta: { ...state.meta, lastTick: now },
      };
    }
    case "BUILD": {
      const type = action.buildingType;
      const def = BUILDING_TYPES[type];
      if (!def || !state.meta.faction) return state;
      const x = coord(action.x);
      const y = coord(action.y);
      if (x < 0 || y < 0) return state;
      if (!canPlace(state.buildings, x, y)) return pushLog(state, "此处已有建筑。", action.now);
      if (def.unique && countType(state.buildings, type)) return state;
      if ((def.unlockAt ?? 1) > mansionLevel(state)) return pushLog(state, "洞府等级不足，未解锁此建筑。", action.now);
      const cap = mansionCap(mansionLevel(state));
      if (state.buildings.length >= cap.plots) return pushLog(state, "地块已满，先升洞府仙居。", action.now);
      const paid = pay(state.resources, buildCost(type));
      if (!paid) return pushLog(state, "资源不足，营造中止。", action.now);
      const building = { id: nextBuildingId(state.buildings), type, level: 1, x, y };
      return pushLog(
        { ...state, resources: paid, buildings: [...state.buildings, building] },
        `新成${def.name}。`,
        action.now,
      );
    }
    case "UPGRADE": {
      const b = state.buildings.find((x) => x.id === action.id);
      if (!b) return state;
      if (b.type === "mansion") {
        if (b.level >= MANSION_MAX_LEVEL) return pushLog(state, "洞府仙居已至绝顶。", action.now);
      } else if (b.level >= mansionCap(mansionLevel(state)).maxBuildingLevel) {
        return pushLog(state, "先升洞府仙居，方可再升此楼。", action.now);
      }
      const paid = pay(state.resources, upgradeCost(b.type, b.level + 1));
      if (!paid) return pushLog(state, "资源不足，无法升级。", action.now);
      const buildings = state.buildings.map((x) => (x.id === b.id ? { ...x, level: x.level + 1 } : x));
      return pushLog(
        { ...state, resources: paid, buildings },
        `${BUILDING_TYPES[b.type].name}升至 ${b.level + 1} 级。`,
        action.now,
      );
    }
    case "ASSIGN": {
      const d = state.disciples.find((x) => x.id === action.discipleId);
      if (!d) return state;
      const buildingId = action.buildingId ?? null;
      if (buildingId && !state.buildings.some((b) => b.id === buildingId)) return state;
      if (d.buildingId === buildingId) return state;
      const disciples = state.disciples.map((x) => {
        if (x.id === d.id) return { ...x, buildingId };
        if (buildingId && x.buildingId === buildingId) return { ...x, buildingId: null };
        return x;
      });
      return { ...state, disciples };
    }
    case "RECRUIT": {
      const hero = heroById(action.heroId);
      if (!hero || !state.meta.faction) return state;
      if (hero.faction !== state.meta.faction) return state;
      if (state.unlockedHeroes.includes(hero.id)) return state;
      const cost = { jade: 6 + (hero.role === "dps" ? 2 : 0), stone: 40 };
      const paid = pay(state.resources, cost);
      if (!paid) return pushLog(state, "仙玉或灵石不足，仙友未至。", action.now);
      const disciples = [...state.disciples, makeDisciple(hero.id, { id: `d-${hero.id}` })];
      const unlockedHeroes = [...state.unlockedHeroes, hero.id];
      const party = normalizeParty([...state.party, hero.id], unlockedHeroes, state.meta.faction);
      return pushLog(
        { ...state, resources: paid, disciples, unlockedHeroes, party },
        `${hero.name}入府。`,
        action.now,
      );
    }
    case "TRAIN": {
      const d = state.disciples.find((x) => x.id === action.discipleId);
      if (!d) return state;
      if (!canTrain(state.resources, d)) return pushLog(state, "丹药或灵草不足。", action.now);
      const paid = pay(state.resources, trainCost(d.profession));
      if (!paid) return pushLog(state, "丹药或灵草不足。", action.now);
      const disciples = state.disciples.map((x) => (x.id === d.id ? applyTrain(x) : x));
      return pushLog({ ...state, resources: paid, disciples }, `${d.name}专业升至 ${d.profession + 1}。`, action.now);
    }
    case "CULTIVATE": {
      if (!canCultivate(state)) return state;
      return { ...state, ...applyCultivate(state) };
    }
    case "BREAKTHROUGH": {
      if (breakthroughChance(state) <= 0) return pushLog(state, "修为未满，不可破境。", action.now);
      const rng = action.rng ?? Math.random;
      const result = applyBreakthrough(state, rng);
      return pushLog(
        result.state,
        result.ok ? "破境成功，天地为之侧目。" : "心魔反噬，破境失败。下次更稳。",
        action.now,
      );
    }
    case "SET_PARTY": {
      const party = normalizeParty(action.heroIds, state.unlockedHeroes, state.meta.faction);
      return { ...state, party };
    }
    case "EQUIP_ARTIFACT": {
      const id = action.artifactId;
      if (!state.ownedArtifacts.includes(id)) return state;
      if (state.equipped.includes(id)) {
        return { ...state, equipped: state.equipped.filter((x) => x !== id) };
      }
      const kept = state.equipped.slice(Math.max(0, state.equipped.length - (ARTIFACT_SLOTS - 1)));
      return { ...state, equipped: [...kept, id] };
    }
    case "START_TOWER": {
      if (!state.meta.faction || !state.party.length) return state;
      const result = challengeTower(state, num(action.now, Date.now()));
      return { ...state, combat: { kind: "tower", result } };
    }
    case "START_WAVE": {
      if (!state.meta.faction || !state.party.length) return state;
      const result = challengeWave(state, num(action.now, Date.now()));
      return { ...state, combat: { kind: "wave", result } };
    }
    case "RESOLVE_COMBAT": {
      const c = state.combat;
      if (!c?.result) return state;
      const win = c.result.winner === "a";
      if (c.kind === "tower") {
        const floor = Math.max(1, int(c.result.floor, state.tower.floor));
        const reward = towerReward(floor, win);
        let tower = state.tower;
        let ownedArtifacts = state.ownedArtifacts;
        if (win) {
          tower = { floor: tower.floor + 1, best: Math.max(tower.best, tower.floor) };
          ownedArtifacts = grantArtifacts(ownedArtifacts, TOWER_ARTIFACTS, tower.best);
        }
        return pushLog(
          { ...state, resources: addRes(state.resources, reward), tower, ownedArtifacts, combat: null },
          win ? `登天塔第 ${floor} 层已破。` : "此层未克，且回府再炼。",
          action.now,
        );
      }
      const waveNo = Math.max(1, int(c.result.wave, state.wave.wave));
      const reward = waveReward(waveNo, win, state.resources);
      if (win) {
        const wave = { wave: state.wave.wave + 1, best: Math.max(state.wave.best, state.wave.wave) };
        return pushLog(
          {
            ...state,
            resources: addRes(state.resources, reward),
            wave,
            ownedArtifacts: grantArtifacts(state.ownedArtifacts, WAVE_ARTIFACTS, wave.best),
            combat: null,
          },
          `兽潮第 ${waveNo} 波已退。`,
          action.now,
        );
      }
      return pushLog(
        { ...state, resources: spendRes(state.resources, reward.loseTax), combat: null },
        "兽潮破门，散失三成未入库资源。",
        action.now,
      );
    }
    case "COLLECT_OFFLINE": {
      const pending = state.offline?.pending;
      if (!pending) return state;
      const now = num(action.now, Date.now());
      return pushLog(
        {
          ...state,
          resources: addRes(state.resources, pending),
          offline: { pending: null, seconds: 0, at: now },
        },
        "挂机匣已开，离线产出尽入库。",
        now,
      );
    }
    case "RESET": {
      const base = defaultState();
      return { ...base, meta: { ...base.meta, lastTick: num(action.now, Date.now()) } };
    }
    default:
      return state;
  }
}

export function createStore(options = {}) {
  const storage = options.storage !== undefined ? options.storage : globalThis.localStorage;
  const events = options.events ?? createBus();
  const persistMs = num(options.persistMs, PERSIST_INTERVAL_MS);
  const subs = new Set();

  let state = defaultState();
  let version = 0;
  let dirty = false;
  let lastPersist = -Infinity;
  let lastFailure = -Infinity;

  function persist(now) {
    const result = writeSaveDetailed(snapshotForSave(state), storage);
    lastPersist = now;
    if (result.ok) {
      dirty = false;
      events.emit(EVENTS.saveWritten, { at: now, bytes: result.bytes });
      return true;
    }
    // 保留 dirty：下一个节流窗口重试，配额恢复后不丢进度。
    lastFailure = now;
    events.emit(EVENTS.saveFailed, { at: now, error: result.error, bytes: result.bytes });
    return false;
  }

  function maybePersist(action, now) {
    if (!dirty) return;
    if (now - lastFailure < persistMs) return;
    if (action.type === "TICK" && now - lastPersist < persistMs) return;
    persist(now);
  }

  function prepareBoot(action) {
    if (action.type !== "BOOT" || action.loaded !== undefined) return action;
    const read = readSave(storage);
    if (read.status === SAVE_STATUS.corrupt || read.status === SAVE_STATUS.unsupported) {
      backupCorrupt(storage);
      events.emit(EVENTS.saveCorrupt, { status: read.status, reason: read.reason });
    }
    return { ...action, loaded: read.state ?? null };
  }

  function announceOffline(prev, next, action) {
    if (action.type === "COLLECT_OFFLINE") {
      if (prev.offline?.pending && !next.offline?.pending) {
        events.emit(EVENTS.offlineCollected, { gained: prev.offline.pending, seconds: prev.offline.seconds ?? 0 });
      }
      return;
    }
    if (action.type !== "BOOT" && action.type !== "RESUME") return;
    if (next.offline?.pending && next.offline.pending !== prev.offline?.pending) {
      events.emit(EVENTS.offlineBanked, { pending: next.offline.pending, seconds: next.offline.seconds ?? 0 });
    } else if (next.resources !== prev.resources) {
      events.emit(EVENTS.offlineApplied, { at: next.meta.lastTick });
    }
  }

  return {
    get: () => state,
    get events() {
      return events;
    },
    version: () => version,
    dispatch(action) {
      if (!action?.type) return state;
      const prepared = prepareBoot(action);
      const prev = state;
      const next = reduce(prev, prepared);
      const changed = next !== prev;
      state = next;
      if (changed) {
        version += 1;
        dirty = true;
      }

      const now = num(prepared.now, Date.now());
      if (action.type === "RESET") {
        clearSave(storage);
        dirty = false;
        lastPersist = now;
        events.emit(EVENTS.saveCleared, { at: now });
      } else {
        maybePersist(prepared, now);
      }

      announceOffline(prev, next, prepared);

      if (changed || action.type === "TICK") {
        for (const fn of [...subs]) {
          try {
            fn(state, prepared);
          } catch (err) {
            events.emit(EVENTS.subscriberError, { error: err, action: prepared.type });
          }
        }
      }
      return state;
    },
    /** 关页/切后台时把节流窗口内的脏状态落盘。 */
    flush() {
      if (!dirty) return false;
      return persist(Date.now());
    },
    subscribe(fn) {
      subs.add(fn);
      return () => subs.delete(fn);
    },
  };
}

export const ALL_ARTIFACTS = ARTIFACTS;
export const GRID = GRID_SIZE;
