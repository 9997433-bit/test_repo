import "./styles/ink.css";
import { createGame } from "./core/game.js";
import { clampDt, createLoop } from "./core/engine.js";
import { stepAi } from "./ai/opponent.js";
import { render } from "./ui/render.js";
import { drawLane } from "./ui/lane.js";
import { sfx } from "./audio/sfx.js";

const DEFAULT_SEED = 20260623;
const UI_INTERVAL = 1 / 30;
const DRAG_SLOP = 6;

const root = document.querySelector("#app");
const api = createGame({ seed: readSeed() });
const ui = { selected: -1, selectedCell: -1, hover: -1, toast: "", shake: false };

/** 调试与自动化测试入口：控制台/e2e 脚本可直接读写这局的 api 与 ui 状态。 */
if (typeof window !== "undefined") window.__zhaoyun = { api, ui };

function readSeed() {
  try {
    const raw = new URLSearchParams(window.location.search).get("seed");
    const n = Number(raw);
    return raw != null && Number.isFinite(n) ? n : DEFAULT_SEED;
  } catch {
    return DEFAULT_SEED;
  }
}

/* ---------------------------------------------------------------- 提示条 */

let toastUntil = 0;
let shakeTimer = 0;

function nowSec() {
  return (typeof performance !== "undefined" ? performance.now() : Date.now()) / 1000;
}

function flash(text, ttl = 2.6) {
  ui.toast = text;
  toastUntil = nowSec() + ttl;
  markDirty();
}

function clearToast() {
  ui.toast = "";
  toastUntil = 0;
  markDirty();
}

/* ------------------------------------------------------------ 事件与音效 */

api.bus.on("recruit", () => sfx.recruit());
api.bus.on("merge", () => {
  sfx.merge();
  flash("合并升阶");
});
api.bus.on("hero-awaken", (p) => {
  sfx.awaken();
  flash(`${p.names.join("、")} 出阵`);
});
api.bus.on("leak", (p) => {
  if (p.side === "player") {
    sfx.leak();
    ui.shake = true;
    clearTimeout(shakeTimer);
    shakeTimer = setTimeout(() => {
      ui.shake = false;
      markDirty();
    }, 360);
  }
  flash(p.side === "player" ? "阿斗受伤，赐粮征兵" : "对岸阿斗受伤");
});
api.bus.on("skill", (p) => {
  sfx.skill();
  flash(`${p.hero} · ${p.skill}`);
});
api.bus.on("game-over", (p) => {
  p.winner === "player" ? sfx.win() : sfx.lose();
  clearSelection();
});
api.bus.on("wave", (p) => flash(`第 ${p.wave} 波来袭`));
api.bus.on("expand", () => flash("铲开新地"));
api.bus.on("pause", () => flash("已暂停 · 空格继续", Infinity));
api.bus.on("resume", () => clearToast());
api.bus.on("start", () => {
  clearSelection();
  clearToast();
});

/* ------------------------------------------------------- 增量渲染（核心） */
/*
 * 旧实现每帧 root.innerHTML = ... 重建整棵树：拖拽中的节点被销毁，
 * 指针事件与选中态一起丢失。现在渲染到离屏容器后做同构 diff，
 * 真实 DOM 节点身份保持不变，输入不再被打断。
 */

const SKIP_TAGS = new Set(["CANVAS"]);
let dirty = true;
let lastSignature = "";
let uiAcc = 0;

function markDirty() {
  dirty = true;
}

function syncAttrs(live, next) {
  const nextAttrs = next.attributes;
  for (let i = 0; i < nextAttrs.length; i++) {
    const { name, value } = nextAttrs[i];
    if (live.getAttribute(name) !== value) live.setAttribute(name, value);
  }
  const liveAttrs = live.attributes;
  for (let i = liveAttrs.length - 1; i >= 0; i--) {
    const name = liveAttrs[i].name;
    // 行内样式由运行时（拖拽、touch-action）注入，渲染层不管理，别删。
    if (name === "style") continue;
    if (!next.hasAttribute(name)) live.removeAttribute(name);
  }
}

function morphChildren(live, next) {
  const nextKids = Array.from(next.childNodes);
  for (let i = 0; i < nextKids.length; i++) {
    const b = nextKids[i];
    const a = live.childNodes[i];
    if (!a) {
      live.appendChild(b.cloneNode(true));
      continue;
    }
    if (a.nodeType !== b.nodeType || (a.nodeType === 1 && a.tagName !== b.tagName)) {
      live.replaceChild(b.cloneNode(true), a);
      continue;
    }
    if (a.nodeType !== 1) {
      if (a.nodeValue !== b.nodeValue) a.nodeValue = b.nodeValue;
      continue;
    }
    // 画布像素由 drawLane 维护，diff 不得重置其尺寸。
    if (SKIP_TAGS.has(a.tagName)) continue;
    syncAttrs(a, b);
    morphChildren(a, b);
  }
  while (live.childNodes.length > nextKids.length) live.removeChild(live.lastChild);
}

