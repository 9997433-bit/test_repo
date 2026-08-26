/**
 * 纯 WebAudio 合成音效（不加载任何外部音频资产）。
 * AudioContext 在首次用户手势时才创建，符合浏览器自动播放策略。
 */

const NOTES = { C4: 261.63, D4: 293.66, E4: 329.63, G4: 392, A4: 440, C5: 523.25, D5: 587.33, E5: 659.25, G5: 784, A5: 880, C6: 1046.5 };

export function createAudio(settings = {}) {
  let ctx = null;
  let master = null;
  let sfxGain = null;
  let musicGain = null;
  let musicTimer = null;
  let musicStep = 0;
  let musicMood = "menu";
  const state = { sfx: settings.sfx !== false, music: settings.music !== false, unlocked: false };

  function ensure() {
    if (ctx) return ctx;
    const AC = globalThis.AudioContext || globalThis.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.9;
    master.connect(ctx.destination);
    sfxGain = ctx.createGain();
    sfxGain.gain.value = state.sfx ? 0.55 : 0;
    sfxGain.connect(master);
    musicGain = ctx.createGain();
    musicGain.gain.value = state.music ? 0.14 : 0;
    musicGain.connect(master);
    return ctx;
  }

  function now() {
    return ctx ? ctx.currentTime : 0;
  }

  function tone(opts) {
    if (!state.sfx || !ensure()) return;
    const {
      freq = 440, type = "sine", dur = 0.12, gain = 0.5, attack = 0.005,
      slideTo = null, detune = 0, delay = 0, target = sfxGain, curve = "exp",
    } = opts;
    const t0 = now() + delay;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(Math.max(20, freq), t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t0 + dur);
    osc.detune.value = detune;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain), t0 + attack);
    if (curve === "exp") g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    else g.gain.linearRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g);
    g.connect(target);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  function noise(opts) {
    if (!state.sfx || !ensure()) return;
    const { dur = 0.16, gain = 0.35, band = 1400, q = 1.4, delay = 0, sweepTo = null } = opts;
    const t0 = now() + delay;
    const frames = Math.max(1, Math.floor(ctx.sampleRate * dur));
    const buffer = ctx.createBuffer(1, frames, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < frames; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / frames);
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(band, t0);
    if (sweepTo) filter.frequency.exponentialRampToValueAtTime(Math.max(60, sweepTo), t0 + dur);
    filter.Q.value = q;
    const g = ctx.createGain();
    g.gain.setValueAtTime(gain, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(filter);
    filter.connect(g);
    g.connect(sfxGain);
    src.start(t0);
    src.stop(t0 + dur + 0.02);
  }

  const RECIPES = {
    shoot: (rate) => {
      tone({ freq: 200 * rate, slideTo: 720 * rate, type: "triangle", dur: 0.16, gain: 0.45 });
      noise({ dur: 0.1, band: 900, gain: 0.2 });
    },
    wall: (rate) => tone({ freq: 320 * rate, type: "square", dur: 0.05, gain: 0.14 }),
    peg: (rate) => {
      tone({ freq: 660 * rate, type: "sine", dur: 0.1, gain: 0.3 });
      tone({ freq: 990 * rate, type: "sine", dur: 0.07, gain: 0.12, delay: 0.01 });
    },
    hit: (rate) => {
      tone({ freq: 420 * rate, slideTo: 200 * rate, type: "square", dur: 0.09, gain: 0.3 });
      noise({ dur: 0.08, band: 2200, gain: 0.22 });
    },
    brick: () => noise({ dur: 0.12, band: 1600, sweepTo: 500, gain: 0.3 }),
    clank: () => {
      tone({ freq: 180, type: "square", dur: 0.07, gain: 0.2 });
      noise({ dur: 0.09, band: 3200, gain: 0.2 });
    },
    pop: () => {
      tone({ freq: 520, slideTo: 1200, type: "sine", dur: 0.13, gain: 0.32 });
      noise({ dur: 0.14, band: 1200, sweepTo: 300, gain: 0.25 });
    },
    split: () => tone({ freq: 880, slideTo: 1500, type: "triangle", dur: 0.1, gain: 0.22 }),
    boom: () => {
      noise({ dur: 0.42, band: 260, sweepTo: 70, gain: 0.5, q: 0.7 });
      tone({ freq: 120, slideTo: 40, type: "sawtooth", dur: 0.35, gain: 0.35 });
    },
    combo: (rate) => {
      tone({ freq: 520 * rate, type: "triangle", dur: 0.1, gain: 0.24 });
      tone({ freq: 780 * rate, type: "triangle", dur: 0.12, gain: 0.18, delay: 0.05 });
    },
    reaction: () => {
      tone({ freq: 300, slideTo: 1300, type: "sawtooth", dur: 0.2, gain: 0.2 });
      noise({ dur: 0.18, band: 2600, gain: 0.18 });
    },
    charged: () => {
      tone({ freq: NOTES.C5, type: "sine", dur: 0.14, gain: 0.22 });
      tone({ freq: NOTES.G5, type: "sine", dur: 0.18, gain: 0.2, delay: 0.08 });
    },
    ult: () => {
      [NOTES.C4, NOTES.E4, NOTES.G4, NOTES.C5, NOTES.E5].forEach((f, i) =>
        tone({ freq: f, type: "sawtooth", dur: 0.3, gain: 0.2, delay: i * 0.045 }),
      );
      noise({ dur: 0.5, band: 900, sweepTo: 3000, gain: 0.2 });
    },
    heal: () => {
      tone({ freq: NOTES.G4, type: "sine", dur: 0.2, gain: 0.22 });
      tone({ freq: NOTES.C5, type: "sine", dur: 0.26, gain: 0.2, delay: 0.09 });
    },
    shield: () => tone({ freq: 300, slideTo: 520, type: "triangle", dur: 0.22, gain: 0.26 }),
    hurt: () => {
      tone({ freq: 220, slideTo: 80, type: "sawtooth", dur: 0.26, gain: 0.32 });
      noise({ dur: 0.2, band: 500, gain: 0.24 });
    },
    win: () => {
      [NOTES.C5, NOTES.E5, NOTES.G5, NOTES.C6].forEach((f, i) =>
        tone({ freq: f, type: "triangle", dur: 0.34, gain: 0.26, delay: i * 0.12 }),
      );
    },
    lose: () => {
      [NOTES.G4, NOTES.E4, NOTES.D4, NOTES.C4].forEach((f, i) =>
        tone({ freq: f, type: "sine", dur: 0.4, gain: 0.24, delay: i * 0.16 }),
      );
    },
    bossDown: () => {
      noise({ dur: 0.8, band: 200, sweepTo: 60, gain: 0.5, q: 0.6 });
      [NOTES.C4, NOTES.G4, NOTES.C5].forEach((f, i) =>
        tone({ freq: f, type: "sawtooth", dur: 0.5, gain: 0.24, delay: i * 0.1 }),
      );
    },
    wave: () => {
      tone({ freq: NOTES.D4, type: "square", dur: 0.16, gain: 0.2 });
      tone({ freq: NOTES.A4, type: "square", dur: 0.2, gain: 0.18, delay: 0.1 });
    },
    ui: () => tone({ freq: 720, type: "sine", dur: 0.06, gain: 0.16 }),
    back: () => tone({ freq: 420, slideTo: 280, type: "sine", dur: 0.09, gain: 0.16 }),
    reel: (rate) => tone({ freq: 500 * rate, type: "square", dur: 0.05, gain: 0.12 }),
    catchFish: () => {
      [NOTES.E5, NOTES.G5, NOTES.C6].forEach((f, i) =>
        tone({ freq: f, type: "triangle", dur: 0.22, gain: 0.24, delay: i * 0.08 }),
      );
    },
  };

  const MOODS = {
    menu: { scale: [NOTES.C4, NOTES.E4, NOTES.G4, NOTES.A4, NOTES.C5, NOTES.A4, NOTES.G4, NOTES.E4], tempo: 300, type: "triangle" },
    battle: { scale: [NOTES.C4, NOTES.G4, NOTES.A4, NOTES.E4, NOTES.G4, NOTES.C5, NOTES.A4, NOTES.G4], tempo: 230, type: "square" },
    boss: { scale: [NOTES.C4, NOTES.C4, NOTES.D4, NOTES.C4, NOTES.G4, NOTES.E4, NOTES.D4, NOTES.C4], tempo: 190, type: "sawtooth" },
  };

  function musicTick() {
    if (!state.music || !ctx) return;
    const mood = MOODS[musicMood] ?? MOODS.menu;
    const f = mood.scale[musicStep % mood.scale.length];
    const t0 = now();
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = mood.type;
    osc.frequency.value = f / 2;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(0.32, t0 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + mood.tempo / 1000);
    osc.connect(g);
    g.connect(musicGain);
    osc.start(t0);
    osc.stop(t0 + mood.tempo / 1000 + 0.05);
    if (musicStep % 4 === 0) {
      const k = ctx.createOscillator();
      const kg = ctx.createGain();
      k.type = "sine";
      k.frequency.setValueAtTime(120, t0);
      k.frequency.exponentialRampToValueAtTime(45, t0 + 0.12);
      kg.gain.setValueAtTime(0.5, t0);
      kg.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.14);
      k.connect(kg);
      kg.connect(musicGain);
      k.start(t0);
      k.stop(t0 + 0.18);
    }
    musicStep++;
  }

  const api = {
    get unlocked() {
      return state.unlocked;
    },
    unlock() {
      if (!ensure()) return;
      if (ctx.state === "suspended") ctx.resume();
      state.unlocked = true;
    },
    play(name, opts = {}) {
      if (!state.sfx) return;
      if (!ensure()) return;
      const recipe = RECIPES[name];
      if (!recipe) return;
      try {
        recipe(opts.rate ?? 1);
      } catch {
        /* 音频失败不应影响玩法 */
      }
    },
    setMood(mood) {
      musicMood = mood;
    },
    startMusic(mood = "menu") {
      musicMood = mood;
      if (!state.music) return;
      if (!ensure()) return;
      if (musicTimer) return;
      const tempo = (MOODS[musicMood] ?? MOODS.menu).tempo;
      musicTimer = setInterval(musicTick, tempo);
    },
    stopMusic() {
      if (musicTimer) clearInterval(musicTimer);
      musicTimer = null;
    },
    setSfx(on) {
      state.sfx = on;
      if (sfxGain) sfxGain.gain.value = on ? 0.55 : 0;
    },
    setMusic(on) {
      state.music = on;
      if (musicGain) musicGain.gain.value = on ? 0.14 : 0;
      if (!on) api.stopMusic();
      else api.startMusic(musicMood);
    },
  };
  return api;
}
