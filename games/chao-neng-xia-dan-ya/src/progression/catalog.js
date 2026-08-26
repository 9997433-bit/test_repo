/**
 * 数据表读取适配（Opus-3 所有权）。
 *
 * 名册的唯一权威是 `src/data/heroes.js`（Fable-3 的 18 只英雄表），
 * 本文件不再保留任何内置名册。解析顺序：
 *   1. `src/data` 的权威表（字段逐项覆盖注入值）
 *   2. `registerHeroDefs()` 注入的英雄（尚未落表的新英雄 / 模组 / 测试夹具）
 *   3. 调用方直接传入的 def 对象（见 heroes/squad.js 的 sanitizeRoster）
 *
 * `RESERVED_HERO_IDS`（云朵雀 / 倒霉鸭）是数据表里明确标注「本版本不上场」的预留位，
 * 因此不进名册；确实需要时只能通过 `registerHeroDefs()` 显式注入。
 */
import * as DATA from "../data/index.js";

const REGISTRY = new Map();

function asRecord(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : null;
}

/**
 * 注入外部名册。`src/data` 中同名字段优先，因此权威表始终压过注入值。
 * @param {object[]|Record<string, object>} defs
 */
export function registerHeroDefs(defs) {
  const list = Array.isArray(defs) ? defs : Object.values(asRecord(defs) ?? {});
  for (const def of list) {
    if (def?.id) REGISTRY.set(def.id, def);
  }
  return REGISTRY.size;
}

export function clearHeroRegistry() {
  REGISTRY.clear();
}

function upstreamTable() {
  const table = asRecord(DATA.HEROES) ?? {};
  const reserved = new Set(DATA.RESERVED_HERO_IDS ?? []);
  if (!reserved.size) return table;
  const out = {};
  for (const [id, def] of Object.entries(table)) {
    if (!reserved.has(id)) out[id] = def;
  }
  return out;
}

export function heroTable() {
  const table = {};
  for (const [id, def] of REGISTRY) table[id] = def;
  for (const [id, def] of Object.entries(upstreamTable())) {
    table[id] = table[id] ? { ...table[id], ...def } : def;
  }
  return table;
}

export function heroList() {
  return Object.values(heroTable());
}

export function heroDef(heroId) {
  if (!heroId) return null;
  const upstream = upstreamTable()[heroId];
  const registered = REGISTRY.get(heroId);
  if (upstream && registered) return { ...registered, ...upstream };
  return upstream ?? registered ?? null;
}

export function isKnownHero(heroId) {
  return Boolean(heroDef(heroId));
}

export function heroRace(heroId) {
  return heroDef(heroId)?.race ?? null;
}

function sizeOf(key) {
  const value = DATA[key];
  if (Array.isArray(value)) return value.length;
  const record = asRecord(value);
  return record ? Object.keys(record).length : 0;
}

/** 渔获条目散在各海域的 `catches` 里，按 id 去重后才是图鉴分母。 */
function fishCount() {
  const seas = Array.isArray(DATA.FISHING_SEAS) ? DATA.FISHING_SEAS : [];
  const ids = new Set();
  for (const sea of seas) {
    for (const entry of sea?.catches ?? []) {
      if (entry?.id) ids.add(entry.id);
    }
  }
  return ids.size;
}

/**
 * 图鉴分母，全部按 `src/data` 的实表规模计算。
 * 数据表缺项时返回 0，由 `dex.js` 夹到 1，避免用「规划规模」把收集率永久压在 100% 以下。
 */
export function dexTotals() {
  return {
    heroes: heroList().length,
    enemies: sizeOf("ENEMIES") + sizeOf("BOSSES"),
    artifacts: sizeOf("ARTIFACTS"),
    fish: fishCount(),
  };
}
