// 事件写入口。放在单独模块里，hub / floor / state 都能用而不互相成环。

import { PHYSICS } from "./constants.js";

export function pushEvent(state, ev) {
  if (state.events.length >= PHYSICS.maxEvents) return;
  ev.t = state.time;
  state.events.push(ev);
}
