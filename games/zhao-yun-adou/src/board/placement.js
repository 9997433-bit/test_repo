import { findHeroByGlyphs, heroById } from "../data/heroes.js";
import { UNIT_TABLE } from "../data/units.js";
import * as lane from "../combat/geometry.js";
import {
  cellAt,
  cellDistToPath,
  inBounds,
  isOccupied,
  isUnlockedEmpty,
  neighbors,
  toCoord,
  unlockedEmptyCells,
} from "./grid.js";
import { canMerge, isCombatant, isGlyph, isHero, isUnit } from "./merge.js";

/**
 * 摆位建议：UI 高亮与 AI 选点共用的一层纯函数。
 *
 * 这里**只读**棋盘，不写任何格子；createCells / neighbors / canMerge / scanAwaken
 * 的语义完全不变，本模块只是在它们之上算分。
 *
 * 打分的主心骨是 `combat/geometry.js` 的真实覆盖（coverageWindows / coverageRatio）：
 * 一格只守它够得着的那几段「几」字路线，所以「这格值不值得摆」是可以量化的。
 * 战斗层若不可用（被裁掉 / 显式 `{ lane: false }`），自动退回纯格子启发式，
 * 结论会变粗但接口与返回结构不变。
 *
 * 近战与远程的分工不是靠「外圈 / 内圈」这条老经验拍出来的 —— 在 5×4 的几字路上
 * 内圈反而覆盖更长。真正的分工来自机会成本：远程能守到近战完全够不着的段落
 * （`exclusive` 项），把那些格子让给远程，鲜活的贴路格子才留得住近战。
 */

/** 覆盖计算的默认采样点数（沿路线均匀取样）。 */
export const LANE_SAMPLES = 64;

/** 战斗层几何是否可用；不可用时全部退化为格子启发式。 */
const LANE_API =
  typeof lane.coverageWindows === "function" && typeof lane.coverageRatio === "function";

function maxRangeOfRole(role) {
  const rows = Object.values(UNIT_TABLE).filter((row) => row?.role === role);
  const ranges = rows.map((row) => (Number.isFinite(row.range) ? row.range : 1));
  if (!ranges.length) return role === "ranged" ? 2 : 1;
  return Math.max(...ranges);
}

/** 兵种表派生的档位射程，data 表调数值时这里自动跟随。 */
const ROLE_RANGE = Object.freeze({ melee: maxRangeOfRole("melee"), ranged: maxRangeOfRole("ranged") });

/** 机会成本基准：近战档位的射程，`exclusive` 项以它为参照。 */
const BASELINE_RANGE = ROLE_RANGE.melee;

/**
 * 打分权重。覆盖类三项按「格」的真实收益给大权重，
 * 其余是小额调味（合并、抱团、留白、内外圈），只在覆盖打平时才决定顺序。
 */
const WEIGHTS = Object.freeze({
  coverage: 100,
  fresh: 70,
  exclusive: 60,
  awaken: 40,
  merge: 9,
  ring: 6,
  kin: 2,
  room: 1,
});

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);

/** 战斗层覆盖是否真的接上了（供 UI 决定要不要画射程提示）。 */
export function usesLaneCoverage() {
  return LANE_API;
}

/** 默认权重副本（调用方可改一份传回 `opts.weights`）。 */
export function placementWeights() {
  return { ...WEIGHTS };
}

/** 角色 → 默认射程（`melee` / `ranged`）。 */
export function roleRange() {
  return { ...ROLE_RANGE };
}

function weightsOf(opts) {
  const patch = opts?.weights;
  if (!patch || typeof patch !== "object") return WEIGHTS;
  const out = { ...WEIGHTS };
  for (const key of Object.keys(WEIGHTS)) {
    if (Number.isFinite(patch[key])) out[key] = patch[key];
  }
  return out;
}

function laneOn(opts) {
  return LANE_API && opts?.lane !== false;
}

function samplesOf(opts) {
  const n = opts?.samples;
  return Number.isInteger(n) && n >= 8 && n <= 4096 ? n : LANE_SAMPLES;
}

function roleForRange(range) {
  if (!(range > 0)) return null;
  return range >= ROLE_RANGE.ranged ? "ranged" : "melee";
}

const emptySpec = () => ({ role: null, range: 0, id: null, level: null });

/**
 * 把「一张手牌 / 一个兵种 id / 一个角色名 / 一个射程数字」统一成打分用的规格。
 *
 * 认得的写法：`"melee"` / `"ranged"` / `"dao"` / `2` / 兵种棋子 / 已觉醒武将 /
 * `{ role, range }` 自定义规格。认不出的一律 range 0（不攻击），只剩格子项参与打分。
 */
