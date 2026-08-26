import { CELL_COUNT, COLS, ROWS } from "../data/units.js";
import { measurePath, nearestOn, pathPoints, pointOn } from "./path.js";

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
 * range → 实际半径（格）。data 表不可改，缩放留在战斗层：
 * reach = range * scale + pad。默认值下近战覆盖约半条路，
 * 弓/赵云覆盖大半，黄忠(range 3)接近全场，射程档位因此拉得开。
 */
const REACH = { scale: 1.2, pad: 0.55, graze: 1.6 };

export function reachConfig() {
  return { ...REACH };
}

export function configureReach(patch = {}) {
  if (typeof patch.scale === "number") REACH.scale = patch.scale;
  if (typeof patch.pad === "number") REACH.pad = patch.pad;
  if (typeof patch.graze === "number") REACH.graze = Math.max(1, patch.graze);
  return reachConfig();
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
  return Math.max(0, range || 0) * REACH.scale + REACH.pad;
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
  const reach = reachOf(range);
  if (distance <= reach) return 1;
  const outer = grazeOf(range);
  if (distance >= outer) return 0;
  return 1 - (distance - reach) / (outer - reach);
}

export function hitFactor(index, t, range) {
  return hitFactorAt(distanceToProgress(index, t), range);
}

/**
 * 该格在整条路线上的覆盖区间（可能因折线回绕而有多段）。
 * 战斗不需要它，但 AI 摆位与 UI 射程提示需要，故一并导出。
 */
export function coverageWindows(index, range, samples = 96) {
  const reach = reachOf(range);
  const out = [];
  let open = null;
  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
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
