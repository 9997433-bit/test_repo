import { onGameEvent } from "../engine/events";
import { chime } from "../audio/soundscape";

export function mountToasts(host: HTMLElement): void {
  const wrap = document.createElement("div");
  wrap.className = "toast-wrap";
  host.append(wrap);
  onGameEvent((e) => {
    if (e.type !== "toast") return;
    const n = document.createElement("div");
    n.className = `toast ${e.tone ?? "ok"}`;
    n.textContent = e.text;
    wrap.append(n);
    chime(e.tone ?? "ok");
    setTimeout(() => n.remove(), 2600);
  });
}
