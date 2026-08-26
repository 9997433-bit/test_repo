import { MO_STROKE_TYPES, moProgress } from "../classes/unlock.js";

export { hasSixForms, moProgress, unlockMo } from "../classes/unlock.js";

/** 六式表只有 classes/unlock.js 一份，这里只是转出旧名字。 */
export const INK_TYPES = MO_STROKE_TYPES;
export const INK_MASTERY_THRESHOLD = 0.6;

/** 各式的最佳精度是否达标；只作画阁展示用，不参与墨客解锁判定。 */
export function masteredTypes(strokeStats = {}, threshold = INK_MASTERY_THRESHOLD) {
  return INK_TYPES.filter((t) => (strokeStats[t] || 0) >= threshold);
}

/** 墨客解锁只此一条规则：画阁里集齐六种不同笔法（见 classes/unlock.js）。 */
export function checkInkUnlock(save) {
  return moProgress(save).unlocked;
}

/** 每一笔更新「各式最佳精度」，供画阁进度展示。 */
export function recordStroke(save, stroke) {
  if (!stroke?.type || stroke.type === "scribble") return save;
  const prev = save.strokeStats?.[stroke.type] || 0;
  if (stroke.precision <= prev) return save;
  return { ...save, strokeStats: { ...save.strokeStats, [stroke.type]: +stroke.precision.toFixed(3) } };
}
