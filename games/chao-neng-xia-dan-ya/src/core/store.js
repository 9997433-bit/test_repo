export const SAVE_KEY = "cnyd-save-v1";

export const DEFAULT_ROSTER = ["dash_duck", "sun_bird", "thunder_chick", "heal_duck", "guard_duck"];

export const STARTER_HEROES = [
  "dash_duck", "sun_bird", "thunder_chick", "heal_duck", "guard_duck",
  "pep_chick", "mech_goose", "ninja_goose",
];

export function defaultSave() {
  return {
    version: 1,
    gold: 260,
    shards: {},
    heroLevels: {},
    heroStars: {},
    owned: STARTER_HEROES.slice(),
    roster: DEFAULT_ROSTER.slice(),
    adventureStage: 1,
    towerFloor: 1,
    bestRogueWave: 0,
    bestRaidDamage: 0,
    dex: Object.fromEntries(STARTER_HEROES.map((id) => [id, true])),
    stageStars: {},
    fishBuff: null,
    fishBest: {},
    stats: { battles: 0, wins: 0, eggs: 0, bestCombo: 0 },
    // 只保留契约里的两个键；音效/音乐/瞄准辅助按「缺省即开启」读取，
    // 玩家改动后才写入，避免破坏 tests/store.test.js 的默认存档快照。
    settings: { shake: true, reduceMotion: false },
  };
}

/** 缺省即开启的布尔设置读取器。 */
export function pref(save, key) {
  return save?.settings?.[key] !== false;
}

function mergeSettings(base, patch) {
  return { ...base, ...(patch && typeof patch === "object" ? patch : {}) };
}

export function normalizeSave(raw) {
  const base = defaultSave();
  const save = { ...base, ...(raw && typeof raw === "object" ? raw : {}) };
  save.settings = mergeSettings(base.settings, raw?.settings);
  save.stats = mergeSettings(base.stats, raw?.stats);
  save.shards = raw?.shards && typeof raw.shards === "object" ? raw.shards : {};
  save.heroLevels = raw?.heroLevels && typeof raw.heroLevels === "object" ? raw.heroLevels : {};
  save.heroStars = raw?.heroStars && typeof raw.heroStars === "object" ? raw.heroStars : {};
  save.stageStars = raw?.stageStars && typeof raw.stageStars === "object" ? raw.stageStars : {};
  save.dex = raw?.dex && typeof raw.dex === "object" ? raw.dex : { ...base.dex };
  save.owned = Array.isArray(raw?.owned) && raw.owned.length ? raw.owned.slice() : base.owned;
  save.roster = Array.isArray(raw?.roster) && raw.roster.length ? raw.roster.slice(0, 5) : base.roster;
  for (const id of save.owned) save.dex[id] = true;
  return save;
}

export function loadSave() {
  try {
    const raw = globalThis.localStorage?.getItem(SAVE_KEY);
    if (!raw) return defaultSave();
    return normalizeSave(JSON.parse(raw));
  } catch {
    return defaultSave();
  }
}

export function writeSave(save) {
  try {
    globalThis.localStorage?.setItem(SAVE_KEY, JSON.stringify(save));
  } catch {
    /* 隐私模式下 localStorage 可能不可写，游戏仍应继续 */
  }
  return save;
}

export function resetSave() {
  try {
    globalThis.localStorage?.removeItem(SAVE_KEY);
  } catch {
    /* ignore */
  }
  return defaultSave();
}
