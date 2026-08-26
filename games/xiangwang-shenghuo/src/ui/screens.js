import { CROPS, ITEM_NAMES, GUESTS, BUILDINGS, RECIPES, ANIMALS } from "../data/index.js";
import { recipesByBuilding, recipeById } from "../data/recipes.js";
import { levelProgress, TUTORIAL_TOTAL } from "../core/engine.js";

const seasonName = { spring: "春", summer: "夏", autumn: "秋", winter: "冬" };
const RES_KEYS = new Set(["coin", "pearl", "shovel", "axe", "saw"]);
const SEED_KEYS = 6;
const TOAST_MS = 2600;

/** 新手引导四步：翻土 → 播种 → 收获 → 进屋看看 */
export const TUTORIAL = [
  { title: "第一步 · 翻土", text: "田里那块深色的是荒地。点它一下，把土翻松。", hint: "till" },
  { title: "第二步 · 撒种", text: "先在下面挑一种作物（键盘 1-6 也行），再点棕色的空地。", hint: "plant" },
  { title: "第三步 · 收获", text: "地块下面的小条走满就熟了，再点一下收进背包。", hint: "harvest" },
  { title: "第四步 · 串门", text: "点村里的「心愿屋」或「磨坊」，看看今天能换点什么。", hint: "open" },
];

export function phaseOf(minutes) {
  const h = Math.floor(minutes / 60) % 24;
  if (h >= 19 || h < 5) return "night";
  if (h >= 16) return "dusk";
  return "day";
}

/* ---------- 小工具 ---------- */

const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

const clamp01 = (n) => (n < 0 ? 0 : n > 1 ? 1 : n);
const itemName = (id) => ITEM_NAMES[id] || id;

function setText(node, text) {
  if (node && node.textContent !== text) node.textContent = text;
}

/** 只有内容真的变了才重建，避免每帧把用户正在点的按钮换掉 */
function setHtml(node, html) {
  if (node && node.__sig !== html) {
    node.innerHTML = html;
    node.__sig = html;
  }
}

/**
 * 进度与倒计时不进 HTML 签名，改成每帧直接写 style/textContent，
 * 这样按钮不会在 mousedown 和 mouseup 之间被换掉。
 */

function fromHtml(html) {
  const tpl = document.createElement("template");
  tpl.innerHTML = html.trim();
  return tpl.content.firstElementChild;
}

function secs(ms) {
  const s = Math.max(0, Math.ceil(ms / 1000));
  if (s < 60) return `${s}秒`;
  return `${Math.floor(s / 60)}分${String(s % 60).padStart(2, "0")}秒`;
}

function bar(key, pct) {
  return `<span class="xw-bar"><i data-prog="${key}" style="width:${pct.toFixed(1)}%"></i></span>`;
}

function costEntries(cost = {}) {
  return Object.entries(cost).map(([k, v]) => `${itemName(k)}×${v}`).join("、");
}

function missingCost(state, cost = {}) {
  const out = [];
  for (const [k, v] of Object.entries(cost)) {
    const have = RES_KEYS.has(k) ? state.resources[k] || 0 : state.inv[k] || 0;
    if (have < v) out.push(`${itemName(k)}×${v - have}`);
  }
  return out;
}

function missingInputs(state, inputs = {}) {
  return Object.entries(inputs)
    .filter(([id, n]) => (state.inv[id] || 0) < n)
    .map(([id, n]) => `${itemName(id)}×${n - (state.inv[id] || 0)}`);
}

function jobTotalMs(job) {
  const recipe = recipeById(job.recipeId);
  if (recipe) return recipe.timeMs;
  const animal = ANIMALS.find((a) => a.id === job.recipeId);
  return animal ? animal.cycleMs : 10_000;
}

function jobLabel(job) {
  const recipe = recipeById(job.recipeId);
  if (recipe) return recipe.name;
  const animal = ANIMALS.find((a) => a.id === job.recipeId);
  return animal ? `${animal.name}·${itemName(animal.productId)}` : job.recipeId;
}

