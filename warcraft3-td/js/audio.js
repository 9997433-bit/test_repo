/**
 * Procedural WebAudio for Frontier Keep TD.
 *
 * Public contract used by main.js / game.js (do not change):
 *   new AudioBus(), .master (0..1, set directly), .enabled, .ensure(),
 *   .beep(), .click(), .build(), .sell(), .shoot(race), .leak(),
 *   .wave(), .win(), .lose()
 *
 * Internals: every sound is layered from oscillators + filtered noise,
 * routed through a master gain -> compressor bus. All multi-note cues are
 * scheduled on the AudioContext clock (no setTimeout drift). A small voice
 * cap keeps 40-tower barrages from clipping or eating CPU.
 */
(function (root) {
  "use strict";

  function AudioBus() {
    this.ctx = null;
    this.master = 0.55;
    this.enabled = true;
    this._out = null;
    this._noiseBuf = null;
    this._voices = 0;
    this._lastShot = 0;
  }

  AudioBus.prototype.ensure = function () {
    if (!this.ctx && typeof AudioContext !== "undefined") {
      this.ctx = new AudioContext();
      const comp = this.ctx.createDynamicsCompressor();
      comp.threshold.value = -16;
      comp.knee.value = 22;
      comp.ratio.value = 7;
      comp.attack.value = 0.004;
      comp.release.value = 0.16;
      this._out = this.ctx.createGain();
      this._out.gain.value = this.master;
      this._out.connect(comp);
      comp.connect(this.ctx.destination);
    }
    if (this.ctx && this.ctx.state === "suspended") this.ctx.resume();
    if (this._out) this._out.gain.value = this.master;
    return this.ctx;
  };

  AudioBus.prototype._noise = function () {
    if (!this._noiseBuf) {
      const len = this.ctx.sampleRate;
      this._noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const d = this._noiseBuf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    }
    return this._noiseBuf;
  };

  AudioBus.prototype._track = function (node) {
    const self = this;
    this._voices += 1;
    node.onended = function () { self._voices -= 1; };
  };

  /**
   * One oscillator voice.
   * o: { f, f2, dur, type, vol, at (start offset), attack, filter: {type, freq, freq2, q}, vib }
   */
  AudioBus.prototype._tone = function (o) {
    const ctx = this.ctx;
    const t0 = ctx.currentTime + (o.at || 0);
    const dur = o.dur;
    const osc = ctx.createOscillator();
    osc.type = o.type || "sine";
    osc.frequency.setValueAtTime(Math.max(20, o.f), t0);
    if (o.f2) osc.frequency.exponentialRampToValueAtTime(Math.max(20, o.f2), t0 + dur);
    const g = ctx.createGain();
    const peak = o.vol == null ? 0.07 : o.vol;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t0 + (o.attack || 0.008));
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    let head = osc;
    if (o.filter) {
      const fl = ctx.createBiquadFilter();
      fl.type = o.filter.type || "lowpass";
      fl.frequency.setValueAtTime(o.filter.freq, t0);
      if (o.filter.freq2) fl.frequency.exponentialRampToValueAtTime(o.filter.freq2, t0 + dur);
      if (o.filter.q) fl.Q.value = o.filter.q;
      osc.connect(fl);
      head = fl;
    }
    if (o.vib) {
      const lfo = ctx.createOscillator();
      lfo.frequency.value = o.vib.rate || 6;
      const lg = ctx.createGain();
      lg.gain.value = o.vib.depth || 6;
      lfo.connect(lg);
      lg.connect(osc.frequency);
      lfo.start(t0);
      lfo.stop(t0 + dur + 0.05);
    }
    head.connect(g);
    g.connect(this._out);
    this._track(osc);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  };

  /**
   * Filtered noise burst.
   * o: { dur, vol, at, attack, filter: {type, freq, freq2, q}, rate }
   */
  AudioBus.prototype._hiss = function (o) {
    const ctx = this.ctx;
    const t0 = ctx.currentTime + (o.at || 0);
    const dur = o.dur;
    const src = ctx.createBufferSource();
    src.buffer = this._noise();
    src.loop = true;
    if (o.rate) src.playbackRate.value = o.rate;
    const fl = ctx.createBiquadFilter();
    fl.type = (o.filter && o.filter.type) || "lowpass";
    fl.frequency.setValueAtTime((o.filter && o.filter.freq) || 800, t0);
    if (o.filter && o.filter.freq2) {
      fl.frequency.exponentialRampToValueAtTime(o.filter.freq2, t0 + dur);
    }
    if (o.filter && o.filter.q) fl.Q.value = o.filter.q;
    const g = ctx.createGain();
    const peak = o.vol == null ? 0.05 : o.vol;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t0 + (o.attack || 0.006));
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(fl);
    fl.connect(g);
    g.connect(this._out);
    this._track(src);
    src.start(t0);
    src.stop(t0 + dur + 0.05);
  };

  AudioBus.prototype._ready = function (important) {
    if (!this.enabled) return false;
    if (!this.ensure()) return false;
    if (!important && this._voices > 30) return false;
    return true;
  };

  /* legacy simple voice, kept for compatibility */
  AudioBus.prototype.beep = function (freq, dur, type, vol, slide) {
    if (!this._ready(false)) return;
    this._tone({ f: freq, f2: slide, dur: dur, type: type || "square", vol: vol == null ? 0.08 : vol });
  };

  /* ---------------------------------------------------------------- */
  /* UI                                                                */
  /* ---------------------------------------------------------------- */
  AudioBus.prototype.click = function () {
    if (!this._ready(false)) return;
    this._tone({ f: 720, f2: 540, dur: 0.05, type: "sine", vol: 0.045 });
    this._hiss({ dur: 0.025, vol: 0.02, filter: { type: "highpass", freq: 3600 } });
  };

  /* hammer, hammer, chisel ring */
  AudioBus.prototype.build = function () {
    if (!this._ready(true)) return;
    this._hiss({ dur: 0.07, vol: 0.12, filter: { type: "lowpass", freq: 420, freq2: 140 } });
    this._tone({ f: 150, f2: 88, dur: 0.1, type: "triangle", vol: 0.09 });
    this._hiss({ at: 0.11, dur: 0.06, vol: 0.1, filter: { type: "lowpass", freq: 520, freq2: 180 } });
    this._tone({ at: 0.11, f: 180, f2: 100, dur: 0.09, type: "triangle", vol: 0.08 });
    this._tone({ at: 0.21, f: 1860, f2: 1600, dur: 0.09, type: "sine", vol: 0.022 });
  };

  /* coin purse jingle */
  AudioBus.prototype.sell = function () {
    if (!this._ready(true)) return;
    this._tone({ f: 1245, dur: 0.07, type: "sine", vol: 0.05 });
    this._tone({ at: 0.055, f: 1660, dur: 0.08, type: "sine", vol: 0.05 });
    this._tone({ at: 0.11, f: 2100, dur: 0.1, type: "sine", vol: 0.035 });
    this._hiss({ dur: 0.16, vol: 0.028, filter: { type: "bandpass", freq: 5600, q: 2.2 } });
  };

  /* per-race weapon voices, slight random detune per shot */
  AudioBus.prototype.shoot = function (race) {
    if (!this.enabled) return;
    const ctx = this.ensure();
    if (!ctx) return;
    if (ctx.currentTime - this._lastShot < 0.03) return; /* barrage throttle */
    if (this._voices > 26) return;
    this._lastShot = ctx.currentTime;
    const d = 0.94 + Math.random() * 0.12;
    if (race === "human") {
      /* bow release: string snap + arrow whistle */
      this._hiss({ dur: 0.045, vol: 0.045, filter: { type: "highpass", freq: 2400 } });
      this._tone({ f: 880 * d, f2: 1500 * d, dur: 0.055, type: "sine", vol: 0.028 });
    } else if (race === "orc") {
      /* war drum thump */
      this._tone({ f: 145 * d, f2: 62, dur: 0.12, type: "triangle", vol: 0.085 });
      this._hiss({ dur: 0.05, vol: 0.04, filter: { type: "lowpass", freq: 300 } });
    } else if (race === "nightelf") {
      /* moon chime */
      this._tone({ f: 1180 * d, f2: 1560 * d, dur: 0.08, type: "sine", vol: 0.03 });
      this._tone({ f: 1770 * d, dur: 0.06, type: "sine", vol: 0.014 });
    } else {
      /* undead: dark zap */
      this._tone({
        f: 260 * d, f2: 78, dur: 0.13, type: "sawtooth", vol: 0.04,
        filter: { type: "lowpass", freq: 1100, freq2: 320 },
      });
      this._hiss({ dur: 0.05, vol: 0.02, filter: { type: "bandpass", freq: 700, q: 3 } });
    }
  };

  /* ominous leak horn */
  AudioBus.prototype.leak = function () {
    if (!this._ready(true)) return;
    this._tone({
      f: 160, f2: 88, dur: 0.55, type: "sawtooth", vol: 0.07,
      attack: 0.02, filter: { type: "lowpass", freq: 900, freq2: 380 },
    });
    this._tone({
      f: 162, f2: 90, dur: 0.55, type: "sawtooth", vol: 0.055,
      attack: 0.02, filter: { type: "lowpass", freq: 800, freq2: 360 },
    });
    this._hiss({ dur: 0.4, vol: 0.05, filter: { type: "lowpass", freq: 160 }, rate: 0.55 });
  };

  /* two-note war horn for a new wave */
  AudioBus.prototype.wave = function () {
    if (!this._ready(true)) return;
    this._hiss({ dur: 0.1, vol: 0.03, filter: { type: "bandpass", freq: 1700, q: 1.6 } });
    this._tone({
      f: 196, dur: 0.2, type: "sawtooth", vol: 0.05, attack: 0.03,
      filter: { type: "lowpass", freq: 1250 },
    });
    this._tone({
      f: 196 * 0.995, dur: 0.2, type: "square", vol: 0.02, attack: 0.03,
      filter: { type: "lowpass", freq: 900 },
    });
    this._tone({
      at: 0.17, f: 262, dur: 0.5, type: "sawtooth", vol: 0.055, attack: 0.03,
      filter: { type: "lowpass", freq: 1400 }, vib: { rate: 5.4, depth: 3.4 },
    });
    this._tone({
      at: 0.17, f: 263.5, dur: 0.5, type: "sawtooth", vol: 0.035, attack: 0.03,
      filter: { type: "lowpass", freq: 1100 },
    });
    this._tone({ at: 0.17, f: 131, dur: 0.5, type: "triangle", vol: 0.04, attack: 0.04 });
  };

  /* victory fanfare: arpeggio into a held chord with shimmer */
  AudioBus.prototype.win = function () {
    if (!this._ready(true)) return;
    const notes = [523.25, 659.25, 783.99, 1046.5];
    for (let i = 0; i < notes.length; i++) {
      this._tone({ at: i * 0.13, f: notes[i], dur: 0.24, type: "triangle", vol: 0.07 });
      this._tone({ at: i * 0.13, f: notes[i] / 2, dur: 0.24, type: "square", vol: 0.018 });
    }
    const chord = [523.25, 659.25, 783.99, 1046.5];
    for (let i = 0; i < chord.length; i++) {
      this._tone({
        at: 0.55, f: chord[i], dur: 1.1, type: "triangle",
        vol: 0.045, attack: 0.05, vib: { rate: 5, depth: 2.4 },
      });
    }
    this._tone({ at: 0.55, f: 130.8, dur: 1.1, type: "sawtooth", vol: 0.03, attack: 0.05, filter: { type: "lowpass", freq: 700 } });
    this._hiss({ at: 0.55, dur: 0.9, vol: 0.02, filter: { type: "highpass", freq: 6200 } });
  };

  /* defeat dirge: falling minor line over a low drone */
  AudioBus.prototype.lose = function () {
    if (!this._ready(true)) return;
    this._tone({
      f: 55, dur: 1.9, type: "sawtooth", vol: 0.05, attack: 0.08,
      filter: { type: "lowpass", freq: 280 },
    });
    const line = [392, 311.1, 246.9, 196];
    for (let i = 0; i < line.length; i++) {
      this._tone({
        at: i * 0.28, f: line[i], f2: line[i] * 0.985, dur: 0.4, type: "sawtooth",
        vol: 0.06, attack: 0.04, filter: { type: "lowpass", freq: 760 },
      });
    }
    this._hiss({ at: 1.1, dur: 0.5, vol: 0.05, filter: { type: "lowpass", freq: 120 }, rate: 0.5 });
  };

  root.AudioBus = AudioBus;
})(typeof globalThis !== "undefined" ? globalThis : this);
