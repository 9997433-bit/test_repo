export const SAVE_KEY = "cnyd-save-v1";

export function defaultSave() {
  return {
    version: 1,
    gold: 0,
    shards: {},
    heroLevels: {},
    heroStars: {},
    roster: ["dash_duck", "sun_bird", "thunder_chick", "heal_duck", "guard_duck"],
    adventureStage: 1,
    towerFloor: 1,
    bestRogueWave: 0,
    bestRaidDamage: 0,
    dex: {},
    settings: { shake: true, reduceMotion: false },
  };
}

export function loadSave() {
  try {
    const raw = globalThis.localStorage?.getItem(SAVE_KEY);
    if (!raw) return defaultSave();
    return { ...defaultSave(), ...JSON.parse(raw) };
  } catch {
    return defaultSave();
  }
}

export function writeSave(save) {
  globalThis.localStorage?.setItem(SAVE_KEY, JSON.stringify(save));
  return save;
}
