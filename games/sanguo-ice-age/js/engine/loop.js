/**
 * Fixed-timestep game loop with variable render frames and speed control.
 * Speed 0 pauses simulation ticks; render frames keep running (snow, glow).
 */
export function createLoop({ tickMs, onTick, onFrame, maxCatchUpTicks = 40 }) {
  let speed = 1;
  let running = false;
  let acc = 0;
  let last = 0;
  let raf = 0;

  function frame(now) {
    if (!running) return;
    const dtMs = Math.min(now - last, 500);
    last = now;
    if (speed > 0) {
      acc += dtMs * speed;
      let ticks = 0;
      while (acc >= tickMs && ticks < maxCatchUpTicks) {
        acc -= tickMs;
        onTick();
        ticks++;
      }
      if (acc >= tickMs) acc = 0; // drop backlog instead of spiraling
    }
    onFrame(dtMs / 1000, now / 1000);
    raf = requestAnimationFrame(frame);
  }

  return {
    start() {
      if (running) return;
      running = true;
      last = performance.now();
      acc = 0;
      raf = requestAnimationFrame(frame);
    },
    stop() {
      running = false;
      cancelAnimationFrame(raf);
    },
    setSpeed(s) {
      speed = s;
    },
    getSpeed() {
      return speed;
    },
    isRunning() {
      return running;
    },
  };
}