function unitKey(unit) {
  if (!unit) return "-";
  return `${unit.kind}:${unit.id || unit.glyph}:${unit.level || 0}`;
}

/** UI 只依赖这些量，签名不变就不用重排 DOM。 */
function signature() {
  const s = api.state;
  const p = s.sides.player;
  const a = s.sides.ai;
  const parts = [
    s.phase,
    s.winner,
    s.wave,
    s.time | 0,
    p.mantou,
    p.hearts,
    p.kills,
    p.recruitCount,
    a.hearts,
    a.kills,
    ui.selected,
    ui.selectedCell,
    ui.hover,
    ui.toast,
    ui.shake ? 1 : 0,
  ];
  // HUD 会报「来敌 / 待出」，敌军进出场也要触发一次重排。
  parts.push(p.enemies.length, a.enemies.length, p.spawnQueue.length, a.spawnQueue.length);
  for (const c of p.cells) parts.push(c.unlocked ? 1 : 0, unitKey(c.unit));
  for (const c of a.cells) parts.push(c.unlocked ? 1 : 0, unitKey(c.unit));
  for (const card of p.hand) parts.push(unitKey(card));
  parts.push(p.hand.length);
  return parts.join("|");
}

const scratch = document.createElement("div");

function patch() {
  const sig = signature();
  if (!dirty && sig === lastSignature) return false;
  lastSignature = sig;
  dirty = false;
  render(scratch, api, ui);
  morphChildren(root, scratch);
  decorate();
  return true;
}

/** 渲染层只画棋局本身，指针态（悬停/选中）由主循环在 diff 之后补上。 */
function decorate() {
  root.style.touchAction = "manipulation";
  const grid = root.querySelector("#grid-player");
  if (grid) grid.style.touchAction = "none";
  const hand = root.querySelector(".hand");
  if (hand) hand.style.touchAction = "none";
  if (ui.hover >= 0) {
    root.querySelector(`[data-cell="${ui.hover}"]`)?.classList.add("drop");
  }
  if (ui.selectedCell >= 0) {
    root.querySelector(`[data-cell="${ui.selectedCell}"]`)?.classList.add("drop", "selected");
  }
}

let laneAi = null;
let lanePlayer = null;

function drawLanes() {
  if (!laneAi?.isConnected) laneAi = root.querySelector("#lane-ai");
  if (!lanePlayer?.isConnected) lanePlayer = root.querySelector("#lane-player");
  try {
    if (laneAi) drawLane(laneAi, api.state.sides.ai.enemies, true);
    if (lanePlayer) drawLane(lanePlayer, api.state.sides.player.enemies, false);
  } catch {
    /* 画布不可用时不该拖垮主循环 */
  }
}

/* ------------------------------------------------------------ 输入与拖拽 */

const drag = {
  active: false,
  pointerId: -1,
  source: "",
  index: -1,
  moved: false,
  wasSelected: false,
  startX: 0,
  startY: 0,
  ghost: null,
};

function playerSide() {
  return api.state.sides.player;
}

function clearSelection() {
  ui.selected = -1;
  ui.selectedCell = -1;
  markDirty();
}

function makeGhost(glyph, sample) {
  if (!glyph) return null;
  const el = document.createElement("div");
  el.className = "card";
  el.textContent = glyph;
  const box = sample?.getBoundingClientRect?.();
  Object.assign(el.style, {
    position: "fixed",
    left: "0px",
    top: "0px",
    width: `${Math.max(44, box?.width || 56)}px`,
    height: `${Math.max(44, box?.height || 56)}px`,
    minHeight: "0",
    display: "grid",
    placeItems: "center",
    pointerEvents: "none",
    opacity: "0.9",
    zIndex: "80",
    transform: "translate(-9999px, -9999px)",
  });
  document.body.appendChild(el);
  return el;
}

function moveGhost(x, y) {
  if (!drag.ghost) return;
  drag.ghost.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
}

function startDrag(source, index, ev, el, glyph) {
  drag.active = true;
  drag.source = source;
  drag.index = index;
  drag.pointerId = ev.pointerId ?? -1;
  drag.moved = false;
  drag.startX = ev.clientX;
  drag.startY = ev.clientY;
  drag.ghost = makeGhost(glyph, el);
  moveGhost(ev.clientX, ev.clientY);
}

