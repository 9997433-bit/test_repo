// 确定性随机数。状态是一个 32 位整数，可直接序列化，便于回放与快照比对。

export function hashSeed(seed) {
  if (typeof seed === "number" && Number.isFinite(seed)) {
    return (Math.floor(seed) >>> 0) || 0x9e3779b9;
  }
  const text = seed === undefined || seed === null ? "shihe" : String(seed);
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0) || 0x9e3779b9;
}

export function createRng(seed) {
  return { state: hashSeed(seed) };
}

export function nextFloat(rng) {
  rng.state = (rng.state + 0x6d2b79f5) >>> 0;
  let t = rng.state;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

export function nextInt(rng, maxExclusive) {
  if (maxExclusive <= 0) return 0;
  return Math.floor(nextFloat(rng) * maxExclusive) % maxExclusive;
}

export function nextRange(rng, min, max) {
  return min + (max - min) * nextFloat(rng);
}

export function pick(rng, list) {
  if (!list || list.length === 0) return undefined;
  return list[nextInt(rng, list.length)];
}
