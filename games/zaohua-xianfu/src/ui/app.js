import { renderHud } from "./hud.js";
import { TABS, gateView, screen } from "./screens.js";
import { FACTIONS } from "../data/heroes.js";
import { esc } from "./util.js";

/** 界面靠 tick 自刷新，让产量、修业与「买得起吗」保持实时，又不至于每帧重排。 */
const STAGE_REFRESH_MS = 400;

/** 自动吐纳的节流：每秒最多四次，够快又不至于把界面刷成频闪。 */
const AUTO_CULTIVATE_MS = 250;
const CULTIVATE_QI = 4;

function cssEscape(value) {
  const s = String(value ?? "");
  return typeof CSS !== "undefined" && CSS.escape ? CSS.escape(s) : s.replace(/["\\]/g, "\\$&");
}

export function createUI(store) {
  const root = document.getElementById("app");
  const ui = {
    tab: "mansion",
    selPlot: null,
    selBuilding: null,
    selDisciple: null,
    daoName: "",
    autoCultivate: false,
  };
  let lastHtml = "";
  let lastStageHtml = "";
  let lastStageAt = -Infinity;
  let lastAutoAt = -Infinity;
  let composing = false;

  /* -------------------------------------------------- 重绘时的现场保护 */

  /** 用可复现的选择器记住焦点：innerHTML 换掉后照样能找回同一个控件。 */
  function focusSelector(el) {
    if (!el || !root.contains(el)) return null;
    if (el.id) return `#${cssEscape(el.id)}`;
    const act = el.dataset?.act;
    if (!act) return null;
    const keys = ["tab", "did", "bid", "hid", "aid", "id", "type", "x", "y"];
    const attrs = keys
      .filter((k) => el.dataset[k] !== undefined)
      .map((k) => `[data-${k}="${cssEscape(el.dataset[k])}"]`)
      .join("");
    return `[data-act="${cssEscape(act)}"]${attrs}`;
  }

  function captureFocus() {
    const el = document.activeElement;
    const selector = focusSelector(el);
    if (!selector) return null;
    const caret = typeof el.selectionStart === "number" ? [el.selectionStart, el.selectionEnd] : null;
    return { selector, caret };
  }

  function restoreFocus(snap) {
    if (!snap) return;
    const el = root.querySelector(snap.selector);
    if (!el || el === document.activeElement) return;
    try {
      el.focus({ preventScroll: true });
      if (snap.caret && typeof el.setSelectionRange === "function") el.setSelectionRange(snap.caret[0], snap.caret[1]);
    } catch {
      /* 控件已不在，放弃即可 */
    }
  }

  function captureScroll() {
    const map = new Map();
    for (const el of root.querySelectorAll("[data-keep-scroll]")) {
      if (el.scrollTop) map.set(el.dataset.keepScroll, el.scrollTop);
    }
    return { map, page: typeof window === "undefined" ? 0 : window.scrollY };
  }

  function restoreScroll(snap) {
    for (const el of root.querySelectorAll("[data-keep-scroll]")) {
      const top = snap.map.get(el.dataset.keepScroll);
      if (top) el.scrollTop = top;
    }
    if (typeof window !== "undefined" && snap.page && window.scrollY !== snap.page) {
      window.scrollTo({ top: snap.page });
    }
  }

  function swap(target, html) {
    const focus = captureFocus();
    const scroll = captureScroll();
    target.innerHTML = html;
    restoreScroll(scroll);
    restoreFocus(focus);
  }

  /** 道号只活在 ui 状态里，重绘后回填 DOM，避免选阵营前输入被抹掉。 */
  function hydrate() {
    const input = root.querySelector("#dao-name");
    if (!input) return;
    if (composing && input === document.activeElement) return;
    if (input.value !== ui.daoName) input.value = ui.daoName;
  }

  /* -------------------------------------------------- 交互 */

  function daoName() {
    const typed = ui.daoName || root.querySelector("#dao-name")?.value || "";
    return typed.trim();
  }

  function runAct(btn) {
    const act = btn.dataset.act;
    if (act === "tab") {
      ui.tab = btn.dataset.tab;
      repaint();
      return;
    }
    if (act === "plot") {
      ui.selPlot = { x: Number(btn.dataset.x), y: Number(btn.dataset.y) };
      ui.selBuilding = btn.dataset.id ?? null;
      repaint();
      return;
    }
    if (act === "sel-disciple") {
      ui.selDisciple = ui.selDisciple === btn.dataset.did ? null : btn.dataset.did;
      repaint();
      return;
    }
    if (act === "auto-cultivate") {
      ui.autoCultivate = !ui.autoCultivate;
      repaint();
      return;
    }
    if (act === "pick-faction") {
      store.dispatch({ type: "CHOOSE_FACTION", faction: btn.dataset.faction, name: daoName(), now: Date.now() });
      return;
    }
    const handlers = {
      build: () =>
        store.dispatch({ type: "BUILD", buildingType: btn.dataset.type, x: ui.selPlot.x, y: ui.selPlot.y }),
      upgrade: () => store.dispatch({ type: "UPGRADE", id: btn.dataset.id }),
      assign: () =>
        store.dispatch({ type: "ASSIGN", discipleId: btn.dataset.did, buildingId: btn.dataset.bid || null }),
      train: () => store.dispatch({ type: "TRAIN", discipleId: btn.dataset.did }),
      recruit: () => store.dispatch({ type: "RECRUIT", heroId: btn.dataset.hid }),
      cultivate: () => store.dispatch({ type: "CULTIVATE" }),
      "cultivate-x": () => {
        const times = Math.max(1, Number(btn.dataset.n) || 1);
        for (let i = 0; i < times; i++) {
          if ((store.get().resources.qi ?? 0) < CULTIVATE_QI) break;
          store.dispatch({ type: "CULTIVATE" });
        }
      },
      breakthrough: () => store.dispatch({ type: "BREAKTHROUGH", now: Date.now() }),
      "toggle-party": () => {
        const id = btn.dataset.hid;
        const cur = store.get().party;
        const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
        store.dispatch({ type: "SET_PARTY", heroIds: next });
      },
      equip: () => store.dispatch({ type: "EQUIP_ARTIFACT", artifactId: btn.dataset.aid }),
      tower: () => store.dispatch({ type: "START_TOWER", now: Date.now() }),
      wave: () => store.dispatch({ type: "START_WAVE", now: Date.now() }),
      resolve: () => store.dispatch({ type: "RESOLVE_COMBAT", now: Date.now() }),
      collect: () => store.dispatch({ type: "COLLECT_OFFLINE", now: Date.now() }),
      reset: () => {
        if (confirm("重置仙府？此举不可悔。")) {
          ui.tab = "mansion";
          ui.selPlot = null;
          ui.selBuilding = null;
          ui.selDisciple = null;
          ui.autoCultivate = false;
          store.dispatch({ type: "RESET" });
        }
      },
    };
    handlers[act]?.();
  }

  const onClick = (e) => {
    const btn = e.target.closest("[data-act]");
    if (!btn || btn.disabled) return;
    runAct(btn);
  };

  /** 地块是 div，补齐键盘可达性。 */
  const onKeyDown = (e) => {
    if (e.target?.id === "dao-name" && e.key === "Enter") {
      e.preventDefault();
      root.querySelector('[data-act="pick-faction"]')?.focus();
      return;
    }
    if (e.key !== "Enter" && e.key !== " ") return;
    const el = e.target.closest?.('[data-act][role="button"]');
    if (!el) return;
    e.preventDefault();
    runAct(el);
  };

  const onInput = (e) => {
    if (e.target?.id !== "dao-name") return;
    ui.daoName = e.target.value;
  };

  const onCompositionStart = (e) => {
    if (e.target?.id === "dao-name") composing = true;
  };

  const onCompositionEnd = (e) => {
    if (e.target?.id !== "dao-name") return;
    composing = false;
    ui.daoName = e.target.value;
  };

  root.addEventListener("click", onClick);
  root.addEventListener("keydown", onKeyDown);
  root.addEventListener("input", onInput);
  root.addEventListener("change", onInput);
  root.addEventListener("compositionstart", onCompositionStart);
  root.addEventListener("compositionend", onCompositionEnd);

  /* -------------------------------------------------- 渲染 */

  function shellHtml(state, stageHtml) {
    const fac = FACTIONS[state.meta.faction];
    const nav = TABS.map(
      ([id, name]) =>
        `<button data-act="tab" data-tab="${id}" ${ui.tab === id ? 'aria-current="page"' : ""}>${name}</button>`,
    ).join("");
    const offline = state.offline?.pending
      ? `<div class="card offline-box"><b>洞府挂机匣</b> 有离线产出待领
         <button class="gold" data-act="collect">收取</button></div>`
      : "";
    return `<div class="app-shell">
      <header class="topbar">
        <div class="brand">造化仙府<small>${esc(state.meta.name)} · ${esc(fac?.name ?? "")}</small></div>
        <div class="res-bar">${renderHud(state)}</div>
        <button data-act="reset" title="清空存档，重头开府">重置</button>
      </header>
      <nav class="nav" aria-label="主导航">${nav}</nav>
      ${offline}
      <main class="stage">${stageHtml}</main>
    </div>`;
  }

  function paint(state) {
    if (composing) return;
    const stageHtml = state.meta.faction ? screen(ui.tab, state, ui) : "";
    const html = state.meta.faction ? shellHtml(state, stageHtml) : gateView();
    if (html !== lastHtml) {
      swap(root, html);
      lastHtml = html;
      lastStageHtml = stageHtml;
      lastStageAt = now();
    }
    hydrate();
  }

  function repaint() {
    lastHtml = "";
    paint(store.get());
  }

  function now() {
    return typeof performance !== "undefined" ? performance.now() : Date.now();
  }

  /** 自动吐纳：只是替玩家点那颗按钮，灵气不够就静静停下。 */
  function autoCultivate(state) {
    if (!ui.autoCultivate || !state.meta.faction) return false;
    if ((state.resources.qi ?? 0) < CULTIVATE_QI) return false;
    const t = now();
    if (t - lastAutoAt < AUTO_CULTIVATE_MS) return false;
    lastAutoAt = t;
    store.dispatch({ type: "CULTIVATE" });
    return true;
  }

  /** 每帧只刷 HUD，舞台按 STAGE_REFRESH_MS 节流；字符串没变就不碰 DOM。 */
  function frame(state) {
    if (composing) return;
    if (autoCultivate(state)) return; // 触发了动作，重绘已由订阅接手
    const bar = root.querySelector(".res-bar");
    if (!state.meta.faction || !bar) {
      paint(state);
      return;
    }
    const hud = renderHud(state);
    if (bar.innerHTML !== hud) bar.innerHTML = hud;

    const stage = root.querySelector(".stage");
    if (!stage) return;
    const t = now();
    if (t - lastStageAt < STAGE_REFRESH_MS) return;
    lastStageAt = t;
    const stageHtml = screen(ui.tab, state, ui);
    if (stageHtml === lastStageHtml) return;
    swap(stage, stageHtml);
    lastStageHtml = stageHtml;
    lastHtml = "";
  }

  store.subscribe((_state, action) => {
    if (!action || action.type === "TICK") return;
    repaint();
  });

  return { paint, frame, ui };
}
