/**
 * 战斗层随机数适配器。
 *
 * 契约：`core/rng.js` 的 mulberry32 是全局唯一随机源。战斗层不直接 import 它，
 * 而是通过 `toRng()` 接收外部注入的 rng（core 的实例、纯函数或种子数字），
 * 这样 combat 既能被 core 驱动，也能在 Node 测试中脱离 core 独立跑。
 * 当只拿到种子时，这里用与 core 完全一致的 mulberry32 算法兜底，保证同种子同结果。
 */

const UINT32 = 4294967296;

/** 与 core/rng.js 一致的 mulberry32 位实现。 */
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / UINT32;
  };
}

/** 字符串/任意值 → 稳定的 uint32 种子（xmur3 变体）。 */
export function hashSeed(value) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.abs(Math.trunc(value)) >>> 0 || 1;
  }
  const str = String(value ?? 1);
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i += 1) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  return (h ^ (h >>> 16)) >>> 0 || 1;
}

function buildInterface(nextFloat, seed) {
  const api = {
    seed,
    next: nextFloat,
    nextFloat,
    /** [0,1) 之外的便捷封装 */
    range(min, max) {
      return min + nextFloat() * (max - min);
    },
    /** 闭区间整数 [min, max] */
    int(min, max) {
      const lo = Math.ceil(min);
      const hi = Math.floor(max);
      if (hi <= lo) return lo;
      return lo + Math.floor(nextFloat() * (hi - lo + 1));
    },
    chance(p) {
      if (!(p > 0)) return false;
      if (p >= 1) return true;
      return nextFloat() < p;
    },
    pick(arr) {
      if (!Array.isArray(arr) || arr.length === 0) return undefined;
      return arr[Math.floor(nextFloat() * arr.length) % arr.length];
    },
    /** pairs: [[value, weight], ...] 或 [{ value, weight }, ...] */
    weighted(pairs) {
      const list = Array.isArray(pairs) ? pairs : [];
      let total = 0;
      const norm = [];
      for (const entry of list) {
        const value = Array.isArray(entry) ? entry[0] : entry?.value;
        const weight = Number(Array.isArray(entry) ? entry[1] : entry?.weight) || 0;
        if (weight <= 0) continue;
        total += weight;
        norm.push([value, weight]);
      }
      if (total <= 0) return undefined;
      let roll = nextFloat() * total;
      for (const [value, weight] of norm) {
        roll -= weight;
        if (roll < 0) return value;
      }
      return norm[norm.length - 1][0];
    },
    /** 返回新数组，不修改入参 */
    shuffle(arr) {
      const out = Array.isArray(arr) ? arr.slice() : [];
      for (let i = out.length - 1; i > 0; i -= 1) {
        const j = Math.floor(nextFloat() * (i + 1));
        const tmp = out[i];
        out[i] = out[j];
        out[j] = tmp;
      }
      return out;
    },
    /** 派生一条互不干扰的子流（用于并行子系统） */
    fork(salt = 0) {
      return createCombatRng(hashSeed(`${seed}:${salt}:${Math.floor(nextFloat() * UINT32)}`));
    },
  };
  return api;
}

/** 独立可复现随机源。 */
export function createCombatRng(seed = 1) {
  const normalized = hashSeed(seed);
  return buildInterface(mulberry32(normalized), normalized);
}

/**
 * 把任意来源变成统一的 rng 接口。
 * 支持：rng 实例（core/rng.js）、返回 [0,1) 的函数、数字/字符串种子、undefined。
 * 只依赖来源的浮点流，其余分布函数一律本地实现，避免上下游语义分歧。
 */
export function toRng(source, fallbackSeed = 1) {
  if (source == null) return createCombatRng(fallbackSeed);
  if (typeof source === 'number' || typeof source === 'string') return createCombatRng(source);
  if (typeof source === 'function') {
    return buildInterface(() => {
      const v = source();
      return v >= 1 || v < 0 ? (v >>> 0) / UINT32 : v;
    }, source.seed ?? hashSeed(fallbackSeed));
  }
  if (typeof source === 'object') {
    const raw = typeof source.nextFloat === 'function'
      ? () => source.nextFloat()
      : typeof source.next === 'function'
        ? () => source.next()
        : null;
    if (raw) {
      return buildInterface(() => {
        const v = raw();
        return v >= 1 || v < 0 ? (v >>> 0) / UINT32 : v;
      }, source.seed ?? hashSeed(fallbackSeed));
    }
  }
  return createCombatRng(fallbackSeed);
}
