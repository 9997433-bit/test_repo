/**
 * 音效：全部由 WebAudio 现场合成，仓库里**没有也不会有**任何音频文件
 * （零依赖 / 零版权风险 / 零额外请求，离线可用）。
 *
 * 三档偏好（存 `bqwz.ui.audio.v1`，与动效偏好各存各的）：
 *
 * | 偏好     | 行为                                     |
 * | -------- | ---------------------------------------- |
 * | `auto`   | 跟随动效：低动效（含系统 reduce-motion）时静音 |
 * | `on`     | 恒开，低动效下也响（只想关动画不想关声音的人） |
 * | `off`    | 恒闭                                     |
 *
 * AudioContext 必须由手势创建（各家浏览器的自动播放策略），因此这里
 * 只在第一次真实按下时才 new，之前的 `play()` 一律静默丢弃——
 * 「第一次点击没声音」远好过「控制台一片 autoplay 报错」。
 *
 * 音色一览（都是几十毫秒的包络，不占主线程）：
 *
 * | cue          | 合成方式                                        |
 * | ------------ | ----------------------------------------------- |
 * | `hammer1-3`  | 低频砸击正弦 + 噪声瞬态 + 三条金属泛音，逐锤升调 |
 * | `counter`    | 克制：纯五度上行双音，亮                         |
 * | `resist`     | 被克：小二度下行闷音，钝                         |
 * | `hit`/`crit` | 短噪声击 + 方波脆响（暴击更亮更长）              |
 * | `ko`         | 下坠锯齿 + 噪声尾                                |
 * | `victory`    | 宫—徵—宫 三音上行（五声音阶）                    |
 * | `defeat`     | 两音下行 + 长衰减                                |
 * | `reveal`     | 按品质取和弦，越高品质叠得越厚                   |
 * | `coin`       | 两枚高频短音，模拟铜钱相击                       |
 * | `tap`        | 极短木鱼点，用于分档切换                         |
 */

import { reducedMotion, onMotionChange } from './motion.js';

const PREF_KEY = 'bqwz.ui.audio.v1';
const VOL_KEY = 'bqwz.ui.audio.vol.v1';

/** 'auto' | 'on' | 'off' */
let pref = 'auto';
let volume = 0.7;

try {
  const stored = localStorage.getItem(PREF_KEY);
  if (stored === 'on' || stored === 'off') pref = stored;
  // 没存过就保持默认。`Number(null)` 是 0，直接信它会让新玩家一进来就是静音。
  const storedVol = localStorage.getItem(VOL_KEY);
  if (storedVol !== null) {
    const vol = Number(storedVol);
    if (Number.isFinite(vol) && vol >= 0 && vol <= 1) volume = vol;
  }
} catch {
  /* 隐私模式 / 无存储：保持默认 */
}

const listeners = new Set();

let ctx = null;
let master = null;
/** 用户是否已经做过一次手势（决定能不能 new AudioContext）。 */
let gestured = false;

export function audioPreference() {
  return pref;
}

/** 当前是否应该出声（偏好 + 动效降级共同决定）。 */
export function audioEnabled() {
  if (pref === 'off') return false;
  if (pref === 'on') return true;
  return !reducedMotion();
}

export function audioVolume() {
  return volume;
}

export function onAudioChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function notify() {
  listeners.forEach((fn) => fn(audioEnabled()));
}

export function setAudioPreference(next) {
  pref = next === 'on' || next === 'off' ? next : 'auto';
  try {
    if (pref === 'auto') localStorage.removeItem(PREF_KEY);
    else localStorage.setItem(PREF_KEY, pref);
  } catch {
    /* ignore */
  }
  if (!audioEnabled()) suspend();
  else resume();
  notify();
}

export function setAudioVolume(next) {
  volume = Math.max(0, Math.min(1, Number(next) || 0));
  try {
    localStorage.setItem(VOL_KEY, String(volume));
  } catch {
    /* ignore */
  }
  if (master) master.gain.value = volume * 0.5;
  notify();
}

// 动效偏好切到「减少动效」时，auto 档要跟着静音。
onMotionChange(() => {
  if (pref !== 'auto') return;
  audioEnabled() ? resume() : suspend();
  notify();
});

/* ------------------------------------------------------------------ *
 * AudioContext 生命周期
 * ------------------------------------------------------------------ */

function ensureContext() {
  if (ctx) return ctx;
  if (!gestured) return null;
  const Ctor = window.AudioContext || window.webkitAudioContext;
  if (!Ctor) return null;
  try {
    ctx = new Ctor({ latencyHint: 'interactive' });
  } catch {
    return null;
  }
  master = ctx.createGain();
  master.gain.value = volume * 0.5;
  master.connect(ctx.destination);
  return ctx;
}

function resume() {
  if (ctx?.state === 'suspended') ctx.resume().catch(() => {});
}

function suspend() {
  if (ctx?.state === 'running') ctx.suspend().catch(() => {});
}

/**
 * 标记「用户已经交互过」。挂在 app 外壳的第一个 pointerdown / keydown 上，
 * 之后的 cue 才有 AudioContext 可用。
 */
