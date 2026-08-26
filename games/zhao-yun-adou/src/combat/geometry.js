import * as unitTable from "../data/units.js";
import { measurePath, nearestOn, pathPoints, pointOn } from "./path.js";
import { createTuning, tableFrom } from "./tuning.js";

const { CELL_COUNT, COLS, ROWS } = unitTable;

/**
 * 战斗几何：把 COLS×ROWS 的棋盘与「几」字路线放进同一坐标系，
 * 单位取「格」（一格宽 = 1），于是 range 表里的 1/2/3 可直接当半径用。
 *
 * 以前的判定只看 cellDistToPath（格子到棋盘边缘的曼哈顿距离），
 * 同一行的格子对整条路线一视同仁，射程形同虚设。现在改为
 * 「格心 ↔ 敌人当前路线坐标」的真实距离：格子只能打到自己覆盖的那段路，
 * 敌人推进到别处就脱离火力，摆放位置因此变成有意义的决策。
 */
const LANE = measurePath(pathPoints(COLS, ROWS, false));

/**
 * range → 实际半径（格）：reach = range * scale + pad。
 * 缩放默认留在战斗层。默认值下近战覆盖约半条路，
 * 弓/赵云覆盖大半，黄忠(range 3)接近全场，射程档位因此拉得开。
 */
const REACH_DEFAULTS = { scale: 1.2, pad: 0.55, graze: 1.6 };

/**
 * 兵种表若导出 `REACH`（或 `REACH_TUNING` / `RANGE_TUNING`），这里整表覆盖默认值。
 * 现在 data/units.js 没有这个导出，于是照常用上面的默认值 —— 射程手感要重调时，
 * 在 data 表里加一个导出就够了。
 */
const TUNING = createTuning({
  defaults: REACH_DEFAULTS,
  table: tableFrom(unitTable, ["REACH", "REACH_TUNING", "RANGE_TUNING"]),
  coerce: {
    scale: (v) => Math.max(0, v),
    pad: (v) => Math.max(0, v),
    graze: (v) => Math.max(1, v),
  },
});

const REACH = TUNING.live;

export function reachConfig() {
  return TUNING.read();
}

export function configureReach(patch = {}) {
  return TUNING.patch(patch);
}

/** 回到「默认值 + data 表覆盖」的状态，丢弃运行时改动。 */
export function resetReach() {
  return TUNING.reset();
}

export const LANE_LENGTH = LANE.total;

const CENTERS = Array.from({ length: CELL_COUNT }, (_, i) => ({
  x: (i % COLS) + 0.5,
  y: Math.floor(i / COLS) + 0.5,
}));

const ANCHORS = CENTERS.map((c) => nearestOn(LANE, c.x, c.y));

export function cellCenter(index) {
  return CENTERS[index] || CENTERS[0];
}

/** 格子最贴近的路线进度与垂距，可供 AI / UI 判断「这格守哪一段」。 */
export function cellAnchor(index) {
  return ANCHORS[index] || ANCHORS[0];
}

export function lanePoint(t) {
  return pointOn(LANE, t);
}

export function reachOf(range) {
  const tier = Number.isFinite(range) ? Math.max(0, range) : 0;
  return tier * REACH.scale + REACH.pad;
}

/** 格心到路线进度 t 的直线距离（格）。 */
export function distanceToProgress(index, t) {
  const c = cellCenter(index);
  const p = pointOn(LANE, t);
  return Math.hypot(c.x - p.x, c.y - p.y);
}

export function inReach(index, t, range) {
  return distanceToProgress(index, t) <= reachOf(range);
}

/** 掠射外沿：核心射程之外还能擦到，伤害线性衰减到 0。 */
export function grazeOf(range) {
  return reachOf(range) * REACH.graze;
}

/**
 * 命中系数：核心圈内满伤，外沿线性衰减。
 * 软边缘让摆位收益落在「谁把敌人罩进核心圈」，
 * 而不是差半格就完全打不到。
 */
export function hitFactorAt(distance, range) {
  return falloffFor(range).factor(distance);
}

/**
 * 一次算好某个射程的判定参数，热循环里按 (格子 × 敌人) 复用。
 * outer2 让距离筛选先用平方比较，省掉每次 Math.hypot。
 */
export function falloffFor(range) {
  const reach = reachOf(range);
  const outer = grazeOf(range);
  const span = outer - reach;
  return {
    reach,
    outer,
    outer2: outer * outer,
    factor(distance) {
      // 距离算不出来（坏坐标）时给 0：给 1 等于让一发满伤白送出去。
      if (!Number.isFinite(distance)) return 0;
      if (distance <= reach) return 1;
      if (distance >= outer || span <= 0) return 0;
      return 1 - (distance - reach) / span;
    },
  };
}

export function hitFactor(index, t, range) {
  return hitFactorAt(distanceToProgress(index, t), range);
}

/**
 * 该格在整条路线上的覆盖区间（可能因折线回绕而有多段）。
 * 战斗不需要它，但 AI 摆位与 UI 射程提示需要，故一并导出。
 */
export function coverageWindows(index, range, samples = 96) {
  const steps = Number.isFinite(samples) ? Math.max(1, Math.floor(samples)) : 96;
  const reach = reachOf(range);
  const out = [];
  let open = null;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const hit = distanceToProgress(index, t) <= reach;
    if (hit && !open) open = { from: t, to: t };
    else if (hit && open) open.to = t;
    else if (!hit && open) {
      out.push(open);
      open = null;
    }
  }
  if (open) out.push(open);
  return out;
}

/** 覆盖比例：0~1，越大说明这格能打到越长的一段路。 */
export function coverageRatio(index, range, samples = 96) {
  return coverageWindows(index, range, samples).reduce((sum, w) => sum + (w.to - w.from), 0);
}

export { COLS, ROWS };
