import type { DecorTheme } from "../data/decorations";
import { FLOWERS, type GrowthStage, type Season } from "../data/flowers";
import type { OrderKind } from "../data/orders";

/**
 * v2：新增 lastSeenAt 墙钟锚点（离线补算），并在迁移时按等级回填 unlockedFlowers。
 * v3：新增 social（邻家花园互访的每日余量与交情）与 decorTheme（最后套用的主题，驱动 [data-theme]）。
 */
export const SCHEMA_VERSION = 3;
export const INITIAL_PLOTS = 6;
export const MAX_PLOTS = 12;
export const WATER_CAP = 40;
export const WATER_REGEN_MS = 8_000;
/** 每日帮邻居浇水的总次数（单个邻居另有 NEIGHBOR_WATER_CAP 上限）。 */
export const DAILY_WATER_HELP = 6;
/** 每日摘邻家花的总枝数（单个邻居另有 NEIGHBOR_PICK_CAP 上限）。 */
export const DAILY_PICK = 2;
/** 交情点数上限（满档 5 心）。 */
export const FRIENDSHIP_MAX = 30;
/** 当日痕迹条数上限：一天的互动量远小于它，纯粹兜住改档与旧档。 */
export const MARKS_CAP = 64;

export interface Plot {
  id: number;
  flowerId: string | null;
  stage: GrowthStage;
  plantedAt: number;
  watered: number;
  fertilized: boolean;
  lastTick: number;
}

export interface ActiveOrder {
  uid: string;
  templateId: string;
  kind: OrderKind;
  title: string;
  hint: string;
  dueAt: number;
  coin: number;
  exp: number;
  waterReward: number;
  requireScore?: number;
  flowerIds?: string[];
  flowerCount?: number;
}

export interface Arrangement {
  id: string;
  vase: string;
  flowerIds: string[];
  score: number;
  name: string;
  createdAt: number;
}

/** 当日在某位邻居园中留下的一处痕迹：浇过的圃、摘过的花。 */
export interface VisitMark {
  neighborId: string;
  plotIdx: number;
  kind: "water" | "pick";
}

/** 邻里往来：每日余量跨日重置，交情长期累积，痕迹保证当日重进园子所见一致。 */
export interface SocialState {
  /** 上次结算的游戏日戳（engine/time.ts 的 gameDay）。 */
  day: number;
  waterLeft: number;
  pickLeft: number;
  /** 邻居 id → 交情点数（0..FRIENDSHIP_MAX）。 */
  friendship: Record<string, number>;
  marks: VisitMark[];
}

export function createSocialState(day = 0): SocialState {
  return { day, waterLeft: DAILY_WATER_HELP, pickLeft: DAILY_PICK, friendship: {}, marks: [] };
}

export interface GameState {
  schemaVersion: number;
  startedAt: number;
  /** 游戏内模拟时钟（只被主循环 / 离线补算推进）。 */
  now: number;
  /** 最后一次在线的墙钟时刻，用来算离园时长。 */
  lastSeenAt: number;
  coins: number;
  water: number;
  waterAcc: number;
  exp: number;
  level: number;
  nectar: number;
  fragments: number;
  reputation: number;
  season: Season;
  dayMinute: number;
  plots: Plot[];
  inventory: Record<string, number>;
  unlockedFlowers: string[];
  orders: ActiveOrder[];
  arrangements: Arrangement[];
  placedDecor: string[];
  /** 最后一次套用的装扮主题；驱动根节点 [data-theme] 令牌，未套用则为 null。 */
  decorTheme: DecorTheme | null;
  social: SocialState;
  activeSpirit: string | null;
  unlockedSpirits: string[];
  tutorialStep: number;
  tutorialDone: boolean;
  quests: { id: string; progress: number; done: boolean }[];
  stats: {
    harvested: number;
    ordersDone: number;
    cancelled: number;
    planted: number;
  };
}

export function xpToLevel(level: number): number {
  return Math.round(40 + level * 28 + level * level * 6);
}

export function emptyPlot(id: number): Plot {
  return {
    id,
    flowerId: null,
    stage: "empty",
    plantedAt: 0,
    watered: 0,
    fertilized: false,
    lastTick: 0,
  };
}

export function createInitialState(now = Date.now()): GameState {
  return {
    schemaVersion: SCHEMA_VERSION,
    startedAt: now,
    now,
    lastSeenAt: now,
    coins: 60,
    water: 16,
    waterAcc: 0,
    exp: 0,
    level: 1,
    nectar: 0,
    fragments: 2,
    reputation: 70,
    season: "spring",
    dayMinute: 9 * 60,
    plots: Array.from({ length: INITIAL_PLOTS }, (_, i) => emptyPlot(i)),
    inventory: {},
    unlockedFlowers: FLOWERS.filter((f) => f.unlockLevel <= 1).map((f) => f.id),
    orders: [],
    arrangements: [],
    placedDecor: [],
    decorTheme: null,
    social: createSocialState(),
    activeSpirit: null,
    unlockedSpirits: [],
    tutorialStep: 0,
    tutorialDone: false,
    quests: [
      { id: "plant3", progress: 0, done: false },
      { id: "harvest3", progress: 0, done: false },
      { id: "order1", progress: 0, done: false },
    ],
    stats: { harvested: 0, ordersDone: 0, cancelled: 0, planted: 0 },
  };
}

export function cloneState(state: GameState): GameState {
  return structuredClone(state);
}