function endDrag() {
  drag.active = false;
  drag.source = "";
  drag.index = -1;
  drag.pointerId = -1;
  drag.moved = false;
  if (drag.ghost) {
    drag.ghost.remove();
    drag.ghost = null;
  }
}

function cellIndexAt(x, y) {
  if (!Number.isFinite(x) || !Number.isFinite(y)) return -1;
  const el = document.elementFromPoint(x, y);
  const cell = el?.closest?.("[data-cell]");
  if (!cell || !root.contains(cell)) return -1;
  const idx = Number(cell.dataset.cell);
  return Number.isInteger(idx) ? idx : -1;
}

function refuseReason(card, cellIndex) {
  const cell = playerSide().cells[cellIndex];
  if (!cell) return "此处不可落子";
  if (!cell.unlocked) return "此格未开，需用铲子";
  if (card.kind === "token") return cell.unit ? "此单位已满级" : "神兵符须贴在兵种上";
  if (cell.unit) return "同兵同级方可合并";
  return "此处不可落子";
}

function dropHandCard(cellIndex) {
  const handIndex = ui.selected;
  const card = playerSide().hand[handIndex];
  if (!card) {
    ui.selected = -1;
    return false;
  }
  const ok =
    card.kind === "shovel"
      ? api.useShovel("player", handIndex, cellIndex)
      : api.place("player", handIndex, cellIndex);
  if (ok) {
    ui.selected = -1;
    ui.selectedCell = -1;
  } else {
    flash(card.kind === "shovel" ? "铲子只能开锁住的格子" : refuseReason(card, cellIndex));
  }
  markDirty();
  return ok;
}

function mergeCells(from, to) {
  const ok = api.merge("player", from, to);
  if (ok) ui.selectedCell = -1;
  else flash("此处不可合并");
  markDirty();
  return ok;
}

/** 松手/点击落到某个棋格时的统一裁决。 */
function resolveDrop(cellIndex, justSelected) {
  if (cellIndex < 0) return false;
  if (ui.selected >= 0) return dropHandCard(cellIndex);
  if (ui.selectedCell >= 0) {
    if (ui.selectedCell === cellIndex) {
      if (!justSelected) clearSelection();
      return false;
    }
    return mergeCells(ui.selectedCell, cellIndex);
  }
  return false;
}

function onPointerDown(ev) {
  if (ev.button != null && ev.button > 0) return;
  if (ev.target.closest("button")) return;

  const handEl = ev.target.closest("[data-hand]");
  if (handEl) {
    const i = Number(handEl.dataset.hand);
    const card = playerSide().hand[i];
    if (!card) return;
    drag.wasSelected = ui.selected === i;
    ui.selected = i;
    ui.selectedCell = -1;
    startDrag("hand", i, ev, handEl, card.glyph);
    markDirty();
    if (ev.cancelable) ev.preventDefault();
    return;
  }

  const cellEl = ev.target.closest("[data-cell]");
  if (!cellEl) return;
  const idx = Number(cellEl.dataset.cell);
  const cell = playerSide().cells[idx];
  if (!cell) return;

  // 已选手牌 / 已选棋格：本次按下不改选，交给 pointerup 裁决。
  if (ui.selected >= 0) return;
  if (ui.selectedCell >= 0 && ui.selectedCell !== idx) return;
  if (!cell.unlocked || !cell.unit) return;

  drag.wasSelected = ui.selectedCell === idx;
  ui.selectedCell = idx;
  startDrag("cell", idx, ev, cellEl, cell.unit.glyph);
  markDirty();
  if (ev.cancelable) ev.preventDefault();
}

function onPointerMove(ev) {
  if (drag.active) {
    if (drag.pointerId >= 0 && ev.pointerId !== drag.pointerId) return;
    if (!drag.moved && Math.hypot(ev.clientX - drag.startX, ev.clientY - drag.startY) > DRAG_SLOP) {
      drag.moved = true;
    }
    moveGhost(ev.clientX, ev.clientY);
  }
  const idx = cellIndexAt(ev.clientX, ev.clientY);
  if (idx !== ui.hover) {
    ui.hover = idx;
    markDirty();
  }
}

