import { DECORATIONS, THEMES, type DecorDef, type DecorTheme } from "../data/decorations";
import { emit } from "../engine/events";
import type { GameState } from "../engine/state";
import { spendCoins } from "./economy";

export const MOOD_PER_DECOR = 0.04;
export const MOOD_CAP = 0.35;

export type PayWith = "fragment" | "coin";

export interface DecorStatus {
  def: DecorDef;
  placed: boolean;
  locked: boolean;
  payWith: PayWith | null;
  canPlace: boolean;
  reason: string;
}

export interface ThemeStatus {
  id: DecorTheme;
  name: string;
  total: number;
  placed: number;
  missing: DecorDef[];
  done: boolean;
}

export function decorDef(id: string): DecorDef | undefined {
  return DECORATIONS.find((d) => d.id === id);
}

export function isPlaced(state: GameState, id: string): boolean {
  return state.placedDecor.includes(id);
}

/** Share of the order payout bonus that comes from the courtyard itself. */
export function decorMoodBonus(state: GameState): number {
  return Math.min(MOOD_CAP, state.placedDecor.length * MOOD_PER_DECOR);
}

export function decorStatus(state: GameState, id: string): DecorStatus | null {
  const def = decorDef(id);
  if (!def) return null;
  const placed = isPlaced(state, id);
  const locked = state.level < def.unlockLevel;
  const payWith: PayWith | null = state.fragments >= def.fragmentCost
    ? "fragment"
    : state.coins >= def.cost
      ? "coin"
      : null;
  const canPlace = !placed && !locked && payWith !== null;
  const reason = placed
    ? "庭中已有"
    : locked
      ? `${def.unlockLevel} 阶解锁`
      : payWith === null
        ? "金币或碎片不足"
        : payWith === "fragment"
          ? `耗 ${def.fragmentCost} 碎片`
          : `耗 ${def.cost} 金`;
  return { def, placed, locked, payWith, canPlace, reason };
}

export function decorSummary(state: GameState): { placed: number; total: number; mood: number } {
  const placed = DECORATIONS.filter((d) => isPlaced(state, d.id)).length;
  return { placed, total: DECORATIONS.length, mood: decorMoodBonus(state) };
}

export function themeStatus(state: GameState, theme: DecorTheme): ThemeStatus | null {
  const pack = THEMES.find((t) => t.id === theme);
  if (!pack) return null;
  const defs = pack.ids.map(decorDef).filter((d): d is DecorDef => Boolean(d));
  const missing = defs.filter((d) => !isPlaced(state, d.id));
  return {
    id: pack.id,
    name: pack.name,
    total: defs.length,
    placed: defs.length - missing.length,
    missing,
    done: missing.length === 0,
  };
}

export function placeDecor(state: GameState, id: string, opts: { silent?: boolean } = {}): boolean {
  const status = decorStatus(state, id);
  if (!status) return false;
  const { def } = status;
  const say = (text: string, tone: "ok" | "warn") => {
    if (!opts.silent) emit({ type: "toast", text, tone });
  };
  if (status.placed) {
    say("庭中已有此物", "warn");
    return false;
  }
  if (status.locked) {
    say(`${def.unlockLevel} 阶后可置此物`, "warn");
    return false;
  }
  if (status.payWith === "fragment") state.fragments -= def.fragmentCost;
  else if (!spendCoins(state, def.cost)) {
    say("金币或碎片不足", "warn");
    return false;
  }
  state.placedDecor.push(id);
  say(`安置 ${def.name}`, "ok");
  return true;
}

/** Places whatever of the theme is still missing and reports the outcome once. */
export function applyTheme(state: GameState, theme: DecorTheme): number {
  const before = themeStatus(state, theme);
  if (!before) return 0;
  if (before.done) {
    emit({ type: "toast", text: `${before.name}已齐备`, tone: "ok" });
    return 0;
  }
  let placed = 0;
  for (const def of before.missing) {
    if (placeDecor(state, def.id, { silent: true })) placed += 1;
  }
  const left = before.missing.length - placed;
  const tail = left ? `，${left} 件未成` : "";
  emit({
    type: "toast",
    text: placed ? `套用${before.name} · 新置 ${placed} 件${tail}` : `${before.name}还差 ${left} 件，金币或碎片不足`,
    tone: placed ? "ok" : "warn",
  });
  return placed;
}

export function removeDecor(state: GameState, id: string): boolean {
  if (!isPlaced(state, id)) return false;
  state.placedDecor = state.placedDecor.filter((x) => x !== id);
  emit({ type: "toast", text: `收起 ${decorDef(id)?.name ?? id}`, tone: "ok" });
  return true;
}
