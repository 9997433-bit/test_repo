export const DEFAULT_TICK_MS = 100;
/** 单帧最多补 20 个 tick，卡顿后不会滚雪球。 */
export const MAX_CATCHUP_TICKS = 20;
/** 帧间墙钟跳变超过 5 秒（切后台/休眠）就补一次离线结算。 */
export const RESUME_GAP_MS = 5000;
const MAX_FRAME_SEC = 0.25;

function defaultSchedule(fn) {
  if (typeof requestAnimationFrame === "function") return requestAnimationFrame(fn);
  return setTimeout(() => fn(performance.now()), 16);
}

function defaultCancel(handle) {
  if (typeof cancelAnimationFrame === "function") cancelAnimationFrame(handle);
  else clearTimeout(handle);
}

export function startEngine({
  store,
  render,
  tickMs = DEFAULT_TICK_MS,
  schedule = defaultSchedule,
  cancel = defaultCancel,
  clock = () => performance.now(),
  wall = () => Date.now(),
}) {
  const step = Math.max(0.01, tickMs / 1000);
  let last = clock();
  let lastWall = wall();
  let lastVersion = -1;
  let acc = 0;
  let handle = 0;
  let running = true;

  const loop = (frameTime) => {
    if (!running) return;
    const t = typeof frameTime === "number" ? frameTime : clock();
    acc += Math.min(MAX_FRAME_SEC, Math.max(0, (t - last) / 1000));
    last = t;

    const nowWall = wall();
    if (nowWall - lastWall > RESUME_GAP_MS) store.dispatch({ type: "RESUME", now: nowWall });
    lastWall = nowWall;

    let ticks = 0;
    while (acc >= step && ticks < MAX_CATCHUP_TICKS) {
      store.dispatch({ type: "TICK", now: wall(), dt: step });
      acc -= step;
      ticks += 1;
    }
    if (ticks >= MAX_CATCHUP_TICKS) acc = 0;

    // 状态没变就不重绘：rAF 60fps 不该拖着 UI 每帧全量比对。
    const version = store.version?.();
    if (version === undefined || version !== lastVersion) {
      lastVersion = version;
      render?.(store.get());
    }

    handle = schedule(loop);
  };

  handle = schedule(loop);
  return () => {
    if (!running) return;
    running = false;
    cancel(handle);
  };
}
