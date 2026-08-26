import { emit } from "./events";
import { flushSave, scheduleSave } from "./save";
import { WATER_CAP, WATER_REGEN_MS, type GameState } from "./state";
import { advanceClock } from "./time";
import { tickGarden } from "../systems/garden";
import { tickOrders } from "../systems/orders";
import { tickSpirits } from "../systems/spirits";

let raf = 0;
let last = 0;

export function startLoop(get: () => GameState, onFrame: () => void): () => void {
  last = performance.now();
  const step = (t: number) => {
    const dt = Math.min(100, t - last);
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
    // 墙钟锚点逐帧更新：后台节流 / 休眠导致的落后由离线补算收拢
    state.lastSeenAt = Date.now();
    scheduleSave(state);
    onFrame();
    raf = requestAnimationFrame(step);
  };
  raf = requestAnimationFrame(step);
  return () => {
    cancelAnimationFrame(raf);
    flushSave();
  };
}

export function notifyRare(text: string): void {
  emit({ type: "toast", text, tone: "rare" });
}
