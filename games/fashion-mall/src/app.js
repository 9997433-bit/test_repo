import { TICK_MS } from "./data/balance.js";
import { HUD, OFFLINE, SYSTEM, FAIL } from "./data/copy.js";
import { A11Y } from "./data/a11y.js";
import { hydrate, persist, settle } from "./core/state.js";
import { totalOnlinePerSec, charmOf, formatGold } from "./core/economy.js";
import { OFFLINE_CAP_HOURS } from "./core/limits.js";
import { exportSave, clearSave, loadCorruptBackup } from "./core/save.js";
import * as actions from "./core/actions.js";
import { esc, setText } from "./ui/dom.js";
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
/** 短于半小时的离开走 OFFLINE.short 轻量变体（UX_NARRATIVE §6.1）。 */
const OFFLINE_SHORT_HOURS = 0.5;

const app = document.getElementById("app");
app.setAttribute("aria-label", A11Y.app);
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

/** 页签可见文案与读屏说明分两处取：底栏只放两个字，完整语义留给 A11Y.nav。 */
const NAV_ITEMS = [
  { tab: "mall", text: "商场", label: A11Y.nav.mall },
  { tab: "look", text: "换装", label: A11Y.nav.look },
  { tab: "home", text: "豪宅", label: A11Y.nav.home },
  { tab: "team", text: "伙伴", label: A11Y.nav.team },
  { tab: "more", text: "更多", label: A11Y.nav.more },
];

function hudMarkup() {
  return `
    <header class="topbar">
      <div class="brand">时尚百货城</div>
      <div class="pills" role="group" aria-label="${esc(A11Y.hud.region)}">
        <span class="pill" id="pill-gold"></span>
        <span class="pill" id="pill-rate"></span>
        <span class="pill" id="pill-charm"></span>
        <span class="pill" id="pill-level"></span>
      </div>
    </header>
    <div class="toast" id="toast" role="status" aria-live="polite"
      aria-label="${esc(A11Y.toastRegion)}" hidden></div>
    <main id="stage"></main>
    <nav class="nav" aria-label="${esc(A11Y.nav.region)}">
      ${NAV_ITEMS.map(
        (n) => `<button data-tab="${n.tab}" aria-label="${esc(n.label)}">${n.text}</button>`,
      ).join("")}
    </nav>`;
}

/** emoji 是装饰，语义由 HUD 标签和 aria-label 承担；两者都只在变化时落笔。 */
function paintPill(node, text, label) {
  if (!node) return;
  if (node.textContent !== text) node.textContent = text;
  if (node.getAttribute("aria-label") !== label) node.setAttribute("aria-label", label);
}

/** 每 tick 只改文本节点，不重建 innerHTML。 */
function paintHud() {
  const gold = app.querySelector("#pill-gold");
  if (!gold) return;
  const goldText = formatGold(state.gold);
  const rateText = formatGold(totalOnlinePerSec(state));
  const charm = charmOf(state.outfit);
  paintPill(gold, `💰 ${HUD.gold} ${goldText}`, A11Y.hud.gold(goldText));
  paintPill(
    app.querySelector("#pill-rate"),
    `📈 ${HUD.rate} ${rateText}${HUD.perSec}`,
    A11Y.hud.rate(rateText),
  );
  paintPill(app.querySelector("#pill-charm"), `✨ ${HUD.charm} ${charm}`, A11Y.hud.charm(charm));
  paintPill(
    app.querySelector("#pill-level"),
    `⭐ ${HUD.level} ${state.level}`,
    A11Y.hud.level(state.level),
  );
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
    actions.toggleMute(state);
    sfx.setMuted(state.muted);
    setText(muteBtn, state.muted ? "音效：关" : "音效：开");
    persist(state);
    showToast(state.muted ? SYSTEM.muteOn : SYSTEM.muteOff);
  };

  stage.querySelector("#exp").onclick = () => {
    stage.querySelector("#dump").value = exportSave(state);
    showToast(SYSTEM.exportDone);
  };
  stage.querySelector("#imp").onclick = () => {
    const res = actions.importState(state, stage.querySelector("#dump").value);
    if (!res.ok) return showToast(FAIL[res.reason] ?? res.toast);
    persist(state);
    sfx.setMuted(state.muted);
    go("mall");
    showToast(SYSTEM.importDone);
  };
  // 清空是不可逆的：先问一句，再动存档。
  stage.querySelector("#wipe").onclick = () => {
    if (typeof confirm === "function" && !confirm(SYSTEM.wipeConfirm)) return;
    clearSave();
    location.reload();
  };

  const backup = loadCorruptBackup();
  if (backup) {
    const note = stage.querySelector("#corrupt-note");
    note.hidden = false;
    setText(note, SYSTEM.corruptKept(new Date(backup.at).toLocaleString()));
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

/** 离店回执：金额 > 时长 > 封顶（UX_NARRATIVE §6.1），切后台几分钟只报一句轻的。 */
function offlineReceipt(result) {
  if (result.hours < OFFLINE_SHORT_HOURS) return OFFLINE.short;
  const summary = OFFLINE.summary(result.hours.toFixed(1), formatGold(result.gold));
  if (result.hours <= OFFLINE_CAP_HOURS) return summary;
  return `${summary}${OFFLINE.cappedNote(String(OFFLINE_CAP_HOURS))}`;
}

function applySettle(now = Date.now()) {
  const result = settle(state, now);
  if (result.mode === "offline" && result.gold > 0) {
    showToast(offlineReceipt(result));
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
