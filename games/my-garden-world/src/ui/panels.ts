import { FLOWERS, FLOWER_MAP } from "../data/flowers";
import { DECORATIONS, THEMES } from "../data/decorations";
import { SPIRITS } from "../data/spirits";
import type { ActiveOrder, Arrangement, GameState } from "../engine/state";
import { VASES, scoreArrangement } from "../systems/workshop";
import { decorStatus, decorSummary, themeStatus } from "../systems/decorate";
import { activeSpirit, spiritEffects, spiritStatus } from "../systems/spirits";

export type PanelId = "seed" | "order" | "workshop" | "decor" | "spirit" | "bag" | null;

export interface PanelHandlers {
  plant: (flowerId: string) => void;
  fulfill: (uid: string, artId?: string) => void;
  cancel: (uid: string) => void;
  craft: (vase: string, ids: string[]) => void;
  place: (decorId: string) => void;
  theme: (t: string) => void;
  spirit: (id: string | null) => void;
}

const STYLE_ID = "mgw-panel-style";

const CSS = `
.sheet.mgw-sheet {
  left: 8px; right: 8px; bottom: 74px;
  max-height: min(58vh, 460px);
  padding: 0 0 max(10px, env(safe-area-inset-bottom));
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
}
.mgw-sheet .mgw-head {
  position: sticky; top: 0; z-index: 2;
  display: flex; flex-wrap: wrap; align-items: baseline; gap: 2px 10px;
  padding: 10px 12px 8px;
  background: color-mix(in srgb, var(--paper) 96%, transparent);
  border-bottom: 1px solid color-mix(in srgb, var(--gold) 45%, transparent);
}
.mgw-sheet .mgw-head h3 { margin: 0; font-family: var(--font-display); font-size: clamp(17px, 4.6vw, 20px); }
.mgw-sheet .mgw-sum { font-size: 12.5px; color: var(--ink-soft); font-variant-numeric: tabular-nums; }
.mgw-sheet .mgw-body { display: grid; gap: 10px; padding: 10px 12px 4px; }
.mgw-sheet .grid { grid-template-columns: repeat(auto-fill, minmax(min(100%, 170px), 1fr)); gap: 8px; }
.mgw-sheet .card {
  display: grid; gap: 4px; align-content: start;
  text-align: left; font-size: 13px; line-height: 1.45; color: var(--ink);
}
.mgw-sheet button.card {
  width: 100%; font-family: var(--font-body);
  cursor: pointer; box-shadow: 0 2px 0 var(--shadow);
}
.mgw-sheet button.card.is-on { outline: 2px solid var(--jade); }
.mgw-sheet button { min-height: 40px; font-size: 13.5px; }
.mgw-sheet button:disabled { opacity: 0.5; cursor: not-allowed; box-shadow: none; }
.mgw-sheet .card h4 { margin: 0; font-size: 14px; display: flex; flex-wrap: wrap; gap: 6px; align-items: baseline; }
.mgw-sheet .muted { font-size: 12.5px; }
.mgw-line { font-size: 12.5px; color: var(--ink-soft); font-variant-numeric: tabular-nums; }
.mgw-req { display: grid; gap: 2px; font-size: 12.5px; }
.mgw-req > span::before { display: inline-block; width: 1.1em; font-weight: 700; }
.mgw-req > .ok::before { content: "✓"; color: var(--jade); }
.mgw-req > .no::before { content: "✗"; color: var(--vermilion); }
.mgw-chip {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 1px 8px; border-radius: 999px; font-size: 11.5px; white-space: nowrap;
  background: color-mix(in srgb, var(--gold) 22%, transparent);
  border: 1px solid color-mix(in srgb, var(--gold) 55%, transparent);
}
.mgw-chip.is-on { background: var(--jade); border-color: var(--jade); color: #f6efe0; }
.mgw-chip.is-off { background: transparent; color: var(--ink-soft); }
.mgw-row { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
.mgw-actions { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 2px; }
.mgw-actions button { flex: 1 1 auto; }
.mgw-sheet select {
  font-family: var(--font-body); font-size: 13px; min-height: 36px;
  border-radius: 10px; padding: 4px 8px; width: 100%;
  border: 1px solid color-mix(in srgb, var(--gold) 60%, var(--ink));
  background: var(--paper); color: var(--ink);
}
.is-urgent { color: var(--vermilion); font-weight: 700; }
.mgw-empty { color: var(--ink-soft); font-size: 13px; padding: 6px 0; }
@media (max-width: 420px) {
  .sheet.mgw-sheet { left: 6px; right: 6px; bottom: 70px; max-height: 62vh; }
  .mgw-sheet .grid { grid-template-columns: repeat(auto-fill, minmax(min(100%, 150px), 1fr)); }
}
`;

