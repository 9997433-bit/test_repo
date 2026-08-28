// 数值来源：优先 src/data（F3 拥有），缺失字段用本地兜底常量补齐。
// 兜底常量与 round1/BRIEF.md 冻结值一致；data 一旦导出同名表就自动接管。
import * as DATA from "../data/index.js";

export const FALLBACK_CONFIG = {
  socketCount: 24,
  ringRadius: 40,
  coreHp: 20,
  startScrap: 180,
  lanes: [0, 1, 2],
  laneY: [0, 4, 9],
  spawnRadius: 52,
  coreRadius: 8,
  waveCount: 20,
  firstPrepSec: 8,
  prepSec: 5,
  overclockSec: 4,
  overclockMul: 2.2,
  overheatSec: 3,
  prismBendRadius: 18,
  prismMaxSegments: 2,
  prismRelayFactor: 0.7,
};

export const FALLBACK_TOWERS = {
  // dmg = 单发基础伤害，cd = 冷却秒，range = 从插座起算的三维射程
  rail: {
    id: "rail",
    name: "轨炮",
    cost: 60,
    dmg: 34,
    cd: 1.35,
    range: 46,
    projSpeed: 90,
    targeting: "first",
    splash: 0,
    shotKind: "rail",
  },
  prism: {
    id: "prism",
    name: "棱镜",
    cost: 80,
    dmg: 19,
    cd: 0.75,
    range: 40,
    projSpeed: 300,
    targeting: "nearest",
    splash: 0,
    shotKind: "prism",
  },
  scatter: {
    id: "scatter",
    name: "霰星",
    cost: 55,
    dmg: 11,
    cd: 0.9,
    range: 32,
    projSpeed: 46,
    targeting: "cluster",
    splash: 7,
    shotKind: "scatter",
  },
  well: {
    id: "well",
    name: "坠井",
    cost: 70,
    dmg: 5,
    cd: 1.6,
    range: 30,
    projSpeed: 34,
    targeting: "fastest",
    splash: 9,
    shotKind: "well",
    fieldRadius: 11,
    fieldSec: 2.8,
    slowMul: 0.55,
    pullRate: 0.9,
    pullMax: 1.6,
  },
  star: {
    id: "star",
    name: "星弩",
    cost: 95,
    dmg: 52,
    cd: 2,
    range: 60,
    projSpeed: 58,
    targeting: "strongest",
    splash: 0,
    shotKind: "star",
    homing: true,
  },
};

// 克制表：塔 -> 护甲乘子。data 提供时整体覆盖。
export const FALLBACK_COUNTERS = {
  rail: { shell: 1.6, shield: 0.85, swarm: 0.7 },
  prism: { shell: 0.7, shield: 1.7, swarm: 0.95 },
  scatter: { shell: 0.6, shield: 0.8, swarm: 1.8 },
  well: { shell: 1, shield: 1, swarm: 1 },
  star: { shell: 1, shield: 1.35, swarm: 0.8 },
};

export const FALLBACK_ENEMIES = {
  small: { kind: "small", armor: "swarm", hp: 26, speed: 3.4, scrap: 6, leak: 1, size: 1 },
  mid: { kind: "mid", armor: "shell", hp: 72, speed: 2.4, scrap: 12, leak: 3, size: 1.5 },
  elite: { kind: "elite", armor: "shield", hp: 190, speed: 1.7, scrap: 26, leak: 8, size: 2.2 },
  "etch-lord": { kind: "etch-lord", armor: "shell", hp: 2600, speed: 1, scrap: 260, leak: 20, size: 4 },
};

const TOWER_ORDER = ["rail", "prism", "scatter", "well", "star"];

function isObj(v) {
  return v !== null && typeof v === "object";
}

function num(value, fallback) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

/** 从若干别名里取第一个可用数值，方便对齐 data 层可能的命名。 */
function pickNum(source, keys, fallback) {
  if (!isObj(source)) return fallback;
  for (const key of keys) {
    if (typeof source[key] === "number" && Number.isFinite(source[key])) return source[key];
  }
  return fallback;
}

function pickStr(source, keys, fallback) {
  if (!isObj(source)) return fallback;
  for (const key of keys) {
    if (typeof source[key] === "string" && source[key]) return source[key];
  }
  return fallback;
}

function firstObj(...candidates) {
  for (const c of candidates) if (isObj(c)) return c;
  return null;
}

