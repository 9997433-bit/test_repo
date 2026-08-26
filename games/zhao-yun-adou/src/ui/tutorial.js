/**
 * 首局强制教程（FTUE）：三步讲完「征兵 → 布阵 → 合并觉醒」，讲完直接出征。
 *
 * ── 为什么自己起一层 ───────────────────────────────────────────
 * 主循环把界面渲染到离屏容器再做同构 diff，`#app` 子树里的节点与 class 都由
 * 渲染层说了算，事后塞进去的面板活不过一帧；`main.js` 的点击分发也只认
 * `btn-start / btn-again / btn-recruit` 三个 id。所以教程整层挂在
 * `#tutor-layer`（body 下与 `#app` 平级），自带监听、自负生死，
 * 一个棋盘钩子都不碰。
 *
 * ── 记忆 ───────────────────────────────────────────────────────
 * 讲完或跳过都往 localStorage 写一枚首局标记，之后不再自动弹；
 * 想回看走菜单里的「看教程」（`[data-tutor-open]`，本模块自己代理点击）。
 * localStorage 不可用（无痕模式/被禁）时退回内存标记：本次会话内不再打扰。
 *
 * ── 键盘 ───────────────────────────────────────────────────────
 * 面板开着时 window 捕获阶段吃掉所有按键（只 stopPropagation，不 preventDefault，
 * 焦点按钮的 Enter/空格默认行为照常），免得空格暂停、E 征兵这些游戏热键
 * 从教程底下漏过去。← → 翻页，Esc 跳过。
 */

import { sfx } from "../audio/sfx.js";

const STORE_KEY = "zy-adou.tutorial.v1";
const LAYER_ID = "tutor-layer";
const STYLE_ID = "zy-tutor-css";
/** 菜单里的回看入口：渲染层输出这个属性，点击由本模块代理。 */
const OPEN_HOOK = "[data-tutor-open]";

const STEPS = [
  {
    mark: "壹",
    title: "征兵入营",
    body: "点屏幕底部的「征兵」按钮（快捷键 E）花馒头抽一张牌：刀、枪、弓、骑，偶尔出武将单字、铲子与神兵符。兵营最多五张，越征越贵；斩敌与被破阵都会回馒头。",
    hint: "① 先攒够馒头，再一口气征两三张",
  },
  {
    mark: "贰",
    title: "布阵开地",
    body: "把手牌拖到自家棋格上落子（也可点牌再点格）。近战守外圈拦路，弓手放内圈输出；抽到「铲」点亮一格锁地，多开一格就多一份火力。",
    hint: "② 敌军沿「几」字路线直扑阿斗，路边的格子最值钱",
  },
  {
    mark: "叁",
    title: "合并觉醒",
    body: "同字同级相邻即可合并，一路升到五阶。凑齐武将姓名二字相邻——如「赵」＋「云」——立刻觉醒武将，冷却一到自动放大招。阿斗三颗心，先破对岸者胜。",
    hint: "③ 神兵符可直接给一名士兵升一阶",
  },
];

