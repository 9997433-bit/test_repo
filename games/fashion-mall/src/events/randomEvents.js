import { EVENTS } from "../data/copy.js";
import { grantGold, grantXp, persist } from "../core/state.js";
import { sfx } from "../core/audio.js";

export function maybeEvent(state) {
  if (Math.random() > 0.18) return null;
  return EVENTS[Math.floor(Math.random() * EVENTS.length)];
}

export function renderEventModal(host, state, ev, onClose) {
  const wrap = document.createElement("div");
  wrap.className = "modal";
  wrap.innerHTML = `
    <div class="sheet">
      <h3>${ev.title}</h3>
      <p>${ev.body}</p>
      <div class="row">
        <button class="btn" id="yes">${ev.yes}</button>
        <button class="btn ghost" id="no">${ev.no}</button>
      </div>
    </div>`;
  wrap.querySelector("#yes").onclick = () => {
    grantGold(state, ev.reward.gold);
    grantXp(state, ev.reward.xp);
    persist(state);
    sfx.coin();
    state.toast = `${ev.title} 完成，人气悄悄上涨`;
    wrap.remove();
    onClose();
  };
  wrap.querySelector("#no").onclick = () => {
    wrap.remove();
    onClose();
  };
  host.append(wrap);
}
