import { FLOWERS, FLOWER_MAP, type GrowthStage } from "../data/flowers";
import { emit } from "../engine/events";
import { plotArt } from "./flower-art";

/**
 * 邻家花园场景：程序化生成的只读快照 + 可玩的串门交互（帮浇水 / 摘花 / 回家）。
 *
 * 生成是纯函数（`generatePlots`），同一 seed 必得同一座园子——当日重进不变样；
 * 视图只管画与点，互动结果经回调交回上层落到自家存档，场景层不碰 GameState。
 */

export interface NeighborPlot {
  idx: number;
  flowerId: string | null;
  stage: GrowthStage;
  watered: number;
  waterNeed: number;
  /** 当日痕迹：帮浇过 / 借走过一枝 */
  helped: boolean;
  borrowed: boolean;
}

const STAGE_ZH: Record<GrowthStage, string> = {
  empty: "空圃",
  seeded: "播种",
  sprout: "幼苗",
  bud: "含苞",
  bloom: "盛放",
  wilt: "枯萎",
};

/** 邻家不种稀客：四阶以内的常见花，串门借得回来的都用得上。 */
const DEFAULT_POOL = FLOWERS.filter((f) => f.rarity <= 3).map((f) => f.id);
const GROWING: GrowthStage[] = ["seeded", "sprout", "bud"];

