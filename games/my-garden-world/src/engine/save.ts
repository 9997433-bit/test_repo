import { FLOWERS } from "../data/flowers";
import { SPIRITS } from "../data/spirits";
import { SCHEMA_VERSION, createInitialState, type GameState } from "./state";

const KEY = "my-garden-world:save:v1";

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
  if (!Array.isArray(merged.unlockedSpirits)) merged.unlockedSpirits = [];
  if (typeof merged.level !== "number" || !Number.isFinite(merged.level)) merged.level = base.level;
  if (!merged.stats) merged.stats = base.stats;
  if (!Array.isArray(merged.quests)) merged.quests = base.quests;
  // 老档回填：新增花种/花灵按当前等级静默补齐，避免旧档缺内容或开局刷一串「苏醒」吐司。
  for (const f of FLOWERS) {
    if (f.unlockLevel <= merged.level && !merged.unlockedFlowers.includes(f.id)) merged.unlockedFlowers.push(f.id);
  }
  for (const sp of SPIRITS) {
    if (sp.unlockLevel <= merged.level && !merged.unlockedSpirits.includes(sp.id)) merged.unlockedSpirits.push(sp.id);
  }
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

export function clearSave(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
