/**
 * 主循环：固定步长累加器。
 * - 逻辑按 tickMs 定步推进，与帧率无关，倍速只是把时间流速放大。
 * - 单帧真实耗时上限 maxFrameMs + 单帧最多补 maxTicksPerFrame 个 tick，
 *   所以切走标签页很久再回来，不会一次性爆一大串 tick。
 * - 无 DOM 依赖：没有 requestAnimationFrame 时自动退回 setTimeout（Node 也能跑）。
 */
import { TICK_MS, LOOP, clamp } from "../config.js";

function defaultNow() {
  const p = globalThis.performance;
  return typeof p?.now === "function" ? () => p.now() : () => Date.now();
}

function defaultScheduler(frameMs) {
  const raf = globalThis.requestAnimationFrame;
  const caf = globalThis.cancelAnimationFrame;
  if (typeof raf === "function") {
    return {
      schedule: (fn) => raf(fn),
      cancel: (id) => (typeof caf === "function" ? caf(id) : undefined),
    };
  }
  return {
    schedule: (fn) => setTimeout(fn, frameMs),
    cancel: (id) => clearTimeout(id),
  };
}

/**
 * @param {object} opts
 * @param {number} [opts.tickMs] 逻辑步长，默认 config.TICK_MS
 * @param {(ctx:{tick:number,tickMs:number,dtSec:number,speed:number})=>void} [opts.onTick]
 * @param {(ctx:{dtMs:number,dtSec:number,alpha:number,tick:number,speed:number,running:boolean})=>void} [opts.onFrame]
 * @param {number} [opts.speed] 初始倍速，0 = 暂停
 * @param {(err:Error, phase:"tick"|"frame")=>void} [opts.onError]
 * @param {() => number} [opts.now] 注入时间源（测试用）
 * @param {(fn:Function)=>any} [opts.schedule] 注入调度器（测试用）
 * @param {(id:any)=>void} [opts.cancel]
 * @returns {{start():void, stop():void, setSpeed(mult:number):number, getSpeed():number,
 *            isRunning():boolean, getTick():number, step(n?:number):void, reset():void}}
 */
export function createLoop({
  tickMs = TICK_MS,
  onTick,
  onFrame,
  speed = 1,
  maxTicksPerFrame = LOOP.maxTicksPerFrame,
  maxFrameMs = LOOP.maxFrameMs,
  frameMs = LOOP.fallbackFrameMs,
  onError,
  now,
  schedule,
  cancel,
} = {}) {
  const stepMs = Number(tickMs) > 0 ? Number(tickMs) : TICK_MS;
  const clock = typeof now === "function" ? now : defaultNow();
  const fallback = defaultScheduler(frameMs);
  const scheduleFrame = typeof schedule === "function" ? schedule : fallback.schedule;
  const cancelFrame = typeof cancel === "function" ? cancel : fallback.cancel;

  let running = false;
  let handle = null;
  let acc = 0; // 累积的“游戏时间”，单位 ms
  let lastTime = 0;
  let tick = 0;
  let mult = 1;

  /** 非法输入保持当前倍速；0 视为暂停，上限 LOOP.maxSpeed。 */
  function normalizeSpeed(v) {
    const n = Number(v);
    if (!Number.isFinite(n) || n < 0) return mult;
    return clamp(n, 0, LOOP.maxSpeed);
  }
  mult = normalizeSpeed(speed);

  function report(err, phase) {
    if (typeof onError === "function") onError(err, phase);
    else console.error(`[loop] ${phase} 回调抛错：`, err);
  }

  function frame() {
    handle = null;
    if (!running) return;

    const t = clock();
    let dtMs = t - lastTime;
    lastTime = t;
    if (!Number.isFinite(dtMs) || dtMs < 0) dtMs = 0;
    // 后台标签页 / 断点调试造成的超长间隔直接截断，不做补偿
    if (dtMs > maxFrameMs) dtMs = maxFrameMs;

    acc += dtMs * mult;

    let n = 0;
    while (acc >= stepMs && n < maxTicksPerFrame) {
      acc -= stepMs;
      n += 1;
      tick += 1;
      try {
        onTick?.({ tick, tickMs: stepMs, dtSec: stepMs / 1000, speed: mult });
      } catch (err) {
        report(err, "tick");
      }
      if (!running) break; // 回调里 stop() 时立即退出
    }
    // 触顶说明积压过多（比如刚从后台回来），丢弃余量避免持续追赶
    if (n >= maxTicksPerFrame && acc > stepMs) acc %= stepMs;

    try {
      onFrame?.({
        dtMs,
        dtSec: dtMs / 1000,
        alpha: clamp(acc / stepMs, 0, 1),
        tick,
        speed: mult,
        running,
      });
    } catch (err) {
      report(err, "frame");
    }

    if (running) handle = scheduleFrame(frame);
  }

  return {
    start() {
      if (running) return;
      running = true;
      lastTime = clock();
      acc = 0; // 重新开跑不补上次停机期间的时间
      handle = scheduleFrame(frame);
    },

    stop() {
      if (!running) return;
      running = false;
      if (handle !== null) {
        cancelFrame(handle);
        handle = null;
      }
    },

    /** 设置倍速：0 = 暂停（仍渲染），常用 1 / 2 / 4。返回实际生效值。 */
    setSpeed(v) {
      mult = normalizeSpeed(v);
      return mult;
    },
    getSpeed() {
      return mult;
    },
    isRunning() {
      return running;
    },
    getTick() {
      return tick;
    },

    /** 手动推进 n 个 tick（教程跳过 / 测试用），不依赖计时器。 */
    step(n = 1) {
      const count = Math.max(0, Math.floor(Number(n) || 0));
      for (let i = 0; i < count; i++) {
        tick += 1;
        try {
          onTick?.({ tick, tickMs: stepMs, dtSec: stepMs / 1000, speed: mult });
        } catch (err) {
          report(err, "tick");
        }
      }
    },

    /** 归零计数与累加器（读档后调用）。 */
    reset() {
      acc = 0;
      tick = 0;
      lastTime = clock();
    },
  };
}
