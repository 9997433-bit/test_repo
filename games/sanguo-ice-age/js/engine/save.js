/**
 * 存档：localStorage 读写 + 导入导出。
 * 浏览器用 globalThis.localStorage；Node/测试可注入 storage 或用 memoryStorage()。
 */
import { SAVE_KEY, SAVE_VERSION } from "../config.js";
import { assertState, cloneState, normalizeState } from "../state.js";

/** 内存版 Storage（Map 实现），Node 测试或 localStorage 不可用时兜底。 */
export function memoryStorage(initial) {
  const map = new Map(Object.entries(initial ?? {}));
  return {
    get length() {
      return map.size;
    },
    key(i) {
      return [...map.keys()][i] ?? null;
    },
    getItem(k) {
      const key = String(k);
      return map.has(key) ? map.get(key) : null;
    },
    setItem(k, v) {
      map.set(String(k), String(v));
    },
    removeItem(k) {
      map.delete(String(k));
    },
    clear() {
      map.clear();
    },
  };
}

function isUsableStorage(s) {
  if (!s || typeof s.getItem !== "function" || typeof s.setItem !== "function") return false;
  try {
    // Safari 无痕模式下 setItem 会抛错，探一下再用
    const probe = "__sia_probe__";
    s.setItem(probe, "1");
    s.removeItem(probe);
    return true;
  } catch {
    return false;
  }
}

let fallbackStorage = null;
function resolveStorage(storage) {
  if (isUsableStorage(storage)) return storage;
  if (!fallbackStorage) fallbackStorage = memoryStorage();
  return fallbackStorage;
}

/** 打包成带版本号的存档信封。 */
function wrap(state) {
  return {
    format: "sanguo-ice-age",
    version: SAVE_VERSION,
    savedAt: new Date().toISOString(),
    state: cloneState(state),
  };
}

/** 从信封（或裸 state）里取出 state 并补齐到当前结构。 */
function unwrap(payload) {
  if (!payload || typeof payload !== "object") return null;
  const raw = payload.state && typeof payload.state === "object" ? payload.state : payload;
  return normalizeState(raw);
}

function parseJson(json) {
  if (typeof json === "object" && json !== null) return json;
  if (typeof json !== "string" || json.trim() === "") {
    throw new Error("存档内容为空");
  }
  try {
    return JSON.parse(json);
  } catch {
    throw new Error("存档不是合法 JSON");
  }
}

/**
 * 创建一个绑定到指定 storage 的存档适配器。
 * @param {Storage} [storage=globalThis.localStorage]
 * @param {{ key?: string }} [options]
 */
export function createSaveAdapter(storage = globalThis.localStorage, options = {}) {
  const store = resolveStorage(storage);
  const key = options.key ?? SAVE_KEY;

  /** 写入存档，成功返回 true；配额满 / storage 不可用返回 false。 */
  function saveGame(state) {
    if (!state || typeof state !== "object") {
      throw new TypeError("saveGame(state)：state 必须是对象");
    }
    try {
      store.setItem(key, JSON.stringify(wrap(state)));
      return true;
    } catch (err) {
      console.warn("[save] 写入存档失败：", err);
      return false;
    }
  }

  /** 读取存档；无存档或存档损坏返回 null。 */
  function loadGame() {
    let raw = null;
    try {
      raw = store.getItem(key);
    } catch (err) {
      console.warn("[save] 读取存档失败：", err);
      return null;
    }
    if (raw === null || raw === undefined || raw === "") return null;
    let payload;
    try {
      payload = JSON.parse(raw);
    } catch {
      console.warn("[save] 存档已损坏（非法 JSON），按新游戏处理");
      return null;
    }
    const state = unwrap(payload);
    if (!state) {
      console.warn("[save] 存档结构无法识别，按新游戏处理");
      return null;
    }
    const check = assertState(state);
    if (!check.ok) {
      console.warn("[save] 存档校验未通过，按新游戏处理：", check.errors);
      return null;
    }
    return state;
  }

  /** 导出为可复制的字符串。 */
  function exportSave(state) {
    if (!state || typeof state !== "object") {
      throw new TypeError("exportSave(state)：state 必须是对象");
    }
    return JSON.stringify(wrap(state), null, 2);
  }

  /** 导入：成功返回 state，失败抛错（玩家主动操作，需要明确反馈）。 */
  function importSave(json) {
    const payload = parseJson(json);
    const state = unwrap(payload);
    if (!state) throw new Error("存档结构无法识别");
    const check = assertState(state);
    if (!check.ok) {
      throw new Error(`存档校验失败：${check.errors.slice(0, 3).join("；")}`);
    }
    return state;
  }

  /** 删除存档。 */
  function clearSave() {
    try {
      store.removeItem(key);
      return true;
    } catch (err) {
      console.warn("[save] 删除存档失败：", err);
      return false;
    }
  }

  /** 是否已有存档（不做完整校验，只看键是否存在）。 */
  function hasSave() {
    try {
      const raw = store.getItem(key);
      return raw !== null && raw !== undefined && raw !== "";
    } catch {
      return false;
    }
  }

  return { key, storage: store, saveGame, loadGame, exportSave, importSave, clearSave, hasSave };
}

/** 默认适配器：浏览器用 localStorage，Node 自动退回内存实现。 */
const defaultAdapter = createSaveAdapter();

export const saveGame = (state) => defaultAdapter.saveGame(state);
export const loadGame = () => defaultAdapter.loadGame();
export const exportSave = (state) => defaultAdapter.exportSave(state);
export const importSave = (json) => defaultAdapter.importSave(json);
export const clearSave = () => defaultAdapter.clearSave();
export const hasSave = () => defaultAdapter.hasSave();
export { defaultAdapter };
