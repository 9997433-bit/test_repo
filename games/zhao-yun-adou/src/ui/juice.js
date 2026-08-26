/**
 * juice 层：把总线上的 `skill` / `kill` / `leak` / `merge` 翻成看得见的反馈。
 *
 * ── 为什么不直接往 `#app` 里塞节点 ──────────────────────────────
 * 主循环把界面渲染到离屏容器再做同构 diff：`#app` 里多出来的节点会在下一次
 * patch 时被删掉，后加的 class 也会被 `syncAttrs` 洗回渲染层给的那份。
 * 所以飘字挂在 `document.body` 上一层自己的 fixed 图层里，只按目标元素的
 * 视口坐标定位；棋盘钩子（`data-cell` / `data-hand` / `#lane-*`）一个不碰。
 *
 * ── 两条演出通道 ───────────────────────────────────────────────
 * 1. DOM 飘字 / 涟漪 / 震屏：事件到来时即时创建，WAAPI 自播自清，
 *    不依赖 patch 节奏，也就不需要 main.js 帮忙 markDirty。
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
/** 同屏飘字上限，超了从最早的开始回收。 */
const FLOAT_CAP = 12;

const SIDES = ["player", "ai"];

const laneFx = { player: [], ai: [] };
const seen = { player: new Map(), ai: new Map() };
const floats = [];

let bound = null;
let layer = null;
let seq = 0;
let clock = defaultClock;

function defaultClock() {
  return (typeof performance !== "undefined" ? performance.now() : Date.now()) / 1000;
}

const hasDom = () => typeof document !== "undefined" && !!document.body;

