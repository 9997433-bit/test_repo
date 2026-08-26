import { FLOWER_MAP } from "../data/flowers";
export type { Season } from "../data/flowers";
import { emit } from "../engine/events";
import type { Arrangement, GameState } from "../engine/state";
import { takeItem } from "./economy";

export const VASES = [
  { id: "clay", name: "陶瓶", bonus: 4 },
  { id: "celadon", name: "青瓷", bonus: 8 },
  { id: "bamboo", name: "竹筒", bonus: 6 },
  { id: "bronze", name: "青铜", bonus: 10 },
] as const;

export function scoreArrangement(flowerIds: string[], vase: string, season: string): number {
  if (flowerIds.length < 2) return 0;
  const defs = flowerIds.map((id) => FLOWER_MAP[id]).filter((d): d is NonNullable<typeof d> => Boolean(d));
  if (defs.length !== flowerIds.length) return 0;
  const rarity = defs.reduce((s, d) => s + d.rarity, 0) * 6;
  const unique = new Set(defs.map((d) => d.color)).size * 8;
  const seasonHit = defs.filter((d) => d.season === season).length * 10;
  const vaseBonus = VASES.find((v) => v.id === vase)?.bonus ?? 0;
  const harmony = defs.length >= 3 && new Set(defs.map((d) => d.season)).size <= 2 ? 12 : 0;
  return Math.min(100, 28 + rarity + unique + seasonHit + vaseBonus + harmony);
}

export function craft(state: GameState, vase: string, flowerIds: string[]): Arrangement | null {
  if (flowerIds.length < 2 || flowerIds.length > 4) {
    emit({ type: "toast", text: "请放入 2 至 4 枝花材", tone: "warn" });
    return null;
  }
  for (const id of flowerIds) {
    if (!takeItem(state, id, 1)) {
      emit({ type: "toast", text: "花材不够", tone: "warn" });
      return null;
    }
  }
  const score = scoreArrangement(flowerIds, vase, state.season);
  const names = flowerIds.map((id) => FLOWER_MAP[id]?.name ?? id).join("·");
  const art: Arrangement = {
    id: `arr-${state.now}-${Math.random().toString(36).slice(2, 7)}`,
    vase,
    flowerIds: [...flowerIds],
    score,
    name: `${names} ${score >= 85 ? "精品" : "小景"}`,
    createdAt: state.now,
  };
  state.arrangements.push(art);
  emit({ type: "toast", text: `成器 ${art.name} · ${score} 分`, tone: score >= 85 ? "rare" : "ok" });
  return art;
}