const KIND_LABEL: Record<string, string> = {
  resident: "居民",
  custom: "定制",
  silk: "绸缎",
  group: "盛会",
};

const FLOWER_ORDER = new Map(FLOWERS.map((f, i) => [f.id, i]));

interface Built {
  el: HTMLElement;
  update: (state: GameState) => void;
}

interface Row<T> {
  el: HTMLElement;
  update: (item: T, state: GameState) => void;
}

let handlers: PanelHandlers | null = null;
let current: GameState | null = null;
let view: { id: Exclude<PanelId, null>; host: HTMLElement; built: Built } | null = null;

/** Workshop selection lives here so the 60fps repaint cannot wipe it. */
const pick = new Map<string, number>();
/** Per-order arrangement choice, keyed by order uid. */
const artChoice = new Map<string, string>();

function injectStyle(): void {
  if (typeof document === "undefined" || document.getElementById(STYLE_ID)) return;
  const tag = document.createElement("style");
  tag.id = STYLE_ID;
  tag.textContent = CSS;
  document.head?.append(tag);
}

function make<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className = "",
  text = "",
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

function setText(node: HTMLElement, text: string): void {
  if (node.textContent !== text) node.textContent = text;
}

function refresh(): void {
  if (view && current) view.built.update(current);
}

/** Runs a handler then repaints immediately, so a click feels instant even between frames. */
function act(run: (h: PanelHandlers) => void): void {
  if (!handlers) return;
  run(handlers);
  refresh();
}

function reconcile<T>(
  container: HTMLElement,
  items: T[],
  keyOf: (item: T) => string,
  create: (item: T) => Row<T>,
  cache: Map<string, Row<T>>,
  state: GameState,
): void {
  const keys = items.map(keyOf);
  const sig = keys.join("|");
  if (container.dataset.sig !== sig) {
    const rows: HTMLElement[] = [];
    for (const item of items) {
      const key = keyOf(item);
      let row = cache.get(key);
      if (!row) {
        row = create(item);
        cache.set(key, row);
      }
      rows.push(row.el);
    }
    for (const key of [...cache.keys()]) {
      if (!keys.includes(key)) cache.delete(key);
    }
    container.replaceChildren(...rows);
    container.dataset.sig = sig;
  }
  for (const item of items) cache.get(keyOf(item))?.update(item, state);
}

function shell(title: string): { el: HTMLElement; body: HTMLElement; sum: HTMLElement } {
  const el = make("section", "sheet mgw-sheet");
  const head = make("div", "mgw-head");
  head.append(make("h3", "", title));
  const sum = make("span", "mgw-sum");
  head.append(sum);
  const body = make("div", "mgw-body");
  el.append(head, body);
  return { el, body, sum };
}

function stars(n: number): string {
  return "★".repeat(n);
}

function seasonName(season: string): string {
  return { spring: "春", summer: "夏", autumn: "秋", winter: "冬" }[season] ?? season;
}

function inventoryList(state: GameState): { id: string; n: number }[] {
  return Object.entries(state.inventory)
    .filter(([, n]) => n > 0)
    .map(([id, n]) => ({ id, n }))
    .sort((a, b) => (FLOWER_ORDER.get(a.id) ?? 99) - (FLOWER_ORDER.get(b.id) ?? 99));
}

function flowerName(id: string): string {
  return FLOWER_MAP[id]?.name ?? id;
}

