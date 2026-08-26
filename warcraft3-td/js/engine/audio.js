/*
 * Procedural WebAudio. Every sound is synthesised at runtime from oscillators
 * and shaped noise — there are no audio files anywhere in this project.
 */
(function (global) {
  'use strict';

  function Audio() {
    this.ctx = null;
    this.master = null;
    this.sfxGain = null;
    this.masterVolume = 0.6;
    this.sfxVolume = 0.8;
    this.enabled = true;
    this.noiseBuffer = null;
    this._budget = 0;
    this._budgetAt = 0;
  }

  Audio.prototype.unlock = function () {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }
    var Ctor = global.AudioContext || global.webkitAudioContext;
    if (!Ctor) { this.enabled = false; return; }
    this.ctx = new Ctor();
    this.master = this.ctx.createGain();
    this.master.gain.value = this.masterVolume;
    this.master.connect(this.ctx.destination);
    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.value = this.sfxVolume;
    this.sfxGain.connect(this.master);

    var len = Math.floor(this.ctx.sampleRate * 0.5);
    this.noiseBuffer = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    var data = this.noiseBuffer.getChannelData(0);
    for (var i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  };

  Audio.prototype.setMaster = function (v) {
    this.masterVolume = v;
    if (this.master) this.master.gain.value = v;
  };

  Audio.prototype.setSfx = function (v) {
    this.sfxVolume = v;
    if (this.sfxGain) this.sfxGain.gain.value = v;
  };

  Audio.prototype._afford = function () {
    // Cap concurrent voices so a big wave cannot turn into a wall of noise.
    var now = this.ctx.currentTime;
    if (now - this._budgetAt > 0.1) { this._budgetAt = now; this._budget = 0; }
    this._budget++;
    return this._budget <= 6;
  };

  Audio.prototype.tone = function (opts) {
    var ctx = this.ctx;
    var t0 = ctx.currentTime + (opts.delay || 0);
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.type = opts.type || 'sine';
    osc.frequency.setValueAtTime(opts.from, t0);
    if (opts.to && opts.to !== opts.from) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, opts.to), t0 + opts.dur);
    }
    var peak = (opts.gain === undefined ? 0.25 : opts.gain);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(peak, t0 + Math.min(0.02, opts.dur * 0.3));
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + opts.dur);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t0);
    osc.stop(t0 + opts.dur + 0.02);
  };

  Audio.prototype.noise = function (opts) {
    var ctx = this.ctx;
    var t0 = ctx.currentTime + (opts.delay || 0);
    var src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    var filter = ctx.createBiquadFilter();
    filter.type = opts.filter || 'bandpass';
    filter.frequency.setValueAtTime(opts.freq || 900, t0);
    if (opts.freqTo) filter.frequency.exponentialRampToValueAtTime(Math.max(30, opts.freqTo), t0 + opts.dur);
    filter.Q.value = opts.q || 1.2;
    var gain = ctx.createGain();
    gain.gain.setValueAtTime(opts.gain === undefined ? 0.22 : opts.gain, t0);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + opts.dur);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    src.start(t0);
    src.stop(t0 + opts.dur + 0.02);
  };

  Audio.prototype.play = function (name) {
    if (!this.enabled || !this.ctx || this.masterVolume <= 0) return;
    if (this.ctx.state === 'suspended') return;
    if (!this._afford()) return;

    switch (name) {
      case 'shoot_kingdom':
        this.tone({ type: 'triangle', from: 820, to: 330, dur: 0.1, gain: 0.1 });
        break;
      case 'shoot_warband':
        this.noise({ freq: 1400, freqTo: 400, dur: 0.09, gain: 0.09 });
        break;
      case 'shoot_grove':
        this.tone({ type: 'sine', from: 1250, to: 700, dur: 0.14, gain: 0.08 });
        break;
      case 'shoot_blight':
        this.tone({ type: 'sawtooth', from: 460, to: 200, dur: 0.12, gain: 0.07 });
        break;
      case 'die':
        this.noise({ freq: 700, freqTo: 160, dur: 0.18, gain: 0.14 });
        break;
      case 'bossdie':
        this.noise({ freq: 500, freqTo: 90, dur: 0.6, gain: 0.3 });
        this.tone({ type: 'sine', from: 160, to: 50, dur: 0.7, gain: 0.25 });
        break;
      case 'build':
        this.tone({ type: 'sine', from: 190, to: 70, dur: 0.24, gain: 0.28 });
        this.noise({ freq: 500, freqTo: 180, dur: 0.22, gain: 0.16 });
        break;
      case 'upgrade':
        [0, 0.07, 0.14].forEach(function (d, i) {
          this.tone({ type: 'triangle', from: 440 * Math.pow(1.26, i), dur: 0.16, gain: 0.16, delay: d });
        }, this);
        break;
      case 'sell':
        [0, 0.05, 0.1].forEach(function (d) {
          this.tone({ type: 'square', from: 1500, to: 1900, dur: 0.06, gain: 0.06, delay: d });
        }, this);
        break;
      case 'click':
        this.tone({ type: 'square', from: 900, to: 1200, dur: 0.04, gain: 0.05 });
        break;
      case 'levelup':
        [0, 0.09, 0.18, 0.27].forEach(function (d, i) {
          this.tone({ type: 'sine', from: 523 * Math.pow(1.2, i), dur: 0.22, gain: 0.15, delay: d });
        }, this);
        break;
      case 'nova':
        this.tone({ type: 'sine', from: 900, to: 120, dur: 0.4, gain: 0.22 });
        this.noise({ freq: 2200, freqTo: 300, dur: 0.35, gain: 0.16 });
        break;
      case 'leak':
        this.tone({ type: 'sawtooth', from: 260, to: 170, dur: 0.7, gain: 0.22 });
        this.tone({ type: 'sawtooth', from: 130, to: 86, dur: 0.8, gain: 0.18, delay: 0.05 });
        break;
      case 'wavehorn':
        this.tone({ type: 'sawtooth', from: 196, dur: 0.4, gain: 0.16 });
        this.tone({ type: 'sawtooth', from: 262, dur: 0.5, gain: 0.16, delay: 0.22 });
        break;
      case 'bosshorn':
        this.tone({ type: 'sawtooth', from: 110, dur: 0.9, gain: 0.24 });
        this.tone({ type: 'sawtooth', from: 147, dur: 1.0, gain: 0.2, delay: 0.35 });
        this.noise({ freq: 220, freqTo: 90, dur: 1.2, gain: 0.12 });
        break;
      case 'victory':
        [523, 659, 784, 1047].forEach(function (f, i) {
          this.tone({ type: 'triangle', from: f, dur: 0.5, gain: 0.2, delay: i * 0.16 });
        }, this);
        break;
      case 'defeat':
        [392, 349, 311, 233].forEach(function (f, i) {
          this.tone({ type: 'sawtooth', from: f, dur: 0.8, gain: 0.18, delay: i * 0.28 });
        }, this);
        break;
      default:
        break;
    }
  };

  global.WC3.Audio = new Audio();
})(typeof globalThis !== 'undefined' ? globalThis : this);
