import { tickWorld, settleOffline } from "../world/sim.js";
import { spawnFlotsam } from "../explore/salvage.js";
import { deriveRng } from "./rng.js";
import { saveState } from "./store.js";

export const QUANTUM = 0.1;
export const MAX_FRAME_DT = 0.05;
export const AUTOSAVE_MS = 4000;

// 一个模拟量子：先结算离线欠账，再推进 0.1s，最后用派生流刷漂浮物。
// 纯函数——同一个 state 进来永远得到同一个 state 出去，测试可以驱动与线上一致的时间轴。
export function stepSim(state) {
  const settled = settleOffline(state, state.campaign.idleSince);
  const ticked = tickWorld(settled, QUANTUM);
  const rng = deriveRng(ticked.meta.seed, ticked.meta.tick, "salvage");
  return {
    ...ticked,
    explore: {
      ...ticked.explore,
      salvage: { flotsam: spawnFlotsam(ticked, rng) },
    },
    campaign: { ...ticked.campaign, idleSince: 0 },
    meta: { ...ticked.meta, tick: ticked.meta.tick + 1 },
  };
}

// options.render 由壳层注入（main.js）。没注入时退化为延迟加载 ui 层，
// 只是为了不让旧壳层黑屏；core 不再静态依赖 ui。
export function boot(root, store, options = {}) {
  const opts = typeof options === "function" ? { render: options } : options || {};
  let render = typeof opts.render === "function" ? opts.render : null;
  if (!render) {
    import("../ui/app.js")
      .then((mod) => {
        render = mod.render;
        render(root, store);
      })
      .catch(() => {});
  }

  const paint = () => {
    if (render) render(root, store);
  };

  let last = performance.now();
  let acc = 0;

  const loop = (now) => {
    const raw = Math.min(MAX_FRAME_DT, (now - last) / 1000);
    last = now;
    const s = store.get();
    if (s.meta.started) {
      acc += raw * s.meta.speed;
      while (acc >= QUANTUM) {
        acc -= QUANTUM;
        store.replace(stepSim(store.get()));
      }
    }
    paint();
    requestAnimationFrame(loop);
  };

  paint();
  requestAnimationFrame(loop);

  const flush = () => {
    if (store.get().meta.started) saveState(store.get());
  };
  setInterval(flush, AUTOSAVE_MS);
  if (typeof window !== "undefined") window.addEventListener("beforeunload", flush);
}
