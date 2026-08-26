import { EVENTS } from "../data/copy.js";
import { A11Y } from "../data/a11y.js";
import { persist } from "../core/state.js";
import { formatGold } from "../core/economy.js";
import { reward } from "../core/actions.js";
import { esc } from "../ui/dom.js";
import { sfx } from "../core/audio.js";
import { injectEventStyles } from "./styles.js";

/* ------------------------------------------------------------------ 节奏 */
/**
 * 事件是调剂不是骚扰：开局先安静一会儿，两次之间留足冷却，冷却过后概率才慢慢爬。
 * 玩家连着婉拒说明此刻不想被打断，间隔按次数往后退，接了一次就复位。
 */
const FIRST_GAP_MS = 100000;
const BASE_GAP_MS = 150000;
const RAMP_MS = 180000;
const PEAK_CHANCE = 0.5;
const SNOOZE_STEP = 0.4;
const SNOOZE_MAX = 2.2;
const RECENT_MEMORY = 2;

const bornAt = Date.now();
let lastAt = 0;
let snooze = 0;
const recent = [];

function gapMs() {
  const base = lastAt ? BASE_GAP_MS : FIRST_GAP_MS;
  return base * Math.min(SNOOZE_MAX, 1 + snooze * SNOOZE_STEP);
}

function remember(id) {
  recent.push(id);
  while (recent.length > RECENT_MEMORY) recent.shift();
}

/** 玩家的态度反过来调节节奏：接受复位，婉拒/错过则往后退。 */
function noteOutcome(accepted) {
  snooze = accepted ? 0 : Math.min(Math.ceil((SNOOZE_MAX - 1) / SNOOZE_STEP), snooze + 1);
}

export function maybeEvent(state, now = Date.now()) {
  if (!state || !EVENTS.length) return null;
  const since = now - (lastAt || bornAt);
  const gap = gapMs();
  if (since < gap) return null;
  const ramp = Math.min(1, (since - gap) / RAMP_MS);
  if (Math.random() > PEAK_CHANCE * ramp) return null;
  const pool = EVENTS.filter((e) => !recent.includes(e.id));
  const list = pool.length ? pool : EVENTS;
  const ev = list[Math.floor(Math.random() * list.length)];
  lastAt = now;
  remember(ev.id);
  return ev;
}

/* ------------------------------------------------------------------ 文案 */
/**
 * 收尾文案全部取自 copy.js 的 `resolve` / `decline`（UX_NARRATIVE §7 接线项），
 * 本模块不再自带平行文案表。老档/新增事件漏填时退回正文，宁可重复也不留空 toast。
 */
function resolveLine(ev) {
  return ev.resolve || ev.body;
}

/**
 * 婉拒与超时错过的结果相同：什么都没损失，只是少赚一笔。
 * 按 §4 禁则，不扣既得资源的场合不写损失暗示，两条路径共用 decline。
 */
function declineLine(ev) {
  return ev.decline || ev.body;
}

/* ------------------------------------------------------------------ 弹窗 */
const AUTO_MS = 18000;
const CLOCK_MS = 200;

