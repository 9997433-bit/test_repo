import { MAX_LEVEL, UNIT_TABLE } from "../data/units.js";

/**
 * 棋子分类与合成谓词。
 *
 * 棋子 `kind` 取值：
 * - `unit`   刀/枪/弓/骑，同种同级可合并，会攻击。
 * - `glyph`  武将单字，占格但**不攻击**（「睡大觉」），只能靠 awaken 消耗。
 * - `hero`   已觉醒武将，占格且攻击，不可合并、不可被神兵符强化。
 * - `token`  神兵符，手牌道具，落到兵种上直接升 1 级，永不驻留棋盘。
 * - `shovel` 铲子，手牌道具，只作用于锁定格，永不驻留棋盘。
 */

const isObject = (v) => !!v && typeof v === "object";

/** 兵种棋子：四种基础兵，唯一可合并的类别。 */
export function isUnit(piece) {
  return isObject(piece) && piece.kind === "unit";
}

/** 武将单字：占格不攻击，等待拼字觉醒。 */
export function isGlyph(piece) {
  return isObject(piece) && piece.kind === "glyph";
}

/** 已觉醒武将：占格且攻击，等级恒为 MAX_LEVEL。 */
export function isHero(piece) {
  return isObject(piece) && piece.kind === "hero";
}

/** 神兵符。 */
export function isToken(piece) {
  return isObject(piece) && piece.kind === "token";
}

/** 铲子。 */
export function isShovel(piece) {
  return isObject(piece) && piece.kind === "shovel";
}

/** 可以停在棋盘格上的棋子（道具不算）。 */
export function occupiesCell(piece) {
  return isUnit(piece) || isGlyph(piece) || isHero(piece);
}

/** 会主动攻击的棋子。单字与道具都不攻击，这是「睡大觉」空间博弈的核心。 */
export function isCombatant(piece) {
  return isUnit(piece) || isHero(piece);
}

/** 单字占格但沉睡：既不攻击，也不能与任何东西合并。 */
export function isSleepingGlyph(piece) {
  return isGlyph(piece);
}

/** 兵种 id 是否在数值表内；未知 id 会让战斗层取不到攻速。 */
export function isKnownUnitId(id) {
  return typeof id === "string" && Object.hasOwn(UNIT_TABLE, id);
}

function levelOf(piece) {
  const level = piece?.level;
  return Number.isInteger(level) && level >= 1 ? level : null;
}

/** 已到 5 级（橙）的兵种不能再升。 */
export function isMaxLevel(piece) {
  const level = levelOf(piece);
  return level !== null && level >= MAX_LEVEL;
}

/** 兵种可升级（已知 id 且未满级）。 */
export function canLevelUp(piece) {
  return isUnit(piece) && isKnownUnitId(piece.id) && !isMaxLevel(piece);
}

function glyphOf(piece, fallback) {
  if (typeof piece?.glyph === "string" && piece.glyph) return piece.glyph;
  return fallback;
}

/**
 * 合并谓词：两枚**不同**棋子，同为兵种、同 id、同级且未满级。
 *
 * 明确拒绝：空格、同一个对象（自我合并会凭空吞掉棋子）、单字、武将、道具、
 * 未知兵种 id、等级不合法或已满级。
 */
export function canMerge(a, b) {
  if (!isUnit(a) || !isUnit(b)) return false;
  if (a === b) return false;
  if (a.id !== b.id || !isKnownUnitId(a.id)) return false;
  const la = levelOf(a);
  const lb = levelOf(b);
  if (la === null || la !== lb) return false;
  return la < MAX_LEVEL;
}

/**
 * 合并两枚兵种，产出 level+1 的新棋子；不满足 `canMerge` 返回 null。
 *
 * 冷却取两者较大值：合并不该被当成「重置攻击冷却」的手段。
 * 结果字段与 `place` 落子后的形状一致（kind/id/glyph/level/cd/cooldown）。
 */
export function mergeUnits(a, b) {
  if (!canMerge(a, b)) return null;
  return {
    ...a,
    kind: "unit",
    id: a.id,
    glyph: glyphOf(a, glyphOf(b, UNIT_TABLE[a.id].glyph)),
    level: a.level + 1,
    cd: Math.max(a.cd || 0, b.cd || 0),
    cooldown: Math.max(a.cooldown || 0, b.cooldown || 0),
  };
}

