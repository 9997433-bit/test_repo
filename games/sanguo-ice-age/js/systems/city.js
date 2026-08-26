/**
 * 城建系统 — 建筑目录、升级队列、工人调度、火炉等级封顶。
 *
 * 本文件是四个系统模块（city / economy / climate / population）的底座：
 * 它不 import 其他系统，因此依赖图无环。目录、状态归一化、资源结算原语
 * 都定义在这里，economy.js 负责再导出契约要求的名字。
 *
 * 建筑字段沿用 js/data/buildings.js 的语义约定：
 *   baseCost / costScale        n 级造价 = ceil(baseCost * costScale^(n-1))
 *   baseTimeTicks               n 级工期 = ceil(baseTimeTicks * 1.3^(n-1))
 *   produces{resource,amountPerTick}   n 级产量 = amountPerTick * n
 *   warmth / population / storage      每级线性加成
 *   garrisonBonus               武将驻守产出加成基数
 *   unlockFurnace               建造所需火炉等级（0 为开局自带）
 *   furnacePrereqFor: [L,...]   火炉升到 L 级前，本建筑须达到 L-1 级
 * 另有本系统层补充的字段（数据表未定义时生效）：
 *   workersPerLevel / maxLevel / upkeep / windbreakPerLevel / foodSavePerLevel
 */
import * as CONFIG from "../config.js";

/* ------------------------------------------------------------------ *
 * 配置读取（对 config.js 采用命名空间导入 + 兜底，缺字段不会崩）
 * ------------------------------------------------------------------ */

export const TICKS_PER_DAY = num(CONFIG.TICKS_PER_DAY, 16);

export const RESOURCES =
  Array.isArray(CONFIG.RESOURCES) && CONFIG.RESOURCES.length
    ? CONFIG.RESOURCES.slice()
    : ["food", "wood", "coal", "iron"];

export const clamp =
  typeof CONFIG.clamp === "function"
    ? CONFIG.clamp
    : (n, min, max) => Math.max(min, Math.min(max, n));

export const lerp =
  typeof CONFIG.lerp === "function" ? CONFIG.lerp : (a, b, t) => a + (b - a) * t;

/** 日志上限（条）。取 80 与 config.LOG_MAX 的较小值，两边约束都满足。 */
export const LOG_LIMIT = Math.max(1, Math.min(80, num(CONFIG.LOG_MAX, 80)));

/** 日志级别，与 config.LOG_LEVELS 一致（UI 按此上色）。 */
export const LOG_LEVELS = Array.isArray(CONFIG.LOG_LEVELS)
  ? CONFIG.LOG_LEVELS.slice()
  : ["info", "good", "warn", "bad"];

/** 由 tick 推导天数（与 state.js 的 dayOfTick 一致，第 1 天开始）。 */
export function dayOfTick(tick) {
  return Math.floor(Math.max(0, num(tick, 0)) / Math.max(1, TICKS_PER_DAY)) + 1;
}

/**
 * config.BUILDING_IDS 与 data/buildings.js 的命名尚未统一，
 * 这里做一层别名，避免旧 id 的存档 / 状态找不到建筑定义。
 */
export const ID_ALIASES = {
  lumberyard: "lumber",
  coalmine: "coal_mine",
  ironmine: "iron_mine",
  warmhouse: "house",
  barracks: "barracks_inf",
  storehouse: "warehouse",
};

/** 数据表未给出时的默认工期增长率。 */
export const DEFAULT_TIME_GROWTH = 1.3;

/** 数据表未给出时的默认造价增长率。 */
export const DEFAULT_COST_GROWTH = 1.55;

/**
 * 无任何建筑时的资源存储基线（每种资源）。
 * 与 config.START 对齐：火炉 1 级另加 150，开局 420 木不会被立刻削顶。
 */
export const BASE_STORAGE = 300;

/**
 * 无任何建筑时的人口上限。
 * 与 config.START 对齐：火炉 1 级另加 4，恰好等于 START.popCap = 24。
 */
export const BASE_POP_CAP = 20;

/* ------------------------------------------------------------------ *
 * 内置建筑目录
 * ------------------------------------------------------------------ *
 * 数值与 js/data/buildings.js 保持一致，作为该文件缺席时的兜底，
 * 同时补充数据表未覆盖的系统层字段（工位 / 上限 / 维护 / 挡风 / 省粮）。
 */
