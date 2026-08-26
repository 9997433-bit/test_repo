export function createBus() {
  const map = new Map();
  return {
    on(type, fn) {
      const set = map.get(type) ?? new Set();
      set.add(fn);
      map.set(type, set);
      return () => set.delete(fn);
    },
    emit(type, payload) {
      const set = map.get(type);
      if (!set) return;
      set.forEach((fn) => fn(payload));
    },
  };
}
