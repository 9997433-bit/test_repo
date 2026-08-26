/** Shared tunables. Systems must import from here instead of magic numbers. */
export const TICK_MS = 250;
export const TICKS_PER_DAY = 16;
export const SAVE_KEY = "sanguo-ice-age-save-v1";
export const SAVE_VERSION = 1;

export const RESOURCES = ["food", "wood", "coal", "iron"];

export const FACTIONS = ["wei", "shu", "wu", "qun"];
export const FACTION_BEATS = { wu: "shu", shu: "wei", wei: "wu" };

export const TROOP_BEATS = { infantry: "cavalry", cavalry: "archer", archer: "infantry" };

export const QUALITY_RANK = { blue: 1, purple: 2, orange: 3, red: 4 };

export const DEFAULT_LORD = {
  name: "流民县令",
  title: "汉末县令",
};

export const CLIMATE = {
  baseTemp: 4,
  furnaceHeatPerLevel: 3.2,
  fuelWoodPerTick: 0.08,
  fuelCoalPerTick: 0.035,
  blizzardEveryDays: 7,
  blizzardDurationDays: 2,
  blizzardTempDelta: -14,
  freezeThreshold: -6,
  coldThreshold: 0,
  comfortThreshold: 8,
};

export const MORALE = {
  base: 70,
  freezeDrain: 2.4,
  coldDrain: 0.8,
  comfortGain: 0.35,
  kitchenBonus: 0.25,
  clinicBonus: 0.15,
  starveDrain: 3.5,
  collapseAt: 15,
};

export function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}

/* ------------------------------------------------------------------ *
 * 以下由 engine 追加（loop / state / save 使用），仅新增不修改上方内容。
 * ------------------------------------------------------------------ */

/** 一个逻辑 tick 对应的秒数，系统做“每秒产出”折算时用。 */
export const TICK_SEC = TICK_MS / 1000;

/** 主循环参数：定步长累加器 + 补帧上限，避免后台标签页回来后一次性爆 tick。 */
export const LOOP = {
  speeds: [1, 2, 4], // 可选倍速（0 表示暂停）
  maxSpeed: 4,
  maxTicksPerFrame: 8, // 单帧最多补几个 tick
  maxFrameMs: 1000, // 单帧实际时间上限，超出部分直接丢弃
  fallbackFrameMs: 16, // 无 requestAnimationFrame 时的定时器间隔（Node/后台）
};

/** 开局配给：够把火炉升 1~2 级并搭出伐木场 + 猎人小屋。 */
export const START = {
  resources: { food: 320, wood: 420, coal: 140, iron: 60 },
  furnaceLevel: 1,
  pop: 12,
  popCap: 24,
  army: { infantry: 12, cavalry: 0, archer: 0, wounded: 0 },
  heroTickets: 3,
};

/** 开局赠送的橙将占位 id；heroes 数据表就位后用同名 id 关联。 */
export const START_HERO_IDS = ["liubei", "zhangfei", "huatuo"];

/** 城建槽位 id（不含火炉，火炉单独存 city.furnaceLevel）。数据表可扩展。 */
export const BUILDING_IDS = [
  "lumberyard",
  "hunter",
  "coalmine",
  "ironmine",
  "kitchen",
  "clinic",
  "warmhouse",
  "barracks",
  "academy",
];

/** 事件日志保留条数，超出丢最旧的。 */
export const LOG_MAX = 200;

/** 日志级别，UI 按此上色。 */
export const LOG_LEVELS = ["info", "good", "warn", "bad"];