export const DEFAULT_BUILDINGS = {
  furnace: {
    id: "furnace",
    name: "火炉",
    category: "core",
    icon: "🔥",
    desc: "全城的心脏。每级提供热量，决定其他建筑的解锁与等级上限，持续消耗木材与煤炭。",
    baseCost: { food: 40, wood: 90, coal: 0, iron: 0 },
    costScale: 1.62,
    baseTimeTicks: 24,
    produces: null,
    warmth: 0,
    population: 4,
    storage: 150,
    garrisonBonus: 0,
    unlockFurnace: 0,
    furnacePrereqFor: [],
    workersPerLevel: 0,
    maxLevel: 20,
  },
  lumber: {
    id: "lumber",
    name: "伐木场",
    category: "resource",
    icon: "🪓",
    desc: "冰原上的松木是燃料也是建材。木材是前期最紧缺的资源。",
    baseCost: { food: 20, wood: 30, coal: 0, iron: 0 },
    costScale: 1.5,
    baseTimeTicks: 16,
    produces: { resource: "wood", amountPerTick: 0.6 },
    warmth: 0,
    population: 0,
    storage: 0,
    garrisonBonus: 0.12,
    unlockFurnace: 1,
    furnacePrereqFor: [2, 5],
    workersPerLevel: 4,
    maxLevel: 20,
  },
  hunter: {
    id: "hunter",
    name: "猎人小屋",
    category: "resource",
    icon: "🍖",
    desc: "猎取雪原野味补充粮草。人口越多，粮食消耗越快。",
    baseCost: { food: 15, wood: 45, coal: 0, iron: 0 },
    costScale: 1.5,
    baseTimeTicks: 16,
    produces: { resource: "food", amountPerTick: 0.7 },
    warmth: 0,
    population: 0,
    storage: 0,
    garrisonBonus: 0.12,
    unlockFurnace: 1,
    furnacePrereqFor: [2, 6],
    workersPerLevel: 4,
    maxLevel: 20,
  },
  coal_mine: {
    id: "coal_mine",
    name: "煤矿",
    category: "resource",
    icon: "⛏",
    desc: "煤炭燃烧持久，是火炉度过寒潮的底气。",
    baseCost: { food: 30, wood: 60, coal: 0, iron: 0 },
    costScale: 1.52,
    baseTimeTicks: 20,
    produces: { resource: "coal", amountPerTick: 0.3 },
    warmth: 0,
    population: 0,
    storage: 0,
    garrisonBonus: 0.12,
    unlockFurnace: 1,
    furnacePrereqFor: [3, 7],
    workersPerLevel: 5,
    maxLevel: 20,
  },
  iron_mine: {
    id: "iron_mine",
    name: "铁矿",
    category: "resource",
    icon: "⚒",
    desc: "生铁用于打造兵器与营垒，是练兵的根本。",
    baseCost: { food: 40, wood: 80, coal: 20, iron: 0 },
    costScale: 1.55,
    baseTimeTicks: 24,
    produces: { resource: "iron", amountPerTick: 0.2 },
    warmth: 0,
    population: 0,
    storage: 0,
    garrisonBonus: 0.12,
    unlockFurnace: 2,
    furnacePrereqFor: [5, 8],
    workersPerLevel: 5,
    maxLevel: 20,
  },
  house: {
    id: "house",
    name: "民居",
    category: "civil",
    icon: "🏠",
    desc: "为流民遮风避雪，提升人口上限，微弱保温。",
    baseCost: { food: 25, wood: 50, coal: 0, iron: 0 },
    costScale: 1.48,
    baseTimeTicks: 16,
    produces: null,
    warmth: 0.15,
    population: 6,
    storage: 0,
    garrisonBonus: 0,
    unlockFurnace: 1,
    furnacePrereqFor: [3, 6],
    workersPerLevel: 0,
    maxLevel: 20,
  },
  warehouse: {
    id: "warehouse",
    name: "仓库",
    category: "civil",
    icon: "📦",
    desc: "加固的粮仓，提高资源容量并在流寇劫掠时保护存粮。",
    baseCost: { food: 30, wood: 90, coal: 0, iron: 10 },
    costScale: 1.5,
    baseTimeTicks: 20,
    produces: null,
    warmth: 0,
    population: 0,
    storage: 500,
    garrisonBonus: 0,
    unlockFurnace: 2,
    furnacePrereqFor: [4, 8],
    workersPerLevel: 1,
    maxLevel: 20,
  },
  kitchen: {
    id: "kitchen",
    name: "大厨房",
    category: "civil",
    icon: "🍲",
    desc: "一碗热汤能救命。提升民心恢复速度，兼具保温。",
    baseCost: { food: 60, wood: 70, coal: 15, iron: 0 },
    costScale: 1.5,
    baseTimeTicks: 20,
    produces: null,
    warmth: 0.4,
    population: 2,
    storage: 0,
    garrisonBonus: 0,
    unlockFurnace: 2,
    furnacePrereqFor: [4],
    workersPerLevel: 2,
    maxLevel: 10,
    foodSavePerLevel: 0.05,
  },
  clinic: {
    id: "clinic",
    name: "诊所",
    category: "civil",
    icon: "💊",
    desc: "医治冻伤与疫病，减缓寒潮期间的民心流失。",
    baseCost: { food: 50, wood: 60, coal: 10, iron: 0 },
    costScale: 1.5,
    baseTimeTicks: 20,
    produces: null,
    warmth: 0.2,
    population: 0,
    storage: 0,
    garrisonBonus: 0,
    unlockFurnace: 2,
    furnacePrereqFor: [],
    workersPerLevel: 3,
    maxLevel: 10,
    medical: true,
  },
  hospital: {
    id: "hospital",
    name: "伤兵营",
    category: "military",
    icon: "⛑",
    desc: "收治战场伤兵，战败部队按比例返还，降低练兵损耗。",
    baseCost: { food: 90, wood: 80, coal: 20, iron: 30 },
    costScale: 1.5,
    baseTimeTicks: 24,
    produces: null,
    warmth: 0.2,
    population: 0,
    storage: 0,
    garrisonBonus: 0,
    unlockFurnace: 4,
    furnacePrereqFor: [],
    workersPerLevel: 2,
    maxLevel: 10,
  },
  wall: {
    id: "wall",
    name: "城墙",
    category: "military",
    icon: "🧱",
    desc: "夯土包冰的城垣，抵御流寇劫掠，提升守军战力，兼可挡风。",
    baseCost: { food: 60, wood: 140, coal: 0, iron: 60 },
    costScale: 1.55,
    baseTimeTicks: 32,
    produces: null,
    warmth: 0,
    population: 0,
    storage: 0,
    garrisonBonus: 0,
    unlockFurnace: 3,
    furnacePrereqFor: [6, 9],
    workersPerLevel: 2,
    maxLevel: 15,
    windbreakPerLevel: 0.25,
    defensePerLevel: 12,
  },
  barracks_inf: {
    id: "barracks_inf",
    name: "步兵营",
    category: "military",
    icon: "🛡",
    desc: "训练枪盾兵。步克骑，是守城的中坚。",
    baseCost: { food: 80, wood: 100, coal: 0, iron: 40 },
    costScale: 1.55,
    baseTimeTicks: 28,
    produces: null,
    warmth: 0,
    population: 0,
    storage: 0,
    garrisonBonus: 0,
    unlockFurnace: 3,
    furnacePrereqFor: [5],
    workersPerLevel: 3,
    maxLevel: 15,
  },
  barracks_arch: {
    id: "barracks_arch",
    name: "弓兵营",
    category: "military",
    icon: "🏹",
    desc: "训练强弩手。弓克步，远程压制流寇。",
    baseCost: { food: 70, wood: 130, coal: 0, iron: 50 },
    costScale: 1.55,
    baseTimeTicks: 28,
    produces: null,
    warmth: 0,
    population: 0,
    storage: 0,
    garrisonBonus: 0,
    unlockFurnace: 4,
    furnacePrereqFor: [],
    workersPerLevel: 3,
    maxLevel: 15,
  },
  barracks_cav: {
    id: "barracks_cav",
    name: "骑兵营",
    category: "military",
    icon: "🐎",
    desc: "训练铁骑。骑克弓，雪原奔袭无人能挡。",
    baseCost: { food: 120, wood: 90, coal: 0, iron: 80 },
    costScale: 1.55,
    baseTimeTicks: 32,
    produces: null,
    warmth: 0,
    population: 0,
    storage: 0,
    garrisonBonus: 0,
    unlockFurnace: 5,
    furnacePrereqFor: [],
    workersPerLevel: 3,
    maxLevel: 15,
  },
  academy: {
    id: "academy",
    name: "书院",
    category: "civil",
    icon: "📜",
    desc: "研习韬略，为武将提供历练经验。",
    baseCost: { food: 100, wood: 120, coal: 30, iron: 20 },
    costScale: 1.6,
    baseTimeTicks: 32,
    produces: null,
    warmth: 0,
    population: 0,
    storage: 0,
    garrisonBonus: 0,
    unlockFurnace: 5,
    furnacePrereqFor: [],
    workersPerLevel: 2,
    maxLevel: 10,
  },
  tavern: {
    id: "tavern",
    name: "招贤馆",
    category: "civil",
    icon: "🍶",
    desc: "煮酒论英雄。招募魏蜀吴群名将，等级越高贤才越多。",
    baseCost: { food: 90, wood: 110, coal: 20, iron: 0 },
    costScale: 1.6,
    baseTimeTicks: 24,
    produces: null,
    warmth: 0.2,
    population: 2,
    storage: 0,
    garrisonBonus: 0,
    unlockFurnace: 3,
    furnacePrereqFor: [],
    workersPerLevel: 1,
    maxLevel: 10,
  },
  embassy: {
    id: "embassy",
    name: "使馆",
    category: "civil",
    icon: "🤝",
    desc: "接待各方使节，开启联盟互助与商队贸易。",
    baseCost: { food: 120, wood: 150, coal: 40, iron: 40 },
    costScale: 1.6,
    baseTimeTicks: 36,
    produces: null,
    warmth: 0,
    population: 0,
    storage: 0,
    garrisonBonus: 0,
    unlockFurnace: 6,
    furnacePrereqFor: [],
    workersPerLevel: 1,
    maxLevel: 10,
  },
};

