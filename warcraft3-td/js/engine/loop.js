/*
 * Fixed-timestep game loop with render interpolation.
 *
 * Invariants that keep the game from ever soft-locking:
 *  - a single frame can never advance more than MAX_STEPS_PER_FRAME ticks
 *  - raw frame deltas are clamped to MAX_FRAME_MS before entering the
 *    accumulator, so an alt-tabbed tab does not queue up minutes of catch-up
 *  - leftover accumulator time is dropped once the step cap is hit
 */
(function (global) {
  'use strict';

  var Config = (global.WC3 && global.WC3.Config) || {};

  function now() {
    if (typeof performance !== 'undefined' && performance.now) return performance.now();
    return Date.now();
  }

  function Loop(opts) {
    opts = opts || {};
    this.tickRate = opts.tickRate || Config.TICK_RATE || 60;
    this.dt = 1 / this.tickRate;
    this.maxSteps = opts.maxSteps || Config.MAX_STEPS_PER_FRAME || 5;
    this.maxFrameMs = opts.maxFrameMs || Config.MAX_FRAME_MS || 250;
    this.update = opts.update || function () {};
    this.render = opts.render || function () {};
    this.onStats = opts.onStats || null;

    this.speed = 1;
    this.paused = false;
    this.running = false;
    this.accumulator = 0;
    this.ticks = 0;
    this.frames = 0;
    this.lastTime = 0;
    this.droppedTicks = 0;

    this.fps = 0;
    this.tps = 0;
    // Peak frame time over the last reporting window. Averaged fps hides the
    // single 90ms hitch that a player actually notices.
    this.worstFrameMs = 0;
    this._worstFrame = 0;
    this._fpsFrames = 0;
    this._fpsTicks = 0;
    this._fpsTimer = 0;
    this._raf = 0;

    var self = this;
    this._frame = function (ts) { self.frame(ts); };
  }

  Loop.prototype.start = function () {
    if (this.running) return this;
    this.running = true;
    this.lastTime = now();
    this.accumulator = 0;
    this._schedule();
    return this;
  };

  Loop.prototype.stop = function () {
    this.running = false;
    if (this._raf && typeof cancelAnimationFrame === 'function') {
      cancelAnimationFrame(this._raf);
    }
    this._raf = 0;
    return this;
  };

  Loop.prototype.setPaused = function (p) {
    this.paused = !!p;
    return this;
  };

  Loop.prototype.togglePause = function () {
    this.paused = !this.paused;
    return this.paused;
  };

  Loop.prototype.setSpeed = function (s) {
    this.speed = Math.max(0.25, Math.min(4, s));
    return this;
  };

  Loop.prototype._schedule = function () {
    if (!this.running) return;
    if (typeof requestAnimationFrame === 'function') {
      this._raf = requestAnimationFrame(this._frame);
    } else {
      var self = this;
      this._raf = setTimeout(function () { self.frame(now()); }, 16);
    }
  };

  Loop.prototype.frame = function (ts) {
    if (!this.running) return;
    var t = (typeof ts === 'number') ? ts : now();
    var elapsed = t - this.lastTime;
    this.lastTime = t;
    if (!(elapsed >= 0)) elapsed = 0;
    if (elapsed > this.maxFrameMs) elapsed = this.maxFrameMs;

    var scale = this.paused ? 0 : this.speed;
    this.accumulator += (elapsed / 1000) * scale;

    var steps = 0;
    while (this.accumulator >= this.dt && steps < this.maxSteps) {
      this.update(this.dt);
      this.accumulator -= this.dt;
      this.ticks++;
      this._fpsTicks++;
      steps++;
    }
    if (this.accumulator >= this.dt) {
      // Simulation cannot keep up: shed the backlog instead of stalling.
      this.droppedTicks += Math.floor(this.accumulator / this.dt);
      this.accumulator = 0;
    }

    var alpha = this.paused ? 1 : (this.accumulator / this.dt);
    this.render(alpha, elapsed / 1000);
    this.frames++;
    this._fpsFrames++;

    this._fpsTimer += elapsed;
    if (elapsed > this._worstFrame) this._worstFrame = elapsed;
    if (this._fpsTimer >= 500) {
      this.fps = (this._fpsFrames * 1000) / this._fpsTimer;
      this.tps = (this._fpsTicks * 1000) / this._fpsTimer;
      this.worstFrameMs = this._worstFrame;
      this._worstFrame = 0;
      this._fpsFrames = 0;
      this._fpsTicks = 0;
      this._fpsTimer = 0;
      if (this.onStats) this.onStats(this);
    }

    this._schedule();
  };

  /** Headless helper used by tests: run exactly n fixed ticks. */
  Loop.prototype.runTicks = function (n) {
    for (var i = 0; i < n; i++) {
      this.update(this.dt);
      this.ticks++;
    }
    return this;
  };

  global.WC3 = global.WC3 || {};
  global.WC3.Loop = Loop;

  if (typeof module === 'object' && module.exports) module.exports = Loop;
})(typeof globalThis !== 'undefined' ? globalThis : this);
