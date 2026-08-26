import { DECORATIONS } from "../data/decorations";
import type { GrowthStage } from "../data/flowers";
import type { GameState, Plot } from "../engine/state";
import { activeSpirit, freshness, isThirsty, moisture, plotFlower, plotProgress } from "../systems/garden";
import { STAGE_LABEL, blossomSpec, petalAngles, plotOrdinal } from "./blossom";
import { ensurePlotTheme } from "./plot-theme";

/** 供测试与外部脚本定位花圃按钮。 */
export const PLOT_SELECTOR = ".plot[data-plot-id]";

export function findPlotElement(root: ParentNode, plotId: number): HTMLButtonElement | null {
  return root.querySelector<HTMLButtonElement>(`.plot[data-plot-id="${plotId}"]`);
}

const GROWING: ReadonlySet<GrowthStage> = new Set<GrowthStage>(["seeded", "sprout", "bud"]);
/** 「绽放」一瞬的绽开动画时长，超过即摘掉 is-fresh，好让下次开花能重播。 */
const POP_MS = 800;

interface PlotTag {
  kind: string;
  text: string;
}

interface PlotNode {
  el: HTMLButtonElement;
  blossom: HTMLElement;
  pips: HTMLElement;
  tags: HTMLElement;
  name: HTMLElement;
  stage: HTMLElement;
  bar: HTMLElement;
  petalCount: number;
  pipCount: number;
  tagSig: string;
  lastStage: GrowthStage;
  freshUntil: number;
}

interface GardenView {
  decor: HTMLElement;
  decorSig: string;
  grid: HTMLElement;
  nodes: Map<number, PlotNode>;
  pick: (id: number) => void;
}

const VIEWS = new WeakMap<HTMLElement, GardenView>();

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  node.className = className;
  return node;
}

function setAttr(node: Element, name: string, value: string): void {
  if (node.getAttribute(name) !== value) node.setAttribute(name, value);
}

function setText(node: Node, text: string): void {
  if (node.textContent !== text) node.textContent = text;
}

function setVar(node: HTMLElement, name: string, value: string): void {
  if (node.style.getPropertyValue(name) !== value) node.style.setProperty(name, value);
}

function createView(root: HTMLElement): GardenView {
  const decor = el("div", "decor-row");
  const grid = el("div", "garden");
  root.replaceChildren(decor, grid);
  return { decor, decorSig: "\u0000", grid, nodes: new Map(), pick: () => {} };
}

function createPlotNode(view: GardenView, plotId: number): PlotNode {
  const button = el("button", "plot");
  button.type = "button";
  button.dataset.plotId = String(plotId);
  button.addEventListener("click", () => view.pick(plotId));

  const soil = el("div", "plot-soil");
  soil.setAttribute("aria-hidden", "true");
  soil.append(el("i", "plot-damp"), el("i", "plot-crack"));

  const glow = el("i", "plot-glow");
  glow.setAttribute("aria-hidden", "true");

  const plant = el("div", "plot-plant");
  plant.setAttribute("aria-hidden", "true");
  const blossom = el("div", "plot-blossom");
  blossom.dataset.plotBlossom = String(plotId);
  plant.append(el("i", "plot-stem"), el("i", "plot-leaf is-left"), el("i", "plot-leaf is-right"), el("i", "plot-seed"), blossom);

  const pips = el("div", "plot-pips");
  pips.dataset.plotPips = String(plotId);
  pips.setAttribute("aria-hidden", "true");

  const tags = el("div", "plot-tags");
  tags.setAttribute("aria-hidden", "true");

  const hint = el("div", "plot-empty-hint");
  hint.setAttribute("aria-hidden", "true");
  hint.textContent = "空圃";

  const meta = el("div", "meta");
  const caption = el("div", "plot-caption");
  const name = el("span", "plot-name");
  const stage = el("span", "plot-stage");
  caption.append(name, stage);
  const barWrap = el("div", "bar");
  const bar = document.createElement("i");
  barWrap.append(bar);
  meta.append(caption, barWrap);

  button.append(soil, glow, plant, pips, tags, hint, meta);

  return {
    el: button,
    blossom,
    pips,
    tags,
    name,
    stage,
    bar,
    petalCount: -1,
    pipCount: -1,
    tagSig: "\u0000",
    lastStage: "empty",
    freshUntil: 0,
  };
}

function syncPetals(node: PlotNode, petals: number): void {
  if (node.petalCount === petals) return;
  node.petalCount = petals;
  node.blossom.replaceChildren();
  for (const angle of petalAngles(petals)) {
    const petal = el("i", "plot-petal");
    petal.style.setProperty("--a", `${angle}deg`);
    node.blossom.append(petal);
  }
  if (petals > 0) node.blossom.append(el("i", "plot-core"), el("i", "plot-calyx"));
}

function syncPips(node: PlotNode, need: number, filled: number): void {
  if (node.pipCount !== need) {
    node.pipCount = need;
    node.pips.replaceChildren();
    for (let i = 0; i < need; i += 1) node.pips.append(el("i", "plot-pip"));
  }
  const pips = node.pips.children;
  for (let i = 0; i < pips.length; i += 1) {
    const pip = pips[i];
    if (pip) setAttr(pip, "data-wet", i < filled ? "1" : "0");
  }
}

function syncTags(node: PlotNode, tags: PlotTag[]): void {
  const sig = tags.map((t) => `${t.kind}:${t.text}`).join("|");
  if (node.tagSig === sig) return;
  node.tagSig = sig;
  node.tags.replaceChildren();
  for (const tag of tags) {
    const chip = el("span", "plot-tag");
    chip.dataset.kind = tag.kind;
    chip.textContent = tag.text;
    node.tags.append(chip);
  }
}

