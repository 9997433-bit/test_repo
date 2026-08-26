export type OrderKind = "resident" | "custom" | "silk" | "group";

export interface OrderTemplate {
  id: string;
  kind: OrderKind;
  title: string;
  hint: string;
  minLevel: number;
  timeMs: number;
  coin: number;
  exp: number;
  waterReward: number;
  requireScore?: number;
  flowerIds?: string[];
  flowerCount?: number;
}

export const ORDER_TEMPLATES: OrderTemplate[] = [
  { id: "r-welcome", kind: "resident", title: "邻家阿姊要一束雏菊", hint: "任意雏菊即可", minLevel: 1, timeMs: 90_000, coin: 20, exp: 18, waterReward: 4, flowerIds: ["daisy"], flowerCount: 1 },
  { id: "r-tea", kind: "resident", title: "茶寮点了一枝茉莉", hint: "清香入盏", minLevel: 1, timeMs: 80_000, coin: 28, exp: 16, waterReward: 3, flowerIds: ["jasmine"], flowerCount: 1 },
  { id: "r-chrys", kind: "resident", title: "东篱客要秋菊", hint: "霜色正好", minLevel: 1, timeMs: 85_000, coin: 26, exp: 15, waterReward: 3, flowerIds: ["chrys"], flowerCount: 1 },
  { id: "c-spring", kind: "custom", title: "春日花笺定制", hint: "作品评分 ≥ 70", minLevel: 2, timeMs: 120_000, coin: 80, exp: 28, waterReward: 6, requireScore: 70 },
  { id: "c-ink", kind: "custom", title: "墨雅厅堂陈列", hint: "作品评分 ≥ 85", minLevel: 5, timeMs: 150_000, coin: 160, exp: 40, waterReward: 8, requireScore: 85 },
  { id: "s-ribbon", kind: "silk", title: "绸缎行换花", hint: "交付两枝任意花材", minLevel: 3, timeMs: 100_000, coin: 60, exp: 12, waterReward: 10, flowerCount: 2 },
  { id: "g-banquet", kind: "group", title: "花园盛会备花", hint: "三枝当季高阶花材", minLevel: 6, timeMs: 180_000, coin: 240, exp: 55, waterReward: 12, flowerCount: 3 },
];
