import { FLOWERS, FLOWER_MAP, type GrowthStage } from "../data/flowers";
import { DECORATIONS, THEMES } from "../data/decorations";
import { SPIRITS } from "../data/spirits";
import { emit } from "../engine/events";
import {
  helpWater,
  neighborDef,
  neighborGarden,
  neighborRoster,
  pickNeighborFlower,
  pressingOrders,
  visitSummary,
  visitTally,
  type NeighborPlot,
  type NeighborStage,
} from "../engine/neighbors";
import type { GameState, ActiveOrder } from "../engine/state";
import { seasonLabel } from "../engine/time";
import { plotArt } from "../scene/flower-art";
import { orderParts, orderReady, qualifyingArrangements } from "../systems/orders";
import { SPIRIT_VISUALS, spiritPortrait } from "../systems/spirits";
import { scoreArrangement, VASES } from "../systems/workshop";
import { totalInventory } from "../systems/economy";
import { renderSideStory } from "./tutorial";

/** app.ts 认得的面板集合。 */
export type CorePanelId = "seed" | "order" | "workshop" | "decor" | "spirit" | "bag";
export type PanelId = CorePanelId | null;
/**
 * 访邻面板另立 id，不并入 `PanelId`：app.ts 的 `panelSig` 对 `PanelId` 做穷举 switch，
 * 联合里多一个成员它就编译不过（TS2366），而 app.ts 不在本轮可改文件内。
 * dock 接线时把 app 的 `panel` 变量换成 `AnyPanelId`、switch 补一个 case 即可，
 * `renderPanel` 这侧已经认得 "visit"。
 */
export const VISIT_PANEL = "visit";
export type AnyPanelId = PanelId | typeof VISIT_PANEL;

export interface PanelSelection {
  workshopPick: string[];
  orderPick: Map<string, string>;
  pendingSeed: string | null;
}

export interface PanelHandlers {
  selectSeed: (flowerId: string | null) => void;
  fulfill: (uid: string, artId?: string) => void;
  cancel: (uid: string) => void;
  addPick: (flowerId: string) => void;
  removePick: (index: number) => void;
  craft: (vase: string) => void;
  pickArt: (uid: string, artId: string) => void;
  place: (decorId: string) => void;
  theme: (t: string) => void;
  spirit: (id: string | null) => void;
  close: () => void;
}

const KIND_ZH: Record<ActiveOrder["kind"], string> = {
  resident: "街坊",
  custom: "定制",
  silk: "绸缎",
  group: "盛会",
};

function head(title: string, onClose: () => void, titleId = "sheet-title"): HTMLElement {
  const h = document.createElement("header");
  h.className = "sheet-head";
  h.innerHTML = `<h3 id="${titleId}">${title}</h3>`;
  const close = document.createElement("button");
  close.type = "button";
  close.className = "sheet-close";
  close.textContent = "收起";
  close.setAttribute("aria-label", "关闭面板");
  close.addEventListener("click", onClose);
  h.append(close);
  return h;
}

function renderSeed(sheet: HTMLElement, state: GameState, sel: PanelSelection, h: PanelHandlers): void {
  const tip = document.createElement("p");
  tip.className = "muted";
  tip.textContent = sel.pendingSeed
    ? `已选「${FLOWER_MAP[sel.pendingSeed]?.name ?? ""}」，点击园中空地播种`
    : "选中花种后，点击园中空地播种";
  const grid = document.createElement("div");
  grid.className = "grid";
  for (const f of FLOWERS) {
    const locked = !state.unlockedFlowers.includes(f.id);
    const card = document.createElement("button");
    card.type = "button";
    card.className = `card seed-card${sel.pendingSeed === f.id ? " is-on" : ""}`;
    card.disabled = locked;
    card.setAttribute("aria-pressed", String(sel.pendingSeed === f.id));
    card.setAttribute(
      "aria-label",
      locked ? `${f.name}，${f.unlockLevel} 阶解锁` : `选择花种${f.name}，种子 ${f.seedCost} 金，${seasonLabel(f.season)}季花`,
    );
    card.innerHTML = `<span class="seed-dot" style="--c:${f.color};--a:${f.accent}" aria-hidden="true"></span>
      <h4>${f.name} <small>${"★".repeat(f.rarity)}</small></h4>
      <div class="muted">${f.lore}</div>
      <div class="muted">${locked ? `${f.unlockLevel} 阶解锁` : `${f.seedCost}金 · ${seasonLabel(f.season)}季 · 收 ${f.harvestCoin}金`}</div>`;
    card.addEventListener("click", () => h.selectSeed(sel.pendingSeed === f.id ? null : f.id));
    grid.append(card);
  }
  sheet.append(tip, grid);
}