function onPointerUp(ev) {
  if (drag.active && drag.pointerId >= 0 && ev.pointerId !== drag.pointerId) return;
  const wasDragging = drag.active;
  const justSelected = wasDragging && !drag.wasSelected;
  const movedFar = drag.moved;
  const source = drag.source;
  const originIndex = drag.index;
  endDrag();

  const idx = cellIndexAt(ev.clientX, ev.clientY);
  if (idx >= 0) {
    resolveDrop(idx, justSelected && idx === originIndex);
  } else if (wasDragging && source === "hand" && !movedFar && drag.wasSelected) {
    ui.selected = -1;
  } else if (wasDragging && movedFar) {
    // 拖到棋盘外：放弃这次拖拽，但保留手牌选中态。
    if (source === "cell") ui.selectedCell = -1;
  }
  drag.wasSelected = false;
  markDirty();
}

function onPointerCancel() {
  endDrag();
  markDirty();
}

function onClick(ev) {
  const btn = ev.target.closest("button");
  if (!btn) return;
  if (btn.id === "btn-start" || btn.id === "btn-again") {
    sfx.unlock();
    api.start();
    markDirty();
    return;
  }
  if (btn.id === "btn-recruit") {
    sfx.unlock();
    doRecruit();
  }
}

function doRecruit() {
  const r = api.recruit("player");
  if (!r) return;
  if (r.error === "hand-full") flash("兵营已满");
  else if (r.error === "no-mantou") flash("馒头不足");
  markDirty();
}

/** 无 PointerEvent 的老浏览器兜底：点选 → 点落。 */
function onLegacyClick(ev) {
  const handEl = ev.target.closest("[data-hand]");
  if (handEl) {
    const i = Number(handEl.dataset.hand);
    ui.selected = ui.selected === i ? -1 : i;
    ui.selectedCell = -1;
    markDirty();
    return;
  }
  const cellEl = ev.target.closest("[data-cell]");
  if (!cellEl) return;
  const idx = Number(cellEl.dataset.cell);
  const cell = playerSide().cells[idx];
  if (ui.selected < 0 && ui.selectedCell < 0) {
    if (cell?.unlocked && cell.unit) {
      ui.selectedCell = idx;
      markDirty();
    }
    return;
  }
  resolveDrop(idx, false);
}

function onKeyDown(ev) {
  if (ev.metaKey || ev.ctrlKey || ev.altKey) return;
  const key = ev.key;
  if (typeof key !== "string") return;
  if (key === " " || key === "Spacebar" || key.toLowerCase() === "p") {
    if (api.state.phase === "playing" || api.state.phase === "paused") {
      api.togglePause();
      autoPaused = false;
      ev.preventDefault();
      markDirty();
    }
    return;
  }
  if (key === "Escape") {
    clearSelection();
    return;
  }
  if (key === "Enter" || key.toLowerCase() === "e") {
    if (api.state.phase === "playing") doRecruit();
    else if (api.state.phase === "menu" || api.state.phase === "over") {
      sfx.unlock();
      api.start();
    }
    return;
  }
  if (key.toLowerCase() === "r") {
    sfx.unlock();
    api.restart();
    return;
  }
  if (key >= "1" && key <= "5") {
    const i = Number(key) - 1;
    if (playerSide().hand[i]) {
      ui.selected = ui.selected === i ? -1 : i;
      ui.selectedCell = -1;
      markDirty();
    }
  }
}

let autoPaused = false;
function onVisibilityChange() {
  if (document.hidden) {
    autoPaused = api.pause();
  } else if (autoPaused) {
    autoPaused = false;
    api.resume();
  }
}

if (window.PointerEvent) {
  root.addEventListener("pointerdown", onPointerDown);
  window.addEventListener("pointermove", onPointerMove, { passive: true });
  window.addEventListener("pointerup", onPointerUp);
  window.addEventListener("pointercancel", onPointerCancel);
} else {
  root.addEventListener("click", onLegacyClick);
}
root.addEventListener("click", onClick);
root.addEventListener("contextmenu", (ev) => {
  if (drag.active) ev.preventDefault();
});
window.addEventListener("keydown", onKeyDown);
document.addEventListener("visibilitychange", onVisibilityChange);

/* ------------------------------------------------------------------ 主循环 */

const loop = createLoop((rawDt) => {
  const dt = clampDt(rawDt);
  api.tick(dt);
  stepAi(api, dt);
  drawLanes();

  if (ui.toast && Number.isFinite(toastUntil) && nowSec() > toastUntil) clearToast();

  uiAcc += dt;
  if (dirty || uiAcc >= UI_INTERVAL) {
    uiAcc = 0;
    patch();
  }
});

render(root, api, ui);
decorate();
lastSignature = signature();
dirty = false;
loop.start();
