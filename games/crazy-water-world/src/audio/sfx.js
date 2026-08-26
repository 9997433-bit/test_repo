// 音效：不加载任何音频文件，全部用 WebAudio 现场合成——包体零负担，离线也响。
// 冻结导出：blip / setMuted。其余为附加。
const VOICES = {
  pickup: { type: "sine", from: 520, to: 780, dur: 0.14, gain: 0.05 },
  rare: { type: "triangle", from: 660, to: 1180, dur: 0.28, gain: 0.06 },
  build: { type: "triangle", from: 210, to: 150, dur: 0.2, gain: 0.06 },
  hit: { type: "sawtooth", from: 160, to: 70, dur: 0.24, gain: 0.06 },
  deny: { type: "square", from: 180, to: 110, dur: 0.16, gain: 0.035 },
  tap: { type: "sine", from: 420, to: 420, dur: 0.05, gain: 0.03 },
  cast: { type: "sine", from: 300, to: 620, dur: 0.18, gain: 0.045 },
  hook: { type: "triangle", from: 700, to: 980, dur: 0.2, gain: 0.06 },
  order: { type: "sine", from: 560, to: 840, dur: 0.16, gain: 0.05 },
  dive: { type: "sine", from: 380, to: 140, dur: 0.4, gain: 0.05 },
  // 天气替老大做决定时用：强制收杆 / 紧急上浮，跟「你自己按的」那几个音区分开。
  alarm: { type: "square", from: 620, to: 240, dur: 0.36, gain: 0.05 },
  win: { type: "triangle", from: 520, to: 1040, dur: 0.42, gain: 0.07 },
};

let ctx;
let muted = false;

function ac() {
  if (typeof window === "undefined") return null;
  const Ctor = window.AudioContext || window.webkitAudioContext;
  if (!Ctor) return null;
  if (!ctx) ctx = new Ctor();
  return ctx;
}

export function setMuted(v) {
  muted = !!v;
}

export function isMuted() {
  return muted;
}

// 浏览器要求先有用户手势才让 AudioContext 出声，UI 在第一次点击/按键时调它。
export function resumeAudio() {
  try {
    const c = ac();
    if (c && c.state === "suspended") c.resume();
  } catch {
    /* audio optional */
  }
}

export function blip(kind = "pickup") {
  if (muted) return;
  const voice = VOICES[kind] || VOICES.pickup;
  try {
    const c = ac();
    if (!c) return;
    const t0 = c.currentTime;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = voice.type;
    o.frequency.setValueAtTime(voice.from, t0);
    if (voice.to !== voice.from) o.frequency.exponentialRampToValueAtTime(voice.to, t0 + voice.dur);
    g.gain.setValueAtTime(voice.gain, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + voice.dur);
    o.connect(g);
    g.connect(c.destination);
    o.start(t0);
    o.stop(t0 + voice.dur + 0.02);
  } catch {
    /* audio optional */
  }
}
