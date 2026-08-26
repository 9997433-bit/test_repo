import "./styles/main.css";
import { loadState, clearSave, installSaveFlush, scheduleSave } from "./engine/save";
import { startLoop } from "./engine/loop";
import { isNight } from "./engine/time";
import { emit, onGameEvent } from "./engine/events";
import { installPlotPointer } from "./engine/input";
import type { ActiveOrder, GameState } from "./engine/state";
import { plant, waterPlot, fertilize, harvest, unlockPlot } from "./systems/planting";
import { fulfillOrder, cancelOrder } from "./systems/orders";
import { craft } from "./systems/workshop";
import { placeDecor, applyTheme } from "./systems/decorate";
import { setSpirit } from "./systems/spirits";
import { renderGarden } from "./scene/garden-view";
import { mountPetals, burst } from "./scene/particles";
import { renderHud } from "./ui/hud";
import { renderPanel, type PanelId } from "./ui/panels";
import { mountToasts } from "./ui/toast";
import { renderTutorial, advanceTutorial } from "./ui/tutorial";
import { resumeAudio, toggleMute } from "./audio/soundscape";
import type { DecorTheme } from "./data/decorations";

type Tool = "water" | "harvest" | "plant" | "fert";

/** 指针已处理过的交互，抑制紧随其后的同一次 click */
const CLICK_GUARD_MS = 400;

/** 定制订单挑一件刚好达标的作品：够分的里选分最低的，把精品留给更难的单子 */
export function pickArrangementFor(state: GameState, order: ActiveOrder, preferred?: string): string | undefined {
  const need = order.requireScore;
  if (!need) return preferred;
  const usable = state.arrangements.filter((a) => a.score >= need);
  if (!usable.length) return preferred;
  const chosen = usable.find((a) => a.id === preferred) ?? usable.reduce((best, a) => (a.score < best.score ? a : best));
  return chosen.id;
}

