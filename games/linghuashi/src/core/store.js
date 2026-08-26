const SAVE_KEY = "linghuashi.save.v1";

// 只活在本次会话里的字段：写盘时剔除，避免重开时重复弹提示或复现旧结算。
const TRANSIENT_KEYS = ["idleClaim", "idleClaimed", "idleNoticeShown", "notice", "inkJustUnlocked", "battleId", "settledBattleId"];

/** 画阁最多留多少笔。存档大小的主要来源，改动前先算一遍 JSON 体积。 */
export const GALLERY_LIMIT = 24;
/** 单笔最多存多少个归一化点：32 点足够回放认形，24 笔合计 ≈ 18KB。 */
export const GALLERY_POINTS = 32;

function galleryPoints(points) {
  if (!Array.isArray(points)) return null;
  const out = [];
  for (const p of points) {
    const x = Number(p?.x);
    const y = Number(p?.y);
    if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
    // 点列按存档约定落在 [0,1]²；坏档里的越界值夹回来，回放不会画到框外。
    out.push({ x: +Math.min(1, Math.max(0, x)).toFixed(3), y: +Math.min(1, Math.max(0, y)).toFixed(3) });
    if (out.length >= GALLERY_POINTS) break;
  }
  return out.length >= 2 ? out : null;
}

/**
 * 归一化一条画阁记录。点列可缺省：Round 1 之前的旧档只有 type/precision，
 * 仍然是合法条目，画阁改用标准字形显示。
 * @returns {{type:string,precision:number,at:number,points?:{x:number,y:number}[]}|null}
 */
export function sanitizeGalleryEntry(entry) {
  const type = entry?.type;
  if (typeof type !== "string" || !type) return null;
  const precision = Number(entry.precision);
  const at = Number(entry.at);
  const out = {
    type,
    precision: Number.isFinite(precision) ? Math.min(1, Math.max(0, precision)) : 0,
    at: Number.isFinite(at) ? at : Date.now(),
  };
  const points = galleryPoints(entry.points);
  if (points) out.points = points;
  return out;
}

export function sanitizeGallery(list) {
  if (!Array.isArray(list)) return [];
  const out = [];
  for (const raw of list) {
    const entry = sanitizeGalleryEntry(raw);
    if (entry) out.push(entry);
  }
  return out.slice(-GALLERY_LIMIT);
}

/** 追加一笔并裁到上限；不改入参，供 store.set 的函数式 patch 直接返回。 */
export function pushGallery(list, entry, limit = GALLERY_LIMIT) {
  const clean = sanitizeGalleryEntry(entry);
  const base = Array.isArray(list) ? list : [];
  if (!clean) return base.slice(-limit);
  return [...base, clean].slice(-limit);
}

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
          gallery: sanitizeGallery(parsed.gallery),
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
