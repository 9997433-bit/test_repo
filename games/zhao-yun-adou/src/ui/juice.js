/**
 * juice 层：把总线上的 `skill` / `kill` / `leak` / `merge` 翻成看得见的反馈。
 *
 * ── 为什么不直接往 `#app` 里塞节点 ──────────────────────────────
 * 主循环把界面渲染到离屏容器再做同构 diff：`#app` 里多出来的节点会在下一次
 * patch 时被删掉，后加的 class 也会被 `syncAttrs` 洗回渲染层给的那份。
 * 所以飘字与泼墨挂在 `#fx-layer`（body 下与 `#app` 平级的固定层）里，只按目标
 * 元素的视口坐标定位；棋盘钩子（`data-cell` / `data-hand` / `#lane-*`）一个不碰。
 * 震屏是唯一的例外：类挂在 `#app` 根节点上 —— diff 只重写它的子树，根节点安全。
 *
 * ── 两条演出通道 ───────────────────────────────────────────────
 * 1. DOM 通道：只用 `styles/fx.css` 的契约类（`.fx-float` / `.fx-splash` /
 *    `.fx-quake`），定位与强度一律写 `--fx-*` 变量，颜色写 `color`；
 *    本文件不再自注入样式、不写行内关键帧，演出层的唯一事实源是 fx.css。
 * 2. 画布特效：事件只往 `laneFx` 里记一条，真正的绘制由 `ui/lane.js`
 *    在每帧的 `drawLane` 里取走（`takeLaneEffects`），因此天然跟着帧走。
 *
 * 敌人死亡事件只带 id 不带坐标，所以 `noteEnemies` 每帧把 id→路线进度
 * 记一份；`kill` 到达时查上一帧的位置落墨，误差一帧，肉眼无感。
 */

const PALETTE = {
  ink: "#241c12",
  cinnabar: "#b23a2f",
  gold: "#c9a24a",
  moss: "#6b7a6a",
};

/** 单侧画布同时存活的特效上限：清线爆发时不至于糊成一片。 */
const LANE_CAP = 24;
/** 同屏 DOM 演出元素上限，超了从最早的开始回收。 */
const NODE_CAP = 14;

/** fx.css 的契约挂载点，见 ART_DIRECTION §5.2。 */
const LAYER_ID = "fx-layer";
const APP_ID = "app";

/**
 * 时长兜底值，与 tokens.css 的 `--dur-*` 一致；运行时优先读真实令牌，
 * 读不到（jsdom / 样式未加载）才用这里的常量。计时只用于「到点摘掉节点」，
 * 早一点晚一点无伤，但不能比动画短。
 */
const FALLBACK_MS = { float: 820, splash: 620, quake: 420 };
/** fx.css 里 `.fx-float.brush` 与 `.fx-splash.aura` 的时长倍率。 */
const BRUSH_FACTOR = 1.4;
const AURA_FACTOR = 1.9;
/** 动画结束到摘节点之间留的余量。 */
const REAP_SLACK = 140;

const SIDES = ["player", "ai"];

const laneFx = { player: [], ai: [] };
const seen = { player: new Map(), ai: new Map() };
/** 当前挂在 `#fx-layer` 里的演出节点，先进先出地回收。 */
const nodes = [];

let bound = null;
let layer = null;
/** 层是本模块建的才由本模块拆；写在 index.html 里的那个不许动。 */
let layerOwned = false;
let quakeTimer = 0;
let seq = 0;
let clock = defaultClock;

function defaultClock() {
  return (typeof performance !== "undefined" ? performance.now() : Date.now()) / 1000;
}

const hasDom = () => typeof document !== "undefined" && !!document.body;

/* ------------------------------------------------------------- 画布特效 */

function pushLane(sideId, fx) {
  const list = laneFx[sideId];
  if (!list) return null;
  fx.id = ++seq;
  fx.born = clock();
  if (list.length >= LANE_CAP) list.splice(0, list.length - LANE_CAP + 1);
  list.push(fx);
  return fx;
}

/**
 * 取走某侧当前存活的特效（顺带淘汰过期项）。
 * 返回的是内部数组本身，调用方只读、只在本帧内使用。
 */
