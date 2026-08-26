/** 确定性随机源（Opus-3 所有权）。肉鸽三选一与钓鱼判定用它保证可复现与可单测。 */

export function hashSeed(input) {
  const str = String(input ?? "");
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

/** mulberry32：状态只有一个 uint32，便于随存档序列化。 */
export function createRng(seed = Date.now()) {
  let state = (typeof seed === "number" ? seed >>> 0 : hashSeed(seed)) || 1;
  const rng = () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  rng.getState = () => state >>> 0;
  rng.setState = (next) => {
    state = (Number(next) >>> 0) || 1;
  };
  return rng;
}

export function pickWeighted(entries, rng = Math.random) {
  const list = entries.filter((e) => (e?.weight ?? 0) > 0);
  if (!list.length) return null;
  const total = list.reduce((sum, e) => sum + e.weight, 0);
  let roll = rng() * total;
  for (const entry of list) {
    roll -= entry.weight;
    if (roll <= 0) return entry.value ?? entry;
  }
  const last = list[list.length - 1];
  return last.value ?? last;
}

/** 不放回抽样，用于三选一。 */
export function sampleWithout(pool, count, rng = Math.random) {
  const items = [...pool];
  const out = [];
  const n = Math.min(count, items.length);
  for (let i = 0; i < n; i += 1) {
    const idx = Math.floor(rng() * items.length) % Math.max(1, items.length);
    out.push(items.splice(idx, 1)[0]);
  }
  return out;
}