function orderStatus(state: GameState, o: ActiveOrder): string {
  if (o.requireScore) return `需作品 ≥ ${o.requireScore} 分`;
  const { named, filler } = orderParts(o);
  const parts = named.map(([id, n]) => {
    const have = state.inventory[id] ?? 0;
    return `${FLOWER_MAP[id]?.name ?? id}×${n} ${have >= n ? "已备" : `缺${n - have}`}`;
  });
  if (filler > 0) parts.push(`另加任意 ${filler} 枝`);
  parts.push(`匣中共 ${totalInventory(state)} 枝`);
  return parts.join(" · ");
}

function renderOrder(sheet: HTMLElement, state: GameState, sel: PanelSelection, h: PanelHandlers): void {
  const grid = document.createElement("div");
  grid.className = "grid orders";
  if (!state.orders.length) {
    const empty = document.createElement("p");
    empty.className = "muted";
    empty.textContent = "暂无客人，花开了自然有人来。";
    grid.append(empty);
  }
  for (const o of state.orders) {
    const ready = orderReady(state, o);
    const card = document.createElement("div");
    card.className = "card order-card";
    card.innerHTML = `<h4><span class="kind kind-${o.kind}">${KIND_ZH[o.kind]}</span>${o.title}</h4>
      <div class="muted">${o.hint}</div>
      <div class="order-row"><span class="countdown" data-due="${o.dueAt}"></span><span class="reward">+${o.coin}金 · +${o.exp}经验 · +${o.waterReward}水</span></div>
      <div class="muted status">${orderStatus(state, o)}</div>`;
    let chosenArt: string | undefined;
    if (o.requireScore) {
      const pool = qualifyingArrangements(state, o);
      chosenArt = sel.orderPick.get(o.uid) ?? pool[0]?.id;
      if (pool.length) {
        const arts = document.createElement("div");
        arts.className = "art-pick";
        for (const a of pool) {
          const chip = document.createElement("button");
          chip.type = "button";
          chip.className = `chip${chosenArt === a.id ? " is-on" : ""}`;
          chip.setAttribute("aria-pressed", String(chosenArt === a.id));
          chip.setAttribute("aria-label", `选用作品${a.name}，${a.score} 分`);
          chip.textContent = `${a.name} · ${a.score}分`;
          chip.addEventListener("click", () => h.pickArt(o.uid, a.id));
          arts.append(chip);
        }
        card.append(arts);
      }
    }
    const actions = document.createElement("div");
    actions.className = "order-actions";
    const ok = document.createElement("button");
    ok.type = "button";
    ok.className = "primary";
    ok.textContent = "交付";
    ok.disabled = !ready;
    ok.setAttribute("aria-label", `交付订单：${o.title}`);
    ok.addEventListener("click", () => h.fulfill(o.uid, chosenArt));
    const no = document.createElement("button");
    no.type = "button";
    no.textContent = "婉拒";
    no.setAttribute("aria-label", `婉拒订单：${o.title}，口碑将下降`);
    no.addEventListener("click", () => h.cancel(o.uid));
    actions.append(ok, no);
    card.append(actions);
    grid.append(card);
  }
  sheet.append(grid);
}

