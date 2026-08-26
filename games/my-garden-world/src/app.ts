import "./styles/main.css";
import { FLOWER_MAP } from "./data/flowers";
import { tutorialAllows } from "./data/story";
import type { DecorTheme } from "./data/decorations";
import { loadState, flushSave, clearSave } from "./engine/save";
import { applyOfflineCatchUp } from "./engine/offline";
import { startLoop } from "./engine/loop";
import { isNight } from "./engine/time";
import { onGameEvent } from "./engine/events";
import { MAX_PLOTS } from "./engine/state";
import { plant, waterPlot, fertilize, harvest, unlockPlot } from "./systems/planting";
import { fulfillOrder, cancelOrder } from "./systems/orders";
import { craft } from "./systems/workshop";
import { placeDecor, applyTheme } from "./systems/decorate";
import { setSpirit } from "./systems/spirits";
import { createGardenView } from "./scene/garden-view";
import { mountAmbient, burst, splash } from "./scene/particles";
import { mountSky } from "./scene/ambience";
import { createHud } from "./ui/hud";
import { renderPanel, updatePanelTimers, type PanelHandlers, type PanelId, type PanelSelection } from "./ui/panels";
import { mountToasts } from "./ui/toast";
import { renderTutorial, advanceTutorial, tutorialEventAdvances, coachTargetId } from "./ui/tutorial";
import { resumeAudio, toggleMute, isMuted, chime } from "./audio/soundscape";

type Tool = "none" | "water" | "fert" | "harvest";