function syncPop(node: PlotNode, stage: GrowthStage, now: number): void {
  if (node.lastStage !== stage) {
    node.lastStage = stage;
    node.el.classList.remove("is-fresh");
    if (stage === "bloom") {
      void node.el.offsetWidth;
      node.el.classList.add("is-fresh");
      node.freshUntil = now + POP_MS;
    } else {
      node.freshUntil = 0;
    }
    return;
  }
  if (node.freshUntil > 0 && now >= node.freshUntil) {
    node.freshUntil = 0;
    node.el.classList.remove("is-fresh");
  }
}

function syncPlot(node: PlotNode, state: GameState, plot: Plot, selected: boolean): void {
  const def = plotFlower(plot);
  const spec = blossomSpec(def, plot.id);
  const need = def?.waterNeed ?? 0;
  const filled = Math.max(0, Math.min(need, plot.watered));
  const thirsty = isThirsty(plot);
  const growing = GROWING.has(plot.stage);
  const guarded = activeSpirit(state)?.wiltGuard === true;
  const button = node.el;

  setAttr(button, "data-stage", plot.stage);
  setAttr(button, "data-flower", def?.id ?? "");
  setAttr(button, "data-rarity", def ? String(def.rarity) : "0");
  setAttr(button, "data-thirsty", thirsty ? "1" : "0");
  setAttr(button, "data-fertilized", plot.fertilized ? "1" : "0");
  setAttr(button, "data-selected", selected ? "1" : "0");
  setAttr(button, "data-watered", String(plot.watered));
  setAttr(button, "data-water-need", String(need));
  setAttr(button, "aria-pressed", selected ? "true" : "false");
  button.classList.toggle("is-selected", selected);

  setVar(button, "--bloom", spec.bloom);
  setVar(button, "--accent", spec.accent);
  setVar(button, "--leaf", spec.leaf);
  setVar(button, "--tilt", `${spec.tiltDeg}deg`);
  setVar(button, "--phase", `${spec.phaseSec}s`);
  setVar(button, "--damp", moisture(plot).toFixed(2));

  syncPetals(node, spec.petals);
  syncPips(node, need, filled);

  const tags: PlotTag[] = [];
  if (plot.stage === "bloom") tags.push({ kind: "ready", text: "可收" });
  if (plot.stage === "wilt") tags.push({ kind: "wilt", text: "凋残" });
  if (thirsty) tags.push({ kind: "dry", text: "缺水" });
  if (plot.fertilized && plot.stage !== "empty") tags.push({ kind: "fert", text: "肥" });
  syncTags(node, tags);

  const stageLabel = STAGE_LABEL[plot.stage];
  setText(node.name, def?.name ?? "空圃");

  let detail = stageLabel;
  let pct = 0;
  let tone = "grow";
  if (plot.stage === "bloom") {
    const fresh = freshness(state, plot);
    detail = guarded ? `${stageLabel} · 长开` : `${stageLabel} · 花期 ${Math.round(fresh * 100)}%`;
    pct = guarded ? 100 : Math.round(fresh * 100);
    tone = "fresh";
  } else if (plot.stage === "wilt") {
    detail = `${stageLabel} · 速收`;
    pct = 100;
    tone = "dead";
  } else if (growing) {
    detail = `${stageLabel} · 水 ${filled}/${need}`;
    pct = Math.round(plotProgress(state, plot) * 100);
  } else {
    detail = "待播种";
  }
  setText(node.stage, detail);
  setVar(node.bar, "width", `${pct}%`);
  setAttr(node.bar, "data-tone", tone);

  const label = [plotOrdinal(plot.id), def?.name ?? "空圃", plot.stage === "empty" ? "待播种" : stageLabel];
  if (def && growing) label.push(`水 ${filled}/${need}`);
  if (plot.fertilized && plot.stage !== "empty") label.push("已施肥");
  if (plot.stage === "bloom") label.push("可收获");
  if (plot.stage === "wilt") label.push("已凋残");
  const text = label.join(" · ");
  setAttr(button, "aria-label", text);
  setAttr(button, "title", text);

  syncPop(node, plot.stage, state.now);
}

function syncDecor(view: GardenView, state: GameState): void {
  const sig = state.placedDecor.join("|");
  if (view.decorSig === sig) return;
  view.decorSig = sig;
  view.decor.replaceChildren();
  for (const id of state.placedDecor) {
    const def = DECORATIONS.find((d) => d.id === id);
    const chip = el("span", "decor-chip");
    chip.dataset.decorId = id;
    chip.textContent = def ? `${def.glyph} ${def.name}` : id;
    view.decor.append(chip);
  }
}

export function renderGarden(root: HTMLElement, state: GameState, selected: number | null, onPick: (id: number) => void): void {
  ensurePlotTheme(root.ownerDocument ?? document);

  let view = VIEWS.get(root);
  if (!view || view.grid.parentNode !== root || view.decor.parentNode !== root) {
    view = createView(root);
    VIEWS.set(root, view);
  }
  view.pick = onPick;

  syncDecor(view, state);

  for (let i = 0; i < state.plots.length; i += 1) {
    const plot = state.plots[i];
    if (!plot) continue;
    let node = view.nodes.get(plot.id);
    if (!node) {
      node = createPlotNode(view, plot.id);
      view.nodes.set(plot.id, node);
    }
    if (view.grid.children[i] !== node.el) view.grid.insertBefore(node.el, view.grid.children[i] ?? null);
    syncPlot(node, state, plot, selected === plot.id);
  }

  while (view.grid.children.length > state.plots.length) {
    const extra = view.grid.lastElementChild;
    if (!(extra instanceof HTMLElement)) break;
    const id = Number(extra.dataset.plotId);
    if (Number.isFinite(id)) view.nodes.delete(id);
    extra.remove();
  }
}
