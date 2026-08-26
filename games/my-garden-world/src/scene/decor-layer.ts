import type { PlacedDecor } from "../systems/decorate";
import { decorArt, decorSlot } from "./decor-art";

/**
 * 庭院陈设层：把 `placedDecor` 真正画进花园场景，并把陈列牌做成「点按聚焦」的索引。
 * 场景层 `pointer-events: none`，落在花圃上的点击/拖浇一律不受影响。
 */
export interface DecorLayer {
  /** 花圃上方的陈列牌一行 */
  row: HTMLElement;
  /** 铺满舞台、位于花圃之下的景物层 */
  scene: HTMLElement;
  update(items: PlacedDecor[]): void;
  focus(id: string | null): void;
  focused(): string | null;
}

interface Entry {
  chip: HTMLButtonElement;
  item: HTMLElement;
  label: string;
}

const STYLE_ID = "decor-scene-style";

const CSS = `
.decor-row { position: relative; z-index: 1; }
.decor-chip { cursor: pointer; color: inherit; line-height: 1.25; white-space: nowrap;
  transition: transform .16s ease, background .2s ease, color .2s ease, box-shadow .2s ease; }
.decor-chip:hover { transform: translateY(-1px); }
.decor-chip.is-focus { background: var(--vermilion, #b8442f); color: #fff8e8;
  border-style: solid; box-shadow: 0 0 0 2px rgba(244, 211, 94, .45); }
.decor-empty { align-self: center; font-size: 12px; opacity: .6; }

.decor-scene { position: absolute; inset: 0; z-index: 0; overflow: hidden; pointer-events: none; }
.decor-item {
  position: absolute;
  width: var(--dw, 10%);
  transform: translate(-50%, -50%) scale(var(--ds, 1));
  transition: opacity .35s ease, transform .35s cubic-bezier(.34, 1.4, .64, 1);
  animation: decor-settle .5s cubic-bezier(.34, 1.4, .64, 1);
}
@keyframes decor-settle {
  from { opacity: 0; transform: translate(-50%, -30%) scale(.7); }
}
.decor-item > svg { display: block; width: 100%; height: auto; overflow: visible;
  filter: drop-shadow(0 6px 7px rgba(28, 18, 10, .22)); transition: filter .3s ease; }
.decor-item[data-depth="far"] { opacity: .84; --ds: .96; }
.decor-scene.has-focus .decor-item { opacity: .28; }
.decor-scene.has-focus .decor-item.is-focus { opacity: 1; }
.decor-item.is-focus { --ds: 1.14; z-index: 2; }
.decor-item.is-focus > svg {
  filter: drop-shadow(0 0 12px rgba(244, 211, 94, .9)) drop-shadow(0 6px 7px rgba(28, 18, 10, .25));
}
.decor-tag {
  position: absolute; left: 50%; bottom: -20px;
  transform: translate(-50%, 4px); opacity: 0;
  font-family: var(--font-display, serif); font-size: 12px; white-space: nowrap;
  color: #fff8e8; background: rgba(43, 33, 24, .86);
  border: 1px solid rgba(244, 211, 94, .6); border-radius: 999px; padding: 2px 9px;
  transition: opacity .25s ease, transform .25s ease;
}
.decor-item.is-focus .decor-tag { opacity: 1; transform: translate(-50%, 0); }

.decor-item .d-sway, .decor-item .d-swing { transform-box: view-box; }
.decor-item .d-sway { animation: decor-sway 4.4s ease-in-out infinite alternate; }
.decor-item[data-decor="lantern"] .d-sway { transform-origin: 66.7% 22%; }
.decor-item[data-decor="chimes"] .d-sway { transform-origin: 56.7% 19%; animation-duration: 3.2s; }
@keyframes decor-sway { from { transform: rotate(-3.4deg); } to { transform: rotate(3.4deg); } }
.decor-item .d-swing { transform-origin: 50% 32%; animation: decor-swing 3.6s ease-in-out infinite alternate; }
@keyframes decor-swing { from { transform: rotate(-6deg); } to { transform: rotate(6deg); } }
.decor-item .d-flicker { transform-box: fill-box; transform-origin: 50% 100%;
  animation: decor-flicker 1.1s ease-in-out infinite alternate; }
@keyframes decor-flicker {
  from { transform: scale(1.06, .86); opacity: .85; }
  to { transform: scale(.96, 1.08); opacity: 1; }
}
.decor-item .d-ripple { transform-box: fill-box; transform-origin: 50% 50%;
  animation: decor-ripple 3.4s ease-out infinite; }
.decor-item .d-ripple-b { animation-delay: 1.6s; }
@keyframes decor-ripple {
  from { transform: scale(.3); opacity: .9; }
  to { transform: scale(1.6); opacity: 0; }
}
.decor-item .d-koi { animation: decor-koi 8s ease-in-out infinite alternate; }
.decor-item .d-koi-b { animation-duration: 11s; animation-delay: -4s; }
@keyframes decor-koi {
  from { transform: translate(-8px, 3px); }
  to { transform: translate(9px, -4px); }
}
.decor-item .d-glow { opacity: 0; transition: opacity 1.4s ease; }
.decor-item[data-decor="brazier"] .d-glow { opacity: .2; }
.is-night .decor-item .d-glow { animation: decor-breath 3.2s ease-in-out infinite alternate; opacity: .55; }
@keyframes decor-breath { from { opacity: .32; } to { opacity: .66; } }
.is-night .decor-item > svg { filter: drop-shadow(0 6px 7px rgba(0, 0, 0, .3)) brightness(.84) saturate(.9); }
.is-night .decor-item.is-focus > svg {
  filter: drop-shadow(0 0 12px rgba(244, 211, 94, .85)) brightness(.95);
}

@media (max-width: 640px) {
  .decor-item { --ds: .82; }
  .decor-item[data-depth="far"] { --ds: .74; opacity: .7; }
  .decor-item.is-focus { --ds: 1; }
  .decor-tag { bottom: -16px; font-size: 11px; }
}
`;

