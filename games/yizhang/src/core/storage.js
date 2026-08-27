// 本地存档。localStorage 在隐私模式/沙箱 iframe 里会抛异常，全部包 try。
//
// 版本号不动：skinId 与 lookMode 都是**向后兼容的新增字段**，v1 老档读出来
// 照样能用，缺字段就落到默认值（skinId → 默认皮肤，lookMode → locked，见 loadSave）。

import { DEFAULT_SKIN_ID } from "./skins.js";
import { DEFAULT_LOOK_MODE, normalizeLookMode } from "./look.js";

export const SAVE_KEY = "yizhang-save-v1";

const DEFAULTS = {
  version: 1,
  unlocked: ["cotton"],
  loadout: { main: "cotton", off: "cotton" },
  skinId: DEFAULT_SKIN_ID,
  lookMode: DEFAULT_LOOK_MODE,
  quality: "auto",
  muted: false,
  lookSensitivity: 1,
  invertY: false,
  stats: { matches: 0, kills: 0, deaths: 0, wins: 0, bestKills: 0 },
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

let cache = null;

export function loadSave() {
  if (cache) return cache;
  let parsed = null;
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) parsed = JSON.parse(raw);
  } catch (err) {
    console.warn("[yizhang] 存档读取失败，使用默认值", err);
  }
  const base = clone(DEFAULTS);
  if (parsed && typeof parsed === "object") {
    Object.assign(base, parsed);
    base.loadout = { ...DEFAULTS.loadout, ...(parsed.loadout || {}) };
    base.stats = { ...DEFAULTS.stats, ...(parsed.stats || {}) };
    if (!Array.isArray(base.unlocked) || !base.unlocked.length) {
      base.unlocked = clone(DEFAULTS.unlocked);
    }
    // 老档（v1 首发）没有 skinId：不迁移、不清档，直接补默认皮肤。
    if (typeof base.skinId !== "string" || !base.skinId.trim()) {
      base.skinId = DEFAULTS.skinId;
    }
    // 视角轮新增：老档没有 lookMode（或被写坏）⇒ 落产品缺省 locked，不清档。
    base.lookMode = normalizeLookMode(base.lookMode);
  }
  if (!base.unlocked.includes("cotton")) base.unlocked.unshift("cotton");
  cache = base;
  return cache;
}

export function saveSave(next) {
  cache = next;
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(next));
    return true;
  } catch (err) {
    console.warn("[yizhang] 存档写入失败", err);
    return false;
  }
}

export function updateSave(patch) {
  const cur = loadSave();
  const next = typeof patch === "function" ? patch(cur) : { ...cur, ...patch };
  saveSave(next);
  return next;
}

export function unlockGlove(id) {
  return updateSave((cur) => {
    if (cur.unlocked.includes(id)) return cur;
    return { ...cur, unlocked: [...cur.unlocked, id] };
  });
}

export function recordMatch({ kills = 0, deaths = 0, won = false }) {
  return updateSave((cur) => ({
    ...cur,
    stats: {
      matches: cur.stats.matches + 1,
      kills: cur.stats.kills + kills,
      deaths: cur.stats.deaths + deaths,
      wins: cur.stats.wins + (won ? 1 : 0),
      bestKills: Math.max(cur.stats.bestKills, kills),
    },
  }));
}
