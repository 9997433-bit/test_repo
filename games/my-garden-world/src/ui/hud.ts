import type { GameState } from "../engine/state";
import { WATER_CAP, xpToLevel } from "../engine/state";
import { clockLabel, isNight, seasonLabel } from "../engine/time";
import { audioStatusLabel } from "../audio/soundscape";

const STYLE_ID = "mgw-hud-style";

const CSS = `
.hud.mgw-hud {
  display: grid;
  grid-template-columns: 1fr auto;
  grid-template-areas: "brand clock" "pills pills" "level level";
  gap: 4px 10px;
  align-items: center;
  padding: max(8px, env(safe-area-inset-top)) max(12px, env(safe-area-inset-right)) 8px max(12px, env(safe-area-inset-left));
}
.mgw-hud .brand { grid-area: brand; font-size: clamp(20px, 5.6vw, 28px); line-height: 1.15; }
.mgw-hud .mgw-clock {
  grid-area: clock;
  display: inline-flex; align-items: baseline; gap: 4px;
  font-variant-numeric: tabular-nums;
  font-size: clamp(13px, 3.6vw, 15px);
  color: var(--ink);
}
.mgw-hud .mgw-season { font-family: var(--font-display); font-size: 1.15em; }
.mgw-hud .mgw-phase { font-size: 0.85em; color: var(--ink-soft); }
.mgw-hud .mgw-pills {
  grid-area: pills;
  display: flex; flex-wrap: nowrap; gap: 6px;
  overflow-x: auto; overscroll-behavior-x: contain;
  scrollbar-width: none; -webkit-overflow-scrolling: touch;
  padding-bottom: 2px;
}
.mgw-hud .mgw-pills::-webkit-scrollbar { display: none; }
.mgw-hud .mgw-pill {
  flex: 0 0 auto;
  display: inline-flex; align-items: center; gap: 5px;
  min-height: 28px;
  padding: 3px 11px;
  font-size: clamp(13px, 3.4vw, 15px);
  background: color-mix(in srgb, var(--paper) 94%, transparent);
  border-color: color-mix(in srgb, var(--gold) 70%, var(--ink) 12%);
  color: var(--ink);
}
.mgw-hud .mgw-k { font-size: 0.82em; color: var(--ink-soft); letter-spacing: 0.04em; }
.mgw-hud .mgw-v { font-weight: 700; font-variant-numeric: tabular-nums; letter-spacing: 0.01em; }
.mgw-hud .mgw-pill.is-low { border-color: var(--vermilion); }
.mgw-hud .mgw-pill.is-low .mgw-v { color: var(--vermilion); }
.mgw-hud .mgw-pill.is-off .mgw-v { color: var(--ink-soft); }
.mgw-hud .mgw-lv {
  grid-area: level;
  display: flex; align-items: center; gap: 8px;
  font-size: clamp(12px, 3.2vw, 13px);
  color: var(--ink);
}
.mgw-hud .mgw-lv-tag { font-family: var(--font-display); font-size: 1.15em; white-space: nowrap; }
.mgw-hud .mgw-lv-bar {
  flex: 1 1 auto; height: 7px; min-width: 60px;
  border-radius: 999px; overflow: hidden;
  background: color-mix(in srgb, var(--ink) 24%, transparent);
  box-shadow: inset 0 1px 2px var(--shadow);
}
.mgw-hud .mgw-lv-bar > i {
  display: block; height: 100%;
  background: linear-gradient(90deg, var(--jade-soft), var(--gold));
  transition: width 0.3s ease;
}
.mgw-hud .mgw-lv-num { font-variant-numeric: tabular-nums; color: var(--ink-soft); white-space: nowrap; }
.mgw-hud .is-bump { animation: mgw-bump 0.42s ease; }
@keyframes mgw-bump {
  40% { transform: translateY(-2px) scale(1.14); }
  100% { transform: none; }
}
@media (max-width: 420px) {
  .hud.mgw-hud { gap: 3px 8px; padding-top: max(6px, env(safe-area-inset-top)); }
  .mgw-hud .brand { letter-spacing: 0.04em; }
}
@media (prefers-reduced-motion: reduce) {
  .mgw-hud .is-bump { animation: none; }
}
`;

interface PillView {
  el: HTMLElement;
  value: HTMLElement;
}

interface HudView {
  season: HTMLElement;
  time: HTMLElement;
  phase: HTMLElement;
  pills: Record<string, PillView>;
  lvTag: HTMLElement;
  lvFill: HTMLElement;
  lvNum: HTMLElement;
}