function doneCount(state, buildingId) {
  return (state.jobs || []).filter((j) => j.buildingId === buildingId && j.status === "done").length;
}

function deliverableWishes(state) {
  return (state.wishes || []).filter((w) =>
    Object.entries(w.needs).every(([id, n]) => (state.inv[id] || 0) >= n),
  );
}

function plotProgress(plot, now) {
  if (plot.status === "ready") return 1;
  if (plot.status !== "growing") return 0;
  const total = plot.doneAt - plot.plantedAt;
  if (!total || total <= 0) return 1;
  return clamp01((now - plot.plantedAt) / total);
}

/* ---------- 骨架 ---------- */

const SKELETON = `
  <header class="topbar">
    <div class="brand">蘑菇屋 · 慢生活</div>
    <div class="meters">
      <span data-ref="clock"></span>
      <span class="xw-level" title="经验">
        <b data-ref="level"></b>
        <span class="xw-bar xw-bar-xp"><i data-prog="xp" style="width:0%"></i></span>
      </span>
      <span data-ref="coin"></span>
      <span data-ref="happy"></span>
      <span data-ref="warmth"></span>
      <span data-ref="pop"></span>
      <button class="xw-topbtn" data-act="mute" data-ref="mute" title="M 键切换"></button>
      <button class="xw-topbtn" data-act="save" title="S 键保存">记下这一天</button>
    </div>
  </header>
  <section class="village">
    <div class="sky"></div>
    <div class="mountain"></div>
    <div class="ground"></div>
    <button class="mushroom" data-act="select" data-id="mushroom" title="蘑菇屋">
      <div class="cap"></div><div class="stem"></div><div class="door"></div>
      <span class="xw-roof">蘑菇屋</span>
    </button>
    <div class="buildings" data-ref="buildings"></div>
    <div class="fields" data-ref="fields"></div>
    <div class="xw-scene-tip" data-ref="sceneTip"></div>
  </section>
  <section class="dock">
    <div class="xw-toolbar" data-ref="toolbar"></div>
    <article class="panel" id="detail" data-ref="detail"></article>
    <article class="panel" data-ref="side"></article>
  </section>
  <div class="xw-toast" data-ref="toast" role="status" aria-live="polite"></div>
  <aside class="xw-tut" data-ref="tut" hidden>
    <div class="xw-steps" data-ref="tutDots"></div>
    <h3 data-ref="tutTitle"></h3>
    <p data-ref="tutText"></p>
    <button class="xw-topbtn" data-act="tutskip">我知道了，先自己逛逛</button>
  </aside>
`;

function mount(root) {
  root.innerHTML = SKELETON;
  const refs = { root, handlers: {} };
  root.querySelectorAll("[data-ref]").forEach((node) => {
    refs[node.dataset.ref] = node;
  });

  root.addEventListener("click", (ev) => {
    const btn = ev.target.closest("[data-act]");
    if (!btn || !root.contains(btn)) return;
    const h = refs.handlers;
    const { act, id, b } = btn.dataset;
    const call = (fn, ...args) => typeof fn === "function" && fn(...args);
    if (act === "seed") call(h.setSeed, id);
    else if (act === "plot") call(h.onPlot, id);
    else if (act === "expand") call(h.expand);
    else if (act === "select") call(h.select, id);
    else if (act === "deliver") call(h.deliver, id);
    else if (act === "skipwish") call(h.skipWish, id);
    else if (act === "invite") call(h.invite, id);
    else if (act === "build") call(h.build, id);
    else if (act === "enq") call(h.enqueue, b, id);
    else if (act === "collect") call(h.collect, b);
    else if (act === "collectall") call(h.collectAll);
    else if (act === "unlock") call(h.unlock, b);
    else if (act === "feed") call(h.feed, b);
    else if (act === "cook") call(h.cook, id);
    else if (act === "pet") call(h.pet, id);
    else if (act === "mute") call(h.toggleMute);
    else if (act === "save") call(h.save);
    else if (act === "tutskip") call(h.skipTutorial);
  });

  return refs;
}

