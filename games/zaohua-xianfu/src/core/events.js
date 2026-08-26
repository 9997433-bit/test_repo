/** 核心事件名：存档异常与离线结算都靠它对外播报。 */
export const EVENTS = {
  saveWritten: "save:written",
  saveFailed: "save:failed",
  saveCorrupt: "save:corrupt",
  saveCleared: "save:cleared",
  offlineBanked: "offline:banked",
  offlineApplied: "offline:applied",
  offlineCollected: "offline:collected",
  subscriberError: "subscriber:error",
};

export function createBus() {
  const map = new Map();

  function off(type, fn) {
    const list = map.get(type);
    if (!list) return;
    const next = list.filter((x) => x !== fn);
    if (next.length) map.set(type, next);
    else map.delete(type);
  }

  return {
    on(type, fn) {
      if (typeof fn !== "function") return () => {};
      map.set(type, [...(map.get(type) ?? []), fn]);
      return () => off(type, fn);
    },
    once(type, fn) {
      const dispose = this.on(type, (payload) => {
        dispose();
        fn(payload);
      });
      return dispose;
    },
    off,
    /** 遍历副本：监听器在回调里退订不会漏播；单个监听器抛错不拖垮 dispatch。 */
    emit(type, payload) {
      const list = map.get(type);
      if (!list?.length) return 0;
      let delivered = 0;
      for (const fn of [...list]) {
        try {
          fn(payload);
          delivered += 1;
        } catch (err) {
          if (type !== EVENTS.subscriberError) {
            console.error(`[zaohua] listener failed for ${type}`, err);
          }
        }
      }
      return delivered;
    },
    listenerCount(type) {
      return map.get(type)?.length ?? 0;
    },
    clear() {
      map.clear();
    },
  };
}
