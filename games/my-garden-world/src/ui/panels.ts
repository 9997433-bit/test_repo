import { FLOWERS, FLOWER_MAP } from "../data/flowers";
import { DECORATIONS, THEMES } from "../data/decorations";
import { SPIRITS } from "../data/spirits";
import type { GameState, ActiveOrder } from "../engine/state";
import { seasonLabel } from "../engine/time";
import { orderReady, qualifyingArrangements } from "../systems/orders";
import { scoreArrangement, VASES } from "../systems/workshop";
import { totalInventory } from "../systems/economy";

export type PanelId = "seed" | "order" | "workshop" | "decor" | "spirit" | "bag" | null;

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
  if (o.flowerIds?.length) {
    return o.flowerIds
      .map((id) => {
        const have = state.inventory[id] ?? 0;
        return `${FLOWER_MAP[id]?.name ?? id}×1 ${have >= 1 ? "已备" : "缺"}`;
      })
      .join("，");
  }
  return `任意花材 ${o.flowerCount ?? 1} 枝 · 现有 ${totalInventory(state)}`;
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

function renderSpirit(sheet: HTMLElement, state: GameState, h: PanelHandlers): void {
  const grid = document.createElement("div");
  grid.className = "grid";
  const off = document.createElement("button");
  off.type = "button";
  off.className = `card${state.activeSpirit === null ? " is-on" : ""}`;
  off.textContent = "暂不请灵";
  off.addEventListener("click", () => h.spirit(null));
  grid.append(off);
  for (const s of SPIRITS) {
    const unlocked = state.unlockedSpirits.includes(s.id);
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
    b.className = `card${state.activeSpirit === s.id ? " is-on" : ""}`;
    b.disabled = !unlocked;
    b.setAttribute("aria-pressed", String(state.activeSpirit === s.id));
    b.setAttribute("aria-label", unlocked ? `请花灵${s.name}，${effects}` : `${s.name}，${s.unlockLevel} 阶苏醒`);
    b.innerHTML = `<h4>${s.name}</h4><div class="muted">${unlocked ? effects : `${s.unlockLevel} 阶苏醒`}</div><div class="muted">${s.line}</div>`;
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