export function unlockAudio() {
  if (gestured) return;
  gestured = true;
  if (!audioEnabled()) return;
  ensureContext();
  resume();
}

/* ------------------------------------------------------------------ *
 * 合成原语
 * ------------------------------------------------------------------ */

/** 复用同一段白噪声，避免每次击打都现算一个 buffer。 */
let noiseBuffer = null;
function noise() {
  if (!ctx) return null;
  if (!noiseBuffer) {
    const len = Math.floor(ctx.sampleRate * 0.5);
    noiseBuffer = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < len; i += 1) data[i] = Math.random() * 2 - 1;
  }
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer;
  src.loop = true;
  return src;
}

/**
 * 一枚带指数衰减包络的振荡音。
 * @param {{type?:OscillatorType, freq:number, to?:number, at?:number,
 *          dur?:number, gain?:number, attack?:number}} spec
 */
function tone({ type = 'sine', freq, to, at = 0, dur = 0.2, gain = 0.3, attack = 0.004 }) {
  const t0 = ctx.currentTime + at;
  const osc = ctx.createOscillator();
  const amp = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (to && to !== freq) osc.frequency.exponentialRampToValueAtTime(Math.max(1, to), t0 + dur);
  amp.gain.setValueAtTime(0.0001, t0);
  amp.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain), t0 + attack);
  amp.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(amp).connect(master);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

/**
 * 一段带滤波的噪声瞬态（击打、碎裂、金属摩擦）。
 * @param {{at?:number, dur?:number, gain?:number, freq?:number,
 *          q?:number, type?:BiquadFilterType, sweepTo?:number}} spec
 */
function burst({ at = 0, dur = 0.12, gain = 0.3, freq = 1800, q = 0.9, type = 'bandpass', sweepTo }) {
  const src = noise();
  if (!src) return;
  const t0 = ctx.currentTime + at;
  const filter = ctx.createBiquadFilter();
  const amp = ctx.createGain();
  filter.type = type;
  filter.frequency.setValueAtTime(freq, t0);
  if (sweepTo) filter.frequency.exponentialRampToValueAtTime(Math.max(40, sweepTo), t0 + dur);
  filter.Q.value = q;
  amp.gain.setValueAtTime(0.0001, t0);
  amp.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain), t0 + 0.005);
  amp.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(filter).connect(amp).connect(master);
  src.start(t0);
  src.stop(t0 + dur + 0.02);
}

/* ------------------------------------------------------------------ *
 * 音色表
 * ------------------------------------------------------------------ */

/** 五声音阶（宫商角徵羽），所有旋律型提示音都从这里取音，避免听感跑调。 */
const PENTATONIC = [261.63, 293.66, 329.63, 392.0, 440.0];

/** 锤击：一锤比一锤高、比一锤重，三锤成器。 */
function hammer(step = 1) {
  const k = Math.max(1, Math.min(3, step));
  const base = 96 * (1 + (k - 1) * 0.16);
  const power = 0.7 + (k - 1) * 0.22;
  // 砧面被砸出的低频形变
  tone({ type: 'sine', freq: base, to: base * 0.45, dur: 0.24 * power, gain: 0.5 * power });
  // 铁与铁相撞的瞬态
  burst({ dur: 0.05, gain: 0.34 * power, freq: 2600, q: 0.7, sweepTo: 700 });
  // 金属泛音：三条不成整数比的分音，才有「哐」而不是「嘟」
  [1.0, 2.76, 5.4].forEach((ratio, i) => {
    tone({
      type: 'triangle',
      freq: base * 6 * ratio,
      at: 0.004,
      dur: (0.34 - i * 0.08) * power,
      gain: (0.16 - i * 0.04) * power
    });
  });
  if (k === 3) tone({ type: 'sine', freq: 1174.7, at: 0.05, dur: 0.7, gain: 0.12 });
}

/** 克制 / 被克：一升一降，闭着眼也分得清这一下吃不吃亏。 */
function counter() {
  tone({ type: 'triangle', freq: 659.25, dur: 0.1, gain: 0.24 });
  tone({ type: 'triangle', freq: 987.77, at: 0.07, dur: 0.2, gain: 0.26 });
  burst({ at: 0.06, dur: 0.14, gain: 0.1, freq: 5200, q: 1.6 });
}

function resist() {
  tone({ type: 'sine', freq: 220, dur: 0.14, gain: 0.24 });
  tone({ type: 'sine', freq: 196, at: 0.06, dur: 0.22, gain: 0.2 });
  burst({ dur: 0.1, gain: 0.09, freq: 420, q: 0.6, type: 'lowpass' });
}

function hit(crit) {
  burst({ dur: crit ? 0.12 : 0.07, gain: crit ? 0.3 : 0.18, freq: crit ? 3200 : 2000, q: 0.8, sweepTo: 600 });
  tone({ type: 'square', freq: crit ? 520 : 330, to: crit ? 180 : 150, dur: crit ? 0.16 : 0.09, gain: crit ? 0.16 : 0.1 });
  if (crit) tone({ type: 'triangle', freq: 1318.5, at: 0.03, dur: 0.26, gain: 0.14 });
}

