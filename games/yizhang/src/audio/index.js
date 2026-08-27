// 全合成音效，零外部音频文件。契约：createAudio() / unlock() / play(name, opts)
//
// 声音设计跟视觉手册同一套纪律：不要「纯电子哔哔」，每个音都给三段包络
// （起 / 体 / 尾），扇击带布料噪声、重击带低频体感、碎地带石屑尾音。

const NOISE_SECONDS = 1.2;

let current = null;

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

export function createAudio(opts = {}) {
  const AudioCtor =
    typeof window !== "undefined" ? window.AudioContext || window.webkitAudioContext : null;

  const state = {
    ctx: null,
    master: null,
    comp: null,
    noise: null,
    unlocked: false,
    muted: !!opts.muted,
    volume: opts.volume ?? 0.7,
    failed: !AudioCtor,
    lastAt: new Map(),
  };

  function ensureContext() {
    if (state.ctx || state.failed) return state.ctx;
    try {
      state.ctx = new AudioCtor();
      state.comp = state.ctx.createDynamicsCompressor();
      state.comp.threshold.value = -14;
      state.comp.knee.value = 22;
      state.comp.ratio.value = 8;
      state.comp.attack.value = 0.003;
      state.comp.release.value = 0.2;
      state.master = state.ctx.createGain();
      state.master.gain.value = state.muted ? 0 : state.volume;
      state.master.connect(state.comp);
      state.comp.connect(state.ctx.destination);

      const len = Math.floor(state.ctx.sampleRate * NOISE_SECONDS);
      const buf = state.ctx.createBuffer(1, len, state.ctx.sampleRate);
      const data = buf.getChannelData(0);
      let brown = 0;
      for (let i = 0; i < len; i += 1) {
        const white = Math.random() * 2 - 1;
        brown = (brown + 0.02 * white) / 1.02;
        data[i] = white * 0.7 + brown * 3.2;
      }
      state.noise = buf;
    } catch (err) {
      console.warn("[yizhang] WebAudio 初始化失败，静音运行", err);
      state.failed = true;
    }
    return state.ctx;
  }

  function now() {
    return state.ctx ? state.ctx.currentTime : 0;
  }

  function envGain(t0, peak, attack, decay) {
    const g = state.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t0 + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + attack + decay);
    g.connect(state.master);
    return g;
  }

  function tone(t0, { type = "sine", from, to, peak = 0.3, attack = 0.005, decay = 0.2, detune = 0 }) {
    const osc = state.ctx.createOscillator();
    osc.type = type;
    osc.detune.value = detune;
    osc.frequency.setValueAtTime(from, t0);
    if (to && to !== from) osc.frequency.exponentialRampToValueAtTime(Math.max(20, to), t0 + attack + decay);
    const g = envGain(t0, peak, attack, decay);
    osc.connect(g);
    osc.start(t0);
    osc.stop(t0 + attack + decay + 0.05);
    return osc;
  }

  function noise(t0, { peak = 0.25, attack = 0.004, decay = 0.16, filter = "bandpass", freq = 1800, q = 1.1, sweepTo = 0 }) {
    const src = state.ctx.createBufferSource();
    src.buffer = state.noise;
    src.playbackRate.value = 0.8 + Math.random() * 0.4;
    const bp = state.ctx.createBiquadFilter();
    bp.type = filter;
    bp.frequency.setValueAtTime(freq, t0);
    bp.Q.value = q;
    if (sweepTo) bp.frequency.exponentialRampToValueAtTime(Math.max(60, sweepTo), t0 + attack + decay);
    const g = envGain(t0, peak, attack, decay);
    src.connect(bp);
    bp.connect(g);
    const offset = Math.random() * (NOISE_SECONDS - decay - attack - 0.05);
    src.start(t0, Math.max(0, offset), attack + decay + 0.05);
    return src;
  }

  const VOICES = {
    slap(t, o) {
      const v = o.velocity ?? 1;
      noise(t, { peak: 0.16 * v, attack: 0.002, decay: 0.075, freq: 2600, q: 0.8, sweepTo: 900 });
      tone(t, { type: "triangle", from: 420, to: 180, peak: 0.07 * v, attack: 0.003, decay: 0.1 });
    },
    slapWhiff(t) {
      noise(t, { peak: 0.07, attack: 0.012, decay: 0.14, freq: 1200, q: 0.6, sweepTo: 420 });
    },
    hit(t, o) {
      const v = clamp(o.power ? o.power / 14 : 1, 0.5, 1.8);
      noise(t, { peak: 0.2 * v, attack: 0.001, decay: 0.06, freq: 3200, q: 0.7, sweepTo: 700 });
      tone(t, { type: "sine", from: 190 * v, to: 62, peak: 0.32 * v, attack: 0.002, decay: 0.24 });
      tone(t + 0.012, { type: "square", from: 128, to: 74, peak: 0.05, attack: 0.002, decay: 0.09 });
    },
    /** 本人挨的那一记：短、闷、贴脸。跟通用 hit 分开，才听得出「打的是我」。 */
    hitTaken(t, o) {
      const v = clamp(o.power ? o.power / 14 : 1, 0.6, 1.8);
      tone(t, { type: "sine", from: 132, to: 46, peak: 0.34 * v, attack: 0.001, decay: 0.16 });
      noise(t, { peak: 0.14 * v, attack: 0.001, decay: 0.05, filter: "lowpass", freq: 1500, sweepTo: 320 });
    },
    heavy(t) {
      tone(t, { type: "sine", from: 120, to: 44, peak: 0.5, attack: 0.004, decay: 0.5 });
      noise(t, { peak: 0.24, attack: 0.002, decay: 0.3, filter: "lowpass", freq: 900, sweepTo: 180 });
    },
    crack(t) {
      noise(t, { peak: 0.22, attack: 0.001, decay: 0.09, freq: 5200, q: 2.2, sweepTo: 1400 });
      noise(t + 0.05, { peak: 0.1, attack: 0.004, decay: 0.42, filter: "lowpass", freq: 1600, sweepTo: 260 });
    },
    collapse(t) {
      tone(t, { type: "sine", from: 88, to: 32, peak: 0.5, attack: 0.01, decay: 0.9 });
      noise(t, { peak: 0.3, attack: 0.01, decay: 1.0, filter: "lowpass", freq: 1200, sweepTo: 140 });
    },
    jump(t) {
      tone(t, { type: "sine", from: 320, to: 520, peak: 0.1, attack: 0.006, decay: 0.11 });
    },
    land(t, o) {
      const v = clamp(0.5 + (o.impact ?? 0), 0.5, 1.4);
      tone(t, { type: "sine", from: 150, to: 60, peak: 0.16 * v, attack: 0.002, decay: 0.16 });
      noise(t, { peak: 0.08 * v, attack: 0.002, decay: 0.1, filter: "lowpass", freq: 700 });
    },
    dash(t) {
      noise(t, { peak: 0.16, attack: 0.02, decay: 0.26, freq: 900, q: 0.5, sweepTo: 2600 });
    },
    switchGlove(t) {
      tone(t, { type: "square", from: 880, to: 660, peak: 0.05, attack: 0.001, decay: 0.05 });
      noise(t + 0.03, { peak: 0.09, attack: 0.001, decay: 0.05, freq: 3400, q: 3 });
    },
    skill(t) {
      tone(t, { type: "sawtooth", from: 180, to: 620, peak: 0.12, attack: 0.02, decay: 0.3 });
      noise(t, { peak: 0.1, attack: 0.02, decay: 0.35, freq: 1400, q: 0.9, sweepTo: 3200 });
    },
    awaken(t) {
      [196, 262, 392].forEach((f, i) => {
        tone(t + i * 0.045, { type: "triangle", from: f, to: f * 1.5, peak: 0.16, attack: 0.03, decay: 0.75 });
      });
      noise(t, { peak: 0.12, attack: 0.06, decay: 0.8, freq: 700, q: 0.7, sweepTo: 2400 });
    },
    ringout(t) {
      tone(t, { type: "sine", from: 520, to: 90, peak: 0.24, attack: 0.01, decay: 0.75 });
      noise(t, { peak: 0.1, attack: 0.03, decay: 0.7, filter: "lowpass", freq: 2200, sweepTo: 200 });
    },
    kill(t) {
      tone(t, { type: "triangle", from: 660, to: 990, peak: 0.14, attack: 0.008, decay: 0.22 });
      tone(t + 0.09, { type: "triangle", from: 990, to: 1320, peak: 0.1, attack: 0.008, decay: 0.26 });
    },
    death(t) {
      tone(t, { type: "sine", from: 330, to: 82, peak: 0.2, attack: 0.01, decay: 0.6 });
    },
    respawn(t) {
      tone(t, { type: "sine", from: 180, to: 440, peak: 0.12, attack: 0.03, decay: 0.3 });
    },
    uiMove(t) {
      tone(t, { type: "sine", from: 620, to: 620, peak: 0.05, attack: 0.003, decay: 0.05 });
    },
    uiSelect(t) {
      tone(t, { type: "triangle", from: 440, to: 660, peak: 0.09, attack: 0.004, decay: 0.12 });
    },
    uiBack(t) {
      tone(t, { type: "triangle", from: 440, to: 300, peak: 0.08, attack: 0.004, decay: 0.13 });
    },
    matchStart(t) {
      [131, 196, 262].forEach((f, i) =>
        tone(t + i * 0.1, { type: "triangle", from: f, to: f, peak: 0.16, attack: 0.02, decay: 0.5 })
      );
      noise(t + 0.2, { peak: 0.12, attack: 0.05, decay: 0.9, filter: "lowpass", freq: 900 });
    },
    matchEnd(t) {
      [262, 196, 131].forEach((f, i) =>
        tone(t + i * 0.14, { type: "triangle", from: f, to: f * 0.99, peak: 0.16, attack: 0.02, decay: 0.7 })
      );
    },
    tick(t) {
      tone(t, { type: "square", from: 1200, to: 1200, peak: 0.035, attack: 0.001, decay: 0.04 });
    },
  };

  const THROTTLE = {
    slap: 0.05,
    hit: 0.03,
    hitTaken: 0.06,
    crack: 0.05,
    land: 0.06,
    tick: 0.4,
    uiMove: 0.05,
  };

  const api = {
    get context() {
      return state.ctx;
    },
    get unlocked() {
      return state.unlocked;
    },
    get muted() {
      return state.muted;
    },
    unlock() {
      if (state.failed) return false;
      ensureContext();
      if (!state.ctx) return false;
      if (state.ctx.state === "suspended") state.ctx.resume().catch(() => {});
      if (!state.unlocked) {
        // iOS 需要在手势里真正播出一个 buffer 才算解锁。
        try {
          const src = state.ctx.createBufferSource();
          src.buffer = state.ctx.createBuffer(1, 1, state.ctx.sampleRate);
          src.connect(state.ctx.destination);
          src.start(0);
        } catch (err) {
          /* 解锁失败不影响主循环 */
        }
        state.unlocked = true;
      }
      return true;
    },
    play(name, options = {}) {
      if (state.failed || state.muted) return false;
      if (!state.ctx) return false;
      if (state.ctx.state === "suspended") return false;
      const voice = VOICES[name];
      if (!voice) return false;
      const t = now() + (options.delay || 0);
      const gate = THROTTLE[name];
      if (gate) {
        const last = state.lastAt.get(name) || -99;
        if (t - last < gate) return false;
        state.lastAt.set(name, t);
      }
      try {
        voice(t + 0.001, options);
      } catch (err) {
        console.warn(`[yizhang] 音效 ${name} 播放失败`, err);
        return false;
      }
      return true;
    },
    setMuted(next) {
      state.muted = !!next;
      if (state.master) {
        state.master.gain.setTargetAtTime(state.muted ? 0 : state.volume, now(), 0.02);
      }
      return state.muted;
    },
    setVolume(v) {
      state.volume = clamp(v, 0, 1);
      if (state.master && !state.muted) {
        state.master.gain.setTargetAtTime(state.volume, now(), 0.02);
      }
    },
    dispose() {
      if (state.ctx && state.ctx.close) state.ctx.close().catch(() => {});
      state.ctx = null;
      state.unlocked = false;
      if (current === api) current = null;
    },
  };

  current = api;
  return api;
}

export function unlock() {
  return current ? current.unlock() : false;
}

export function play(name, opts) {
  return current ? current.play(name, opts) : false;
}

export function getAudio() {
  return current;
}
