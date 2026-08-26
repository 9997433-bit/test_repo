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

export type ArrangementTierId = "common" | "elegant" | "fine" | "divine";

export interface ArrangementTier {
  id: ArrangementTierId;
  name: string;
  /** 达到该品第所需的最低分（闭区间下界）。 */
  min: number;
  tone: "ok" | "rare";
  blurb: string;
}

// 品第阈值对齐定制订单的 requireScore（60 / 70 / 85 / 92）：
// 雅品够交茶寮与花笺，精品够墨雅厅堂，神品才配行会家宴。
export const ARRANGEMENT_TIERS: ArrangementTier[] = [
  { id: "divine", name: "神品", min: 92, tone: "rare", blurb: "一瓶之内自成节候，可入宗师家宴。" },
  { id: "fine", name: "精品", min: 75, tone: "rare", blurb: "堂前陈列，过客都要驻足。" },
  { id: "elegant", name: "雅品", min: 60, tone: "ok", blurb: "清供案头，恰到好处。" },
  { id: "common", name: "凡品", min: 0, tone: "ok", blurb: "尚可一看，只是还欠讲究。" },
];

const COMMON_TIER = ARRANGEMENT_TIERS[ARRANGEMENT_TIERS.length - 1] as ArrangementTier;

export function arrangementTier(score: number): ArrangementTier {
  return ARRANGEMENT_TIERS.find((t) => score >= t.min) ?? COMMON_TIER;
}

// 各项均设上限，且上限按「大束」标定：2~4 枝的瓶花只能吃到其中一部分，
// 想上神品必须同时满足高稀有度 + 同季和鸣 + 色系相映 + 章法齐备。
const BASE_SCORE = 4;
const RARITY_PER_POINT = 2.6;
const RARITY_CAP = 34;
const SEASON_PER_STEM = 5;
const SEASON_CAP = 28;
/**
 * 配色按色系（`flower.hue`）计，不再按 `color` 十六进制——24 种花的十六进制互不相同，
 * 按它算配色永远满分、毫无决策。双色相映 12 > 一色素雅 8 > 三色 6 > 四色斑杂 2。
 */
const PALETTE_BY_HUE_COUNT: Record<number, number> = { 1: 8, 2: 12, 3: 6, 4: 2 };
const PALETTE_MAX_HUE_COUNT = 4;
/** 章法（`flower.role`）：恰一枝主花 +4（双主花喧宾夺主记 0），有配花 +1，有衬花 +1。 */
const COMPOSITION_FOCAL = 4;
const COMPOSITION_FILLER = 1;
const COMPOSITION_ACCENT = 1;
/** 重样折价：同种花材第 2 枝起每枝 −4，堵住「同花堆叠」把曲线压扁的漏洞。 */
const DUPLICATE_PENALTY = 4;
/** 依花材横跨的季数给和鸣分：一季独芳 > 两季相济 > 杂季无韵。 */
const HARMONY_BY_SEASON_SPAN: Record<number, number> = { 1: 10, 2: 7 };

export interface ScoreBreakdown {
  rarity: number;
  palette: number;
  season: number;
  harmony: number;
  /** 章法分 − 重样折价，可为负。 */
  composition: number;
  /** @deprecated 章法分的旧字段名（Round 2 的「满瓶」），值与 `composition` 相同。 */
  fullness: number;
  vase: number;
  total: number;
}

/** 与 scoreArrangement 同源的分项明细，便于 UI 解释「为何只是雅品」。 */
export function scoreBreakdown(flowerIds: string[], vase: string, season: string): ScoreBreakdown {
  const empty: ScoreBreakdown = {
    rarity: 0,
    palette: 0,
    season: 0,
    harmony: 0,
    composition: 0,
    fullness: 0,
    vase: 0,
    total: 0,
  };
  if (flowerIds.length < 2) return empty;
  const defs = flowerIds.map((id) => FLOWER_MAP[id]).filter((d): d is NonNullable<typeof d> => Boolean(d));
  if (defs.length !== flowerIds.length) return empty;

  const stems = defs.length;
  const rarity = Math.min(RARITY_CAP, defs.reduce((s, d) => s + d.rarity, 0) * RARITY_PER_POINT);
  const hues = new Set(defs.map((d) => d.hue)).size;
  const palette = PALETTE_BY_HUE_COUNT[Math.min(PALETTE_MAX_HUE_COUNT, hues)] ?? 2;
  const seasonScore = Math.min(SEASON_CAP, defs.filter((d) => d.season === season).length * SEASON_PER_STEM);
  const span = new Set(defs.map((d) => d.season)).size;
  const harmony = stems >= 3 ? HARMONY_BY_SEASON_SPAN[span] ?? 0 : 0;
  const focal = defs.filter((d) => d.role === "focal").length;
  const composition =
    (focal === 1 ? COMPOSITION_FOCAL : 0) +
    (defs.some((d) => d.role === "filler") ? COMPOSITION_FILLER : 0) +
    (defs.some((d) => d.role === "accent") ? COMPOSITION_ACCENT : 0) -
    (stems - new Set(flowerIds).size) * DUPLICATE_PENALTY;
  const vaseBonus = VASES.find((v) => v.id === vase)?.bonus ?? 0;
  const total = Math.max(
    0,
    Math.min(100, Math.round(BASE_SCORE + rarity + palette + seasonScore + harmony + composition + vaseBonus)),
  );
  return {
    rarity,
    palette,
    season: seasonScore,
    harmony,
    composition,
    fullness: composition,
    vase: vaseBonus,
    total,
  };
}

export function scoreArrangement(flowerIds: string[], vase: string, season: string): number {
  return scoreBreakdown(flowerIds, vase, season).total;
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
  const tier = arrangementTier(score);
  const names = flowerIds.map((id) => FLOWER_MAP[id]?.name ?? id).join("·");
  const art: Arrangement = {
    id: `arr-${state.now}-${Math.random().toString(36).slice(2, 7)}`,
    vase,
    flowerIds: [...flowerIds],
    score,
    name: `${names} ${tier.name}`,
    createdAt: state.now,
  };
  state.arrangements.push(art);
  emit({ type: "toast", text: `成器 ${art.name} · ${score} 分`, tone: tier.tone });
  return art;
}