/* ---------- 主渲染 ---------- */

export function render(root, state, handlers, now = Date.now()) {
  if (!root) return;
  if (!root.__refs) root.__refs = mount(root);
  const refs = root.__refs;
  refs.handlers = handlers || {};

  const ui = state.ui || {};
  const step = state.meta.tutorialStep || 0;
  const tutHint = step < TUTORIAL_TOTAL ? TUTORIAL[step]?.hint : null;
  const hour = Math.floor(state.meta.gameMinutes / 60) % 24;
  const minute = Math.floor(state.meta.gameMinutes % 60);
  const phase = phaseOf(state.meta.gameMinutes);
  const progress = new Map();
  const times = new Map();

  root.dataset.season = state.meta.season;
  root.dataset.phase = phase;

  /* 顶栏 */
  const lv = levelProgress(state.meta.xp);
  setText(refs.clock, `${seasonName[state.meta.season]} 第${state.meta.day}日 ${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`);
  setText(refs.level, `Lv.${state.meta.level}${lv.next === null ? "" : ` ${Math.round(state.meta.xp)}/${lv.next}`}`);
  progress.set("xp", lv.pct);
  setText(refs.coin, `金币 ${state.resources.coin}`);
  setText(refs.happy, `幸福 ${state.resources.happiness}`);
  setText(refs.warmth, `温馨 ${state.resources.warmth}`);
  setText(refs.pop, `人口 ${state.resources.pop}/${state.resources.popCap}`);
  setText(refs.mute, state.meta.muted ? "声音：关" : "声音：开");

  renderFields(refs, state, ui, tutHint, now, progress, times);
  renderBuildings(refs, state, ui, tutHint);
  renderToolbar(refs, state, ui, tutHint, now, times);
  renderDetail(refs, state, ui, now, progress, times);
  renderSide(refs, state);
  renderTutorial(refs, state, step);
  renderToast(refs, ui, now);

  setText(refs.sceneTip, sceneTip(state, step));

  for (const node of root.querySelectorAll("[data-prog]")) {
    const pct = progress.get(node.dataset.prog);
    if (pct != null) node.style.width = `${pct.toFixed(1)}%`;
  }
  for (const node of root.querySelectorAll("[data-time]")) {
    const text = times.get(node.dataset.time);
    if (text != null) setText(node, text);
  }
}

function sceneTip(state, step) {
  if (step < TUTORIAL_TOTAL) return "";
  const ready = state.plots.filter((p) => p.status === "ready").length;
  const done = (state.jobs || []).filter((j) => j.status === "done").length;
  const wish = deliverableWishes(state).length;
  const bits = [];
  if (ready) bits.push(`${ready} 块地熟了`);
  if (done) bits.push(`${done} 件活做好了`);
  if (wish) bits.push(`${wish} 个心愿能交`);
  return bits.join(" · ");
}

/* ---------- 田地 ---------- */