/**
 * 若 `js/data/buildings.js` 已由数据代理提供，则合并其 BUILDINGS，
 * 否则回落到 DEFAULT_BUILDINGS。动态 import 失败会被捕获，纯 Node 下也安全。
 */
export async function loadBuildingCatalog() {
  try {
    const mod = await import("../data/buildings.js");
    const raw = mod?.BUILDINGS ?? mod?.default;
    if (raw) return mergeCatalog(DEFAULT_BUILDINGS, raw);
  } catch {
    /* 数据模块尚未落地，使用内置目录 */
  }
  return DEFAULT_BUILDINGS;
}

/** 把外部目录（对象或数组）合并进基准目录，外部字段优先。 */
export function mergeCatalog(base, extra) {
  const out = {};
  for (const [id, def] of Object.entries(base || {})) out[id] = { ...def, id };
  const list = Array.isArray(extra)
    ? extra
    : extra && typeof extra === "object"
      ? Object.entries(extra).map(([id, d]) => ({ id, ...(d || {}) }))
      : null;
  if (!list) return out;
  for (const def of list) {
    if (!def || typeof def !== "object") continue;
    const id = def.id;
    if (typeof id !== "string" || !id) continue;
    out[id] = { ...(out[id] || {}), ...def, id };
  }
  return out;
}

