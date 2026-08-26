import { FLOWERS } from "../data/flowers";
import { SPIRITS } from "../data/spirits";
import { emit } from "../engine/events";
import { xpToLevel, type GameState } from "../engine/state";

export function addCoins(state: GameState, n: number): void {
  state.coins = Math.max(0, Math.round(state.coins + n));
}

export function spendCoins(state: GameState, n: number): boolean {
  if (state.coins < n) return false;
  state.coins -= n;
  return true;
}

/**
 * 把当前等级以下所有应得的花种补进存档，返回本次新增的花种 id。
 * 用 `<=` 而非 `===`：旧档跳级、数据表调整 unlockLevel、或升级时漏播的花种都能回填。
 */
export function backfillUnlocks(state: GameState, announce = false): string[] {
  const gained: string[] = [];
  for (const f of FLOWERS) {
    if (f.unlockLevel <= state.level && !state.unlockedFlowers.includes(f.id)) {
      state.unlockedFlowers.push(f.id);
      gained.push(f.id);
      if (announce) emit({ type: "toast", text: `解锁花种 · ${f.name}`, tone: "ok" });
    }
  }
  return gained;
}

export function addExp(state: GameState, n: number): void {
  state.exp += Math.max(0, n);
  let guard = 0;
  while (state.exp >= xpToLevel(state.level) && guard++ < 20) {
    state.exp -= xpToLevel(state.level);
    state.level += 1;
    emit({ type: "levelup", level: state.level });
    emit({ type: "toast", text: `花园擢升至 ${state.level} 阶`, tone: "rare" });
    backfillUnlocks(state, true);
  }
}

export function addItem(state: GameState, flowerId: string, n = 1): void {
  if (n <= 0) return;
  state.inventory[flowerId] = (state.inventory[flowerId] ?? 0) + n;
}

export function totalInventory(state: GameState): number {
  return Object.values(state.inventory).reduce((s, n) => s + n, 0);
}

export function takeItem(state: GameState, flowerId: string, n = 1): boolean {
  const have = state.inventory[flowerId] ?? 0;
  if (have < n) return false;
  state.inventory[flowerId] = have - n;
  if (state.inventory[flowerId] === 0) delete state.inventory[flowerId];
  return true;
}

export function bumpQuest(state: GameState, id: string, by = 1): void {
  const q = state.quests.find((x) => x.id === id);
  if (!q || q.done) return;
  q.progress += by;
  const need = id === "order1" ? 1 : 3;
  if (q.progress >= need) {
    q.done = true;
    addCoins(state, 18);
    addExp(state, 10);
    state.fragments += 1;
    emit({ type: "toast", text: "日常已成 · 获得装饰碎片", tone: "ok" });
  }
}

/** 已入驻花灵的口碑加成；未苏醒的花灵不作数，避免改档直接白嫖。 */
export function spiritReputationBonus(state: GameState): number {
  const id = state.activeSpirit;
  if (!id || !state.unlockedSpirits.includes(id)) return 0;
  return SPIRITS.find((s) => s.id === id)?.reputationBonus ?? 0;
}

/** 花灵口碑并入口碑总额后再参与结算，上限仍是 100。 */
export function effectiveReputation(state: GameState): number {
  return Math.min(100, state.reputation + spiritReputationBonus(state));
}

export function moodBonus(state: GameState): number {
  return 1 + Math.min(0.35, state.placedDecor.length * 0.04) + (effectiveReputation(state) - 70) / 400;
}
