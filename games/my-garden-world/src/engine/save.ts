import { THEMES, type DecorTheme } from "../data/decorations";
import { FLOWERS } from "../data/flowers";
import {
  DAILY_PICK,
  DAILY_WATER_HELP,
  FRIENDSHIP_MAX,
  MARKS_CAP,
  SCHEMA_VERSION,
  createInitialState,
  createSocialState,
  type GameState,
  type SocialState,
  type VisitMark,
} from "./state";

const KEY = "my-garden-world:save:v1";

/** 去抖窗口：连续操作安静下来 400ms 后才落一次盘。 */
export const SAVE_DEBOUNCE_MS = 400;
/** 封顶等待：持续操作时也保证 4s 内至少写一次，异常退出最多丢这么多进度。 */
export const SAVE_MAX_WAIT_MS = 4_000;
/** 重排定时器的容差：主循环逐帧调度时避免每帧 clearTimeout/setTimeout 抖动。 */
const REARM_TOLERANCE_MS = 50;

let saveTimer: ReturnType<typeof setTimeout> | null = null;
let armedAt = 0;
let pending: GameState | null = null;
let pendingSince = 0;
let lastPayload: string | null = null;

function clearTimer(): void {
  if (saveTimer !== null) {
    clearTimeout(saveTimer);
    saveTimer = null;
  }
}

function write(state: GameState): boolean {
  let payload: string;
  try {
    payload = JSON.stringify(state);
  } catch {
    return false;
  }
  try {
    // 内容没变就不写：闲置的花园不该反复重写 localStorage
    if (payload === lastPayload && localStorage.getItem(KEY) === payload) return false;
    localStorage.setItem(KEY, payload);
    lastPayload = payload;
    return true;
  } catch {
    return false; // quota / 隐私模式
  }
}

function fire(): void {
  saveTimer = null;
  const state = pending;
  pending = null;
  if (state) write(state);
}

/**
 * 去抖落盘：高频调用只在安静 SAVE_DEBOUNCE_MS 后写一次；
 * 若调用一直不停，最迟也会在 SAVE_MAX_WAIT_MS 时强制写一次。
 */
export function scheduleSave(state: GameState): void {
  const now = Date.now();
  if (saveTimer === null) pendingSince = now;
  pending = state;
  const deadline = Math.min(now + SAVE_DEBOUNCE_MS, pendingSince + SAVE_MAX_WAIT_MS);
  if (saveTimer !== null && Math.abs(deadline - armedAt) <= REARM_TOLERANCE_MS) return;
  clearTimer();
  armedAt = deadline;
  saveTimer = setTimeout(fire, Math.max(0, deadline - now));
}

/** 关键节点（隐藏页面 / 关闭标签 / 停循环）立刻刷盘；省略 state 则刷挂起的那份。 */
export function flushSave(state?: GameState): boolean {
  const target = state ?? pending;
  clearTimer();
  pending = null;
  return target ? write(target) : false;
}

export function hasPendingSave(): boolean {
  return saveTimer !== null;
}

/** 丢弃挂起的写入与内容缓存（换存档 / 测试隔离）。 */
export function resetSaveScheduler(): void {
  clearTimer();
  pending = null;
  lastPayload = null;
}

/** 立即写盘，不经过去抖。 */
export function saveState(state: GameState): boolean {
  clearTimer();
  pending = null;
  return write(state);
}

/**
 * 解锁花种表补齐：旧档只在「升级那一瞬」写入解锁，
 * 中途新增的花种、或错过的解锁等级都会永远缺席，这里按等级回填。
 * 只增不减——玩家已持有但超出当前等级的花种（活动 / 后台发放）保留。
 */
function reconcileUnlocks(raw: unknown, level: number): string[] {
  const valid = new Set(FLOWERS.map((f) => f.id));
  const seen = new Set<string>();
  const out: string[] = [];
  if (Array.isArray(raw)) {
    for (const id of raw) {
      if (typeof id === "string" && valid.has(id) && !seen.has(id)) {
        seen.add(id);
        out.push(id);
      }
    }
  }
  for (const f of FLOWERS) {
    if (f.unlockLevel <= level && !seen.has(f.id)) {
      seen.add(f.id);
      out.push(f.id);
    }
  }
  return out;
}