// ---------------------------------------------------------------- 花种匣

function buildSeed(): Built {
  const { el, body, sum } = shell("花种匣");
  const grid = make("div", "grid");
  body.append(grid);
  const cache = new Map<string, Row<(typeof FLOWERS)[number]>>();

  const create = (f: (typeof FLOWERS)[number]): Row<(typeof FLOWERS)[number]> => {
    const card = make("button", "card");
    card.type = "button";
    const title = make("h4");
    const name = make("span", "", f.name);
    const rarity = make("span", "mgw-chip", stars(f.rarity));
    const seasonTag = make("span", "mgw-chip");
    title.append(name, rarity, seasonTag);
    const lore = make("div", "muted", f.lore);
    const cost = make("div", "mgw-line");
    const note = make("div", "mgw-line");
    card.append(title, lore, cost, note);
    card.addEventListener("click", () => act((h) => h.plant(f.id)));
    return {
      el: card,
      update: (def, state) => {
        const unlocked = state.unlockedFlowers.includes(def.id);
        const inSeason = def.season === state.season;
        const rich = state.coins >= def.seedCost;
        const free = state.plots.some((p) => p.stage === "empty");
        setText(seasonTag, `${seasonName(def.season)}${inSeason ? " 当季" : ""}`);
        seasonTag.classList.toggle("is-on", inSeason);
        setText(cost, `${def.seedCost} 金 · 约 ${Math.round(def.growMs / 1000)} 秒 · 需水 ${def.waterNeed}`);
        const reason = !unlocked
          ? `${def.unlockLevel} 阶解锁`
          : !rich
            ? `还差 ${def.seedCost - state.coins} 金`
            : !free
              ? "暂无空圃"
              : inSeason
                ? "当季 · 生长 ×1.35"
                : "违时 · 生长 ×0.75";
        setText(note, reason);
        card.disabled = !unlocked || !rich || !free;
        card.title = `${def.name} · ${reason}`;
      },
    };
  };

  return {
    el,
    update: (state) => {
      const free = state.plots.filter((p) => p.stage === "empty").length;
      setText(sum, `空圃 ${free}/${state.plots.length} · 金 ${state.coins} · 已解锁 ${state.unlockedFlowers.length}/${FLOWERS.length}`);
      reconcile(grid, FLOWERS, (f) => f.id, create, cache, state);
    },
  };
}

// ---------------------------------------------------------------- 花坊订单

interface OrderReq {
  text: string;
  met: boolean;
}

function orderRequirements(order: ActiveOrder, state: GameState, art?: Arrangement): OrderReq[] {
  if (order.requireScore) {
    return [
      {
        text: art
          ? `作品评分 ≥ ${order.requireScore}（选中 ${art.name} · ${art.score} 分）`
          : `作品评分 ≥ ${order.requireScore}（尚无合意作品）`,
        met: Boolean(art && art.score >= order.requireScore),
      },
    ];
  }
  const ids = order.flowerIds ?? [];
  if (ids.length) {
    const need = new Map<string, number>();
    for (const id of ids) need.set(id, (need.get(id) ?? 0) + 1);
    return [...need].map(([id, n]) => {
      const have = state.inventory[id] ?? 0;
      return { text: `${flowerName(id)} ×${n}（库存 ${have}）`, met: have >= n };
    });
  }
  const count = order.flowerCount ?? 1;
  const kinds = inventoryList(state).length;
  return [{ text: `任意花材 ${count} 种（库存 ${kinds} 种）`, met: kinds >= count }];
}

function bestArrangement(state: GameState, order: ActiveOrder): Arrangement | undefined {
  const chosen = artChoice.get(order.uid);
  const hit = state.arrangements.find((a) => a.id === chosen);
  if (hit) return hit;
  const need = order.requireScore ?? 0;
  const sorted = [...state.arrangements].sort((a, b) => b.score - a.score);
  return sorted.find((a) => a.score >= need) ?? sorted[0];
}