const CSS = `
#${LAYER_ID} .zy-ftue { width: min(460px, 100%); padding-bottom: 22px; }
#${LAYER_ID} .zy-ftue-seal { display: inline-block; padding: 2px 9px; border: 2px solid var(--cinnabar, #b23a2f); color: var(--cinnabar, #b23a2f); font-size: 11px; letter-spacing: 0.3em; }
#${LAYER_ID} .zy-ftue-head { margin: 12px 0 0; font-family: var(--font-brush, serif); font-size: clamp(24px, 5vw, 32px); font-weight: 400; line-height: 1.2; }
#${LAYER_ID} .zy-ftue-step { display: grid; grid-template-columns: 38px 1fr; gap: 12px; align-items: start; margin: 16px 0 0; padding-left: 10px; border-left: 2px solid rgba(var(--cinnabar-rgb, 178, 58, 47), 0.3); }
#${LAYER_ID} .zy-ftue-mark { font-family: var(--font-brush, serif); font-size: 30px; line-height: 1.1; color: var(--cinnabar, #b23a2f); }
#${LAYER_ID} .zy-ftue-body { margin: 0; font-size: 13.5px; line-height: 2; color: var(--ink-soft, #4a4033); }
#${LAYER_ID} .zy-ftue-hint { margin: 14px 0 0; padding: 7px 10px; background: var(--ink-wash, rgba(33, 26, 18, 0.055)); font-size: 12px; line-height: 1.7; color: var(--ink-faint, #8b8071); }
#${LAYER_ID} .zy-ftue-foot { display: flex; align-items: center; gap: 10px; margin-top: 20px; }
#${LAYER_ID} .zy-ftue-dots { margin-right: auto; font-size: 13px; letter-spacing: 5px; color: var(--ink-faint, #8b8071); }
#${LAYER_ID} .zy-ftue-skip { padding: 6px 2px; border: 0; background: none; font-family: var(--font-body, serif); font-size: 12px; color: var(--ink-faint, #8b8071); text-decoration: underline; text-underline-offset: 3px; cursor: pointer; }
#${LAYER_ID} .zy-ftue-skip:hover { color: var(--ink-soft, #4a4033); }
#${LAYER_ID} button.ghost { padding: 9px 16px; font-size: 13px; }
#${LAYER_ID} button.ink { padding: 10px 22px; font-size: 15px; }
@media (max-width: 420px) {
  #${LAYER_ID} .zy-ftue-body { font-size: 12.5px; }
  #${LAYER_ID} .zy-ftue-foot { flex-wrap: wrap; }
}`;

const esc = (v) =>
  String(v)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const hasDom = () => typeof document !== "undefined" && !!document.body;

let bound = null;
let layer = null;
let step = 0;
let lastFocus = null;
/** localStorage 写不进去时的兜底：至少本次会话不再自动弹。 */
let sessionSeen = false;

/* ------------------------------------------------------------- 首局标记 */

/** 已经看过（或跳过）教程？ */
export function tutorialSeen() {
  if (sessionSeen) return true;
  try {
    return localStorage.getItem(STORE_KEY) === "done";
  } catch {
    return false;
  }
}

function markSeen() {
  sessionSeen = true;
  try {
    localStorage.setItem(STORE_KEY, "done");
  } catch {
    /* 无痕模式：内存标记顶上 */
  }
}

/** 抹掉首局标记（调试 / e2e：下次进场重新走一遍教程）。 */
export function forgetTutorial() {
  sessionSeen = false;
  try {
    localStorage.removeItem(STORE_KEY);
  } catch {
    /* 读不到就当没写过 */
  }
}

/* ----------------------------------------------------------------- 面板 */

