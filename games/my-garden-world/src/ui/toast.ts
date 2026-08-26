import { onGameEvent } from "../engine/events";
import { chime, mountSoundscape } from "../audio/soundscape";
import { spiritForToast, spiritPortrait } from "../systems/spirits";

const DEDUPE_MS = 1500;
const MAX_VISIBLE = 4;

export function mountToasts(host: HTMLElement): void {
  const wrap = document.createElement("div");
  wrap.className = "toast-wrap";
  wrap.setAttribute("role", "status");
  wrap.setAttribute("aria-live", "polite");
  host.append(wrap);
  // 底噪跟着根节点上的季节 / 昼夜 / 花灵属性走，挂一次即可
  mountSoundscape(host);
  let lastText = "";
  let lastAt = 0;
  onGameEvent((e) => {
    if (e.type !== "toast") return;
    const now = Date.now();
    if (e.text === lastText && now - lastAt < DEDUPE_MS) return;
    lastText = e.text;
    lastAt = now;
    while (wrap.children.length >= MAX_VISIBLE) wrap.firstElementChild?.remove();
    const spirit = spiritForToast(e.text);
    const n = document.createElement("div");
    n.className = `toast ${e.tone ?? "ok"}${spirit ? " spirit" : ""}`;
    if (spirit) {
      // 花灵开口时带上形象，一眼认得出是谁在说话
      n.style.display = "flex";
      n.style.alignItems = "center";
      n.style.gap = "6px";
      const mark = document.createElement("span");
      mark.setAttribute("aria-hidden", "true");
      mark.style.flex = "0 0 auto";
      mark.innerHTML = spiritPortrait(spirit.id, { size: 26 });
      const txt = document.createElement("span");
      txt.textContent = e.text;
      n.append(mark, txt);
    } else {
      n.textContent = e.text;
    }
    wrap.append(n);
    chime(spirit ? "spirit" : (e.tone ?? "ok"));
    setTimeout(() => n.remove(), 2600);
  });
}