export function specOf(input) {
  if (input == null) return emptySpec();

  if (typeof input === "number") {
    const range = Number.isFinite(input) && input > 0 ? input : 0;
    return { ...emptySpec(), range, role: roleForRange(range) };
  }

  if (typeof input === "string") {
    if (Object.hasOwn(ROLE_RANGE, input)) {
      return { role: input, range: ROLE_RANGE[input], id: null, level: null };
    }
    const row = UNIT_TABLE[input];
    if (row) return { role: row.role, range: row.range, id: row.id, level: 1 };
    return emptySpec();
  }

  if (typeof input !== "object") return emptySpec();

  if (isHero(input)) {
    const hero = heroById(input.id);
    const range = Number.isFinite(hero?.range) ? hero.range : ROLE_RANGE.ranged;
    return { role: roleForRange(range), range, id: input.id ?? null, level: input.level ?? null };
  }

  if (isUnit(input)) {
    const row = UNIT_TABLE[input.id];
    if (!row) return { ...emptySpec(), id: input.id ?? null, level: input.level ?? null };
    return {
      role: row.role,
      range: row.range,
      id: row.id,
      level: Number.isInteger(input.level) ? input.level : 1,
    };
  }

  const hasRole = typeof input.role === "string";
  const hasRange = Number.isFinite(input.range);
  if (hasRole || hasRange) {
    const range = hasRange ? Math.max(0, input.range) : (ROLE_RANGE[input.role] ?? 0);
    return {
      role: hasRole ? input.role : roleForRange(range),
      range,
      id: input.id ?? null,
      level: Number.isInteger(input.level) ? input.level : null,
    };
  }

  return { ...emptySpec(), id: input.id ?? null };
}

/** 棋子的射程（单字 / 道具 / 空格为 0，即不攻击）。 */
export function rangeOf(piece) {
  return specOf(piece).range;
}

/** 棋子的战斗角色（`melee` / `ranged`；不攻击的返回 null）。 */
export function roleOf(piece) {
  return specOf(piece).role;
}

/**
 * 纯格子的覆盖粗估：没有战斗几何时的退路。
 *
 * 只看「格到路线边沿的距离」：`range > dist` 才算够得着（近战因此只在贴边一圈有值），
 * 富余越多算覆盖越长。同一圈的格子无从区分，数值也没有物理意义，
 * 只保证两条单调性：射程越远越高、离路越远越低。
 */
export function gridCoverage(index, range) {
  if (!inBounds(index) || !(range > 0)) return 0;
  const slack = range - cellDistToPath(index);
  if (slack < 1) return 0;
  return clamp01((0.5 + slack) * 0.18);
}

/**
 * 该格在路线上的覆盖区间（可能多段）。战斗几何不可用时返回空数组。
 * 直接透传 `combat/geometry.js` 的 coverageWindows，UI 画射程提示可以直接用。
 */
export function coverageWindowsFor(index, range, opts = {}) {
  if (!laneOn(opts) || !inBounds(index) || !(range > 0)) return [];
  return lane.coverageWindows(index, range, samplesOf(opts));
}

/** 该格能守住的路线比例（0~1）。 */
export function cellCoverage(index, range, opts = {}) {
  if (!inBounds(index) || !(range > 0)) return 0;
  if (!laneOn(opts)) return gridCoverage(index, range);
  return clamp01(lane.coverageRatio(index, range, samplesOf(opts)));
}

function maskOf(index, range, samples, opts) {
  const mask = new Uint8Array(samples + 1);
  for (const w of coverageWindowsFor(index, range, { ...opts, samples })) {
    const from = Math.max(0, Math.round(w.from * samples));
    const to = Math.min(samples, Math.round(w.to * samples));
    for (let i = from; i <= to; i++) mask[i] = 1;
  }
  return mask;
}

function maskRatio(mask) {
  let hit = 0;
  for (let i = 0; i < mask.length; i++) hit += mask[i];
  return mask.length ? hit / mask.length : 0;
}

function maskGaps(mask, samples) {
  const gaps = [];
  let open = null;
  for (let i = 0; i < mask.length; i++) {
    const t = i / samples;
    if (!mask[i]) open = open ? { from: open.from, to: t } : { from: t, to: t };
    else if (open) {
      gaps.push(open);
      open = null;
    }
  }
  if (open) gaps.push(open);
  return gaps;
}

/** 场上所有会攻击的棋子的覆盖并集。 */
function boardMask(cells, samples, opts) {
  const mask = new Uint8Array(samples + 1);
  if (!Array.isArray(cells)) return mask;
  for (const cell of cells) {
    if (!isOccupied(cell) || !isCombatant(cell.unit)) continue;
    const range = rangeOf(cell.unit);
    if (!(range > 0)) continue;
    const own = maskOf(cell.index, range, samples, opts);
    for (let i = 0; i < mask.length; i++) if (own[i]) mask[i] = 1;
  }
  return mask;
}

