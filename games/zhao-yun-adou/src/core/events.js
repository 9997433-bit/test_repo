export function createBus() {
  const map = new Map();
  return {
    on(type, fn) {
      const list = map.get(type) || [];
      list.push(fn);
      map.set(type, list);
      return () => {
        map.set(
          type,
          (map.get(type) || []).filter((x) => x !== fn),
        );
      };
    },
    emit(type, payload) {
      for (const fn of map.get(type) || []) fn(payload);
    },
  };
}
