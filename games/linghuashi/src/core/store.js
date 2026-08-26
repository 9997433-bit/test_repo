const SAVE_KEY = "linghuashi.save.v1";
/** 备份键：升级旧档或读不懂旧档时，先把盘上的原始串抄到这里，再让新档覆盖主键。 */
const SAVE_BACKUP_KEY = "linghuashi.save.bak";

/**
 * 当前存档版本。`SAVE_KEY` 里的 "v1" 是历史键名，已冻结——版本只认 JSON 里的 `version`。
 *
 * 改存档字段的唯一姿势：`SAVE_VERSION` +1 → 在 `MIGRATIONS` 里补一步「旧版 → 新版」→
 * 补一条往返单测。迁移步只写「这一版改了什么」，补默认与夹值这类通用清洗留给 `normalizeSave`。
 *
 * v2：灵兽 uid 升为硬不变量（放生/合成按 uid 定位，v1 期收的兽可能没有）；
 *     `strokeStats`/`battleSeq` 登记为正式字段；会话字段不再从盘上带回内存。
 */
export const SAVE_VERSION = 2;

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
    version: SAVE_VERSION,
    playerName: "无名画徒",
    classId: null,
    realmId: "qi_refining",
    xp: 0,
    qiPills: 0,
    buns: 0,
    talents: {},
    strokeStats: {},
    beasts: [],
    gallery: [],
    clearedStages: [],
    battleSeq: 0,
    lastSeenAt: Date.now(),
    idleUntil: Date.now(),
    settings: { mute: false, reducedMotion: false },
    tutorialDone: false,
    inkUnlocked: false,
  };
}

/**
 * 迁移链：键 = 起始版本，逐级把旧档抬到 `SAVE_VERSION`。
 * 每一步只做该版本的一次性数据修复，不做通用清洗（那是 `normalizeSave` 的活）。
 */
const MIGRATIONS = {
  // v0：还没有 version 字段的史前档。那时画阁存的是笔法名字符串，不是条目对象，
  // 直接交给 sanitizeGallery 会被整条丢弃，六式进度跟着蒸发。
  0: (save) => ({
    ...save,
    gallery: Array.isArray(save.gallery)
      ? save.gallery.map((g) => (typeof g === "string" ? { type: g, precision: 0, at: 0 } : g))
      : save.gallery,
  }),
  // v1：补灵兽 uid。放生与合成都按 uid 定位，没有 uid 的旧兽在界面上会「点了没反应」。
  1: (save) => ({
    ...save,
    beasts: Array.isArray(save.beasts)
      ? save.beasts.map((b, i) => (isPlainObject(b) && !b.uid ? { ...b, uid: `${b.id || "beast"}-v1-${i}` } : b))
      : save.beasts,
  }),
};

/**
 * 纯函数：把任意一版旧档抬到 `SAVE_VERSION` 并清洗成合法存档。不改入参、不碰 localStorage。
 * 读不懂时返回 `null`（非对象、版本高于本端、缺迁移步），调用方据此保留内存态并留下备份。
 */
export function migrate(raw) {
  if (!isPlainObject(raw)) return null;
  const from = Number.isFinite(raw.version) ? Math.floor(raw.version) : 0;
  if (from < 0 || from > SAVE_VERSION) return null;
  let save = raw;
  for (let v = from; v < SAVE_VERSION; v += 1) {
    const step = MIGRATIONS[v];
    if (!step) return null;
    save = step(save);
  }
  return normalizeSave(save);
}

/**
 * 以 `defaultSave()` 打底补齐并夹住每个已登记字段；未登记的键原样保留，
 * 免得新版本写下的字段被旧版本读一次就抹掉。
 */
