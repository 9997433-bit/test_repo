/** 文案与数值格式化（UI 层专用，逻辑层不依赖）。 */

export const QUALITY_ORDER = [
  'common',
  'uncommon',
  'rare',
  'epic',
  'legendary',
  'mythic'
];

export const QUALITY_CN = {
  common: '凡铁',
  uncommon: '精钢',
  rare: '玄兵',
  epic: '紫霄',
  legendary: '传说',
  mythic: '神话'
};

export const ELEMENT_CN = {
  fire: '火',
  ice: '冰',
  thunder: '雷'
};

export const ELEMENT_FULL_CN = {
  fire: '烈火',
  ice: '玄冰',
  thunder: '惊雷'
};

/** 火 → 冰 → 雷 → 火 */
export const ELEMENT_BEATS = { fire: 'ice', ice: 'thunder', thunder: 'fire' };

export const RESOURCE_CN = {
  coin: '铜钱',
  iron: '精铁',
  silverOre: '秘银',
  goldOre: '赤金',
  fireCrystal: '火晶',
  iceCrystal: '冰晶',
  thunderCrystal: '雷晶',
  luckyCharm: '幸运符',
  stamina: '体力',
  diamond: '玄晶'
};

export const RESOURCE_COLOR = {
  coin: 'var(--gold)',
  iron: '#b9c0c8',
  silverOre: '#dfe7ee',
  goldOre: '#f0c65a',
  fireCrystal: 'var(--el-fire)',
  iceCrystal: 'var(--el-ice)',
  thunderCrystal: 'var(--el-thunder)',
  luckyCharm: 'var(--cinnabar-lit)',
  stamina: '#7fe3a6',
  diamond: 'var(--thunder)'
};

export function qualityCN(q) {
  return QUALITY_CN[q] || q;
}

export function elementCN(el) {
  return ELEMENT_CN[el] || el;
}

export function resourceCN(id) {
  return RESOURCE_CN[id] || id;
}

/** 12345 → 1.23万 */
export function fmtNum(n) {
  const v = Math.floor(Number(n) || 0);
  const abs = Math.abs(v);
  if (abs >= 1e8) return `${(v / 1e8).toFixed(2).replace(/\.?0+$/, '')}亿`;
  if (abs >= 1e4) return `${(v / 1e4).toFixed(2).replace(/\.?0+$/, '')}万`;
  return String(v);
}

/** 原样千分位（资源条要精确） */
export function fmtExact(n) {
  return (Math.floor(Number(n) || 0)).toLocaleString('en-US');
}

/** 秒 → 2小时13分 */
export function fmtDuration(seconds) {
  const s = Math.max(0, Math.floor(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0) return `${h}时${m}分`;
  if (m > 0) return `${m}分${s % 60}秒`;
  return `${s}秒`;
}

/** 毫秒时间戳 → 相对描述 */
export function fmtAgo(ts, now = Date.now()) {
  const diff = Math.max(0, now - ts) / 1000;
  if (diff < 60) return '刚刚';
  return `${fmtDuration(diff)}前`;
}

export function pct(v, digits = 1) {
  return `${(v * 100).toFixed(digits).replace(/\.0+$/, '')}%`;
}

/** 中文数字（1-40 够用） */
const CN_DIGITS = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
export function cnNumber(n) {
  if (n < 10) return CN_DIGITS[n];
  if (n < 20) return `十${n % 10 ? CN_DIGITS[n % 10] : ''}`;
  const tens = Math.floor(n / 10);
  return `${CN_DIGITS[tens]}十${n % 10 ? CN_DIGITS[n % 10] : ''}`;
}