/**
 * 当前阵容对整条路线的覆盖情况。
 *
 * @returns {{lane:boolean, samples:number, ratio:number|null, gaps:{from:number,to:number}[]}}
 *   `lane` 为 false 时（没有战斗几何）ratio 为 null、gaps 为空：粗估模式下谈不上「哪段没人守」。
 */
export function boardCoverage(cells, opts = {}) {
  const samples = samplesOf(opts);
  if (!laneOn(opts)) return { lane: false, samples, ratio: null, gaps: [] };
  const mask = boardMask(cells, samples, opts);
  return { lane: true, samples, ratio: maskRatio(mask), gaps: maskGaps(mask, samples) };
}

/** 路线上还没人守的段落，`boardCoverage(...).gaps` 的快捷方式。 */
export function coverageGaps(cells, opts = {}) {
  return boardCoverage(cells, opts).gaps;
}

function manhattan(a, b) {
  const pa = toCoord(a);
  const pb = toCoord(b);
  if (!pa || !pb) return Infinity;
  return Math.abs(pa.col - pb.col) + Math.abs(pa.row - pb.row);
}

/** 粗估模式下的「新增覆盖」：附近已经有人守同一段，收益按人数摊薄。 */
function gridFresh(cells, index, range) {
  const base = gridCoverage(index, range);
  if (!base || !Array.isArray(cells)) return base;
  let overlap = 0;
  for (const cell of cells) {
    if (!isOccupied(cell) || !isCombatant(cell.unit)) continue;
    if (manhattan(index, cell.index) <= Math.max(1, range)) overlap += 1;
  }
  return base / (1 + overlap);
}

/**
 * 把某个规格摆到这一格，能新守住多长一段目前无人覆盖的路线（0~1）。
 * 空手一格摆下去时等于它自己的覆盖；阵容越挤，边际收益越低。
 */
export function marginalCoverage(cells, index, card, opts = {}) {
  const spec = specOf(card);
  if (!inBounds(index) || !(spec.range > 0)) return 0;
  if (!laneOn(opts)) return gridFresh(cells, index, spec.range);
  const samples = samplesOf(opts);
  return freshWithMask(index, spec.range, boardMask(cells, samples, opts), samples, opts);
}

function freshWithMask(index, range, covered, samples, opts) {
  const own = maskOf(index, range, samples, opts);
  let gained = 0;
  for (let i = 0; i < own.length; i++) if (own[i] && !covered[i]) gained += 1;
  return own.length ? gained / own.length : 0;
}

/** 贴着路线边沿的一圈（`cellDistToPath === 0`）已解锁格，索引升序。 */
export function outerRing(cells) {
  if (!Array.isArray(cells)) return [];
  return cells
    .filter((c) => c?.unlocked === true && cellDistToPath(c.index) === 0)
    .map((c) => c.index)
    .sort((a, b) => a - b);
}

/** 里圈（`cellDistToPath >= 1`）已解锁格，索引升序。 */
export function innerRing(cells) {
  if (!Array.isArray(cells)) return [];
  return cells
    .filter((c) => c?.unlocked === true && cellDistToPath(c.index) >= 1)
    .map((c) => c.index)
    .sort((a, b) => a - b);
}

/**
 * 邻格分项：能不能合、有没有同族、还剩多少空位，以及单字落这里是否当场觉醒。
 * 单字不会攻击，覆盖项对它恒为 0，`awaken` 是它唯一的正向信号。
 */
function neighborTerms(cells, index, card, spec) {
  let merge = 0;
  let kin = 0;
  let room = 0;
  let awaken = 0;
  const glyph = isGlyph(card) && typeof card.glyph === "string" ? card.glyph : null;
  for (const ni of neighbors(index)) {
    const other = cellAt(cells, ni);
    if (!other || !other.unlocked) continue;
    if (other.unit == null) {
      room += 1;
      continue;
    }
    if (isUnit(card) && canMerge(card, other.unit)) merge += 1;
    else if (spec.id && isUnit(other.unit) && other.unit.id === spec.id) kin += 1;
    if (glyph && isGlyph(other.unit) && findHeroByGlyphs(glyph, other.unit.glyph)) awaken += 1;
  }
  return { merge, kin, room, awaken };
}

/** 内外圈站位习惯：近战贴边沿、远程躲里圈。覆盖可用时它只是打平时的微调。 */
function ringTerm(index, spec) {
  if (!spec.role) return 0;
  const outer = cellDistToPath(index) === 0;
  return (spec.role === "ranged") === outer ? 0 : 1;
}

