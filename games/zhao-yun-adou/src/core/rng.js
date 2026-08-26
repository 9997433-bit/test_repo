/** Mulberry32 — 所有随机必须走此接口，禁止 Math.random。 */
export function createRng(seed = 20260623) {
  let s = seed >>> 0;

  const next = () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const rng = {
    seed: seed >>> 0,
    next,
    int(max) {
      if (!Number.isFinite(max) || max <= 0) return 0;
      return Math.floor(next() * max);
    },
    range(min, max) {
      if (!Number.isFinite(min) || !Number.isFinite(max) || max <= min) return min || 0;
      return min + next() * (max - min);
    },
    pick(arr) {
      if (!Array.isArray(arr) || arr.length === 0) return undefined;
      return arr[Math.floor(next() * arr.length)];
    },
    weighted(pairs) {
      if (!Array.isArray(pairs) || pairs.length === 0) return undefined;
      const valid = pairs.filter((p) => p && Number.isFinite(p.w) && p.w > 0);
      if (!valid.length) return pairs[pairs.length - 1].v;
      const total = valid.reduce((sum, p) => sum + p.w, 0);
      let r = next() * total;
      for (const p of valid) {
        r -= p.w;
        if (r <= 0) return p.v;
      }
      return valid[valid.length - 1].v;
    },
    /** 当前内部状态，用于存档/回放。 */
    getState() {
      return s >>> 0;
    },
    setState(value) {
      if (Number.isFinite(value)) s = value >>> 0;
      return rng;
    },
    /** 重设种子并回到序列起点（restart 用）。 */
    reseed(newSeed = rng.seed) {
      rng.seed = newSeed >>> 0;
      s = rng.seed;
      return rng;
    },
    /** 独立副本，推演/预览时不污染主序列。 */
    clone() {
      return createRng(rng.seed).setState(s);
    },
  };

  return rng;
}
