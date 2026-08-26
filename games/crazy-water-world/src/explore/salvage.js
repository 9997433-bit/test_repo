import { RESOURCE_META } from "../data/resources.js";
import { modOf, weatherLabel } from "./mods.js";

/** 一个模拟量子的秒数；spawnFlotsam 的 dt 默认值，保持与 engine 的 0.1s 步长一致。 */
const QUANTUM = 0.1;

export const FLOTSAM_KINDS = [
  { res: "wood", w: 36, n: [1, 3] },
  { res: "plastic", w: 22, n: [1, 2] },
  { res: "scrap", w: 12, n: [1, 2] },
  { res: "rope", w: 10, n: [1, 1] },
  { res: "stone", w: 8, n: [1, 2] },
  { res: "blueprint", w: 2, n: [1, 1], rare: true },
];

/**
 * 海面漂浮物的渲染几何。canvas 与点击命中共用这一份数字，避免"画在一处、点在另一处"。
 * baseY/spanY 是画布高度比例与像素偏移，与 world/canvas.js 的绘制口径一致。
 */
export const FLOTSAM_VIEW = {
  baseY: 0.38,
  spanY: 40,
  bobAmp: 8,
  bobPeriodMs: 400,
  radius: 7,
  rareRadius: 10,
  pad: 6,
  wrapX: 1.12,
};

function round2(n) {
  return Math.round(n * 100) / 100;
}

function pick(rng) {
  const total = FLOTSAM_KINDS.reduce((s, k) => s + k.w, 0);
  let r = rng() * total;
  for (const k of FLOTSAM_KINDS) {
    r -= k.w;
    if (r <= 0) return k;
  }
  return FLOTSAM_KINDS[0];
}

function flotsamList(source) {
  if (Array.isArray(source)) return source;
  return source?.explore?.salvage?.flotsam ?? [];
}

/** 稀有闪光相位：只吃 tick 与漂浮物自带的 phase，不读墙钟，重放一致。 */
function shimmerAt(f, tick) {
  const phase = typeof f.phase === "number" ? f.phase : 0;
  return round2(0.5 + 0.5 * Math.sin(tick * 0.35 + phase * Math.PI * 2));
}

/** 拾荒船（数量 + 等级）对容量、刷新率、闪光概率、入袋量的加成。 */
export function salvageBonus(state) {
  const boats = (state.buildings || []).filter((b) => b.type === "salvage");
  const count = boats.length;
  const levels = boats.reduce((s, b) => s + (b.level || 1), 0);
  const extra = levels - count;
  return {
    boats: count,
    levels,
    cap: 10 + count + levels,
    spawnMul: 1 + 0.35 * count + 0.12 * extra,
    shineChance: 0.02 + 0.03 * count + 0.01 * extra,
    yieldMul: 1 + 0.12 * levels,
  };
}

/**
 * 天气刷新倍率读世界侧落下的 state.world.mods.salvage 快照（缺席时回退天气表）：
 * 拾荒与建筑产出吃的是同一个数，改天气表不用两处对齐。
 */
export function weatherSalvageMul(state) {
  return modOf(state, "salvage", 1);
}

export function flotsamRadius(f) {
  return f?.rare ? FLOTSAM_VIEW.rareRadius : FLOTSAM_VIEW.radius;
}

/** 漂浮物在画布上的中心点与半径。view = { width, height, tMs, reduceMotion }。 */
export function flotsamScreenPos(f, view = {}) {
  const width = view.width || 0;
  const height = view.height || 0;
  const tMs = view.tMs || 0;
  const bob = view.reduceMotion ? 0 : Math.sin(tMs / FLOTSAM_VIEW.bobPeriodMs + f.x) * FLOTSAM_VIEW.bobAmp;
  return {
    cx: ((f.x + 1) / 2) * width,
    cy: height * FLOTSAM_VIEW.baseY + bob + f.y * FLOTSAM_VIEW.spanY,
    r: flotsamRadius(f),
  };
}

/** 全部漂浮物的画布布局，渲染与命中检测共用。source 可传 state 或 flotsam 数组。 */
export function flotsamLayout(source, view = {}) {
  return flotsamList(source).map((item) => ({ item, id: item.id, ...flotsamScreenPos(item, view) }));
}

/**
 * 二维命中检测（基线只比 x 距离，任何高度都能点中）。
 * point 是相对画布左上角的 CSS 像素坐标。
 */
export function hitTestFlotsam(source, point = {}, view = {}) {
  const pad = typeof view.pad === "number" ? view.pad : FLOTSAM_VIEW.pad;
  const px = Number(point.x);
  const py = Number(point.y);
  if (!Number.isFinite(px) || !Number.isFinite(py)) return { ok: false, reason: "E_INVALID_ARG", id: null, item: null };
  let best = null;
  let bestD = Infinity;
  for (const spot of flotsamLayout(source, view)) {
    const d = Math.hypot(spot.cx - px, spot.cy - py);
    if (d <= spot.r + pad && d < bestD) {
      best = spot;
      bestD = d;
    }
  }
  if (!best) return { ok: false, reason: "E_NOT_FOUND", id: null, item: null };
  return { ok: true, reason: "", id: best.id, item: best.item, dist: round2(bestD), cx: best.cx, cy: best.cy, r: best.r };
}