/**
 * 目录归一化：允许传数组 / undefined。
 * 调用方（如 main.js 的桥接层）可能把 { dt, ticksPerDay, bus } 之类的选项对象
 * 当第二参数传进来，因此这里校验「看起来确实是建筑表」，否则回落到内置目录。
 */
export function catalogOf(catalog) {
  if (Array.isArray(catalog)) return mergeCatalog(DEFAULT_BUILDINGS, catalog);
  if (looksLikeCatalog(catalog)) return catalog;
  return DEFAULT_BUILDINGS;
}

/** 是否为建筑目录：至少有一个条目带 id / name / baseCost / produces 等建筑字段。 */
function looksLikeCatalog(v) {
  if (!v || typeof v !== "object") return false;
  for (const def of Object.values(v)) {
    if (!def || typeof def !== "object") continue;
    if (
      typeof def.id === "string" ||
      typeof def.name === "string" ||
      def.baseCost ||
      def.cost ||
      def.produces !== undefined
    ) {
      return true;
    }
  }
  return false;
}

/** 目录取用（未知 id 先查别名，仍无则返回 null）。 */
export function defOf(catalog, id) {
  const cat = catalogOf(catalog);
  if (!cat || typeof cat !== "object") return null;
  let def = cat[id];
  if (!def && typeof id === "string" && ID_ALIASES[id]) def = cat[ID_ALIASES[id]];
  return def && typeof def === "object" ? def : null;
}

/** 目录里的建筑数组（稳定顺序）。 */
export function buildingList(catalog) {
  return Object.values(catalogOf(catalog));
}

/* ------------------------------------------------------------------ *
 * 状态归一化
 * ------------------------------------------------------------------ */

/** 就地补齐缺失字段；已有值一律保留。返回同一个 state。 */
export function ensureState(state, catalog) {
  if (!state || typeof state !== "object") return state;

  const meta = (state.meta = obj(state.meta));
  meta.tick = Math.max(0, Math.floor(num(meta.tick, 0)));
  meta.day = Math.max(1, Math.floor(num(meta.day, 1)));

  const res = (state.resources = obj(state.resources));
  for (const r of RESOURCES) res[r] = Math.max(0, num(res[r], 0));

  const climate = (state.climate = obj(state.climate));
  climate.temp = num(climate.temp, num(CONFIG.CLIMATE?.baseTemp, 4));
  climate.blizzardDaysLeft = Math.max(0, Math.floor(num(climate.blizzardDaysLeft, 0)));
  climate.nextBlizzardIn = Math.max(
    0,
    Math.floor(num(climate.nextBlizzardIn, num(CONFIG.CLIMATE?.blizzardEveryDays, 7))),
  );
  if (typeof climate.furnaceLit !== "boolean") climate.furnaceLit = true;

  const city = (state.city = obj(state.city));
  city.buildings = obj(city.buildings);
  city.furnaceLevel = Math.max(0, Math.floor(num(city.furnaceLevel, 1)));
  city.warmthBuildings = Math.max(0, Math.floor(num(city.warmthBuildings, 0)));

  const cat = catalogOf(catalog ?? city.catalog);
  for (const id of Object.keys(cat)) ensureBuildingEntry(city.buildings, id);
  for (const id of Object.keys(city.buildings)) ensureBuildingEntry(city.buildings, id);

  // 火炉等级与 city.furnaceLevel 双向对齐（取较大者，避免读档错位）
  const furnace = city.buildings.furnace;
  const level = Math.max(furnace.level, city.furnaceLevel);
  furnace.level = level;
  city.furnaceLevel = level;

  const people = (state.people = obj(state.people));
  people.pop = Math.max(0, Math.floor(num(people.pop, 0)));
  people.popCap = Math.max(0, Math.floor(num(people.popCap, BASE_POP_CAP)));
  people.morale = clamp(num(people.morale, num(CONFIG.MORALE?.base, 70)), 0, 100);
  people.sick = Math.max(0, Math.floor(num(people.sick, 0)));
  people.hungry = Math.max(0, Math.floor(num(people.hungry, 0)));

  const heroes = (state.heroes = obj(state.heroes));
  if (!Array.isArray(heroes.roster)) heroes.roster = [];

  state.flags = obj(state.flags);
  if (!Array.isArray(state.log)) state.log = [];

  return state;
}

/**
 * 建筑条目：{ level, workers, constructing, progress }。
 * progress 为 0~1 的施工进度（与 state.js 的约定一致），
 * 实际 tick 计数放在 progressTicks，需求 tick 数放在 buildTicks。
 */
function ensureBuildingEntry(map, id) {
  const cur = obj(map[id]);
  cur.level = Math.max(0, Math.floor(num(cur.level, 0)));
  cur.workers = Math.max(0, Math.floor(num(cur.workers, 0)));
  cur.constructing = cur.constructing === true;
  cur.progress = clamp(num(cur.progress, 0), 0, 1);
  if (cur.constructing) {
    const required = Math.floor(num(cur.buildTicks, NaN));
    if (Number.isFinite(required) && required > 0) {
      cur.buildTicks = required;
      // 只有 progress（比例）的旧存档：反推 tick 计数
      cur.progressTicks = clamp(
        Math.floor(num(cur.progressTicks, Math.round(cur.progress * required))),
        0,
        required,
      );
    } else {
      cur.progressTicks = Math.max(0, Math.floor(num(cur.progressTicks, 0)));
    }
  } else {
    cur.progress = 0;
    cur.progressTicks = 0;
  }
  map[id] = cur;
  return cur;
}

