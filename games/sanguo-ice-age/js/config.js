/** Shared tunables. Systems must import from here instead of magic numbers. */
export const TICK_MS = 250;
export const TICKS_PER_DAY = 16;
export const SAVE_KEY = "sanguo-ice-age-save-v1";
export const SAVE_VERSION = 1;

export const RESOURCES = ["food", "wood", "coal", "iron"];

export const FACTIONS = ["wei", "shu", "wu", "qun"];
export const FACTION_BEATS = { wu: "shu", shu: "wei", wei: "wu" };

export const TROOP_BEATS = { infantry: "cavalry", cavalry: "archer", archer: "infantry" };

export const QUALITY_RANK = { blue: 1, purple: 2, orange: 3, red: 4 };

export const DEFAULT_LORD = {
  name: "流民县令",
  title: "汉末县令",
};

export const CLIMATE = {
  baseTemp: 4,
  furnaceHeatPerLevel: 3.2,
  fuelWoodPerTick: 0.08,
  fuelCoalPerTick: 0.035,
  blizzardEveryDays: 7,
  blizzardDurationDays: 2,
  blizzardTempDelta: -14,
  freezeThreshold: -6,
  coldThreshold: 0,
  comfortThreshold: 8,
};

export const MORALE = {
  base: 70,
  freezeDrain: 2.4,
  coldDrain: 0.8,
  comfortGain: 0.35,
  kitchenBonus: 0.25,
  clinicBonus: 0.15,
  starveDrain: 3.5,
  collapseAt: 15,
};

export function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}