function hashSeed(seed: string | number): number {
  const text = String(seed);
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** mulberry32：小而稳的确定性伪随机，同 seed 同序列。 */
function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function waterNeedOf(flowerId: string | null): number {
  return flowerId ? (FLOWER_MAP[flowerId]?.waterNeed ?? 1) : 0;
}

function plant(plot: NeighborPlot, flowerId: string, stage: GrowthStage, watered: number): void {
  plot.flowerId = flowerId;
  plot.stage = stage;
  plot.waterNeed = waterNeedOf(flowerId);
  plot.watered = Math.max(0, Math.min(watered, plot.waterNeed));
}

/**
 * 按种子生成一座邻家花园：4–8 块圃。
 *
 * 保底（同教程保底订单的思路，串门必有事可做）：
 * 至少两块有花、至少一块盛放可摘、至少一块缺水可浇。
 */
export function generatePlots(seed: string | number, pool: string[] = DEFAULT_POOL): NeighborPlot[] {
  const ids = pool.length ? pool : DEFAULT_POOL;
  const rand = rng(hashSeed(seed));
  const count = 4 + Math.floor(rand() * 5);
  const plots: NeighborPlot[] = [];
  for (let idx = 0; idx < count; idx++) {
    const plot: NeighborPlot = {
      idx,
      flowerId: null,
      stage: "empty",
      watered: 0,
      waterNeed: 0,
      helped: false,
      borrowed: false,
    };
    if (rand() > 0.28) {
      const flowerId = ids[Math.floor(rand() * ids.length)] ?? ids[0] ?? "daisy";
      const need = waterNeedOf(flowerId);
      const stage = rand() > 0.45 ? (GROWING[Math.floor(rand() * GROWING.length)] ?? "sprout") : "bloom";
      plant(plot, flowerId, stage, stage === "bloom" ? need : Math.floor(rand() * (need + 1)));
    }
    plots.push(plot);
  }

  const sow = (plot: NeighborPlot | undefined, stage: GrowthStage, watered: number): void => {
    if (!plot) return;
    const flowerId = plot.flowerId ?? ids[Math.floor(rand() * ids.length)] ?? "daisy";
    plant(plot, flowerId, stage, watered);
  };

  // 保底一：至少两块有花
  while (plots.filter((p) => p.flowerId).length < 2) {
    const empty = plots.find((p) => !p.flowerId);
    if (!empty) break;
    sow(empty, "sprout", 0);
  }
  // 保底二：至少一块盛放（可摘）
  let bloom = plots.find((p) => p.stage === "bloom");
  if (!bloom) {
    bloom = plots.find((p) => p.flowerId) ?? plots[0];
    sow(bloom, "bloom", Number.MAX_SAFE_INTEGER);
  }
  // 保底三：至少一块缺水（可浇），且不动那块唯一的盛放花
  if (!plots.some(canWater)) {
    sow(plots.find((p) => p !== bloom && p.flowerId) ?? plots.find((p) => p !== bloom), "bud", 0);
  }
  return plots;
}

/**
 * 外部当日快照的粗粒度花圃（社交系统的存档形态）：
 * `stage` 只认「空/生长/盛放」也行，`watered` 给布尔即当已浇满。
 */
export interface NeighborSnapshotPlot {
  idx: number;
  flowerId: string | null;
  stage: string;
  thirsty?: boolean;
  watered?: boolean | number;
  picked?: boolean;
}

/** 把外部快照摊成场景要画的花圃：水滴数按花种补齐，痕迹原样带过来。 */
export function fromSnapshot(plots: readonly NeighborSnapshotPlot[]): NeighborPlot[] {
  return plots.map((p) => {
    const flowerId = p.stage === "empty" ? null : p.flowerId;
    const waterNeed = waterNeedOf(flowerId);
    const stage: GrowthStage = flowerId === null ? "empty" : p.stage === "bloom" ? "bloom" : "bud";
    const watered =
      typeof p.watered === "number"
        ? Math.max(0, Math.min(p.watered, waterNeed))
        : p.watered || p.thirsty === false
          ? waterNeed
          : 0;
    return {
      idx: p.idx,
      flowerId,
      stage,
      waterNeed,
      watered: stage === "bloom" ? waterNeed : watered,
      helped: p.watered === true,
      borrowed: p.picked === true,
    };
  });
}

export function canWater(plot: NeighborPlot): boolean {
  return plot.flowerId !== null && GROWING.includes(plot.stage) && plot.watered < plot.waterNeed;
}

export function canPick(plot: NeighborPlot): boolean {
  return plot.flowerId !== null && plot.stage === "bloom" && !plot.borrowed;
}

export type VisitAction = "water" | "pick";

export interface VisitSummary {
  neighbor: string;
  watered: number;
  /** 借得的花种 id，按摘取顺序 */
  picked: string[];
  friendship: number;
}

export interface NeighborViewOptions {
  /** 邻居名号，如「阿姊」 */
  name: string;
  seed: string | number;
  greeting?: string;
  /** 直接给定园子（读自当日快照）；不给则按 seed 生成 */
  plots?: NeighborPlot[];
  /** 今日剩余帮浇次数 / 摘花枝数 */
  waterLeft?: number;
  pickLeft?: number;
  /** 返回 false 表示上层拒绝这次互动（余量耗尽等），视图不改快照 */
  onWater?(plot: NeighborPlot): boolean;
  onPick?(plot: NeighborPlot): boolean;
  onLeave?(summary: VisitSummary): void;
}

export interface NeighborView {
  el: HTMLElement;
  plots: NeighborPlot[];
  summary(): VisitSummary;
  /** 当前动作（帮浇水 / 摘花） */
  action(): VisitAction;
  setAction(action: VisitAction): void;
  leave(): void;
}

const STYLE_ID = "neighbor-scene-style";

const CSS = `
.neighbor { position: absolute; inset: 0; z-index: 4; display: flex; flex-direction: column; gap: 8px;
  padding: 6px 16px 10px; background: var(--surface, #f6ecd8);
  background-image: radial-gradient(120% 80% at 50% 0%, rgba(255, 248, 232, .9), transparent 70%);
  animation: neighbor-scroll .3s ease; }
@keyframes neighbor-scroll { from { opacity: 0; transform: translateX(6%); } }
.neighbor-banner { display: flex; align-items: center; gap: 10px; flex: none;
  font-family: var(--font-display, serif); }
.neighbor-banner .n-seal { width: 34px; height: 34px; flex: none; border-radius: 8px; display: grid;
  place-items: center; font-size: 19px; color: #fff8e8; background: var(--vermilion, #b8442f); }
.neighbor-banner .n-line { font-size: 12px; opacity: .75; }
.neighbor-home { margin-left: auto; flex: none; cursor: pointer; border-radius: 999px; padding: 5px 12px;
  font-family: var(--font-display, serif); font-size: 12px; color: var(--text-soft, #4a3a2a);
  background: var(--surface-hi, #fbf3e2); border: 1px solid var(--line-strong, rgba(90, 70, 45, .5)); }
.neighbor-plots { flex: 1 1 auto; display: grid; gap: 12px; min-height: 0;
  grid-template-columns: repeat(auto-fit, minmax(112px, 1fr)); }
.n-plot { position: relative; display: flex; flex-direction: column; align-items: center; justify-content: flex-end;
  gap: 4px; padding: 6px; cursor: pointer; border-radius: 12px; color: inherit;
  background: linear-gradient(180deg, rgba(122, 90, 58, .16), rgba(60, 42, 22, .3));
  border: 1px solid rgba(90, 70, 45, .35); transition: transform .16s ease, box-shadow .2s ease; }
.n-plot:disabled { cursor: default; opacity: .72; }
.n-plot:not(:disabled):hover { transform: translateY(-2px); }
.n-plot .n-art { width: 100%; }
.n-plot .n-art svg { display: block; width: 100%; height: auto; }
.n-plot .n-name { font-size: 11px; font-family: var(--font-display, serif); }
.n-plot .n-drops { display: flex; gap: 3px; }
.n-plot .n-drops i { width: 6px; height: 6px; border-radius: 50%; background: rgba(255, 255, 255, .35); }
.n-plot .n-drops i.full { background: #8fc3d4; }
.n-plot.can-act { box-shadow: 0 0 0 2px rgba(95, 143, 87, .75); }
.n-plot.can-pick { box-shadow: 0 0 0 2px rgba(244, 211, 94, .9); }
.n-plot .n-note { position: absolute; top: 6px; left: 50%; transform: translateX(-50%) rotate(-4deg);
  font-size: 10px; padding: 2px 6px; border-radius: 3px; background: #f4ead2; color: #6b4b2a;
  border: 1px solid rgba(107, 75, 42, .4); }
.neighbor-bar { flex: none; display: flex; gap: 10px; align-items: center; justify-content: center; }
.n-act { cursor: pointer; border-radius: 999px; padding: 6px 14px; font-family: var(--font-display, serif);
  font-size: 13px; color: var(--text-soft, #4a3a2a); background: var(--surface-hi, #fbf3e2);
  border: 1px solid var(--line-strong, rgba(90, 70, 45, .5)); }
.n-act.is-on { background: var(--vermilion, #b8442f); color: #fff8e8; border-color: transparent; }
.n-act:disabled { opacity: .5; cursor: default; }
.n-tally { font-size: 12px; opacity: .8; }
@media (prefers-reduced-motion: reduce) { .neighbor { animation: none; } }
`;

function ensureStyles(): void {
  if (typeof document === "undefined" || document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = CSS;
  document.head.append(style);
}

/** 串门去：把邻家庭院挂进 host，回家时自行摘下并交回小结。 */
export function createNeighborView(host: HTMLElement, opts: NeighborViewOptions): NeighborView {
  ensureStyles();
  const plots = opts.plots ?? generatePlots(opts.seed);
  const summary: VisitSummary = { neighbor: opts.name, watered: 0, picked: [], friendship: 0 };
  let waterLeft = opts.waterLeft ?? 3;
  let pickLeft = opts.pickLeft ?? 1;
  let action: VisitAction = "water";
  let gone = false;

  const el = document.createElement("section");
  el.className = "neighbor";
  el.setAttribute("aria-label", `${opts.name}家的园子`);

  const banner = document.createElement("div");
  banner.className = "neighbor-banner";
  const home = document.createElement("button");
  home.type = "button";
  home.className = "neighbor-home";
  home.textContent = "回自家园";
  home.setAttribute("aria-label", "回自家园子");
  const greeting = document.createElement("span");
  greeting.className = "n-line";
  banner.innerHTML =
    `<span class="n-seal" aria-hidden="true">邻</span>` +
    `<span><strong>${opts.name}家的园子</strong></span>`;
  greeting.textContent = opts.greeting ?? "坐坐就好，缺水的浇一浇，开着的摘一枝。";
  banner.append(greeting, home);

  const grid = document.createElement("div");
  grid.className = "neighbor-plots";
  grid.setAttribute("role", "group");
  grid.setAttribute("aria-label", `${opts.name}家花圃`);

  const bar = document.createElement("div");
  bar.className = "neighbor-bar";
  const waterBtn = document.createElement("button");
  waterBtn.type = "button";
  waterBtn.className = "n-act";
  waterBtn.textContent = "帮浇水";
  const pickBtn = document.createElement("button");
  pickBtn.type = "button";
  pickBtn.className = "n-act";
  pickBtn.textContent = "摘花";
  const leaveBtn = document.createElement("button");
  leaveBtn.type = "button";
  leaveBtn.className = "n-act";
  leaveBtn.textContent = "回家";
  const tally = document.createElement("span");
  tally.className = "n-tally";
  tally.setAttribute("aria-live", "polite");
  bar.append(waterBtn, pickBtn, leaveBtn, tally);

  el.append(banner, grid, bar);
  host.append(el);

  const cells = new Map<number, HTMLButtonElement>();

  const paint = (): void => {
    const anyWater = plots.some(canWater);
    const anyPick = plots.some(canPick);
    waterBtn.disabled = !anyWater || waterLeft <= 0;
    pickBtn.disabled = !anyPick || pickLeft <= 0;
    waterBtn.classList.toggle("is-on", action === "water" && !waterBtn.disabled);
    pickBtn.classList.toggle("is-on", action === "pick" && !pickBtn.disabled);
    waterBtn.setAttribute("aria-pressed", String(action === "water"));
    pickBtn.setAttribute("aria-pressed", String(action === "pick"));
    waterBtn.setAttribute(
      "aria-label",
      !anyWater ? `${opts.name}园里今日水足` : `帮浇水，今日还可浇 ${waterLeft} 次`,
    );
    pickBtn.setAttribute("aria-label", !anyPick ? "花还没开，改日再摘" : `摘花，今日还可摘 ${pickLeft} 枝`);
    tally.textContent =
      summary.watered === 0 && summary.picked.length === 0
        ? `可浇 ${waterLeft} · 可摘 ${pickLeft}`
        : `浇了 ${summary.watered} 瓢 · 借得 ${summary.picked.length} 枝`;

    for (const plot of plots) {
      const cell = cells.get(plot.idx);
      if (!cell) continue;
      const def = plot.flowerId ? FLOWER_MAP[plot.flowerId] : undefined;
      const actionable = action === "water" ? canWater(plot) && waterLeft > 0 : canPick(plot) && pickLeft > 0;
      cell.className = `n-plot${actionable ? (action === "pick" ? " can-pick" : " can-act") : ""}`;
      // 空圃无事可做；其余照点不误——点了不生效也要有一声回应（见 UX 六·6.6）
      cell.disabled = plot.flowerId === null;
      const art = cell.querySelector(".n-art");
      if (art) art.innerHTML = plotArt(def, plot.stage);
      const name = cell.querySelector(".n-name");
      if (name) name.textContent = plot.flowerId ? `${def?.name ?? plot.flowerId} · ${STAGE_ZH[plot.stage]}` : "空圃";
      const drops = cell.querySelector(".n-drops");
      if (drops) {
        let html = "";
        for (let i = 0; i < plot.waterNeed; i++) html += `<i class="${i < plot.watered ? "full" : ""}"></i>`;
        drops.innerHTML = plot.stage === "bloom" || !plot.flowerId ? "" : html;
      }
      const note = cell.querySelector(".n-note");
      if (note) {
        note.textContent = plot.borrowed ? "借花笺" : plot.helped ? "已浇" : "";
        (note as HTMLElement).hidden = !plot.borrowed && !plot.helped;
      }
      cell.setAttribute(
        "aria-label",
        `${opts.name}家花圃${plot.idx + 1}：${
          plot.flowerId
            ? `${def?.name ?? plot.flowerId}，${STAGE_ZH[plot.stage]}${canPick(plot) ? "，可摘" : canWater(plot) ? "，缺水" : ""}`
            : "空圃"
        }`,
      );
    }
  };

  const water = (plot: NeighborPlot): void => {
    if (!canWater(plot)) {
      emit({ type: "toast", text: "这圃不缺水", tone: "warn" });
      return;
    }
    if (waterLeft <= 0) {
      emit({ type: "toast", text: "今日帮浇的水够了，留点明日", tone: "warn" });
      return;
    }
    if (opts.onWater && !opts.onWater(plot)) return;
    plot.watered = plot.waterNeed;
    plot.helped = true;
    waterLeft -= 1;
    summary.watered += 1;
    summary.friendship += 1;
    paint();
  };

  const borrow = (plot: NeighborPlot): void => {
    if (!canPick(plot)) {
      emit({ type: "toast", text: "花未开，摘不得", tone: "warn" });
      return;
    }
    if (pickLeft <= 0) {
      emit({ type: "toast", text: "一家只借一枝，去别家看看", tone: "warn" });
      return;
    }
    if (opts.onPick && !opts.onPick(plot)) return;
    const flowerId = plot.flowerId;
    plot.borrowed = true;
    plot.stage = "empty";
    plot.watered = 0;
    pickLeft -= 1;
    if (flowerId) summary.picked.push(flowerId);
    summary.friendship += 1;
    if (action === "pick" && (pickLeft <= 0 || !plots.some(canPick))) action = "water";
    paint();
  };

  for (const plot of plots) {
    const cell = document.createElement("button");
    cell.type = "button";
    cell.className = "n-plot";
    cell.dataset.plotIdx = String(plot.idx);
    cell.innerHTML =
      `<span class="n-note" hidden></span>` +
      `<span class="n-art" aria-hidden="true"></span>` +
      `<span class="n-drops" aria-hidden="true"></span>` +
      `<span class="n-name"></span>`;
    cell.addEventListener("click", () => (action === "water" ? water(plot) : borrow(plot)));
    cells.set(plot.idx, cell);
    grid.append(cell);
  }

  const leave = (): void => {
    if (gone) return;
    gone = true;
    document.removeEventListener("keydown", onKey);
    el.remove();
    emit({
      type: "toast",
      text:
        summary.watered === 0 && summary.picked.length === 0
          ? `${opts.name}家坐了坐，明日再来帮衬`
          : `串门小记：浇了 ${summary.watered} 瓢水，借得 ${summary.picked.length} 枝，友谊 +${summary.friendship}`,
      tone: "ok",
    });
    opts.onLeave?.(summary);
  };

  function onKey(e: KeyboardEvent): void {
    if (e.key === "Escape") leave();
  }

  const setAction = (next: VisitAction): void => {
    action = next;
    paint();
  };
  waterBtn.addEventListener("click", () => setAction("water"));
  pickBtn.addEventListener("click", () => setAction("pick"));
  leaveBtn.addEventListener("click", leave);
  home.addEventListener("click", leave);
  if (typeof document !== "undefined") document.addEventListener("keydown", onKey);

  paint();

  return {
    el,
    plots,
    summary: () => ({ ...summary, picked: [...summary.picked] }),
    action: () => action,
    setAction,
    leave,
  };
}
