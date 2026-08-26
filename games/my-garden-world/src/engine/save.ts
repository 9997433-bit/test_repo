import { SCHEMA_VERSION, createInitialState, type GameState } from "./state";

const KEY = "my-garden-world:save:v1";

/** 连续改动合并写入的静默窗口 */
export const SAVE_DEBOUNCE_MS = 700;
/** 即使改动不断，最长也不会超过这个间隔落盘 */
export const SAVE_MAX_DELAY_MS = 5_000;

let pending: GameState | null = null;
let timer: ReturnType<typeof setTimeout> | null = null;
let queuedAt = 0;

export function migrate(raw: unknown): GameState {
  const base = createInitialState();
  if (!raw || typeof raw !== "object") return base;
  const s = raw as Partial<GameState>;
  const merged: GameState = { ...base, ...s, schemaVersion: SCHEMA_VERSION };
  if (!Array.isArray(merged.plots) || merged.plots.length < 1) merged.plots = base.plots;
  if (!merged.inventory || typeof merged.inventory !== "object") merged.inventory = {};
  if (!Array.isArray(merged.orders)) merged.orders = [];
  if (!Array.isArray(merged.arrangements)) merged.arrangements = [];
  if (!Array.isArray(merged.placedDecor)) merged.placedDecor = [];
  if (!Array.isArray(merged.unlockedFlowers)) merged.unlockedFlowers = base.unlockedFlowers;
  if (!merged.stats) merged.stats = base.stats;
  if (!Array.isArray(merged.quests)) merged.quests = base.quests;
  return merged;
}

export function loadState(): GameState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return createInitialState();
    return migrate(JSON.parse(raw) as unknown);
  } catch {
    return createInitialState();
  }
}

export function saveState(state: GameState): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* quota / private mode */
  }
}

function clearTimer(): void {
  if (timer !== null) {
    clearTimeout(timer);
    timer = null;
  }
}

/** 合并高频改动：静默 SAVE_DEBOUNCE_MS 后落盘，最长不超过 SAVE_MAX_DELAY_MS */
export function scheduleSave(state: GameState, now = Date.now()): void {
  pending = state;
  if (queuedAt === 0) queuedAt = now;
  if (now - queuedAt >= SAVE_MAX_DELAY_MS) {
    flushSave();
    return;
  }
  clearTimer();
  timer = setTimeout(() => {
    timer = null;
    flushSave();
  }, SAVE_DEBOUNCE_MS);
}

export function hasPendingSave(): boolean {
  return pending !== null;
}

/** 立刻落盘尚未写出的存档，返回是否真的写了 */
export function flushSave(): boolean {
  clearTimer();
  const state = pending;
  pending = null;
  queuedAt = 0;
  if (!state) return false;
  saveState(state);
  return true;
}

/** 丢弃待写存档（重置时用，避免刷新前被写回） */
export function dropPendingSave(): void {
  clearTimer();
  pending = null;
  queuedAt = 0;
}

export function clearSave(): void {
  dropPendingSave();
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

/** 切到后台或关闭页面时补写一次，返回卸载函数 */
export function installSaveFlush(get: () => GameState): () => void {
  if (typeof document === "undefined" || typeof window === "undefined") return () => {};
  const flush = (): void => {
    scheduleSave(get());
    flushSave();
  };
  const onVisibility = (): void => {
    if (document.visibilityState === "hidden") flush();
  };
  document.addEventListener("visibilitychange", onVisibility);
  window.addEventListener("pagehide", flush);
  window.addEventListener("beforeunload", flush);
  return () => {
    document.removeEventListener("visibilitychange", onVisibility);
    window.removeEventListener("pagehide", flush);
    window.removeEventListener("beforeunload", flush);
  };
}