function renderFields(refs, state, ui, tutHint, now, progress, times) {
  const hintTill = tutHint === "till";
  const hintPlant = tutHint === "plant";
  const hintHarvest = tutHint === "harvest";
  const html = state.plots
    .map((p) => {
      const crop = CROPS.find((c) => c.id === p.cropId);
      const name =
        p.status === "growing" || p.status === "ready" ? crop?.name || "作物" : p.status === "empty" ? "空地" : p.status === "untilled" ? "荒地" : "枯地";
      const hint =
        (hintTill && (p.status === "untilled" || p.status === "wilted")) ||
        (hintPlant && p.status === "empty") ||
        (hintHarvest && p.status === "ready");
      const title =
        p.status === "untilled" || p.status === "wilted" ? "点一下翻土" : p.status === "empty" ? "点一下播种" : p.status === "ready" ? "点一下收获" : "长着呢";
      return `<button class="plot ${p.status}${hint ? " xw-hint" : ""}" data-act="plot" data-id="${p.id}" title="${title}">
        <span class="xw-plot-name">${esc(name)}${p.greenhouse ? "🏠" : ""}</span>
        <span class="xw-plot-time" data-time="${p.id}"></span>
        ${bar(p.id, 0)}
      </button>`;
    })
    .join("");
  setHtml(
    refs.fields,
    `${html}<button class="plot empty xw-expand" data-act="expand" title="40 金币 + 1 把锹">+ 开垦</button>`,
  );

  for (const p of state.plots) {
    progress.set(p.id, plotProgress(p, now) * 100);
    times.set(p.id, p.status === "growing" ? secs(p.doneAt - now) : p.status === "ready" ? "可收" : "");
  }
}

/* ---------- 村里的房子 ---------- */

function visibleBuildings(state) {
  const level = state.meta.level;
  return BUILDINGS.filter((b) => b.id !== "mushroom").filter(
    (b) => state.buildings[b.id]?.built || b.unlockLevel <= level + 1,
  );
}

function renderBuildings(refs, state, ui, tutHint) {
  const list = visibleBuildings(state);
  const hidden = BUILDINGS.length - 1 - list.length;
  const html =
    list
      .map((b) => {
        const on = state.buildings[b.id]?.built;
        const hint = tutHint === "open" && (b.id === "wish" || b.id === "mill");
        const cls = ["bldg", on ? "" : "off", ui.selected === b.id ? "is-open" : "", hint ? "xw-hint" : ""]
          .filter(Boolean)
          .join(" ");
        return `<button class="${cls}" data-act="select" data-id="${b.id}" title="${on ? "进去看看" : `Lv.${b.unlockLevel} · ${costEntries(b.cost)}`}">
          <span>${esc(b.name)}</span>
          <span class="xw-sub">${on ? "" : `Lv.${b.unlockLevel} 未建`}</span>
          <span class="xw-badge" data-badge="${b.id}" hidden></span>
        </button>`;
      })
      .join("") +
    `<button class="bldg xw-more${ui.selected === "__build" ? " is-open" : ""}" data-act="select" data-id="__build">图纸本${hidden > 0 ? ` +${hidden}` : ""}</button>`;
  setHtml(refs.buildings, html);

  for (const node of refs.buildings.querySelectorAll("[data-badge]")) {
    const id = node.dataset.badge;
    const n = id === "wish" ? deliverableWishes(state).length : doneCount(state, id);
    setText(node, n > 0 ? String(n) : "");
    node.hidden = n === 0;
  }
}

/* ---------- 常驻工具条 ---------- */

function renderToolbar(refs, state, ui, tutHint, now, times) {
  const seed = ui.seed || "rice";
  const seeds = CROPS.map((c, i) => {
    const off = !c.seasons.includes(state.meta.season);
    const poor = state.resources.coin < c.seedCost;
    const cls = ["xw-seed", c.id === seed ? "is-on" : "", off ? "off-season" : "", poor ? "is-poor" : ""].filter(Boolean).join(" ");
    const key = i < SEED_KEYS ? `<span class="k">${i + 1}</span>` : "";
    return `<button class="${cls}" data-act="seed" data-id="${c.id}" aria-pressed="${c.id === seed}" title="${c.seedCost} 金币 · ${off ? "反季，长得慢" : "当季"}">
      ${key}${esc(c.name)}<span class="xw-price">${c.seedCost}</span>
    </button>`;
  }).join("");

  const readyPet = (state.pets || []).some((p) => !p.readyAt || p.readyAt <= now);
  const doneAll = (state.jobs || []).filter((j) => j.status === "done").length;
  const html = `
    <div class="xw-seedrow${tutHint === "plant" ? " xw-hint" : ""}">
      <span class="xw-label">种子</span>${seeds}
    </div>
    <div class="xw-quick">
      <button class="xw-topbtn" data-act="expand">开垦新地（40金 + 锹）</button>
      <button class="xw-topbtn" data-act="pet">${readyPet ? "逗逗宠物" : "宠物在打盹"}</button>
      <button class="xw-topbtn" data-act="collectall"${doneAll ? "" : " disabled"}>收走做好的${doneAll ? `（${doneAll}）` : ""}</button>
      <span class="ghost xw-keys">键盘：1-6 选种子 · S 记下这一天 · M 静音 · Esc 关面板</span>
    </div>`;
  setHtml(refs.toolbar, html);
}