function reducedMotion() {
  try {
    return typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

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

const LAYER_CSS = `
#zy-juice { position: fixed; inset: 0; z-index: 40; pointer-events: none; overflow: hidden; contain: layout paint; }
#zy-juice .zy-float { position: absolute; transform: translate(-50%, -50%); white-space: nowrap; font-family: var(--font-body, serif); font-size: 13px; font-weight: 700; letter-spacing: 0.04em; line-height: 1; color: var(--cinnabar, #b23a2f); text-shadow: 0 0 3px var(--paper-bright, #fbf5e6), 0 0 7px var(--paper-bright, #fbf5e6), 0 1px 0 rgba(255, 255, 255, 0.6); }
#zy-juice .zy-float.zy-skill { font-family: var(--font-brush, cursive); font-size: 26px; font-weight: 400; letter-spacing: 0.12em; }
#zy-juice .zy-float.zy-leak { font-size: 16px; }
#zy-juice .zy-ring { position: absolute; transform: translate(-50%, -50%); border-radius: 50%; border: 2px solid currentColor; }
`;

function ensureLayer() {
  if (!hasDom()) return null;
  if (layer?.isConnected) return layer;
  let style = document.getElementById("zy-juice-css");
  if (!style) {
    style = document.createElement("style");
    style.id = "zy-juice-css";
    style.textContent = LAYER_CSS;
    document.head?.appendChild(style);
  }
  layer = document.getElementById("zy-juice");
  if (!layer) {
    layer = document.createElement("div");
    layer.id = "zy-juice";
    layer.setAttribute("aria-hidden", "true");
    document.body.appendChild(layer);
  }
  return layer;
}

function dropFloat(el) {
  const i = floats.indexOf(el);
  if (i >= 0) floats.splice(i, 1);
  el.remove();
}

function trackFloat(el, ms) {
  floats.push(el);
  while (floats.length > FLOAT_CAP) dropFloat(floats[0]);
  setTimeout(() => dropFloat(el), Math.max(60, ms) + 90);
}

/** WAAPI 播完即弃；没有 animate 的环境（jsdom / 老浏览器）退化成静态显示。 */
function play(el, frames, ms, easing = "cubic-bezier(0.25, 0.9, 0.3, 1)") {
  if (typeof el.animate !== "function") return null;
  try {
    return el.animate(frames, { duration: Math.max(1, ms), easing, fill: "none" });
  } catch {
    return null;
  }
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
 * 冒一个飘字。`opts.rise` 控制上飘距离（像素），负数即向下。
 */
function floatText(anchor, text, opts = {}) {
  const box = rectOf(anchor);
  const host = ensureLayer();
  if (!box || !host || !text) return null;
  const el = document.createElement("b");
  el.className = `zy-float ${opts.cls || ""}`.trim();
  el.textContent = text;
  if (opts.color) el.style.color = opts.color;
  el.style.left = `${box.left + box.width / 2 + (opts.dx || 0)}px`;
  el.style.top = `${box.top + box.height * (opts.anchorY ?? 0.42)}px`;
  host.appendChild(el);

  const ms = reducedMotion() ? 520 : (opts.ms ?? 900);
  const rise = reducedMotion() ? 10 : (opts.rise ?? 34);
  play(
    el,
    [
      { opacity: 0, transform: `translate(-50%, -50%) scale(${opts.pop ?? 0.72})` },
      { opacity: 1, transform: `translate(-50%, calc(-50% - ${rise * 0.42}px)) scale(1.06)`, offset: 0.2 },
      { opacity: 1, transform: `translate(-50%, calc(-50% - ${rise * 0.78}px)) scale(1)`, offset: 0.62 },
      { opacity: 0, transform: `translate(-50%, calc(-50% - ${rise}px)) scale(0.96)` },
    ],
    ms,
  );
  trackFloat(el, ms);
  return el;
}

/** 一圈墨晕：合并、觉醒这类「原地发生了什么」的定位提示。 */
function ringAt(anchor, color, ms = 480) {
  const box = rectOf(anchor);
  const host = ensureLayer();
  if (!box || !host) return null;
  const size = Math.max(24, Math.min(box.width, box.height));
  const el = document.createElement("i");
  el.className = "zy-ring";
  el.style.color = color;
  el.style.width = `${size}px`;
  el.style.height = `${size}px`;
  el.style.left = `${box.left + box.width / 2}px`;
  el.style.top = `${box.top + box.height / 2}px`;
  host.appendChild(el);
  const dur = reducedMotion() ? 200 : ms;
  play(
    el,
    [
      { opacity: 0.85, transform: "translate(-50%, -50%) scale(0.55)" },
      { opacity: 0, transform: "translate(-50%, -50%) scale(1.85)" },
    ],
    dur,
    "cubic-bezier(0.15, 0.7, 0.3, 1)",
  );
  trackFloat(el, dur);
  return el;
}

/** 棋子自己弹一下：比外挂图层更能说明「就是这一格」。 */
function popCell(el, strength = 1) {
  if (!el || reducedMotion()) return;
  play(
    el,
    [
      { transform: `scale(${1 + 0.18 * strength}) rotate(${-1.2 * strength}deg)` },
      { transform: "scale(0.97)", offset: 0.55 },
      { transform: "scale(1)" },
    ],
    360,
  );
}

/** 半区震颤。强度 0~1，主要给大招与漏怪。 */
function shakeHalf(sideId, strength) {
  const el = halfElement(sideId);
  if (!el || reducedMotion() || !(strength > 0)) return;
  const a = 3 + 7 * Math.min(1, strength);
  play(
    el,
    [
      { transform: `translate(${-a}px, 1px) rotate(${-0.3 * strength}deg)` },
      { transform: `translate(${a * 0.9}px, -1px) rotate(${0.26 * strength}deg)`, offset: 0.2 },
      { transform: `translate(${-a * 0.6}px, 0)`, offset: 0.42 },
      { transform: `translate(${a * 0.34}px, 1px)`, offset: 0.66 },
      { transform: "translate(0, 0)" },
    ],
    260 + 160 * Math.min(1, strength),
    "cubic-bezier(0.36, 0.07, 0.19, 0.97)",
  );
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
  floatText(adou, `阿斗 −1 心`, { cls: "zy-leak", color: PALETTE.cinnabar, rise: 26, ms: 1000 });
  // main.js 已给玩家半区挂了 .shake，这里只补对岸，免得两套震颤打架。
  if (side !== "player") shakeHalf(side, 0.5);
}

function onMerge(p) {
  const side = p?.side;
  if (!laneFx[side]) return;
  const cell = cellElement(side, p.cellIndex);
  if (!cell) return;
  const gold = (p.level || 0) >= 4;
  ringAt(cell, gold ? PALETTE.gold : PALETTE.cinnabar);
  floatText(cell, `Lv${p.level}`, {
    color: gold ? PALETTE.gold : PALETTE.cinnabar,
    rise: 30,
    ms: 780,
  });
  popCell(cell, gold ? 1 : 0.75);
}

function onSkill(p) {
  const side = p?.side;
  if (!laneFx[side]) return;
  const j = p.juice || {};
  pushLane(side, {
    kind: "skill",
    shape: j.shape || "ring",
    t: typeof j.focusT === "number" ? j.focusT : null,
    life: Math.max(0.35, Math.min(1.6, j.duration || 0.6)),
    color: j.color || PALETTE.cinnabar,
    text: j.text || p.skill || "",
    textColor: j.color || PALETTE.cinnabar,
    hits: p.hits || 0,
    scale: 1 + Math.min(1, j.shake || 0),
  });

  const cell = cellElement(side, p.cellIndex);
  if (cell) {
    floatText(cell, j.text || p.skill || "", {
      cls: "zy-skill",
      color: j.color || PALETTE.cinnabar,
      rise: 46,
      ms: 1150,
      pop: 0.55,
    });
    popCell(cell, 1);
  }
  if (p.kills > 0) {
    const anchor = cell || halfElement(side);
    floatText(anchor, `斩 ${p.kills}`, {
      color: PALETTE.gold,
      rise: 30,
      ms: 900,
      dx: 34,
      anchorY: 0.75,
    });
  }
  shakeHalf(side, j.shake || 0);
}

/** 换局清场：旧特效不该跨局残留。 */
export function resetJuice() {
  for (const id of SIDES) {
    laneFx[id].length = 0;
    seen[id].clear();
  }
  while (floats.length) dropFloat(floats[0]);
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
  if (layer?.isConnected) layer.remove();
  layer = null;
}

/** 调试与单测用：当前特效计数。 */
export function juiceStats() {
  return {
    attached: !!bound,
    lane: { player: laneFx.player.length, ai: laneFx.ai.length },
    floats: floats.length,
  };
}
