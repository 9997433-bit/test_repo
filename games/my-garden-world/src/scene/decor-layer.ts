import { ANCHOR_IDS, ANCHOR_NAMES, type AnchorId, type PlacedDecor } from "../systems/decorate";
import { anchorSlot, decorArt, decorSlot } from "./decor-art";

/**
 * 庭院陈设层：把 `placedDecor` 真正画进花园场景，并把陈列牌做成「点按聚焦」的索引。
 * 场景层 `pointer-events: none`，落在花圃上的点击/拖浇一律不受影响。
 *
 * 另兼摆放模式：开模式后八个锚位浮现，「点陈列牌拿起 → 点锚位安置」，
 * 占位的锚位再点一次即两件对调；只有锚位按钮吃指针事件，花圃照旧可点可拖浇。
 */
export interface DecorLayer {
  /** 花圃上方的陈列牌一行 */
  row: HTMLElement;
  /** 铺满舞台、位于花圃之下的景物层 */
  scene: HTMLElement;
  update(items: PlacedDecor[]): void;
  /** 开关摆放模式；退出时松手、清掉锚位标记 */
  setPlaceMode(on: boolean): void;
  isPlaceMode(): boolean;
  /** 当前手持的陈设 id（未持物为 null） */
  heldDecor(): string | null;
}

/** 摆放模式要落到存档上的两件事：安置到锚位、收回匣中。 */
export interface DecorLayerHandlers {
  /** 返回 true 表示状态已变，视图随即重绘 */
  onPlace(id: string, anchor: AnchorId): boolean;
  onStow(id: string): boolean;
}

interface Entry {
  chip: HTMLButtonElement;
  item: HTMLElement;
  label: string;
}

const STYLE_ID = "decor-scene-style";

const CSS = `
/* 陈列牌恒为一行横滑：花园网格的高度按单行 34px 计算，换行会把花圃挤出舞台。 */
.decor-row { position: relative; z-index: 1; flex-wrap: nowrap; justify-content: safe center;
  overflow-x: auto; overflow-y: hidden; scrollbar-width: none; scroll-snap-type: x proximity; }
.decor-row::-webkit-scrollbar { display: none; }
.decor-chip { cursor: pointer; color: inherit; line-height: 1.25; white-space: nowrap; flex: none;
  scroll-snap-align: start;
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

/* ---------- 摆放模式：八锚位 tap-tap ----------
   只有锚位按钮吃指针事件；景物层其余部分照旧透传，花圃点击与拖浇不受影响。 */
.decor-place {
  align-self: center; flex: none; cursor: pointer; white-space: nowrap;
  font-family: var(--font-display, serif); font-size: 12px; line-height: 1.25;
  padding: 4px 11px; border-radius: 999px;
  color: var(--text-soft, #4a3a2a); background: var(--surface-hi, #fbf3e2);
  border: 1px solid var(--line-strong, rgba(90, 70, 45, .5));
  transition: background .2s ease, color .2s ease, box-shadow .2s ease;
}
.decor-place:hover { box-shadow: 0 0 0 2px rgba(244, 211, 94, .45); }
.decor-place.is-on { background: var(--vermilion, #b8442f); color: #fff8e8; border-color: transparent; }
.decor-chip.is-held { background: rgba(244, 211, 94, .28); border-style: solid;
  box-shadow: 0 0 0 2px rgba(244, 211, 94, .7); }
.decor-chip[data-boxed="1"] { opacity: .62; border-style: dashed; }
.decor-status { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); }

.anchor-layer { position: absolute; inset: 0; display: none; z-index: 3; }
/* 摆放时整层浮到花圃之上：锚位标记与景物都要看得见、点得到 */
.decor-scene.is-placing { z-index: 2; }
.decor-scene.is-placing .anchor-layer { display: block; }
.decor-scene.is-placing .decor-item { opacity: .55; }
.decor-scene.is-placing .decor-item.is-held { opacity: 1; --ds: 1.1; }
.decor-anchor {
  position: absolute; transform: translate(-50%, -50%);
  width: 58px; height: 58px; border-radius: 50%;
  display: grid; place-items: center; gap: 0; padding: 0;
  pointer-events: auto; cursor: pointer;
  font-family: var(--font-display, serif); font-size: 12px; line-height: 1.1;
  color: #21402c; background: rgba(238, 250, 236, .82);
  border: 2px dashed rgba(95, 143, 87, .95);
  box-shadow: 0 2px 8px rgba(28, 18, 10, .18);
  animation: anchor-breath 2.4s ease-in-out infinite alternate;
  transition: transform .18s ease, background .2s ease, border-color .2s ease;
}
.decor-anchor:hover { transform: translate(-50%, -50%) scale(1.08); }
.decor-anchor .a-glyph { font-size: 20px; line-height: 1; }
.decor-anchor .a-name { font-size: 10px; opacity: .78; }
.decor-anchor[data-filled="1"] {
  color: #4a3216; background: rgba(255, 245, 222, .9);
  border-style: solid; border-color: rgba(201, 162, 39, .95);
  animation: none;
}
.decor-anchor.is-target { border-color: rgba(184, 68, 47, .95); box-shadow: 0 0 0 3px rgba(244, 211, 94, .5); }
.decor-anchor.is-nudge { animation: anchor-nudge .4s ease; }
@keyframes anchor-breath {
  from { box-shadow: 0 2px 8px rgba(28, 18, 10, .18); }
  to { box-shadow: 0 2px 8px rgba(28, 18, 10, .18), 0 0 0 6px rgba(95, 143, 87, .22); }
}
@keyframes anchor-nudge {
  0%, 100% { transform: translate(-50%, -50%); }
  30% { transform: translate(-58%, -50%); }
  70% { transform: translate(-42%, -50%); }
}

@media (max-width: 640px) {
  .decor-item { --ds: .82; }
  .decor-item[data-depth="far"] { --ds: .74; opacity: .7; }
  .decor-item.is-focus { --ds: 1; }
  .decor-tag { bottom: -16px; font-size: 11px; }
  .decor-anchor { width: 48px; height: 48px; }
  .decor-anchor .a-glyph { font-size: 17px; }
  .decor-anchor .a-name { font-size: 9px; }
}

@media (prefers-reduced-motion: reduce) {
  .decor-anchor { animation: none; border-color: rgba(95, 143, 87, .95); }
  .decor-anchor.is-nudge { animation: none; }
}
`;

