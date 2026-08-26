/**
 * 全部用 WebAudio 现场合成，不加载任何音频文件、不联网。
 * 浏览器不支持或用户静音时，所有调用都是安全的空操作。
 */

let ctx = null;
let master = null;
let muted = false;
let broken = false;

/** kind -> [基频, 波形, 时长秒, 音量] */
const VOICES = {
  ui: [420, "sine", 0.12, 0.03],
  till: [180, "triangle", 0.18, 0.05],
  plant: [340, "sine", 0.16, 0.045],
  harvest: [520, "sine", 0.2, 0.05],
  collect: [600, "sine", 0.16, 0.045],
  wish: [660, "sine", 0.26, 0.05],
  cook: [260, "triangle", 0.3, 0.05],
  build: [200, "square", 0.22, 0.03],
  pet: [740, "sine", 0.14, 0.04],
  save: [480, "sine", 0.14, 0.035],
  nope: [150, "sawtooth", 0.16, 0.035],
};

function ac() {
  if (broken) return null;
  if (ctx) return ctx;
  try {
    const Ctor = typeof window !== "undefined" && (window.AudioContext || window.webkitAudioContext);
    if (!Ctor) {
      broken = true;
      return null;
    }
    ctx = new Ctor();
    master = ctx.createGain();
    master.gain.value = 0.9;
    master.connect(ctx.destination);
    return ctx;
  } catch {
    broken = true;
    return null;
  }
}

export function setMuted(value) {
  muted = !!value;
  if (muted && ctx && ctx.state === "running") ctx.suspend().catch(() => {});
}

export function isMuted() {
  return muted;
}

/** 首次交互后调用：自动播放策略要求用户手势才能开声。 */
export function resumeAudio() {
  if (muted) return;
  const c = ac();
  if (c && c.state === "suspended") c.resume().catch(() => {});
}

function tone(freq, type, dur, gain, delay = 0) {
  const c = ac();
  if (!c) return;
  const t0 = c.currentTime + delay;
  const osc = c.createOscillator();
  const env = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  env.gain.setValueAtTime(0.0001, t0);
  env.gain.exponentialRampToValueAtTime(gain, t0 + 0.012);
  env.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(env).connect(master);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

export function chirp(kind = "ui") {
  if (muted) return;
  const c = ac();
  if (!c) return;
  if (c.state === "suspended") c.resume().catch(() => {});
  const [freq, type, dur, gain] = VOICES[kind] || VOICES.ui;
  tone(freq, type, dur, gain);
  if (kind === "harvest" || kind === "collect") tone(freq * 1.5, type, dur * 0.7, gain * 0.6, 0.06);
  if (kind === "wish") tone(freq * 1.25, "sine", dur * 0.8, gain * 0.7, 0.09);
  if (kind === "nope") tone(freq * 0.8, "sawtooth", dur * 0.8, gain * 0.7, 0.07);
}

/** 升级时的一小段上行音阶。 */
export function fanfare() {
  if (muted) return;
  if (!ac()) return;
  [523.25, 659.25, 783.99].forEach((f, i) => tone(f, "sine", 0.28, 0.045, i * 0.11));
}
