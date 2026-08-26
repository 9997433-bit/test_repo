export const SAVE_KEY = "zaohua-xianfu-v1";
export const CORRUPT_KEY = "zaohua-xianfu-v1:corrupt";
export const SCHEMA = 1;

export const SAVE_STATUS = {
  empty: "empty",
  ok: "ok",
  corrupt: "corrupt",
  unsupported: "unsupported",
  unavailable: "unavailable",
};

function store(storage) {
  return storage ?? globalThis.localStorage ?? null;
}

/**
 * 读档并说明结果，便于上层区分「没有档」「档坏了」「版本不认识」。
 * 只做结构判定，数值收敛交给 state.normalizeState。
 */
export function readSave(storage = globalThis.localStorage) {
  const target = store(storage);
  if (!target) return { status: SAVE_STATUS.unavailable, state: null, savedAt: 0, reason: "no-storage" };
  let raw;
  try {
    raw = target.getItem(SAVE_KEY);
  } catch (err) {
    return { status: SAVE_STATUS.unavailable, state: null, savedAt: 0, reason: String(err?.message ?? err) };
  }
  if (!raw) return { status: SAVE_STATUS.empty, state: null, savedAt: 0, reason: "" };

  let data;
  try {
    data = JSON.parse(raw);
  } catch (err) {
    return { status: SAVE_STATUS.corrupt, state: null, savedAt: 0, reason: `json:${err?.message ?? "parse"}` };
  }
  if (!data || typeof data !== "object") {
    return { status: SAVE_STATUS.corrupt, state: null, savedAt: 0, reason: "envelope" };
  }
  if (data.schemaVersion !== SCHEMA) {
    return { status: SAVE_STATUS.unsupported, state: null, savedAt: 0, reason: `schema:${data.schemaVersion}` };
  }
  if (!data.state || typeof data.state !== "object" || Array.isArray(data.state)) {
    return { status: SAVE_STATUS.corrupt, state: null, savedAt: 0, reason: "state" };
  }
  return { status: SAVE_STATUS.ok, state: data.state, savedAt: Number(data.savedAt) || 0, reason: "" };
}

export function loadSave(storage = globalThis.localStorage) {
  return readSave(storage).state;
}

/** 写档并回报字节数/失败原因（配额超限等）。 */
export function writeSaveDetailed(state, storage = globalThis.localStorage) {
  const target = store(storage);
  if (!target) return { ok: false, bytes: 0, error: "no-storage" };
  let payload;
  try {
    payload = JSON.stringify({ schemaVersion: SCHEMA, state, savedAt: Date.now() });
  } catch (err) {
    return { ok: false, bytes: 0, error: `serialize:${err?.message ?? "failed"}` };
  }
  try {
    target.setItem(SAVE_KEY, payload);
    return { ok: true, bytes: payload.length, error: "" };
  } catch (err) {
    return { ok: false, bytes: payload.length, error: String(err?.name ?? err?.message ?? "write") };
  }
}

export function writeSave(state, storage = globalThis.localStorage) {
  return writeSaveDetailed(state, storage).ok;
}

/** 坏档搬到旁路键留档，主键让下一次正常写入覆盖。 */
export function backupCorrupt(storage = globalThis.localStorage) {
  const target = store(storage);
  if (!target) return false;
  try {
    const raw = target.getItem(SAVE_KEY);
    if (raw == null) return false;
    target.setItem(CORRUPT_KEY, raw);
    return true;
  } catch {
    return false;
  }
}

export function clearSave(storage = globalThis.localStorage) {
  const target = store(storage);
  if (!target) return false;
  try {
    target.removeItem(SAVE_KEY);
    return true;
  } catch {
    return false;
  }
}
