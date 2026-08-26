export function createStore(initial, reducer) {
  let state = structuredClone(initial);
  const subs = new Set();
  return {
    getState: () => state,
    subscribe(fn) {
      subs.add(fn);
      return () => subs.delete(fn);
    },
    dispatch(action) {
      const next = reducer(state, action);
      if (next && next !== state) {
        state = next;
        for (const fn of subs) fn(state, action);
      }
      return state;
    },
    replace(next) {
      state = next;
      for (const fn of subs) fn(state, { type: "meta/replace" });
    },
  };
}

export function merge(state, patch) {
  if (!patch) return state;
  return { ...state, ...patch };
}

export function addInv(state, id, qty) {
  const inv = { ...state.inv, [id]: (state.inv[id] || 0) + qty };
  if (inv[id] <= 0) delete inv[id];
  return { ...state, inv };
}

export function hasInv(state, needs) {
  return Object.entries(needs).every(([id, n]) => (state.inv[id] || 0) >= n);
}

export function spendInv(state, needs) {
  if (!hasInv(state, needs)) return { ok: false, reason: "材料不够", state };
  let next = state;
  for (const [id, n] of Object.entries(needs)) next = addInv(next, id, -n);
  return { ok: true, state: next };
}
