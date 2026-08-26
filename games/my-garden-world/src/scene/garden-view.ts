import { FLOWER_MAP, type GrowthStage } from "../data/flowers";
import type { GameState, Plot } from "../engine/state";
import { resolvePlacedDecor } from "../systems/decorate";
import { plotProgress } from "../systems/garden";
import { createDecorLayer } from "./decor-layer";
import { plotArt } from "./flower-art";

const STAGE_ZH: Record<GrowthStage, string> = {
  empty: "空圃",
  seeded: "播种",
  sprout: "幼苗",
  bud: "含苞",
  bloom: "盛放",
  wilt: "枯萎",
};

interface Cell {
  el: HTMLButtonElement;
  art: HTMLElement;
  badges: HTMLElement;
  name: HTMLElement;
  bar: HTMLElement;
  fill: HTMLElement;
  artKey: string;
  badgeKey: string;
  nameKey: string;
  label: string;
  pct: number;
  cls: string;
}

export interface GardenView {
  update(state: GameState, selected: number | null, pendingSeed: string | null): void;
  plotCenter(plotId: number): { x: number; y: number } | null;
}

function needsWater(plot: Plot): boolean {
  const def = plot.flowerId ? FLOWER_MAP[plot.flowerId] : undefined;
  if (!def) return false;
  return (plot.stage === "seeded" || plot.stage === "sprout" || plot.stage === "bud") && plot.watered < def.waterNeed;
}

/** 增量花园视图：节点常驻，每帧只写有变化的属性；SVG 仅在阶段切换时重建。 */
export function createGardenView(root: HTMLElement, onPick: (id: number) => void): GardenView {
  root.replaceChildren();
  const decor = createDecorLayer();
  const grid = document.createElement("div");
  grid.className = "garden";
  grid.setAttribute("role", "group");
  grid.setAttribute("aria-label", "花园地块");
  // 景物层在 DOM 中先于花圃，绝对定位仍绘于其下，且不吃指针事件。
  root.append(decor.row, decor.scene, grid);

  const cells = new Map<number, Cell>();
  let decorKey = "";

  const makeCell = (plot: Plot): Cell => {
    const el = document.createElement("button");
    el.type = "button";
    el.className = "plot";
    el.dataset.plotId = String(plot.id);
    const art = document.createElement("span");
    art.className = "plot-art";
    art.setAttribute("aria-hidden", "true");
    const badges = document.createElement("span");
    badges.className = "plot-badges";
    badges.setAttribute("aria-hidden", "true");
    const meta = document.createElement("span");
    meta.className = "plot-meta";
    const name = document.createElement("span");
    name.className = "plot-name";
    const bar = document.createElement("span");
    bar.className = "plot-bar";
    const fill = document.createElement("i");
    bar.append(fill);
    meta.append(name, bar);
    el.append(art, badges, meta);
    el.addEventListener("click", () => onPick(plot.id));
    grid.append(el);
    const cell: Cell = { el, art, badges, name, bar, fill, artKey: "", badgeKey: "", nameKey: "", label: "", pct: -1, cls: "" };
    cells.set(plot.id, cell);
    return cell;
  };

  const update = (state: GameState, selected: number | null, pendingSeed: string | null): void => {
    const dk = `${state.placedDecor.join(",")}|${Object.entries(state.decorAnchors)
      .map(([d, a]) => `${d}:${a}`)
      .join(",")}`;
    if (dk !== decorKey) {
      decorKey = dk;
      decor.update(resolvePlacedDecor(state));
    }

    for (const plot of state.plots) {
      const cell = cells.get(plot.id) ?? makeCell(plot);
      const def = plot.flowerId ? FLOWER_MAP[plot.flowerId] : undefined;
      const growing = plot.stage !== "empty" && plot.stage !== "bloom" && plot.stage !== "wilt";
      const thirsty = needsWater(plot);
      const pct = plot.stage === "empty" ? 0 : Math.round(plotProgress(state, plot) * 100);

      const artKey = `${plot.flowerId ?? ""}|${plot.stage}`;
      if (artKey !== cell.artKey) {
        cell.artKey = artKey;
        cell.art.innerHTML = plotArt(def, plot.stage);
        cell.art.classList.remove("pop");
        void cell.art.offsetWidth;
        cell.art.classList.add("pop");
      }

      const badgeKey = `${plot.watered}/${def?.waterNeed ?? 0}|${plot.fertilized ? 1 : 0}|${plot.stage}`;
      if (badgeKey !== cell.badgeKey) {
        cell.badgeKey = badgeKey;
        let html = "";
        if (def && growing) {
          for (let i = 0; i < def.waterNeed; i++) {
            html += `<i class="drop${i < plot.watered ? " full" : ""}"></i>`;
          }
        }
        if (plot.fertilized && plot.stage !== "wilt") html += `<i class="fert-star">✦</i>`;
        cell.badges.innerHTML = html;
      }

      const nameKey = `${def?.name ?? "空圃"} · ${STAGE_ZH[plot.stage]}`;
      if (nameKey !== cell.nameKey) {
        cell.nameKey = nameKey;
        cell.name.textContent = plot.stage === "empty" ? "空圃" : nameKey;
      }

      if (pct !== cell.pct) {
        cell.pct = pct;
        cell.fill.style.width = `${growing ? pct : plot.stage === "bloom" ? 100 : 0}%`;
      }

      const cls = [
        "plot",
        selected === plot.id ? "is-selected" : "",
        plot.stage === "bloom" ? "is-ready" : "",
        plot.stage === "wilt" ? "is-wilt" : "",
        thirsty ? "is-thirsty" : "",
        plot.stage === "empty" && pendingSeed ? "is-plantable" : "",
        plot.watered > 0 && growing ? "is-wet" : "",
      ]
        .filter(Boolean)
        .join(" ");
      if (cls !== cell.cls) {
        cell.cls = cls;
        cell.el.className = cls;
      }

      const status =
        plot.stage === "empty"
          ? pendingSeed
            ? "空圃，点击播种"
            : "空圃"
          : `${def?.name ?? ""}，${STAGE_ZH[plot.stage]}${growing ? `，进度百分之${pct}${thirsty ? "，缺水" : ""}` : ""}${plot.stage === "bloom" ? "，可收获" : ""}`;
      const label = `花圃${plot.id + 1}：${status}`;
      if (label !== cell.label) {
        cell.label = label;
        cell.el.setAttribute("aria-label", label);
      }
    }
  };

  const plotCenter = (plotId: number): { x: number; y: number } | null => {
    const cell = cells.get(plotId);
    if (!cell) return null;
    const r = cell.el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height * 0.45 };
  };

  return { update, plotCenter };
}