/** 取（必要时创建）建筑条目：{ level, workers, constructing, progress }。 */
export function getBuilding(state, id) {
  if (!state || typeof state !== "object" || typeof id !== "string") return null;
  const city = (state.city = obj(state.city));
  city.buildings = obj(city.buildings);
  return ensureBuildingEntry(city.buildings, id);
}

/** 建筑等级（不存在按 0）。 */
export function levelOf(state, id) {
  return Math.max(0, Math.floor(num(obj(state?.city?.buildings)[id]?.level, 0)));
}

/**
 * 把目录挂到 state 上，之后无目录参数的 API（assignWorkers 等）会用它。
 * 挂成不可枚举属性：JSON.stringify 存档时不会带上整张建筑表，
 * 读档后由 main.js 重新调用一次即可（未调用则回落 DEFAULT_BUILDINGS）。
 */
export function setCatalog(state, catalog) {
  if (!state || typeof state !== "object") return state;
  state.city = obj(state.city);
  Object.defineProperty(state.city, "catalog", {
    value: catalogOf(catalog),
    enumerable: false,
    writable: true,
    configurable: true,
  });
  return state;
}

/* ------------------------------------------------------------------ *
 * 建筑定义读取（兼容数据表与内置目录的多种写法）
 * ------------------------------------------------------------------ */

/**
 * 每级每 tick 产出，返回 { resource: amountPerTick }。
 * 支持 `produces:{resource,amountPerTick}`、`produces:{res:amt}` 与顶层 resource/amountPerTick。
 */
export function productionOf(def) {
  if (!def) return {};
  const out = {};
  const src = def.produces ?? def.output ?? def.production;
  if (src && typeof src === "object") {
    if (typeof src.resource === "string") {
      const n = num(src.amountPerTick ?? src.amount ?? src.perTick, 0);
      if (n) out[src.resource] = n;
    } else {
      for (const [k, v] of Object.entries(src)) {
        const n = num(v, 0);
        if (n) out[k] = n;
      }
    }
  }
  if (typeof def.resource === "string") {
    const n = num(def.amountPerTick ?? def.perTick ?? def.amount, 0);
    if (n) out[def.resource] = (out[def.resource] || 0) + n;
  }
  return out;
}

/** 每级每 tick 维护消耗：{ resource: amount }。 */
export function upkeepOf(def) {
  const src = def?.upkeep ?? def?.consumes ?? def?.maintenance;
  const out = {};
  if (src && typeof src === "object") {
    for (const [k, v] of Object.entries(src)) {
      const n = num(v, 0);
      if (n > 0) out[k] = n;
    }
  }
  return out;
}

/** 该建筑在指定等级下的工人位总数。 */
export function workerSlots(def, level) {
  const per = num(def?.workersPerLevel ?? def?.workerSlots ?? def?.workers, 0);
  return Math.max(0, Math.floor(per * Math.max(0, Math.floor(num(level, 0)))));
}

/** 最高等级。 */
export function maxLevelOf(def) {
  return Math.max(1, Math.floor(num(def?.maxLevel, 20)));
}

/** 建造所需的火炉等级。 */
export function unlockFurnaceOf(def) {
  return Math.max(0, Math.floor(num(def?.unlockFurnace, 0)));
}

/**
 * 升到 nextLevel 的造价：ceil(baseCost[res] * costScale^(nextLevel-1))。
 */
export function buildingCost(def, nextLevel) {
  const lv = Math.max(1, Math.floor(num(nextLevel, 1)));
  const base = def?.baseCost ?? def?.cost ?? def?.costs;
  const out = {};
  if (!base || typeof base !== "object") return out;
  const growth = Math.max(
    1,
    num(def?.costScale ?? def?.costGrowth ?? def?.growth, DEFAULT_COST_GROWTH),
  );
  const mult = Math.pow(growth, lv - 1);
  for (const [res, v] of Object.entries(base)) {
    const n = num(v, 0);
    if (n > 0) out[res] = Math.ceil(n * mult);
  }
  return out;
}

/** 升到 nextLevel 需要的建造 tick 数：ceil(baseTimeTicks * 1.3^(nextLevel-1))。 */
export function upgradeTicks(def, nextLevel) {
  const lv = Math.max(1, Math.floor(num(nextLevel, 1)));
  const base = Math.max(1, num(def?.baseTimeTicks ?? def?.buildTicks ?? def?.ticks, 16));
  const growth = Math.max(
    1,
    num(def?.buildTicksGrowth ?? def?.timeGrowth, DEFAULT_TIME_GROWTH),
  );
  return Math.max(1, Math.ceil(base * Math.pow(growth, lv - 1)));
}

/* ------------------------------------------------------------------ *
 * 资源原语（economy.js 再导出）
 * ------------------------------------------------------------------ */

/** 资源是否足够支付 cost。 */
export function canAfford(state, cost) {
  if (!cost || typeof cost !== "object") return true;
  const res = obj(state?.resources);
  for (const [k, v] of Object.entries(cost)) {
    const need = num(v, 0);
    if (need <= 0) continue;
    if (num(res[k], 0) + 1e-9 < need) return false;
  }
  return true;
}

