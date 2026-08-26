import { emit } from "./events";
import { flushSave, scheduleSave } from "./save";
import { WATER_CAP, WATER_REGEN_MS, type GameState } from "./state";
import { advanceClock } from "./time";
import { tickGarden } from "../systems/garden";
import { tickOrders } from "../systems/orders";
import { tickSpirits } from "../systems/spirits";

const MAX_STEP_MS = 100;
const SAVE_TICK_MS = 500;

export function startLoop(get: () => GameState, onFrame: () => void): () => void {
  let raf = 0;
  let last = performance.now();
  let accSave = 0;
  let stopped = false;

  const step = (t: number) => {
    if (stopped) return;
    const dt = Math.min(MAX_STEP_MS, Math.max(0, t - last));
    last = t;
    const state = get();
    state.now += dt;
    advanceClock(state, dt);
    state.waterAcc += dt;
    while (state.waterAcc >= WATER_REGEN_MS) {
      state.waterAcc -= WATER_REGEN_MS;
      if (state.water < WATER_CAP) state.water += 1;
    }
    tickGarden(state, dt);
    tickOrders(state);
    tickSpirits(state, dt);
    accSave += dt;
    if (accSave >= SAVE_TICK_MS) {
      accSave = 0;
      scheduleSave(state);
    }
    onFrame();
    raf = requestAnimationFrame(step);
  };

  raf = requestAnimationFrame(step);
  return () => {
    stopped = true;
    cancelAnimationFrame(raf);
    flushSave();
  };
}

export function notifyRare(text: string): void {
  emit({ type: "toast", text, tone: "rare" });
}
