import type { FlowerDef, GrowthStage } from "../data/flowers";

/** 花圃外观描述：全部由花种与花圃编号推导，同样输入必得同样结果。 */
export interface BlossomSpec {
  /** 花瓣数量，空圃为 0。 */
  petals: number;
  /** 整朵花的固定倾角，避免一园的花整齐得像贴纸。 */
  tiltDeg: number;
  /** 摇曳动画的相位偏移（秒），让相邻花圃错开节奏。 */
  phaseSec: number;
  /** 花瓣主色。 */
  bloom: string;
  /** 花心与描边色。 */
  accent: string;
  /** 叶片色，由稀有度轻微区分。 */
  leaf: string;
}

const PETALS_BY_RARITY: Record<number, number> = { 1: 5, 2: 5, 3: 6, 4: 6, 5: 8 };
const LEAF_BY_RARITY: Record<number, string> = {
  1: "#7fae72",
  2: "#6fa565",
  3: "#5d9a5c",
  4: "#4f8b54",
  5: "#3f7a4d",
};

const FALLBACK: BlossomSpec = {
  petals: 0,
  tiltDeg: 0,
  phaseSec: 0,
  bloom: "#cbb79a",
  accent: "#8a7350",
  leaf: "#7fae72",
};

/** FNV-1a，纯函数散列，供外观取稳定的伪随机数。 */
export function hashSeed(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function blossomSpec(def: FlowerDef | undefined, plotId: number): BlossomSpec {
  if (!def) return FALLBACK;
  const seed = hashSeed(`${def.id}@${plotId}`);
  return {
    petals: PETALS_BY_RARITY[def.rarity] ?? 5,
    tiltDeg: (seed % 15) - 7,
    phaseSec: ((seed >>> 6) % 46) / 10,
    bloom: def.color,
    accent: def.accent,
    leaf: LEAF_BY_RARITY[def.rarity] ?? FALLBACK.leaf,
  };
}

/** 花瓣角度均分一周，首瓣朝上。 */
export function petalAngles(petals: number): number[] {
  if (petals <= 0) return [];
  const step = 360 / petals;
  return Array.from({ length: petals }, (_, i) => Math.round(i * step * 10) / 10);
}

export const STAGE_LABEL: Record<GrowthStage, string> = {
  empty: "空圃",
  seeded: "新播",
  sprout: "幼苗",
  bud: "结蕾",
  bloom: "绽放",
  wilt: "凋残",
};

/** 圃位序号写成中文，「第三畦」比「第 3 块地」更贴合国风文案。 */
const CN_DIGITS = ["〇", "一", "二", "三", "四", "五", "六", "七", "八", "九"];

export function plotOrdinal(plotId: number): string {
  const n = plotId + 1;
  if (n <= 10) return `第${n === 10 ? "十" : CN_DIGITS[n] ?? String(n)}畦`;
  if (n < 20) return `第十${CN_DIGITS[n - 10] ?? ""}畦`;
  const tens = Math.floor(n / 10);
  const ones = n % 10;
  return `第${CN_DIGITS[tens] ?? ""}十${ones ? CN_DIGITS[ones] ?? "" : ""}畦`;
}
