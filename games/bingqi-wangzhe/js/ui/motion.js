/**
 * 动效策略：系统 prefers-reduced-motion + 玩家手动开关（设置里可切）。
 * 任何粒子 / 循环动画在降级模式下必须直接给终态，不做补间。
 */

const PREF_KEY = 'bqwz.ui.motion.v1';
const mq = typeof matchMedia === 'function'
  ? matchMedia('(prefers-reduced-motion: reduce)')
  : { matches: false, addEventListener() {} };

const listeners = new Set();

/** 'auto' | 'full' | 'reduced' */
let userPref = 'auto';
try {
  const stored = localStorage.getItem(PREF_KEY);
  if (stored === 'full' || stored === 'reduced') userPref = stored;
} catch {
  /* 隐私模式 / 无存储：保持 auto */
}

export function reducedMotion() {
  if (userPref === 'reduced') return true;
  if (userPref === 'full') return false;
  return !!mq.matches;
}

export function motionPreference() {
  return userPref;
}

export function setMotionPreference(pref) {
  userPref = pref;
  try {
    if (pref === 'auto') localStorage.removeItem(PREF_KEY);
    else localStorage.setItem(PREF_KEY, pref);
  } catch {
    /* ignore */
  }
  syncDocument();
  listeners.forEach((fn) => fn(reducedMotion()));
}

export function onMotionChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function syncDocument() {
  const root = document.documentElement;
  root.classList.toggle('reduce-motion', reducedMotion());
}

mq.addEventListener?.('change', () => {
  syncDocument();
  listeners.forEach((fn) => fn(reducedMotion()));
});

/** 按钮波纹：降级模式下不产生额外节点。 */
export function ripple(event) {
  if (reducedMotion()) return;
  const el = event.currentTarget;
  if (!el || typeof el.getBoundingClientRect !== 'function') return;
  const rect = el.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);
  const dot = document.createElement('span');
  dot.className = 'ripple';
  dot.style.width = dot.style.height = `${size}px`;
  dot.style.left = `${(event.clientX ?? rect.left + rect.width / 2) - rect.left - size / 2}px`;
  dot.style.top = `${(event.clientY ?? rect.top + rect.height / 2) - rect.top - size / 2}px`;
  el.append(dot);
  dot.addEventListener('animationend', () => dot.remove(), { once: true });
}

/** 短促类原生触感（无 API 时静默）。 */
export function haptic(pattern = 12) {
  if (reducedMotion()) return;
  try {
    navigator.vibrate?.(pattern);
  } catch {
    /* ignore */
  }
}

/** 给元素加一次性动画 class。 */
export function pulse(el, className, duration = 320) {
  if (!el || reducedMotion()) return;
  el.classList.add(className);
  setTimeout(() => el.classList.remove(className), duration);
}

syncDocument();
