import { FLOWER_MAP } from "../data/flowers";
export type { Season } from "../data/flowers";
import { emit } from "../engine/events";
import type { Arrangement, GameState } from "../engine/state";
import { takeItems, toFinite, type StemDemand } from "./economy";

export const VASES = [
  { id: "clay", name: "陶瓶", bonus: 4 },
  { id: "celadon", name: "青瓷", bonus: 8 },
  { id: "bamboo", name: "竹筒", bonus: 6 },
  { id: "bronze", name: "青铜", bonus: 10 },
] as const;

export const MIN_STEMS = 2;
export const MAX_STEMS = 4;
/** 陈列上限：作品只增不减会把存档撑大，也会让作坊面板越排越长。 */
const MAX_ARRANGEMENTS = 12;

export function scoreArrangement(flowerIds: string[], vase: string, season: string): number {
  if (!Array.isArray(flowerIds) || flowerIds.length < MIN_STEMS) return 0;
  const defs = flowerIds.map((id) => FLOWER_MAP[id]).filter((d): d is NonNullable<typeof d> => Boolean(d));
  if (defs.length !== flowerIds.length) return 0;
  const rarity = defs.reduce((s, d) => s + d.rarity, 0) * 6;
  const unique = new Set(defs.map((d) => d.color)).size * 8;
  const seasonHit = defs.filter((d) => d.season === season).length * 10;
  const vaseBonus = VASES.find((v) => v.id === vase)?.bonus ?? 0;
  const harmony = defs.length >= 3 && new Set(defs.map((d) => d.season)).size <= 2 ? 12 : 0;
  return Math.max(0, Math.min(100, Math.round(28 + rarity + unique + seasonHit + vaseBonus + harmony)));
}

function arrangementId(state: GameState): string {
  const stamp = Math.max(0, Math.round(toFinite(state.now)));
  const taken = new Set(state.arrangements.map((a) => a.id));
  // Math.random 在测试或某些环境里可能是固定值，撞号会让作品互相顶替，故留一条计数兜底。
  for (let attempt = 0; attempt < 8; attempt++) {
    const id = `arr-${stamp}-${Math.random().toString(36).slice(2, 7)}`;
    if (!taken.has(id)) return id;
  }
  let seq = taken.size;
  while (taken.has(`arr-${stamp}-${seq}`)) seq += 1;
  return `arr-${stamp}-${seq}`;
}

function trimArrangements(state: GameState): void {
  while (state.arrangements.length > MAX_ARRANGEMENTS) {
    // 撤下分数最低（同分则最旧）的一件，把架子留给好作品。
    let worst = 0;
    for (let i = 1; i < state.arrangements.length; i++) {
      const a = state.arrangements[i];
      const b = state.arrangements[worst];
      if (!a || !b) continue;
      if (toFinite(a.score) < toFinite(b.score) || (a.score === b.score && toFinite(a.createdAt) < toFinite(b.createdAt))) {
        worst = i;
      }
    }
    const [removed] = state.arrangements.splice(worst, 1);
    if (removed) emit({ type: "toast", text: `陈列架已满 · 撤下${removed.name}`, tone: "warn" });
  }
}

export function craft(state: GameState, vase: string, flowerIds: string[]): Arrangement | null {
  if (!Array.isArray(state.arrangements)) state.arrangements = [];
  const ids = (Array.isArray(flowerIds) ? flowerIds : []).filter(
    (id): id is string => typeof id === "string" && id.length > 0,
  );
  if (ids.length < MIN_STEMS || ids.length > MAX_STEMS) {
    emit({ type: "toast", text: `请放入 ${MIN_STEMS} 至 ${MAX_STEMS} 枝花材`, tone: "warn" });
    return null;
  }
  const unknown = ids.find((id) => !FLOWER_MAP[id]);
  if (unknown) {
    emit({ type: "toast", text: "认不得这枝花材", tone: "warn" });
    return null;
  }
  const vaseDef = VASES.find((v) => v.id === vase);
  if (!vaseDef) {
    emit({ type: "toast", text: "请先选一只花器", tone: "warn" });
    return null;
  }
  // 整单扣料：旧写法逐枝扣，最后一枝不够时前几枝已经消失了。
  const demands: StemDemand[] = ids.map((id) => ({ flowerId: id, count: 1 }));
  if (!takeItems(state, demands)) {
    emit({ type: "toast", text: "花材不够", tone: "warn" });
    return null;
  }
  const score = scoreArrangement(ids, vaseDef.id, state.season);
  const names = ids.map((id) => FLOWER_MAP[id]?.name ?? id).join("·");
  const art: Arrangement = {
    id: arrangementId(state),
    vase: vaseDef.id,
    flowerIds: [...ids],
    score,
    name: `${names} ${score >= 85 ? "精品" : "小景"}`,
    createdAt: Math.max(0, Math.round(toFinite(state.now))),
  };
  state.arrangements.push(art);
  trimArrangements(state);
  emit({ type: "toast", text: `成器 ${art.name} · ${score} 分`, tone: score >= 85 ? "rare" : "ok" });
  return art;
}
