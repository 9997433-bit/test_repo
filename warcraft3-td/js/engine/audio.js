/* Procedural WebAudio. No sample files, no Blizzard audio — everything here is
 * synthesised from oscillators and noise buffers. */
(function (root) {
  'use strict';
  const NS = (root.WC3TD = root.WC3TD || {});

  function Audio() {
    this.ctx = null;
    this.master = null;
    this.sfxGain = null;
    this.volume = 0.55;
    this.sfxVolume = 0.8;
    this.enabled = true;
    this.lastShot = 0;
    this.noise = null;
  }

  Audio.prototype.init = function () {
    if (this.ctx) return;
    const AC = root.AudioContext || root.webkitAudioContext;
    if (!AC) { this.enabled = false; return; }
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = this.volume;
    this.master.connect(this.ctx.destination);
    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.value = this.sfxVolume;
    this.sfxGain.connect(this.master);

    const len = this.ctx.sampleRate * 0.6;
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    this.noise = buf;
  };

  Audio.prototype.resume = function () {
    this.init();
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  };

  Audio.prototype.setVolume = function (v) {
    this.volume = v;
    if (this.master) this.master.gain.value = v;
  };
  Audio.prototype.setSfx = function (v) {
    this.sfxVolume = v;
    if (this.sfxGain) this.sfxGain.gain.value = v;
  };

  Audio.prototype.tone = function (o) {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    const t0 = this.ctx.currentTime + (o.delay || 0);
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = o.type || 'sine';
    osc.frequency.setValueAtTime(o.f0, t0);
    if (o.f1 !== undefined) osc.frequency.exponentialRampToValueAtTime(Math.max(20, o.f1), t0 + o.dur);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, o.gain || 0.2), t0 + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + o.dur);
    osc.connect(gain); gain.connect(o.direct ? this.master : this.sfxGain);
    osc.start(t0); osc.stop(t0 + o.dur + 0.02);
  };

  Audio.prototype.burst = function (o) {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx || !this.noise) return;
    const t0 = this.ctx.currentTime + (o.delay || 0);
    const src = this.ctx.createBufferSource();
    src.buffer = this.noise;
    const filter = this.ctx.createBiquadFilter();
    filter.type = o.filter || 'bandpass';
    filter.frequency.setValueAtTime(o.f0, t0);
    if (o.f1 !== undefined) filter.frequency.exponentialRampToValueAtTime(Math.max(30, o.f1), t0 + o.dur);
    filter.Q.value = o.q === undefined ? 1.2 : o.q;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(o.gain || 0.2, t0);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + o.dur);
    src.connect(filter); filter.connect(gain); gain.connect(this.sfxGain);
    src.start(t0); src.stop(t0 + o.dur + 0.02);
  };

  // ------------------------------------------------------------- game hooks
  const SHOT = {
    arrow: { type: 'triangle', f0: 900, f1: 420, dur: 0.09, gain: 0.06 },
    dart:  { type: 'triangle', f0: 1200, f1: 600, dur: 0.06, gain: 0.05 },
    spear: { type: 'square', f0: 300, f1: 150, dur: 0.1, gain: 0.05 },
    thorn: { type: 'triangle', f0: 700, f1: 300, dur: 0.09, gain: 0.05 },
    soul:  { type: 'sine', f0: 620, f1: 240, dur: 0.16, gain: 0.06 },
    orb:   { type: 'sine', f0: 520, f1: 900, dur: 0.14, gain: 0.06 },
    star:  { type: 'sine', f0: 1100, f1: 1500, dur: 0.12, gain: 0.05 },
    bolt:  { type: 'sawtooth', f0: 1400, f1: 300, dur: 0.12, gain: 0.05 },
    web:   { type: 'sawtooth', f0: 260, f1: 120, dur: 0.14, gain: 0.05 },
    holy:  { type: 'sine', f0: 880, f1: 1320, dur: 0.16, gain: 0.06 },
    frost: { type: 'sine', f0: 700, f1: 1000, dur: 0.14, gain: 0.05 },
    glaive:{ type: 'triangle', f0: 800, f1: 500, dur: 0.1, gain: 0.05 },
    slash: { type: 'sawtooth', f0: 500, f1: 200, dur: 0.08, gain: 0.05 }
  };

  Audio.prototype.shoot = function (def) {
    if (!this.enabled || !this.ctx) { this.init(); if (!this.ctx) return; }
    const now = this.ctx.currentTime;
    if (now - this.lastShot < 0.035) return; // cheap voice limiter
    this.lastShot = now;
    const kind = def && def.projectile ? def.projectile.kind : 'arrow';
    if (kind === 'ball' || kind === 'corpse' || kind === 'acid') {
      this.burst({ f0: 220, f1: 90, dur: 0.22, gain: 0.12, filter: 'lowpass', q: 0.7 });
      return;
    }
    this.tone(SHOT[kind] || SHOT.arrow);
  };

  Audio.prototype.build = function () {
    this.tone({ type: 'square', f0: 180, f1: 320, dur: 0.16, gain: 0.1 });
    this.burst({ f0: 900, f1: 300, dur: 0.2, gain: 0.09, delay: 0.03 });
  };
  Audio.prototype.upgrade = function () {
    this.tone({ type: 'sine', f0: 420, f1: 840, dur: 0.22, gain: 0.12 });
    this.tone({ type: 'sine', f0: 630, f1: 1260, dur: 0.22, gain: 0.08, delay: 0.06 });
  };
  Audio.prototype.sell = function () {
    this.tone({ type: 'triangle', f0: 1000, f1: 500, dur: 0.1, gain: 0.09 });
    this.tone({ type: 'triangle', f0: 700, f1: 350, dur: 0.12, gain: 0.07, delay: 0.07 });
  };
  Audio.prototype.click = function () { this.tone({ type: 'square', f0: 620, f1: 500, dur: 0.04, gain: 0.05 }); };
  Audio.prototype.deny = function () { this.tone({ type: 'square', f0: 200, f1: 120, dur: 0.16, gain: 0.09 }); };
  Audio.prototype.ability = function () {
    this.tone({ type: 'sine', f0: 300, f1: 900, dur: 0.3, gain: 0.1 });
  };
  Audio.prototype.wave = function () {
    this.tone({ type: 'sawtooth', f0: 160, f1: 240, dur: 0.55, gain: 0.1 });
    this.tone({ type: 'sawtooth', f0: 240, f1: 320, dur: 0.5, gain: 0.07, delay: 0.18 });
  };
  Audio.prototype.boss = function () {
    this.tone({ type: 'sawtooth', f0: 90, f1: 60, dur: 1.1, gain: 0.16 });
    this.burst({ f0: 200, f1: 60, dur: 1.0, gain: 0.1, filter: 'lowpass', q: 0.5 });
  };
  Audio.prototype.leak = function () {
    this.tone({ type: 'sawtooth', f0: 220, f1: 90, dur: 0.5, gain: 0.14 });
  };
  Audio.prototype.victory = function () {
    [523, 659, 784, 1047].forEach((f, i) => {
      this.tone({ type: 'triangle', f0: f, dur: 0.5, gain: 0.12, delay: i * 0.16 });
    });
  };
  Audio.prototype.defeat = function () {
    [330, 262, 220, 165].forEach((f, i) => {
      this.tone({ type: 'sawtooth', f0: f, f1: f * 0.94, dur: 0.7, gain: 0.12, delay: i * 0.28 });
    });
  };

  NS.Audio = Audio;
})(typeof globalThis !== 'undefined' ? globalThis : this);