/** 扣除 cost；不足时不扣任何资源并返回 false。 */
export function pay(state, cost) {
  if (!state || typeof state !== "object") return false;
  if (!canAfford(state, cost)) return false;
  state.resources = obj(state.resources);
  for (const [k, v] of Object.entries(cost || {})) {
    const need = num(v, 0);
    if (need <= 0) continue;
    state.resources[k] = Math.max(0, num(state.resources[k], 0) - need);
  }
  return true;
}

/** 返还资源（撤销建造等），受仓储上限约束。 */
export function refund(state, cost, catalog) {
  if (!state || typeof state !== "object") return state;
  state.resources = obj(state.resources);
  const cap = warehouseCap(state, catalog);
  for (const [k, v] of Object.entries(cost || {})) {
    const gain = num(v, 0);
    if (gain <= 0) continue;
    const limit = num(cap[k], Infinity);
    state.resources[k] = clamp(num(state.resources[k], 0) + gain, 0, limit);
  }
  return state;
}

/**
 * 各资源存储上限：BASE_STORAGE + Σ(等级 × storage)。
 * 返回 { food, wood, coal, iron } 映射。
 */
export function warehouseCap(state, catalog) {
  const cap = {};
  for (const r of RESOURCES) cap[r] = BASE_STORAGE;
  const cat = catalogOf(catalog ?? state?.city?.catalog);
  const buildings = obj(state?.city?.buildings);
  for (const [id, entry] of Object.entries(buildings)) {
    const level = Math.max(0, Math.floor(num(entry?.level, 0)));
    if (level <= 0) continue;
    const def = cat[id];
    const flat = num(def?.storage, 0);
    if (flat > 0) for (const r of RESOURCES) cap[r] = num(cap[r], 0) + flat * level;
    const per = def?.storagePerLevel;
    if (per && typeof per === "object") {
      for (const [res, v] of Object.entries(per)) cap[res] = num(cap[res], 0) + num(v, 0) * level;
    }
  }
  for (const k of Object.keys(cap)) cap[k] = Math.max(0, Math.floor(cap[k]));
  return cap;
}

/** 人口上限：BASE_POP_CAP + Σ(等级 × population)。 */
export function housingCapacity(state, catalog) {
  const cat = catalogOf(catalog ?? state?.city?.catalog);
  const buildings = obj(state?.city?.buildings);
  let cap = BASE_POP_CAP;
  for (const [id, entry] of Object.entries(buildings)) {
    const level = Math.max(0, Math.floor(num(entry?.level, 0)));
    if (level <= 0) continue;
    cap += num(cat[id]?.population ?? cat[id]?.popCapPerLevel, 0) * level;
  }
  return Math.max(0, Math.floor(cap));
}

/** 建筑提供的保温值：Σ(等级 × (warmth + windbreakPerLevel))。 */
export function insulation(state, catalog) {
  const cat = catalogOf(catalog ?? state?.city?.catalog);
  const buildings = obj(state?.city?.buildings);
  let total = 0;
  for (const [id, entry] of Object.entries(buildings)) {
    const level = Math.max(0, Math.floor(num(entry?.level, 0)));
    if (level <= 0) continue;
    total += (num(cat[id]?.warmth, 0) + num(cat[id]?.windbreakPerLevel, 0)) * level;
  }
  return total;
}

/** 已被派驻到各建筑的工人总数。 */
export function assignedWorkers(state) {
  const buildings = obj(state?.city?.buildings);
  let total = 0;
  for (const entry of Object.values(buildings)) {
    total += Math.max(0, Math.floor(num(entry?.workers, 0)));
  }
  return total;
}

/** 全城工人位总数。 */
export function totalWorkerSlots(state, catalog) {
  const cat = catalogOf(catalog ?? state?.city?.catalog);
  const buildings = obj(state?.city?.buildings);
  let total = 0;
  for (const [id, entry] of Object.entries(buildings)) {
    total += workerSlots(cat[id], entry?.level);
  }
  return total;
}

/* ------------------------------------------------------------------ *
 * 火炉封顶与升级
 * ------------------------------------------------------------------ */

/** 其他建筑的等级上限 = 火炉等级（火炉本身不受此限）。 */
export function furnaceLevelCap(state) {
  const fromCity = num(state?.city?.furnaceLevel, 0);
  const fromBuilding = num(state?.city?.buildings?.furnace?.level, 0);
  const level = Math.max(
    Number.isFinite(fromCity) ? fromCity : 0,
    Number.isFinite(fromBuilding) ? fromBuilding : 0,
  );
  return Math.max(1, Math.floor(level || 1));
}

/**
 * 火炉升级前置检查（目标等级 target）。
 * 主规则来自数据表：凡 furnacePrereqFor 含 target 的建筑，须达到 target-1 级。
 * 数据表未声明任何 furnacePrereqFor 时，回落到 def.furnacePrereq = { id: k }
 * （要求该建筑等级 >= ceil(k × 当前火炉等级)）。
 * 返回 { ok, missing:[{id,name,need,have}] }。
 */
