/**
 * RNG 适配层。
 *
 * 契约上随机数由 `core/rng.js` 的 mulberry32 提供，并作为参数传入锻造函数。
 * 本模块不 import core（Round 1 期间 core 可能尚未落地），只把「传进来的东西」
 * 归一成锻造需要的最小接口，因此对以下几种形态都成立：
 *   - { nextFloat() }        契约形态
 *   - { next() }             返回 [0,1) 或 uint32
 *   - function()             裸随机函数
 *
 * 逻辑层禁止 window，也禁止在这里调用 Math.random —— 没有随机源就明确失败。
 */

const UINT32 = 4294967296;

function normalize(v) {
  if (typeof v !== 'number' || Number.isNaN(v)) return 0;
  if (v >= 0 && v < 1) return v;
  return (v >>> 0) / UINT32;
}

function resolveFloatFn(rng) {
  if (!rng) return null;
  if (typeof rng === 'function') return () => normalize(rng());
  if (typeof rng.nextFloat === 'function') return () => normalize(rng.nextFloat());
  if (typeof rng.float === 'function') return () => normalize(rng.float());
  if (typeof rng.next === 'function') return () => normalize(rng.next());
  if (typeof rng.random === 'function') return () => normalize(rng.random());
  return null;
}

/**
 * @param {object|function} rng
 * @returns {null | {
 *   float(): number,
 *   range(min:number, max:number): number,
 *   int(min:number, max:number): number,
 *   pick(arr:Array): any,
 *   chance(p:number): boolean,
 *   weightedKey(weights:object): string|null,
 *   weightedPick(items:Array, weightOf:(item:any)=>number): any
 * }}
 */
export function createRngAdapter(rng) {
  const float = resolveFloatFn(rng);
  if (!float) return null;

  const api = {
    float,
    range(min, max) {
      return min + (max - min) * float();
    },
    int(min, max) {
      if (max <= min) return min;
      return min + Math.floor(float() * (max - min + 1));
    },
    pick(arr) {
      if (!Array.isArray(arr) || arr.length === 0) return null;
      return arr[Math.min(arr.length - 1, Math.floor(float() * arr.length))];
    },
    chance(p) {
      return float() < p;
    },
    weightedKey(weights) {
      const keys = Object.keys(weights);
      let total = 0;
      for (const k of keys) total += Math.max(0, weights[k] || 0);
      if (total <= 0) return null;
      let roll = float() * total;
      for (const k of keys) {
        roll -= Math.max(0, weights[k] || 0);
        if (roll < 0) return k;
      }
      return keys[keys.length - 1];
    },
    weightedPick(items, weightOf) {
      if (!Array.isArray(items) || items.length === 0) return null;
      let total = 0;
      for (const it of items) total += Math.max(0, weightOf(it) || 0);
      if (total <= 0) return api.pick(items);
      let roll = float() * total;
      for (const it of items) {
        roll -= Math.max(0, weightOf(it) || 0);
        if (roll < 0) return it;
      }
      return items[items.length - 1];
    },
  };

  return api;
}

export default createRngAdapter;
