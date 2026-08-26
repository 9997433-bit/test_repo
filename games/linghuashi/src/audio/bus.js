/**
 * 音频总线。
 *
 * 全部音源一律接在 master 增益上，静音就是把总线拧到 0：
 * 新加音效不必各自记得判断 mute，已经排程出去的尾音也会一起哑掉。
 * 本模块不认识 store，静音状态由 presentation 层（ui/audio-bridge.js）单向推进来。
 */

const MASTER_GAIN = 0.9;
const RAMP_S = 0.02;
const GESTURES = ["pointerdown", "keydown", "touchend"];

let ctx = null;
let master = null;
let muted = false;
let unavailable = false;
let unhookGesture = null;

function audioCtor() {
  if (typeof window === "undefined") return null;
  return window.AudioContext || window.webkitAudioContext || null;
}

/**
 * 浏览器要求先有用户手势才肯出声。首个手势后 resume 一次就够，
 * 成功之后立刻解绑，别在文档上长期挂三个监听。
 */
function hookGesture() {
  if (unhookGesture || typeof document === "undefined") return;
  const onGesture = () => {
    resumeAudio();
    if (!ctx || ctx.state !== "suspended") unhookGesture?.();
  };
  for (const type of GESTURES) document.addEventListener(type, onGesture, { passive: true });
  unhookGesture = () => {
    for (const type of GESTURES) document.removeEventListener(type, onGesture);
    unhookGesture = null;
  };
}

function ensureContext() {
  if (ctx || unavailable) return ctx;
  const Ctor = audioCtor();
  if (!Ctor) {
    unavailable = true;
    return null;
  }
  try {
    ctx = new Ctor();
    master = ctx.createGain();
    master.gain.value = muted ? 0 : MASTER_GAIN;
    master.connect(ctx.destination);
    hookGesture();
  } catch {
    // 例如同页开了太多 AudioContext：认栽转静默，不让音频拖垮界面。
    unavailable = true;
    ctx = null;
    master = null;
  }
  return ctx;
}

function applyGain() {
  if (!ctx || !master) return;
  const target = muted ? 0 : MASTER_GAIN;
  try {
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.setTargetAtTime(target, ctx.currentTime, RAMP_S);
  } catch {
    master.gain.value = target;
  }
}

export function isMuted() {
  return muted;
}

/** 唯一的静音入口；返回生效后的状态，便于调用方直接回显。 */
export function setMuted(next) {
  const value = Boolean(next);
  if (value === muted) return muted;
  muted = value;
  applyGain();
  return muted;
}

export function toggleMuted() {
  return setMuted(!muted);
}

export function resumeAudio() {
  if (!ctx || typeof ctx.resume !== "function") return;
  try {
    const done = ctx.resume();
    if (done && typeof done.catch === "function") done.catch(() => {});
  } catch {
    /* autoplay policies */
  }
}

/**
 * 取用总线。静音时连 AudioContext 都不建，
 * 于是「开局就静音」的玩家永远不会被浏览器记一笔自动播放。
 * @param {(ctx: AudioContext, out: GainNode) => void} fn
 * @returns {boolean} 是否真的发了声
 */
export function withBus(fn) {
  if (muted) return false;
  const c = ensureContext();
  if (!c || !master) return false;
  try {
    resumeAudio();
    fn(c, master);
    return true;
  } catch {
    return false;
  }
}

/** 卸载整个应用时释放；再次 withBus 会重新建。 */
export function closeAudio() {
  unhookGesture?.();
  const dying = ctx;
  ctx = null;
  master = null;
  unavailable = false;
  if (!dying || typeof dying.close !== "function") return;
  try {
    const done = dying.close();
    if (done && typeof done.catch === "function") done.catch(() => {});
  } catch {
    /* already closed */
  }
}