export function checkFurnacePrereq(state, def, catalog, target) {
  const cat = catalogOf(catalog ?? state?.city?.catalog);
  const cur = furnaceLevelCap(state);
  const goal = Math.max(1, Math.floor(num(target, cur + 1)));
  const missing = [];

  let declared = false;
  for (const [id, d] of Object.entries(cat)) {
    const list = d?.furnacePrereqFor;
    if (!Array.isArray(list) || !list.length) continue;
    declared = true;
    if (!list.some((L) => Math.floor(num(L, -1)) === goal)) continue;
    const need = Math.max(1, goal - 1);
    const have = levelOf(state, id);
    if (have < need) missing.push({ id, name: d?.name || id, need, have });
  }

  if (!declared) {
    let spec = def?.furnacePrereq;
    if (Array.isArray(spec)) {
      const o = {};
      for (const id of spec) if (typeof id === "string") o[id] = 1;
      spec = o;
    }
    if (spec && typeof spec === "object") {
      for (const [id, v] of Object.entries(spec)) {
        const need = Math.max(1, Math.ceil(num(v, 1) * cur));
        const have = levelOf(state, id);
        if (have < need) missing.push({ id, name: cat[id]?.name || id, need, have });
      }
    }
  }

  return { ok: missing.length === 0, missing };
}

/**
 * 检查能否开工，返回 { ok, reason, text, cost, nextLevel, def }。
 * UI 可直接用它来置灰按钮并显示原因。
 */
export function canUpgrade(state, buildingId, catalog) {
  const cat = catalogOf(catalog ?? state?.city?.catalog);
  const def = defOf(cat, buildingId);
  if (!def) return { ok: false, reason: "unknown", text: "没有这种建筑" };

  const entry = getBuilding(state, buildingId);
  if (!entry) return { ok: false, reason: "unknown", text: "没有这种建筑" };
  if (entry.constructing) return { ok: false, reason: "busy", text: "该建筑正在施工中" };

  const name = def.name || buildingId;
  const nextLevel = entry.level + 1;
  if (nextLevel > maxLevelOf(def)) {
    return { ok: false, reason: "max", text: `${name}已达最高等级` };
  }

  const furnaceLevel = furnaceLevelCap(state);
  if (buildingId === "furnace") {
    const pre = checkFurnacePrereq(state, def, cat, nextLevel);
    if (!pre.ok) {
      const first = pre.missing[0];
      return {
        ok: false,
        reason: "prereq",
        missing: pre.missing,
        text: `火炉扩建需先将${first.name}升至 ${first.need} 级（当前 ${first.have} 级）`,
      };
    }
  } else {
    const unlock = unlockFurnaceOf(def);
    if (entry.level === 0 && furnaceLevel < unlock) {
      return { ok: false, reason: "locked", text: `${name}需要火炉 ${unlock} 级才能建造` };
    }
    if (nextLevel > furnaceLevel) {
      return {
        ok: false,
        reason: "furnaceCap",
        text: `受火炉等级限制，${name}最高 ${furnaceLevel} 级`,
      };
    }
  }

  const cost = buildingCost(def, nextLevel);
  if (!canAfford(state, cost)) {
    return { ok: false, reason: "cost", cost, nextLevel, def, text: `资源不足，无法营建${name}` };
  }
  return { ok: true, reason: "ok", cost, nextLevel, def };
}

/** 开始升级（0 级即新建）。成功扣资源并进入施工，返回 true。 */
export function startUpgrade(state, buildingId, buildingsCatalog) {
  try {
    if (!state || typeof state !== "object") return false;
    const cat = catalogOf(buildingsCatalog ?? state?.city?.catalog);
    ensureState(state, cat);

    const check = canUpgrade(state, buildingId, cat);
    if (!check.ok) {
      if (check.reason !== "busy") pushLog(state, check.text, "warn");
      return false;
    }
    if (!pay(state, check.cost)) {
      pushLog(state, "资源不足，无法开工", "warn");
      return false;
    }

    const def = check.def;
    const entry = getBuilding(state, buildingId);
    entry.constructing = true;
    entry.progress = 0;
    entry.progressTicks = 0;
    entry.buildTicks = upgradeTicks(def, check.nextLevel);
    entry.targetLevel = check.nextLevel;

    const verb = entry.level === 0 ? "开始营建" : "开始扩建";
    pushLog(state, `${verb}${def.name || buildingId} → ${check.nextLevel} 级`, "info");
    return true;
  } catch (err) {
    safeWarn("startUpgrade", err);
    return false;
  }
}

/** 取消施工并返还 70% 资源。 */
export function cancelUpgrade(state, buildingId, buildingsCatalog) {
  try {
    const cat = catalogOf(buildingsCatalog ?? state?.city?.catalog);
    const def = defOf(cat, buildingId);
    const entry = getBuilding(state, buildingId);
    if (!def || !entry || !entry.constructing) return false;
    const cost = buildingCost(def, entry.targetLevel ?? entry.level + 1);
    const back = {};
    for (const [k, v] of Object.entries(cost)) back[k] = Math.floor(num(v, 0) * 0.7);
    refund(state, back, cat);
    entry.constructing = false;
    entry.progress = 0;
    entry.progressTicks = 0;
    delete entry.buildTicks;
    delete entry.targetLevel;
    pushLog(state, `停工：${def.name || buildingId}，返还七成物料`, "warn");
    return true;
  } catch (err) {
    safeWarn("cancelUpgrade", err);
    return false;
  }
}

/**
 * 派驻工人（count 为目标绝对人数）。
 * 超过工位或超过闲置健康人口都会失败并返回 false。
 */