function ensureStyles() {
  if (!hasDom() || !document.head || document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = CSS;
  document.head.appendChild(style);
}

function panelHtml() {
  const s = STEPS[step];
  const first = step === 0;
  const last = step === STEPS.length - 1;
  const dots = STEPS.map((_, i) => (i === step ? "●" : "○")).join("");
  return `<div class="panel zy-ftue" role="dialog" aria-modal="true" aria-labelledby="zy-ftue-head">
    <span class="zy-ftue-seal">新兵操典</span>
    <h2 class="zy-ftue-head" id="zy-ftue-head">第${esc(s.mark)}步 · ${esc(s.title)}</h2>
    <div class="zy-ftue-step">
      <b class="zy-ftue-mark" aria-hidden="true">${esc(s.mark)}</b>
      <p class="zy-ftue-body">${esc(s.body)}</p>
    </div>
    <p class="zy-ftue-hint">${esc(s.hint)}</p>
    <div class="zy-ftue-foot">
      <span class="zy-ftue-dots" aria-label="第 ${step + 1} 步，共 ${STEPS.length} 步">${dots}</span>
      <button type="button" class="zy-ftue-skip" data-tutor-act="skip">跳过教程</button>
      <button type="button" class="ghost" data-tutor-act="prev"${first ? " disabled" : ""}>上一步</button>
      <button type="button" class="ink" data-tutor-act="${last ? "done" : "next"}">${last ? "出征" : "下一步"}</button>
    </div>
  </div>`;
}

function paint() {
  if (!layer) return;
  layer.innerHTML = panelHtml();
  layer.querySelector('[data-tutor-act="next"], [data-tutor-act="done"]')?.focus?.();
}

/** 教程面板正开着？ */
export function tutorialOpen() {
  return !!layer?.isConnected;
}

/** 打开教程（回看入口与首局自动弹都走这里）。 */
export function openTutorial(at = 0) {
  if (!hasDom()) return false;
  step = Math.max(0, Math.min(STEPS.length - 1, at | 0));
  if (tutorialOpen()) {
    paint();
    return true;
  }
  ensureStyles();
  lastFocus = document.activeElement;
  layer = document.getElementById(LAYER_ID) || document.createElement("div");
  layer.id = LAYER_ID;
  layer.className = "overlay";
  if (!layer.isConnected) document.body.appendChild(layer);
  paint();
  // 同一个监听重复挂是空操作：教程也可能被 attach 之外的入口拉起来。
  document.addEventListener("click", onDocClick);
  window.addEventListener("keydown", onKeyCapture, true);
  return true;
}

/** 关掉教程。`remember` 为真时写下首局标记，之后不再自动弹。 */
export function closeTutorial({ remember = true } = {}) {
  if (remember) markSeen();
  if (!tutorialOpen()) return;
  window.removeEventListener("keydown", onKeyCapture, true);
  layer.remove();
  layer = null;
  if (lastFocus?.isConnected && typeof lastFocus.focus === "function") lastFocus.focus();
  lastFocus = null;
}

function goto(next) {
  step = Math.max(0, Math.min(STEPS.length - 1, next));
  paint();
}

/** 讲完了：记下首局标记，直接开打（顺手解锁音频，点击本身就是用户手势）。 */
function finish() {
  closeTutorial({ remember: true });
  try {
    sfx.unlock();
  } catch {
    /* 没有 AudioContext 的环境（jsdom/老浏览器）静音开打 */
  }
  if (bound?.api?.state?.phase !== "playing") bound?.api?.start?.();
}

/* ----------------------------------------------------------------- 输入 */

function onDocClick(ev) {
  const act = ev.target?.closest?.("[data-tutor-act]")?.dataset?.tutorAct;
  if (act) {
    ev.preventDefault();
    if (act === "next") goto(step + 1);
    else if (act === "prev") goto(step - 1);
    else if (act === "skip") closeTutorial({ remember: true });
    else if (act === "done") finish();
    return;
  }
  if (ev.target?.closest?.(OPEN_HOOK)) {
    ev.preventDefault();
    openTutorial(0);
  }
}

function onKeyCapture(ev) {
  if (!tutorialOpen()) return;
  if (ev.metaKey || ev.ctrlKey || ev.altKey) return;
  const key = ev.key;
  if (key === "Escape") {
    ev.preventDefault();
    closeTutorial({ remember: true });
  } else if (key === "ArrowRight") {
    ev.preventDefault();
    if (step < STEPS.length - 1) goto(step + 1);
    else finish();
  } else if (key === "ArrowLeft") {
    ev.preventDefault();
    goto(step - 1);
  }
  // 其余按键（空格 / E / R / 1-5）到此为止，绝不漏给底下的棋局。
  ev.stopPropagation();
}

/* ----------------------------------------------------------------- 装配 */

/**
 * 绑定一局游戏。和 `attachJuice` 一样是幂等的，`render()` 每帧调也没关系；
 * 首局（无 localStorage 标记）且还在菜单阶段时自动弹出教程。
 */
export function attachTutorial(api, opts = {}) {
  if (!hasDom() || !api) return null;
  if (bound?.api === api) return bound;
  detachTutorial();
  bound = { api };
  document.addEventListener("click", onDocClick);
  if (typeof window !== "undefined") {
    // main.js 已经把这局挂在 window.__zhaoyun 上，教程的开关顺路搭上去，方便 e2e。
    const dbg = window.__zhaoyun;
    if (dbg) dbg.tutorial = { open: openTutorial, close: closeTutorial, seen: tutorialSeen, forget: forgetTutorial };
  }
  const auto = opts.auto ?? true;
  if (auto && !tutorialSeen() && api.state?.phase === "menu") openTutorial(0);
  return bound;
}

export function detachTutorial() {
  if (hasDom()) document.removeEventListener("click", onDocClick);
  closeTutorial({ remember: false });
  bound = null;
}
