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

export interface ScoreTier {
  id: "fan" | "liang" | "jia" | "jing" | "shen";
  name: string;
  min: number;
}

/** 品第（由高到低）：神品是全档追求目标，需顶配同季四色 + 青铜器。 */
export const TIERS: ScoreTier[] = [
  { id: "shen", name: "神品", min: 95 },
  { id: "jing", name: "精品", min: 85 },
  { id: "jia", name: "佳品", min: 70 },
  { id: "liang", name: "良品", min: 50 },
  { id: "fan", name: "凡品", min: 0 },
];

export function scoreTier(score: number): ScoreTier {
  return TIERS.find((t) => score >= t.min) ?? TIERS[TIERS.length - 1]!;
}

/**
 * 评分（0-100，仅 2-4 枝为合法作品）：
 * 均稀有度×8 + 枝数(超出两枝每枝+5) + 花色种数×5 + 应季枝数×5 + 和声(全同季+8/两季+4) + 花器加成。
 * 旧版基数 28 + 稀有度总和×6 会让任意四枝稀有花瞬间封顶 100；
 * 现在 100 分只有「同季四枝、四色各异、均稀有度 4、青铜器」的冬雪套能摸到。
 */
export function scoreArrangement(flowerIds: string[], vase: string, season: string): number {
  if (flowerIds.length < 2 || flowerIds.length > 4) return 0;
  const defs = flowerIds.map((id) => FLOWER_MAP[id]).filter((d): d is NonNullable<typeof d> => Boolean(d));
  if (defs.length !== flowerIds.length) return 0;
  const avgRarity = defs.reduce((s, d) => s + d.rarity, 0) / defs.length;
  const stems = (defs.length - 2) * 5;
  const colors = new Set(defs.map((d) => d.color)).size * 5;
  const seasonHits = defs.filter((d) => d.season === season).length * 5;
  const seasons = new Set(defs.map((d) => d.season)).size;
  const harmony = defs.length >= 3 ? (seasons === 1 ? 8 : seasons === 2 ? 4 : 0) : 0;
  const vaseBonus = VASES.find((v) => v.id === vase)?.bonus ?? 0;
  return Math.max(0, Math.min(100, Math.round(avgRarity * 8 + stems + colors + seasonHits + harmony + vaseBonus)));
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
  const tier = scoreTier(score);
  const names = flowerIds.map((id) => FLOWER_MAP[id]?.name ?? id).join("·");
  const art: Arrangement = {
    id: `arr-${state.now}-${Math.random().toString(36).slice(2, 7)}`,
    vase,
    flowerIds: [...flowerIds],
    score,
    name: `${names} · ${tier.name}`,
    createdAt: state.now,
  };
  state.arrangements.push(art);
  emit({ type: "crafted", score });
  emit({ type: "toast", text: `成器 ${art.name} · ${score} 分`, tone: score >= 85 ? "rare" : "ok" });
  return art;
}
