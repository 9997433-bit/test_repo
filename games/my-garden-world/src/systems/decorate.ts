import { DECORATIONS, THEMES, type DecorTheme } from "../data/decorations";
import { emit } from "../engine/events";
import type { GameState } from "../engine/state";
import { spendCoins } from "./economy";

const DECOR_MAP = new Map(DECORATIONS.map((d) => [d.id, d]));

/** 场景要画的一件陈设：已入园的 id 解析成图名与落款，旧存档的未知 id 也保留。 */
export interface PlacedDecor {
  id: string;
  name: string;
  glyph: string;
  /** 陈列牌文案：已知者「灯 纱灯」，未知者原样 id */
  label: string;
  known: boolean;
}

export function resolvePlacedDecor(state: GameState): PlacedDecor[] {
  return state.placedDecor.map((id) => {
    const def = DECOR_MAP.get(id);
    if (!def) return { id, name: id, glyph: id.slice(0, 1), label: id, known: false };
    return { id, name: def.name, glyph: def.glyph, label: `${def.glyph} ${def.name}`, known: true };
  });
}

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