export function takeLaneEffects(sideId) {
  const list = laneFx[sideId];
  if (!list || !list.length) return list || [];
  const t = clock();
  for (let i = list.length - 1; i >= 0; i--) {
    if (t - list[i].born >= list[i].life) list.splice(i, 1);
  }
  return list;
}

/** 特效播放进度 0~1，供绘制层换算关键帧。 */
export function fxProgress(fx, at = clock()) {
  if (!fx || !(fx.life > 0)) return 1;
  return Math.max(0, Math.min(1, (at - fx.born) / fx.life));
}

/** 每帧记一份 id→路线进度：`kill` 事件只给 id，落墨点要靠它。 */
export function noteEnemies(sideId, enemies) {
  const map = seen[sideId];
  if (!map) return;
  map.clear();
  if (!Array.isArray(enemies)) return;
  for (const e of enemies) {
    if (e && e.id != null) map.set(e.id, Math.max(0, Math.min(1, e.t || 0)));
  }
}

function lastSeenT(sideId, id) {
  const t = seen[sideId]?.get(id);
  return typeof t === "number" ? t : null;
}

/* --------------------------------------------------------------- DOM 层 */

const durCache = new Map();

/** 读 tokens.css 的时长令牌（`820ms` / `0.82s` 都认），失败退回常量。 */
function tokenMs(name, fallback) {
  if (durCache.has(name)) return durCache.get(name);
  let ms = fallback;
  try {
    const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    const n = Number.parseFloat(raw);
    if (Number.isFinite(n) && n > 0) ms = raw.endsWith("ms") ? n : n * 1000;
  } catch {
    /* 样式没加载就用兜底值 */
  }
  durCache.set(name, ms);
  return ms;
}

/**
 * `#fx-layer`：index.html 里已经备了一个；拿不到就自己补一个，
 * 两种来源的样式都由 fx.css 提供，本模块一行样式也不注入。
 */
function ensureLayer() {
  if (!hasDom()) return null;
  if (layer?.isConnected) return layer;
  layer = document.getElementById(LAYER_ID);
  layerOwned = false;
  if (!layer) {
    layer = document.createElement("div");
    layer.id = LAYER_ID;
    layer.setAttribute("aria-hidden", "true");
    document.body.appendChild(layer);
    layerOwned = true;
  }
  return layer;
}

function appRoot() {
  return hasDom() ? document.getElementById(APP_ID) : null;
}

function drop(el) {
  const i = nodes.indexOf(el);
  if (i >= 0) nodes.splice(i, 1);
  clearTimeout(el._fxReap);
  el.remove();
}

/**
 * 挂上去、到点摘掉。动画由 fx.css 播，`animationend` 先到就先摘；
 * 偏好减弱动效时 CSS 会把动画整个取消（飘字静止全显），这时只有定时器管用。
 */
function spawn(el, ms) {
  const host = ensureLayer();
  if (!host) return null;
  host.appendChild(el);
  nodes.push(el);
  while (nodes.length > NODE_CAP) drop(nodes[0]);
  el.addEventListener("animationend", () => drop(el), { once: true });
  el._fxReap = setTimeout(() => drop(el), ms + REAP_SLACK);
  return el;
}

/** 定位只走 `--fx-x/--fx-y`（`#fx-layer` 内用 px），不写 left/top。 */
function place(el, x, y) {
  el.style.setProperty("--fx-x", `${Math.round(x)}px`);
  el.style.setProperty("--fx-y", `${Math.round(y)}px`);
}

function rectOf(el) {
  if (!el || typeof el.getBoundingClientRect !== "function") return null;
  const r = el.getBoundingClientRect();
  if (!r || (!r.width && !r.height)) return null;
  return r;
}

function cellElement(sideId, cellIndex) {
  if (!hasDom() || !Number.isInteger(cellIndex)) return null;
  const grid = document.getElementById(`grid-${sideId}`);
  return grid?.children?.[cellIndex] || null;
}

function halfElement(sideId) {
  return hasDom() ? document.querySelector(`.half.${sideId}`) : null;
}