/** 神兵符谓词：只对未满级的已知兵种生效，单字/武将/空格都无效。 */
export function canApplyShenbing(piece) {
  return canLevelUp(piece);
}

/**
 * 神兵符强化：兵种升 1 级。
 *
 * 无效目标原样返回（调用方据此判断是否消耗手牌），绝不返回 null，
 * 以免 `cell.unit = applyShenbing(cell.unit)` 抹掉格上棋子。
 */
export function applyShenbing(piece) {
  if (!canApplyShenbing(piece)) return piece;
  return {
    ...piece,
    kind: "unit",
    glyph: glyphOf(piece, UNIT_TABLE[piece.id].glyph),
    level: piece.level + 1,
  };
}

/** 交换谓词：两个不同格上的棋子互换位置，任一格可为空。 */
export function canSwap(a, b) {
  if (a === b) return false;
  if (a != null && !occupiesCell(a)) return false;
  if (b != null && !occupiesCell(b)) return false;
  return a != null || b != null;
}

/**
 * 拖放意图判定：把 `source` 拖到 `target` 上应该发生什么。
 *
 * 判定顺序：道具（铲子 / 神兵符）→ 合并 → 落空格 → 交换。返回值：
 * - `merge`   同种同级兵种合并升级。
 * - `token`   神兵符强化目标兵种（source 消耗，不落格）。
 * - `place`   目标空格，source 直接落位（棋盘来源即 game 里的 `move`）。
 * - `swap`    两枚棋子互换（含单字挪位），只可能来自棋盘。
 * - `invalid` 其余情况，调用方必须原样退回，不得消耗手牌。
 *
 * 手牌拖出来的牌换不了座（游戏里没有「把棋子收回手牌」这一步），所以
 * `{ from: "hand" }` 会把本该判 `swap` 的情形改判 `invalid`，其余分支不变；
 * 缺省的 `{ from: "board" }` 与旧行为逐字一致。
 *
 * 只看两枚棋子，不看格子锁没锁 —— `cell.unlocked` 仍由调用方先行拦掉。
 *
 * 待接入：`core/game.js` 的 `place`（`{ from: "hand" }`）与 `merge`（缺省）
 * 各自手写了同一棵判定树，`main.js` 的 `refuseReason` 也另写了一份拒绝理由；
 * 三处都可以改读这里的 `action` / `reason`（对拍见 `drop.test.js`）。两处已知不同调：
 * `merge` 里「棋盘上摆着神兵符」那条分支到不了（符牌从不驻留棋盘，接入时可一并删），
 * 以及 `kind` 认不出来的怪棋子本模块一律拒收、引擎照单全收。
 *
 * @param {*} source 被拖动的手牌或棋子
 * @param {*} target 目标格上的棋子（空格传 null）
 * @param {{from?: "hand"|"board"}} [opts]
 */
export function classifyDrop(source, target, opts = {}) {
  const fromHand = opts?.from === "hand";
  if (source == null) return { action: "invalid", reason: "empty-source" };
  if (isShovel(source)) return { action: "invalid", reason: "shovel-needs-locked-cell" };
  if (isToken(source)) {
    if (target == null) return { action: "invalid", reason: "token-needs-target" };
    if (!canApplyShenbing(target)) return { action: "invalid", reason: "token-target-not-upgradable" };
    return { action: "token", reason: "shenbing" };
  }
  if (!occupiesCell(source)) return { action: "invalid", reason: "unknown-kind" };
  if (isToken(target) || isShovel(target)) return { action: "invalid", reason: "target-is-card" };
  if (canMerge(source, target)) return { action: "merge", reason: "same-id-same-level" };
  if (target == null) return { action: "place", reason: "empty-cell" };
  if (fromHand) return { action: "invalid", reason: "hand-card-needs-empty-or-merge" };
  if (!canSwap(source, target)) return { action: "invalid", reason: "unknown-kind" };
  if (isUnit(source) && isUnit(target) && source.id === target.id) {
    return { action: "swap", reason: isMaxLevel(target) ? "max-level" : "level-mismatch" };
  }
  return { action: "swap", reason: "different-piece" };
}
