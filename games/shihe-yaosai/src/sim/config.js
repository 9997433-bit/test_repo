// 数值来源：只读 src/data 的正式出口（Round 2 冻结）。
//   CONFIG / TOWERS / ENEMIES / WAVES / BOSS / armorMultiplier
// 不再猜 SIM_CONFIG / TOWER_TABLE / ARMOR_TABLE 之类别名——data 是唯一真源，
// 这里只做「schema → 运行时形状」的翻译与有限性兜底（保证 view 里永远不出 NaN）。
import { BOSS, CONFIG, ENEMIES, TOWERS, WAVES, armorMultiplier } from "../data/index.js";

export const TOWER_IDS = ["rail", "prism", "scatter", "well", "star"];
export const ARMOR_TYPES = ["shell", "shield", "swarm"];

// data 未定义、纯属模拟层自持的口径。
export const MUZZLE_Y = 2.4; // 炮口相对插座环平面的高度
export const SOCKET_HP = 100; // R1 敌人不打塔，塔血恒满
export const FIRST_WAVE_SEC = 1.5; // 首波备战：契约要求 ≤2s 必出怪
export const THETA_SPREAD = Math.PI / 6; // 同组出生角散布（契约 §3.8 缺省值）
export const MAX_SHOTS = 128; // 弹道视图上限（纯视觉）

// data 的 TOWERS[].kind → 契约 ShotKind
const SHOT_KIND = {
  hitscan: "tracer",
  beam: "beam",
  burst: "pellet",
  aura: "pulse",
  missile: "arc",
};

// data 的 ENEMIES[].size → 渲染层要的体型系数
const SIZE_SCALE = { small: 1, mid: 1.6, elite: 2.4, boss: 4.2 };

function isObj(v) {
  return v !== null && typeof v === "object";
}

/** 有限数兜底：任何非有限值都换成 fallback，从源头掐死 NaN / Infinity。 */
function fin(value, fallback) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function atLeast(value, fallback, min) {
  const n = fin(value, fallback);
  return n < min ? min : n;
}

function intAtLeast(value, fallback, min) {
  return Math.max(min, Math.round(fin(value, fallback)));
}

function str(value, fallback) {
  return typeof value === "string" && value !== "" ? value : fallback;
}

export function resolveConfig() {
  const oc = isObj(CONFIG.overclock) ? CONFIG.overclock : {};
  const laneY =
    Array.isArray(CONFIG.laneY) && CONFIG.laneY.length > 0 && CONFIG.laneY.every((v) => Number.isFinite(v))
      ? CONFIG.laneY.slice()
      : [0, 4, 9];

  return {
    socketCount: intAtLeast(CONFIG.socketCount, 24, 3),
    ringRadius: atLeast(CONFIG.ringRadius, 40, 1),
    coreHp: atLeast(CONFIG.coreHp, 20, 1),
    startScrap: atLeast(CONFIG.startScrap, 180, 0),
    spawnRadius: atLeast(CONFIG.spawnRadius, 52, 2),
    coreRadius: atLeast(CONFIG.coreRadius, 8, 0),
    laneY,
    lanes: laneY.map((_, i) => i),
    waveCount: intAtLeast(CONFIG.waveCount, 20, 1),
    firstWaveSec: FIRST_WAVE_SEC,
    interWaveSec: atLeast(CONFIG.interWaveDelaySec, 5, 0),
    overclockSec: atLeast(oc.durationSec, 4, 0.1),
    overclockMul: atLeast(oc.multiplier, 2.2, 1),
    overheatSec: atLeast(oc.overheatSec, 3, 0),
    sellRefund: Math.min(1, atLeast(CONFIG.sellRefund, 0.7, 0)),
    muzzleY: MUZZLE_Y,
    socketHp: SOCKET_HP,
  };
}

/**
 * TOWERS[id].levels[k] 是该级的「完整」数值。R1 只用 1 级（levels[0]）。
 * hitscan / burst / missile 用 damage + rate；beam / aura 用 dps。
 */
function resolveLevel(id, def, level) {
  const lv = isObj(def.levels) || Array.isArray(def.levels) ? def.levels[level] : null;
  const src = isObj(lv) ? lv : {};
  const kind = str(def.kind, "hitscan");
  const rate = atLeast(src.rate, 0, 0);
  return {
    id,
    level: level + 1,
    name: str(def.name, id),
    kind,
    shotKind: SHOT_KIND[kind] || "tracer",
    targeting: str(def.targeting, "first"),
    lanes: Array.isArray(def.lanes) ? def.lanes.slice() : null,
    cost: Math.max(0, Math.round(fin(src.cost, 0))),
    range: atLeast(src.range, 1, 0),
    damage: atLeast(src.damage, 0, 0),
    rate,
    cd: rate > 0 ? 1 / rate : 0,
    dps: atLeast(src.dps, 0, 0),
    aoeRadius: atLeast(src.aoeRadius, 0, 0),
    maxTargets: intAtLeast(src.maxTargets, 1, 1),
    pierce: intAtLeast(src.pierce, 1, 1),
    refractRange: atLeast(src.refractRange, 0, 0),
    refractFalloff: Math.min(1, atLeast(src.refractFalloff, 0, 0)),
    slowMul: Math.min(1, Math.max(0.05, 1 - atLeast(src.slowPct, 0, 0))),
    projectileSpeed: atLeast(src.projectileSpeed, 0, 0),
  };
}