/**
 * 冒一个飘字。`tone` 走 fx.css 的 `.gold` / `.ink` 修饰类；
 * 招式名用 `.brush`（楷书大字），只有武将主色才写行内 color。
 */
function floatText(anchor, text, opts = {}) {
  const box = rectOf(anchor);
  if (!box || !text) return null;
  const el = document.createElement("b");
  el.className = ["fx-float", opts.tone || "", opts.brush ? "brush" : ""].filter(Boolean).join(" ");
  el.textContent = text;
  if (opts.color) el.style.color = opts.color;
  place(el, box.left + box.width / 2 + (opts.dx || 0), box.top + box.height * (opts.anchorY ?? 0.42));
  const base = tokenMs("--dur-float", FALLBACK_MS.float);
  return spawn(el, opts.brush ? base * BRUSH_FACTOR : base);
}

/**
 * 泼一团墨。`shape` 与 skills.js 的 `juice.shape` 一字不差
 * （sweep / rain / ring / arc / aura / dash），省略即基础墨团。
 */
function splashAt(anchor, opts = {}) {
  const box = rectOf(anchor);
  if (!box) return null;
  const el = document.createElement("i");
  el.className = opts.shape ? `fx-splash ${opts.shape}` : "fx-splash";
  if (opts.color) el.style.color = opts.color;
  if (opts.size) el.style.setProperty("--fx-size", `${Math.round(opts.size)}px`);
  place(el, box.left + box.width / 2, box.top + box.height / 2);
  const base = tokenMs("--dur-splash", FALLBACK_MS.splash);
  return spawn(el, opts.shape === "aura" ? base * AURA_FACTOR : base);
}

/** 棋格边长：泼墨尺寸按它换算，手机小格上才不会糊满半屏。 */
function splashSize(box, scale) {
  const side = Math.max(36, Math.min(box.width, box.height));
  return Math.max(96, Math.min(240, side * scale));
}

/**
 * 震屏：类挂 `#app` 根（CSS 只抖 `.arena`，不晃 HUD、不碰覆层定位），
 * `#fx-layer` 同挂让泼墨跟着共振。连发时先摘类、强制 reflow 再挂回去。
 */
function quake(strength) {
  const s = Math.max(0, Math.min(1, strength || 0));
  if (!(s > 0)) return;
  const hosts = [appRoot(), ensureLayer()].filter(Boolean);
  if (!hosts.length) return;
  for (const el of hosts) {
    el.classList.remove("fx-quake");
    void el.offsetWidth; // 强制 reflow，否则同一发动画不会重播
    el.style.setProperty("--fx-shake", s.toFixed(2));
    el.classList.add("fx-quake");
  }
  clearTimeout(quakeTimer);
  quakeTimer = setTimeout(() => clearQuake(), tokenMs("--dur-quake", FALLBACK_MS.quake) + REAP_SLACK);
}

function clearQuake() {
  clearTimeout(quakeTimer);
  quakeTimer = 0;
  if (!hasDom()) return;
  for (const el of [appRoot(), layer?.isConnected ? layer : null]) {
    if (!el) continue;
    el.classList.remove("fx-quake");
    el.style.removeProperty("--fx-shake");
  }
}

/* ---------------------------------------------------------------- 订阅 */

function onKill(p) {
  const side = p?.side;
  if (!laneFx[side]) return;
  const t = lastSeenT(side, p.id);
  if (t == null) return; // 没见过它上一帧的位置，宁可不落墨也不乱落
  pushLane(side, {
    kind: "splat",
    t,
    life: p.boss ? 1.05 : 0.6,
    color: p.boss ? PALETTE.cinnabar : PALETTE.ink,
    text: p.boss ? "斩" : p.reward > 0 ? `+${p.reward}` : "",
    textColor: p.boss ? PALETTE.gold : PALETTE.moss,
    scale: p.boss ? 2.1 : p.pressure ? 0.85 : 1,
  });
}

