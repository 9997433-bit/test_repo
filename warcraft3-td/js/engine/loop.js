/* Fixed-step accumulator loop with a render callback. */
(function (root) {
  'use strict';
  const NS = (root.WC3TD = root.WC3TD || {});

  function Loop(step, onUpdate, onRender) {
    this.step = step;
    this.onUpdate = onUpdate;
    this.onRender = onRender;
    this.acc = 0;
    this.last = 0;
    this.running = false;
    this.fps = 60;
    this.frames = 0;
    this.fpsTimer = 0;
    this.maxSkip = NS.Config.maxFrameSkip;
  }

  Loop.prototype.start = function () {
    if (this.running) return;
    this.running = true;
    this.last = root.performance.now();
    const self = this;
    function frame(now) {
      if (!self.running) return;
      let dt = (now - self.last) / 1000;
      self.last = now;
      if (dt > 0.25) dt = 0.25;

      self.frames++;
      self.fpsTimer += dt;
      if (self.fpsTimer >= 0.5) {
        self.fps = Math.round(self.frames / self.fpsTimer);
        self.frames = 0; self.fpsTimer = 0;
      }

      self.acc += dt;
      let steps = 0;
      while (self.acc >= self.step && steps < self.maxSkip * 8) {
        self.onUpdate(self.step);
        self.acc -= self.step;
        steps++;
      }
      if (steps >= self.maxSkip * 8) self.acc = 0;
      self.onRender(dt, self.acc / self.step);
      root.requestAnimationFrame(frame);
    }
    root.requestAnimationFrame(frame);
  };

  Loop.prototype.stop = function () { this.running = false; };

  NS.Loop = Loop;
})(typeof globalThis !== 'undefined' ? globalThis : this);
