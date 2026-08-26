/**
 * 全局游戏状态：纯数据（可 JSON 序列化），不含函数 / DOM 引用。
 * 所有系统只读写这里的字段，存档 = 序列化本对象。
 */
import {
  SAVE_VERSION,
  DEFAULT_LORD,
  CLIMATE,
  MORALE,
  RESOURCES,
  START,
  START_HERO_IDS,
  BUILDING_IDS,
  resolveBuildingId,
  LOG_MAX,
  TICKS_PER_DAY,
} from "./config.js";

/** 状态结构版本；改动 createInitialState 的字段时同步 config.SAVE_VERSION。 */
export const STATE_VERSION = SAVE_VERSION;

/** 单个建筑槽位的默认数据。 */
export function createBuilding(level = 0) {
  return {
    level, // 0 = 未建造
    workers: 0, // 派驻人口
    constructing: false, // 是否在施工/升级中
    progress: 0, // 施工进度 0~1
  };
}

/** 开局赠送的橙将占位条目；heroes 数据表就位后按 id 关联静态数据。 */
function createHeroEntry(id) {
  return {
    id,
    level: 1,
    exp: 0,
    star: 1,
    quality: "orange",
    hp: 1, // 血量比例 0~1，战斗系统写回
    injured: false,
  };
}

/**
 * 生成一份全新存档状态。
 * @param {number|string} [seed=1] 随机种子，决定寒潮 / 招募等序列
 */
export function createInitialState(seed = 1) {
  const buildings = {};
  for (const id of BUILDING_IDS) {
    buildings[id] = createBuilding(Math.max(0, Math.floor(START.buildings?.[id] ?? 0)));
  }

  const roster = START_HERO_IDS.map(createHeroEntry);

  const state = {
    meta: {
      version: STATE_VERSION,
      seed,
      tick: 0,
      day: 1,
      playTimeSec: 0,
      lord: { ...DEFAULT_LORD },
    },
    resources: { ...START.resources },
    climate: {
      temp: CLIMATE.baseTemp,
      blizzardDaysLeft: 0,
      nextBlizzardIn: CLIMATE.blizzardEveryDays,
      furnaceLit: true,
    },
    city: {
      furnaceLevel: START.furnaceLevel,
      buildings,
      warmthBuildings: 0, // 已建成的取暖类建筑数量，气候系统维护
    },
    people: {
      pop: START.pop,
      popCap: START.popCap,
      morale: MORALE.base,
      sick: 0,
      hungry: 0,
    },
    army: { ...START.army },
    heroes: {
      roster,
      deployed: roster.slice(0, 3).map((h) => h.id), // 存 hero id
      tickets: START.heroTickets,
    },
    quests: { active: [], completed: [] },
    flags: { tutorialStep: 0, gameOver: false, victory: false },
    log: [],
  };

  pushLog(state, "风雪起，流民聚于城下。点燃火炉，撑过这个冬天。", "info");
  return state;
}

/** 追加一条日志（原地修改），超出 LOG_MAX 丢最旧的。 */
export function pushLog(state, text, level = "info") {
  if (!state || !Array.isArray(state.log)) return state;
  state.log.push({ tick: state.meta?.tick ?? 0, text: String(text), level });
  if (state.log.length > LOG_MAX) state.log.splice(0, state.log.length - LOG_MAX);
  return state;
}

/** 没有该建筑槽位时补一个（数据表新增建筑后老存档也能用）。 */
export function ensureBuilding(state, id) {
  if (!state?.city?.buildings) return null;
  if (!state.city.buildings[id]) state.city.buildings[id] = createBuilding(0);
  return state.city.buildings[id];
}

/** 把任意（可能残缺的）槽位数据补成完整建筑槽位。 */
function normalizeBuildingSlot(slot) {
  const b = createBuilding(0);
  if (!isPlainObject(slot)) return b;
  const num = (v, fallback) => (typeof v === "number" && Number.isFinite(v) ? Math.max(0, v) : fallback);
  b.level = Math.floor(num(slot.level, 0));
  b.workers = num(slot.workers, 0);
  b.progress = Math.min(1, num(slot.progress, 0));
  b.constructing = slot.constructing === true;
  // 保留数据表 / 系统层挂在槽位上的额外字段（如 up、queue）。
  for (const [k, v] of Object.entries(slot)) {
    if (!(k in b)) b[k] = v;
  }
  return b;
}

