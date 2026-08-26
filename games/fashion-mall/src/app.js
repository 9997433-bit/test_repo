import { TICK_MS } from "./data/balance.js";
import { hydrate, persist, settle } from "./core/state.js";
import { totalOnlinePerSec, charmOf, formatGold } from "./core/economy.js";
import { exportSave, clearSave, loadCorruptBackup } from "./core/save.js";
import * as actions from "./core/actions.js";
import { setText } from "./ui/dom.js";
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

const PERSIST_MS = 4000;
const EVENT_MS = 28000;
const TOAST_MS = 2600;

const app = document.getElementById("app");
const state = hydrate();
sfx.setMuted(state.muted);

let tab = "mall";
let shopId = null;
let disposeView = null;
let toastTimer = null;
let sincePersist = 0;
let sinceEvent = 0;

const SHOP_VIEWS = {
  fastfood: renderFastfood,
  fresh: renderFresh,
  boutique: renderBoutique,
  blindbox: renderBlindbox,
  fortune: renderFortune,
};

function hudMarkup() {
  return `
    <header class="topbar">
      <div class="brand">时尚百货城</div>
      <div class="pills">
        <span class="pill" id="pill-gold"></span>
        <span class="pill" id="pill-rate"></span>
        <span class="pill" id="pill-charm"></span>
        <span class="pill" id="pill-level"></span>
      </div>
    </header>
    <div class="toast" id="toast" role="status" aria-live="polite" hidden></div>
    <main id="stage"></main>
    <nav class="nav">
      <button data-tab="mall">商场</button>
      <button data-tab="look">换装</button>
      <button data-tab="home">豪宅</button>
      <button data-tab="team">伙伴</button>
      <button data-tab="more">更多</button>
    </nav>`;
}

/** 每 tick 只改文本节点，不重建 innerHTML。 */
function paintHud() {
  const gold = app.querySelector("#pill-gold");
  if (!gold) return;
  setText(gold, `💰 ${formatGold(state.gold)}`);
  setText(app.querySelector("#pill-rate"), `📈 ${formatGold(totalOnlinePerSec(state))}/秒`);
  setText(app.querySelector("#pill-charm"), `✨ 魅力 ${charmOf(state.outfit)}`);
  setText(app.querySelector("#pill-level"), `⭐ Lv.${state.level}`);
}

function paintNav() {
  for (const b of app.querySelectorAll(".nav button")) {
    const active = b.dataset.tab === tab || (b.dataset.tab === "mall" && tab === "shop");
    b.classList.toggle("active", active);
    if (active) b.setAttribute("aria-current", "page");
    else b.removeAttribute("aria-current");
  }
}

/** toast 永远走 textContent，state.name / 导入档字符串无法注入标记。 */
function showToast(message) {
  state.toast = "";
  const node = app.querySelector("#toast");
  if (!node) return;
  if (!message) {
    node.hidden = true;
    setText(node, "");
    return;
  }
  setText(node, message);
  node.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    setText(node, "");
    node.hidden = true;
  }, TOAST_MS);
}

/** 切页前必须释放上一视图的计时器/监听器，兼容返回 dispose 与 root._cleanup 两种写法。 */
function disposeStage(stage) {
  try {
    disposeView?.();
  } catch {
    /* 视图清理失败不应阻断路由 */
  }
  disposeView = null;
  if (stage?._cleanup) {
    try {
      stage._cleanup();
    } catch {
      /* 同上 */
    }
    stage._cleanup = null;
  }
}

function go(nextTab, nextShopId = null) {
  tab = nextTab;
  shopId = nextShopId;
  paint();
}

const ctx = {
  back: () => go("mall"),
  openShop: (id) => go("shop", id),
  repaint: () => paint(),
  toast: (msg) => showToast(msg),
  persist: () => persist(state),
};