export function renderEventModal(host, state, ev, onClose) {
  injectEventStyles();
  const gold = Math.max(0, Number(ev.reward?.gold) || 0);
  const xp = Math.max(0, Number(ev.reward?.xp) || 0);
  const titleId = `fm-ev-title-${ev.id}`;
  const bodyId = `fm-ev-body-${ev.id}`;

  const dlg = document.createElement("dialog");
  // 保留 .modal：app.js 用它判断"当前是否已有弹窗"，避免事件叠弹。
  dlg.className = "modal fm-ev";
  // showModal 的原生语义已够，但降级路径与部分读屏仍要显式的 dialog + modal。
  dlg.setAttribute("role", "dialog");
  dlg.setAttribute("aria-modal", "true");
  dlg.setAttribute("aria-labelledby", titleId);
  dlg.setAttribute("aria-describedby", bodyId);
  dlg.innerHTML = `
    <div class="fm-ev-sheet">
      <div class="fm-ev-clock"><i data-clock></i></div>
      <span class="fm-ev-tag">${esc(A11Y.dialog.label)}</span>
      <h3 id="${titleId}">${esc(ev.title)}</h3>
      <p class="fm-ev-body" id="${bodyId}">${esc(ev.body)}</p>
      <div class="fm-ev-chips">
        ${gold ? `<span class="fm-ev-chip gold">接下可得 +${formatGold(gold)} 金</span>` : ""}
        ${xp ? `<span class="fm-ev-chip xp">阅历 +${xp}</span>` : ""}
        <span class="fm-ev-chip">婉拒不扣钱，只是少赚一笔</span>
      </div>
      <div class="fm-ev-actions">
        <button class="btn" type="button" data-yes autofocus>${esc(ev.yes)}</button>
        <button class="btn ghost" type="button" data-no>${esc(ev.no)}</button>
      </div>
      <p class="fm-ev-foot">${esc(A11Y.dialog.escHint)}，等同「${esc(ev.no)}」 · <b data-left>${Math.ceil(AUTO_MS / 1000)}</b> 秒后自动错过</p>
    </div>`;

  const sheet = dlg.querySelector(".fm-ev-sheet");
  const clock = dlg.querySelector("[data-clock]");
  const leftText = dlg.querySelector("[data-left]");
  let left = AUTO_MS;
  let prev = Date.now();
  let settled = false;
  let opener = null;

  // 倒计时只在页面可见时走，切后台回来不会白白错过。
  const ticker = setInterval(() => {
    const now = Date.now();
    const dt = now - prev;
    prev = now;
    if (typeof document !== "undefined" && document.hidden) return;
    left = Math.max(0, left - dt);
    clock.style.width = `${((left / AUTO_MS) * 100).toFixed(1)}%`;
    leftText.textContent = Math.ceil(left / 1000);
    if (left <= 0) finish("timeout");
  }, CLOCK_MS);

  /** 降级路径没有原生模态，Esc 与 Tab 循环得自己兜（UX_NARRATIVE §5.1–5.2）。 */
  function onKey(e) {
    if (e.key === "Escape") {
      e.preventDefault();
      finish("esc");
      return;
    }
    if (e.key !== "Tab") return;
    const stops = [dlg.querySelector("[data-yes]"), dlg.querySelector("[data-no]")];
    const at = stops.indexOf(document.activeElement);
    e.preventDefault();
    const next = at < 0 ? 0 : (at + (e.shiftKey ? stops.length - 1 : 1)) % stops.length;
    stops[next].focus();
  }

  function finish(outcome) {
    if (settled) return;
    settled = true;
    clearInterval(ticker);
    document.removeEventListener("keydown", onKey);

    if (outcome === "accept") {
      const res = reward(state, { gold, xp });
      persist(state);
      sfx.coin();
      state.toast = `${resolveLine(ev)}${gold ? ` +${formatGold(gold)} 金` : ""}${xp ? ` · 阅历 +${xp}` : ""}`;
      if (!res.ok && res.toast) state.toast = res.toast;
    } else {
      sfx.tap();
      state.toast = declineLine(ev);
    }
    noteOutcome(outcome === "accept");

    try {
      if (dlg.open) dlg.close();
    } catch {
      /* 不支持 dialog 的环境直接摘节点 */
    }
    dlg.remove();
    // showModal 会自己把焦点还回去；降级路径得手动还，键盘用户才不会掉回文档开头。
    if (opener?.isConnected && typeof opener.focus === "function") opener.focus();
    onClose?.();
  }

  dlg.querySelector("[data-yes]").addEventListener("click", () => finish("accept"));
  dlg.querySelector("[data-no]").addEventListener("click", () => finish("decline"));
  // 误触遮罩不该丢掉一笔收入，只晃一下提示要选一个。
  dlg.addEventListener("click", (e) => {
    if (e.target !== dlg) return;
    sheet.classList.remove("nudge");
    void sheet.offsetWidth;
    sheet.classList.add("nudge");
  });
  dlg.addEventListener("cancel", (e) => {
    e.preventDefault();
    finish("esc");
  });

  host.append(dlg);
  if (typeof dlg.showModal === "function") {
    dlg.showModal();
  } else {
    opener = document.activeElement;
    dlg.classList.add("fm-ev-fallback");
    dlg.setAttribute("open", "");
    document.addEventListener("keydown", onKey);
    dlg.querySelector("[data-yes]").focus();
  }
  return () => finish("esc");
}
