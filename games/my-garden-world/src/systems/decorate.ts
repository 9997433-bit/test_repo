import { DECORATIONS, THEMES, type DecorTheme } from "../data/decorations";
import { emit } from "../engine/events";
import type { GameState } from "../engine/state";
import { spendCoins } from "./economy";

export function placeDecor(state: GameState, id: string): boolean {
  const def = DECORATIONS.find((d) => d.id === id);
  if (!def) return false;
  if (state.level < def.unlockLevel) {
    emit({ type: "toast", text: `${def.unlockLevel} 阶后可置此物`, tone: "warn" });
    return false;
  }
  if (state.placedDecor.includes(id)) {
    emit({ type: "toast", text: "庭中已有此物", tone: "warn" });
    return false;
  }
  const useFrag = state.fragments >= def.fragmentCost;
  if (useFrag) state.fragments -= def.fragmentCost;
  else if (!spendCoins(state, def.cost)) {
    emit({ type: "toast", text: "金币或碎片不足", tone: "warn" });
    return false;
  }
  state.placedDecor.push(id);
  emit({ type: "toast", text: `安置 ${def.name}`, tone: "ok" });
  return true;
}

export function applyTheme(state: GameState, theme: DecorTheme): void {
  const pack = THEMES.find((t) => t.id === theme);
  if (!pack) return;
  for (const id of pack.ids) {
    if (!state.placedDecor.includes(id)) placeDecor(state, id);
  }
}

export function removeDecor(state: GameState, id: string): void {
  state.placedDecor = state.placedDecor.filter((x) => x !== id);
}