function renderWorkshop(sheet: HTMLElement, state: GameState, sel: PanelSelection, h: PanelHandlers): void {
  const tip = document.createElement("p");
  tip.className = "muted";
  tip.textContent = "从库存点选 2-4 枝花材入瓶，同季花更和谐，花器亦有加成。";
  sheet.append(tip);

  const bag = document.createElement("div");
  bag.className = "bag-row";
  const picked = new Map<string, number>();
  for (const id of sel.workshopPick) picked.set(id, (picked.get(id) ?? 0) + 1);
  const entries = Object.entries(state.inventory).filter(([, n]) => n > 0);
  if (!entries.length) {
    const empty = document.createElement("p");
    empty.className = "muted";
    empty.textContent = "匣中无花，先去收获吧。";
    bag.append(empty);
  }
  for (const [fid, n] of entries) {
    const used = picked.get(fid) ?? 0;
    const b = document.createElement("button");
    b.type = "button";
    b.className = `chip${used > 0 ? " is-on" : ""}`;
    b.disabled = used >= n || sel.workshopPick.length >= 4;
    b.setAttribute("aria-label", `选入${FLOWER_MAP[fid]?.name ?? fid}，剩余 ${n - used} 枝`);
    b.innerHTML = `<span class="seed-dot" style="--c:${FLOWER_MAP[fid]?.color ?? "#ddd"};--a:${FLOWER_MAP[fid]?.accent ?? "#aaa"}" aria-hidden="true"></span>${FLOWER_MAP[fid]?.name ?? fid} ×${n - used}`;
    b.addEventListener("click", () => h.addPick(fid));
    bag.append(b);
  }
  sheet.append(bag);

  const tray = document.createElement("div");
  tray.className = "tray";
  tray.setAttribute("aria-label", "花瓶中的花材");
  for (let i = 0; i < 4; i++) {
    const fid = sel.workshopPick[i];
    const slot = document.createElement("button");
    slot.type = "button";
    slot.className = `tray-slot${fid ? " filled" : ""}`;
    if (fid) {
      const def = FLOWER_MAP[fid];
      slot.innerHTML = `<span class="seed-dot" style="--c:${def?.color ?? "#ddd"};--a:${def?.accent ?? "#aaa"}" aria-hidden="true"></span>${def?.name ?? fid}`;
      slot.setAttribute("aria-label", `移出${def?.name ?? fid}`);
      slot.addEventListener("click", () => h.removePick(i));
    } else {
      slot.textContent = "空";
      slot.disabled = true;
      slot.setAttribute("aria-label", "空瓶位");
    }
    tray.append(slot);
  }
  sheet.append(tray);

  const vases = document.createElement("div");
  vases.className = "vases";
  for (const v of VASES) {
    const score = sel.workshopPick.length >= 2 ? scoreArrangement(sel.workshopPick, v.id, state.season) : 0;
    const b = document.createElement("button");
    b.type = "button";
    b.className = "vase-btn";
    b.disabled = sel.workshopPick.length < 2;
    b.setAttribute("aria-label", `以${v.name}成器${score ? `，预估 ${score} 分` : ""}`);
    b.innerHTML = `<strong>${v.name}</strong><small>${score ? `预估 ${score} 分` : `加成 +${v.bonus}`}</small>`;
    b.addEventListener("click", () => h.craft(v.id));
    vases.append(b);
  }
  sheet.append(vases);

  if (state.arrangements.length) {
    const list = document.createElement("div");
    list.className = "art-list";
    list.innerHTML = `<div class="muted">陈列架</div>`;
    for (const a of state.arrangements) {
      const chip = document.createElement("span");
      chip.className = `chip art-chip${a.score >= 85 ? " rare" : ""}`;
      chip.textContent = `${a.name} · ${a.score}分`;
      list.append(chip);
    }
    sheet.append(list);
  }
}

