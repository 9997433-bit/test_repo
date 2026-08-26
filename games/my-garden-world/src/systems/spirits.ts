import { SPIRITS, type SpiritDef } from "../data/spirits";
import { emit } from "../engine/events";
import type { GameState } from "../engine/state";

export interface SpiritStatus {
  def: SpiritDef;
  unlocked: boolean;
  active: boolean;
  levelsLeft: number;
}

export function spiritDef(id: string | null): SpiritDef | undefined {
  if (!id) return undefined;
  return SPIRITS.find((s) => s.id === id);
}

export function activeSpirit(state: GameState): SpiritDef | undefined {
  return spiritDef(state.activeSpirit);
}

export function spiritEffects(def: SpiritDef): string[] {
  const out: string[] = [`生长 ×${def.growMul}`];
  if (def.autoWater) out.push("自动浇灌");
  if (def.wiltGuard) out.push("护花不凋");
  if (def.reputationBonus) out.push(`口碑 +${def.reputationBonus}`);
  return out;
}

export function spiritStatus(state: GameState, id: string): SpiritStatus | null {
  const def = spiritDef(id);
  if (!def) return null;
  return {
    def,
    unlocked: state.unlockedSpirits.includes(def.id),
    active: state.activeSpirit === def.id,
    levelsLeft: Math.max(0, def.unlockLevel - state.level),
  };
}

export function refreshSpirits(state: GameState): void {
  for (const s of SPIRITS) {
    if (state.level >= s.unlockLevel && !state.unlockedSpirits.includes(s.id)) {
      state.unlockedSpirits.push(s.id);
      emit({ type: "toast", text: `花灵苏醒 · ${s.name}`, tone: "rare" });
    }
  }
}

export function setSpirit(state: GameState, id: string | null): boolean {
  if (state.activeSpirit === id) return false;
  if (id && !state.unlockedSpirits.includes(id)) {
    const def = spiritDef(id);
    emit({
      type: "toast",
      text: def ? `${def.unlockLevel} 阶后方可请 ${def.name}` : "此灵尚未苏醒",
      tone: "warn",
    });
    return false;
  }
  state.activeSpirit = id;
  const def = spiritDef(id);
  emit(
    def
      ? { type: "toast", text: `${def.name}：${def.line}`, tone: "rare" }
      : { type: "toast", text: "花灵归位，庭中暂由你独理", tone: "ok" },
  );
  return true;
}

export function tickSpirits(state: GameState, _dt: number): void {
  refreshSpirits(state);
}
