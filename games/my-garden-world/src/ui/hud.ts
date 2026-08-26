import type { GameState } from "../engine/state";
import { clockLabel, seasonLabel } from "../engine/time";
import { xpToLevel } from "../engine/state";

export function renderHud(el: HTMLElement, state: GameState): void {
  el.innerHTML = `
    <div class="brand">我的花园世界</div>
    <div class="pills">
      <span class="pill">金 ${state.coins}</span>
      <span class="pill">水 ${state.water}</span>
      <span class="pill">${state.level} 阶 · ${state.exp}/${xpToLevel(state.level)}</span>
      <span class="pill">口碑 ${state.reputation}</span>
      <span class="pill">${seasonLabel(state.season)} · ${clockLabel(state.dayMinute)}</span>
      <span class="pill">碎片 ${state.fragments}</span>
    </div>
  `;
}
