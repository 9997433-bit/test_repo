/** 主 tick：把所有系统串起来。返回本 tick 的事件列表。 */
import { TICKS_PER_DAY, ARMY } from "../config.js";
import { tickClimate } from "./climate.js";
import { tickEconomy } from "./economy.js";
import { tickPopulation } from "./population.js";
import { checkQuests } from "./quests.js";
import { envoyGift } from "./envoy.js";

export function tickGame(state) {
  const events = [];
  if (state.gameOver) return events;

  state.tick += 1;
  const newDay = Math.floor(state.tick / TICKS_PER_DAY) + 1;
  const dayChanged = newDay !== state.day;
  state.day = newDay;

  if (dayChanged) {
    state.marches = Math.min(ARMY.marchesMax, state.marches + ARMY.marchRegenPerDay);
    envoyGift(state, events);
    events.push({ type: "new-day", day: state.day });
  }

  tickClimate(state, events);
  tickEconomy(state, events);
  tickPopulation(state, events);
  checkQuests(state, events);

  return events;
}

/** 快进 n tick（测试/探针用）。 */
export function runTicks(state, n, onEvents = null) {
  for (let i = 0; i < n; i++) {
    const events = tickGame(state);
    if (onEvents && events.length) onEvents(events, state);
    if (state.gameOver) break;
  }
  return state;
}
