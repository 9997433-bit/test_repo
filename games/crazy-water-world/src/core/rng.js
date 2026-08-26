export function mulberry32(seed) {
  let a = seed >>> 0;
  return function rng() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashSeed(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// 派生瞬时流：不保存游标，随时可从 (seed, tick, 盐) 重建同一条随机序列。
export function deriveRng(seed, tick, salt, nonce = 0) {
  const mixed =
    ((seed >>> 0) ^ hashSeed(salt) ^ Math.imul(tick >>> 0, 2654435761) ^ Math.imul(nonce >>> 0, 40503)) >>> 0;
  return mulberry32(mixed);
}

export function pickWeighted(rng, pairs) {
  const total = pairs.reduce((s, [, w]) => s + w, 0);
  let roll = rng() * total;
  for (const [item, w] of pairs) {
    roll -= w;
    if (roll <= 0) return item;
  }
  return pairs[pairs.length - 1][0];
}