/**
 * 单格评估，返回打分与全部分项，UI 悬浮提示可以直接展示。
 *
 * `eligible` 为 false（锁定 / 已占用）时依然给分：调用方可能想解释
 * 「这格如果空出来值多少」。`rankPlacements` 只收 `eligible` 的格子。
 */
export function explainPlacement(cells, index, card, opts = {}) {
  const cell = cellAt(cells, index);
  if (!cell) return null;
  const spec = specOf(card);
  const samples = samplesOf(opts);
  const covered = laneOn(opts) ? boardMask(cells, samples, opts) : null;
  return evaluate(cells, cell, card, spec, {
    weights: weightsOf(opts),
    samples,
    covered,
    opts,
  });
}

function evaluate(cells, cell, card, spec, ctx) {
  const index = cell.index;
  const { weights, samples, covered, opts } = ctx;
  const coverage = cellCoverage(index, spec.range, opts);
  const fresh = !(spec.range > 0)
    ? 0
    : covered
      ? freshWithMask(index, spec.range, covered, samples, opts)
      : gridFresh(cells, index, spec.range);
  const exclusive = Math.max(0, coverage - cellCoverage(index, BASELINE_RANGE, opts));
  const ring = ringTerm(index, spec);
  const { merge, kin, room, awaken } = neighborTerms(cells, index, card, spec);

  const terms = {
    coverage: coverage * weights.coverage,
    fresh: fresh * weights.fresh,
    exclusive: exclusive * weights.exclusive,
    awaken: awaken * weights.awaken,
    merge: merge * weights.merge,
    ring: ring * weights.ring,
    kin: kin * weights.kin,
    room: room * weights.room,
  };
  let score = 0;
  for (const key of Object.keys(terms)) score += terms[key];

  return {
    index,
    score,
    eligible: isUnlockedEmpty(cell),
    role: spec.role,
    range: spec.range,
    coverage,
    fresh,
    exclusive,
    distToPath: cellDistToPath(index),
    terms,
  };
}

/**
 * 所有可落子空格的评估，按分数降序、同分按索引升序（确定可复现）。
 *
 * @param {object[]} cells 一侧的棋格
 * @param {*} card 手牌 / 兵种 id / `"melee"` / `"ranged"` / 射程数字
 * @param {{limit?:number, samples?:number, lane?:boolean, weights?:object}} [opts]
 */
export function rankPlacements(cells, card, opts = {}) {
  const open = unlockedEmptyCells(cells);
  if (!open.length) return [];
  const spec = specOf(card);
  const samples = samplesOf(opts);
  const ctx = {
    weights: weightsOf(opts),
    samples,
    covered: laneOn(opts) ? boardMask(cells, samples, opts) : null,
    opts,
  };
  const ranked = open
    .map((cell) => evaluate(cells, cell, card, spec, ctx))
    .sort((a, b) => b.score - a.score || a.index - b.index);
  const limit = opts.limit;
  return Number.isInteger(limit) && limit >= 0 ? ranked.slice(0, limit) : ranked;
}

/** 推荐落点索引，最优在前。默认给 3 个。 */
export function recommendCells(cells, card, opts = {}) {
  const limit = Number.isInteger(opts.limit) ? opts.limit : 3;
  return rankPlacements(cells, card, { ...opts, limit }).map((r) => r.index);
}

/** 近战推荐位：吃满贴路段落。 */
export function recommendMelee(cells, opts = {}) {
  return recommendCells(cells, "melee", opts);
}

/** 远程推荐位：优先那些近战根本够不着、只有远程能守的段落。 */
export function recommendRanged(cells, opts = {}) {
  return recommendCells(cells, "ranged", opts);
}

/** 单个最优落点；没有可落子空格返回 -1。 */
export function bestCell(cells, card, opts = {}) {
  const top = rankPlacements(cells, card, { ...opts, limit: 1 })[0];
  return top ? top.index : -1;
}

/**
 * UI 高亮热度：可落子空格的分数归一化到 0~1（最优恒为 1）。
 * 全部同分时一律给 1，避免除零后整片变灰。
 */
export function placementHeat(cells, card, opts = {}) {
  const ranked = rankPlacements(cells, card, { ...opts, limit: undefined });
  if (!ranked.length) return [];
  const top = ranked[0].score;
  const low = ranked[ranked.length - 1].score;
  const span = top - low;
  return ranked.map((r) => ({
    index: r.index,
    score: r.score,
    heat: span > 1e-9 ? (r.score - low) / span : 1,
  }));
}