export function boot(root: HTMLElement): void {
  const state = loadState();
  let selected: number | null = 0;
  let panel: PanelId = null;
  let tool: Tool = "plant";

  root.className = "app";
  const hud = document.createElement("header");
  hud.className = "hud";
  const stage = document.createElement("main");
  stage.className = "stage";
  const dock = document.createElement("nav");
  dock.className = "dock";
  const sheets = document.createElement("div");
  root.append(hud, stage, dock, sheets);
  mountToasts(root);
  mountPetals(root);

  let stopLoop: (() => void) | null = null;
  let disposeSaveFlush: (() => void) | null = null;
  let disposePointer: (() => void) | null = null;
  const canAnimate = typeof root.animate === "function";

  const buttons: { id: string; label: string; run: () => void }[] = [
    { id: "water", label: "洒水", run: () => (tool = "water") },
    { id: "fert", label: "施肥", run: () => (tool = "fert") },
    { id: "harvest", label: "收获", run: () => (tool = "harvest") },
    { id: "seed", label: "花种", run: () => (panel = panel === "seed" ? null : "seed") },
    { id: "workshop", label: "花艺", run: () => (panel = panel === "workshop" ? null : "workshop") },
    { id: "order", label: "订单", run: () => (panel = panel === "order" ? null : "order") },
    { id: "decor", label: "装扮", run: () => (panel = panel === "decor" ? null : "decor") },
    { id: "spirit", label: "花灵", run: () => (panel = panel === "spirit" ? null : "spirit") },
    { id: "bag", label: "库存", run: () => (panel = panel === "bag" ? null : "bag") },
    { id: "plot", label: "扩建", run: () => unlockPlot(state) },
    { id: "mute", label: "音静", run: () => toggleMute() },
    {
      id: "reset",
      label: "重整山河",
      run: () => {
        stopLoop?.();
        disposePointer?.();
        disposeSaveFlush?.();
        clearSave();
        location.reload();
      },
    },
  ];
  for (const b of buttons) {
    const el = document.createElement("button");
    el.textContent = b.label;
    el.addEventListener("click", () => {
      resumeAudio();
      b.run();
      paint();
    });
    dock.append(el);
  }

  const useTool = (id: number) => {
    selected = id;
    if (tool === "water") waterPlot(state, id);
    if (tool === "fert") fertilize(state, id);
    if (tool === "harvest") harvest(state, id);
    scheduleSave(state);
  };

  let clickGuardUntil = 0;
  const onPick = (id: number) => {
    // 指针层已处理过这次交互（键盘触发的 click 不会落在窗口内）
    if (Date.now() < clickGuardUntil) {
      clickGuardUntil = 0;
      return;
    }
    useTool(id);
    paint();
  };

  const plotElements = (): Element[] => [...stage.querySelectorAll(".plot")];
  const plotElementOf = (plotId: number): Element | null =>
    stage.querySelector(`.plot[data-plot-id="${plotId}"]`) ?? plotElements()[state.plots.findIndex((p) => p.id === plotId)] ?? null;
  const splash = (el: Element, color: string) => {
    if (!canAnimate) return;
    const r = el.getBoundingClientRect();
    if (!r.width && !r.height) return;
    burst(root, r.left + r.width / 2, r.top + r.height / 2, color);
  };

  let strokeWatered = 0;
  let strokeDry = false;
  disposePointer = installPlotPointer(stage, {
    plotIdOf: (el) => {
      const tagged = el instanceof HTMLElement ? el.dataset.plotId : undefined;
      if (tagged) {
        const id = Number(tagged);
        if (Number.isFinite(id)) return id;
      }
      const idx = plotElements().indexOf(el);
      return idx < 0 ? null : (state.plots[idx]?.id ?? null);
    },
    isDragTool: () => tool === "water",
    onDragOver: (plotId, el) => {
      selected = plotId;
      if (strokeDry) return;
      if (state.water <= 0) strokeDry = true;
      if (waterPlot(state, plotId)) {
        strokeWatered += 1;
        splash(el, "#8ecae6");
      }
      paint();
    },
    onDragEnd: () => {
      clickGuardUntil = Date.now() + CLICK_GUARD_MS;
      if (strokeWatered > 0) {
        emit({ type: "toast", text: `洒水润泽 ${strokeWatered} 处花圃`, tone: "ok" });
        scheduleSave(state);
      }
      strokeWatered = 0;
      strokeDry = false;
      paint();
    },
    onTap: (plotId) => {
      clickGuardUntil = Date.now() + CLICK_GUARD_MS;
      useTool(plotId);
      paint();
    },
  });

  const handlers = {
    plant: (flowerId: string) => {
      if (selected == null) selected = state.plots.find((p) => p.stage === "empty")?.id ?? 0;
      plant(state, selected, flowerId);
      scheduleSave(state);
    },
    fulfill: (uid: string, artId?: string) => {
      const order = state.orders.find((o) => o.uid === uid);
      if (!order) return;
      fulfillOrder(state, uid, pickArrangementFor(state, order, artId));
      scheduleSave(state);
    },
    cancel: (uid: string) => {
      cancelOrder(state, uid);
      scheduleSave(state);
    },
    craft: (vase: string, ids: string[]) => {
      craft(state, vase, ids);
      scheduleSave(state);
    },
    place: (id: string) => {
      placeDecor(state, id);
      scheduleSave(state);
    },
    theme: (t: string) => {
      applyTheme(state, t as DecorTheme);
      scheduleSave(state);
    },
    spirit: (id: string | null) => {
      setSpirit(state, id);
      scheduleSave(state);
    },
  };

  const paintTutorial = () => {
    renderTutorial(root, state, () => {
      advanceTutorial(state);
      paint();
    });
    // 兜底：教程一旦走完，任何残留弹窗都不许再挡住花园
    if (state.tutorialDone) {
      for (const box of root.querySelectorAll(".modal")) box.remove();
    }
  };

  const paint = () => {
    root.dataset.season = state.season;
    root.dataset.night = isNight(state) ? "1" : "0";
    root.classList.toggle("is-night", isNight(state));
    root.dataset.tutorial = state.tutorialDone ? "done" : String(state.tutorialStep);
    renderHud(hud, state);
    renderGarden(stage, state, selected, onPick);
    renderPanel(sheets, panel, state, handlers);
    paintTutorial();

    [...dock.children].forEach((c, i) => {
      const spec = buttons[i];
      c.classList.toggle("is-on", spec?.id === tool || spec?.id === panel);
    });
  };

  onGameEvent((e) => {
    if (e.type === "harvest" || e.type === "bloom") {
      const plot = plotElementOf(e.plotId);
      if (plot) splash(plot, "#f4d35e");
    }
  });

  paint();
  stopLoop = startLoop(() => state, paint);
  disposeSaveFlush = installSaveFlush(() => state);
}
