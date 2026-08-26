/**
 * 存档抽象层。
 *
 * 规则：逻辑层禁止直接读 `window` / `localStorage`；所有平台访问被封在 adapter 里。
 * 默认使用 memory adapter（Node / 测试可跑），浏览器侧由 UI 传入 localStorage adapter，
 * 或直接用 `createAutoAdapter()` 自动探测。
 */

/** GDD 3.9 约定的存档键。 */
export const SAVE_KEY = 'bqwz.save.v1';

/**
 * @typedef {Object} StorageAdapter
 * @property {string} name
 * @property {(key: string) => (string|null)} getItem
 * @property {(key: string, value: string) => void} setItem
 * @property {(key: string) => void} removeItem
 * @property {() => string[]} [keys]
 */

/**
 * 内存 adapter：Node、测试、以及浏览器不可用时的兜底。
 * @param {Record<string, string>} [seedData]
 * @returns {StorageAdapter}
 */
export function createMemoryAdapter(seedData) {
  const map = new Map(Object.entries(seedData || {}));
  return {
    name: 'memory',
    getItem: (key) => (map.has(key) ? map.get(key) : null),
    setItem: (key, value) => {
      map.set(key, String(value));
    },
    removeItem: (key) => {
      map.delete(key);
    },
    keys: () => Array.from(map.keys()),
  };
}

/**
 * localStorage adapter。**唯一**允许接触宿主存储的地方。
 * @param {{ getItem: Function, setItem: Function, removeItem: Function }} [store]
 *        可显式注入（UI 层传 window.localStorage）；缺省时从 globalThis 探测。
 * @returns {StorageAdapter|null} 不可用时返回 null
 */
export function createLocalStorageAdapter(store) {
  const target = store || pickHostStorage();
  if (!target) return null;
  const probe = `${SAVE_KEY}.__probe__`;
  try {
    target.setItem(probe, '1');
    target.removeItem(probe);
  } catch {
    // 隐私模式 / 配额为 0 / 被策略禁用。
    return null;
  }
  return {
    name: 'localStorage',
    getItem: (key) => {
      try {
        return target.getItem(key);
      } catch {
        return null;
      }
    },
    setItem: (key, value) => {
      target.setItem(key, String(value));
    },
    removeItem: (key) => {
      try {
        target.removeItem(key);
      } catch {
        /* ignore */
      }
    },
    keys: () => {
      try {
        return Object.keys(target);
      } catch {
        return [];
      }
    },
  };
}

/**
 * 优先 localStorage，不可用则退回内存。
 * @returns {StorageAdapter}
 */
export function createAutoAdapter() {
  return createLocalStorageAdapter() || createMemoryAdapter();
}

/**
 * @typedef {Object} Storage
 * @property {string} key
 * @property {StorageAdapter} adapter
 * @property {(data: any) => { ok: boolean, bytes: number, error?: Error }} save
 * @property {() => { ok: boolean, data: any, missing: boolean, error?: Error }} load
 * @property {() => boolean} has
 * @property {() => void} clear
 * @property {() => (string|null)} exportJson
 * @property {(json: string) => { ok: boolean, data: any, error?: Error }} importJson
 * @property {(adapter: StorageAdapter) => void} setAdapter
 */

/**
 * 创建存档读写器（同步；JSON 序列化在这一层完成）。
 * @param {{ adapter?: StorageAdapter, key?: string, onError?: (err: unknown, op: string) => void }} [options]
 * @returns {Storage}
 */
export function createStorage(options = {}) {
  let adapter = isAdapter(options.adapter) ? options.adapter : createMemoryAdapter();
  const key = typeof options.key === 'string' && options.key ? options.key : SAVE_KEY;
  const onError = typeof options.onError === 'function' ? options.onError : () => {};

  function setAdapter(next) {
    if (isAdapter(next)) adapter = next;
  }

  function save(data) {
    let json;
    try {
      json = JSON.stringify(data);
    } catch (err) {
      onError(err, 'serialize');
      return { ok: false, bytes: 0, error: toError(err) };
    }
    try {
      adapter.setItem(key, json);
      return { ok: true, bytes: json.length };
    } catch (err) {
      // 典型：QuotaExceededError。上层可提示玩家清理存档。
      onError(err, 'save');
      return { ok: false, bytes: json.length, error: toError(err) };
    }
  }

  function load() {
    let raw = null;
    try {
      raw = adapter.getItem(key);
    } catch (err) {
      onError(err, 'load');
      return { ok: false, data: null, missing: false, error: toError(err) };
    }
    if (raw === null || raw === undefined || raw === '') {
      return { ok: false, data: null, missing: true };
    }
    try {
      return { ok: true, data: JSON.parse(raw), missing: false };
    } catch (err) {
      onError(err, 'parse');
      return { ok: false, data: null, missing: false, error: toError(err) };
    }
  }

  function has() {
    try {
      const raw = adapter.getItem(key);
      return raw !== null && raw !== undefined && raw !== '';
    } catch {
      return false;
    }
  }

  function clear() {
    try {
      adapter.removeItem(key);
    } catch (err) {
      onError(err, 'clear');
    }
  }

  function exportJson() {
    try {
      return adapter.getItem(key);
    } catch {
      return null;
    }
  }

  function importJson(json) {
    try {
      const data = JSON.parse(String(json));
      const result = save(data);
      if (!result.ok) return { ok: false, data: null, error: result.error };
      return { ok: true, data };
    } catch (err) {
      return { ok: false, data: null, error: toError(err) };
    }
  }

  return {
    key,
    get adapter() {
      return adapter;
    },
    setAdapter,
    save,
    load,
    has,
    clear,
    exportJson,
    importJson,
  };
}

/**
 * 把宽松的输入统一成 Storage 实例：
 * 传 Storage 直接用；传 adapter 包一层；传 undefined 用内存。
 * @param {any} input
 * @param {{ key?: string }} [options]
 * @returns {Storage}
 */
export function resolveStorage(input, options = {}) {
  if (input && typeof input.save === 'function' && typeof input.load === 'function') return input;
  if (isAdapter(input)) return createStorage({ adapter: input, key: options.key });
  return createStorage({ adapter: createMemoryAdapter(), key: options.key });
}

function isAdapter(value) {
  return Boolean(
    value &&
      typeof value.getItem === 'function' &&
      typeof value.setItem === 'function' &&
      typeof value.removeItem === 'function',
  );
}

function pickHostStorage() {
  try {
    const host = globalThis;
    const store = host && host.localStorage;
    if (store && typeof store.getItem === 'function' && typeof store.setItem === 'function') {
      return store;
    }
  } catch {
    // 访问 localStorage 本身就可能抛（跨域 iframe / 禁用 cookie）。
  }
  return null;
}

function toError(err) {
  return err instanceof Error ? err : new Error(String(err));
}

export default createStorage;
