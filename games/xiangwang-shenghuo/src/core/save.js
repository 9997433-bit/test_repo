export const SAVE_KEY = "xwsh.save.v1";

export function serialize(state) {
  return JSON.stringify({ v: 1, savedAt: Date.now(), state });
}

export function deserialize(raw) {
  if (!raw) return null;
  try {
    const doc = JSON.parse(raw);
    if (!doc || doc.v !== 1 || !doc.state) return null;
    return { savedAt: doc.savedAt || Date.now(), state: doc.state };
  } catch {
    return null;
  }
}

export function writeSave(state) {
  localStorage.setItem(SAVE_KEY, serialize(state));
}

export function readSave() {
  return deserialize(localStorage.getItem(SAVE_KEY));
}

export function clearSave() {
  localStorage.removeItem(SAVE_KEY);
}