/** data 里塔表可能是对象映射，也可能是数组。 */
function asMap(source, keyName = "id") {
  if (!isObj(source)) return null;
  if (Array.isArray(source)) {
    const map = {};
    for (const entry of source) {
      if (isObj(entry) && typeof entry[keyName] === "string") map[entry[keyName]] = entry;
    }
    return Object.keys(map).length ? map : null;
  }
  return source;
}

export function resolveConfig() {
  const raw = firstObj(DATA.CONFIG, DATA.SIM_CONFIG, DATA.BALANCE) || {};
  const cfg = { ...FALLBACK_CONFIG };
  cfg.socketCount = Math.max(3, Math.round(pickNum(raw, ["socketCount", "sockets"], cfg.socketCount)));
  cfg.ringRadius = pickNum(raw, ["ringRadius", "ringR", "radius"], cfg.ringRadius);
  cfg.coreHp = pickNum(raw, ["coreHp", "coreHP", "core"], cfg.coreHp);
  cfg.startScrap = pickNum(raw, ["startScrap", "scrap", "startingScrap"], cfg.startScrap);
  cfg.spawnRadius = pickNum(raw, ["spawnRadius", "spawnR"], cfg.spawnRadius);
  cfg.coreRadius = pickNum(raw, ["coreRadius", "coreR", "leakRadius"], cfg.coreRadius);
  cfg.overclockSec = pickNum(raw, ["overclockSec", "overclockTime", "overclockDuration"], cfg.overclockSec);
  cfg.overclockMul = pickNum(raw, ["overclockMul", "overclockDamage", "overclockMultiplier"], cfg.overclockMul);
  cfg.overheatSec = pickNum(raw, ["overheatSec", "overheatTime", "cooldownSec"], cfg.overheatSec);
  cfg.prismBendRadius = pickNum(raw, ["prismBendRadius", "prismBend", "bendRadius"], cfg.prismBendRadius);
  if (Array.isArray(raw.laneY) && raw.laneY.length >= 1 && raw.laneY.every((v) => typeof v === "number")) {
    cfg.laneY = raw.laneY.slice();
  }
  cfg.lanes = cfg.laneY.map((_, i) => i);
  return cfg;
}

export function resolveTowers() {
  const raw = asMap(firstObj(DATA.TOWERS, DATA.TOWER_TYPES, DATA.TOWER_TABLE, DATA.towers));
  const out = {};
  for (const id of TOWER_ORDER) {
    const base = FALLBACK_TOWERS[id];
    const src = raw ? raw[id] : null;
    out[id] = {
      ...base,
      cost: Math.max(0, Math.round(pickNum(src, ["cost", "price", "scrap"], base.cost))),
      dmg: pickNum(src, ["dmg", "damage", "dmgBase", "power"], base.dmg),
      cd: Math.max(0.05, pickNum(src, ["cd", "cooldown", "fireInterval", "interval", "rate"], base.cd)),
      range: pickNum(src, ["range", "radius", "reach"], base.range),
      projSpeed: pickNum(src, ["projSpeed", "projectileSpeed", "bulletSpeed", "speed"], base.projSpeed),
      splash: pickNum(src, ["splash", "aoe", "splashRadius"], base.splash),
      targeting: pickStr(src, ["targeting", "target", "mode"], base.targeting),
      name: pickStr(src, ["name", "label", "title"], base.name),
    };
    if (id === "well") {
      out[id].fieldRadius = pickNum(src, ["fieldRadius", "wellRadius"], base.fieldRadius);
      out[id].fieldSec = pickNum(src, ["fieldSec", "fieldTime", "duration"], base.fieldSec);
      out[id].slowMul = pickNum(src, ["slowMul", "slow"], base.slowMul);
      out[id].pullRate = pickNum(src, ["pullRate", "pull"], base.pullRate);
      out[id].pullMax = pickNum(src, ["pullMax"], base.pullMax);
    }
  }
  return out;
}

export function resolveCounters() {
  const raw = firstObj(DATA.COUNTERS, DATA.COUNTER_TABLE, DATA.ARMOR_TABLE, DATA.ARMOR, DATA.counters);
  const out = {};
  for (const id of TOWER_ORDER) {
    const base = FALLBACK_COUNTERS[id];
    const src = isObj(raw) ? raw[id] : null;
    out[id] = {
      shell: num(isObj(src) ? src.shell : undefined, base.shell),
      shield: num(isObj(src) ? src.shield : undefined, base.shield),
      swarm: num(isObj(src) ? src.swarm : undefined, base.swarm),
    };
  }
  return out;
}

