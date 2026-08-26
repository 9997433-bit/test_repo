const SAVE_KEY = "linghuashi.save.v1";

export function defaultSave() {
  return {
    version: 1,
    playerName: "无名画徒",
    classId: null,
    realmId: "qi_refining",
    xp: 0,
    qiPills: 0,
    buns: 0,
    talents: {},
    beasts: [],
    gallery: [],
    lastSeenAt: Date.now(),
    idleUntil: Date.now(),
    settings: { mute: false, reducedMotion: false },
    tutorialDone: false,
    inkUnlocked: false,
  };
}

export function createStore(initial = defaultSave()) {
  let state = structuredClone(initial);
  const subs = new Set();
  return {
    get: () => state,
    set(patch) {
      state = { ...state, ...patch };
      subs.forEach((fn) => fn(state));
      return state;
    },
    subscribe(fn) {
      subs.add(fn);
      return () => subs.delete(fn);
    },
    persist() {
      try {
        localStorage.setItem(SAVE_KEY, JSON.stringify(state));
      } catch {
        /* ignore quota */
      }
    },
    hydrate() {
      try {
        const raw = localStorage.getItem(SAVE_KEY);
        if (!raw) return state;
        const parsed = JSON.parse(raw);
        if (parsed?.version !== 1) return state;
        state = { ...defaultSave(), ...parsed };
        return state;
      } catch {
        return state;
      }
    },
  };
}

export { SAVE_KEY };
