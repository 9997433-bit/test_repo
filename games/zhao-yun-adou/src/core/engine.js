/** 固定步长：模拟按 1/60s 推进，保证同种子同输入下结果可复现。 */
export const FIXED_STEP = 1 / 60;
/** 单帧最大可信 dt：切后台/断点回来后不允许一次性补 10 秒。 */
export const MAX_FRAME_DT = 0.05;

export function clampDt(dt, max = MAX_FRAME_DT) {
  if (!Number.isFinite(dt) || dt < 0) return 0;
  return Math.min(max, dt);
}

/**
 * 把不稳定的帧间隔切成固定步长。
 * `advance(dt, fn)` 返回本次执行的步数；`fn` 返回 false 表示提前收敛（如分出胜负）。
 */
export function createStepper(opts = {}) {
  const step = opts.step ?? FIXED_STEP;
  const maxDt = opts.maxDt ?? MAX_FRAME_DT;
  const maxSteps = opts.maxSteps ?? 8;
  let acc = 0;

  return {
    get step() {
      return step;
    },
    get pending() {
      return acc;
    },
    reset() {
      acc = 0;
    },
    /** 回填未消化的时间余量：读档后续跑不会因为丢掉半步而错开一帧。 */
    setPending(value) {
      acc = Number.isFinite(value) && value > 0 ? Math.min(value, step) : 0;
      return acc;
    },
    advance(dt, fn) {
      const d = clampDt(dt, maxDt);
      if (d <= 0) return 0;
      acc += d;
      let n = 0;
      while (acc + 1e-9 >= step) {
        acc -= step;
        n += 1;
        if (fn(step) === false) {
          acc = 0;
          break;
        }
        if (n >= maxSteps) {
          acc = 0;
          break;
        }
      }
      return n;
    },
  };
}

/** requestAnimationFrame 主循环，dt 已 clamp，可暂停/恢复而不产生时间跳变。 */
export function createLoop(onFrame, opts = {}) {
  const raf =
    opts.raf ||
    (typeof requestAnimationFrame === "function" ? (cb) => requestAnimationFrame(cb) : null);
  const cancel =
    opts.cancelFrame ||
    (typeof cancelAnimationFrame === "function" ? (h) => cancelAnimationFrame(h) : () => {});
  const now =
    opts.now ||
    (() => (typeof performance !== "undefined" ? performance.now() : Date.now()));
  const maxDt = opts.maxDt ?? MAX_FRAME_DT;

  let handle = null;
  let last = 0;
  let running = false;

  function frame(t) {
    if (!running) return;
    const stamp = Number.isFinite(t) ? t : now();
    const dt = clampDt((stamp - last) / 1000, maxDt);
    last = stamp;
    onFrame(dt, stamp);
    if (running && raf) handle = raf(frame);
  }

  return {
    get running() {
      return running;
    },
    start() {
      if (running || !raf) return false;
      running = true;
      last = now();
      handle = raf(frame);
      return true;
    },
    stop() {
      running = false;
      if (handle != null) cancel(handle);
      handle = null;
    },
  };
}