function ko() {
  tone({ type: 'sawtooth', freq: 320, to: 54, dur: 0.5, gain: 0.26 });
  burst({ dur: 0.42, gain: 0.18, freq: 1500, q: 0.5, sweepTo: 160 });
}

function chord(freqs, { spread = 0.06, dur = 0.5, gain = 0.16, type = 'triangle' } = {}) {
  freqs.forEach((f, i) => tone({ type, freq: f, at: i * spread, dur, gain }));
}

const REVEAL_CHORDS = {
  common: [PENTATONIC[0], PENTATONIC[3]],
  uncommon: [PENTATONIC[0], PENTATONIC[2], PENTATONIC[3]],
  rare: [PENTATONIC[0], PENTATONIC[2], PENTATONIC[4]],
  epic: [PENTATONIC[0], PENTATONIC[2], PENTATONIC[4], PENTATONIC[3] * 2],
  legendary: [PENTATONIC[0], PENTATONIC[2], PENTATONIC[4], PENTATONIC[0] * 2, PENTATONIC[2] * 2],
  mythic: [PENTATONIC[0], PENTATONIC[2], PENTATONIC[4], PENTATONIC[0] * 2, PENTATONIC[3] * 2, PENTATONIC[0] * 4]
};

const CUES = {
  hammer1: () => hammer(1),
  hammer2: () => hammer(2),
  hammer3: () => hammer(3),
  counter,
  resist,
  hit: () => hit(false),
  crit: () => hit(true),
  ko,
  aoe: () => {
    burst({ dur: 0.3, gain: 0.2, freq: 900, q: 0.5, sweepTo: 3200 });
    tone({ type: 'sawtooth', freq: 140, to: 420, dur: 0.26, gain: 0.12 });
  },
  chain: () => {
    [0, 0.07, 0.14].forEach((at, i) => {
      burst({ at, dur: 0.08, gain: 0.16 - i * 0.03, freq: 3400 + i * 900, q: 2.2 });
      tone({ type: 'square', freq: 880 * (1 + i * 0.26), at, dur: 0.07, gain: 0.08 });
    });
  },
  victory: () => chord([PENTATONIC[0], PENTATONIC[3], PENTATONIC[0] * 2], { spread: 0.11, dur: 0.8, gain: 0.2 }),
  defeat: () => {
    tone({ type: 'sine', freq: 174.61, dur: 0.7, gain: 0.2 });
    tone({ type: 'sine', freq: 130.81, at: 0.16, dur: 0.9, gain: 0.18 });
  },
  coin: () => {
    tone({ type: 'triangle', freq: 1567.98, dur: 0.13, gain: 0.14 });
    tone({ type: 'triangle', freq: 2093, at: 0.05, dur: 0.17, gain: 0.11 });
  },
  tap: () => burst({ dur: 0.035, gain: 0.1, freq: 1400, q: 3 }),
  error: () => tone({ type: 'square', freq: 160, to: 110, dur: 0.18, gain: 0.14 })
};

/* ------------------------------------------------------------------ *
 * 对外播放接口
 * ------------------------------------------------------------------ */

/**
 * 播放一个音效；关闭 / 无 AudioContext / 未知 cue 时静默返回 false。
 * 永远不抛错——音效坏掉不该拖垮玩法。
 * @param {string} name CUES 里的键
 */
export function play(name) {
  if (!audioEnabled()) return false;
  const cue = CUES[name];
  if (!cue) return false;
  if (!ensureContext()) return false;
  resume();
  try {
    cue();
    return true;
  } catch {
    return false;
  }
}

/** 三锤：`strike(1|2|3)`。 */
export function strike(step) {
  return play(`hammer${Math.max(1, Math.min(3, step || 1))}`);
}

/** 命中音：按元素关系挑克制 / 被克 / 普通，暴击叠一层。 */
export function impact({ crit = false, relation = '' } = {}) {
  if (!audioEnabled()) return false;
  play(crit ? 'crit' : 'hit');
  if (relation === '克制') play('counter');
  else if (relation === '被克') play('resist');
  return true;
}

/** 品质揭示：品质越高和弦越厚。 */
export function reveal(quality) {
  if (!audioEnabled()) return false;
  if (!ensureContext()) return false;
  const freqs = REVEAL_CHORDS[quality] || REVEAL_CHORDS.common;
  const rich = quality === 'legendary' || quality === 'mythic';
  chord(freqs, { spread: rich ? 0.09 : 0.06, dur: rich ? 1.1 : 0.6, gain: rich ? 0.17 : 0.14 });
  if (rich) burst({ at: 0.02, dur: 0.9, gain: 0.08, freq: 6000, q: 0.8, sweepTo: 2000 });
  return true;
}

/** 供设置页「试听」用：一段能同时听出锤击与克制音的短示例。 */
export function preview() {
  if (!audioEnabled()) return false;
  strike(1);
  setTimeout(() => strike(3), 260);
  setTimeout(() => play('counter'), 620);
  return true;
}

export const CUE_NAMES = Object.freeze(Object.keys(CUES));

export default { play, strike, impact, reveal, preview, unlockAudio };
