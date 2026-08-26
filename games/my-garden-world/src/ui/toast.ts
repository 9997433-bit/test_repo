import { onGameEvent } from "../engine/events";
import { chime } from "../audio/soundscape";

const STYLE_ID = "mgw-toast-style";
const LIFE_MS = 2600;
const MERGE_MS = 1200;
const MAX_VISIBLE = 4;

const CSS = `
.toast-wrap.mgw-toasts {
  top: calc(env(safe-area-inset-top) + 96px);
  width: min(92vw, 420px);
  justify-items: center;
}
.mgw-toasts .toast {
  pointer-events: auto;
  display: inline-flex; align-items: center; gap: 6px;
  max-width: 100%;
  padding: 7px 14px;
  font-size: clamp(13px, 3.4vw, 15px);
  line-height: 1.4;
  text-align: center;
  word-break: break-word;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.28);
  opacity: 0.97;
  transition: opacity 0.22s ease, transform 0.22s ease;
  animation: mgw-toast-in 0.22s ease;
  cursor: pointer;
}
.mgw-toasts .toast.is-out { opacity: 0; transform: translateY(-8px); }
.mgw-toasts .toast .mgw-toast-n {
  font-size: 11.5px; font-variant-numeric: tabular-nums;
  padding: 0 6px; border-radius: 999px;
  background: rgba(255, 255, 255, 0.22);
}
@keyframes mgw-toast-in {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 0.97; transform: none; }
}
@media (max-width: 420px) {
  .toast-wrap.mgw-toasts { top: calc(env(safe-area-inset-top) + 88px); }
}
@media (prefers-reduced-motion: reduce) {
  .mgw-toasts .toast { animation: none; transition: none; }
}
`;

interface Live {
  el: HTMLElement;
  badge: HTMLElement;
  text: string;
  count: number;
  born: number;
  timer: ReturnType<typeof setTimeout>;
}

const mounted = new WeakMap<HTMLElement, () => void>();

function injectStyle(): void {
  if (typeof document === "undefined" || document.getElementById(STYLE_ID)) return;
  const tag = document.createElement("style");
  tag.id = STYLE_ID;
  tag.textContent = CSS;
  document.head?.append(tag);
}

export function mountToasts(host: HTMLElement): void {
  injectStyle();
  mounted.get(host)?.();

  const wrap = document.createElement("div");
  wrap.className = "toast-wrap mgw-toasts";
  wrap.setAttribute("role", "status");
  wrap.setAttribute("aria-live", "polite");
  host.append(wrap);

  const live: Live[] = [];

  const drop = (item: Live): void => {
    const i = live.indexOf(item);
    if (i >= 0) live.splice(i, 1);
    clearTimeout(item.timer);
    item.el.classList.add("is-out");
    setTimeout(() => item.el.remove(), 240);
  };

  const arm = (item: Live): void => {
    clearTimeout(item.timer);
    item.timer = setTimeout(() => drop(item), LIFE_MS);
  };

  const off = onGameEvent((e) => {
    if (e.type !== "toast") return;
    const tone = e.tone ?? "ok";
    const now = Date.now();
    const last = live[live.length - 1];

    // A burst of identical messages (wilting plots, theme packs) collapses into one row.
    if (last && last.text === e.text && now - last.born < MERGE_MS) {
      last.count += 1;
      last.badge.textContent = `×${last.count}`;
      last.badge.hidden = false;
      last.born = now;
      arm(last);
      return;
    }

    const el = document.createElement("div");
    el.className = `toast ${tone}`;
    const label = document.createElement("span");
    label.textContent = e.text;
    const badge = document.createElement("span");
    badge.className = "mgw-toast-n";
    badge.hidden = true;
    el.append(label, badge);
    wrap.append(el);

    const item: Live = { el, badge, text: e.text, count: 1, born: now, timer: setTimeout(() => undefined, 0) };
    el.addEventListener("click", () => drop(item));
    live.push(item);
    arm(item);
    while (live.length > MAX_VISIBLE) {
      const oldest = live[0];
      if (!oldest) break;
      drop(oldest);
    }
    chime(tone);
  });

  mounted.set(host, () => {
    off();
    for (const item of live) clearTimeout(item.timer);
    live.length = 0;
    wrap.remove();
  });
}
