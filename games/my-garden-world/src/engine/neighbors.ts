import { FLOWER_MAP } from "../data/flowers";
import { addExp, addItem } from "../systems/economy";
import { emit } from "./events";
import {
  DAILY_PICK,
  DAILY_WATER_HELP,
  FRIENDSHIP_MAX,
  MARKS_CAP,
  type GameState,
  type VisitMark,
} from "./state";
import { gameDay } from "./time";

/** 单个邻居每日可帮浇的上限（总量另受 DAILY_WATER_HELP 约束）。 */
export const NEIGHBOR_WATER_CAP = 3;
/** 一家只借一枝。 */
export const NEIGHBOR_PICK_CAP = 1;
/** 每档心需要的交情点数：满档 5 心。 */
export const FRIENDSHIP_PER_HEART = 6;
/** 帮浇一次的回报。 */
export const WATER_FRIENDSHIP = 1;
export const WATER_EXP = 2;

export interface NeighborDef {
  id: string;
  name: string;
  /** 印章头像上的一个字。 */
  seal: string;
  unlockLevel: number;
  greeting: string;
  /** 交情满档后的问候语变体。 */
  fondGreeting: string;
  /** 园中会出现的花种（取自订单里已出场人物的口味）。 */
  pool: string[];
}

/** 邻居取自订单文案里已出场的人物，保持世界观连贯（docs/UX.md 六）。 */
export const NEIGHBORS: NeighborDef[] = [
  {
    id: "sister",
    name: "邻家阿姊",
    seal: "姊",
    unlockLevel: 1,
    greeting: "进来坐坐？帮我浇两瓢水，看中哪枝花，尽管摘去。",
    fondGreeting: "又是你呀——园门给你留着，随意些。",
    pool: ["daisy", "peach", "orchid", "magnolia"],
  },
  {
    id: "teahouse",
    name: "茶寮掌柜",
    seal: "茶",
    unlockLevel: 3,
    greeting: "后院这几盆是佐茶用的，劳你搭把手，摘一枝去插瓶也好。",
    fondGreeting: "水刚烧上，先浇花后吃茶。",
    pool: ["jasmine", "chrys", "osmanthus", "lotus"],
  },
  {
    id: "hedge",
    name: "东篱客",
    seal: "篱",
    unlockLevel: 5,
    greeting: "采菊东篱下——篱边这几畦随你打理，看得上的自取。",
    fondGreeting: "老相识了，不必客气，径直去。",
    pool: ["chrys", "maple", "amaranth", "sunflower", "morning-glory"],
  },
];

const NEIGHBOR_MAP = new Map(NEIGHBORS.map((n) => [n.id, n]));

export function neighborDef(id: string): NeighborDef | undefined {
  return NEIGHBOR_MAP.get(id);
}

// ---------------------------------------------------------------------------
// 程序化园子：邻居 id + 游戏日作种，当日内重复进入所见一致（含互动痕迹）。
// ---------------------------------------------------------------------------

