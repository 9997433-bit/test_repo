export function createBus() {
  const listeners = new Map();
  return {
    on(type, fn) {
      const list = listeners.get(type) ?? [];
      list.push(fn);
      listeners.set(type, list);
      return () => {
        listeners.set(
          type,
          (listeners.get(type) ?? []).filter((x) => x !== fn),
        );
      };
    },
    emit(type, payload) {
      for (const fn of listeners.get(type) ?? []) fn(payload);
    },
  };
}