/** 同一建筑的两份槽位（旧 id + 新 id）合成一份：取进度更靠前的那份。 */
function mergeBuildingSlots(a, b) {
  const lead = b.level > a.level || (b.level === a.level && b.progress > a.progress) ? b : a;
  const other = lead === a ? b : a;
  return {
    ...other,
    ...lead,
    workers: Math.max(a.workers, b.workers),
    constructing: a.constructing || b.constructing,
  };
}

/**
 * 把建筑表里的旧 id 迁到权威 id（lumberyard→lumber 等）并补全槽位字段。
 * 新旧 id 同时存在时合并，旧 id 不再保留。
 * @returns {Record<string, ReturnType<typeof createBuilding>>}
 */
export function migrateBuildingIds(buildings) {
  const out = {};
  if (!isPlainObject(buildings)) return out;
  for (const [rawId, slot] of Object.entries(buildings)) {
    const id = resolveBuildingId(rawId);
    const next = normalizeBuildingSlot(slot);
    out[id] = out[id] ? mergeBuildingSlots(out[id], next) : next;
  }
  return out;
}

/** 由 tick 推导天数（第 1 天开始）。 */
export function dayOfTick(tick) {
  return Math.floor((Number(tick) || 0) / TICKS_PER_DAY) + 1;
}

/** 深拷贝。状态是纯 JSON 数据，structuredClone 不可用时退回 JSON。 */
export function cloneState(state) {
  if (state === null || typeof state !== "object") return state;
  if (typeof structuredClone === "function") {
    try {
      return structuredClone(state);
    } catch {
      /* 含不可克隆值时退回 JSON */
    }
  }
  return JSON.parse(JSON.stringify(state));
}

/* --------------------------- 校验 --------------------------- */

