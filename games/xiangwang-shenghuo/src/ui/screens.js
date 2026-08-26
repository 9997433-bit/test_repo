import { CROPS, ITEM_NAMES, GUESTS, BUILDINGS, RECIPES } from "../data/index.js";
import { recipesByBuilding } from "../data/recipes.js";

const seasonName = { spring: "春", summer: "夏", autumn: "秋", winter: "冬" };

export function phaseOf(minutes) {
  const h = Math.floor(minutes / 60) % 24;
  if (h >= 19 || h < 5) return "night";
  if (h >= 16) return "dusk";
  return "day";
}

export function render(root, state, handlers) {
  const hour = Math.floor(state.meta.gameMinutes / 60) % 24;
  const minute = Math.floor(state.meta.gameMinutes % 60);
  const phase = phaseOf(state.meta.gameMinutes);
  const inv = Object.entries(state.inv)
    .filter(([, n]) => n > 0)
    .map(([id, n]) => `${ITEM_NAMES[id] || id}×${n}`)
    .join(" · ") || "口袋空空，去田里走走";

  root.dataset.season = state.meta.season;
  root.dataset.phase = phase;

  root.innerHTML = `
    <header class="topbar">
      <div class="brand">蘑菇屋 · 慢生活</div>
      <div class="meters">
        <span>${seasonName[state.meta.season]} 第${state.meta.day}日 ${String(hour).padStart(2,"0")}:${String(minute).padStart(2,"0")}</span>
        <span>Lv.${state.meta.level}</span>
        <span>金币 ${state.resources.coin}</span>
        <span>幸福 ${state.resources.happiness}</span>
        <span>温馨 ${state.resources.warmth}</span>
        <span>人口 ${state.resources.pop}/${state.resources.popCap}</span>
        <button data-act="mute">${state.meta.muted ? "声音：关" : "声音：开"}</button>
        <button data-act="save">记下这一天</button>
      </div>
    </header>
    <section class="village">
      <div class="sky"></div>
      <div class="mountain"></div>
      <div class="ground"></div>
      <button class="mushroom" data-act="open" data-id="mushroom" title="蘑菇屋">
        <div class="cap"></div><div class="stem"></div><div class="door"></div>
      </button>
      <div class="buildings">
        ${BUILDINGS.filter((b) => b.id !== "mushroom").map((b) => {
          const on = state.buildings[b.id]?.built;
          return `<button class="bldg ${on ? "" : "off"}" data-act="open" data-id="${b.id}">${b.name}${on ? "" : " · 未建"}</button>`;
        }).join("")}
      </div>
      <div class="fields">
        ${state.plots.map((p) => {
          const crop = CROPS.find((c) => c.id === p.cropId);
          const label = p.status === "growing" && crop ? crop.name : p.status === "ready" && crop ? `收${crop.name}` : p.status === "empty" ? "空地" : p.status === "untilled" ? "荒地" : p.status;
          return `<button class="plot ${p.status}" data-act="plot" data-id="${p.id}">${label}</button>`;
        }).join("")}
        <button class="plot empty" data-act="expand">+ 开垦</button>
      </div>
    </section>
    <section class="dock">
      <article class="panel" id="detail">
        <h2>今天想做点什么</h2>
        <p class="ghost">点田、点房子、点蘑菇屋。日子会自己往前走。</p>
        <p><strong>背包</strong> ${inv}</p>
        <div class="row tools">
          ${CROPS.map((c) => `<button data-act="seed" data-id="${c.id}">种${c.name}</button>`).join("")}
        </div>
      </article>
      <article class="panel">
        <h2>村里的闲话</h2>
        <ul class="log">${(state.log || []).slice(0, 8).map((l) => `<li>${l}</li>`).join("")}</ul>
        <h2>心愿</h2>
        ${(state.wishes || []).map((w) => {
          const need = Object.entries(w.needs).map(([k, v]) => `${ITEM_NAMES[k] || k}×${v}`).join("、");
          return `<div class="row"><span>${w.name}（${need}）</span><button data-act="deliver" data-id="${w.wishId}">送去</button></div>`;
        }).join("") || "<p class='ghost'>心愿屋还在沏茶。</p>"}
        <h2>嘉宾</h2>
        <div class="row">${GUESTS.map((g) => `<button data-act="invite" data-id="${g.id}">请${g.name}</button>`).join("")}</div>
      </article>
    </section>
  `;

  root.onclick = (ev) => {
    const btn = ev.target.closest("[data-act]");
    if (!btn) return;
    const act = btn.dataset.act;
    const id = btn.dataset.id;
    if (act === "seed") handlers.setSeed(id);
    else if (act === "plot") handlers.onPlot(id);
    else if (act === "expand") handlers.expand();
    else if (act === "deliver") handlers.deliver(id);
    else if (act === "invite") handlers.invite(id);
    else if (act === "open") paintDetail(root.querySelector("#detail"), state, id, handlers);
    else if (act === "mute") handlers.toggleMute();
    else if (act === "save") handlers.save();
  };
}

function paintDetail(el, state, id, handlers) {
  if (!el) return;
  if (id === "mushroom") {
    el.innerHTML = `<h2>蘑菇屋</h2><p>窗开着。灶上还温着一壶水。</p>
      <div class="row">
        <button data-x="cook">做饭</button>
        <button data-x="pet">逗宠物</button>
      </div>
      <p class="ghost">驻留嘉宾：${(state.guests || []).map((g) => GUESTS.find((x) => x.id === g.id)?.name).filter(Boolean).join("、") || "还没有客人"}</p>`;
    el.onclick = (e) => {
      const b = e.target.closest("[data-x]");
      if (!b) return;
      if (b.dataset.x === "pet") handlers.pet();
      if (b.dataset.x === "cook") handlers.cook();
    };
    return;
  }
  const built = state.buildings[id]?.built;
  const recs = recipesByBuilding(id);
  el.innerHTML = `<h2>${BUILDINGS.find((b) => b.id === id)?.name || id}</h2>
    ${built ? recs.map((r) => `<div class="row"><span>${r.name}</span><button data-x="enq" data-id="${r.id}">开始</button></div>`).join("") + `<div class="row"><button data-x="collect">收取做好的</button><button data-x="unlock">加一个工位</button></div>` : `<button data-x="build">建造</button>`}
    ${id === "coop" || id === "sheepfold" || id === "barn" ? `<button data-x="feed">投喂</button>` : ""}`;
  el.onclick = (e) => {
    const b = e.target.closest("[data-x]");
    if (!b) return;
    if (b.dataset.x === "build") handlers.build(id);
    if (b.dataset.x === "enq") handlers.enqueue(id, b.dataset.id);
    if (b.dataset.x === "collect") handlers.collect(id);
    if (b.dataset.x === "unlock") handlers.unlock(id);
    if (b.dataset.x === "feed") handlers.feed(id);
  };
}

export { RECIPES };
