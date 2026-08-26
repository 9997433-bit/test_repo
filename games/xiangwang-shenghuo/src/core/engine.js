import { SEASONS } from "../data/crops.js";
import { XP_TABLE, levelForXp } from "../data/levels.js";

export const HOUR_MS_DEFAULT = 6_000;
/** 设置里能切的时速档：1 游戏时 = 3 / 6 / 12 秒真实时间。 */
export const HOUR_MS_CHOICES = [3_000, 6_000, 12_000];
export const DAY_HOURS = 24;
export const DAYS_PER_SEASON = 7;

/** 离线折算上限：8 真实小时（farm 内同名常量与此对齐）。 */
export const OFFLINE_CAP_MS = 8 * 60 * 60 * 1000;

/** 升级所需累计经验，索引 i 对应 Lv.(i+1)。事实源是 data/levels.js，这里只做再导出。 */
export const LEVELS = XP_TABLE;

/** 新手引导：翻土 → 播种 → 收获 → 进屋看看 */
export const TUTORIAL_TOTAL = 4;

export const levelFor = levelForXp;

/** 存档/设置里读到的时速一律先过白名单，非法值当默认档。 */
export function normalizeHourMs(value) {
  return HOUR_MS_CHOICES.includes(value) ? value : HOUR_MS_DEFAULT;
}

/** 顺着 3 秒 → 6 秒 → 12 秒 → 3 秒 转一格，供设置按钮循环切档。 */
export function nextHourMs(value) {
  const i = HOUR_MS_CHOICES.indexOf(normalizeHourMs(value));
  return HOUR_MS_CHOICES[(i + 1) % HOUR_MS_CHOICES.length];
}

export function levelProgress(xp) {
  const level = levelFor(xp);
  const base = LEVELS[level - 1] ?? 0;
  const next = LEVELS[level] ?? null;
  if (next === null) return { level, base, next: null, pct: 100 };
  const pct = Math.max(0, Math.min(100, ((xp - base) / (next - base)) * 100));
  return { level, base, next, pct };
}

export function createInitialState() {
  return {
    meta: {
      name: "新村长",
      level: 1,
      xp: 0,
      hourMs: HOUR_MS_DEFAULT,
      gameMinutes: 8 * 60,
      day: 1,
      season: "spring",
      muted: false,
      tutorialStep: 0,
    },
    // 开局只送一把锹（够开第 3 块田）；斧和锯走心愿保底掉落，见 GDD「工具经济」。
    resources: { coin: 80, pearl: 0, happiness: 40, warmth: 20, pop: 2, popCap: 4, shovel: 1, axe: 0, saw: 0 },
    inv: { chili: 2 },
    plots: [
      { id: "p1", status: "empty", cropId: null, plantedAt: 0, doneAt: 0, wiltAt: 0, greenhouse: false },
      { id: "p2", status: "untilled", cropId: null, plantedAt: 0, doneAt: 0, wiltAt: 0, greenhouse: false },
    ],
    buildings: {
      mushroom: { built: true, slots: [] },
      wish: { built: true, slots: [] },
    },
    jobs: [],
    wishes: [],
    guests: [],
    pets: [
      { id: "hua", name: "小花", kind: "dog", readyAt: 0 },
      { id: "tuan", name: "小团", kind: "cat", readyAt: 0 },
    ],
    log: ["蘑菇屋的门开了一条缝。风里有柴火和泥土的味道。"],
    ui: createInitialUi(),
  };
}

/** 纯视图状态：选中的种子、打开的房子、飘字、音效信号。存档会带上，缺失时补默认值。 */
export function createInitialUi() {
  return {
    seed: "rice",
    selected: "wish",
    toast: null,
    fx: null,
    rerolls: 0,
    sellId: null,
    sellQty: 1,
    serveTo: null,
  };
}

/** 不落盘的换算：把「第几日 + 日内分钟」摊平成一条游戏分钟数轴。 */
export function absGameMinutes(meta = {}) {
  return ((meta.day || 1) - 1) * DAY_HOURS * 60 + (meta.gameMinutes || 0);
}

export function advanceTime(state, dtMs) {
  const hourMs = state.meta.hourMs || HOUR_MS_DEFAULT;
  let minutes = state.meta.gameMinutes + (dtMs / hourMs) * 60;
  let day = state.meta.day;
  let season = state.meta.season;
  let crossedDay = false;
  let crossedSeason = false;
  while (minutes >= DAY_HOURS * 60) {
    minutes -= DAY_HOURS * 60;
    day += 1;
    crossedDay = true;
    if ((day - 1) % DAYS_PER_SEASON === 0 && day > 1) {
      const i = SEASONS.indexOf(season);
      season = SEASONS[(i + 1) % SEASONS.length];
      crossedSeason = true;
    }
  }
  return {
    state: { ...state, meta: { ...state.meta, gameMinutes: minutes, day, season } },
    crossedDay,
    crossedSeason,
  };
}