function renderDecor(sheet: HTMLElement, state: GameState, h: PanelHandlers): void {
  const grid = document.createElement("div");
  grid.className = "grid";
  for (const d of DECORATIONS) {
    const owned = state.placedDecor.includes(d.id);
    const locked = state.level < d.unlockLevel;
    const b = document.createElement("button");
    b.type = "button";
    b.className = `card${owned ? " owned" : ""}`;
    b.disabled = owned || locked;
    b.setAttribute(
      "aria-label",
      owned ? `${d.name}，已安置` : locked ? `${d.name}，${d.unlockLevel} 阶解锁` : `安置${d.name}，需 ${d.cost} 金或 ${d.fragmentCost} 碎片`,
    );
    b.innerHTML = `<h4>${d.glyph} ${d.name}</h4><div class="muted">${owned ? "已安置" : locked ? `${d.unlockLevel} 阶解锁` : `${d.cost}金 / ${d.fragmentCost}碎片 · 雅致+${d.mood}`}</div>`;
    b.addEventListener("click", () => h.place(d.id));
    grid.append(b);
  }
  const themes = document.createElement("div");
  themes.className = "themes";
  for (const t of THEMES) {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = `套用${t.name}`;
    b.setAttribute("aria-label", `套用${t.name}主题`);
    b.addEventListener("click", () => h.theme(t.id));
    themes.append(b);
  }
  sheet.append(grid, themes);
}

const SPIRIT_ROW = "display:flex;align-items:center;gap:10px;text-align:left";
// 形象已经替代了视觉层的「首字放大作灵字」占位，标题回到一行，免得灵字与形象打架
const SPIRIT_TITLE = "display:flex;align-items:baseline;gap:6px";

function renderSpirit(sheet: HTMLElement, state: GameState, h: PanelHandlers): void {
  // 顶部一栏：谁在随行，以及它此刻说的话
  const active = SPIRITS.find((s) => s.id === state.activeSpirit);
  const banner = document.createElement("div");
  banner.className = "spirit-banner";
  banner.style.cssText = `${SPIRIT_ROW};margin:2px 0 10px`;
  banner.innerHTML =
    `<span class="spirit-figure" aria-hidden="true" style="flex:0 0 auto">${spiritPortrait(active?.id ?? null, { size: 56 })}</span>` +
    `<span><strong>${active ? `${active.name} 随行` : "尚未请灵"}</strong>` +
    `<div class="muted">${active ? active.line : "择一花灵相伴，园中自有微光。"}</div></span>`;
  sheet.append(banner);

  const grid = document.createElement("div");
  grid.className = "grid";
  const off = document.createElement("button");
  off.type = "button";
  off.className = `card spirit-card${state.activeSpirit === null ? " is-on" : ""}`;
  off.style.cssText = SPIRIT_ROW;
  off.setAttribute("aria-pressed", String(state.activeSpirit === null));
  off.setAttribute("aria-label", "暂不请灵，园中无花灵随行");
  off.innerHTML =
    `<span class="spirit-figure" aria-hidden="true" style="flex:0 0 auto">${spiritPortrait(null, { size: 40 })}</span>` +
    `<span><h4 style="${SPIRIT_TITLE}">暂不请灵</h4><div class="muted">独自侍弄花草</div></span>`;
  off.addEventListener("click", () => h.spirit(null));
  grid.append(off);
  for (const s of SPIRITS) {
    const unlocked = state.unlockedSpirits.includes(s.id);
    const motif = SPIRIT_VISUALS[s.id]?.motif ?? "";
    const effects = [
      s.growMul !== 1 ? `生长×${s.growMul}` : "",
      s.autoWater ? "自动浇水" : "",
      s.wiltGuard ? "花不枯萎" : "",
      s.reputationBonus ? `口碑+${s.reputationBonus}` : "",
    ]
      .filter(Boolean)
      .join(" · ");
    const b = document.createElement("button");
    b.type = "button";
    b.className = `card spirit-card${state.activeSpirit === s.id ? " is-on" : ""}${unlocked ? "" : " is-sealed"}`;
    // 视觉层的 per-灵配色令牌挂在 [data-spirit] 上（契约见 docs/VISUAL.md §六）
    b.dataset.spirit = s.id;
    b.style.cssText = SPIRIT_ROW;
    b.disabled = !unlocked;
    b.setAttribute("aria-pressed", String(state.activeSpirit === s.id));
    b.setAttribute("aria-label", unlocked ? `请花灵${s.name}，${motif}，${effects}` : `${s.name}，${motif}，${s.unlockLevel} 阶苏醒`);
    b.innerHTML =
      `<span class="spirit-figure" aria-hidden="true" style="flex:0 0 auto">${spiritPortrait(s.id, { size: 44, locked: !unlocked })}</span>` +
      `<span><h4 style="${SPIRIT_TITLE}">${s.name} <small>${motif}</small></h4>` +
      `<div class="muted">${unlocked ? effects : `${s.unlockLevel} 阶苏醒`}</div>` +
      `<div class="muted">${s.line}</div></span>`;
    b.addEventListener("click", () => h.spirit(s.id));
    grid.append(b);
  }
  sheet.append(grid);
}

