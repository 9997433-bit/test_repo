/**
 * 会话之外的小设置：不属于花园进度，因此独立于存档另存一格，
 * 「重整山河」清空进度也不会把玩家的静音选择一并抹掉。
 */
const KEY = "my-garden-world:prefs:v1";

export interface Prefs {
  muted: boolean;
}

const DEFAULTS: Prefs = { muted: false };

export function loadPrefs(): Prefs {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULTS };
    const parsed = JSON.parse(raw) as Partial<Prefs> | null;
    if (!parsed || typeof parsed !== "object") return { ...DEFAULTS };
    return { muted: parsed.muted === true };
  } catch {
    return { ...DEFAULTS };
  }
}

export function savePrefs(prefs: Prefs): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify({ muted: prefs.muted === true }));
    return true;
  } catch {
    return false; // quota / 隐私模式：静音只在本次会话生效
  }
}

export function setMutedPref(muted: boolean): boolean {
  return savePrefs({ ...loadPrefs(), muted });
}
