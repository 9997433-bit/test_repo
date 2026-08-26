const SAVE_KEY = "linghuashi.save.v1";
const SAVE_VERSION = 2;

export function defaultSave() {
  return {
    version: SAVE_VERSION,
    playerName: "无名画徒",
    classId: null,
    realmId: "qi_refining",
    xp: 0,
    qiPills: 0,
    buns: 0,
    talents: {},
    beasts: [],
    gallery: [],
    cleared: [],
    strokeStats: {},
    bestCombo: 0,
    totalWins: 0,
    lastSeenAt: Date.now(),
    idleUntil: Date.now(),
    settings: { mute: false, reducedMotion: false, showHints: true },
    tutorialDone: false,
    inkUnlocked: false,
  };
}

// v1 → v2：补齐关卡进度、笔迹统计、连击纪录等字段；画阁旧条目无 points 仍可展示。
export function migrateSave(parsed) {
  if (!parsed || typeof parsed !== "object") return null;
  if (parsed.version === SAVE_VERSION) return { ...defaultSave(), ...parsed, settings: { ...defaultSave().settings, ...parsed.settings } };
  if (parsed.version === 1) {
    const base = defaultSave();
    return {
      ...base,
      ...parsed,
      version: SAVE_VERSION,
      cleared: Array.isArray(parsed.cleared) ? parsed.cleared : [],
      strokeStats: bestPrecisionByType(parsed.gallery || []),
      bestCombo: 0,
      totalWins: 0,
      settings: { ...base.settings, ...parsed.settings },
    };
  }
  return null;
}

function bestPrecisionByType(gallery) {
  const out = {};
  for (const g of gallery) {
    if (!g?.type) continue;
    out[g.type] = Math.max(out[g.type] || 0, g.precision || 0);
  }
  return out;
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
        const migrated = migrateSave(JSON.parse(raw));
        if (migrated) state = migrated;
        return state;
      } catch {
        return state;
      }
    },
    reset() {
      state = defaultSave();
      try {
        localStorage.removeItem(SAVE_KEY);
      } catch {
        /* ignore */
      }
      subs.forEach((fn) => fn(state));
      return state;
    },
  };
}

export { SAVE_KEY, SAVE_VERSION };
