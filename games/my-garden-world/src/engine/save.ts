import { DECORATIONS, THEMES, ANCHOR_MAP, ANCHORS } from "../data/decorations";
import { FLOWERS } from "../data/flowers";
import { SCHEMA_VERSION, createInitialState, emptySocial, type GameState, type SocialMark } from "./state";

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

const DECOR_IDS = new Set(DECORATIONS.map((d) => d.id));
const NEIGHBOR_ID_RE = /^[a-z][a-z0-9-]*$/;

/**
 * 锚位表清洗 + 默认落位：丢弃未知锚位 / 未购陈设 / 撞锚的条目，
 * 再把没有锚位的已购陈设按锚位序补默认落座（v2 存档「购买即可见」不变）。
 */
function reconcileAnchors(raw: unknown, owned: string[]): Record<string, string> {
  const out: Record<string, string> = {};
  const usedAnchors = new Set<string>();
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    for (const [decorId, anchorId] of Object.entries(raw as Record<string, unknown>)) {
      if (typeof anchorId !== "string" || !ANCHOR_MAP[anchorId]) continue;
      if (!owned.includes(decorId) || usedAnchors.has(anchorId) || decorId in out) continue;
      out[decorId] = anchorId;
      usedAnchors.add(anchorId);
    }
  }
  for (const decorId of owned) {
    if (decorId in out) continue;
    const free = ANCHORS.find((a) => !usedAnchors.has(a.id));
    if (!free) break;
    out[decorId] = free.id;
    usedAnchors.add(free.id);
  }
  return out;
}

function reconcileSocial(raw: unknown): GameState["social"] {
  const base = emptySocial();
  if (!raw || typeof raw !== "object") return base;
  const s = raw as Partial<GameState["social"]>;
  base.day = Math.floor(num(s.day, 0, 0));
  if (s.friendship && typeof s.friendship === "object" && !Array.isArray(s.friendship)) {
    for (const [id, v] of Object.entries(s.friendship)) {
      if (NEIGHBOR_ID_RE.test(id)) base.friendship[id] = Math.floor(num(v, 0, 0));
    }
  }
  if (Array.isArray(s.marks)) {
    base.marks = s.marks.filter(
      (m): m is SocialMark =>
        Boolean(m) &&
        typeof m === "object" &&
        typeof m.n === "string" &&
        typeof m.p === "number" &&
        (m.k === "water" || m.k === "pick"),
    );
  }
  return base;
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
  merged.placedDecor = merged.placedDecor.filter((id, i, arr) => typeof id === "string" && arr.indexOf(id) === i);
  if (!merged.stats) merged.stats = base.stats;
  if (!Array.isArray(merged.quests)) merged.quests = base.quests;
  merged.level = Math.floor(num(s.level, base.level, 1));
  merged.unlockedFlowers = reconcileUnlocks(s.unlockedFlowers, merged.level);
  // v1 没有墙钟锚点：以本次加载为准，旧档首次回来不补发离线收益
  merged.lastSeenAt = num(s.lastSeenAt, now, 0);
  // v3：锚位摆放 / 邻访 / 主题 / 一次性提示
  merged.decorAnchors = reconcileAnchors(s.decorAnchors, merged.placedDecor.filter((id) => DECOR_IDS.has(id)));
  merged.social = reconcileSocial(s.social);
  merged.decorTheme = THEMES.some((t) => t.id === s.decorTheme) ? (s.decorTheme ?? null) : null;
  merged.seenTips = Array.isArray(s.seenTips) ? s.seenTips.filter((t): t is string => typeof t === "string") : [];
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