function num(value: unknown, fallback: number, min = Number.NEGATIVE_INFINITY): number {
  return typeof value === "number" && Number.isFinite(value) && value >= min ? value : fallback;
}

function clampInt(value: unknown, fallback: number, min: number, max: number): number {
  const n = Math.floor(num(value, fallback));
  return Math.min(max, Math.max(min, n));
}

const THEME_IDS = new Set<string>(THEMES.map((t) => t.id));

/** 主题只认目录里有的那几套；旧档 / 改档写进来的野值一律当作没套过主题。 */
function normalizeTheme(raw: unknown): DecorTheme | null {
  return typeof raw === "string" && THEME_IDS.has(raw) ? (raw as DecorTheme) : null;
}

/**
 * v3 邻里状态：v1/v2 旧档没有这一段，补一份空的（当日余量给满，交情从零起）。
 * 已有的段落逐字段体检——余量必须落在合法区间，交情只留有限数，痕迹只留形状对的条目。
 */
function normalizeSocial(raw: unknown): SocialState {
  const base = createSocialState();
  if (!raw || typeof raw !== "object") return base;
  const s = raw as Partial<SocialState>;
  const friendship: Record<string, number> = {};
  if (s.friendship && typeof s.friendship === "object") {
    for (const [id, value] of Object.entries(s.friendship as Record<string, unknown>)) {
      if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) continue;
      friendship[id] = Math.min(FRIENDSHIP_MAX, Math.floor(value));
    }
  }
  const marks: VisitMark[] = [];
  if (Array.isArray(s.marks)) {
    for (const mark of s.marks as unknown[]) {
      if (!mark || typeof mark !== "object") continue;
      const m = mark as Partial<VisitMark>;
      if (typeof m.neighborId !== "string") continue;
      if (m.kind !== "water" && m.kind !== "pick") continue;
      if (typeof m.plotIdx !== "number" || !Number.isInteger(m.plotIdx) || m.plotIdx < 0) continue;
      marks.push({ neighborId: m.neighborId, plotIdx: m.plotIdx, kind: m.kind });
      if (marks.length >= MARKS_CAP) break;
    }
  }
  return {
    day: clampInt(s.day, 0, 0, Number.MAX_SAFE_INTEGER),
    waterLeft: clampInt(s.waterLeft, DAILY_WATER_HELP, 0, DAILY_WATER_HELP),
    pickLeft: clampInt(s.pickLeft, DAILY_PICK, 0, DAILY_PICK),
    friendship,
    marks,
  };
}

export function migrate(raw: unknown, now = Date.now()): GameState {
  const base = createInitialState(now);
  if (!raw || typeof raw !== "object") return base;
  const s = raw as Partial<GameState>;
  const merged: GameState = { ...base, ...s, schemaVersion: SCHEMA_VERSION };
  if (!Array.isArray(merged.plots) || merged.plots.length < 1) merged.plots = base.plots;
  if (!merged.inventory || typeof merged.inventory !== "object") merged.inventory = {};
  if (!Array.isArray(merged.orders)) merged.orders = [];
  if (!Array.isArray(merged.arrangements)) merged.arrangements = [];
  if (!Array.isArray(merged.placedDecor)) merged.placedDecor = [];
  if (!merged.stats) merged.stats = base.stats;
  if (!Array.isArray(merged.quests)) merged.quests = base.quests;
  merged.level = Math.floor(num(s.level, base.level, 1));
  merged.unlockedFlowers = reconcileUnlocks(s.unlockedFlowers, merged.level);
  // v1 没有墙钟锚点：以本次加载为准，旧档首次回来不补发离线收益
  merged.lastSeenAt = num(s.lastSeenAt, now, 0);
  // v3 两段：主题只认目录内的 id，邻里状态缺则补空、有则体检
  merged.decorTheme = normalizeTheme(s.decorTheme);
  merged.social = normalizeSocial(s.social);
  return merged;
}

export function loadState(): GameState {
  resetSaveScheduler();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return createInitialState();
    return migrate(JSON.parse(raw) as unknown);
  } catch {
    return createInitialState();
  }
}

export function clearSave(): void {
  resetSaveScheduler();
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
