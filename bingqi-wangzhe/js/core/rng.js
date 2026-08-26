/**
 * 确定性随机数 — mulberry32。
 *
 * 全局约定：所有随机必须走这里，禁止 Math.random，保证同 seed 可回放。
 * 纯逻辑，无 DOM 依赖，可在 Node 中直接 import。
 */

const UINT32 = 4294967296;

/**
 * 把任意 seed（数字 / 字符串 / undefined）折叠成 uint32。
 * 字符串走 xfnv1a，保证「同名同种子」。
 * @param {number|string} [seed]
 * @returns {number} uint32
 */
export function normalizeSeed(seed = 1) {
  if (typeof seed === 'number' && Number.isFinite(seed)) {
    return Math.floor(Math.abs(seed)) >>> 0;
  }
  const text = String(seed ?? '');
  let h = 2166136261 >>> 0;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * @typedef {Object} Rng
 * @property {number} seed              规范化后的初始种子
 * @property {() => number} next        [0,1) 浮点
 * @property {() => number} uint32      [0,2^32) 整数
 * @property {(min?: number, max?: number) => number} nextFloat  [min,max) 浮点，默认 [0,1)
 * @property {(min: number, max: number) => number} int          [min,max] 闭区间整数
 * @property {(p?: number) => boolean} bool                      以 p 概率返回 true
 * @property {<T>(arr: T[]) => (T|undefined)} pick               等概率取一个元素
 * @property {(pairs: any) => any} weighted                      按权重取一个值
 * @property {<T>(arr: T[]) => T[]} shuffle                      Fisher-Yates（返回新数组）
 * @property {(tag?: string|number) => Rng} fork                 派生子流（不影响父流后续序列之外的状态）
 * @property {() => number} getState    导出内部状态（可存档 / 回放）
 * @property {(s: number) => void} setState
 * @property {() => Rng} clone          复制当前状态的新实例
 */

/**
 * 创建一个确定性随机流。
 * @param {number|string} [seed=1]
 * @returns {Rng}
 */
export function createRng(seed = 1) {
  const normalized = normalizeSeed(seed);
  let a = normalized;

  function uint32() {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return (t ^ (t >>> 14)) >>> 0;
  }

  function next() {
    return uint32() / UINT32;
  }

  function nextFloat(min = 0, max = 1) {
    return min + next() * (max - min);
  }

  function int(min, max) {
    if (max === undefined) {
      max = min;
      min = 0;
    }
    const lo = Math.ceil(Math.min(min, max));
    const hi = Math.floor(Math.max(min, max));
    if (!Number.isFinite(lo) || !Number.isFinite(hi) || hi < lo) return lo || 0;
    return lo + Math.floor(next() * (hi - lo + 1));
  }

  function bool(p = 0.5) {
    return next() < p;
  }

  function pick(arr) {
    if (!Array.isArray(arr) || arr.length === 0) return undefined;
    return arr[Math.floor(next() * arr.length)];
  }

  /**
   * 支持三种写法：
   *   weighted([[value, weight], ...])
   *   weighted([{ value, weight }, ...])
   *   weighted({ key: weight, ... })  // 返回 key
   * 权重 <= 0 的项被忽略；全部为 0 时退化成等概率。
   */
  function weighted(pairs) {
    const entries = toWeightEntries(pairs);
    if (entries.length === 0) return undefined;
    let total = 0;
    for (const entry of entries) total += entry[1];
    if (total <= 0) return pick(entries.map((entry) => entry[0]));
    let roll = next() * total;
    for (const [value, weight] of entries) {
      roll -= weight;
      if (roll < 0) return value;
    }
    return entries[entries.length - 1][0];
  }

  function shuffle(arr) {
    const out = Array.isArray(arr) ? arr.slice() : [];
    for (let i = out.length - 1; i > 0; i -= 1) {
      const j = Math.floor(next() * (i + 1));
      const tmp = out[i];
      out[i] = out[j];
      out[j] = tmp;
    }
    return out;
  }

  function fork(tag = 0) {
    return createRng((uint32() ^ normalizeSeed(tag)) >>> 0);
  }

  function getState() {
    return a >>> 0;
  }

  function setState(s) {
    a = normalizeSeed(s);
  }

  function clone() {
    const copy = createRng(normalized);
    copy.setState(getState());
    return copy;
  }

  return {
    seed: normalized,
    next,
    uint32,
    nextFloat,
    int,
    bool,
    pick,
    weighted,
    shuffle,
    fork,
    getState,
    setState,
    clone,
  };
}

/**
 * 归一化权重表为 [value, weight][]。
 * @param {any} pairs
 * @returns {[any, number][]}
 */
function toWeightEntries(pairs) {
  const out = [];
  if (!pairs) return out;
  if (Array.isArray(pairs)) {
    for (const item of pairs) {
      if (Array.isArray(item)) {
        const w = Number(item[1]);
        out.push([item[0], Number.isFinite(w) && w > 0 ? w : 0]);
      } else if (item && typeof item === 'object') {
        const w = Number(item.weight ?? item.w ?? 0);
        out.push([item.value ?? item.id ?? item.key, Number.isFinite(w) && w > 0 ? w : 0]);
      }
    }
    return out;
  }
  if (typeof pairs === 'object') {
    for (const key of Object.keys(pairs)) {
      const w = Number(pairs[key]);
      out.push([key, Number.isFinite(w) && w > 0 ? w : 0]);
    }
  }
  return out;
}

export default createRng;
