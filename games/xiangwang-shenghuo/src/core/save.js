import { createInitialState, createInitialUi, normalizeHourMs } from "./engine.js";

export const SAVE_KEY = "xwsh.save.v1";

/**
 * 地块补字段：`wiltAt`/`greenhouse` 缺就补 0 / false。
 * 存档还没有 schema 版本号，所以这里**不能**替「盖了温室却没有温室田」的档补温室——
 * 那和刚在 Round 3 里花钱盖完温室的新档长得一模一样，补了等于白送三块地。
 */
function hydratePlots(plots) {
  return plots.map((p) => ({ wiltAt: 0, greenhouse: false, ...p }));
}

export function serialize(state) {
  const { ui, ...rest } = state;
  const clean = { ...rest, ui: { ...createInitialUi(), ...(ui || {}), toast: null, fx: null } };
  return JSON.stringify({ v: 1, savedAt: Date.now(), state: clean });
}

export function deserialize(raw) {
  if (!raw) return null;
  try {
    const doc = JSON.parse(raw);
    if (!doc || doc.v !== 1 || !doc.state) return null;
    return { savedAt: doc.savedAt || Date.now(), state: hydrate(doc.state) };
  } catch {
    return null;
  }
}

/** 老存档缺字段时补上默认值，避免加字段后旧档直接白屏。 */
export function hydrate(saved, base = createInitialState()) {
  if (!saved || typeof saved !== "object") return base;
  const arr = (v, fallback) => (Array.isArray(v) ? v : fallback);
  const meta = { ...base.meta, ...(saved.meta || {}) };
  return {
    ...base,
    ...saved,
    meta: { ...meta, hourMs: normalizeHourMs(meta.hourMs) },
    resources: { ...base.resources, ...(saved.resources || {}) },
    inv: { ...(saved.inv && typeof saved.inv === "object" ? saved.inv : base.inv) },
    buildings: { ...base.buildings, ...(saved.buildings || {}) },
    plots: hydratePlots(arr(saved.plots, base.plots)),
    jobs: arr(saved.jobs, base.jobs),
    wishes: arr(saved.wishes, base.wishes),
    guests: arr(saved.guests, base.guests),
    pets: arr(saved.pets, base.pets),
    log: arr(saved.log, base.log),
    ui: { ...createInitialUi(), ...(saved.ui || {}), toast: null, fx: null },
  };
}

function storage() {
  try {
    return typeof localStorage === "undefined" ? null : localStorage;
  } catch {
    return null;
  }
}

export function writeSave(state) {
  const store = storage();
  if (!store) return false;
  try {
    store.setItem(SAVE_KEY, serialize(state));
    return true;
  } catch {
    return false;
  }
}

export function readSave() {
  const store = storage();
  if (!store) return null;
  try {
    return deserialize(store.getItem(SAVE_KEY));
  } catch {
    return null;
  }
}

export function clearSave() {
  const store = storage();
  if (!store) return;
  try {
    store.removeItem(SAVE_KEY);
  } catch {
    /* 私密模式下写不了就算了 */
  }
}
