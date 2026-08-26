/**
 * Save/load with injectable storage so Node tests can run without a browser.
 * Persisted payload: { v: SAVE_VERSION, savedAt, state }.
 */
import { SAVE_KEY, SAVE_VERSION } from "../config.js";

function memoryStorage() {
  const map = new Map();
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: (k) => map.delete(k),
  };
}

let storage =
  typeof globalThis !== "undefined" && globalThis.localStorage
    ? globalThis.localStorage
    : memoryStorage();

export function setStorage(s) {
  storage = s;
}

export function createMemoryStorage() {
  return memoryStorage();
}

/** Fields that are derived or transient and should not be persisted. */
const TRANSIENT = new Set(["flow", "jobs", "lastBattle"]);

export function serializeState(state) {
  const copy = {};
  for (const [k, v] of Object.entries(state)) {
    if (TRANSIENT.has(k)) continue;
    copy[k] = v;
  }
  return JSON.stringify({ v: SAVE_VERSION, savedAt: Date.now(), state: copy });
}

export function deserializeState(json) {
  const payload = JSON.parse(json);
  if (!payload || typeof payload !== "object") throw new Error("存档格式错误");
  if (payload.v !== SAVE_VERSION) throw new Error(`存档版本不兼容（${payload.v} ≠ ${SAVE_VERSION}）`);
  const state = payload.state;
  if (!state || typeof state.tick !== "number" || !state.resources || !state.buildings) {
    throw new Error("存档内容缺失");
  }
  return state;
}

export function saveGame(state) {
  try {
    storage.setItem(SAVE_KEY, serializeState(state));
    return true;
  } catch {
    return false;
  }
}

export function loadGame() {
  try {
    const raw = storage.getItem(SAVE_KEY);
    if (!raw) return null;
    return deserializeState(raw);
  } catch {
    return null;
  }
}

export function clearSave() {
  try {
    storage.removeItem(SAVE_KEY);
  } catch {
    /* ignore */
  }
}

export function exportSave(state) {
  return serializeState(state);
}

export function importSave(json) {
  return deserializeState(json);
}
