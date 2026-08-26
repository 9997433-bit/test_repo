import { HAND_LIMIT } from "../data/units.js";
import { isGlyph, isShovel, isToken, isUnit, occupiesCell } from "./merge.js";

export { HAND_LIMIT };

/**
 * 兵营手牌（底部 5 格）。手牌满则无法征兵，这是节奏闸门。
 *
 * 这里的函数都对传入数组原地增删（与 `side.hand` 的用法一致），
 * 每个写操作都返回是否生效，调用方据此决定要不要扣馒头 / 记日志。
 */

/** 合法手牌：兵种、单字、铲子或神兵符。 */
export function isValidCard(card) {
  return isUnit(card) || isGlyph(card) || isShovel(card) || isToken(card);
}

/** 这张牌是否要占棋盘格（铲子和神兵符不占格）。 */
export function isPlaceableCard(card) {
  return occupiesCell(card);
}

export function handSize(hand) {
  return Array.isArray(hand) ? hand.length : 0;
}

/** 剩余空位，恒 >= 0。 */
export function handSpace(hand) {
  return Math.max(0, HAND_LIMIT - handSize(hand));
}

export function isHandFull(hand) {
  return handSize(hand) >= HAND_LIMIT;
}

/** 手牌下标是否指向真实存在的一张牌。 */
export function isValidHandIndex(hand, index) {
  return Array.isArray(hand) && Number.isInteger(index) && index >= 0 && index < hand.length;
}

/** 加牌谓词：牌合法且兵营没满。 */
export function canAddCard(hand, card) {
  return Array.isArray(hand) && isValidCard(card) && !isHandFull(hand);
}

/** 追加一张牌到手牌末尾。 */
export function addCard(hand, card) {
  if (!canAddCard(hand, card)) return false;
  hand.push(card);
  return true;
}

/** 插入到指定位置（越界则夹到两端）。 */
export function insertCard(hand, index, card) {
  if (!canAddCard(hand, card)) return false;
  const at = Number.isInteger(index) ? Math.min(Math.max(index, 0), hand.length) : hand.length;
  hand.splice(at, 0, card);
  return true;
}

/** 不改动手牌地看一张牌。 */
export function peekCard(hand, index) {
  return isValidHandIndex(hand, index) ? hand[index] : null;
}

/** 抽走一张牌并返回它；下标非法返回 null 且不改动手牌。 */
export function removeCard(hand, index) {
  if (!isValidHandIndex(hand, index)) return null;
  return hand.splice(index, 1)[0];
}

/** 手牌内换位（拖拽整理）。 */
export function moveCard(hand, from, to) {
  if (!isValidHandIndex(hand, from) || !isValidHandIndex(hand, to)) return false;
  if (from === to) return false;
  const [card] = hand.splice(from, 1);
  hand.splice(to, 0, card);
  return true;
}

/** 第一张满足条件的牌下标；没有返回 -1。 */
export function findCardIndex(hand, predicate) {
  if (!Array.isArray(hand) || typeof predicate !== "function") return -1;
  return hand.findIndex((card, i) => predicate(card, i));
}
