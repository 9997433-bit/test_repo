/**
 * 确定性随机源。
 *
 * 战斗结算不允许调用 Math.random：同样的入参必须得到同样的结果，
 * 否则单测、基准与回放都无法复现。调用方可以传入自己的 rng，
 * 未传入时由 seed + 命中上下文派生。
 */

/** 32 位字符串哈希（FNV-1a 变体），用于把 id 折叠成种子。 */
export function hash32(input) {
  let h = 0x811c9dc5;
  const str = String(input);
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** 把任意数量的片段混合成一个 32 位种子。 */
export function mixSeed(...parts) {
  let h = 0x9e3779b9;
  for (const part of parts) {
    h = (Math.imul(h ^ hash32(part ?? 0), 0x85ebca6b) >>> 0) ^ (h >>> 13);
    h >>>= 0;
  }
  return h >>> 0;
}

/** mulberry32：小而快的确定性 PRNG，返回 [0, 1)。 */
export function makeRng(seed = 1) {
  let a = (typeof seed === "number" ? seed : hash32(seed)) >>> 0;
  return function rng() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * 从战斗上下文取一个 rng。
 * 优先使用调用方注入的 ctx.rng，否则由 seed 与命中标识派生，保证纯函数。
 */
export function rngFrom(ctx = {}, ...salt) {
  if (typeof ctx.rng === "function") return ctx.rng;
  return makeRng(mixSeed(ctx.seed ?? 0, ...salt));
}

/** 按概率判定，chance <= 0 恒假，>= 1 恒真（不消耗随机数）。 */
export function roll(rng, chance) {
  if (chance <= 0) return false;
  if (chance >= 1) return true;
  return rng() < chance;
}
