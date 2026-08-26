/** Mulberry32 — 所有随机必须走此接口，禁止 Math.random。 */
export function createRng(seed = 20260623) {
  let s = seed >>> 0;
  const next = () => {
    s += 0x6d2b79f5;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    seed,
    next,
    int(max) {
      return Math.floor(next() * max);
    },
    pick(arr) {
      return arr[Math.floor(next() * arr.length)];
    },
    weighted(pairs) {
      const total = pairs.reduce((s, p) => s + p.w, 0);
      let r = next() * total;
      for (const p of pairs) {
        r -= p.w;
        if (r <= 0) return p.v;
      }
      return pairs[pairs.length - 1].v;
    },
  };
}
