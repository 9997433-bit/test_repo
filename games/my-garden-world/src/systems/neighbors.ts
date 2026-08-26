import { FLOWER_MAP } from "../data/flowers";
import { NEIGHBORS, NEIGHBOR_MAP, type NeighborDef } from "../data/neighbors";
import { emit } from "../engine/events";
import type { GameState, SocialMark } from "../engine/state";
import { gameDay } from "../engine/time";
import { addExp, addItem } from "./economy";

// ---------------------------------------------------------------------------
// 邻家花园（docs/UX.md 六）：园子按「邻居 id + 游戏日」作种子程序化生成，
// 只读快照——邻家的花不生长不凋残，互动痕迹记在自己的存档里（social.marks），
// 当日内重复进入呈现一致。跨日清痕迹、重置余量，友谊长存。
// ---------------------------------------------------------------------------

/** 每邻居每日帮浇上限。 */
export const WATER_PER_NEIGHBOR = 3;
/** 全局每日摘花上限。 */
export const PICKS_PER_DAY = 2;
/** 每邻居每日摘花上限。 */
export const PICKS_PER_NEIGHBOR = 1;
/** 每 6 点友谊一心，五心（30）封顶；每涨一心赠 1 枚装饰碎片。 */
export const HEART_STEP = 6;
export const MAX_FRIENDSHIP = 30;

export type NeighborStage = "sprout" | "bud" | "bloom";

export interface NeighborPlot {
  idx: number;
  flowerId: string | null;
  stage: NeighborStage | null;
  /** 生成时的已浇水滴（帮浇后由 water 痕迹补满）。 */
  watered: number;
  waterNeed: number;
}

export interface NeighborGarden {
  neighborId: string;
  day: number;
  plots: NeighborPlot[];
}

function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** mulberry32：小巧的确定性 PRNG，同种子同序列。 */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makePlot(idx: number, flowerId: string | null, stage: NeighborStage | null, watered: number): NeighborPlot {
  const need = flowerId ? (FLOWER_MAP[flowerId]?.waterNeed ?? 1) : 0;
  return { idx, flowerId, stage, watered: Math.min(watered, need), waterNeed: need };
}

const isThirsty = (p: NeighborPlot): boolean => p.stage === "sprout" || p.stage === "bud" ? p.watered < p.waterNeed : false;

/**
 * 生成某邻居「今日」的园子快照。保底原则（同教程保底订单思路）：
 * 至少 2 块有花、至少 1 块盛放、至少 1 块缺水——串门必有事可做。
 */
export function neighborGarden(state: GameState, neighborId: string): NeighborGarden {
  const def = NEIGHBOR_MAP[neighborId];
  const day = gameDay(state);
  if (!def) return { neighborId, day, plots: [] };
  const rnd = mulberry32(hashStr(`${neighborId}:${day}`));
  const pick = (): string => def.favorites[Math.floor(rnd() * def.favorites.length)] ?? "daisy";

  const plots: NeighborPlot[] = [];
  for (let i = 0; i < def.plotCount; i++) {
    if (rnd() < 0.24) {
      plots.push(makePlot(i, null, null, 0));
      continue;
    }
    const flowerId = pick();
    const roll = rnd();
    const stage: NeighborStage = roll < 0.3 ? "sprout" : roll < 0.62 ? "bud" : "bloom";
    const need = FLOWER_MAP[flowerId]?.waterNeed ?? 1;
    const watered = stage === "bloom" ? need : Math.floor(rnd() * (need + 1));
    plots.push(makePlot(i, flowerId, stage, watered));
  }

  // 保底一：至少 2 块有花
  for (let i = 0; plots.filter((p) => p.flowerId).length < 2 && i < plots.length; i++) {
    const p = plots[i]!;
    if (!p.flowerId) plots[i] = makePlot(i, pick(), "bud", 0);
  }
  // 保底二：至少 1 块盛放
  const flowered = plots.filter((p) => p.flowerId);
  if (!flowered.some((p) => p.stage === "bloom")) {
    const last = flowered[flowered.length - 1]!;
    plots[last.idx] = makePlot(last.idx, last.flowerId, "bloom", last.waterNeed);
  }
  // 保底三：至少 1 块缺水（生长中的）
  if (!plots.some(isThirsty)) {
    const growing = plots.find((p) => p.stage === "sprout" || p.stage === "bud");
    if (growing) {
      plots[growing.idx] = makePlot(growing.idx, growing.flowerId, growing.stage, 0);
    } else {
      const empty = plots.find((p) => !p.flowerId);
      const blooms = plots.filter((p) => p.stage === "bloom");
      if (empty) plots[empty.idx] = makePlot(empty.idx, pick(), "sprout", 0);
      else if (blooms.length >= 2) {
        const demote = blooms[0]!;
        plots[demote.idx] = makePlot(demote.idx, demote.flowerId, "bud", 0);
      }
    }
  }
  // 当日痕迹回放：帮浇过的圃水滴补满，重复进入呈现一致（借花痕迹由 UI 换借花笺）
  if (state.social.day === day) {
    for (const m of state.social.marks) {
      if (m.n !== neighborId || m.k !== "water") continue;
      const p = plots[m.p];
      if (p?.flowerId) plots[m.p] = makePlot(p.idx, p.flowerId, p.stage, p.waterNeed);
    }
  }
  return { neighborId, day, plots };
}

// ---------- 当日痕迹与余量 ----------

