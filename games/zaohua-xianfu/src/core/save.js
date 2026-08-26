export const SAVE_KEY = "zaohua-xianfu-v1";
export const SCHEMA = 1;

export function loadSave(storage = globalThis.localStorage) {
  try {
    const raw = storage?.getItem(SAVE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (data?.schemaVersion !== SCHEMA) return null;
    return data.state;
  } catch {
    return null;
  }
}

export function writeSave(state, storage = globalThis.localStorage) {
  try {
    storage?.setItem(
      SAVE_KEY,
      JSON.stringify({ schemaVersion: SCHEMA, state, savedAt: Date.now() }),
    );
    return true;
  } catch {
    return false;
  }
}

export function clearSave(storage = globalThis.localStorage) {
  try {
    storage?.removeItem(SAVE_KEY);
  } catch {
    /* ignore */
  }
}
