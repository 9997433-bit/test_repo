/**
 * 状态读取工具。
 *
 * 状态既可能挂在战斗状态机上（`ctx.statuses[targetId]`），
 * 也可能由调用方直接写在目标对象上（`target.statuses`）。
 * 这里统一成 `{ [status]: { potency, duration, expiresAt, stacks, interval } }` 的只读视图。
 */

import { ELEMENTS, STATUS } from "./constants.js";

function normalize(entry, status) {
  if (!entry) return null;
  if (typeof entry === "number") return { status, potency: entry, stacks: 1, expiresAt: null };
  if (entry === true) return { status, potency: 1, stacks: 1, expiresAt: null };
  return { status, potency: entry.potency ?? 1, stacks: entry.stacks ?? 1, interval: entry.interval ?? 0, expiresAt: entry.expiresAt ?? null, meta: entry.meta ?? null };
}

/** 读取目标身上仍然生效的状态视图。 */
export function readStatuses(target, ctx = {}, now = ctx.now ?? 0) {
  const out = {};
  const sources = [];
  if (target?.id != null && ctx.statuses?.[target.id]) sources.push(ctx.statuses[target.id]);
  if (target?.statuses) sources.push(target.statuses);

  for (const src of sources) {
    const entries = Array.isArray(src) ? src.map((s) => [s?.status ?? s?.type, s]) : Object.entries(src);
    for (const [key, raw] of entries) {
      if (!key) continue;
      const entry = normalize(raw, key);
      if (!entry) continue;
      if (typeof entry.expiresAt === "number" && entry.expiresAt <= now) continue;
      out[key] = out[key] ? { ...entry, stacks: (out[key].stacks ?? 1) + (entry.stacks ?? 1) } : entry;
    }
  }
  return out;
}

/** 是否处于某状态。 */
export function hasStatus(statuses, status) {
  return Boolean(statuses?.[status]);
}

/** 破甲总量（超导 + 其他破甲来源），夹到 [0, 0.95]。 */
export function armorShredFrom(statuses) {
  const entry = statuses?.[STATUS.ARMOR_BREAK];
  if (!entry) return 0;
  return Math.min(0.95, (entry.potency ?? ELEMENTS.SUPERCONDUCT.armorShred) * (entry.stacks ?? 1));
}

/** 目标当前的易伤倍率（冻结目标更脆）。 */
export function damageTakenMultFrom(statuses) {
  let mult = 1;
  if (statuses?.[STATUS.FREEZE]) mult *= statuses[STATUS.FREEZE].potency ?? ELEMENTS.FREEZE.damageTakenMult;
  const vuln = statuses?.[STATUS.VULNERABLE];
  if (vuln) mult *= 1 + (vuln.potency ?? 0.2) * (vuln.stacks ?? 1);
  return mult;
}
