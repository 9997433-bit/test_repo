import { onGameEvent } from "../engine/events";
import { chime } from "../audio/soundscape";

const DEDUPE_MS = 1500;
const MAX_VISIBLE = 4;

export function mountToasts(host: HTMLElement): void {
  const wrap = document.createElement("div");
  wrap.className = "toast-wrap";
  wrap.setAttribute("role", "status");
  wrap.setAttribute("aria-live", "polite");
  host.append(wrap);
  let lastText = "";
  let lastAt = 0;
  onGameEvent((e) => {
    if (e.type !== "toast") return;
    const now = Date.now();
    if (e.text === lastText && now - lastAt < DEDUPE_MS) return;
    lastText = e.text;
    lastAt = now;
    while (wrap.children.length >= MAX_VISIBLE) wrap.firstElementChild?.remove();
    const n = document.createElement("div");
    n.className = `toast ${e.tone ?? "ok"}`;
    n.textContent = e.text;
    wrap.append(n);
    chime(e.tone ?? "ok");
    setTimeout(() => n.remove(), 2600);
  });
}
