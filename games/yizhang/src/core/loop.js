// 固定步长主循环。模拟永远走 1/60，渲染按帧插值。
// 后台标签页（document.hidden）立即挂起，回前台时丢弃堆积时间而不是快进补帧。
// 命中定格（hold）只掐掉这几十毫秒里的 step，draw 照旧按同一个 alpha 出画：
// 画面定住而不是跳帧，堆积时间也不补，解冻后不会暴走。

import { createHitStop } from "./juice.js";

const DEFAULT_DT = 1 / 60;

export function createLoop(opts) {
  const dt = opts.dt || DEFAULT_DT;
  const step = opts.step;
  const draw = opts.draw;
  const onPauseChange = opts.onPauseChange || null;
  // 单帧最多补 5 步，卡顿后不追债，避免「解冻式」暴走。
  const maxSubSteps = opts.maxSubSteps || 5;
  const maxFrame = dt * maxSubSteps;

  let raf = 0;
  let running = false;
  let userPaused = false;
  let hidden = typeof document !== "undefined" ? document.hidden : false;
  let acc = 0;
  let last = 0;
  let simTime = 0;
  let frames = 0;

  const stats = { fps: 0, dropped: 0, steps: 0, alpha: 0 };
  let fpsWindowStart = 0;
  let fpsWindowFrames = 0;
  const hitStop = createHitStop(opts.hitStop || {});

  function paused() {
    return userPaused || hidden;
  }

  function frame(now) {
    raf = requestAnimationFrame(frame);
    if (!running) return;

    const seconds = now / 1000;
    let delta = seconds - last;
    last = seconds;
    if (!Number.isFinite(delta) || delta < 0) delta = 0;

    frames += 1;
    fpsWindowFrames += 1;
    if (seconds - fpsWindowStart >= 0.5) {
      stats.fps = fpsWindowFrames / (seconds - fpsWindowStart);
      fpsWindowStart = seconds;
      fpsWindowFrames = 0;
    }

    if (paused()) {
      acc = 0;
      draw(0, { paused: true, simTime, stats });
      return;
    }

    if (hitStop.held(seconds)) {
      // 定格期间不 step、不攒时间；alpha 保持上一帧，画面完全定住。
      acc = 0;
      draw(stats.alpha, { paused: false, held: true, simTime, stats, stepped: 0 });
      return;
    }

    if (delta > maxFrame) {
      stats.dropped += Math.round((delta - maxFrame) / dt);
      delta = maxFrame;
    }
    acc += delta;

    let n = 0;
    while (acc >= dt && n < maxSubSteps) {
      step(dt, simTime);
      simTime += dt;
      acc -= dt;
      n += 1;
      // step 里刚打出命中定格：这一帧剩下的补步立刻停手，定格从当前帧就生效。
      if (hitStop.held(performance.now() / 1000)) {
        acc = 0;
        break;
      }
    }
    stats.steps += n;
    stats.alpha = acc / dt;
    draw(stats.alpha, { paused: false, simTime, stats, stepped: n });
  }

  function onVisibility() {
    const next = document.hidden;
    if (next === hidden) return;
    hidden = next;
    if (!hidden) {
      // 回前台：把时间基准拉到当前帧，堆积的隐藏时长直接丢掉。
      last = performance.now() / 1000;
      acc = 0;
      hitStop.reset();
      fpsWindowStart = last;
      fpsWindowFrames = 0;
    }
    if (onPauseChange) onPauseChange(paused(), hidden ? "hidden" : "visible");
  }

  return {
    start() {
      if (running) return;
      running = true;
      last = performance.now() / 1000;
      fpsWindowStart = last;
      fpsWindowFrames = 0;
      acc = 0;
      hitStop.reset();
      document.addEventListener("visibilitychange", onVisibility);
      window.addEventListener("blur", onBlur);
      raf = requestAnimationFrame(frame);
    },
    stop() {
      running = false;
      cancelAnimationFrame(raf);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", onBlur);
    },
    setPaused(next) {
      if (userPaused === next) return;
      userPaused = next;
      hitStop.reset();
      if (!userPaused) {
        last = performance.now() / 1000;
        acc = 0;
      }
      if (onPauseChange) onPauseChange(paused(), "user");
    },
    /**
     * 请求一次命中定格。冷却内的重复请求被吞掉（连段不会剁成幻灯片）。
     * @returns {boolean} 是否真的定格
     */
    hold(seconds, now) {
      if (paused()) return false;
      const at = Number.isFinite(now) ? now : performance.now() / 1000;
      return hitStop.request(seconds, at);
    },
    isHeld(now) {
      return hitStop.held(Number.isFinite(now) ? now : performance.now() / 1000);
    },
    isPaused: paused,
    isHidden: () => hidden,
    get stats() {
      return stats;
    },
    get frames() {
      return frames;
    },
    get simTime() {
      return simTime;
    },
  };

  function onBlur() {
    // 焦点丢失时松开所有按键的职责在 input 层，这里只重置时间基准。
    last = performance.now() / 1000;
    acc = 0;
  }
}
