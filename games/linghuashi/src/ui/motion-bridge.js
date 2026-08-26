/**
 * 存档设置 → 动效礼仪的单向接线，与 ui/audio-bridge.js 同构。
 *
 * 系统级 `prefers-reduced-motion` 由 CSS 自己认领；这里只负责游戏内的
 * `settings.reducedMotion` 开关：把它写成 <html data-reduced-motion="true">，
 * 让 CSS 与系统偏好走同一套关动效规则，同时把状态缓存给
 * 拿不到 store 的模块（painter-host 的键盘回显）读。
 */

const ATTR = "data-reduced-motion";

let saveReduced = false;

function mediaReduced() {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

/** 存档设置与系统偏好任意一边要求减动效即为真。 */
export function prefersReducedMotion(save) {
  if (save?.settings?.reducedMotion) return true;
  return mediaReduced();
}

/** 无 store 的调用点用这个：读接线时缓存的存档设置，再兜系统偏好。 */
export function motionReduced() {
  return saveReduced || mediaReduced();
}

function paintRoot(on) {
  const html = typeof document !== "undefined" ? document.documentElement : null;
  if (!html) return;
  if (on) html.setAttribute(ATTR, "true");
  else html.removeAttribute(ATTR);
}

export function bindMotionSettings(store) {
  const read = (state) => Boolean(state?.settings?.reducedMotion);
  saveReduced = read(store.get());
  paintRoot(saveReduced);
  const unsubscribe = store.subscribe((state) => {
    const next = read(state);
    if (next === saveReduced) return;
    saveReduced = next;
    paintRoot(next);
  });
  return () => {
    unsubscribe();
    saveReduced = false;
    paintRoot(false);
  };
}

export { ATTR as REDUCED_MOTION_ATTR };