function buildOrder(): Built {
  const { el, body, sum } = shell("花坊订单");
  const grid = make("div", "grid");
  const empty = make("p", "mgw-empty", "客人正在路上……");
  body.append(grid, empty);
  const cache = new Map<string, Row<ActiveOrder>>();

  const create = (order: ActiveOrder): Row<ActiveOrder> => {
    const card = make("div", "card");
    const title = make("h4");
    const name = make("span", "", order.title);
    const kind = make("span", "mgw-chip", KIND_LABEL[order.kind] ?? order.kind);
    title.append(name, kind);
    const hint = make("div", "muted", order.hint);
    const req = make("div", "mgw-req");
    const picker = make("select");
    picker.addEventListener("change", () => {
      artChoice.set(order.uid, picker.value);
      refresh();
    });
    const reward = make("div", "mgw-line");
    const timer = make("div", "mgw-line");
    const actions = make("div", "mgw-actions");
    const ok = make("button", "", "交付");
    ok.type = "button";
    const no = make("button", "", "婉拒");
    no.type = "button";
    no.title = "婉拒会损 4 点口碑";
    actions.append(ok, no);
    card.append(title, hint, req, picker, reward, timer, actions);

    ok.addEventListener("click", () => {
      const state = current;
      const art = state && order.requireScore ? bestArrangement(state, order) : undefined;
      artChoice.delete(order.uid);
      act((h) => h.fulfill(order.uid, art?.id));
    });
    no.addEventListener("click", () => {
      artChoice.delete(order.uid);
      act((h) => h.cancel(order.uid));
    });

    const reqRows: HTMLElement[] = [];
    return {
      el: card,
      update: (o, state) => {
        const art = o.requireScore ? bestArrangement(state, o) : undefined;
        const rows = orderRequirements(o, state, art);
        while (reqRows.length < rows.length) {
          const line = make("span");
          reqRows.push(line);
          req.append(line);
        }
        while (reqRows.length > rows.length) reqRows.pop()?.remove();
        rows.forEach((r, i) => {
          const line = reqRows[i];
          if (!line) return;
          setText(line, r.text);
          line.className = r.met ? "ok" : "no";
        });

        if (o.requireScore) {
          const sig = state.arrangements.map((a) => `${a.id}:${a.score}`).join(",");
          if (picker.dataset.sig !== sig) {
            picker.dataset.sig = sig;
            picker.replaceChildren(
              ...state.arrangements.map((a) => {
                const opt = make("option", "", `${a.name} · ${a.score} 分`);
                opt.value = a.id;
                return opt;
              }),
            );
            if (!state.arrangements.length) {
              const opt = make("option", "", "尚无作品，先去花艺作坊");
              opt.value = "";
              picker.append(opt);
            }
          }
          if (art && picker.value !== art.id) picker.value = art.id;
          picker.disabled = state.arrangements.length === 0;
          picker.hidden = false;
        } else {
          picker.hidden = true;
        }

        setText(reward, `酬劳 +${o.coin} 金 · +${o.exp} 阅历 · +${o.waterReward} 水 · 口碑 +1`);
        const left = Math.max(0, Math.ceil((o.dueAt - state.now) / 1000));
        setText(timer, `余 ${left} 秒`);
        timer.classList.toggle("is-urgent", left <= 15);
        const ready = rows.every((r) => r.met);
        ok.disabled = !ready;
        ok.title = ready ? "交付这单" : `尚缺：${rows.filter((r) => !r.met).map((r) => r.text).join("；")}`;
      },
    };
  };

  return {
    el,
    update: (state) => {
      const orders = [...state.orders].sort((a, b) => a.dueAt - b.dueAt);
      const ready = orders.filter((o) => orderRequirements(o, state, bestArrangement(state, o)).every((r) => r.met)).length;
      setText(sum, `在手 ${orders.length} 单 · 可交付 ${ready} · 口碑 ${state.reputation}`);
      empty.hidden = orders.length > 0;
      reconcile(grid, orders, (o) => o.uid, create, cache, state);
    },
  };
}

// ---------------------------------------------------------------- 花艺作坊