/* ---------- 右侧：背包 / 闲话 / 客人 ---------- */

function renderSide(refs, state) {
  const inv = Object.entries(state.inv || {}).filter(([, n]) => n > 0);
  const invHtml = inv.length
    ? inv.map(([id, n]) => `<span class="xw-chip">${esc(itemName(id))}<b>${n}</b></span>`).join("")
    : `<span class="ghost">口袋空空，去田里走走。</span>`;
  const guestHtml = GUESTS.map((g) => {
    const here = (state.guests || []).some((x) => x.id === g.id);
    return `<button class="xw-topbtn${here ? " is-on" : ""}" data-act="invite" data-id="${g.id}" title="${esc(g.specialty)} · 爱吃${esc(itemName(g.favorite))}">
      ${here ? "✓ " : "请"}${esc(g.name)}
    </button>`;
  }).join("");
  setHtml(
    refs.side,
    `<h2>背包</h2>
     <div class="xw-inv">${invHtml}</div>
     <h2>请谁来住几天</h2>
     <div class="row">${guestHtml}</div>
     <h2>村里的闲话</h2>
     <ul class="log">${(state.log || []).slice(0, 8).map((l) => `<li>${esc(l)}</li>`).join("")}</ul>`,
  );
}

/* ---------- 左侧：上下文面板 ---------- */

function renderDetail(refs, state, ui, now, progress, times) {
  const id = ui.selected || "wish";
  let html;
  if (id === "mushroom") html = detailMushroom(state, now, progress, times);
  else if (id === "wish") html = detailWish(state);
  else if (id === "__build") html = detailBuildList(state);
  else html = detailBuilding(state, id, now, progress, times);
  setHtml(refs.detail, html);
}

function detailMushroom(state, now, progress, times) {
  const kitchen = state.buildings.kitchen?.built;
  const recipes = recipesByBuilding("kitchen");
  const guests = (state.guests || []).map((g) => GUESTS.find((x) => x.id === g.id)).filter(Boolean);
  const cookRows = recipes
    .map((r) => {
      const lack = missingInputs(state, r.inputs);
      const gate = state.meta.level < r.unlockLevel;
      return `<div class="xw-line">
        <span><b>${esc(r.name)}</b><span class="ghost"> 需 ${esc(costEntries(r.inputs))}</span></span>
        <button class="xw-topbtn" data-act="cook" data-id="${r.id}"${lack.length || gate || !kitchen ? " disabled" : ""}>
          ${gate ? `Lv.${r.unlockLevel}` : lack.length ? `差 ${esc(lack.join("、"))}` : "开火"}
        </button>
      </div>`;
    })
    .join("");
  const petRows = (state.pets || [])
    .map((p) => {
      const rest = (p.readyAt || 0) - now;
      if (rest > 0) times.set(`pet_${p.id}`, `歇会儿 ${secs(rest)}`);
      else times.set(`pet_${p.id}`, "想被摸摸头");
      return `<div class="xw-line">
        <span>${esc(p.name)}<span class="ghost xw-pet-state" data-time="pet_${p.id}"></span></span>
        <button class="xw-topbtn" data-act="pet" data-id="${p.id}">摸一摸</button>
      </div>`;
    })
    .join("");
  return `<h2>蘑菇屋</h2>
    <p class="ghost">窗开着。灶上还温着一壶水。</p>
    <h3 class="xw-h3">灶台${kitchen ? "" : "<span class='ghost'>（还没盖厨房）</span>"}</h3>
    ${cookRows || "<p class='ghost'>暂时没有能做的菜。</p>"}
    <h3 class="xw-h3">院子里的两位</h3>
    ${petRows}
    <p class="ghost">住客：${guests.length ? guests.map((g) => esc(g.name)).join("、") : "还没有客人"}</p>`;
}