function onLeak(p) {
  const side = p?.side;
  if (!laneFx[side]) return;
  pushLane(side, {
    kind: "leak",
    t: 1,
    life: 0.95,
    color: PALETTE.cinnabar,
    text: p.boss ? "将破阵" : "破阵",
    textColor: PALETTE.cinnabar,
    scale: p.boss ? 1.7 : 1.25,
  });
  const adou = hasDom() ? document.querySelector(`.half.${side} .adou`) : null;
  floatText(adou, "阿斗 −1 心", { anchorY: 0.5 });
  // main.js 已给玩家半区挂了 .shake，这里只补对岸，免得两套震颤打架。
  if (side !== "player") quake(p.boss ? 0.5 : 0.35);
}

function onMerge(p) {
  const side = p?.side;
  if (!laneFx[side]) return;
  const cell = cellElement(side, p.cellIndex);
  const box = rectOf(cell);
  if (!box) return;
  const gold = (p.level || 0) >= 4;
  splashAt(cell, {
    shape: "ring",
    color: gold ? PALETTE.gold : PALETTE.cinnabar,
    size: splashSize(box, 2.4),
  });
  floatText(cell, `Lv${p.level}`, { tone: gold ? "gold" : "" });
}

function onSkill(p) {
  const side = p?.side;
  if (!laneFx[side]) return;
  const j = p.juice || {};
  const shake = Math.max(0, Math.min(1, j.shake || 0));
  pushLane(side, {
    kind: "skill",
    shape: j.shape || "ring",
    t: typeof j.focusT === "number" ? j.focusT : null,
    life: Math.max(0.35, Math.min(1.6, j.duration || 0.6)),
    color: j.color || PALETTE.cinnabar,
    text: j.text || p.skill || "",
    textColor: j.color || PALETTE.cinnabar,
    hits: p.hits || 0,
    scale: 1 + shake,
  });

  const cell = cellElement(side, p.cellIndex);
  const box = rectOf(cell);
  if (box) {
    // 泼墨落在出手的那一格：画布上那道扫击画的是「打到哪」，这里说的是「谁出的手」。
    splashAt(cell, {
      shape: j.shape || "ring",
      color: j.color || PALETTE.cinnabar,
      size: splashSize(box, 2.8 + shake),
    });
    floatText(cell, j.text || p.skill || "", { brush: true, color: j.color || PALETTE.cinnabar });
  }
  if (p.kills > 0) {
    floatText(cell || halfElement(side), `斩 ${p.kills}`, {
      tone: "gold",
      dx: 34,
      anchorY: 0.75,
    });
  }
  quake(shake);
}

/** 换局清场：旧特效不该跨局残留。 */
export function resetJuice() {
  for (const id of SIDES) {
    laneFx[id].length = 0;
    seen[id].clear();
  }
  while (nodes.length) drop(nodes[0]);
  clearQuake();
}

/**
 * 绑定一局游戏的总线。同一个 api 重复调用是空操作，
 * 因此 `render()` 每帧调它也不会重复订阅。
 */
export function attachJuice(api, opts = {}) {
  if (!api || !api.bus || typeof api.bus.on !== "function") return null;
  if (bound?.api === api) {
    if (typeof opts.clock === "function") clock = opts.clock;
    return bound;
  }
  detachJuice();
  // 时钟必须在 detach 之后再装：detach 会把它复位成真实时钟。
  if (typeof opts.clock === "function") clock = opts.clock;
  const offs = [
    api.bus.on("kill", onKill),
    api.bus.on("leak", onLeak),
    api.bus.on("merge", onMerge),
    api.bus.on("skill", onSkill),
    api.bus.on("start", resetJuice),
    api.bus.on("reset", resetJuice),
    api.bus.on("load", resetJuice),
  ];
  bound = { api, offs };
  ensureLayer();
  return bound;
}

export function detachJuice() {
  if (bound) {
    for (const off of bound.offs) {
      if (typeof off === "function") off();
    }
    bound = null;
  }
  resetJuice();
  clock = defaultClock;
  if (layerOwned && layer?.isConnected) layer.remove();
  layer = null;
  layerOwned = false;
}

/** 调试与单测用：当前特效计数。 */
export function juiceStats() {
  return {
    attached: !!bound,
    lane: { player: laneFx.player.length, ai: laneFx.ai.length },
    nodes: nodes.length,
  };
}
