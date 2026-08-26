import { FLOWERS, FLOWER_MAP, HUE_NAMES, ROLE_NAMES, type FlowerDef } from "../data/flowers";
import { DECORATIONS, THEMES, anchorName } from "../data/decorations";
import { SPIRITS } from "../data/spirits";
import type { GameState, ActiveOrder } from "../engine/state";
import { seasonLabel } from "../engine/time";
import { neighborRoster } from "../systems/neighbors";
import { orderParts, orderReady, qualifyingArrangements } from "../systems/orders";
import { SPIRIT_VISUALS, spiritPortrait } from "../systems/spirits";
import { scoreArrangement, VASES } from "../systems/workshop";
import { totalInventory } from "../systems/economy";

export type PanelId = "seed" | "order" | "workshop" | "decor" | "spirit" | "bag" | "visit" | null;

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
  /** 手持某件陈设（或空手 null）进入摆放模式。 */
  arrange: (decorId: string | null) => void;
  /** 串门：进入某位邻居的园子。 */
  visit: (neighborId: string) => void;
  spirit: (id: string | null) => void;
  close: () => void;
}

const KIND_ZH: Record<ActiveOrder["kind"], string> = {
  resident: "街坊",
  custom: "定制",
  silk: "绸缎",
  group: "盛会",
};

/** 「粉 · 配花」：配色与章法标签，让评分决策在挑花时就可见。 */
function craftTag(f: FlowerDef): string {
  return `${HUE_NAMES[f.hue]} · ${ROLE_NAMES[f.role]}`;
}

function head(title: string, onClose: () => void): HTMLElement {
  const h = document.createElement("header");
  h.className = "sheet-head";
  h.innerHTML = `<h3 id="sheet-title">${title}</h3>`;
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
      locked
        ? `${f.name}，${f.unlockLevel} 阶解锁`
        : `选择花种${f.name}，种子 ${f.seedCost} 金，${seasonLabel(f.season)}季花，${craftTag(f)}`,
    );
    card.innerHTML = `<span class="seed-dot" style="--c:${f.color};--a:${f.accent}" aria-hidden="true"></span>
      <h4>${f.name} <small>${"★".repeat(f.rarity)}</small></h4>
      <div class="muted">${f.lore}</div>
      <div class="muted">${locked ? `${f.unlockLevel} 阶解锁` : `${f.seedCost}金 · ${seasonLabel(f.season)}季 · ${craftTag(f)} · 收 ${f.harvestCoin}金`}</div>`;
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
  tip.textContent = "点选 2-4 枝花材入瓶：一枝主花为正、配花撑体、衬花点睛；双色相映、同季相和，花器亦有加成，重样折价。";
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
    const def = FLOWER_MAP[fid];
    const b = document.createElement("button");
    b.type = "button";
    b.className = `chip${used > 0 ? " is-on" : ""}`;
    b.disabled = used >= n || sel.workshopPick.length >= 4;
    b.setAttribute("aria-label", `选入${def?.name ?? fid}，${def ? `${craftTag(def)}，` : ""}剩余 ${n - used} 枝`);
    b.innerHTML = `<span class="seed-dot" style="--c:${def?.color ?? "#ddd"};--a:${def?.accent ?? "#aaa"}" aria-hidden="true"></span>${def?.name ?? fid} ×${n - used}${def ? ` <small class="craft-tag">${craftTag(def)}</small>` : ""}`;
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
  // —— 购置栏 ——
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
      owned ? `${d.name}，已购置` : locked ? `${d.name}，${d.unlockLevel} 阶解锁` : `购置${d.name}，需 ${d.cost} 金或 ${d.fragmentCost} 碎片`,
    );
    b.innerHTML = `<h4>${d.glyph} ${d.name}</h4><div class="muted">${owned ? "已购置" : locked ? `${d.unlockLevel} 阶解锁` : `${d.cost}金 / ${d.fragmentCost}碎片 · 雅致+${d.mood}`}</div>`;
    b.addEventListener("click", () => h.place(d.id));
    grid.append(b);
  }
  const themes = document.createElement("div");
  themes.className = "themes";
  for (const t of THEMES) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = state.decorTheme === t.id ? "is-on" : "";
    b.textContent = `套用${t.name}`;
    b.setAttribute("aria-label", `套用${t.name}主题${state.decorTheme === t.id ? "（当前主题）" : ""}`);
    b.addEventListener("click", () => h.theme(t.id));
    themes.append(b);
  }
  sheet.append(grid, themes);

  // —— 布置栏：已购陈设的落位与挪动（锚位制，见 UX.md 七） ——
  const owned = DECORATIONS.filter((d) => state.placedDecor.includes(d.id));
  const arrange = document.createElement("div");
  arrange.className = "arrange";
  const headRow = document.createElement("div");
  headRow.className = "arrange-head";
  headRow.innerHTML = `<span class="muted">布置 · 檐下径旁各有讲究</span>`;
  const adjust = document.createElement("button");
  adjust.type = "button";
  adjust.textContent = "调整布局";
  adjust.disabled = owned.length === 0;
  adjust.setAttribute("aria-label", "空手进入摆放模式，自由拿起与挪动已摆陈设");
  adjust.addEventListener("click", () => h.arrange(null));
  headRow.append(adjust);
  arrange.append(headRow);
  if (!owned.length) {
    const empty = document.createElement("p");
    empty.className = "muted";
    empty.textContent = "匣中无一物，先在上方购置一件。";
    arrange.append(empty);
  } else {
    const list = document.createElement("div");
    list.className = "arrange-list";
    for (const d of owned) {
      const anchor = state.decorAnchors[d.id] ?? null;
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = `chip${anchor ? "" : " boxed"}`;
      chip.setAttribute(
        "aria-label",
        anchor ? `${d.name}，已摆于${anchorName(anchor)}，点按挪动` : `${d.name}，在匣，点按摆放`,
      );
      chip.innerHTML = `${d.glyph} ${d.name} <small>${anchor ? `已摆 · ${anchorName(anchor)}` : "在匣"}</small>`;
      chip.addEventListener("click", () => h.arrange(d.id));
      list.append(chip);
    }
    arrange.append(list);
  }
  sheet.append(arrange);
}