function detailWish(state) {
  const wishes = state.wishes || [];
  const rows = wishes
    .map((w) => {
      const needs = Object.entries(w.needs)
        .map(([id, n]) => {
          const have = state.inv[id] || 0;
          return `<span class="xw-need${have >= n ? " ok" : ""}">${esc(itemName(id))} ${have}/${n}</span>`;
        })
        .join("");
      const can = Object.entries(w.needs).every(([id, n]) => (state.inv[id] || 0) >= n);
      return `<div class="xw-wish${can ? " can" : ""}">
        <div class="xw-wish-top"><b>${esc(w.name)}</b><span class="ghost">+${w.coin} 金 · +${w.xp} 经验</span></div>
        <div class="xw-needs">${needs}</div>
        <div class="row">
          <button class="xw-topbtn${can ? " is-go" : ""}" data-act="deliver" data-id="${w.wishId}"${can ? "" : " disabled"}>送去</button>
          <button class="xw-topbtn" data-act="skipwish" data-id="${w.wishId}" title="换一张单子">换一个</button>
        </div>
      </div>`;
    })
    .join("");
  return `<h2>心愿屋</h2>
    <p class="ghost">灯哥把今天的单子摊在桌上。凑齐了就送去，凑不齐可以换。</p>
    ${rows || "<p class='ghost'>心愿屋还在沏茶，稍等一会儿。</p>"}`;
}

function detailBuildList(state) {
  const rows = BUILDINGS.filter((b) => b.id !== "mushroom" && b.id !== "wish")
    .map((b) => {
      const built = state.buildings[b.id]?.built;
      const gate = state.meta.level < b.unlockLevel;
      const lack = missingCost(state, b.cost);
      return `<div class="xw-line">
        <span><b>${esc(b.name)}</b><span class="ghost"> Lv.${b.unlockLevel} · ${esc(costEntries(b.cost) || "免费")}</span></span>
        ${built
          ? `<button class="xw-topbtn" data-act="select" data-id="${b.id}">进去</button>`
          : `<button class="xw-topbtn" data-act="build" data-id="${b.id}"${gate || lack.length ? " disabled" : ""}>${gate ? `等 Lv.${b.unlockLevel}` : lack.length ? `差 ${esc(lack.join("、"))}` : "盖起来"}</button>`}
      </div>`;
    })
    .join("");
  return `<h2>图纸本</h2><p class="ghost">村子能长成什么样，都画在这儿了。</p>${rows}`;
}

