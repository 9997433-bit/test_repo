import { SPIRITS } from "../data/spirits";
import { emit } from "../engine/events";
import type { GameState } from "../engine/state";

export function refreshSpirits(state: GameState): void {
  for (const s of SPIRITS) {
    if (state.level >= s.unlockLevel && !state.unlockedSpirits.includes(s.id)) {
      state.unlockedSpirits.push(s.id);
      emit({ type: "toast", text: `花灵苏醒 · ${s.name}`, tone: "rare" });
    }
  }
}

export function setSpirit(state: GameState, id: string | null): void {
  if (id && !state.unlockedSpirits.includes(id)) return;
  state.activeSpirit = id;
  const s = SPIRITS.find((x) => x.id === id);
  if (s) emit({ type: "toast", text: s.line, tone: "rare" });
}

export function tickSpirits(state: GameState, _dt: number): void {
  refreshSpirits(state);
}
