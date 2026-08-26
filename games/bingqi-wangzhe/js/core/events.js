/**
 * 极简事件总线 — core 与 forge / combat / ui 之间的唯一耦合点。
 * 纯逻辑，无 DOM 依赖。
 */

/** 监听所有事件的通配符类型。 */
export const ANY = '*';

/**
 * @typedef {Object} Bus
 * @property {(type: string, fn: Function) => (() => void)} on   注册监听，返回取消函数
 * @property {(type: string, fn: Function) => (() => void)} once 只触发一次
 * @property {(type: string, fn?: Function) => void} off         注销（省略 fn 则清空该类型）
 * @property {(type: string, payload?: any) => any[]} emit       广播，返回各监听器返回值
 * @property {(type?: string) => void} clear                     清空（省略类型则清空全部）
 * @property {(type?: string) => number} listenerCount
 * @property {() => string[]} types
 */

/**
 * 创建事件总线。
 * @param {{ onError?: (err: unknown, ctx: { type: string, payload: any }) => void }} [options]
 *        监听器抛错时的回调；默认写 console.error，绝不打断其他监听器。
 * @returns {Bus}
 */
export function createBus(options = {}) {
  /** @type {Map<string, Set<Function>>} */
  const channels = new Map();
  const onError =
    typeof options.onError === 'function'
      ? options.onError
      : (err, ctx) => {
          // eslint-disable-next-line no-console
          console.error(`[bus] listener failed for "${ctx.type}"`, err);
        };

  function on(type, fn) {
    if (typeof type !== 'string' || typeof fn !== 'function') return () => {};
    let set = channels.get(type);
    if (!set) {
      set = new Set();
      channels.set(type, set);
    }
    set.add(fn);
    return () => off(type, fn);
  }

  function once(type, fn) {
    if (typeof fn !== 'function') return () => {};
    const wrapper = (payload, meta) => {
      off(type, wrapper);
      return fn(payload, meta);
    };
    return on(type, wrapper);
  }

  function off(type, fn) {
    const set = channels.get(type);
    if (!set) return;
    if (typeof fn === 'function') {
      set.delete(fn);
    } else {
      set.clear();
    }
    if (set.size === 0) channels.delete(type);
  }

  function emit(type, payload) {
    if (typeof type !== 'string') return [];
    const results = [];
    // 复制一份，允许监听器在回调里 on/off 而不破坏本次遍历。
    const direct = channels.get(type);
    if (direct && direct.size > 0) {
      for (const fn of Array.from(direct)) {
        try {
          results.push(fn(payload, { type }));
        } catch (err) {
          onError(err, { type, payload });
        }
      }
    }
    const wildcard = channels.get(ANY);
    if (wildcard && wildcard.size > 0 && type !== ANY) {
      for (const fn of Array.from(wildcard)) {
        try {
          fn(payload, { type });
        } catch (err) {
          onError(err, { type, payload });
        }
      }
    }
    return results;
  }

  function clear(type) {
    if (typeof type === 'string') channels.delete(type);
    else channels.clear();
  }

  function listenerCount(type) {
    if (typeof type === 'string') return channels.get(type)?.size ?? 0;
    let total = 0;
    for (const set of channels.values()) total += set.size;
    return total;
  }

  function types() {
    return Array.from(channels.keys());
  }

  return { on, once, off, emit, clear, listenerCount, types };
}

export default createBus;
