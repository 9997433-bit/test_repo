import { FLOWERS, FLOWER_MAP } from "../data/flowers";
import { DECORATIONS, THEMES } from "../data/decorations";
import { SPIRITS } from "../data/spirits";
import type { GameState } from "../engine/state";
import { VASES } from "../systems/workshop";

export type PanelId = "seed" | "order" | "workshop" | "decor" | "spirit" | "bag" | null;

export function renderPanel(
  host: HTMLElement,
  id: PanelId,
  state: GameState,
  handlers: {
    plant: (flowerId: string) => void;
    fulfill: (uid: string, artId?: string) => void;
    cancel: (uid: string) => void;
    craft: (vase: string, ids: string[]) => void;
    place: (decorId: string) => void;
    theme: (t: string) => void;
    spirit: (id: string | null) => void;
  },
): void {
  host.replaceChildren();
  if (!id) return;
  const sheet = document.createElement("section");
  sheet.className = "sheet";
  if (id === "seed") {
    sheet.innerHTML = `<h3>花种匣</h3><div class="grid"></div>`;
    const grid = sheet.querySelector(".grid")!;
    for (const f of FLOWERS) {
      const locked = !state.unlockedFlowers.includes(f.id);
      const card = document.createElement("button");
      card.className = "card";
      card.disabled = locked;
      card.innerHTML = `<h4>${f.name}</h4><div class="muted">${f.lore}</div><div class="muted">${f.seedCost}金 · ${f.season} · ${"★".repeat(f.rarity)}</div>`;
      card.addEventListener("click", () => handlers.plant(f.id));
      grid.append(card);
    }
  }
  if (id === "order") {
    sheet.innerHTML = `<h3>花坊订单</h3><div class="grid"></div>`;
    const grid = sheet.querySelector(".grid")!;
    for (const o of state.orders) {
      const left = Math.max(0, Math.ceil((o.dueAt - state.now) / 1000));
      const card = document.createElement("div");
      card.className = "card";
      card.innerHTML = `<h4>${o.title}</h4><div class="muted">${o.hint} · ${left}s · +${o.coin}金</div>`;
      const ok = document.createElement("button");
      ok.textContent = "交付";
      ok.addEventListener("click", () => {
        const art = state.arrangements[0]?.id;
        handlers.fulfill(o.uid, art);
      });
      const no = document.createElement("button");
      no.textContent = "婉拒";
      no.addEventListener("click", () => handlers.cancel(o.uid));
      card.append(ok, no);
      grid.append(card);
    }
  }
  if (id === "workshop") {
    const pick: string[] = [];
    sheet.innerHTML = `<h3>花艺作坊</h3><p class="muted">点选库存花材 2-4 枝，再选花器。</p><div class="bag"></div><div class="vases"></div>`;
    const bag = sheet.querySelector(".bag")!;
    for (const [fid, n] of Object.entries(state.inventory)) {
      const b = document.createElement("button");
      b.textContent = `${FLOWER_MAP[fid]?.name ?? fid} ×${n}`;
      b.addEventListener("click", () => {
        pick.push(fid);
        b.classList.add("is-on");
      });
      bag.append(b);
    }
    const vases = sheet.querySelector(".vases")!;
    for (const v of VASES) {
      const b = document.createElement("button");
      b.textContent = `成器 · ${v.name}`;
      b.addEventListener("click", () => handlers.craft(v.id, pick.splice(0)));
      vases.append(b);
    }
    if (state.arrangements.length) {
      const list = document.createElement("p");
      list.className = "muted";
      list.textContent = `陈列：${state.arrangements.map((a) => `${a.name}(${a.score})`).join("，")}`;
      sheet.append(list);
    }
  }
  if (id === "decor") {
    sheet.innerHTML = `<h3>庭院装扮</h3><div class="grid"></div><div class="themes"></div>`;
    const grid = sheet.querySelector(".grid")!;
    for (const d of DECORATIONS) {
      const b = document.createElement("button");
      b.className = "card";
      b.innerHTML = `<h4>${d.glyph} ${d.name}</h4><div class="muted">${d.cost}金 / ${d.fragmentCost}碎片</div>`;
      b.addEventListener("click", () => handlers.place(d.id));
      grid.append(b);
    }
    const themes = sheet.querySelector(".themes")!;
    for (const t of THEMES) {
      const b = document.createElement("button");
      b.textContent = `套用${t.name}`;
      b.addEventListener("click", () => handlers.theme(t.id));
      themes.append(b);
    }
  }
  if (id === "spirit") {
    sheet.innerHTML = `<h3>花灵</h3><div class="grid"></div>`;
    const grid = sheet.querySelector(".grid")!;
    const off = document.createElement("button");
    off.textContent = "暂不请灵";
    off.addEventListener("click", () => handlers.spirit(null));
    grid.append(off);
    for (const s of SPIRITS) {
      const b = document.createElement("button");
      b.className = `card${state.activeSpirit === s.id ? " is-on" : ""}`;
      b.disabled = !state.unlockedSpirits.includes(s.id);
      b.innerHTML = `<h4>${s.name}</h4><div class="muted">${s.line}</div>`;
      b.addEventListener("click", () => handlers.spirit(s.id));
      grid.append(b);
    }
  }
  if (id === "bag") {
    const rows = Object.entries(state.inventory)
      .map(([id, n]) => `${FLOWER_MAP[id]?.name ?? id} ×${n}`)
      .join(" · ") || "匣中空空";
    sheet.innerHTML = `<h3>花材库存</h3><p>${rows}</p><p class="muted">已收获 ${state.stats.harvested} · 订单 ${state.stats.ordersDone}</p>`;
  }
  host.append(sheet);
}
