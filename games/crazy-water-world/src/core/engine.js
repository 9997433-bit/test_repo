import { tickWorld } from "../world/sim.js";
import { spawnFlotsam } from "../explore/salvage.js";
import { mulberry32 } from "./rng.js";
import { saveState } from "./store.js";
import { render } from "../ui/app.js";

export function boot(root, store) {
  const rng = mulberry32(store.get().meta.seed);
  let last = performance.now();
  let acc = 0;

  const loop = (now) => {
    const raw = Math.min(0.05, (now - last) / 1000);
    last = now;
    const s = store.get();
    if (s.meta.started) {
      acc += raw * s.meta.speed;
      while (acc >= 0.1) {
        acc -= 0.1;
        const next = tickWorld(store.get(), 0.1);
        next.explore = {
          ...next.explore,
          salvage: {
            flotsam: spawnFlotsam(next, rng),
          },
        };
        next.meta = { ...next.meta, tick: next.meta.tick + 1 };
        store.replace(next);
      }
    }
    render(root, store);
    requestAnimationFrame(loop);
  };

  render(root, store);
  requestAnimationFrame(loop);
  setInterval(() => {
    if (store.get().meta.started) saveState(store.get());
  }, 4000);
}
