/**
 * 可复现随机数（mulberry32）。
 * 同一个 seed + 同样的调用顺序 => 同样的序列，便于存档回放与测试。
 * 纯 ESM、无 DOM 依赖。
 */

const UINT32 = 4294967296;

/** 把任意 seed（数字/字符串/undefined）折算成 uint32。字符串走 FNV-1a。 */
export function hashSeed(seed) {
  if (typeof seed === "number" && Number.isFinite(seed)) {
    // 允许负数与小数：取整后再截断到 uint32
    return (Math.floor(Math.abs(seed)) >>> 0) || 1;
  }
  const str = seed === undefined || seed === null ? "1" : String(seed);
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0 || 1;
}

/**
 * 创建一个随机源。
 * @param {number|string} [seed=1]
 * @returns {{
 *   seed: number,
 *   next(): number, float(): number, range(min:number,max:number): number,
 *   int(min:number,max:number): number, pick(arr:any[]): any,
 *   chance(p:number): boolean, shuffle(arr:any[]): any[],
 *   weighted(items:any[], weightOf?:Function): any,
 *   getState(): number, setState(v:number): void, reset(): void, fork(tag?:any): object
 * }}
 */
export function createRng(seed = 1) {
  const rootSeed = hashSeed(seed);
  let s = rootSeed;

  const rng = {
    seed: rootSeed,

    /** 下一个 uint32。 */
    next() {
      s = (s + 0x6d2b79f5) >>> 0;
      let t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return (t ^ (t >>> 14)) >>> 0;
    },

    /** [0, 1) 浮点。 */
    float() {
      return rng.next() / UINT32;
    },

    /** [min, max) 浮点；参数顺序反了会自动交换。 */
    range(min = 0, max = 1) {
      let lo = Number(min);
      let hi = Number(max);
      if (!Number.isFinite(lo)) lo = 0;
      if (!Number.isFinite(hi)) hi = lo;
      if (lo > hi) [lo, hi] = [hi, lo];
      return lo + rng.float() * (hi - lo);
    },

    /** [min, max] 闭区间整数。只给一个参数时等价 int(0, min)。 */
    int(min, max) {
      let lo = max === undefined ? 0 : Number(min);
      let hi = max === undefined ? Number(min) : Number(max);
      if (!Number.isFinite(lo)) lo = 0;
      if (!Number.isFinite(hi)) hi = lo;
      lo = Math.ceil(lo);
      hi = Math.floor(hi);
      if (lo > hi) [lo, hi] = [hi, lo];
      return lo + Math.floor(rng.float() * (hi - lo + 1));
    },

    /** 等概率取一个元素；空数组返回 undefined。 */
    pick(arr) {
      if (!Array.isArray(arr) || arr.length === 0) return undefined;
      return arr[Math.floor(rng.float() * arr.length)];
    },

    /** 概率判定，p<=0 恒 false，p>=1 恒 true。 */
    chance(p) {
      const v = Number(p);
      if (!Number.isFinite(v) || v <= 0) return false;
      if (v >= 1) return true;
      return rng.float() < v;
    },

    /** 原地 Fisher-Yates 洗牌，返回同一个数组。 */
    shuffle(arr) {
      if (!Array.isArray(arr)) return arr;
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(rng.float() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    },

    /** 按权重抽取（招募/掉落用）。weightOf 默认读 item.weight。 */
    weighted(items, weightOf = (it) => (it && it.weight) || 0) {
      if (!Array.isArray(items) || items.length === 0) return undefined;
      let total = 0;
      for (const it of items) {
        const w = Number(weightOf(it));
        if (Number.isFinite(w) && w > 0) total += w;
      }
      if (total <= 0) return rng.pick(items);
      let roll = rng.float() * total;
      for (const it of items) {
        const w = Number(weightOf(it));
        if (!Number.isFinite(w) || w <= 0) continue;
        roll -= w;
        if (roll < 0) return it;
      }
      return items[items.length - 1];
    },

    /** 内部游标，存档时一起写入即可断点续随机。 */
    getState() {
      return s >>> 0;
    },
    setState(v) {
      s = hashSeed(v);
    },
    reset() {
      s = rootSeed;
    },

    /** 派生一个独立子随机源，避免不同系统互相干扰序列。 */
    fork(tag = "") {
      return createRng(hashSeed(`${rootSeed}:${tag}:${rng.next()}`));
    },
  };

  return rng;
}