function renderBag(sheet: HTMLElement, state: GameState): void {
  const entries = Object.entries(state.inventory).filter(([, n]) => n > 0);
  const list = document.createElement("div");
  list.className = "bag-row";
  if (!entries.length) {
    list.innerHTML = `<p class="muted">匣中空空，去园里收些花吧。</p>`;
  }
  for (const [id, n] of entries) {
    const def = FLOWER_MAP[id];
    const chip = document.createElement("span");
    chip.className = "chip";
    chip.innerHTML = `<span class="seed-dot" style="--c:${def?.color ?? "#ddd"};--a:${def?.accent ?? "#aaa"}" aria-hidden="true"></span>${def?.name ?? id} ×${n}`;
    list.append(chip);
  }
  const stats = document.createElement("p");
  stats.className = "muted";
  stats.textContent = `已收获 ${state.stats.harvested} · 已交订单 ${state.stats.ordersDone} · 已播种 ${state.stats.planted}`;
  sheet.append(list, stats);
}

// ---------------------------------------------------------------------------
// 邻家花园（访邻）· docs/UX.md 六
// 玩法与数值都归 engine/neighbors.ts（园子生成、每日余量、交情、痕迹）；
// 这里只做两页渲染：邻居名录 ⇄ 某一家的园子，外加番外折的触发时机。
// ---------------------------------------------------------------------------

const VISIT_TITLE_ID = "visit-title";
const VISIT_SHEET_CLASS = "visit-sheet";
const SEAL_STYLE =
  "display:inline-grid;place-items:center;width:22px;height:22px;border-radius:5px;" +
  "background:linear-gradient(155deg,var(--accent-hi,#d98b6a),var(--seal-red,#a6321f));" +
  "color:#f8ead2;font-family:var(--font-display);font-size:13px;transform:rotate(-4deg)";

/** 串门期间停留的邻居；null 表示停在邻居名录。 */
let visitFocus: string | null = null;
/** 邻家园里手上的活，语义同 dock 工具。 */
let visitTool: "water" | "pick" = "water";
/** 进园那一刻的战果基线，回园小结按差值报账。 */
let visitEntryTally = { water: 0, pick: 0 };

function heartRow(n: number): string {
  return `${"❤".repeat(n)}${"♡".repeat(Math.max(0, 5 - n))}`;
}

function storyHost(sheet: HTMLElement): HTMLElement {
  return sheet.closest<HTMLElement>(".app") ?? document.body;
}

