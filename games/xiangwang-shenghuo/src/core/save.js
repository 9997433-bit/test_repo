import { createInitialState, createInitialUi, normalizeHourMs } from "./engine.js";

export const SAVE_KEY = "xwsh.save.v1";

/** 与 farm 的 GREENHOUSE_PLOT_CAP 对齐；core 不许 import systems，所以这里留一份迁移用的本地值。 */
const LEGACY_GREENHOUSE_CAP = 3;
const GREENHOUSE_ID = /^g\d+$/;

const inGreenhouse = (plot) => plot?.greenhouse === true || GREENHOUSE_ID.test(String(plot?.id ?? ""));

/**
 * 地块补字段：`wiltAt`/`greenhouse` 缺就补 0 / false。
 * 另外接一次性迁移：Round 1 的温室是「建成即全场免疫」，Round 2 收紧成一块一块买；
 * 盖过温室却一块温室田都没有的老档，按数组序免费补到上限，规则收紧不该倒扣玩家。
 */
function hydratePlots(plots, buildings) {
  const filled = plots.map((p) => ({ wiltAt: 0, greenhouse: false, ...p }));
  if (!buildings?.greenhouse?.built || filled.some(inGreenhouse)) return filled;
  let left = LEGACY_GREENHOUSE_CAP;
  return filled.map((p) => (left-- > 0 ? { ...p, greenhouse: true } : p));
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
    plots: hydratePlots(arr(saved.plots, base.plots), saved.buildings),
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