export function assignWorkers(state, buildingId, count, buildingsCatalog) {
  try {
    if (!state || typeof state !== "object") return false;
    const cat = catalogOf(buildingsCatalog ?? state?.city?.catalog);
    const def = defOf(cat, buildingId);
    const entry = getBuilding(state, buildingId);
    if (!def || !entry) return false;

    const want = Math.max(0, Math.floor(num(count, NaN)));
    if (!Number.isFinite(want)) return false;

    const slots = workerSlots(def, entry.level);
    if (want > slots) {
      pushLog(state, `${def.name || buildingId}只有 ${slots} 个工位`, "warn");
      return false;
    }

    const people = obj(state.people);
    const healthy = Math.max(0, Math.floor(num(people.pop, 0)) - Math.floor(num(people.sick, 0)));
    const others = assignedWorkers(state) - Math.max(0, Math.floor(num(entry.workers, 0)));
    if (want + others > healthy) {
      pushLog(state, `可用人手不足（闲置 ${Math.max(0, healthy - others)} 人）`, "warn");
      return false;
    }

    if (want === entry.workers) return true;
    entry.workers = want;
    pushLog(state, `${def.name || buildingId}派驻 ${want} 人`, "info");
    return true;
  } catch (err) {
    safeWarn("assignWorkers", err);
    return false;
  }
}

/**
 * 城建 tick：推进施工进度、完工升级、同步人口上限、修剪越界工人。
 * 幂等安全，不抛异常。
 */
export function tickCity(state, buildingsCatalog) {
  try {
    if (!state || typeof state !== "object") return state;
    const cat = catalogOf(buildingsCatalog ?? state?.city?.catalog);
    ensureState(state, cat);

    const buildings = state.city.buildings;
    for (const [id, entry] of Object.entries(buildings)) {
      const def = defOf(cat, id);

      if (entry.constructing) {
        const target = Math.max(
          entry.level + 1,
          Math.floor(num(entry.targetLevel, entry.level + 1)),
        );
        const required = Math.max(1, Math.floor(num(entry.buildTicks, upgradeTicks(def, target))));
        entry.buildTicks = required;
        entry.targetLevel = target;
        entry.progressTicks = Math.max(0, Math.floor(num(entry.progressTicks, 0))) + 1;
        entry.progress = clamp(entry.progressTicks / required, 0, 1);

        if (entry.progressTicks >= required) {
          entry.level = target;
          entry.constructing = false;
          entry.progress = 0;
          entry.progressTicks = 0;
          delete entry.buildTicks;
          delete entry.targetLevel;
          if (id === "furnace") state.city.furnaceLevel = entry.level;
          pushLog(state, `${def?.name || id}升至 ${entry.level} 级`, "good");
        }
      }

      const slots = workerSlots(def, entry.level);
      if (entry.workers > slots) entry.workers = slots;
    }

    trimWorkforce(state);

    state.city.furnaceLevel = Math.max(
      0,
      Math.floor(num(buildings.furnace?.level, state.city.furnaceLevel)),
    );
    state.people.popCap = housingCapacity(state, cat);
    if (state.people.pop > state.people.popCap) state.people.pop = state.people.popCap;

    return state;
  } catch (err) {
    safeWarn("tickCity", err);
    return state;
  }
}

/** 把派驻总数压回健康人口以内（从工人最多的建筑开始裁）。 */
export function trimWorkforce(state) {
  const people = obj(state?.people);
  const healthy = Math.max(0, Math.floor(num(people.pop, 0)) - Math.floor(num(people.sick, 0)));
  let assigned = assignedWorkers(state);
  if (assigned <= healthy) return state;

  const entries = Object.values(obj(state?.city?.buildings)).sort(
    (a, b) => num(b?.workers, 0) - num(a?.workers, 0),
  );
  for (const entry of entries) {
    if (assigned <= healthy) break;
    const cut = Math.min(Math.max(0, Math.floor(num(entry.workers, 0))), assigned - healthy);
    entry.workers = Math.max(0, Math.floor(num(entry.workers, 0)) - cut);
    assigned -= cut;
  }
  return state;
}

/* ------------------------------------------------------------------ *
 * 日志
 * ------------------------------------------------------------------ */

/**
 * 中文日志入栈。条目结构与 state.js 的 pushLog 一致：{ tick, day, text, level }，
 * level ∈ LOG_LEVELS。连续重复文本会被去重，最多保留 LOG_LIMIT 条。
 */
export function pushLog(state, text, level = "info") {
  if (!state || typeof state !== "object" || !text) return state;
  if (!Array.isArray(state.log)) state.log = [];
  const last = state.log[state.log.length - 1];
  const line = String(text);
  if (last && typeof last === "object" && last.text === line) return state;
  if (typeof last === "string" && last === line) return state;
  state.log.push({
    tick: Math.max(0, Math.floor(num(state?.meta?.tick, 0))),
    day: Math.max(1, Math.floor(num(state?.meta?.day, 1))),
    text: line,
    level: LOG_LEVELS.includes(level) ? level : "info",
  });
  if (state.log.length > LOG_LIMIT) state.log.splice(0, state.log.length - LOG_LIMIT);
  return state;
}

/* ------------------------------------------------------------------ *
 * 小工具
 * ------------------------------------------------------------------ */

export function num(v, fallback) {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export function obj(v) {
  return v && typeof v === "object" ? v : {};
}

function safeWarn(where, err) {
  if (typeof console !== "undefined" && console.warn) {
    console.warn(`[city] ${where} 异常：`, err?.message || err);
  }
}
