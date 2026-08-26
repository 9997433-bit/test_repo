import { realmById } from "../data/realms.js";

const CAP_MIN = 8 * 60;

export function tickIdle(save, nowMs = Date.now()) {
  const last = save.idleUntil || save.lastSeenAt || nowMs;
  const minutes = Math.min(CAP_MIN, Math.max(0, (nowMs - last) / 60000));
  const realm = realmById(save.realmId);
  const pills = Math.floor(minutes * realm.idlePerMin);
  const buns = Math.floor(minutes * 0.6);
  return {
    ...save,
    qiPills: save.qiPills + pills,
    buns: save.buns + buns,
    idleUntil: nowMs,
    lastSeenAt: nowMs,
    idleClaim: { minutes, pills, buns },
  };
}
