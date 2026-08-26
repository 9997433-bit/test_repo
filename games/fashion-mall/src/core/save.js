const KEY = "fashion-mall-save-v1";

export function loadSave() {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function writeSave(state) {
  if (typeof localStorage === "undefined") return false;
  const snapshot = {
    v: 1,
    savedAt: Date.now(),
    data: state,
  };
  localStorage.setItem(KEY, JSON.stringify(snapshot));
  return true;
}

export function exportSave(state) {
  return JSON.stringify({ v: 1, savedAt: Date.now(), data: state }, null, 2);
}

export function importSave(json) {
  const parsed = typeof json === "string" ? JSON.parse(json) : json;
  if (!parsed || parsed.v !== 1 || !parsed.data) throw new Error("存档格式无效");
  return parsed.data;
}

export function migrate(raw) {
  if (!raw) return null;
  if (raw.v === 1 && raw.data) return raw.data;
  return null;
}

export function clearSave() {
  if (typeof localStorage !== "undefined") localStorage.removeItem(KEY);
}