/** 邻家的三段生长映射到自家花卉图形的阶段，圃面观感与自家一致。 */
const ART_STAGE: Record<NeighborStage, GrowthStage> = { empty: "empty", growing: "bud", bloom: "bloom" };

function plotStatus(plot: NeighborPlot): string {
  if (plot.picked) return "借花笺 · 已摘";
  if (plot.watered) return "已浇 · 谢过了";
  if (plot.stage === "empty") return "空圃";
  if (plot.stage === "bloom") return "盛放 · 可摘";
  return plot.thirsty ? "含苞 · 缺水" : "含苞";
}

function renderNeighborList(sheet: HTMLElement, state: GameState, rerender: () => void): void {
  const roster = neighborRoster(state);
  const tip = document.createElement("p");
  tip.className = "muted";
  tip.textContent = `帮邻居浇水攒交情，看中的花借一枝回来。今日还可帮浇 ${state.social.waterLeft} 瓢、借 ${state.social.pickLeft} 枝。`;

  const grid = document.createElement("div");
  grid.className = "grid neighbors";
  for (const entry of roster) {
    const { def } = entry;
    const spent = entry.unlocked && entry.waterLeft === 0 && entry.pickLeft === 0;
    const card = document.createElement("button");
    card.type = "button";
    card.className = `card neighbor-card${entry.unlocked ? "" : " owned"}`;
    card.dataset.neighbor = def.id;
    card.disabled = !entry.unlocked;
    card.setAttribute(
      "aria-label",
      entry.unlocked
        ? `串门去${def.name}的园子，交情 ${entry.hearts} 颗心，今日可浇 ${entry.waterLeft} 瓢、可摘 ${entry.pickLeft} 枝`
        : `${def.name}，${def.unlockLevel} 阶后来往`,
    );
    card.innerHTML =
      `<h4><span aria-hidden="true" style="${SEAL_STYLE}">${def.seal}</span><span style="white-space:nowrap">${def.name}</span></h4>` +
      `<div class="muted"><small>${heartRow(entry.hearts)}</small> · ${entry.unlocked ? (spent ? "今日已叨扰，明日再来" : `可浇 ${entry.waterLeft} · 可摘 ${entry.pickLeft}`) : `${def.unlockLevel} 阶后来往`}</div>` +
      `<div class="muted">${entry.unlocked ? def.greeting : "隔篱只见花影"}</div>`;
    card.addEventListener("click", () => {
      visitFocus = def.id;
      visitTool = "water";
      visitEntryTally = visitTally(state, def.id);
      rerender();
      // 首次串门弹一折番外；守卫在 renderSideStory 内，重复调用安静返回 false
      renderSideStory(storyHost(sheet), state, "fence");
    });
    grid.append(card);
  }
  sheet.append(tip, grid);
}

