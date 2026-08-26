/**
 * 三相元素克制表：fire → ice → thunder → fire。
 * 克制 1.35，被克 0.75，其余 1.00（含无属性）。
 */

export const ELEMENTS = Object.freeze(['fire', 'ice', 'thunder']);

export const STRONG_MULTIPLIER = 1.35;
export const WEAK_MULTIPLIER = 0.75;
export const NEUTRAL_MULTIPLIER = 1;

/** key 克制 value。 */
export const ELEMENT_CYCLE = Object.freeze({
  fire: 'ice',
  ice: 'thunder',
  thunder: 'fire',
});

/** key 被 value 克制。 */
export const COUNTERED_BY = Object.freeze({
  ice: 'fire',
  thunder: 'ice',
  fire: 'thunder',
});

export const ELEMENT_INFO = Object.freeze({
  fire: Object.freeze({
    id: 'fire',
    name: '烈焰',
    short: '火',
    color: '#c23a2b',
    glow: '#ff8a4c',
    crystal: 'fireCrystal',
    beats: 'ice',
    losesTo: 'thunder',
    flavor: '炉心之炎，灼甲焚冰。',
  }),
  ice: Object.freeze({
    id: 'ice',
    name: '寒霜',
    short: '冰',
    color: '#7ec8e3',
    glow: '#bff0ff',
    crystal: 'iceCrystal',
    beats: 'thunder',
    losesTo: 'fire',
    flavor: '玄冰凝锋，滞雷缓形。',
  }),
  thunder: Object.freeze({
    id: 'thunder',
    name: '惊雷',
    short: '雷',
    color: '#9b6bff',
    glow: '#d9c2ff',
    crystal: 'thunderCrystal',
    beats: 'fire',
    losesTo: 'ice',
    flavor: '紫霄落雷，破焰穿甲。',
  }),
});

const ELEMENT_ALIASES = Object.freeze({
  fire: 'fire',
  flame: 'fire',
  blaze: 'fire',
  burn: 'fire',
  火: 'fire',
  烈焰: 'fire',
  炎: 'fire',
  ice: 'ice',
  frost: 'ice',
  cold: 'ice',
  冰: 'ice',
  寒: 'ice',
  寒霜: 'ice',
  霜: 'ice',
  thunder: 'thunder',
  lightning: 'thunder',
  volt: 'thunder',
  electric: 'thunder',
  雷: 'thunder',
  惊雷: 'thunder',
  电: 'thunder',
});

/** 是否为合法主元素。 */
export function isElement(value) {
  return typeof value === 'string' && Object.prototype.hasOwnProperty.call(ELEMENT_INFO, value);
}

/** 宽松归一化（支持中文与常见英文别名）；无法识别返回 fallback。 */
export function normalizeElement(value, fallback = null) {
  if (isElement(value)) return value;
  if (typeof value === 'string') {
    const key = value.trim().toLowerCase();
    if (ELEMENT_ALIASES[key]) return ELEMENT_ALIASES[key];
    if (ELEMENT_ALIASES[value.trim()]) return ELEMENT_ALIASES[value.trim()];
  }
  return fallback;
}

/** 该元素克制谁。 */
export function counterOf(element) {
  const el = normalizeElement(element);
  return el ? ELEMENT_CYCLE[el] : null;
}

/** 该元素被谁克制。 */
export function counteredBy(element) {
  const el = normalizeElement(element);
  return el ? COUNTERED_BY[el] : null;
}

/** 想压制 target 应该带什么元素。 */
export function bestElementAgainst(element) {
  return counteredBy(element);
}

/** 'strong' | 'weak' | 'neutral' */
export function elementRelation(attacker, defender) {
  const a = normalizeElement(attacker);
  const d = normalizeElement(defender);
  if (!a || !d) return 'neutral';
  if (ELEMENT_CYCLE[a] === d) return 'strong';
  if (COUNTERED_BY[a] === d) return 'weak';
  return 'neutral';
}

/** 元素伤害倍率。 */
export function elementMultiplier(attacker, defender) {
  const relation = elementRelation(attacker, defender);
  if (relation === 'strong') return STRONG_MULTIPLIER;
  if (relation === 'weak') return WEAK_MULTIPLIER;
  return NEUTRAL_MULTIPLIER;
}

/** 直接对一段伤害套用克制系数。 */
export function applyElement(damage, attacker, defender) {
  return damage * elementMultiplier(attacker, defender);
}

export function elementLabel(element) {
  const el = normalizeElement(element);
  return el ? ELEMENT_INFO[el].name : '无属';
}

export function elementShort(element) {
  const el = normalizeElement(element);
  return el ? ELEMENT_INFO[el].short : '无';
}

export function elementColor(element) {
  const el = normalizeElement(element);
  return el ? ELEMENT_INFO[el].color : '#9a9188';
}

export function elementCrystal(element) {
  const el = normalizeElement(element);
  return el ? ELEMENT_INFO[el].crystal : null;
}

/** 关系文案，供战报使用。 */
export function relationLabel(attacker, defender) {
  const relation = elementRelation(attacker, defender);
  if (relation === 'strong') return '克制';
  if (relation === 'weak') return '被克';
  return '';
}

/** 统计一组带 element 字段的对象（或元素字符串）的元素分布。 */
export function elementSpread(list) {
  const spread = { fire: 0, ice: 0, thunder: 0, none: 0 };
  for (const item of list ?? []) {
    const el = normalizeElement(typeof item === 'string' ? item : item?.element);
    if (el) spread[el] += 1;
    else spread.none += 1;
  }
  return spread;
}

/** 出现最多的元素（并列时按 fire → ice → thunder 稳定取值）。 */
export function dominantElement(list) {
  const spread = elementSpread(list);
  let best = null;
  let bestCount = 0;
  for (const el of ELEMENTS) {
    if (spread[el] > bestCount) {
      best = el;
      bestCount = spread[el];
    }
  }
  return best;
}

/** 阵容元素覆盖度 0..1（集齐三相为 1）。 */
export function coverageScore(list) {
  const spread = elementSpread(list);
  const kinds = ELEMENTS.filter((el) => spread[el] > 0).length;
  return kinds / ELEMENTS.length;
}