function normalizeSave(save) {
  const base = defaultSave();
  const out = {
    ...base,
    ...save,
    version: SAVE_VERSION,
    playerName: typeof save.playerName === "string" && save.playerName ? save.playerName : base.playerName,
    classId: typeof save.classId === "string" && save.classId ? save.classId : null,
    realmId: typeof save.realmId === "string" && save.realmId ? save.realmId : base.realmId,
    xp: whole(save.xp),
    qiPills: whole(save.qiPills),
    buns: whole(save.buns),
    battleSeq: whole(save.battleSeq),
    talents: levelMap(save.talents),
    strokeStats: ratioMap(save.strokeStats),
    beasts: normalizeBeasts(save.beasts),
    gallery: sanitizeGallery(save.gallery),
    clearedStages: [...new Set((Array.isArray(save.clearedStages) ? save.clearedStages : []).filter((id) => typeof id === "string" && id))],
    lastSeenAt: stamp(save.lastSeenAt, base.lastSeenAt),
    idleUntil: stamp(save.idleUntil, base.idleUntil),
    settings: {
      ...base.settings,
      ...(isPlainObject(save.settings) ? save.settings : null),
      mute: Boolean(save.settings?.mute),
      reducedMotion: Boolean(save.settings?.reducedMotion),
    },
    tutorialDone: Boolean(save.tutorialDone),
    inkUnlocked: Boolean(save.inkUnlocked),
  };
  for (const key of TRANSIENT_KEYS) delete out[key];
  return out;
}

/** 结构校验：无 id / 无 uid / uid 撞车的条目直接丢弃，星级至少 1。数值由养成层按图鉴推。 */
function normalizeBeasts(list) {
  if (!Array.isArray(list)) return [];
  const seen = new Set();
  const out = [];
  for (const b of list) {
    if (!isPlainObject(b)) continue;
    if (typeof b.id !== "string" || !b.id) continue;
    if (typeof b.uid !== "string" || !b.uid || seen.has(b.uid)) continue;
    seen.add(b.uid);
    out.push({ ...b, star: whole(b.star, 1) || 1 });
  }
  return out;
}

function levelMap(obj) {
  const out = {};
  if (!isPlainObject(obj)) return out;
  for (const [id, level] of Object.entries(obj)) {
    const lv = whole(level);
    if (lv > 0) out[id] = lv;
  }
  return out;
}

function ratioMap(obj) {
  const out = {};
  if (!isPlainObject(obj)) return out;
  for (const [key, value] of Object.entries(obj)) {
    const v = Number(value);
    if (Number.isFinite(v) && v > 0) out[key] = Math.min(1, v);
  }
  return out;
}

function isPlainObject(v) {
  return Boolean(v) && typeof v === "object" && !Array.isArray(v);
}

/** 非负整数，坏值回落到 fallback。存档里的资源与等级一律走这里。 */
function whole(n, fallback = 0) {
  const v = Math.floor(Number(n));
  return Number.isFinite(v) && v >= 0 ? v : fallback;
}

function stamp(n, fallback) {
  const v = Number(n);
  return Number.isFinite(v) && v > 0 ? v : fallback;
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
      const raw = readSaved();
      if (!raw) return state;
      let parsed = null;
      try {
        parsed = JSON.parse(raw);
      } catch {
        parsed = null;
      }
      const next = migrate(parsed);
      // 盘上不是当前版本（升级档、坏档、更高版本档）就先抄一份原始串：
      // 之后任何一次 persist 都会覆盖 SAVE_KEY，.bak 是唯一能人工救回来的东西。
      if (!next || parsed.version !== SAVE_VERSION) backupSaved(raw);
      if (!next) return state;
      state = next;
      return state;
    },
  };
}

function readSaved() {
  try {
    return localStorage.getItem(SAVE_KEY);
  } catch {
    return null;
  }
}

/** 备份是尽力而为：localStorage 被禁用或配额已满时，不该把读档一起拖垮。 */
function backupSaved(raw) {
  try {
    localStorage.setItem(SAVE_BACKUP_KEY, raw);
  } catch {
    /* ignore */
  }
}

export { SAVE_KEY, SAVE_BACKUP_KEY };