function ensureStyles(): void {
  if (typeof document === "undefined" || document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = CSS;
  document.head.append(style);
}

export function createDecorLayer(): DecorLayer {
  ensureStyles();

  const row = document.createElement("div");
  row.className = "decor-row";
  row.setAttribute("role", "group");
  row.setAttribute("aria-label", "庭院陈设，点按可在园中聚焦");

  const scene = document.createElement("div");
  scene.className = "decor-scene";
  scene.setAttribute("aria-hidden", "true");

  const hint = document.createElement("span");
  hint.className = "decor-empty";
  hint.textContent = "庭中尚空，去「装扮」置一件景物";

  const entries = new Map<string, Entry>();
  let focusId: string | null = null;
  let key = "";
  let autoTimer: ReturnType<typeof setTimeout> | null = null;

  const clearAuto = (): void => {
    if (autoTimer === null) return;
    clearTimeout(autoTimer);
    autoTimer = null;
  };

  const paint = (): void => {
    scene.classList.toggle("has-focus", focusId !== null);
    for (const [id, entry] of entries) {
      const on = id === focusId;
      entry.chip.classList.toggle("is-focus", on);
      entry.chip.setAttribute("aria-pressed", String(on));
      entry.item.classList.toggle("is-focus", on);
    }
  };

  const focus = (id: string | null): void => {
    clearAuto();
    const next = id !== null && entries.has(id) ? id : null;
    if (next === focusId) return;
    focusId = next;
    paint();
  };

  /** 刚安置的景物先亮一下再归于平常，让玩家看清它落在园中何处。 */
  const flash = (id: string): void => {
    focus(id);
    if (focusId !== id) return;
    autoTimer = setTimeout(() => {
      autoTimer = null;
      if (focusId !== id) return;
      focusId = null;
      paint();
    }, 2600);
  };

  const create = (decor: PlacedDecor): Entry => {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "decor-chip";
    chip.dataset.decor = decor.id;
    chip.textContent = decor.label;
    chip.setAttribute("aria-pressed", "false");
    chip.setAttribute("aria-label", `在园中聚焦${decor.name}`);
    chip.addEventListener("click", () => focus(focusId === decor.id ? null : decor.id));

    const slot = decorSlot(decor.id);
    const item = document.createElement("div");
    item.className = "decor-item";
    item.dataset.decor = decor.id;
    item.dataset.depth = slot.depth;
    item.style.left = `${slot.x}%`;
    item.style.top = `${slot.y}%`;
    item.style.setProperty("--dw", `${slot.w}%`);
    item.innerHTML = decorArt(decor.id, decor.glyph);
    const tag = document.createElement("span");
    tag.className = "decor-tag";
    tag.textContent = decor.name;
    item.append(tag);

    return { chip, item, label: decor.label };
  };

  /** 只在陈设集合变化时重排：既有节点原样留用，聚焦态随之保留。 */
  const update = (items: PlacedDecor[]): void => {
    const next = items.map((d) => `${d.id}:${d.label}`).join(",");
    if (next === key) return;
    const first = key === "" && entries.size === 0;
    key = next;

    const added: string[] = [];
    const alive = new Set(items.map((d) => d.id));
    for (const [id, entry] of entries) {
      if (alive.has(id)) continue;
      entry.chip.remove();
      entry.item.remove();
      entries.delete(id);
      if (focusId === id) focusId = null;
    }

    items.forEach((decor, index) => {
      let entry = entries.get(decor.id);
      if (!entry) {
        entry = create(decor);
        entries.set(decor.id, entry);
        scene.append(entry.item);
        added.push(decor.id);
      } else if (entry.label !== decor.label) {
        entry.label = decor.label;
        entry.chip.textContent = decor.label;
      }
      if (row.children[index] !== entry.chip) row.insertBefore(entry.chip, row.children[index] ?? null);
    });

    if (items.length && hint.isConnected) hint.remove();
    if (!items.length && !hint.isConnected) row.append(hint);
    paint();
    const fresh = added[0];
    if (!first && added.length === 1 && fresh !== undefined) flash(fresh);
  };

  row.append(hint);

  return { row, scene, update, focus, focused: () => focusId };
}