const views = new WeakMap<HTMLElement, HudView>();

function injectStyle(): void {
  if (typeof document === "undefined" || document.getElementById(STYLE_ID)) return;
  const tag = document.createElement("style");
  tag.id = STYLE_ID;
  tag.textContent = CSS;
  document.head?.append(tag);
}

function setText(el: HTMLElement, text: string, bump = false): void {
  if (el.textContent === text) return;
  const had = el.textContent !== "";
  el.textContent = text;
  if (bump && had) {
    el.classList.remove("is-bump");
    el.classList.add("is-bump");
  }
}

function makePill(key: string, label: string): PillView {
  const el = document.createElement("span");
  el.className = "pill mgw-pill";
  el.dataset.pill = key;
  el.setAttribute("role", "listitem");
  const k = document.createElement("span");
  k.className = "mgw-k";
  k.textContent = label;
  const value = document.createElement("b");
  value.className = "mgw-v";
  value.addEventListener("animationend", () => value.classList.remove("is-bump"));
  el.append(k, value);
  return { el, value };
}

function build(el: HTMLElement): HudView {
  const brand = document.createElement("div");
  brand.className = "brand";
  brand.textContent = "我的花园世界";

  const clock = document.createElement("div");
  clock.className = "mgw-clock";
  const season = document.createElement("span");
  season.className = "mgw-season";
  const time = document.createElement("b");
  time.className = "mgw-time";
  const phase = document.createElement("span");
  phase.className = "mgw-phase";
  clock.append(season, time, phase);

  const pillWrap = document.createElement("div");
  pillWrap.className = "pills mgw-pills";
  pillWrap.setAttribute("role", "list");
  const pills: Record<string, PillView> = {
    coins: makePill("coins", "金"),
    water: makePill("water", "水"),
    reputation: makePill("reputation", "口碑"),
    fragments: makePill("fragments", "碎片"),
    audio: makePill("audio", "声"),
  };
  for (const p of Object.values(pills)) pillWrap.append(p.el);

  const lv = document.createElement("div");
  lv.className = "mgw-lv";
  const lvTag = document.createElement("span");
  lvTag.className = "mgw-lv-tag";
  const lvBar = document.createElement("span");
  lvBar.className = "mgw-lv-bar";
  const lvFill = document.createElement("i");
  lvBar.append(lvFill);
  const lvNum = document.createElement("span");
  lvNum.className = "mgw-lv-num";
  lv.append(lvTag, lvBar, lvNum);

  el.replaceChildren(brand, clock, pillWrap, lv);
  return { season, time, phase, pills, lvTag, lvFill, lvNum };
}

export function renderHud(el: HTMLElement, state: GameState): void {
  injectStyle();
  el.classList.add("mgw-hud");
  let view = views.get(el);
  if (!view || !el.contains(view.lvFill)) {
    view = build(el);
    views.set(el, view);
  }

  const night = isNight(state);
  setText(view.season, seasonLabel(state.season));
  setText(view.time, clockLabel(state.dayMinute));
  setText(view.phase, night ? "夜" : "昼");

  const need = xpToLevel(state.level);
  const pct = Math.max(0, Math.min(100, Math.round((state.exp / need) * 100)));

  setText(view.pills.coins!.value, String(state.coins), true);
  view.pills.coins!.el.setAttribute("aria-label", `金币 ${state.coins}`);

  setText(view.pills.water!.value, `${state.water}/${WATER_CAP}`, true);
  view.pills.water!.el.classList.toggle("is-low", state.water <= 3);
  view.pills.water!.el.setAttribute("aria-label", `清水 ${state.water} / ${WATER_CAP}`);

  setText(view.pills.reputation!.value, String(state.reputation), true);
  view.pills.reputation!.el.classList.toggle("is-low", state.reputation < 50);
  view.pills.reputation!.el.setAttribute("aria-label", `口碑 ${state.reputation}`);

  setText(view.pills.fragments!.value, String(state.fragments), true);
  view.pills.fragments!.el.setAttribute("aria-label", `装饰碎片 ${state.fragments}`);

  const sound = audioStatusLabel();
  setText(view.pills.audio!.value, sound);
  view.pills.audio!.el.classList.toggle("is-off", sound !== "有声");
  view.pills.audio!.el.setAttribute("aria-label", `声音 ${sound}`);

  setText(view.lvTag, `${state.level} 阶`, true);
  view.lvFill.style.width = `${pct}%`;
  setText(view.lvNum, `${state.exp}/${need} 阅历`);
}