function drift(f, dt, tick) {
  const step = dt / QUANTUM;
  let x = f.x + (f.vx || 0) * step;
  if (x > FLOTSAM_VIEW.wrapX) x = -FLOTSAM_VIEW.wrapX;
  else if (x < -FLOTSAM_VIEW.wrapX) x = FLOTSAM_VIEW.wrapX;
  return { ...f, x, ttl: f.ttl - dt, shimmer: shimmerAt(f, tick) };
}

/**
 * 纯函数（给定 rng 流位置）：衰减 ttl、漂移 x、按容量概率补货。
 * rng 消费顺序保持基线前缀：刷新判定 → 种类 → 数量 → x → y → vx，新增的相位与闪光判定追加在末尾。
 */
export function spawnFlotsam(state, rng, dt = QUANTUM) {
  const salv = salvageBonus(state);
  const cap = salv.cap;
  const step = Math.max(0, dt) / QUANTUM;
  const tick = state.meta?.tick ?? 0;
  const list = flotsamList(state)
    .filter((f) => f.ttl > 0)
    .map((f) => drift(f, Math.max(0, dt), tick));

  if (list.length < cap && rng() < 0.08 * step * weatherSalvageMul(state) * salv.spawnMul) {
    const k = pick(rng);
    const n = k.n[0] + Math.floor(rng() * (k.n[1] - k.n[0] + 1));
    const x = rng() * 2 - 1;
    const y = rng() * 0.6 - 0.1;
    const vx = (rng() - 0.5) * 0.004;
    const phase = rng();
    const shiny = !k.rare && rng() < salv.shineChance;
    const rare = !!k.rare || shiny;
    const ttl = rare ? 26 : 18;
    list.push({
      id: `f-${tick}-${list.length}`,
      res: k.res,
      n: shiny ? n + 1 : n,
      rare,
      x,
      y,
      vx,
      ttl,
      tier: k.rare ? "rare" : shiny ? "shiny" : "common",
      phase,
      shimmer: shimmerAt({ phase }, tick),
      bornTick: tick,
      maxTtl: ttl,
    });
  }
  return list.slice(-cap);
}

export function collectFlotsam(state, id) {
  const item = flotsamList(state).find((f) => f.id === id);
  if (!item) return state;
  const salv = salvageBonus(state);
  const gain = round2(item.n * salv.yieldMul);
  const resName = RESOURCE_META[item.res]?.name || item.res;
  const salvage = state.explore.salvage;
  return {
    ...state,
    resources: { ...state.resources, [item.res]: (state.resources[item.res] || 0) + gain },
    player: { ...state.player, exp: state.player.exp + (item.rare ? 8 : 2) },
    explore: {
      ...state.explore,
      salvage: {
        ...salvage,
        flotsam: salvage.flotsam.filter((f) => f.id !== id),
        picked: (salvage.picked || 0) + 1,
        rarePicked: (salvage.rarePicked || 0) + (item.rare ? 1 : 0),
        lastPick: {
          id: item.id,
          res: item.res,
          name: resName,
          n: item.n,
          gain,
          rare: !!item.rare,
          tier: item.tier || (item.rare ? "rare" : "common"),
          tick: state.meta?.tick ?? 0,
        },
      },
    },
    log: [
      `捞到 ${gain} ${resName}${item.rare ? "（稀有闪光！）" : ""}${salv.boats && gain > item.n ? `（拾荒船 +${round2(gain - item.n)}）` : ""}`,
      ...state.log,
    ].slice(0, 24),
  };
}

/** 给 UI 的一步到位入口：按画布坐标捡起最近的漂浮物，没命中返回原引用。 */
export function collectFlotsamAt(state, point, view) {
  const hit = hitTestFlotsam(state, point, view);
  if (!hit.ok) return state;
  return collectFlotsam(state, hit.id);
}

/** 拾荒面板用的汇总：容量占用、稀有件数、天气刷新倍率。 */
export function salvageSummary(state) {
  const list = flotsamList(state);
  const salv = salvageBonus(state);
  return {
    count: list.length,
    cap: salv.cap,
    rare: list.filter((f) => f.rare).length,
    boats: salv.boats,
    yieldMul: round2(salv.yieldMul),
    weatherMul: weatherSalvageMul(state),
    weather: weatherLabel(state),
    picked: state.explore?.salvage?.picked || 0,
    rarePicked: state.explore?.salvage?.rarePicked || 0,
  };
}