function detailBuilding(state, id, now, progress, times) {
  const def = BUILDINGS.find((b) => b.id === id);
  if (!def) return `<h2>这儿还是一片空地</h2><p class="ghost">点村里的房子看看。</p>`;
  const built = state.buildings[id]?.built;
  if (!built) {
    const gate = state.meta.level < def.unlockLevel;
    const lack = missingCost(state, def.cost);
    return `<h2>${esc(def.name)}</h2>
      <p class="ghost">还只是块地基。造价 ${esc(costEntries(def.cost) || "免费")}，需要 Lv.${def.unlockLevel}。</p>
      ${lack.length ? `<p class="xw-warn">还差：${esc(lack.join("、"))}</p>` : ""}
      <div class="row"><button class="xw-topbtn is-go" data-act="build" data-id="${id}"${gate || lack.length ? " disabled" : ""}>${gate ? `等 Lv.${def.unlockLevel}` : "盖起来"}</button></div>`;
  }

  const slots = state.buildings[id]?.slotCount || def.slots || 2;
  const jobs = (state.jobs || []).filter((j) => j.buildingId === id && j.status !== "collected");
  const animal = ANIMALS.find((a) => a.buildingId === id);
  const recipes = recipesByBuilding(id);

  const jobRows = jobs
    .map((j) => {
      const total = jobTotalMs(j);
      const left = j.doneAt - now;
      progress.set(j.id, (j.status === "done" ? 1 : clamp01(1 - left / total)) * 100);
      times.set(j.id, j.status === "done" ? "做好了" : secs(left));
      return `<div class="xw-job${j.status === "done" ? " done" : ""}">
        <span>${esc(jobLabel(j))}</span>
        ${bar(j.id, 0)}
        <span class="xw-job-time" data-time="${j.id}"></span>
      </div>`;
    })
    .join("");

  const recipeRows = recipes
    .map((r) => {
      const gate = state.meta.level < r.unlockLevel;
      const lack = missingInputs(state, r.inputs);
      const full = jobs.length >= slots;
      const why = gate ? `等 Lv.${r.unlockLevel}` : full ? "工位满了" : lack.length ? `差 ${lack.join("、")}` : "开工";
      return `<div class="xw-line">
        <span><b>${esc(r.name)}</b><span class="ghost"> ${esc(costEntries(r.inputs))} → ${esc(itemName(r.outputId))}×${r.outputQty} · ${Math.round(r.timeMs / 1000)}秒</span></span>
        <button class="xw-topbtn" data-act="enq" data-b="${id}" data-id="${r.id}"${gate || full || lack.length ? " disabled" : ""}>${esc(why)}</button>
      </div>`;
    })
    .join("");

  const feedRow = animal
    ? `<div class="xw-line">
        <span><b>喂${esc(animal.name)}</b><span class="ghost"> ${esc(itemName(animal.feedId))}×1 → ${esc(itemName(animal.productId))}×1 · ${Math.round(animal.cycleMs / 1000)}秒</span></span>
        <button class="xw-topbtn" data-act="feed" data-b="${id}"${(state.inv[animal.feedId] || 0) < 1 || jobs.length >= slots ? " disabled" : ""}>投喂</button>
      </div>`
    : "";

  const done = jobs.filter((j) => j.status === "done").length;
  return `<h2>${esc(def.name)} <span class="ghost">工位 ${jobs.length}/${slots}</span></h2>
    ${feedRow}
    ${recipeRows}
    ${jobRows ? `<h3 class="xw-h3">正在做</h3>${jobRows}` : "<p class='ghost'>炉子凉着，安排点活吧。</p>"}
    <div class="row">
      <button class="xw-topbtn${done ? " is-go" : ""}" data-act="collect" data-b="${id}"${done ? "" : " disabled"}>收走做好的${done ? `（${done}）` : ""}</button>
      <button class="xw-topbtn" data-act="unlock" data-b="${id}"${slots >= 6 ? " disabled" : ""}>加个工位（${40 + slots * 20} 金）</button>
    </div>`;
}

/* ---------- 引导与飘字 ---------- */

function renderTutorial(refs, state, step) {
  const on = step < TUTORIAL_TOTAL;
  refs.tut.hidden = !on;
  if (!on) return;
  const s = TUTORIAL[step];
  setText(refs.tutTitle, s.title);
  setText(refs.tutText, s.text);
  setHtml(
    refs.tutDots,
    TUTORIAL.map((_, i) => `<span class="xw-dot${i <= step ? " on" : ""}"></span>`).join(""),
  );
}

function renderToast(refs, ui, now) {
  const toast = ui.toast;
  const show = !!toast && now - (toast.at || 0) < TOAST_MS;
  if (show) setText(refs.toast, toast.text);
  refs.toast.classList.toggle("show", show);
  refs.toast.classList.toggle("bad", show && toast.tone === "bad");
}

export { RECIPES, fromHtml };