export function resolveEnemies() {
  const raw = asMap(firstObj(DATA.ENEMIES, DATA.ENEMY_TYPES, DATA.MOBS, DATA.enemies), "kind");
  const out = {};
  for (const kind of Object.keys(FALLBACK_ENEMIES)) {
    const base = FALLBACK_ENEMIES[kind];
    const src = raw ? raw[kind] : null;
    out[kind] = {
      ...base,
      hp: Math.max(1, pickNum(src, ["hp", "health", "maxHp"], base.hp)),
      speed: Math.max(0.05, pickNum(src, ["speed", "moveSpeed", "vel"], base.speed)),
      scrap: Math.max(0, pickNum(src, ["scrap", "bounty", "reward"], base.scrap)),
      leak: Math.max(0, pickNum(src, ["leak", "leakDamage", "coreDamage", "damage"], base.leak)),
      armor: pickStr(src, ["armor", "armour", "armorType"], base.armor),
      size: pickNum(src, ["size", "scale"], base.size),
    };
  }
  return out;
}

/** 兜底波表：20 波 + 第 20 波 Boss。与 seed 无关，保证同一波次强度稳定。 */
export function buildFallbackWaves(waveCount) {
  const waves = [];
  for (let n = 1; n <= waveCount; n += 1) {
    const spawns = [];
    const isBoss = n === waveCount && waveCount >= 10;
    const small = 6 + Math.floor(n * 1.9);
    const mid = n >= 3 ? Math.floor((n - 1) * 1.1) : 0;
    const elite = n >= 6 ? Math.floor((n - 4) * 0.7) : 0;
    if (small > 0) spawns.push({ kind: "small", count: small });
    if (mid > 0) spawns.push({ kind: "mid", count: mid });
    if (elite > 0) spawns.push({ kind: "elite", count: elite });
    if (isBoss) spawns.push({ kind: "etch-lord", count: 1 });
    waves.push({
      index: n,
      spawns,
      interval: Math.max(0.3, 0.85 - n * 0.02),
      hpScale: 1 + (n - 1) * 0.12,
      speedScale: 1 + (n - 1) * 0.015,
      bonus: 20 + n * 4,
      boss: isBoss,
    });
  }
  return waves;
}

function normalizeWave(entry, index) {
  if (!isObj(entry)) return null;
  let spawns = [];
  const rawSpawns = Array.isArray(entry.spawns) ? entry.spawns : Array.isArray(entry.groups) ? entry.groups : null;
  if (rawSpawns) {
    for (const s of rawSpawns) {
      if (!isObj(s)) continue;
      const kind = pickStr(s, ["kind", "type", "enemy", "id"], "");
      const count = Math.round(pickNum(s, ["count", "n", "amount"], 0));
      if (kind && count > 0) spawns.push({ kind, count });
    }
  } else {
    for (const kind of ["small", "mid", "elite", "etch-lord"]) {
      const count = Math.round(num(entry[kind], 0));
      if (count > 0) spawns.push({ kind, count });
    }
  }
  if (spawns.length === 0) return null;
  return {
    index,
    spawns,
    interval: Math.max(0.1, pickNum(entry, ["interval", "gap", "spawnInterval"], 0.8)),
    hpScale: pickNum(entry, ["hpScale", "hpMul"], 1),
    speedScale: pickNum(entry, ["speedScale", "speedMul"], 1),
    bonus: pickNum(entry, ["bonus", "reward", "clearScrap"], 20 + index * 4),
    boss: spawns.some((s) => s.kind === "etch-lord"),
  };
}

export function resolveWaves(waveCount) {
  const raw = firstObj(DATA.WAVES, DATA.WAVE_TABLE, DATA.waves);
  if (Array.isArray(raw) && raw.length > 0) {
    const normalized = [];
    for (let i = 0; i < raw.length; i += 1) {
      const wave = normalizeWave(raw[i], i + 1);
      if (!wave) {
        normalized.length = 0;
        break;
      }
      normalized.push(wave);
    }
    if (normalized.length > 0) {
      return waveCount && waveCount < normalized.length ? normalized.slice(0, waveCount) : normalized;
    }
  }
  return buildFallbackWaves(waveCount || FALLBACK_CONFIG.waveCount);
}

export const TOWER_IDS = TOWER_ORDER.slice();