function pickedIds(): string[] {
  const out: string[] = [];
  for (const [id, n] of pick) {
    for (let i = 0; i < n; i++) out.push(id);
  }
  return out;
}

function pickedCount(): number {
  let n = 0;
  for (const v of pick.values()) n += v;
  return n;
}

function clampPick(state: GameState): void {
  for (const [id, n] of [...pick]) {
    const owned = state.inventory[id] ?? 0;
    if (owned <= 0) pick.delete(id);
    else if (n > owned) pick.set(id, owned);
  }
}

/** One tap adds a stem; tapping past the last stem clears that flower again. */
function cyclePick(id: string, owned: number): void {
  const cur = pick.get(id) ?? 0;
  const room = 4 - pickedCount();
  if (owned <= 0) return;
  if (cur < owned && room > 0) pick.set(id, cur + 1);
  else pick.delete(id);
}

function buildWorkshop(): Built {
  const { el, body, sum } = shell("花艺作坊");
  const tip = make("p", "muted", "点选花材加入，再点一次可继续加枝或取消；凑齐 2-4 枝后择器成作。");
  const bag = make("div", "mgw-row");
  const bagEmpty = make("p", "mgw-empty", "库存空空，先去花圃收获。");
  const picked = make("div", "mgw-line");
  const vases = make("div", "grid");
  const shelf = make("div", "mgw-line");
  const clear = make("button", "", "清空所选");
  clear.type = "button";
  clear.addEventListener("click", () => {
    pick.clear();
    refresh();
  });
  const tools = make("div", "mgw-actions");
  tools.append(clear);
  body.append(tip, bag, bagEmpty, picked, tools, vases, shelf);

  const bagCache = new Map<string, Row<{ id: string; n: number }>>();
  const createChip = (item: { id: string; n: number }): Row<{ id: string; n: number }> => {
    const btn = make("button");
    btn.type = "button";
    btn.addEventListener("click", () => {
      const owned = current?.inventory[item.id] ?? 0;
      cyclePick(item.id, owned);
      refresh();
    });
    return {
      el: btn,
      update: (it) => {
        const n = pick.get(it.id) ?? 0;
        setText(btn, n ? `${flowerName(it.id)} ×${it.n} · 选 ${n}` : `${flowerName(it.id)} ×${it.n}`);
        btn.classList.toggle("is-on", n > 0);
        btn.setAttribute("aria-pressed", n > 0 ? "true" : "false");
        btn.title = n ? "再点一次加枝，满则取消" : "点选加入作品";
      },
    };
  };

  const vaseCache = new Map<string, Row<(typeof VASES)[number]>>();
  const createVase = (v: (typeof VASES)[number]): Row<(typeof VASES)[number]> => {
    const btn = make("button", "card");
    btn.type = "button";
    const title = make("h4", "", `${v.name}`);
    const line = make("div", "mgw-line");
    btn.append(title, line);
    btn.addEventListener("click", () => {
      const ids = pickedIds();
      if (ids.length < 2 || ids.length > 4) return;
      pick.clear();
      act((h) => h.craft(v.id, ids));
    });
    return {
      el: btn,
      update: (def, state) => {
        const ids = pickedIds();
        const usable = ids.length >= 2 && ids.length <= 4;
        const score = usable ? scoreArrangement(ids, def.id, state.season) : 0;
        setText(line, usable ? `器加 ${def.bonus} · 预计 ${score} 分${score >= 85 ? " · 精品" : ""}` : `器加 ${def.bonus} · 需 2-4 枝`);
        btn.disabled = !usable;
        btn.classList.toggle("is-on", usable && score >= 85);
      },
    };
  };

  return {
    el,
    update: (state) => {
      clampPick(state);
      const stock = inventoryList(state);
      bagEmpty.hidden = stock.length > 0;
      reconcile(bag, stock, (i) => i.id, createChip, bagCache, state);
      const ids = pickedIds();
      const label = ids.length
        ? [...pick].map(([id, n]) => `${flowerName(id)}×${n}`).join("·")
        : "尚未拣选";
      setText(picked, `已选 ${ids.length}/4 · ${label}`);
      clear.disabled = ids.length === 0;
      reconcile(vases, [...VASES], (v) => v.id, createVase, vaseCache, state);
      setText(
        sum,
        `库存 ${stock.length} 种 · 陈列 ${state.arrangements.length} 件`,
      );
      setText(
        shelf,
        state.arrangements.length
          ? `陈列：${state.arrangements.map((a) => `${a.name}(${a.score})`).join("，")}`
          : "陈列：空，成作后可交付定制订单。",
      );
    },
  };
}

