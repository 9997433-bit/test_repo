/**
 * 存档适配层（Opus-3 所有权）。
 *
 * `src/core/store.js` 归 Opus-4，本文件只读它的 `defaultSave()` 形状，
 * 并遵守它已经定下的字段语义：
 *   - `dex` 是扁平的 `{ heroId: true }`（`normalizeSave` 会按 `owned` 回填，
 *     `core/catalog.computeRaceTech` 也按这个形状读），因此**不能**改成分类结构；
 *   - `fishBuff` 是单条临时 BUFF `{ kind, value, name, battles }`。
 *
 * 养成层需要的额外维度放进自己的命名空间 `dexEntries` / `fishing`，
 * 只新增不覆盖，`writeSave()` 整体序列化即可持久化。
 */
import { defaultSave } from "../core/store.js";
import {
  MAX_LEVEL,
  MAX_STAR,
  MIN_LEVEL,
  MIN_STAR,
  clampInt,
  levelCapForStar,
} from "./constants.js";

export const PROGRESSION_VERSION = 1;

/** 图鉴分类。heroes 存在扁平 `save.dex`，其余存在 `save.dexEntries`。 */
export const DEX_CATEGORIES = ["heroes", "enemies", "artifacts", "fish"];
export const EXTRA_DEX_CATEGORIES = ["enemies", "artifacts", "fish"];

export const DEX_SEEN = 1;
export const DEX_OWNED = 2;

function isPlainObject(value) {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

export function normalizeDexState(state) {
  if (state === true) return DEX_OWNED;
  if (state === false || state == null) return 0;
  const n = Math.floor(Number(state));
  if (!Number.isFinite(n) || n <= 0) return 0;
  return n >= DEX_OWNED ? DEX_OWNED : DEX_SEEN;
}

function normalizeCounterMap(raw) {
  const out = {};
  if (!isPlainObject(raw)) return out;
  for (const [id, value] of Object.entries(raw)) {
    const n = Math.floor(Number(value));
    if (Number.isFinite(n) && n > 0) out[id] = n;
  }
  return out;
}

/**
 * 补齐养成所需字段并夹紧越界数值。原地修改并返回同一对象，
 * 使 `loadSave()` 得到的引用可以继续直接使用。
 */
export function ensureProgression(save) {
  const target = isPlainObject(save) ? save : defaultSave();

  target.progressionVersion = PROGRESSION_VERSION;
  target.gold = Math.max(0, Math.floor(Number(target.gold) || 0));
  target.shards = normalizeCounterMap(target.shards);
  target.heroStars = normalizeStars(target.heroStars);
  target.heroLevels = normalizeLevels(target.heroLevels, target.heroStars);

  // 扁平图鉴保持 store.js 的原状，只做存在性保证。
  if (!isPlainObject(target.dex)) target.dex = {};
  if (!isPlainObject(target.dexEntries)) target.dexEntries = {};
  for (const key of EXTRA_DEX_CATEGORIES) {
    if (!isPlainObject(target.dexEntries[key])) target.dexEntries[key] = {};
  }

  if (!isPlainObject(target.fishing)) target.fishing = {};
  target.fishing.caught = normalizeCounterMap(target.fishing.caught);
  target.fishing.buffs = Array.isArray(target.fishing.buffs) ? target.fishing.buffs : [];
  target.fishing.nextId = Math.max(1, Math.floor(Number(target.fishing.nextId) || 1));
  if (!isPlainObject(target.fishBuff)) target.fishBuff = target.fishBuff ?? null;

  if (!isPlainObject(target.rogue)) target.rogue = {};
  if (!("run" in target.rogue)) target.rogue.run = null;

  if (!Array.isArray(target.roster) || !target.roster.length) target.roster = defaultSave().roster;
  if (!Array.isArray(target.owned)) target.owned = defaultSave().owned ?? [];
  target.adventureStage = Math.max(1, Math.floor(Number(target.adventureStage) || 1));

  return target;
}

function normalizeStars(raw) {
  const out = {};
  if (!isPlainObject(raw)) return out;
  for (const [id, value] of Object.entries(raw)) {
    out[id] = clampInt(value, MIN_STAR, MAX_STAR);
  }
  return out;
}

function normalizeLevels(raw, stars) {
  const out = {};
  if (!isPlainObject(raw)) return out;
  for (const [id, value] of Object.entries(raw)) {
    const cap = levelCapForStar(stars?.[id] ?? MIN_STAR);
    out[id] = clampInt(value, MIN_LEVEL, Math.min(cap, MAX_LEVEL));
  }
  return out;
}

/** 未记录的英雄按 1 级 1 星处理。 */
export function heroLevelOf(save, heroId) {
  return clampInt(save?.heroLevels?.[heroId] ?? MIN_LEVEL, MIN_LEVEL, MAX_LEVEL);
}

export function heroStarOf(save, heroId) {
  return clampInt(save?.heroStars?.[heroId] ?? MIN_STAR, MIN_STAR, MAX_STAR);
}

export function shardsOf(save, heroId) {
  const n = Math.floor(Number(save?.shards?.[heroId] ?? 0));
  return Number.isFinite(n) && n > 0 ? n : 0;
}

export function addShards(save, heroId, amount) {
  const target = ensureProgression(save);
  const delta = Math.floor(Number(amount) || 0);
  target.shards[heroId] = Math.max(0, shardsOf(target, heroId) + delta);
  return target.shards[heroId];
}

export function addGold(save, amount) {
  const target = ensureProgression(save);
  target.gold = Math.max(0, target.gold + Math.floor(Number(amount) || 0));
  return target.gold;
}

export function isHeroOwned(save, heroId) {
  const owned = save?.owned;
  if (!Array.isArray(owned) || !owned.length) return true;
  return owned.includes(heroId);
}