function renderMore(stage) {
  stage.innerHTML = `
    <div id="labs"></div>
    <section class="panel">
      <h2>存档</h2>
      <div class="row">
        <button class="btn ghost" id="exp">导出</button>
        <button class="btn ghost" id="imp">导入</button>
        <button class="btn ghost" id="mute"></button>
        <button class="btn ghost" id="wipe">清空</button>
      </div>
      <textarea id="dump" aria-label="存档文本" style="width:100%;min-height:90px;margin-top:8px;border-radius:12px;border:1px solid #f0d4de"></textarea>
      <p id="corrupt-note" style="margin:8px 0 0;color:var(--ink-soft);font-size:12px" hidden></p>
    </section>`;
  renderLabs(stage.querySelector("#labs"), state);

  const muteBtn = stage.querySelector("#mute");
  setText(muteBtn, state.muted ? "音效：关" : "音效：开");
  muteBtn.onclick = () => {
    const res = actions.toggleMute(state);
    sfx.setMuted(state.muted);
    setText(muteBtn, state.muted ? "音效：关" : "音效：开");
    persist(state);
    showToast(res.toast);
  };

  stage.querySelector("#exp").onclick = () => {
    stage.querySelector("#dump").value = exportSave(state);
    showToast("已导出到文本框");
  };
  stage.querySelector("#imp").onclick = () => {
    const res = actions.importState(state, stage.querySelector("#dump").value);
    if (!res.ok) return showToast(res.toast);
    persist(state);
    sfx.setMuted(state.muted);
    go("mall");
    showToast(res.toast);
  };
  stage.querySelector("#wipe").onclick = () => {
    clearSave();
    location.reload();
  };

  const backup = loadCorruptBackup();
  if (backup) {
    const note = stage.querySelector("#corrupt-note");
    note.hidden = false;
    setText(
      note,
      `检测到一份无法识别的旧档备份（${new Date(backup.at).toLocaleString()}），已保留未删除。`,
    );
  }
}

function paint() {
  const pending = state.toast;
  if (!state.introDone) {
    disposeStage(app.querySelector("#stage"));
    app.innerHTML = "";
    renderIntro(app, state, () => go("shop", "fastfood"));
    return;
  }
  const wasMounted = !!app.querySelector("#stage");
  disposeStage(app.querySelector("#stage"));
  if (!wasMounted || !app.querySelector(".topbar")) app.innerHTML = hudMarkup();

  const stage = app.querySelector("#stage");
  stage.innerHTML = "";
  paintHud();
  paintNav();
  for (const b of app.querySelectorAll(".nav button")) {
    b.onclick = () => {
      sfx.tap();
      go(b.dataset.tab);
    };
  }

  if (tab === "mall") disposeView = renderMall(stage, state, ctx);
  else if (tab === "shop" && SHOP_VIEWS[shopId]) {
    disposeView = SHOP_VIEWS[shopId](stage, state, ctx.back, ctx);
  } else if (tab === "look") disposeView = renderWardrobe(stage, state, ctx);
  else if (tab === "home") disposeView = renderMansion(stage, state, ctx);
  else if (tab === "team") disposeView = renderRoster(stage, state, ctx);
  else if (tab === "more") disposeView = renderMore(stage);
  else disposeView = renderMall(stage, state, ctx);
  if (typeof disposeView !== "function") disposeView = null;

  if (pending || state.toast) showToast(pending || state.toast);
}

function applySettle(now = Date.now()) {
  const result = settle(state, now);
  if (result.mode === "offline" && result.gold > 0) {
    showToast(`离开 ${result.hours.toFixed(1)} 小时，到账 ${formatGold(result.gold)}`);
  }
  for (const note of result.notes) showToast(note);
  return result;
}

paint();
if (state.toast) showToast(state.toast);

/** 唯一的时间泵：结算、HUD、落盘、突发事件都挂在这条管线上。 */
const pump = setInterval(() => {
  if (!state.introDone) return;
  const now = Date.now();
  const before = state.lastTick;
  applySettle(now);
  const elapsed = Math.max(0, now - before);
  paintHud();
  if (state.toast) showToast(state.toast);

  sincePersist += elapsed;
  if (sincePersist >= PERSIST_MS) {
    sincePersist = 0;
    persist(state);
  }
  sinceEvent += elapsed;
  if (sinceEvent >= EVENT_MS) {
    sinceEvent = 0;
    if (tab !== "shop" && !app.querySelector(".modal")) {
      const ev = maybeEvent(state);
      if (ev) renderEventModal(app, state, ev, () => paint());
    }
  }
}, TICK_MS);

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden") {
    settle(state, Date.now());
    persist(state);
    return;
  }
  if (!state.introDone) return;
  applySettle();
  paintHud();
});

window.addEventListener("pagehide", () => {
  settle(state, Date.now());
  persist(state);
});

window.__FASHION_MALL__ = { state, paint, actions, settle, stopPump: () => clearInterval(pump) };