export function resolveTowers() {
  const out = {};
  for (const id of TOWER_IDS) {
    const def = isObj(TOWERS[id]) ? TOWERS[id] : {};
    out[id] = resolveLevel(id, def, 0);
  }
  return out;
}

/**
 * 每塔的全部等级（levels[k] 是该级完整数值，不做字段合并）。
 * levels[0].cost = 建造价；levels[k>0].cost = 升到该级的价钱。
 */
export function resolveTowerLevels() {
  const out = {};
  for (const id of TOWER_IDS) {
    const def = isObj(TOWERS[id]) ? TOWERS[id] : {};
    const count = Array.isArray(def.levels) ? Math.max(1, def.levels.length) : 1;
    const levels = [];
    for (let k = 0; k < count; k += 1) levels.push(resolveLevel(id, def, k));
    out[id] = levels;
  }
  return out;
}

/** 克制表由 armorMultiplier() 展开成 5×3 的纯数字表，热路径不再调函数。 */
export function resolveCounters() {
  const out = {};
  for (const towerId of TOWER_IDS) {
    const row = {};
    for (const armor of ARMOR_TYPES) {
      let value = 1;
      try {
        value = armorMultiplier(towerId, armor);
      } catch {
        value = 1;
      }
      row[armor] = atLeast(value, 1, 0);
    }
    out[towerId] = row;
  }
  return out;
}

function normalizeEnemy(def, key, boss) {
  const src = isObj(def) ? def : {};
  const phases = boss && Array.isArray(src.phases) ? src.phases.filter(isObj) : null;
  const sizeClass = str(src.size, boss ? "boss" : "small");
  return {
    kind: str(src.id, key),
    name: str(src.name, key),
    sizeClass,
    scale: fin(SIZE_SCALE[sizeClass], 1),
    armor: str(src.armor, phases && phases.length > 0 ? str(phases[0].armor, "shell") : "shell"),
    hp: atLeast(src.hp, 1, 1),
    speed: atLeast(src.speed, 1, 0.05),
    bounty: Math.max(0, Math.round(fin(src.bounty, 0))),
    leak: Math.max(0, Math.round(fin(src.leak, 1))),
    boss: !!boss,
    lane: Number.isInteger(src.lane) ? src.lane : null,
    phases: phases
      ? phases.map((p) => ({
          hpPct: Math.min(1, Math.max(0, fin(p.hpPct, 1))),
          armor: str(p.armor, "shell"),
          speedMul: atLeast(p.speedMul, 1, 0.05),
          summon: isObj(p.summon)
            ? {
                kind: str(p.summon.enemy, ""),
                count: intAtLeast(p.summon.count, 0, 0),
                lane: Number.isInteger(p.summon.lane) ? p.summon.lane : 0,
                interval: atLeast(p.summon.interval, 0.5, 0),
              }
            : null,
        }))
      : null,
  };
}

export function resolveEnemies() {
  const out = {};
  for (const key of Object.keys(ENEMIES)) out[key] = normalizeEnemy(ENEMIES[key], key, false);
  if (isObj(BOSS)) {
    const key = str(BOSS.id, "etch-lord");
    out[key] = normalizeEnemy(BOSS, key, true);
  }
  return out;
}

function normalizeWave(entry, index) {
  const src = isObj(entry) ? entry : {};
  const groups = [];
  const raw = Array.isArray(src.groups) ? src.groups : [];
  for (const g of raw) {
    if (!isObj(g)) continue;
    const kind = str(g.enemy, "");
    const count = intAtLeast(g.count, 0, 0);
    if (!kind || count <= 0) continue;
    groups.push({
      kind,
      count,
      lane: intAtLeast(g.lane, 0, 0),
      delay: atLeast(g.delay, 0, 0),
      interval: atLeast(g.interval, 0, 0),
    });
  }
  return {
    index,
    groups,
    hpMul: atLeast(src.hpMul, 1, 0.01),
    bonus: Math.max(0, Math.round(fin(src.bonus, 0))),
    boss: false,
  };
}

/** 蚀主单独成一波：data 注明「第 20 波清完、interWaveDelaySec 后单独登场」。 */
function bossWave(index) {
  const kind = str(BOSS.id, "etch-lord");
  return {
    index,
    groups: [{ kind, count: 1, lane: Number.isInteger(BOSS.lane) ? BOSS.lane : 1, delay: 0, interval: 0 }],
    hpMul: 1,
    bonus: Math.max(0, Math.round(fin(BOSS.bounty, 0))),
    boss: true,
  };
}

/**
 * @param {number} [waveCount] 只跑前 N 波（冒烟用）。缺省 = 全表 + 蚀主。
 */
export function resolveWaves(waveCount) {
  const base = [];
  for (let i = 0; i < WAVES.length; i += 1) {
    const wave = normalizeWave(WAVES[i], base.length + 1);
    if (wave.groups.length > 0) base.push(wave);
  }
  const all = isObj(BOSS) ? base.concat(bossWave(base.length + 1)) : base;
  if (all.length === 0) return [];
  if (!Number.isFinite(waveCount)) return all;
  const n = Math.min(all.length, Math.max(1, Math.round(waveCount)));
  return all.slice(0, n);
}
