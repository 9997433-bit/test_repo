import { realmById } from "../data/realms.js";

export const IDLE_CAP_MIN = 8 * 60;
export const IDLE_MIN_CLAIM_MIN = 0.05;
export const IDLE_BUNS_PER_MIN = 0.6;

/**
 * 计算一次挂机结算，但不写入存档。
 * `claimed` 为 false 表示这次调用没有产出：离线不足 IDLE_MIN_CLAIM_MIN 分，
 * 或产出向下取整后为 0。
 */
export function idlePreview(save, nowMs = Date.now()) {
  const last = save?.idleUntil || save?.lastSeenAt || nowMs;
  const minutes = Math.min(IDLE_CAP_MIN, Math.max(0, (nowMs - last) / 60000));
  const realm = realmById(save?.realmId);
  const eligible = minutes >= IDLE_MIN_CLAIM_MIN;
  const pills = eligible ? Math.floor(minutes * realm.idlePerMin) : 0;
  const buns = eligible ? Math.floor(minutes * IDLE_BUNS_PER_MIN) : 0;
  return { minutes, pills, buns, claimed: pills > 0 || buns > 0 };
}

/**
 * 纯函数：返回新存档，不修改入参。
 * 幂等 —— 同一 nowMs 连续调用只在第一次发放收益；之后 `idleClaimed` 为 false、
 * `idleClaim.pills/buns` 为 0，界面重绘不会重复弹出同一笔挂机提示。
 * 未结算时刻意不推进 idleUntil，零头时间继续累积而不是被清空。
 * `idleClaim` 固定为 { minutes, pills, buns }，是否发放请读 `idleClaimed`。
 */
export function tickIdle(save, nowMs = Date.now()) {
  const { claimed, minutes, pills, buns } = idlePreview(save, nowMs);
  const idleClaim = { minutes, pills, buns };
  if (!claimed) return { ...save, lastSeenAt: nowMs, idleClaim, idleClaimed: false };
  return {
    ...save,
    qiPills: (save.qiPills || 0) + pills,
    buns: (save.buns || 0) + buns,
    idleUntil: nowMs,
    lastSeenAt: nowMs,
    idleClaim,
    idleClaimed: true,
  };
}
