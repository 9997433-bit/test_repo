import { BUILDING_TYPES, GRID_SIZE, mansionCap } from "../data/buildings.js";
import { FACTIONS, heroById } from "../data/heroes.js";
import { STARTER_ARTIFACTS, artifactById } from "../data/artifacts.js";
import { REALMS } from "../data/realms.js";
import { SCHEMA } from "./save.js";

export const RESOURCE_KEYS = ["qi", "herb", "wood", "ore", "stone", "pills", "jade"];
export const PARTY_SIZE = 6;
/** 四槽不是先来后到的队列：1 攻 + 1 防 + 2 通用，槽型取自 data/artifacts.js 的 slot。 */
export const ARTIFACT_SLOT_CAPS = { attack: 1, defend: 1, util: 2 };
export const ARTIFACT_SLOTS = Object.values(ARTIFACT_SLOT_CAPS).reduce((sum, n) => sum + n, 0);
export const MAX_LOG = 40;
export const MANSION_MAX_LEVEL = 12;
export const MAX_PLOTS = GRID_SIZE * GRID_SIZE;

export function num(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function nonNeg(value, fallback = 0) {
  return Math.max(0, num(value, fallback));
}

export function int(value, fallback = 0) {
  return Math.trunc(num(value, fallback));
}

export function clamp(value, lo, hi) {
  return Math.min(hi, Math.max(lo, value));
}

function uniq(list) {
  return [...new Set(list)];
}

export function defaultState() {
  return {
    schemaVersion: SCHEMA,
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
    offline: { pending: null, seconds: 0, at: 0 },
    log: [],
  };
}

export function emptyYield() {
  return { qi: 0, herb: 0, wood: 0, ore: 0, stone: 0, pills: 0, jade: 0 };
}

/** 只接受资源键上的有限正数，忽略 loseTax 这类描述性字段。 */
export function normalizeYield(raw) {
  if (!raw || typeof raw !== "object") return null;
  const out = {};
  for (const key of RESOURCE_KEYS) {
    const v = num(raw[key], 0);
    if (v > 0) out[key] = v;
  }
  return Object.keys(out).length ? out : null;
}

export function hasGain(add) {
  return Boolean(normalizeYield(add));
}

export function mergeYield(a, b) {
  const left = normalizeYield(a);
  const right = normalizeYield(b);
  if (!left) return right;
  if (!right) return left;
  const out = { ...left };
  for (const [k, v] of Object.entries(right)) out[k] = (out[k] ?? 0) + v;
  return out;
}

/** 支付：不足返回 null，成功返回新资源表（永不为负）。 */
export function pay(resources, cost) {
  const next = { ...resources };
  for (const [k, v] of Object.entries(cost ?? {})) {
    const need = num(v, 0);
    if (need <= 0) continue;
    if (num(next[k], 0) < need) return null;
    next[k] = num(next[k], 0) - need;
  }
  return next;
}

export function addRes(resources, add) {
  const next = { ...resources };
  for (const [k, v] of Object.entries(add ?? {})) {
    if (!RESOURCE_KEYS.includes(k)) continue;
    next[k] = Math.max(0, num(next[k], 0) + num(v, 0));
  }
  return next;
}

export function spendRes(resources, cost) {
  const next = { ...resources };
  for (const [k, v] of Object.entries(cost ?? {})) {
    if (!RESOURCE_KEYS.includes(k)) continue;
    next[k] = Math.max(0, num(next[k], 0) - nonNeg(v, 0));
  }
  return next;
}

/** 建筑 id 由现存建筑推导，避免热重载/读档后计数器归零导致 id 撞车。 */
export function nextBuildingId(buildings) {
  let max = 0;
  for (const b of buildings ?? []) {
    const m = /^b-(\d+)$/.exec(String(b?.id ?? ""));
    if (m) max = Math.max(max, Number(m[1]));
  }
  return `b-${max + 1}`;
}

export function mainHeroId(faction) {
  return faction ? `mc-${faction}` : null;
}

/** 主角锁阵：本阵营主角已解锁时必定占一席，且排在首位。 */
export function normalizeParty(raw, unlockedHeroes, faction) {
  const unlocked = new Set(unlockedHeroes ?? []);
  const ids = uniq((Array.isArray(raw) ? raw : []).filter((id) => unlocked.has(id)));
  const mc = mainHeroId(faction);
  if (mc && unlocked.has(mc)) {
    const rest = ids.filter((id) => id !== mc);
    return [mc, ...rest].slice(0, PARTY_SIZE);
  }
  return ids.slice(0, PARTY_SIZE);
}

/** 未知或缺失槽型的法器归入通用槽，避免装不上也卸不掉。 */
export function artifactSlot(id) {
  const slot = artifactById(id)?.slot;
  return slot && ARTIFACT_SLOT_CAPS[slot] ? slot : "util";
}

export function slotCapacity(slot) {
  return ARTIFACT_SLOT_CAPS[slot] ?? 0;
}

/** 按槽型统计已佩戴数量，UI 与校验共用。 */
export function slotUsage(equipped) {
  const used = {};
  for (const slot of Object.keys(ARTIFACT_SLOT_CAPS)) used[slot] = 0;
  for (const id of equipped ?? []) used[artifactSlot(id)] += 1;
  return used;
}

/**
 * 装备/卸下一件法器：已佩戴则卸下；否则挤掉同槽最早的一件（只在本槽内 FIFO），
 * 不会因为装了第二件攻击法器就把防御位挤没。
 */
export function equipArtifact(equipped, id) {
  const list = Array.isArray(equipped) ? equipped : [];
  if (list.includes(id)) return list.filter((x) => x !== id);
  if (!artifactById(id)) return list;
  const slot = artifactSlot(id);
  const cap = slotCapacity(slot);
  if (cap <= 0) return list;
  const sameSlot = list.filter((x) => artifactSlot(x) === slot);
  const evicted = new Set(sameSlot.slice(0, Math.max(0, sameSlot.length - cap + 1)));
  return [...list.filter((x) => !evicted.has(x)), id];
}

/** 读档收敛：只留拥有的法器，且每槽不超过容量，超出的按出现顺序丢弃。 */
export function normalizeEquipped(raw, ownedArtifacts) {
  const owned = new Set(ownedArtifacts ?? []);
  const used = {};
  const out = [];
  for (const id of uniq(Array.isArray(raw) ? raw : [])) {
    if (!owned.has(id) || !artifactById(id)) continue;
    const slot = artifactSlot(id);
    if ((used[slot] ?? 0) >= slotCapacity(slot)) continue;
    used[slot] = (used[slot] ?? 0) + 1;
    out.push(id);
  }
  return out;
}

function normalizeResources(raw, fallback) {
  const out = { ...fallback };
  if (raw && typeof raw === "object") {
    for (const key of RESOURCE_KEYS) {
      if (raw[key] === undefined) continue;
      out[key] = nonNeg(raw[key], fallback[key]);
    }
  }
  return out;
}

/**
 * 「非洞府建筑等级 ≤ 洞府仙居」这条不变式在读档路径同样成立（AD-22）：
 * 篡改档里的 Lv.99 灵田在此收敛到洞府上限，产量不会按超限等级结算。
 * UPGRADE 路径本就守着同一个上限，正常存档过此函数是恒等变换。
 */
function capBuildingLevels(buildings) {
  const mansion = buildings.find((b) => b.type === "mansion");
  const cap = Math.max(1, int(mansionCap(mansion ? mansion.level : 1).maxBuildingLevel, 1));
  return buildings.map((b) => (b.type !== "mansion" && b.level > cap ? { ...b, level: cap } : b));
}

function normalizeBuildings(raw) {
  if (!Array.isArray(raw)) return [];
  const out = [];
  const ids = new Set();
  const cells = new Set();
  const uniques = new Set();
  for (const b of raw) {
    if (out.length >= MAX_PLOTS) break;
    if (!b || typeof b !== "object") continue;
    const def = BUILDING_TYPES[b.type];
    if (!def) continue;
    const x = int(b.x, -1);
    const y = int(b.y, -1);
    if (x < 0 || y < 0 || x >= GRID_SIZE || y >= GRID_SIZE) continue;
    const cell = `${x},${y}`;
    if (cells.has(cell)) continue;
    if (def.unique) {
      if (uniques.has(b.type)) continue;
      uniques.add(b.type);
    }
    let id = typeof b.id === "string" && b.id ? b.id : "";
    if (!id || ids.has(id)) id = nextBuildingId([...ids].map((taken) => ({ id: taken })));
    const maxLevel = b.type === "mansion" ? MANSION_MAX_LEVEL : 999;
    cells.add(cell);
    ids.add(id);
    out.push({ id, type: b.type, level: clamp(int(b.level, 1), 1, maxLevel), x, y });
  }
  return capBuildingLevels(out);
}

function normalizeDisciples(raw, buildings) {
  if (!Array.isArray(raw)) return [];
  const buildingIds = new Set(buildings.map((b) => b.id));
  const staffed = new Set();
  const seen = new Set();
  const out = [];
  for (const d of raw) {
    if (!d || typeof d !== "object") continue;
    const hero = heroById(d.heroId);
    if (!hero) continue;
    const id = typeof d.id === "string" && d.id ? d.id : `d-${hero.id}`;
    if (seen.has(id)) continue;
    seen.add(id);
    let buildingId = typeof d.buildingId === "string" && buildingIds.has(d.buildingId) ? d.buildingId : null;
    if (buildingId && staffed.has(buildingId)) buildingId = null;
    if (buildingId) staffed.add(buildingId);
    out.push({
      id,
      heroId: hero.id,
      name: typeof d.name === "string" && d.name ? d.name.slice(0, 24) : hero.name,
      diligent: clamp(int(d.diligent, 12), 1, 999),
      force: clamp(int(d.force, 10), 1, 999),
      profession: clamp(int(d.profession, 1), 1, 99),
      xp: nonNeg(d.xp, 0),
      buildingId,
      unlocked: d.unlocked !== false,
    });
  }
  return out;
}

function normalizeRealm(raw) {
  const index = clamp(int(raw?.index, 0), 0, REALMS.length - 1);
  const layers = REALMS[index].layers;
  return {
    index,
    layer: clamp(int(raw?.layer, 1), 1, layers),
    exp: nonNeg(raw?.exp, 0),
    heartDemon: clamp(int(raw?.heartDemon, 0), 0, 99),
  };
}

function normalizeCombat(raw) {
  if (!raw || typeof raw !== "object") return null;
  if (raw.kind !== "tower" && raw.kind !== "wave") return null;
  const result = raw.result;
  if (!result || typeof result !== "object") return null;
  if (!Array.isArray(result.frames) || !result.frames.length) return null;
  if (result.winner !== "a" && result.winner !== "b") return null;
  return raw;
}

function normalizeOffline(raw) {
  const pending = normalizeYield(raw?.pending);
  return {
    pending,
    seconds: pending ? nonNeg(raw?.seconds, 0) : 0,
    at: nonNeg(raw?.at, 0),
  };
}

function normalizeLog(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((entry) => entry && typeof entry.text === "string")
    .slice(0, MAX_LOG)
    .map((entry) => ({ at: nonNeg(entry.at, 0), text: entry.text.slice(0, 200) }));
}

/**
 * 把任意（可能被篡改/半损坏）的存档对象收敛成合法状态：
 * 未知/越界字段回落默认值，引用（派遣、阵容、法器）保证自洽。
 */
export function normalizeState(raw) {
  const base = defaultState();
  if (!raw || typeof raw !== "object") return base;

  const meta = raw.meta && typeof raw.meta === "object" ? raw.meta : {};
  const faction = FACTIONS[meta.faction] ? meta.faction : null;
  const buildings = normalizeBuildings(raw.buildings);
  const unlockedHeroes = uniq((Array.isArray(raw.unlockedHeroes) ? raw.unlockedHeroes : []).filter((id) => heroById(id)));
  const owned = uniq((Array.isArray(raw.ownedArtifacts) ? raw.ownedArtifacts : []).filter((id) => artifactById(id)));
  const ownedArtifacts = owned.length ? owned : [...STARTER_ARTIFACTS];

  return {
    schemaVersion: SCHEMA,
    meta: {
      faction,
      name: typeof meta.name === "string" ? meta.name.slice(0, 24) : "",
      startedAt: nonNeg(meta.startedAt, 0),
      lastTick: nonNeg(meta.lastTick, 0),
    },
    resources: normalizeResources(raw.resources, base.resources),
    buildings,
    disciples: normalizeDisciples(raw.disciples, buildings),
    unlockedHeroes,
    party: normalizeParty(raw.party, unlockedHeroes, faction),
    ownedArtifacts,
    equipped: normalizeEquipped(raw.equipped, ownedArtifacts),
    realm: normalizeRealm(raw.realm),
    tower: { floor: Math.max(1, int(raw.tower?.floor, 1)), best: Math.max(0, int(raw.tower?.best, 0)) },
    wave: { wave: Math.max(1, int(raw.wave?.wave, 1)), best: Math.max(0, int(raw.wave?.best, 0)) },
    combat: normalizeCombat(raw.combat),
    offline: normalizeOffline(raw.offline),
    log: normalizeLog(raw.log),
  };
}

/** 落盘快照：战报帧只留最后一帧，避免存档被回放数据撑爆配额。 */
export function snapshotForSave(state) {
  const frames = state.combat?.result?.frames;
  const combat = Array.isArray(frames) && frames.length
    ? { ...state.combat, result: { ...state.combat.result, frames: frames.slice(-1) } }
    : null;
  return { ...state, combat, log: state.log.slice(0, MAX_LOG) };
}
