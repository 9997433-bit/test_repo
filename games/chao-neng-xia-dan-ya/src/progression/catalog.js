/**
 * 数据表读取适配（Opus-3 所有权）。
 *
 * `src/data/**` 由 Fable-3 持续扩表，脚手架期只有 5 只英雄。
 * 为了让养成层在扩表前后都能工作，这里提供三级解析：
 *   1. `registerHeroDefs()` 注入的名册（主循环启动时把自己的名册喂进来）
 *   2. `src/data` 的权威表（字段逐项覆盖注入值）
 *   3. 调用方直接传入的 def 对象（见 heroes/squad.js 的 sanitizeRoster）
 */
import * as DATA from "../data/index.js";
import { DEX_FALLBACK_TOTALS } from "./constants.js";

const REGISTRY = new Map();

function asRecord(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : null;
}

/**
 * 注入外部名册。`src/data` 中同名字段优先，因此 Fable-3 扩表后自动接管。
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
  return asRecord(DATA.HEROES) ?? {};
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

function sizeOf(keys, fallback) {
  for (const key of keys) {
    const value = DATA[key];
    if (Array.isArray(value) && value.length) return value.length;
    const record = asRecord(value);
    if (record && Object.keys(record).length) return Object.keys(record).length;
  }
  return fallback;
}

/** 图鉴分母。数据表未就绪时退回 GDD 规划规模，避免加成随扩表回跳。 */
export function dexTotals() {
  return {
    heroes: Math.max(heroList().length, DEX_FALLBACK_TOTALS.heroes),
    enemies: Math.max(sizeOf(["ENEMY_LIST", "ENEMIES", "ENEMY_TYPES"], 0), DEX_FALLBACK_TOTALS.enemies),
    artifacts: Math.max(sizeOf(["ARTIFACT_LIST", "ARTIFACTS"], 0), DEX_FALLBACK_TOTALS.artifacts),
    fish: Math.max(sizeOf(["FISH_LIST", "FISH"], 0), DEX_FALLBACK_TOTALS.fish),
  };
}