function hashSeed(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type NeighborStage = "empty" | "growing" | "bloom";

export interface NeighborPlot {
  idx: number;
  flowerId: string | null;
  stage: NeighborStage;
  /** 缺水（可帮浇）：growing 且当日未被浇过。 */
  thirsty: boolean;
  /** 当日已被帮浇。 */
  watered: boolean;
  /** 当日已被摘走，圃面挂「借花笺」。 */
  picked: boolean;
}

export interface NeighborGarden {
  def: NeighborDef;
  plots: NeighborPlot[];
  greeting: string;
  /** 当前还能帮浇几次（全局与单家上限取小）。 */
  waterLeft: number;
  /** 当前还能摘几枝（全局与单家上限取小）。 */
  pickLeft: number;
  /** 园中尚缺水的圃数。 */
  thirsty: number;
  /** 园中尚可摘的盛放花数。 */
  pickable: number;
  hearts: number;
  friendship: number;
}

const MIN_PLOTS = 4;
const MAX_PLOTS = 8;

/** 未接触过痕迹的原始园子；导出仅供测试与调试。 */
export function generateNeighborPlots(neighborId: string, day: number): NeighborPlot[] {
  const def = NEIGHBOR_MAP.get(neighborId);
  if (!def) return [];
  const rand = mulberry32(hashSeed(`${neighborId}#${day}`));
  const count = MIN_PLOTS + Math.floor(rand() * (MAX_PLOTS - MIN_PLOTS + 1));
  const plots: NeighborPlot[] = [];
  for (let idx = 0; idx < count; idx += 1) {
    const roll = rand();
    const flowerId = def.pool[Math.floor(rand() * def.pool.length)] ?? null;
    const stage: NeighborStage = roll < 0.24 ? "empty" : roll < 0.62 ? "growing" : "bloom";
    plots.push({
      idx,
      flowerId: stage === "empty" ? null : flowerId,
      stage,
      thirsty: stage === "growing",
      watered: false,
      picked: false,
    });
  }
  // 保底（同教程保底订单的思路）：至少 2 块有花、至少 1 块盛放可摘、至少 1 块缺水可浇——串门必有事可做
  const sow = (plot: NeighborPlot | undefined, stage: NeighborStage): void => {
    if (!plot) return;
    plot.stage = stage;
    plot.flowerId ??= def.pool[hashSeed(`${neighborId}#${day}#${plot.idx}`) % def.pool.length] ?? null;
    plot.thirsty = stage === "growing";
  };
  const flowered = (): NeighborPlot[] => plots.filter((p) => p.flowerId !== null);
  for (const plot of plots) {
    if (flowered().length >= 2) break;
    if (plot.flowerId === null) sow(plot, "growing");
  }
  if (!plots.some((p) => p.stage === "bloom")) sow(flowered()[0] ?? plots[0], "bloom");
  if (!plots.some((p) => p.thirsty)) {
    // 别把唯一那朵盛放的花改成含苞，否则「可摘」的保底反被这一手抹掉
    const blooms = plots.filter((p) => p.stage === "bloom").length;
    sow(
      plots.find((p) => p.flowerId !== null && (p.stage !== "bloom" || blooms > 1)) ??
        plots.find((p) => p.flowerId === null),
      "growing",
    );
  }
  return plots;
}

function tally(state: GameState, neighborId: string, kind: VisitMark["kind"]): number {
  let n = 0;
  for (const mark of state.social.marks) {
    if (mark.neighborId === neighborId && mark.kind === kind) n += 1;
  }
  return n;
}

/** 当日在这家园子里的战果，用于回园小结。 */
export function visitTally(state: GameState, neighborId: string): { water: number; pick: number } {
  return { water: tally(state, neighborId, "water"), pick: tally(state, neighborId, "pick") };
}

export function friendshipPoints(state: GameState, neighborId: string): number {
  return state.social.friendship[neighborId] ?? 0;
}

export function heartsOf(points: number): number {
  return Math.min(5, Math.floor(points / FRIENDSHIP_PER_HEART));
}

/**
 * 跨日结算：换了游戏日就把帮浇/摘花余量补满、抹去当日痕迹。
 * 所有对外 API 都先过这一道，于是玩家在园中跨日也能立刻拿到新余量。
 */
export function ensureSocialDay(state: GameState): boolean {
  const day = gameDay(state);
  if (state.social.day === day) return false;
  state.social.day = day;
  state.social.waterLeft = DAILY_WATER_HELP;
  state.social.pickLeft = DAILY_PICK;
  state.social.marks = [];
  return true;
}

function remainingWater(state: GameState, neighborId: string): number {
  return Math.max(0, Math.min(state.social.waterLeft, NEIGHBOR_WATER_CAP - tally(state, neighborId, "water")));
}

function remainingPick(state: GameState, neighborId: string): number {
  return Math.max(0, Math.min(state.social.pickLeft, NEIGHBOR_PICK_CAP - tally(state, neighborId, "pick")));
}

export function isNeighborUnlocked(state: GameState, def: NeighborDef): boolean {
  return state.level >= def.unlockLevel;
}

export interface NeighborEntry {
  def: NeighborDef;
  unlocked: boolean;
  hearts: number;
  friendship: number;
  waterLeft: number;
  pickLeft: number;
}

/** 访邻名册：未到阶的邻居也在列，剪影卡留个念想。 */
export function neighborRoster(state: GameState): NeighborEntry[] {
  ensureSocialDay(state);
  return NEIGHBORS.map((def) => ({
    def,
    unlocked: isNeighborUnlocked(state, def),
    hearts: heartsOf(friendshipPoints(state, def.id)),
    friendship: friendshipPoints(state, def.id),
    waterLeft: remainingWater(state, def.id),
    pickLeft: remainingPick(state, def.id),
  }));
}

/** 邻家园子的当日快照（含互动痕迹）；未解锁或无此人返回 null。 */
export function neighborGarden(state: GameState, neighborId: string): NeighborGarden | null {
  ensureSocialDay(state);
  const def = NEIGHBOR_MAP.get(neighborId);
  if (!def || !isNeighborUnlocked(state, def)) return null;
  const plots = generateNeighborPlots(neighborId, state.social.day);
  for (const mark of state.social.marks) {
    if (mark.neighborId !== neighborId) continue;
    const plot = plots[mark.plotIdx];
    if (!plot) continue;
    if (mark.kind === "water") {
      plot.watered = true;
      plot.thirsty = false;
    } else {
      plot.picked = true;
      plot.stage = "empty";
      plot.thirsty = false;
    }
  }
  const thirsty = plots.filter((p) => p.thirsty).length;
  const pickable = plots.filter((p) => p.stage === "bloom" && !p.picked).length;
  const waterLeft = remainingWater(state, neighborId);
  const pickLeft = remainingPick(state, neighborId);
  const friendship = friendshipPoints(state, neighborId);
  const idle = (thirsty === 0 || waterLeft === 0) && (pickable === 0 || pickLeft === 0);
  const greeting = idle
    ? "坐坐就好，明日再来帮衬。"
    : heartsOf(friendship) >= 5
      ? def.fondGreeting
      : def.greeting;
  return {
    def,
    plots,
    greeting,
    waterLeft,
    pickLeft,
    thirsty,
    pickable,
    hearts: heartsOf(friendship),
    friendship,
  };
}

function mark(state: GameState, entry: VisitMark): void {
  if (state.social.marks.length >= MARKS_CAP) return;
  state.social.marks.push(entry);
}

/** 交情长涨：每跨一档心送一枚装饰碎片，满档封顶。 */
export function addFriendship(state: GameState, neighborId: string, points: number): number {
  const def = NEIGHBOR_MAP.get(neighborId);
  const before = friendshipPoints(state, neighborId);
  const after = Math.min(FRIENDSHIP_MAX, before + Math.max(0, points));
  if (after === before) return before;
  state.social.friendship[neighborId] = after;
  const gained = heartsOf(after) - heartsOf(before);
  if (gained > 0 && def) {
    state.fragments += gained;
    emit({ type: "toast", text: `与${def.name}的交情涨到 ${heartsOf(after)} 心 · 得装饰碎片`, tone: "rare" });
  }
  return after;
}

/**
 * 帮邻居浇一瓢水：不耗自家水缸，涨交情与经验。
 * 受阻必有回声——每条失败路径都给一句缘由（docs/UX.md 6.6）。
 */
export function helpWater(state: GameState, neighborId: string, plotIdx: number): boolean {
  const garden = neighborGarden(state, neighborId);
  if (!garden) return false;
  const plot = garden.plots[plotIdx];
  if (!plot) return false;
  if (!plot.thirsty) {
    emit({ type: "toast", text: "这圃不缺水", tone: "warn" });
    return false;
  }
  if (state.social.waterLeft <= 0) {
    emit({ type: "toast", text: "今日帮浇的水够了，留点明日", tone: "warn" });
    return false;
  }
  if (tally(state, neighborId, "water") >= NEIGHBOR_WATER_CAP) {
    emit({ type: "toast", text: `${garden.def.name}园里今日的活儿干够了`, tone: "warn" });
    return false;
  }
  state.social.waterLeft -= 1;
  mark(state, { neighborId, plotIdx, kind: "water" });
  addFriendship(state, neighborId, WATER_FRIENDSHIP);
  addExp(state, WATER_EXP);
  emit({ type: "toast", text: `替${garden.def.name}浇了一瓢水 · 交情 +${WATER_FRIENDSHIP}`, tone: "ok" });
  return true;
}

/** 借花一枝：只摘盛放的，摘得的花与自家收获同规格入库。 */
export function pickNeighborFlower(state: GameState, neighborId: string, plotIdx: number): string | null {
  const garden = neighborGarden(state, neighborId);
  if (!garden) return null;
  const plot = garden.plots[plotIdx];
  if (!plot) return null;
  if (plot.stage !== "bloom" || plot.picked) {
    emit({ type: "toast", text: "花未开，摘不得", tone: "warn" });
    return null;
  }
  if (state.social.pickLeft <= 0) {
    emit({ type: "toast", text: `今日已借 ${DAILY_PICK} 枝，再摘要伤和气`, tone: "warn" });
    return null;
  }
  if (tally(state, neighborId, "pick") >= NEIGHBOR_PICK_CAP) {
    emit({ type: "toast", text: "一家只借一枝，去别家看看", tone: "warn" });
    return null;
  }
  const flowerId = plot.flowerId;
  if (!flowerId || !FLOWER_MAP[flowerId]) return null;
  state.social.pickLeft -= 1;
  mark(state, { neighborId, plotIdx, kind: "pick" });
  addItem(state, flowerId, 1);
  emit({ type: "toast", text: `借得一枝${FLOWER_MAP[flowerId]?.name ?? ""}`, tone: "rare" });
  return flowerId;
}

/** 回园小结的一句话；当日什么都没做则返回 null（不打扰）。 */
export function visitSummary(state: GameState, neighborId: string, before: { water: number; pick: number }): string | null {
  const now = visitTally(state, neighborId);
  const water = now.water - before.water;
  const pick = now.pick - before.pick;
  if (water <= 0 && pick <= 0) return null;
  const parts = ["串门小记"];
  if (water > 0) parts.push(`浇了 ${water} 瓢水`);
  if (pick > 0) parts.push(`借得 ${pick} 枝花`);
  if (water > 0) parts.push(`交情 +${water * WATER_FRIENDSHIP}`);
  return parts.join(" · ");
}

/** 家里是否有客将至（进邻家前的提醒）。 */
export function pressingOrders(state: GameState, withinMs = 30_000): number {
  return state.orders.filter((o) => o.dueAt - state.now <= withinMs).length;
}
