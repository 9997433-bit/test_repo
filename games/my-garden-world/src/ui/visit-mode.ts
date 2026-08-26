import { FLOWER_MAP, type GrowthStage } from "../data/flowers";
import { NEIGHBOR_MAP } from "../data/neighbors";
import { emit } from "../engine/events";
import type { GameState } from "../engine/state";
import { plotArt } from "../scene/flower-art";
import {
  greetingFor,
  markAt,
  neighborGarden,
  pickLeftFor,
  visitPick,
  visitWater,
  waterLeftFor,
  type NeighborPlot,
} from "../systems/neighbors";
import { renderSideStory } from "./tutorial";

const STAGE_ZH: Record<"sprout" | "bud" | "bloom", string> = { sprout: "幼苗", bud: "含苞", bloom: "盛放" };

type VisitAction = "water" | "pick";

export interface VisitMode {
  enter(neighborId: string): void;
  /** 回自家园：结算并弹「串门小记」。 */
  exit(): void;
  isOpen(): boolean;
}

const thirsty = (p: NeighborPlot): boolean =>
  (p.stage === "sprout" || p.stage === "bud") && p.watered < p.waterNeed;

/**
 * 邻家庭院互访模式（docs/UX.md 六）：盖一层邻园在自家舞台上——
 * 顶部访客横幅（问候 + 回自家园），中间只读园圃快照，底部访客动作条。
 * 自家时间照常流动；互动痕迹记在自己的 social 存档里，Esc 即回家。
 */