// ---------------------------------------------------------------- 庭院装扮

function buildDecor(): Built {
  const { el, body, sum } = shell("庭院装扮");
  const grid = make("div", "grid");
  const themeTitle = make("div", "mgw-line", "成套主题");
  const themes = make("div", "mgw-actions");
  body.append(grid, themeTitle, themes);

  const cache = new Map<string, Row<(typeof DECORATIONS)[number]>>();
  const create = (d: (typeof DECORATIONS)[number]): Row<(typeof DECORATIONS)[number]> => {
    const btn = make("button", "card");
    btn.type = "button";
    const title = make("h4");
    const name = make("span", "", `${d.glyph} ${d.name}`);
    const owned = make("span", "mgw-chip");
    title.append(name, owned);
    const cost = make("div", "mgw-line", `${d.cost} 金 / ${d.fragmentCost} 碎片 · 心情 +${d.mood}`);
    const note = make("div", "mgw-line");
    btn.append(title, cost, note);
    btn.addEventListener("click", () => act((h) => h.place(d.id)));
    return {
      el: btn,
      update: (def, state) => {
        const st = decorStatus(state, def.id);
        if (!st) return;
        setText(owned, st.placed ? "已置" : st.locked ? "未解锁" : "未置");
        owned.classList.toggle("is-on", st.placed);
        owned.classList.toggle("is-off", !st.placed);
        setText(note, st.reason);
        btn.disabled = !st.canPlace;
        btn.classList.toggle("is-on", st.placed);
        btn.title = `${def.name} · ${st.reason}`;
      },
    };
  };

  const themeCache = new Map<string, Row<(typeof THEMES)[number]>>();
  const createTheme = (t: (typeof THEMES)[number]): Row<(typeof THEMES)[number]> => {
    const btn = make("button");
    btn.type = "button";
    btn.addEventListener("click", () => act((h) => h.theme(t.id)));
    return {
      el: btn,
      update: (def, state) => {
        const st = themeStatus(state, def.id);
        if (!st) return;
        setText(btn, st.done ? `${st.name} 已齐 ${st.placed}/${st.total}` : `套用${st.name} ${st.placed}/${st.total}`);
        btn.classList.toggle("is-on", st.done);
        btn.disabled = st.done;
        btn.title = st.done ? `${st.name}已齐备` : `还缺：${st.missing.map((m) => m.name).join("、")}`;
      },
    };
  };

  return {
    el,
    update: (state) => {
      const s = decorSummary(state);
      setText(sum, `已置 ${s.placed}/${s.total} · 订单加成 +${Math.round(s.mood * 100)}% · 碎片 ${state.fragments} · 金 ${state.coins}`);
      reconcile(grid, DECORATIONS, (d) => d.id, create, cache, state);
      reconcile(themes, [...THEMES], (t) => t.id, createTheme, themeCache, state);
    },
  };
}

// ---------------------------------------------------------------- 花灵

