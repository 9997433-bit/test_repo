// 固定步长累加器：把真实流逝时间折算成整数个 tick。
// 掉帧、标签页挂起恢复后不会丢拍也不会雪崩（超长间隔被钳制）。
export function createTicker(stepMs = 200, maxCatchUpMs = 1000) {
  let acc = 0;
  let last = null;
  return {
    advance(nowMs) {
      if (last === null) {
        last = nowMs;
        return 0;
      }
      let dt = nowMs - last;
      last = nowMs;
      if (dt < 0) dt = 0;
      if (dt > maxCatchUpMs) dt = maxCatchUpMs;
      acc += dt;
      let ticks = 0;
      while (acc >= stepMs) {
        acc -= stepMs;
        ticks += 1;
      }
      return ticks;
    },
    reset() {
      acc = 0;
      last = null;
    },
  };
}

// rAF 驱动（不可用时退化为 setInterval），返回 stop()。
export function startLoop({ stepMs = 200, onTick, onFrame }) {
  const ticker = createTicker(stepMs);
  let stopped = false;
  let rafId = 0;
  let intervalId = 0;

  function frame(nowMs) {
    if (stopped) return;
    const ticks = ticker.advance(nowMs);
    for (let i = 0; i < ticks; i += 1) onTick(stepMs);
    if (ticks > 0 || onFrame) onFrame?.();
    rafId = window.requestAnimationFrame(frame);
  }

  if (typeof window !== "undefined" && typeof window.requestAnimationFrame === "function") {
    rafId = window.requestAnimationFrame(frame);
  } else {
    intervalId = setInterval(() => {
      const ticks = ticker.advance(Date.now());
      for (let i = 0; i < ticks; i += 1) onTick(stepMs);
      onFrame?.();
    }, stepMs);
  }

  return function stop() {
    stopped = true;
    if (rafId) window.cancelAnimationFrame(rafId);
    if (intervalId) clearInterval(intervalId);
  };
}
