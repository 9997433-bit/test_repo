import type { Season } from "../data/flowers";
import type { GameState } from "./state";

const SEASONS: Season[] = ["spring", "summer", "autumn", "winter"];
const DAY_MS = 90_000;
const MINUTES_PER_DAY = 24 * 60;

export function advanceClock(state: GameState, dtMs: number): void {
  const dayProgress = (state.now % DAY_MS) / DAY_MS;
  state.dayMinute = Math.floor(dayProgress * MINUTES_PER_DAY);
  const seasonIdx = Math.floor((state.now / (DAY_MS * 4)) % 4);
  state.season = SEASONS[seasonIdx] ?? "spring";
  void dtMs;
}

export function isNight(state: GameState): boolean {
  return state.dayMinute < 5 * 60 || state.dayMinute >= 19 * 60;
}

export function seasonLabel(season: Season): string {
  return { spring: "春", summer: "夏", autumn: "秋", winter: "冬" }[season];
}

export function clockLabel(minute: number): string {
  const h = Math.floor(minute / 60) % 24;
  const m = minute % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}