function ensureStyles(): void {
  if (typeof document === "undefined" || document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = CSS;
  document.head.append(style);
}

export function createDecorLayer(handlers: Partial<DecorLayerHandlers> = {}): DecorLayer {
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

  // 摆放模式：入口挂在陈列牌一行末尾，锚位标记浮在景物层最上层
  const placeToggle = document.createElement("button");
  placeToggle.type = "button";
  placeToggle.className = "decor-place";
  placeToggle.setAttribute("aria-pressed", "false");
  const stowBtn = document.createElement("button");
  stowBtn.type = "button";
  stowBtn.className = "decor-place decor-stow";
  stowBtn.textContent = "回匣";
  stowBtn.hidden = true;
  stowBtn.setAttribute("aria-label", "把手持的陈设收回匣中");
  const status = document.createElement("span");
  status.className = "decor-status";
  status.setAttribute("aria-live", "polite");
  const anchorLayer = document.createElement("div");
  anchorLayer.className = "anchor-layer";
  scene.append(anchorLayer);

  const entries = new Map<string, Entry>();
  const anchors = new Map<AnchorId, HTMLButtonElement>();
  let items: PlacedDecor[] = [];
  let focusId: string | null = null;
  let placing = false;
  let held: string | null = null;
  let key = "";
  let autoTimer: ReturnType<typeof setTimeout> | null = null;

  const clearAuto = (): void => {
    if (autoTimer === null) return;
    clearTimeout(autoTimer);
    autoTimer = null;
  };

  const announce = (text: string): void => {
    status.textContent = text;
  };

  const occupantOf = (anchor: AnchorId): PlacedDecor | null =>
    items.find((d) => d.anchor === anchor) ?? null;

  const paintAnchors = (): void => {
    for (const [anchor, el] of anchors) {
      const here = occupantOf(anchor);
      const name = ANCHOR_NAMES[anchor];
      el.dataset.filled = here ? "1" : "0";
      el.classList.toggle("is-target", held !== null && here?.id !== held);
      const glyph = el.querySelector(".a-glyph");
      if (glyph) glyph.textContent = here ? here.glyph : "◌";
      el.setAttribute(
        "aria-label",
        here
          ? held === null || held === here.id
            ? `${name}：${here.name}，点按拿起`
            : `${name}：${here.name}，点按替换`
          : held === null
            ? `${name}：空位，先择一件陈设`
            : `${name}：空位，点按安置`,
      );
    }
  };

  const paint = (): void => {
    scene.classList.toggle("has-focus", focusId !== null && !placing);
    scene.classList.toggle("is-placing", placing);
    for (const [id, entry] of entries) {
      const on = id === focusId && !placing;
      entry.chip.classList.toggle("is-focus", on);
      entry.chip.setAttribute("aria-pressed", String(placing ? id === held : on));
      entry.chip.classList.toggle("is-held", placing && id === held);
      entry.item.classList.toggle("is-focus", on);
      entry.item.classList.toggle("is-held", placing && id === held);
    }
    placeToggle.hidden = entries.size === 0;
    placeToggle.textContent = placing ? "完成" : "摆放";
    placeToggle.classList.toggle("is-on", placing);
    placeToggle.setAttribute("aria-pressed", String(placing));
    placeToggle.setAttribute("aria-label", placing ? "完成摆放，收起锚位" : "进入摆放模式，挪动庭中陈设");
    // 只有「手持一件已在园中的陈设」时才谈得上回匣
    stowBtn.hidden = !placing || held === null || !items.find((d) => d.id === held)?.anchor;
    paintAnchors();
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

  /** 拿起 / 放下：摆放模式里陈列牌不再聚焦，改作「手持谁」的选择器。 */
  const hold = (id: string | null): void => {
    held = id !== null && entries.has(id) ? id : null;
    const name = held === null ? null : (items.find((d) => d.id === held)?.name ?? held);
    announce(name === null ? "已放下" : `手持${name}，点一处锚位安置`);
    paint();
  };

  const nudge = (el: HTMLElement): void => {
    el.classList.remove("is-nudge");
    void el.offsetWidth;
    el.classList.add("is-nudge");
  };

  const tapAnchor = (anchor: AnchorId): void => {
    if (!placing) return;
    const here = occupantOf(anchor);
    if (held === null) {
      if (here) hold(here.id);
      else {
        const el = anchors.get(anchor);
        if (el) nudge(el);
        announce("先在挂牌上择一件陈设，再点亮处安置");
      }
      return;
    }
    if (here?.id === held) {
      hold(null);
      return;
    }
    const moving = held;
    if (handlers.onPlace?.(moving, anchor)) {
      held = null;
      announce(`${items.find((d) => d.id === moving)?.name ?? moving}安在${ANCHOR_NAMES[anchor]}`);
    }
    paint();
  };

  const setPlaceMode = (on: boolean): void => {
    if (placing === on) return;
    placing = on;
    held = null;
    if (on) {
      clearAuto();
      focusId = null;
      announce("进入摆放模式，点挂牌拿起，点亮处安置");
    } else {
      announce("布置已保存");
    }
    paint();
  };

  placeToggle.addEventListener("click", () => setPlaceMode(!placing));
  placeToggle.hidden = true;
  // Esc 收起摆放模式：只在模式开着时响应，不与教程尾折的 Esc 抢同一时刻
  if (typeof document !== "undefined") {
    document.addEventListener("keydown", (e) => {
      if (!placing || e.key !== "Escape") return;
      setPlaceMode(false);
    });
  }
  stowBtn.addEventListener("click", () => {
    const target = held;
    if (target !== null && handlers.onStow?.(target)) {
      held = null;
      announce(`${items.find((d) => d.id === target)?.name ?? target}收回匣中`);
    }
    paint();
  });

  for (const anchor of ANCHOR_IDS) {
    const slot = anchorSlot(anchor);
    const el = document.createElement("button");
    el.type = "button";
    el.className = "decor-anchor";
    el.dataset.anchor = anchor;
    el.dataset.filled = "0";
    el.style.left = `${slot.x}%`;
    el.style.top = `${slot.y}%`;
    el.innerHTML = `<span class="a-glyph" aria-hidden="true">◌</span><span class="a-name" aria-hidden="true">${ANCHOR_NAMES[anchor]}</span>`;
    el.addEventListener("click", () => tapAnchor(anchor));
    anchors.set(anchor, el);
    anchorLayer.append(el);
  }

  /** 陈设的落位随时可变：位置只在锚位变化时改写，尺寸仍取自陈设自身。 */
  const position = (entry: Entry, decor: PlacedDecor): void => {
    if (!decor.anchor) {
      entry.item.remove();
      return;
    }
    if (entry.item.dataset.anchor !== decor.anchor) {
      const slot = anchorSlot(decor.anchor);
      entry.item.dataset.anchor = decor.anchor;
      entry.item.dataset.depth = slot.depth;
      entry.item.style.left = `${slot.x}%`;
      entry.item.style.top = `${slot.y}%`;
      entry.item.style.setProperty("--dw", `${decorSlot(decor.id).w}%`);
    }
    if (!entry.item.isConnected) scene.append(entry.item);
  };

  const create = (decor: PlacedDecor): Entry => {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "decor-chip";
    chip.dataset.decor = decor.id;
    chip.textContent = decor.label;
    chip.setAttribute("aria-pressed", "false");
    chip.setAttribute("aria-label", `在园中聚焦${decor.name}`);
    chip.addEventListener("click", () => {
      if (placing) hold(held === decor.id ? null : decor.id);
      else focus(focusId === decor.id ? null : decor.id);
    });

    const item = document.createElement("div");
    item.className = "decor-item";
    item.dataset.decor = decor.id;
    item.innerHTML = decorArt(decor.id, decor.glyph);
    const tag = document.createElement("span");
    tag.className = "decor-tag";
    tag.textContent = decor.name;
    item.append(tag);

    return { chip, item, label: decor.label };
  };

  /** 只在陈设集合或落位变化时重排：既有节点原样留用，聚焦态随之保留。 */
  const update = (next: PlacedDecor[]): void => {
    const nextKey = next.map((d) => `${d.id}@${d.anchor ?? "box"}:${d.label}`).join(",");
    if (nextKey === key) return;
    const first = key === "" && entries.size === 0;
    key = nextKey;
    items = next;

    const added: string[] = [];
    const alive = new Set(next.map((d) => d.id));
    for (const [id, entry] of entries) {
      if (alive.has(id)) continue;
      entry.chip.remove();
      entry.item.remove();
      entries.delete(id);
      if (focusId === id) focusId = null;
      if (held === id) held = null;
    }

    next.forEach((decor, index) => {
      let entry = entries.get(decor.id);
      if (!entry) {
        entry = create(decor);
        entries.set(decor.id, entry);
        added.push(decor.id);
      } else if (entry.label !== decor.label) {
        entry.label = decor.label;
        entry.chip.textContent = decor.label;
      }
      position(entry, decor);
      // 收在匣中的陈设仍留一张挂牌：摆放模式里点它就能重新入园
      entry.chip.dataset.boxed = decor.anchor ? "0" : "1";
      if (row.children[index] !== entry.chip) row.insertBefore(entry.chip, row.children[index] ?? null);
    });

    if (next.length && hint.isConnected) hint.remove();
    if (!next.length && !hint.isConnected) row.append(hint);
    // 挂牌行末尾恒为「摆放」入口、「回匣」浮钮与读屏播报位
    row.append(placeToggle, stowBtn, status);
    if (!next.length) setPlaceMode(false);
    paint();
    const fresh = added[0];
    if (!first && added.length === 1 && fresh !== undefined && entries.get(fresh)?.item.isConnected) {
      flash(fresh);
    }
  };

  row.append(hint, placeToggle, stowBtn, status);

  return {
    row,
    scene,
    update,
    setPlaceMode,
    isPlaceMode: () => placing,
    heldDecor: () => held,
  };
}
