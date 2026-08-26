import { tickWorld, settleOffline } from "../world/sim.js";
import { spawnFlotsam, syncExploreWeather } from "../explore/index.js";
import { tickInjuries } from "../heroes/index.js";
import { deriveRng } from "./rng.js";
import { saveState } from "./store.js";

export const QUANTUM = 0.1;
export const MAX_FRAME_DT = 0.05;
export const AUTOSAVE_MS = 4000;

// 一个模拟量子：先结算离线欠账，再推进 0.1s，接着用派生流刷漂浮物，
// 最后跑两条巡检（伤病销假 / 天气强制收杆上浮），tick 才 +1。
// 纯函数——同一个 state 进来永远得到同一个 state 出去，测试可以驱动与线上一致的时间轴。
//
// 巡检必须排在 tickWorld 之后：这一量子刚翻脸的天气已经由 tickWorld 盖进 world.mods，
// 探索侧读到的就是新天气。两条巡检都不消费随机数，拾荒流（盐 "salvage"）因此与接线前
// 逐位一致；日后若要在巡检里掷骰，必须另派独立盐，不许蹭拾荒的游标。
// 没人到期、没竿子也没人在水下时两条巡检都返回原引用，挂满每个量子的成本是零。
export function stepSim(state) {
  const settled = settleOffline(state, state.campaign.idleSince);
  // world.mods 的盖章在 tickWorld 里（世界层落自己的派生快照），量子出口必然带上一份新的；
  // defaultState 不再预算，core/store.js 也就不用反向 import world/**（契约 §10-N6）。
  const ticked = tickWorld(settled, QUANTUM);
  const rng = deriveRng(ticked.meta.seed, ticked.meta.tick, "salvage");
  const spawned = {
    ...ticked,
    explore: {
      ...ticked.explore,
      // 只换 flotsam：picked / rarePicked / lastPick 是累计量，不能被每量子的刷新抹掉。
      salvage: { ...ticked.explore.salvage, flotsam: spawnFlotsam(ticked, rng) },
    },
  };
  const patrolled = syncExploreWeather(tickInjuries(spawned));
  return {
    ...patrolled,
    campaign: { ...patrolled.campaign, idleSince: 0 },
    meta: { ...patrolled.meta, tick: patrolled.meta.tick + 1 },
  };
}

// options.render 由壳层注入（main.js: boot(root, store, { render })）。
// core 对 ui 零依赖——静态和动态 import 都不许有，不然打包器会把整个 ui 拖进 core 的图里。
// 没给 render 就只跑模拟不画画面（headless 驱动/测试用）。
export function boot(root, store, options = {}) {
  const opts = typeof options === "function" ? { render: options } : options || {};
  const render = typeof opts.render === "function" ? opts.render : null;

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
