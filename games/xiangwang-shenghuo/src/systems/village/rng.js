/** 村落系统的确定性随机：同一份存档在同一时刻永远得到同样的结果。 */

export function hash32(input) {
  const s = String(input);
  let h = 2166136261;
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** 把任意一组标识折成 [0,1) 的稳定数值。 */
export function unitOf(...parts) {
  let x = hash32(parts.join("|")) || 1;
  x ^= x << 13;
  x >>>= 0;
  x ^= x >>> 17;
  x ^= x << 5;
  x >>>= 0;
  return x / 4294967296;
}

/** 注入了 rng 就用注入的，否则退回到由状态派生的确定值。 */
export function rollWith(rng, ...parts) {
  if (typeof rng === "function") {
    const v = Number(rng());
    if (Number.isFinite(v)) return Math.min(0.999999, Math.max(0, v));
  }
  return unitOf(...parts);
}

/** 按权重表确定性地挑一项。weights: [[value, weight], ...] */
export function pickWeighted(entries, roll) {
  const total = entries.reduce((sum, [, w]) => sum + w, 0);
  if (total <= 0) return entries[0]?.[0];
  let cursor = Math.min(0.999999, Math.max(0, roll)) * total;
  for (const [value, weight] of entries) {
    cursor -= weight;
    if (cursor < 0) return value;
  }
  return entries[entries.length - 1][0];
}