function renderVisit(sheet: HTMLElement, state: GameState, h: PanelHandlers): void {
  // 自家有 30 秒内到期的订单：串门前提个醒（UX.md 六 6.4）
  if (state.orders.some((o) => o.dueAt - state.now <= 30_000)) {
    const warn = document.createElement("p");
    warn.className = "visit-urgent";
    warn.textContent = "家里有客急等交花";
    sheet.append(warn);
  }
  const tip = document.createElement("p");
  tip.className = "muted";
  tip.textContent = "帮邻居浇水攒友谊，盛开的花可借一枝回来（一日两枝、一家一枝）。";
  sheet.append(tip);

  const grid = document.createElement("div");
  grid.className = "grid";
  for (const r of neighborRoster(state)) {
    const card = document.createElement("div");
    card.className = `card neighbor-card${r.unlocked ? "" : " is-sealed"}`;
    const heartsStr = "♥".repeat(r.hearts) + "♡".repeat(5 - r.hearts);
    const allowance =
      r.waterLeft <= 0 && r.pickLeft <= 0 ? "今日已叨扰，明日再来" : `可浇 ${r.waterLeft} · 可摘 ${r.pickLeft}`;
    card.innerHTML = r.unlocked
      ? `<h4><span class="neighbor-seal" aria-hidden="true">${r.def.seal}</span>${r.def.name} <small class="hearts" aria-label="友谊${r.hearts}心">${heartsStr}</small></h4>
        <div class="muted">${allowance}</div>`
      : `<h4><span class="neighbor-seal silhouette" aria-hidden="true">？</span>${r.def.name}</h4>
        <div class="muted">${r.def.unlockLevel} 阶后来往</div>`;
    if (r.unlocked) {
      const go = document.createElement("button");
      go.type = "button";
      go.className = "primary";
      go.textContent = "串门";
      go.setAttribute("aria-label", `串门去${r.def.name}家的园子，友谊${r.hearts}心，${allowance}`);
      go.addEventListener("click", () => h.visit(r.def.id));
      card.append(go);
    }
    grid.append(card);
  }
  sheet.append(grid);
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

const TITLES: Record<Exclude<PanelId, null>, string> = {
  seed: "花种匣",
  order: "花坊订单",
  workshop: "花艺作坊",
  decor: "庭院装扮",
  spirit: "花灵",
  bag: "花材库存",
  visit: "串门访邻",
};

export function renderPanel(host: HTMLElement, id: PanelId, state: GameState, sel: PanelSelection, h: PanelHandlers): void {
  host.replaceChildren();
  if (!id) return;
  const sheet = document.createElement("section");
  sheet.className = "sheet";
  sheet.setAttribute("role", "region");
  sheet.setAttribute("aria-labelledby", "sheet-title");
  sheet.append(head(TITLES[id], h.close));
  if (id === "seed") renderSeed(sheet, state, sel, h);
  if (id === "order") renderOrder(sheet, state, sel, h);
  if (id === "workshop") renderWorkshop(sheet, state, sel, h);
  if (id === "decor") renderDecor(sheet, state, h);
  if (id === "spirit") renderSpirit(sheet, state, h);
  if (id === "bag") renderBag(sheet, state);
  if (id === "visit") renderVisit(sheet, state, h);
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
