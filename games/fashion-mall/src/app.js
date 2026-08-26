import { TICK_MS } from "./data/balance.js";
import { hydrate, persist, tick } from "./core/state.js";
import { totalOnlinePerSec, charmOf, formatGold } from "./core/economy.js";
import { exportSave, importSave, writeSave, clearSave } from "./core/save.js";
import { renderIntro } from "./ui/intro.js";
import { renderMall } from "./mall/mallView.js";
import { renderFastfood } from "./minigames/fastfood.js";
import { renderFresh } from "./minigames/fresh.js";
import { renderBoutique } from "./minigames/boutique.js";
import { renderBlindbox } from "./minigames/blindbox.js";
import { renderFortune } from "./minigames/fortune.js";
import { renderWardrobe } from "./fashion/wardrobe.js";
import { renderMansion } from "./home/mansion.js";
import { renderRoster } from "./partners/roster.js";
import { renderLabs } from "./research/labs.js";
import { maybeEvent, renderEventModal } from "./events/randomEvents.js";
import { sfx } from "./core/audio.js";

const app = document.getElementById("app");
const state = hydrate();
let tab = "mall";
let shopId = null;

const SHOP_VIEW = {
  fastfood: renderFastfood,
  fresh: renderFresh,
  boutique: renderBoutique,
  blindbox: renderBlindbox,
  fortune: renderFortune,
};

function hud() {
  return `
    <header class="topbar">
      <div class="brand">时尚百货城</div>
      <div class="pills">
        <span class="pill">💰 ${formatGold(state.gold)}</span>
        <span class="pill">📈 ${formatGold(totalOnlinePerSec(state))}/秒</span>
        <span class="pill">✨ 魅力 ${charmOf(state.outfit)}</span>
        <span class="pill">⭐ Lv.${state.level}</span>
      </div>
    </header>
    ${state.toast ? `<div class="toast">${state.toast}</div>` : ""}
    <main id="stage"></main>
    <nav class="nav">
      <button data-tab="mall" class="${tab === "mall" || tab === "shop" ? "active" : ""}">商场</button>
      <button data-tab="look" class="${tab === "look" ? "active" : ""}">换装</button>
      <button data-tab="home" class="${tab === "home" ? "active" : ""}">豪宅</button>
      <button data-tab="team" class="${tab === "team" ? "active" : ""}">伙伴</button>
      <button data-tab="more" class="${tab === "more" ? "active" : ""}">更多</button>
    </nav>`;
}

function paint() {
  if (!state.introDone) {
    app.innerHTML = "";
    renderIntro(app, state, () => {
      tab = "shop";
      shopId = "fastfood";
      paint();
    });
    return;
  }
  app.innerHTML = hud();
  const stage = app.querySelector("#stage");
  app.querySelectorAll(".nav button").forEach((b) => {
    b.onclick = () => {
      tab = b.dataset.tab;
      shopId = null;
      sfx.tap();
      paint();
    };
  });
  if (tab === "mall") {
    renderMall(stage, state, (id) => {
      tab = "shop";
      shopId = id;
      paint();
    });
  } else if (tab === "shop" && SHOP_VIEW[shopId]) {
    SHOP_VIEW[shopId](stage, state, () => {
      tab = "mall";
      shopId = null;
      paint();
    });
  } else if (tab === "look") renderWardrobe(stage, state);
  else if (tab === "home") renderMansion(stage, state);
  else if (tab === "team") renderRoster(stage, state);
  else if (tab === "more") {
    stage.innerHTML = `
      <div id="labs"></div>
      <section class="panel">
        <h2>存档</h2>
        <div class="row">
          <button class="btn ghost" id="exp">导出</button>
          <button class="btn ghost" id="imp">导入</button>
          <button class="btn ghost" id="wipe">清空</button>
        </div>
        <textarea id="dump" style="width:100%;min-height:90px;margin-top:8px;border-radius:12px;border:1px solid #f0d4de"></textarea>
      </section>`;
    renderLabs(stage.querySelector("#labs"), state);
    stage.querySelector("#exp").onclick = () => {
      stage.querySelector("#dump").value = exportSave(state);
    };
    stage.querySelector("#imp").onclick = () => {
      try {
        const data = importSave(stage.querySelector("#dump").value);
        Object.assign(state, data);
        writeSave(state);
        state.toast = "存档已导入";
        paint();
      } catch {
        state.toast = "存档无法识别";
      }
    };
    stage.querySelector("#wipe").onclick = () => {
      clearSave();
      location.reload();
    };
  }
  if (state.toast) {
    setTimeout(() => {
      state.toast = "";
      const t = app.querySelector(".toast");
      t?.remove();
    }, 2600);
  }
}

paint();

setInterval(() => {
  if (!state.introDone) return;
  tick(state, TICK_MS / 1000);
  const gold = app.querySelector(".pill");
  if (gold) gold.textContent = `💰 ${formatGold(state.gold)}`;
}, TICK_MS);

setInterval(() => persist(state), 4000);

setInterval(() => {
  if (!state.introDone || tab === "shop") return;
  const ev = maybeEvent(state);
  if (ev) renderEventModal(app, state, ev, paint);
}, 28000);

window.__FASHION_MALL__ = { state, paint };
