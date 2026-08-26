import { isMuted, withBus } from "./bus.js";

/**
 * 笔声与提示音。
 *
 * 所有发声都经 bus.withBus 接在总线上，静音判断只在总线里做一次。
 */

const STROKE_VOICES = {
  line: { freq: 440, wave: "triangle" },
  curve: { freq: 360, wave: "triangle" },
  circle: { freq: 330, wave: "sine" },
  zigzag: { freq: 520, wave: "sawtooth", gain: 0.045 },
  spiral: { freq: 380, wave: "triangle" },
  cloud: { freq: 300, wave: "sine" },
  scribble: { freq: 220, wave: "triangle", gain: 0.035, dur: 0.18 },
};

const CUES = {
  win: [
    { freq: 392, wave: "sine", dur: 0.26 },
    { freq: 587, wave: "sine", dur: 0.42, delay: 0.14 },
  ],
  lose: [
    { freq: 262, wave: "triangle", dur: 0.3 },
    { freq: 175, wave: "triangle", dur: 0.5, delay: 0.16 },
  ],
  unlock: [
    { freq: 523, wave: "sine", dur: 0.24 },
    { freq: 659, wave: "sine", dur: 0.24, delay: 0.12 },
    { freq: 784, wave: "sine", dur: 0.5, delay: 0.24 },
  ],
};

function voice(ctx, out, { freq, wave = "triangle", gain = 0.05, dur = 0.3, delay = 0 }) {
  const at = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const env = ctx.createGain();
  osc.type = wave;
  osc.frequency.value = freq;
  // 指数包络不能碰 0，先从近乎无声起步再收回去，避免爆音。
  env.gain.setValueAtTime(0.0001, at);
  env.gain.exponentialRampToValueAtTime(gain, at + 0.02);
  env.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  osc.connect(env);
  env.connect(out);
  osc.start(at);
  osc.stop(at + dur + 0.02);
}

/**
 * 一笔成符的落笔声。
 * @param {string} type 笔法
 * @param {boolean} [mute] 兼容旧调用：显式传 true 时这一声单独闭嘴；缺省交给总线。
 */
export function playStroke(type, mute) {
  if (mute || isMuted()) return;
  const v = STROKE_VOICES[type] || STROKE_VOICES.scribble;
  withBus((ctx, out) => voice(ctx, out, v));
}

/** 胜负与解锁提示音。 */
export function playCue(name) {
  const notes = CUES[name];
  if (!notes || isMuted()) return;
  withBus((ctx, out) => {
    for (const note of notes) voice(ctx, out, note);
  });
}

export { isMuted, setMuted, toggleMuted, closeAudio, resumeAudio } from "./bus.js";
