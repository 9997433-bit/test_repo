/**
 * 塔目录 / 局内常量。
 *
 * 塔 id 与顺序由 Round 1 简报冻结：rail prism scatter well star。
 * 名称、价格、说明优先取 `src/data`（Fable-3 所有），取不到时用本文件的兜底值，
 * 这样 UI 在数据表写完之前也能挂载。
 *
 * 纯数据模块：不碰 DOM、不碰 Babylon（`src/input` 也会 import 它）。
 */
import * as DATA from "../data/index.js";

/** 停靠栏顺序 = 数字键 1..5 顺序。 */
export const TOWER_ORDER = Object.freeze(["rail", "prism", "scatter", "well", "star"]);

const FALLBACK_TOWERS = Object.freeze({
  rail: { name: "轨炮", tip: "单体直射，弹速快" },
  prism: { name: "棱镜", tip: "折射光束，可在棱镜之间折返" },
  scatter: { name: "霰星", tip: "扇形散射，压制密集目标" },
  well: { name: "坠井", tip: "引力井减速，控场" },
  star: { name: "星弩", tip: "远程重击，单发高伤" },
});

const TABLE_KEYS = ["TOWERS", "towers", "TOWER_TABLE", "towerTable"];
const NAME_KEYS = ["name", "label", "title", "cn", "zh"];
const COST_KEYS = ["cost", "price", "scrap", "buildCost", "baseCost"];
const TIP_KEYS = ["tip", "desc", "description", "blurb", "role"];

function firstValue(obj, keys) {
  if (!obj || typeof obj !== "object") return undefined;
  for (const key of keys) {
    const value = obj[key];
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return undefined;
}

function toFinite(value, fallback = null) {
  const n = typeof value === "string" ? Number(value) : value;
  return Number.isFinite(n) ? n : fallback;
}

function towerTable() {
  const roots = [DATA, DATA?.default, DATA?.CONFIG, DATA?.config];
  for (const root of roots) {
    if (!root || typeof root !== "object") continue;
    for (const key of TABLE_KEYS) {
      const table = root[key];
      if (Array.isArray(table) && table.length > 0) return table;
      if (table && typeof table === "object" && Object.keys(table).length > 0) return table;
    }
  }
  return null;
}

function tableEntry(table, id) {
  if (!table) return null;
  if (Array.isArray(table)) {
    return table.find((entry) => entry && (entry.id === id || entry.key === id || entry.type === id)) ?? null;
  }
  const entry = table[id];
  return entry && typeof entry === "object" ? entry : null;
}

function entryCost(entry) {
  const direct = toFinite(firstValue(entry, COST_KEYS));
  if (direct !== null) return direct;
  const levels = entry?.levels ?? entry?.tiers ?? entry?.upgrades;
  if (Array.isArray(levels) && levels.length > 0) {
    return toFinite(firstValue(levels[0], COST_KEYS));
  }
  return null;
}

/**
 * @returns {{id:string,index:number,key:string,name:string,tip:string,cost:number|null}[]}
 *   `cost` 为 null 表示数据表还没给价，UI 不显示价格也不做买得起判定。
 */
export function getTowerCatalog() {
  const table = towerTable();
  return TOWER_ORDER.map((id, index) => {
    const entry = tableEntry(table, id);
    const fallback = FALLBACK_TOWERS[id];
    return {
      id,
      index,
      key: String(index + 1),
      name: String(firstValue(entry, NAME_KEYS) ?? fallback.name),
      tip: String(firstValue(entry, TIP_KEYS) ?? fallback.tip),
      cost: entryCost(entry),
    };
  });
}

/** 数字键 1..5 → 塔 id。越界返回 null。 */
export function towerIdByIndex(index) {
  return TOWER_ORDER[index] ?? null;
}

/** HUD 需要的局内常量，同样是「有数据用数据，没有用兜底」。 */
export function getMeta() {
  const config = DATA?.CONFIG ?? DATA?.config ?? {};
  const waves = DATA?.WAVES ?? DATA?.waves ?? config.waves;
  const waveTotal =
    toFinite(config.waveCount) ??
    toFinite(config.waveTotal) ??
    (Array.isArray(waves) ? waves.length : null) ??
    20;
  return {
    socketCount: toFinite(config.socketCount, 24),
    coreMax: toFinite(config.coreHp ?? config.coreMax, 20),
    startScrap: toFinite(config.startScrap, 180),
    waveTotal,
  };
}
