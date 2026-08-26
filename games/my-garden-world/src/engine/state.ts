import { FLOWERS, type GrowthStage, type Season } from "../data/flowers";
import type { DecorTheme } from "../data/decorations";
import type { OrderKind } from "../data/orders";

/**
 * v2：新增 lastSeenAt 墙钟锚点（离线补算），并在迁移时按等级回填 unlockedFlowers。
 * v3：新增 social（邻家花园互访）、decorAnchors（锚位摆放）、decorTheme（全局主题）、
 *     seenTips（一次性提示）；迁移时给存量陈设补默认锚位。
 */
export const SCHEMA_VERSION = 3;
export const INITIAL_PLOTS = 6;
export const MAX_PLOTS = 12;
export const WATER_CAP = 40;
export const WATER_REGEN_MS = 8_000;

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

/** 当日在邻家留下的一处痕迹：n 邻居 id、p 花圃下标、k 帮浇 / 摘花。 */
export interface SocialMark {
  n: string;
  p: number;
  k: "water" | "pick";
}

export interface SocialState {
  /** 游戏日戳（90 秒一日），跨日清空当日痕迹。 */
  day: number;
  /** 邻居 id → 友谊值；每 6 点一心，五心（30）封顶。 */
  friendship: Record<string, number>;
  marks: SocialMark[];
}

export function emptySocial(): SocialState {
  return { day: 0, friendship: {}, marks: [] };
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
  /** 已购陈设（购入即计心境加成；是否入景看 decorAnchors）。 */
  placedDecor: string[];
  /** 陈设落位：decorId → 锚位 id；不在表内的已购陈设「在匣」不入景。 */
  decorAnchors: Record<string, string>;
  /** 玩家最后套用的主题（[data-theme] 全局主题层），未套用为 null。 */
  decorTheme: DecorTheme | null;
  social: SocialState;
  /** 一次性提示的已读标记（如 "sound"）。 */
  seenTips: string[];
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
    decorAnchors: {},
    decorTheme: null,
    social: emptySocial(),
    seenTips: [],
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
