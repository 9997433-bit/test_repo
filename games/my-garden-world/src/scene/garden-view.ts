import { FLOWER_MAP } from "../data/flowers";
import type { GameState } from "../engine/state";
import { plotProgress } from "../systems/garden";
import { DECORATIONS } from "../data/decorations";

const GLYPH: Record<string, string> = {
  empty: "土",
  seeded: "·",
  sprout: "芽",
  bud: "蕾",
  bloom: "花",
  wilt: "残",
};

export function renderGarden(root: HTMLElement, state: GameState, selected: number | null, onPick: (id: number) => void): void {
  root.replaceChildren();
  const decor = document.createElement("div");
  decor.className = "decor-row";
  for (const id of state.placedDecor) {
    const d = DECORATIONS.find((x) => x.id === id);
    const chip = document.createElement("span");
    chip.className = "decor-chip";
    chip.textContent = d ? `${d.glyph} ${d.name}` : id;
    decor.append(chip);
  }
  root.append(decor);

  const grid = document.createElement("div");
  grid.className = "garden";
  for (const plot of state.plots) {
    const el = document.createElement("button");
    el.type = "button";
    el.className = `plot${selected === plot.id ? " is-selected" : ""}`;
    const def = plot.flowerId ? FLOWER_MAP[plot.flowerId] : undefined;
    const face = document.createElement("div");
    face.className = plot.stage === "bloom" ? "bloom" : "sprout";
    face.textContent = plot.stage === "bloom" && def ? "❀" : (GLYPH[plot.stage] ?? "土");
    face.style.color = def?.accent ?? "#cbb79a";
    const meta = document.createElement("div");
    meta.className = "meta";
    const pct = Math.round(plotProgress(state, plot) * 100);
    meta.innerHTML = `${def?.name ?? "空圃"} · ${plot.stage}<div class="bar"><i style="width:${plot.stage === "empty" ? 0 : pct}%"></i></div>`;
    el.append(face, meta);
    el.addEventListener("click", () => onPick(plot.id));
    grid.append(el);
  }
  root.append(grid);
}
