import { FLOWERS, type GrowthStage, type Season } from "../data/flowers";
import type { OrderKind } from "../data/orders";

export const SCHEMA_VERSION = 1;
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

export interface GameState {
  schemaVersion: number;
  startedAt: number;
  now: number;
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