function buildSpirit(): Built {
  const { el, body, sum } = shell("花灵");
  const off = make("button", "", "暂不请灵");
  off.type = "button";
  off.addEventListener("click", () => act((h) => h.spirit(null)));
  const offRow = make("div", "mgw-actions");
  offRow.append(off);
  const grid = make("div", "grid");
  body.append(offRow, grid);

  const cache = new Map<string, Row<(typeof SPIRITS)[number]>>();
  const create = (s: (typeof SPIRITS)[number]): Row<(typeof SPIRITS)[number]> => {
    const btn = make("button", "card");
    btn.type = "button";
    const title = make("h4");
    const name = make("span", "", s.name);
    const badge = make("span", "mgw-chip");
    title.append(name, badge);
    const line = make("div", "muted", s.line);
    const effects = make("div", "mgw-row");
    for (const text of spiritEffects(s)) effects.append(make("span", "mgw-chip", text));
    const note = make("div", "mgw-line");
    btn.append(title, line, effects, note);
    btn.addEventListener("click", () => act((h) => h.spirit(s.id)));
    return {
      el: btn,
      update: (def, state) => {
        const st = spiritStatus(state, def.id);
        if (!st) return;
        setText(badge, st.active ? "已请" : st.unlocked ? "可请" : "沉睡");
        badge.classList.toggle("is-on", st.active);
        badge.classList.toggle("is-off", !st.unlocked);
        setText(
          note,
          st.active ? "正伴你左右，再点其他花灵可换。" : st.unlocked ? "点此请灵入园" : `还需 ${st.levelsLeft} 阶（${def.unlockLevel} 阶苏醒）`,
        );
        btn.disabled = !st.unlocked;
        btn.classList.toggle("is-on", st.active);
      },
    };
  };

  return {
    el,
    update: (state) => {
      const now = activeSpirit(state);
      setText(
        sum,
        `当前：${now ? `${now.name}（${spiritEffects(now).join(" · ")}）` : "未请灵"} · 已苏醒 ${state.unlockedSpirits.length}/${SPIRITS.length}`,
      );
      off.classList.toggle("is-on", !state.activeSpirit);
      off.disabled = !state.activeSpirit;
      reconcile(grid, SPIRITS, (s) => s.id, create, cache, state);
    },
  };
}

// ---------------------------------------------------------------- 花材库存

function buildBag(): Built {
  const { el, body, sum } = shell("花材库存");
  const grid = make("div", "grid");
  const empty = make("p", "mgw-empty", "匣中空空，去花圃收获几枝吧。");
  const stats = make("p", "mgw-line");
  body.append(grid, empty, stats);

  const cache = new Map<string, Row<{ id: string; n: number }>>();
  const create = (item: { id: string; n: number }): Row<{ id: string; n: number }> => {
    const card = make("div", "card");
    const title = make("h4");
    const name = make("span", "", flowerName(item.id));
    const count = make("span", "mgw-chip");
    title.append(name, count);
    const line = make("div", "mgw-line");
    card.append(title, line);
    const def = FLOWER_MAP[item.id];
    setText(line, def ? `${seasonName(def.season)} · ${stars(def.rarity)} · 售 ${def.harvestCoin} 金` : "野花一枝");
    return {
      el: card,
      update: (it) => setText(count, `×${it.n}`),
    };
  };

  return {
    el,
    update: (state) => {
      const stock = inventoryList(state);
      const total = stock.reduce((n, i) => n + i.n, 0);
      empty.hidden = stock.length > 0;
      setText(sum, `${stock.length} 种 · 共 ${total} 枝`);
      reconcile(grid, stock, (i) => i.id, create, cache, state);
      setText(
        stats,
        `已收获 ${state.stats.harvested} · 已播种 ${state.stats.planted} · 交付 ${state.stats.ordersDone} · 婉拒 ${state.stats.cancelled} · 陈列 ${state.arrangements.length} 件`,
      );
    },
  };
}

const BUILDERS: Record<Exclude<PanelId, null>, () => Built> = {
  seed: buildSeed,
  order: buildOrder,
  workshop: buildWorkshop,
  decor: buildDecor,
  spirit: buildSpirit,
  bag: buildBag,
};

export function renderPanel(
  host: HTMLElement,
  id: PanelId,
  state: GameState,
  panelHandlers: PanelHandlers,
): void {
  handlers = panelHandlers;
  current = state;
  injectStyle();
  if (!id) {
    host.replaceChildren();
    view = null;
    return;
  }
  if (!view || view.id !== id || view.host !== host || !host.contains(view.built.el)) {
    const built = BUILDERS[id]();
    view = { id, host, built };
    host.replaceChildren(built.el);
  }
  view.built.update(state);
}
