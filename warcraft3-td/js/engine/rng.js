/*
 * Deterministic PRNG (mulberry32). Every simulation-affecting random draw in
 * the game goes through one of these so a seed fully reproduces a run.
 */
(function (global) {
  'use strict';

  function RNG(seed) {
    this.seed(seed);
  }

  RNG.prototype.seed = function (seed) {
    var s = (seed === undefined || seed === null) ? 1 : seed;
    // Force to uint32 and avoid the degenerate all-zero state.
    this.state = (s >>> 0) || 0x9e3779b9;
    this.calls = 0;
    return this;
  };

  RNG.prototype.next = function () {
    this.calls++;
    this.state = (this.state + 0x6d2b79f5) >>> 0;
    var t = this.state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  RNG.prototype.range = function (min, max) {
    return min + (max - min) * this.next();
  };

  RNG.prototype.int = function (min, max) {
    return Math.floor(this.range(min, max + 1));
  };

  RNG.prototype.pick = function (arr) {
    if (!arr || arr.length === 0) return undefined;
    return arr[Math.floor(this.next() * arr.length) % arr.length];
  };

  RNG.prototype.chance = function (p) {
    return this.next() < p;
  };

  RNG.prototype.angle = function () {
    return this.next() * Math.PI * 2;
  };

  /** Snapshot / restore so tests can fork a run mid-flight. */
  RNG.prototype.save = function () {
    return { state: this.state, calls: this.calls };
  };

  RNG.prototype.load = function (snap) {
    this.state = snap.state >>> 0;
    this.calls = snap.calls | 0;
    return this;
  };

  RNG.prototype.clone = function () {
    return new RNG(0).load(this.save());
  };

  /** Stable string -> uint32 hash, handy for named sub-streams. */
  RNG.hashString = function (str) {
    var h = 2166136261 >>> 0;
    for (var i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619) >>> 0;
    }
    return h >>> 0;
  };

  global.WC3 = global.WC3 || {};
  global.WC3.RNG = RNG;

  if (typeof module === 'object' && module.exports) module.exports = RNG;
})(typeof globalThis !== 'undefined' ? globalThis : this);