export function boot(root: HTMLElement): void {
  const state = loadState();
  let selected: number | null = null;
  let panel: PanelId = null;
  let tool: Tool = "none";
  const sel: PanelSelection = { workshopPick: [], orderPick: new Map(), pendingSeed: null };

  root.className = "app";
  const hudEl = document.createElement("header");
  hudEl.className = "hud";
  const stage = document.createElement("main");
  stage.className = "stage";
  const dock = document.createElement("nav");
  dock.className = "dock";
  dock.setAttribute("aria-label", "操作栏");
  const sheets = document.createElement("div");
  sheets.className = "sheets";
  root.append(hudEl, stage, dock, sheets);

  const sky = mountSky(root);
  const ambient = mountAmbient(root);
  mountToasts(root);
  const hud = createHud(hudEl);

  let panelDirty = true;
  let panelSigLast = "";
  const invalidate = (): void => {
    panelDirty = true;
  };

  // ---------- 花园交互 ----------
  const lastWater = new Map<number, number>();
  let lastChime = 0;

  const onPick = (id: number): void => {
    resumeAudio();
    selected = id;
    const plot = state.plots[id];
    if (!plot) return;
    if (tool === "water") {
      // 指针拖浇已在 pointerdown 处理；此分支兜底键盘操作
      if ((lastWater.get(id) ?? 0) < performance.now() - 300) waterPlot(state, id);
    } else if (tool === "fert") {
      fertilize(state, id);
    } else if (tool === "harvest") {
      harvest(state, id);
    } else if (plot.stage === "empty" && sel.pendingSeed) {
      plant(state, id, sel.pendingSeed);
    } else if (plot.stage === "bloom" || plot.stage === "wilt") {
      harvest(state, id);
    }
    invalidate();
  };

  const garden = createGardenView(stage, onPick);

  // 拖拽浇水：按住洒水壶扫过花圃
  let dragging = false;
  const tryWaterAt = (x: number, y: number): void => {
    const el = (document.elementFromPoint(x, y)?.closest(".plot") ?? null) as HTMLElement | null;
    if (!el) return;
    const id = Number(el.dataset.plotId);
    if (!Number.isFinite(id)) return;
    const t = performance.now();
    if ((lastWater.get(id) ?? 0) > t - 220) return;
    lastWater.set(id, t);
    if (waterPlot(state, id)) {
      splash(root, x, y);
      if (t - lastChime > 160) {
        lastChime = t;
        chime("water");
      }
      invalidate();
    }
  };
  stage.addEventListener("pointerdown", (e) => {
    if (tool !== "water") return;
    dragging = true;
    resumeAudio();
    tryWaterAt(e.clientX, e.clientY);
  });
  window.addEventListener("pointermove", (e) => {
    if (dragging && tool === "water") tryWaterAt(e.clientX, e.clientY);
  });
  const stopDrag = (): void => {
    dragging = false;
  };
  window.addEventListener("pointerup", stopDrag);
  window.addEventListener("pointercancel", stopDrag);

  // ---------- 面板处理器 ----------
  const handlers: PanelHandlers = {
    selectSeed: (fid) => {
      sel.pendingSeed = fid;
      if (fid) {
        tool = "none";
        // 收起面板露出花圃，空圃泛绿引导点按播种
        panel = null;
      }
      invalidate();
    },
    fulfill: (uid, art) => {
      fulfillOrder(state, uid, art);
      invalidate();
    },
    cancel: (uid) => {
      cancelOrder(state, uid);
      invalidate();
    },
    addPick: (fid) => {
      const have = state.inventory[fid] ?? 0;
      const used = sel.workshopPick.filter((x) => x === fid).length;
      if (sel.workshopPick.length < 4 && used < have) sel.workshopPick.push(fid);
      invalidate();
    },
    removePick: (i) => {
      sel.workshopPick.splice(i, 1);
      invalidate();
    },
    craft: (vase) => {
      if (craft(state, vase, [...sel.workshopPick])) sel.workshopPick.length = 0;
      invalidate();
    },
    pickArt: (uid, artId) => {
      sel.orderPick.set(uid, artId);
      invalidate();
    },
    place: (id) => {
      placeDecor(state, id);
      invalidate();
    },
    theme: (t) => {
      applyTheme(state, t as DecorTheme);
      invalidate();
    },
    spirit: (id) => {
      setSpirit(state, id);
      invalidate();
    },
    close: () => {
      panel = null;
      invalidate();
    },
  };

  // ---------- Dock ----------
  interface DockSpec {
    id: string;
    glyph: string;
    label: string;
    aria: string;
    kind: "tool" | "panel" | "action";
    run: () => void;
  }
  const setTool = (t: Tool): void => {
    tool = tool === t ? "none" : t;
    if (tool !== "none") sel.pendingSeed = null;
  };
  const togglePanel = (id: PanelId): void => {
    panel = panel === id ? null : id;
  };
  const specs: DockSpec[] = [
    { id: "water", glyph: "水", label: "洒水", aria: "洒水工具，按住拖过花圃浇水", kind: "tool", run: () => setTool("water") },
    { id: "fert", glyph: "肥", label: "施肥", aria: "施肥工具，加快花期", kind: "tool", run: () => setTool("fert") },
    { id: "harvest", glyph: "收", label: "收获", aria: "收获工具，采下盛放的花", kind: "tool", run: () => setTool("harvest") },
    { id: "seed", glyph: "种", label: "花种", aria: "打开花种匣", kind: "panel", run: () => togglePanel("seed") },
    { id: "workshop", glyph: "艺", label: "花艺", aria: "打开花艺作坊", kind: "panel", run: () => togglePanel("workshop") },
    { id: "order", glyph: "单", label: "订单", aria: "打开花坊订单", kind: "panel", run: () => togglePanel("order") },
    { id: "decor", glyph: "饰", label: "装扮", aria: "打开庭院装扮", kind: "panel", run: () => togglePanel("decor") },
    { id: "spirit", glyph: "灵", label: "花灵", aria: "打开花灵栖所", kind: "panel", run: () => togglePanel("spirit") },
    { id: "bag", glyph: "囊", label: "库存", aria: "打开花材库存", kind: "panel", run: () => togglePanel("bag") },
    { id: "plot", glyph: "拓", label: "扩建", aria: "扩建一块花圃", kind: "action", run: () => unlockPlot(state) },
    { id: "mute", glyph: "音", label: "音效", aria: "开关音效", kind: "action", run: () => toggleMute() },
    {
      id: "reset",
      glyph: "归",
      label: "重整",
      aria: "清空进度重新开始",
      kind: "action",
      run: () => {
        if (confirm("确定重整山河？当前花园进度将被清空。")) {
          clearSave();
          location.reload();
        }
      },
    },
  ];
  const groups: Record<DockSpec["kind"], HTMLElement> = {
    tool: document.createElement("div"),
    panel: document.createElement("div"),
    action: document.createElement("div"),
  };
  groups.tool.className = "dock-group tools";
  groups.panel.className = "dock-group panels-g";
  groups.action.className = "dock-group system";
  dock.append(groups.tool, groups.panel, groups.action);
  const dockEls = new Map<string, HTMLButtonElement>();
  for (const s of specs) {
    const el = document.createElement("button");
    el.type = "button";
    el.className = "dock-btn";
    el.dataset.id = s.id;
    el.setAttribute("aria-label", s.aria);
    el.innerHTML = `<span class="seal" aria-hidden="true">${s.glyph}</span><span class="lbl">${s.label}</span>`;
    el.addEventListener("click", () => {
      resumeAudio();
      s.run();
      invalidate();
    });
    groups[s.kind].append(el);
    dockEls.set(s.id, el);
  }

  const updateDock = (): void => {
    const coach = coachTargetId(state);
    for (const s of specs) {
      const el = dockEls.get(s.id)!;
      const allowed = tutorialAllows(state.tutorialStep, state.tutorialDone, s.id);
      const on = s.kind === "tool" ? tool === s.id : s.kind === "panel" ? panel === s.id : false;
      el.disabled = !allowed || (s.id === "plot" && state.plots.length >= MAX_PLOTS);
      el.classList.toggle("is-on", on);
      el.classList.toggle("coach-target", coach === s.id);
      if (s.kind === "tool") el.setAttribute("aria-pressed", String(on));
      if (s.id === "plot") {
        const lbl = el.querySelector(".lbl")!;
        const text = state.plots.length >= MAX_PLOTS ? "已满" : `${80 + state.plots.length * 40}金`;
        if (lbl.textContent !== text) lbl.textContent = text;
      }
      if (s.id === "mute") {
        const seal = el.querySelector(".seal")!;
        const glyph = isMuted() ? "静" : "音";
        if (seal.textContent !== glyph) seal.textContent = glyph;
        el.setAttribute("aria-pressed", String(isMuted()));
      }
    }
  };

  // ---------- 事件总线 ----------
  onGameEvent((e) => {
    if (tutorialEventAdvances(state, e)) advanceTutorial(state);
    if (e.type === "harvest") {
      const c = garden.plotCenter(e.plotId);
      if (c) burst(root, c.x, c.y, FLOWER_MAP[e.flowerId]?.accent ?? "#f4d35e");
    }
    if (e.type === "bloom") {
      const c = garden.plotCenter(e.plotId);
      const fid = state.plots[e.plotId]?.flowerId;
      if (c) burst(root, c.x, c.y, (fid && FLOWER_MAP[fid]?.color) || "#f7cad0");
    }
    if (e.type === "levelup") {
      burst(root, window.innerWidth / 2, 90, "#c9a227");
    }
    invalidate();
  });

  // ---------- 帧渲染：只写有变化的部分 ----------
  const invSig = (): string =>
    Object.entries(state.inventory)
      .map(([k, v]) => `${k}:${v}`)
      .join(",");
  const panelSig = (): string => {
    switch (panel) {
      case null:
        return "closed";
      case "seed":
        return `s|${state.unlockedFlowers.length}|${sel.pendingSeed ?? ""}`;
      case "order":
        return `o|${state.orders.map((o) => o.uid).join(",")}|${state.arrangements.map((a) => a.id).join(",")}|${invSig()}|${[...sel.orderPick.values()].join(",")}`;
      case "workshop":
        return `w|${invSig()}|${state.arrangements.map((a) => a.id).join(",")}|${sel.workshopPick.join(",")}|${state.season}`;
      case "decor":
        return `d|${state.placedDecor.join(",")}|${state.fragments}|${state.level}`;
      case "spirit":
        return `p|${state.unlockedSpirits.join(",")}|${state.activeSpirit ?? ""}`;
      case "bag":
        return `b|${invSig()}|${state.stats.harvested}|${state.stats.ordersDone}`;
    }
  };

  let tutKeyLast = "";
  const frame = (): void => {
    if (root.dataset.season !== state.season) root.dataset.season = state.season;
    const night = isNight(state);
    const nightFlag = night ? "1" : "0";
    if (root.dataset.night !== nightFlag) {
      root.dataset.night = nightFlag;
      root.classList.toggle("is-night", night);
    }
    if (root.dataset.tool !== tool) root.dataset.tool = tool;
    sky.update(root, state);
    ambient.set(state.season, night);
    hud.update(state);
    garden.update(state, selected, sel.pendingSeed);
    updateDock();
    const sig = panelSig();
    if (panelDirty || sig !== panelSigLast) {
      renderPanel(sheets, panel, state, sel, handlers);
      panelSigLast = panelSig();
      panelDirty = false;
    }
    updatePanelTimers(sheets, state);
    const tutKey = `${state.tutorialStep}|${state.tutorialDone ? 1 : 0}`;
    if (tutKey !== tutKeyLast) {
      tutKeyLast = tutKey;
      renderTutorial(root, state, () => advanceTutorial(state));
    }
  };

  // 先出一帧铺好花圃，再补算离园收益，绽放特效才有落点
  frame();
  applyOfflineCatchUp(state);
  frame();
  startLoop(() => state, frame);
  addEventListener("beforeunload", () => flushSave(state));
  addEventListener("pagehide", () => flushSave(state));
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      flushSave(state);
      return;
    }
    applyOfflineCatchUp(state);
    invalidate();
  });
}
