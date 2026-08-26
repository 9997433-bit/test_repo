import type { GameState } from "../engine/state";

export type DayPhase = "dawn" | "day" | "dusk" | "night";

const DAWN_START = 5 * 60;
const DAY_START = 7 * 60;
const DUSK_START = 17 * 60;
const NIGHT_START = 19 * 60;

export function dayPhase(minute: number): DayPhase {
  if (minute < DAWN_START || minute >= NIGHT_START) return "night";
  if (minute < DAY_START) return "dawn";
  if (minute < DUSK_START) return "day";
  return "dusk";
}

export interface SkyController {
  update(root: HTMLElement, state: GameState): void;
}

/** 舞台灯光：昼夜相位 + 日月天体 + 星空，全部 CSS 过渡，JS 只在数值变化时写样式。 */
export function mountSky(host: HTMLElement): SkyController {
  const sky = document.createElement("div");
  sky.className = "sky";
  sky.setAttribute("aria-hidden", "true");
  const stars = document.createElement("div");
  stars.className = "stars";
  for (let i = 0; i < 26; i++) {
    const s = document.createElement("i");
    s.style.left = `${Math.random() * 100}%`;
    s.style.top = `${Math.random() * 55}%`;
    s.style.animationDelay = `${Math.random() * 4}s`;
    stars.append(s);
  }
  const sun = document.createElement("div");
  sun.className = "celestial sun";
  const moon = document.createElement("div");
  moon.className = "celestial moon";
  sky.append(stars, sun, moon);
  host.prepend(sky);

  let lastPhase = "";
  let lastSunX = -1;
  let lastMoonX = -1;

  const place = (el: HTMLElement, t: number): number => {
    const x = Math.round(t * 1000) / 10;
    const y = Math.round((14 + 58 * 4 * (t - 0.5) ** 2) * 10) / 10;
    el.style.left = `${x}%`;
    el.style.top = `${y}%`;
    return x;
  };

  const update = (root: HTMLElement, state: GameState): void => {
    const phase = dayPhase(state.dayMinute);
    if (phase !== lastPhase) {
      lastPhase = phase;
      root.dataset.phase = phase;
    }
    const m = state.dayMinute;
    if (m >= DAWN_START && m < NIGHT_START) {
      const t = (m - DAWN_START) / (NIGHT_START - DAWN_START);
      if (Math.abs(t * 100 - lastSunX) > 0.4) lastSunX = place(sun, t);
    }
    const nm = m >= NIGHT_START ? m - NIGHT_START : m + (24 * 60 - NIGHT_START);
    if (m >= NIGHT_START || m < DAWN_START) {
      const t = nm / (24 * 60 - NIGHT_START + DAWN_START);
      if (Math.abs(t * 100 - lastMoonX) > 0.4) lastMoonX = place(moon, t);
    }
  };

  return { update };
}