/** 跨日翻篇：清空当日互动痕迹（友谊长存）。所有邻访操作前都先走一遍。 */
export function rollSocialDay(state: GameState): void {
  const day = gameDay(state);
  if (state.social.day === day) return;
  state.social.day = day;
  state.social.marks = [];
}

export function marksFor(state: GameState, neighborId: string): SocialMark[] {
  return state.social.marks.filter((m) => m.n === neighborId);
}

export function markAt(state: GameState, neighborId: string, plotIdx: number, kind: SocialMark["k"]): boolean {
  return state.social.marks.some((m) => m.n === neighborId && m.p === plotIdx && m.k === kind);
}

export function waterLeftFor(state: GameState, neighborId: string): number {
  return Math.max(0, WATER_PER_NEIGHBOR - marksFor(state, neighborId).filter((m) => m.k === "water").length);
}

export function pickLeftGlobal(state: GameState): number {
  return Math.max(0, PICKS_PER_DAY - state.social.marks.filter((m) => m.k === "pick").length);
}

export function pickLeftFor(state: GameState, neighborId: string): number {
  const own = Math.max(0, PICKS_PER_NEIGHBOR - marksFor(state, neighborId).filter((m) => m.k === "pick").length);
  return Math.min(own, pickLeftGlobal(state));
}

export function friendshipOf(state: GameState, neighborId: string): number {
  return state.social.friendship[neighborId] ?? 0;
}

export function hearts(friendship: number): number {
  return Math.min(5, Math.floor(friendship / HEART_STEP));
}

export function greetingFor(state: GameState, def: NeighborDef): string {
  const idx = Math.min(hearts(friendshipOf(state, def.id)), def.greetings.length - 1);
  return def.greetings[idx] ?? def.greetings[0] ?? "";
}

export interface NeighborSummary {
  def: NeighborDef;
  unlocked: boolean;
  hearts: number;
  friendship: number;
  waterLeft: number;
  pickLeft: number;
}

export function neighborRoster(state: GameState): NeighborSummary[] {
  rollSocialDay(state);
  return NEIGHBORS.map((def) => ({
    def,
    unlocked: state.level >= def.unlockLevel,
    hearts: hearts(friendshipOf(state, def.id)),
    friendship: friendshipOf(state, def.id),
    waterLeft: waterLeftFor(state, def.id),
    pickLeft: pickLeftFor(state, def.id),
  }));
}

// ---------- 互动 ----------

function gainFriendship(state: GameState, neighborId: string, by: number): void {
  const before = friendshipOf(state, neighborId);
  const after = Math.min(MAX_FRIENDSHIP, before + by);
  state.social.friendship[neighborId] = after;
  if (hearts(after) > hearts(before)) {
    state.fragments += 1;
    const name = NEIGHBOR_MAP[neighborId]?.name ?? neighborId;
    emit({ type: "toast", text: `与${name}的情谊又深一层 · 获赠装饰碎片`, tone: "rare" });
  }
}

/**
 * 帮邻居浇水：不耗自家水缸，一次把该圃水滴补满；友谊 +1、经验 +2。
 * 受阻必有回声：超日限 / 不缺水各有一句（后者轻提示、不计次）。
 */
export function visitWater(state: GameState, neighborId: string, plotIdx: number): boolean {
  rollSocialDay(state);
  const def = NEIGHBOR_MAP[neighborId];
  if (!def || state.level < def.unlockLevel) return false;
  const plot = neighborGarden(state, neighborId).plots[plotIdx];
  if (!plot || !plot.flowerId) return false;
  if (markAt(state, neighborId, plotIdx, "water") || !isThirsty(plot)) {
    emit({ type: "toast", text: "这圃不缺水", tone: "warn" });
    return false;
  }
  if (waterLeftFor(state, neighborId) <= 0) {
    emit({ type: "toast", text: "今日帮浇的水够了，留点明日", tone: "warn" });
    return false;
  }
  state.social.marks.push({ n: neighborId, p: plotIdx, k: "water" });
  gainFriendship(state, neighborId, 1);
  addExp(state, 2);
  return true;
}

/**
 * 借（摘）一枝盛放的花：入自家库存，圃面换「借花笺」。
 * 日限：全局 2 枝、每邻居 1 枝；未盛放摘不得。成功返回花种 id。
 */
export function visitPick(state: GameState, neighborId: string, plotIdx: number): string | null {
  rollSocialDay(state);
  const def = NEIGHBOR_MAP[neighborId];
  if (!def || state.level < def.unlockLevel) return null;
  const plot = neighborGarden(state, neighborId).plots[plotIdx];
  if (!plot || !plot.flowerId) return null;
  if (markAt(state, neighborId, plotIdx, "pick")) {
    emit({ type: "toast", text: "这枝已借走，留些余香", tone: "warn" });
    return null;
  }
  if (plot.stage !== "bloom") {
    emit({ type: "toast", text: "花未开，摘不得", tone: "warn" });
    return null;
  }
  if (pickLeftGlobal(state) <= 0) {
    emit({ type: "toast", text: "今日已借两枝，再摘要伤和气", tone: "warn" });
    return null;
  }
  if (pickLeftFor(state, neighborId) <= 0) {
    emit({ type: "toast", text: "一家只借一枝，去别家看看", tone: "warn" });
    return null;
  }
  state.social.marks.push({ n: neighborId, p: plotIdx, k: "pick" });
  addItem(state, plot.flowerId, 1);
  const flower = FLOWER_MAP[plot.flowerId];
  emit({ type: "toast", text: `借得一枝${flower?.name ?? plot.flowerId}，记下这份情`, tone: "ok" });
  return plot.flowerId;
}
