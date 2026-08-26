/**
 * 极简事件总线。发布期间对监听列表做快照，
 * 因此监听器内部再订阅/退订不会破坏本次派发。
 */
export function createBus() {
  const map = new Map();
  const anyList = [];

  function listeners(type) {
    let list = map.get(type);
    if (!list) {
      list = [];
      map.set(type, list);
    }
    return list;
  }

  function off(type, fn) {
    const list = map.get(type);
    if (!list) return false;
    const i = list.indexOf(fn);
    if (i < 0) return false;
    list.splice(i, 1);
    if (!list.length) map.delete(type);
    return true;
  }

  return {
    on(type, fn) {
      if (typeof fn !== "function") return () => {};
      listeners(type).push(fn);
      return () => off(type, fn);
    },
    once(type, fn) {
      if (typeof fn !== "function") return () => {};
      const wrap = (payload) => {
        off(type, wrap);
        fn(payload);
      };
      listeners(type).push(wrap);
      return () => off(type, wrap);
    },
    /** 监听全部事件，回调签名 (type, payload)。 */
    onAny(fn) {
      if (typeof fn !== "function") return () => {};
      anyList.push(fn);
      return () => {
        const i = anyList.indexOf(fn);
        if (i >= 0) anyList.splice(i, 1);
      };
    },
    off,
    emit(type, payload) {
      const list = map.get(type);
      if (list && list.length) {
        for (const fn of list.slice()) safeCall(fn, type, payload, false);
      }
      if (anyList.length) {
        for (const fn of anyList.slice()) safeCall(fn, type, payload, true);
      }
    },
    clear(type) {
      if (type == null) {
        map.clear();
        anyList.length = 0;
      } else {
        map.delete(type);
      }
    },
  };
}

/** 单个监听器抛错不应中断整局游戏循环。 */
function safeCall(fn, type, payload, withType) {
  try {
    if (withType) fn(type, payload);
    else fn(payload);
  } catch (err) {
    if (typeof console !== "undefined") console.error(`[bus] ${type} listener failed`, err);
  }
}