function renderNeighborGarden(sheet: HTMLElement, state: GameState, neighborId: string, rerender: () => void): void {
  const garden = neighborGarden(state, neighborId);
  if (!garden) {
    visitFocus = null;
    renderNeighborList(sheet, state, rerender);
    return;
  }
  const { def, plots } = garden;
  const canWater = garden.thirsty > 0 && garden.waterLeft > 0;
  const canPick = garden.pickable > 0 && garden.pickLeft > 0;
  if (visitTool === "pick" && !canPick) visitTool = "water";

  const goHome = (): void => {
    const summary = visitSummary(state, def.id, visitEntryTally);
    if (summary) emit({ type: "toast", text: summary, tone: "ok" });
    visitFocus = null;
    rerender();
  };

  const banner = document.createElement("div");
  banner.className = "visit-banner";
  banner.style.cssText = "display:flex;align-items:center;gap:10px;margin:2px 0 10px";
  banner.innerHTML =
    `<span aria-hidden="true" style="${SEAL_STYLE};width:34px;height:34px;font-size:19px;flex:0 0 auto">${def.seal}</span>` +
    `<span><strong style="white-space:nowrap">${def.name} <small>${heartRow(garden.hearts)}</small></strong>` +
    `<div class="muted">${garden.greeting}</div></span>`;
  const home = document.createElement("button");
  home.type = "button";
  home.className = "visit-home";
  home.textContent = "回自家园";
  home.setAttribute("aria-label", "回自家园子");
  home.style.marginLeft = "auto";
  home.addEventListener("click", goHome);
  banner.append(home);
  sheet.append(banner);

  // 家里有客急等交花时提一句，别让串门耽误了自家的单
  if (pressingOrders(state) > 0) {
    const hurry = document.createElement("p");
    hurry.className = "muted visit-hurry";
    hurry.style.color = "var(--vermilion)";
    hurry.textContent = "家里有客急等交花，串门莫久留。";
    sheet.append(hurry);
  }

  const tools = document.createElement("div");
  tools.className = "bag-row visit-tools";
  const toolSpec = [
    { id: "water" as const, label: `帮浇水（余 ${garden.waterLeft}）`, on: canWater, off: `${def.name}园里今日水足` },
    { id: "pick" as const, label: `摘一枝（余 ${garden.pickLeft}）`, on: canPick, off: "花还没开，改日再摘" },
  ];
  for (const t of toolSpec) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = `chip visit-tool${visitTool === t.id ? " is-on" : ""}`;
    b.dataset.tool = t.id;
    b.disabled = !t.on;
    b.setAttribute("aria-pressed", String(visitTool === t.id));
    b.setAttribute("aria-label", t.on ? t.label : `${t.label}，${t.off}`);
    b.textContent = t.label;
    b.addEventListener("click", () => {
      visitTool = t.id;
      rerender();
    });
    tools.append(b);
  }
  sheet.append(tools);
  if (!canWater || !canPick) {
    const note = document.createElement("p");
    note.className = "muted visit-note";
    note.textContent = toolSpec
      .filter((t) => !t.on)
      .map((t) => t.off)
      .join(" · ");
    sheet.append(note);
  }

  const grid = document.createElement("div");
  grid.className = "grid neighbor-garden";
  for (const plot of plots) {
    const flower = plot.flowerId ? FLOWER_MAP[plot.flowerId] : undefined;
    const done = plot.watered || plot.picked;
    const actionable = visitTool === "water" ? plot.thirsty && canWater : plot.stage === "bloom" && !plot.picked && canPick;
    const status = plotStatus(plot);
    const cell = document.createElement("button");
    cell.type = "button";
    cell.className = `card visit-plot${done ? " owned" : ""}${actionable ? " is-on" : ""}`;
    cell.dataset.plotIdx = String(plot.idx);
    cell.disabled = !actionable;
    cell.setAttribute("aria-label", `${def.name}家花圃${plot.idx + 1}：${flower?.name ?? "空圃"}，${status}`);
    const art = document.createElement("span");
    art.setAttribute("aria-hidden", "true");
    art.style.cssText = "display:block;height:58px";
    art.innerHTML = plotArt(flower, ART_STAGE[plot.stage]);
    art.firstElementChild?.setAttribute("style", "width:100%;height:100%");
    const cap = document.createElement("span");
    cap.innerHTML = `<h4>${flower?.name ?? "空圃"}</h4><div class="muted">${status}</div>`;
    cell.append(art, cap);
    cell.addEventListener("click", () => {
      // 先记下手上的活：摘掉最后一枝后重绘会把工具切回浇水
      const tool = visitTool;
      const ok = tool === "water" ? helpWater(state, def.id, plot.idx) : pickNeighborFlower(state, def.id, plot.idx) !== null;
      rerender();
      if (ok && tool === "pick") renderSideStory(storyHost(sheet), state, "borrow");
    });
    grid.append(cell);
  }
  sheet.append(grid);
}

