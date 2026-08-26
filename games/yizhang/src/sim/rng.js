// 确定性随机：状态是纯数据（可 structuredClone / JSON 序列化），函数在外部。
// mulberry32，同 seed 同序列。

export function createRngState(seed) {
  const s = (Number.isFinite(seed) ? seed >>> 0 : 0) || 0x9e3779b9;
  return { s, calls: 0 };
}

export function nextU32(rng) {
  rng.s = (rng.s + 0x6d2b79f5) >>> 0;
  rng.calls++;
  let t = rng.s;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return (t ^ (t >>> 14)) >>> 0;
}

/** [0,1) */
export function nextFloat(rng) {
  return nextU32(rng) / 4294967296;
}

/** [lo,hi) */
export function nextRange(rng, lo, hi) {
  return lo + (hi - lo) * nextFloat(rng);
}

export function nextInt(rng, lo, hiExclusive) {
  const span = Math.max(1, hiExclusive - lo);
  return lo + (nextU32(rng) % span);
}

export function pick(rng, arr) {
  if (!arr || arr.length === 0) return undefined;
  return arr[nextU32(rng) % arr.length];
}

/** 派生一个独立子流，避免不同系统互相扰动序列 */
export function deriveRng(rng, salt) {
  return createRngState((nextU32(rng) ^ Math.imul(salt >>> 0, 0x85ebca6b)) >>> 0);
}
