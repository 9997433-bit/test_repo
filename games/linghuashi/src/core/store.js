const SAVE_KEY = "linghuashi.save.v1";

// 只活在本次会话里的字段：写盘时剔除，避免重开时重复弹提示或复现旧结算。
const TRANSIENT_KEYS = ["idleClaim", "idleClaimed", "idleNoticeShown", "notice", "inkJustUnlocked"];

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
    clearedStages: [],
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
    /** patch 可以是对象，也可以是 (state) => patch，便于在异步回调里基于最新状态更新。 */
    set(patch) {
      const next = typeof patch === "function" ? patch(state) : patch;
      if (!next) return state;
      state = { ...state, ...next };
      subs.forEach((fn) => fn(state));
      return state;
    },
    subscribe(fn) {
      subs.add(fn);
      return () => subs.delete(fn);
    },
    persist() {
      try {
        const snapshot = { ...state };
        for (const key of TRANSIENT_KEYS) delete snapshot[key];
        localStorage.setItem(SAVE_KEY, JSON.stringify(snapshot));
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
        const base = defaultSave();
        state = {
          ...base,
          ...parsed,
          settings: { ...base.settings, ...(parsed.settings || {}) },
          talents: { ...(parsed.talents || {}) },
          beasts: Array.isArray(parsed.beasts) ? parsed.beasts : [],
          gallery: Array.isArray(parsed.gallery) ? parsed.gallery : [],
          clearedStages: Array.isArray(parsed.clearedStages) ? parsed.clearedStages : [],
        };
        return state;
      } catch {
        return state;
      }
    },
  };
}

export { SAVE_KEY };
