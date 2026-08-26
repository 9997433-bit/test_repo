export const INK_TYPES = ["line", "curve", "circle", "zigzag", "spiral", "cloud"];
export const INK_MASTERY_THRESHOLD = 0.6;

// 六式皆有一笔精度达标，方可感召隐藏职业「墨客」
export function masteredTypes(strokeStats = {}, threshold = INK_MASTERY_THRESHOLD) {
  return INK_TYPES.filter((t) => (strokeStats[t] || 0) >= threshold);
}

export function checkInkUnlock(save) {
  return masteredTypes(save.strokeStats).length === INK_TYPES.length;
}

// 每一笔更新「各式最佳精度」，供解锁判定与画阁进度展示
export function recordStroke(save, stroke) {
  if (!stroke?.type || stroke.type === "scribble") return save;
  const prev = save.strokeStats?.[stroke.type] || 0;
  if (stroke.precision <= prev) return save;
  return { ...save, strokeStats: { ...save.strokeStats, [stroke.type]: +stroke.precision.toFixed(3) } };
}
