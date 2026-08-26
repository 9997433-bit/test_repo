import { CLASSES } from "../data/classes.js";

/** 六式：scribble（余墨）是识别失败的兜底，不计入集齐进度。 */
export const MO_STROKE_TYPES = ["line", "curve", "circle", "zigzag", "spiral", "cloud"];
export const MO_REQUIRED_TYPES = 6;

/** 画阁里出现过的不同笔法（去重、剔除 scribble），顺序按六式表。 */
export function galleryTypes(save) {
  const seen = new Set((save?.gallery || []).map((g) => g?.type).filter((t) => t && t !== "scribble"));
  const known = MO_STROKE_TYPES.filter((t) => seen.has(t));
  const extra = [...seen].filter((t) => !MO_STROKE_TYPES.includes(t));
  return [...known, ...extra];
}

/** 墨客解锁进度，供界面展示「还差哪几式」。 */
export function moProgress(save) {
  const types = galleryTypes(save);
  const missing = MO_STROKE_TYPES.filter((t) => !types.includes(t));
  return {
    types,
    have: types.length,
    need: MO_REQUIRED_TYPES,
    missing,
    unlocked: Boolean(save?.inkUnlocked) || types.length >= MO_REQUIRED_TYPES,
  };
}

/**
 * 纯函数：画阁中集齐至少 6 种不同笔法即点亮隐藏职业「墨客」。
 * 已解锁时原样返回（幂等，不会重复播报）。
 */
export function unlockMo(save) {
  if (!save || save.inkUnlocked) return save;
  if (galleryTypes(save).length < MO_REQUIRED_TYPES) return save;
  return { ...save, inkUnlocked: true, notice: "画阁六式圆满，墨客隐线现世。" };
}

export function isClassUnlocked(save, classId) {
  const cls = CLASSES.find((c) => c.id === classId);
  if (!cls) return false;
  return !cls.hidden || Boolean(save?.inkUnlocked);
}

/** 当前可选职业：隐藏职业只有解锁后才出现。 */
export function unlockedClasses(save) {
  return CLASSES.filter((c) => !c.hidden || Boolean(save?.inkUnlocked));
}
