import * as BALANCE from "../data/balance.js";

/**
 * 数值边界的唯一口径：等级帽、驻店人数帽、离线封顶、溢出闸门。
 * balance.js 一旦导出同名常量就以数值层为准，这里只做兜底，
 * 让 core 在 F3 补齐上限前也不会出现 Infinity / NaN 账目。
 */

function constFromBalance(name, fallback) {
  const value = Number(BALANCE[name]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

export const SHOP_LEVEL_MAX = constFromBalance("SHOP_LEVEL_MAX", 50);
export const PARTNER_LEVEL_MAX = constFromBalance("PARTNER_LEVEL_MAX", 50);
export const PARTNERS_PER_SHOP_MAX = constFromBalance("PARTNERS_PER_SHOP_MAX", 2);
/** 与 balance#offlineGold 内部封顶保持一致，测试守护两者不漂移。 */
export const OFFLINE_CAP_HOURS = constFromBalance("OFFLINE_CAP_HOURS", 8);
/** 账目溢出时的落点：只封顶不回退，超大老档不会因为封顶反而缩水。 */
export const NUMBER_CEIL = Number.MAX_VALUE;

/** 非有限数一律退化为 fallback，杜绝 NaN/Infinity 顺着公式往账上爬。 */
export function finiteOr(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function clampLevel(value, max) {
  const n = Math.trunc(Number(value));
  if (!Number.isFinite(n)) return 1;
  return Math.min(max, Math.max(1, n));
}

export function shopLevel(value) {
  return clampLevel(value, SHOP_LEVEL_MAX);
}

export function partnerLevel(value) {
  return clampLevel(value, PARTNER_LEVEL_MAX);
}

/** 加法闸门：非有限入参按 0 记，溢出封到 NUMBER_CEIL 而不是 Infinity。 */
export function capAdd(base, delta) {
  const a = finiteOr(base, 0);
  const sum = a + finiteOr(delta, 0);
  if (Number.isFinite(sum)) return sum;
  return sum > 0 ? NUMBER_CEIL : a;
}