export function createVisitMode(stage: HTMLElement, root: HTMLElement, state: GameState, onChange: () => void): VisitMode {
  let layer: HTMLElement | null = null;
  let neighborId = "";
  let action: VisitAction | null = null;
  /** 串门小记：本次到访浇了几瓢、借了哪些花、涨了多少友谊。 */
  let watered = 0;
  let pickedNames: string[] = [];
  let friendshipGained = 0;

  const live = document.createElement("span");
  live.className = "sr-live";
  live.setAttribute("aria-live", "polite");
  root.append(live);

  const plotLabel = (name: string, p: NeighborPlot): string => {
    const n = `${name}家花圃${p.idx + 1}`;
    if (!p.flowerId || !p.stage) return `${n}：空圃`;
    if (markAt(state, neighborId, p.idx, "pick")) return `${n}：借花笺，今日这枝已借走`;
    const flower = FLOWER_MAP[p.flowerId]?.name ?? p.flowerId;
    const extra = p.stage === "bloom" ? "，可摘" : thirsty(p) ? "，缺水" : "";
    return `${n}：${flower}，${STAGE_ZH[p.stage]}${extra}`;
  };

  const paint = (): void => {
    if (!layer) return;
    const def = NEIGHBOR_MAP[neighborId];
    if (!def) return;
    const garden = neighborGarden(state, neighborId);
    const canWater = garden.plots.some((p) => thirsty(p)) && waterLeftFor(state, neighborId) > 0;
    const canPick =
      garden.plots.some((p) => p.stage === "bloom" && !markAt(state, neighborId, p.idx, "pick")) &&
      pickLeftFor(state, neighborId) > 0;

    // 横幅问候：无事可做时换成「坐坐就好」，只看不动也成立
    const greetEl = layer.querySelector<HTMLElement>(".visit-greet")!;
    const greet = canWater || canPick ? greetingFor(state, def) : "坐坐就好，明日再来帮衬。";
    if (greetEl.textContent !== greet) greetEl.textContent = greet;

    for (const btn of layer.querySelectorAll<HTMLButtonElement>(".visit-garden .plot")) {
      const idx = Number(btn.dataset.plotId);
      const p = garden.plots[idx];
      if (!p) continue;
      const borrowed = markAt(state, neighborId, p.idx, "pick");
      const stageForArt: GrowthStage = p.flowerId && p.stage ? p.stage : "empty";
      const artKey = borrowed ? "borrowed" : `${p.flowerId ?? ""}|${stageForArt}|${p.watered}`;
      if (btn.dataset.artKey !== artKey) {
        btn.dataset.artKey = artKey;
        const art = btn.querySelector<HTMLElement>(".plot-art")!;
        art.innerHTML = borrowed
          ? `<span class="visit-note">借花笺</span>`
          : plotArt(p.flowerId ? FLOWER_MAP[p.flowerId] : undefined, stageForArt);
        const badges = btn.querySelector<HTMLElement>(".plot-badges")!;
        let pips = "";
        if (!borrowed && p.flowerId && (p.stage === "sprout" || p.stage === "bud")) {
          for (let i = 0; i < p.waterNeed; i++) pips += `<i class="drop${i < p.watered ? " full" : ""}"></i>`;
        }
        badges.innerHTML = pips;
        const nameEl = btn.querySelector<HTMLElement>(".plot-name")!;
        nameEl.textContent = borrowed
          ? "借花笺"
          : p.flowerId && p.stage
            ? `${FLOWER_MAP[p.flowerId]?.name ?? p.flowerId} · ${STAGE_ZH[p.stage]}`
            : "空圃";
      }
      btn.classList.toggle("is-ready", !borrowed && p.stage === "bloom");
      btn.classList.toggle("is-thirsty", !borrowed && thirsty(p));
      btn.classList.toggle("is-wet", !borrowed && p.watered > 0 && p.stage !== "bloom" && Boolean(p.flowerId));
      btn.classList.toggle("is-borrowed", borrowed);
      btn.disabled = !p.flowerId;
      btn.setAttribute("aria-label", plotLabel(def.name, p));
    }

    const waterBtn = layer.querySelector<HTMLButtonElement>('.visit-act[data-act="water"]')!;
    const pickBtn = layer.querySelector<HTMLButtonElement>('.visit-act[data-act="pick"]')!;
    waterBtn.disabled = !canWater;
    pickBtn.disabled = !canPick;
    if (!canWater && action === "water") action = null;
    if (!canPick && action === "pick") action = null;
    waterBtn.classList.toggle("is-on", action === "water");
    pickBtn.classList.toggle("is-on", action === "pick");
    waterBtn.setAttribute("aria-pressed", String(action === "water"));
    pickBtn.setAttribute("aria-pressed", String(action === "pick"));
    const waterNote = waterBtn.querySelector<HTMLElement>(".lbl")!;
    waterNote.textContent = canWater ? `帮浇水 ×${waterLeftFor(state, neighborId)}` : "园里水足";
    const pickNote = pickBtn.querySelector<HTMLElement>(".lbl")!;
    pickNote.textContent = canPick
      ? `摘花 ×${pickLeftFor(state, neighborId)}`
      : pickLeftFor(state, neighborId) <= 0
        ? "今日已借"
        : "花还没开";
  };

  const onPlotTap = (idx: number): void => {
    const plot = neighborGarden(state, neighborId).plots[idx];
    if (!plot?.flowerId) return;
    // 无动作时按圃况智取（同自家 smart-tap）：盛放摘之，缺水浇之
    const act: VisitAction | null = action ?? (plot.stage === "bloom" ? "pick" : thirsty(plot) ? "water" : null);
    if (act === "water") {
      const before = state.social.friendship[neighborId] ?? 0;
      if (visitWater(state, neighborId, idx)) {
        watered += 1;
        friendshipGained += (state.social.friendship[neighborId] ?? 0) - before;
        live.textContent = "浇上一瓢，友谊加一";
        onChange();
      }
    } else if (act === "pick") {
      const before = state.social.friendship[neighborId] ?? 0;
      const got = visitPick(state, neighborId, idx);
      if (got) {
        pickedNames.push(FLOWER_MAP[got]?.name ?? got);
        friendshipGained += (state.social.friendship[neighborId] ?? 0) - before;
        live.textContent = `借得一枝${FLOWER_MAP[got]?.name ?? got}`;
        // 首摘成功 → 「借花一枝」番外折
        renderSideStory(root, state, "borrow");
        onChange();
      }
    }
    paint();
  };

  const build = (): HTMLElement => {
    const def = NEIGHBOR_MAP[neighborId]!;
    const el = document.createElement("div");
    el.className = "visit-layer";
    el.setAttribute("role", "group");
    el.setAttribute("aria-label", `${def.name}家的园子`);

    const banner = document.createElement("div");
    banner.className = "visit-banner";
    banner.innerHTML = `<span class="visit-seal" aria-hidden="true">${def.seal}</span>
      <span class="visit-title"><strong>${def.name}家的园子</strong><span class="visit-greet muted"></span></span>`;
    const home = document.createElement("button");
    home.type = "button";
    home.className = "visit-home";
    home.textContent = "回自家园";
    home.setAttribute("aria-label", "回自家园子");
    home.addEventListener("click", () => api.exit());
    banner.append(home);
    el.append(banner);

    const garden = document.createElement("div");
    garden.className = "garden visit-garden";
    garden.setAttribute("role", "group");
    garden.setAttribute("aria-label", `${def.name}家的花圃`);
    for (let i = 0; i < def.plotCount; i++) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "plot";
      btn.dataset.plotId = String(i);
      btn.innerHTML = `<span class="plot-art" aria-hidden="true"></span>
        <span class="plot-badges" aria-hidden="true"></span>
        <span class="plot-meta"><span class="plot-name"></span></span>`;
      btn.addEventListener("click", () => onPlotTap(i));
      garden.append(btn);
    }
    el.append(garden);

    const acts = document.createElement("div");
    acts.className = "visit-actions";
    acts.setAttribute("role", "group");
    acts.setAttribute("aria-label", "访客动作");
    const mk = (act: VisitAction | "home", glyph: string, aria: string): HTMLButtonElement => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "dock-btn visit-act";
      b.dataset.act = act;
      b.setAttribute("aria-label", aria);
      b.innerHTML = `<span class="seal" aria-hidden="true">${glyph}</span><span class="lbl"></span>`;
      return b;
    };
    const waterBtn = mk("water", "浇", "帮浇水，点选后再点缺水的花圃");
    waterBtn.addEventListener("click", () => {
      action = action === "water" ? null : "water";
      paint();
    });
    const pickBtn = mk("pick", "摘", "摘花，点选后再点盛放的花圃");
    pickBtn.addEventListener("click", () => {
      action = action === "pick" ? null : "pick";
      paint();
    });
    const homeBtn = mk("home", "回", "回自家园子");
    homeBtn.querySelector(".lbl")!.textContent = "回家";
    homeBtn.addEventListener("click", () => api.exit());
    acts.append(waterBtn, pickBtn, homeBtn);
    el.append(acts);
    return el;
  };

  const summary = (): string => {
    const parts: string[] = [];
    if (watered > 0) parts.push(`浇了 ${watered} 瓢水`);
    if (pickedNames.length) parts.push(`借得 ${pickedNames.length} 枝${[...new Set(pickedNames)].join("、")}`);
    if (friendshipGained > 0) parts.push(`友谊 +${friendshipGained}`);
    return parts.length ? `串门小记：${parts.join("，")}` : "串门小记：坐坐就好，改日再来帮衬";
  };

  const api: VisitMode = {
    enter(id) {
      const def = NEIGHBOR_MAP[id];
      if (!def || state.level < def.unlockLevel) return;
      if (layer) api.exit();
      neighborId = id;
      action = null;
      watered = 0;
      pickedNames = [];
      friendshipGained = 0;
      layer = build();
      stage.append(layer);
      root.dataset.mode = "visit";
      live.textContent = `进入${def.name}家的园子`;
      paint();
      onChange();
    },
    exit() {
      if (!layer) return;
      layer.remove();
      layer = null;
      delete root.dataset.mode;
      emit({ type: "toast", text: summary(), tone: "ok" });
      live.textContent = "回到自家园子";
      onChange();
    },
    isOpen() {
      return layer !== null;
    },
  };
  return api;
}
