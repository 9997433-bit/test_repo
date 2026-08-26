import { renderHud } from "./hud.js";
import { TABS, gateView, screen } from "./screens.js";
import { FACTIONS } from "../data/heroes.js";

export function createUI(store) {
  const root = document.getElementById("app");
  const ui = { tab: "mansion", selPlot: null, selBuilding: null };
  let lastHtml = "";

  const onClick = (e) => {
    const btn = e.target.closest("[data-act]");
    if (!btn) return;
    const act = btn.dataset.act;
    if (act === "tab") {
      ui.tab = btn.dataset.tab;
      return;
    }
    if (act === "pick-faction") {
      const name = document.getElementById("dao-name")?.value?.trim();
      store.dispatch({ type: "CHOOSE_FACTION", faction: btn.dataset.faction, name, now: Date.now() });
      return;
    }
    if (act === "plot") {
      ui.selPlot = { x: Number(btn.dataset.x), y: Number(btn.dataset.y) };
      ui.selBuilding = btn.dataset.id ?? null;
      return;
    }
    const handlers = {
      build: () =>
        store.dispatch({ type: "BUILD", buildingType: btn.dataset.type, x: ui.selPlot.x, y: ui.selPlot.y }),
      upgrade: () => store.dispatch({ type: "UPGRADE", id: btn.dataset.id }),
      assign: () => store.dispatch({ type: "ASSIGN", discipleId: btn.dataset.did, buildingId: btn.dataset.bid }),
      train: () => store.dispatch({ type: "TRAIN", discipleId: btn.dataset.did }),
      recruit: () => store.dispatch({ type: "RECRUIT", heroId: btn.dataset.hid }),
      cultivate: () => store.dispatch({ type: "CULTIVATE" }),
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
        if (confirm("重置仙府？此举不可悔。")) store.dispatch({ type: "RESET" });
      },
    };
    handlers[act]?.();
  };

  root.addEventListener("click", onClick);

  function frame(state) {
    const shell = root.querySelector(".res-bar");
    if (shell && state.meta.faction) {
      const hud = renderHud(state);
      if (shell.innerHTML !== hud) shell.innerHTML = hud;
      return;
    }
    paint(state);
  }

  function paint(state) {
    let html;
    if (!state.meta.faction) html = gateView();
    else {
      const fac = FACTIONS[state.meta.faction];
      const nav = TABS.map(
        ([id, name]) =>
          `<button data-act="tab" data-tab="${id}" ${ui.tab === id ? 'aria-current="page"' : ""}>${name}</button>`,
      ).join("");
      const offline = state.offline?.pending
        ? `<div class="card" style="margin:0.6rem 1.2rem 0"><b>洞府挂机匣</b> 有离线产出待领
           <button class="gold" data-act="collect">收取</button></div>`
        : "";
      html = `<div class="app-shell">
        <header class="topbar">
          <div class="brand">造化仙府<small>${state.meta.name} · ${fac.name}</small></div>
          <div class="res-bar">${renderHud(state)}</div>
          <button data-act="reset">重置</button>
        </header>
        <nav class="nav">${nav}</nav>
        ${offline}
        <main class="stage">${screen(ui.tab, state, ui)}</main>
      </div>`;
    }
    if (html !== lastHtml) {
      root.innerHTML = html;
      lastHtml = html;
    }
  }

  store.subscribe((_state, action) => {
    if (!action || action.type === "TICK") return;
    lastHtml = "";
    paint(store.get());
  });

  return { paint, frame, ui };
}
