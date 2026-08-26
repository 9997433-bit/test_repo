import "./styles/main.css";
import { loadState, saveState, clearSave } from "./engine/save";
import { startLoop } from "./engine/loop";
import { isNight } from "./engine/time";
import { onGameEvent } from "./engine/events";
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

export function boot(root: HTMLElement): void {
  const state = loadState();
  let selected: number | null = 0;
  let panel: PanelId = null;
  let tool: "water" | "harvest" | "plant" | "fert" = "plant";

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
    { id: "reset", label: "重整山河", run: () => { clearSave(); location.reload(); } },
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

  const onPick = (id: number) => {
    selected = id;
    if (tool === "water") waterPlot(state, id);
    if (tool === "fert") fertilize(state, id);
    if (tool === "harvest") harvest(state, id);
    paint();
  };

  const handlers = {
    plant: (flowerId: string) => {
      if (selected == null) selected = state.plots.find((p) => p.stage === "empty")?.id ?? 0;
      plant(state, selected, flowerId);
    },
    fulfill: (uid: string, artId?: string) => fulfillOrder(state, uid, artId),
    cancel: (uid: string) => cancelOrder(state, uid),
    craft: (vase: string, ids: string[]) => craft(state, vase, ids),
    place: (id: string) => placeDecor(state, id),
    theme: (t: string) => applyTheme(state, t as DecorTheme),
    spirit: (id: string | null) => setSpirit(state, id),
  };

  const paint = () => {
    root.dataset.season = state.season;
    root.dataset.night = isNight(state) ? "1" : "0";
    root.classList.toggle("is-night", isNight(state));
    renderHud(hud, state);
    renderGarden(stage, state, selected, onPick);
    renderPanel(sheets, panel, state, handlers);
    renderTutorial(root, state, () => {
      advanceTutorial(state);
      paint();
    });
    [...dock.children].forEach((c, i) => {
      const spec = buttons[i];
      c.classList.toggle("is-on", spec?.id === tool || spec?.id === panel);
    });
  };

  onGameEvent((e) => {
    if (e.type === "harvest" || e.type === "bloom") {
      const plot = stage.querySelectorAll(".plot")[e.plotId];
      const r = plot?.getBoundingClientRect();
      if (r) burst(root, r.left + r.width / 2, r.top + r.height / 2, "#f4d35e");
    }
  });

  paint();
  startLoop(() => state, paint);
  addEventListener("beforeunload", () => saveState(state));
}