function isPlainObject(v) {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function checkNumbers(obj, path, keys, errors, { nonNegative = false } = {}) {
  for (const k of keys) {
    const v = obj?.[k];
    if (typeof v !== "number" || !Number.isFinite(v)) {
      errors.push(`${path}.${k} 应为有限数字，实际为 ${JSON.stringify(v)}`);
    } else if (nonNegative && v < 0) {
      errors.push(`${path}.${k} 不应为负数（${v}）`);
    }
  }
}

/**
 * 开发期结构校验。不抛错，返回问题清单。
 * @returns {{ ok: boolean, errors: string[] }}
 */
export function assertState(state) {
  const errors = [];
  if (!isPlainObject(state)) {
    return { ok: false, errors: ["state 必须是对象"] };
  }

  for (const key of [
    "meta",
    "resources",
    "climate",
    "city",
    "people",
    "army",
    "heroes",
    "quests",
    "flags",
  ]) {
    if (!isPlainObject(state[key])) errors.push(`缺少字段或类型错误：state.${key}`);
  }
  if (!Array.isArray(state.log)) errors.push("state.log 应为数组");

  if (isPlainObject(state.meta)) {
    checkNumbers(state.meta, "meta", ["version", "tick", "day", "playTimeSec"], errors, {
      nonNegative: true,
    });
    if (state.meta.seed === undefined) errors.push("meta.seed 缺失");
    if (!isPlainObject(state.meta.lord)) errors.push("meta.lord 应为对象");
  }

  if (isPlainObject(state.resources)) {
    checkNumbers(state.resources, "resources", RESOURCES, errors, { nonNegative: true });
  }

  if (isPlainObject(state.climate)) {
    checkNumbers(state.climate, "climate", ["temp", "blizzardDaysLeft", "nextBlizzardIn"], errors);
    if (typeof state.climate.furnaceLit !== "boolean") errors.push("climate.furnaceLit 应为布尔值");
  }

  if (isPlainObject(state.city)) {
    checkNumbers(state.city, "city", ["furnaceLevel", "warmthBuildings"], errors, {
      nonNegative: true,
    });
    if (!isPlainObject(state.city.buildings)) {
      errors.push("city.buildings 应为对象");
    } else {
      for (const [id, b] of Object.entries(state.city.buildings)) {
        if (!isPlainObject(b)) {
          errors.push(`city.buildings.${id} 应为对象`);
          continue;
        }
        checkNumbers(b, `city.buildings.${id}`, ["level", "workers", "progress"], errors, {
          nonNegative: true,
        });
        if (typeof b.constructing !== "boolean") {
          errors.push(`city.buildings.${id}.constructing 应为布尔值`);
        }
      }
    }
  }

  if (isPlainObject(state.people)) {
    checkNumbers(state.people, "people", ["pop", "popCap", "morale", "sick", "hungry"], errors, {
      nonNegative: true,
    });
  }

  if (isPlainObject(state.army)) {
    checkNumbers(state.army, "army", ["infantry", "cavalry", "archer", "wounded"], errors, {
      nonNegative: true,
    });
  }

  if (isPlainObject(state.heroes)) {
    if (!Array.isArray(state.heroes.roster)) {
      errors.push("heroes.roster 应为数组");
    } else {
      state.heroes.roster.forEach((h, i) => {
        if (!isPlainObject(h) || !h.id) errors.push(`heroes.roster[${i}] 缺少 id`);
      });
    }
    if (!Array.isArray(state.heroes.deployed)) {
      errors.push("heroes.deployed 应为数组");
    } else if (Array.isArray(state.heroes.roster)) {
      const owned = new Set(state.heroes.roster.map((h) => h?.id));
      for (const id of state.heroes.deployed) {
        if (!owned.has(id)) errors.push(`heroes.deployed 含未拥有的武将：${id}`);
      }
    }
    checkNumbers(state.heroes, "heroes", ["tickets"], errors, { nonNegative: true });
  }

  if (isPlainObject(state.quests)) {
    if (!Array.isArray(state.quests.active)) errors.push("quests.active 应为数组");
    if (!Array.isArray(state.quests.completed)) errors.push("quests.completed 应为数组");
  }

  if (isPlainObject(state.flags)) {
    if (typeof state.flags.tutorialStep !== "number") errors.push("flags.tutorialStep 应为数字");
    // gameOver 兼容两种写法：false / true，或失败原因字符串（"morale" / "extinct"）。
    const over = state.flags.gameOver;
    if (typeof over !== "boolean" && !(typeof over === "string" && over !== "")) {
      errors.push("flags.gameOver 应为布尔值或非空的失败原因字符串");
    }
    if (typeof state.flags.victory !== "boolean") errors.push("flags.victory 应为布尔值");
  }

  if (Array.isArray(state.log)) {
    state.log.forEach((e, i) => {
      if (!isPlainObject(e) || typeof e.text !== "string") {
        errors.push(`log[${i}] 应为 { tick, text, level }`);
      }
    });
  }

  return { ok: errors.length === 0, errors };
}

/* --------------------------- 迁移 --------------------------- */

/** 深合并：以 defaults 补齐 incoming 缺失的键；数组与标量以 incoming 为准。 */
function mergeDefaults(defaults, incoming) {
  if (!isPlainObject(incoming)) return cloneState(defaults);
  const out = isPlainObject(defaults) ? { ...defaults } : {};
  for (const [k, dv] of Object.entries(defaults ?? {})) {
    const iv = incoming[k];
    if (iv === undefined) out[k] = cloneState(dv);
    else if (isPlainObject(dv) && isPlainObject(iv)) out[k] = mergeDefaults(dv, iv);
    else out[k] = iv;
  }
  // 保留 incoming 里 defaults 没有的键（如数据表新增的建筑）
  for (const [k, iv] of Object.entries(incoming)) {
    if (!(k in out)) out[k] = iv;
  }
  return out;
}

/**
 * 把旧存档补齐到当前结构：缺字段用初始值填，建筑槽位补全。
 * 结构不可救时返回 null。
 */
export function normalizeState(raw) {
  if (!isPlainObject(raw)) return null;
  const seed = raw?.meta?.seed ?? 1;
  const merged = mergeDefaults(createInitialState(seed), raw);
  merged.log = Array.isArray(raw.log) ? raw.log.slice(-LOG_MAX) : [];
  merged.meta.version = STATE_VERSION;
  merged.city.buildings = migrateBuildingIds(merged.city.buildings);
  for (const id of BUILDING_IDS) ensureBuilding(merged, id);
  return merged;
}
