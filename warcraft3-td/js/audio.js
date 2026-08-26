(function (root) {
  "use strict";
  function AudioBus() {
    this.ctx = null;
    this.master = 0.55;
    this.enabled = true;
  }
  AudioBus.prototype.ensure = function () {
    if (!this.ctx && typeof AudioContext !== "undefined") {
      this.ctx = new AudioContext();
    }
    if (this.ctx && this.ctx.state === "suspended") this.ctx.resume();
    return this.ctx;
  };
  AudioBus.prototype.beep = function (freq, dur, type, vol, slide) {
    if (!this.enabled) return;
    const ctx = this.ensure();
    if (!ctx) return;
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type || "square";
    o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, slide), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime((vol == null ? 0.08 : vol) * this.master, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g);
    g.connect(ctx.destination);
    o.start(t);
    o.stop(t + dur + 0.02);
  };
  AudioBus.prototype.click = function () { this.beep(520, 0.06, "triangle", 0.05); };
  AudioBus.prototype.build = function () { this.beep(180, 0.16, "sawtooth", 0.07, 90); };
  AudioBus.prototype.sell = function () { this.beep(240, 0.12, "triangle", 0.06, 140); };
  AudioBus.prototype.shoot = function (race) {
    const f = race === "human" ? 660 : race === "orc" ? 220 : race === "nightelf" ? 880 : 140;
    this.beep(f, 0.05, "square", 0.035);
  };
  AudioBus.prototype.leak = function () { this.beep(140, 0.45, "sawtooth", 0.1, 60); };
  AudioBus.prototype.wave = function () { this.beep(300, 0.28, "triangle", 0.08, 180); };
  AudioBus.prototype.win = function () {
    const self = this;
    [523, 659, 784, 1046].forEach(function (f, i) {
      setTimeout(function () { self.beep(f, 0.22, "triangle", 0.08); }, i * 140);
    });
  };
  AudioBus.prototype.lose = function () {
    const self = this;
    [392, 311, 246].forEach(function (f, i) {
      setTimeout(function () { self.beep(f, 0.35, "sawtooth", 0.08); }, i * 200);
    });
  };
  root.AudioBus = AudioBus;
})(typeof globalThis !== "undefined" ? globalThis : this);