/** 访邻面板：邻居名录 ⇄ 某一家的园子，两页共用一张花笺。 */
export function renderVisit(sheet: HTMLElement, state: GameState, onClose: () => void): void {
  const def = visitFocus ? neighborDef(visitFocus) : undefined;
  if (visitFocus && !def) visitFocus = null;
  sheet.replaceChildren();
  sheet.setAttribute("aria-labelledby", VISIT_TITLE_ID);
  const rerender = (): void => renderVisit(sheet, state, onClose);
  bindVisitEsc(sheet, state, onClose);
  sheet.append(head(def ? `${def.name}的园子` : TITLES.visit, onClose, VISIT_TITLE_ID));
  if (def) renderNeighborGarden(sheet, state, def.id, rerender);
  else renderNeighborList(sheet, state, rerender);
}

/** 当前在场的那张访邻花笺；花笺被 app 换掉后 isConnected 转假，监听自行作废。 */
let escVisit: { sheet: HTMLElement; state: GameState; onClose: () => void } | null = null;
let escVisitBound = false;

/**
 * Esc：园中先退回名录，名录再收起花笺（与 docs/UX.md 五「只收最上面一层」一致）。
 * 监听只装一次挂在 document 上——花笺由 app.ts 逐次重建，逐张装监听会漏摘。
 */
function bindVisitEsc(sheet: HTMLElement, state: GameState, onClose: () => void): void {
  escVisit = { sheet, state, onClose };
  if (escVisitBound || typeof document === "undefined") return;
  escVisitBound = true;
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape" || !escVisit) return;
    const live = escVisit;
    if (!live.sheet.isConnected) {
      escVisit = null;
      return;
    }
    if (visitFocus) {
      visitFocus = null;
      renderVisit(live.sheet, live.state, live.onClose);
    } else {
      live.onClose();
    }
  });
}

const TITLES: Record<Exclude<AnyPanelId, null>, string> = {
  seed: "花种匣",
  order: "花坊订单",
  workshop: "花艺作坊",
  decor: "庭院装扮",
  spirit: "花灵",
  bag: "花材库存",
  visit: "邻家花园",
};

export function renderPanel(host: HTMLElement, id: AnyPanelId, state: GameState, sel: PanelSelection, h: PanelHandlers): void {
  host.replaceChildren();
  // 收起花笺就算回了自家园：下次点「访邻」重新从名录进，不落在上回那家院里
  if (id !== VISIT_PANEL) visitFocus = null;
  if (!id) return;
  const sheet = document.createElement("section");
  sheet.className = "sheet";
  sheet.setAttribute("role", "region");
  sheet.setAttribute("aria-labelledby", "sheet-title");
  if (id === VISIT_PANEL) {
    // 访邻自带页头（名录 / 某家园子两页轮换）；visit-sheet 供 CSS 按当前动作换圃色
    sheet.classList.add(VISIT_SHEET_CLASS);
    renderVisit(sheet, state, h.close);
    host.append(sheet);
    return;
  }
  sheet.append(head(TITLES[id], h.close));
  if (id === "seed") renderSeed(sheet, state, sel, h);
  if (id === "order") renderOrder(sheet, state, sel, h);
  if (id === "workshop") renderWorkshop(sheet, state, sel, h);
  if (id === "decor") renderDecor(sheet, state, h);
  if (id === "spirit") renderSpirit(sheet, state, h);
  if (id === "bag") renderBag(sheet, state);
  host.append(sheet);
}

/** 每帧只更新倒计时文本，不重建面板。 */
export function updatePanelTimers(host: HTMLElement, state: GameState): void {
  for (const el of host.querySelectorAll<HTMLElement>("[data-due]")) {
    const due = Number(el.dataset.due);
    const left = Math.max(0, Math.ceil((due - state.now) / 1000));
    const text = `剩 ${left}s`;
    if (el.textContent !== text) el.textContent = text;
    el.classList.toggle("urgent", left <= 15);
  }
}
