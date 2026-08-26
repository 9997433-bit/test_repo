// 开局 2 秒 fps 探针 → 定画质档。只测一次，之后交给玩家在暂停里手动改。
// 前 0.4s 丢弃：着色器编译和首帧上传会把平均值拉垮。

const WARMUP = 0.4;
const DEFAULT_WINDOW = 2.0;

export function tierFromFps(fps, dpr) {
  if (fps >= 52) return dpr > 1.5 ? "high" : "high";
  if (fps >= 34) return "mid";
  return "low";
}

/**
 * @param {(tier:string, info:object)=>void} onDecide
 * @returns {{ cancel():void, feed(nowSeconds:number):void, done:boolean }}
 */
export function createQualityProbe(onDecide, opts = {}) {
  const windowSeconds = opts.windowSeconds || DEFAULT_WINDOW;
  const dpr = opts.dpr || (typeof devicePixelRatio === "number" ? devicePixelRatio : 1);
  let start = -1;
  let counted = 0;
  let countedFrom = 0;
  let done = false;
  let cancelled = false;

  return {
    get done() {
      return done;
    },
    cancel() {
      cancelled = true;
    },
    feed(now) {
      if (done || cancelled) return;
      if (start < 0) {
        start = now;
        return;
      }
      const elapsed = now - start;
      if (elapsed < WARMUP) return;
      if (counted === 0) countedFrom = now;
      counted += 1;
      if (elapsed < windowSeconds) return;

      const span = Math.max(now - countedFrom, 1e-3);
      const fps = counted / span;
      const tier = tierFromFps(fps, dpr);
      done = true;
      onDecide(tier, { fps, frames: counted, seconds: span, dpr });
    },
  };
}
