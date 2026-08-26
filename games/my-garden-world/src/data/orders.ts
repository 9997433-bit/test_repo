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

// 语义约定：flowerIds 为点名花材（可重复点同一种表示多枝）；
// flowerCount 超出点名部分的缺口按「任意花材」结算。
// 守则：coin > 0；timeMs > 10_000；点名花材的 unlockLevel ≤ 订单 minLevel。
export const ORDER_TEMPLATES: OrderTemplate[] = [
  // —— 居民订单：花材简单，经验与水滴偏多 ——
  { id: "r-welcome", kind: "resident", title: "邻家阿姊要一束雏菊", hint: "任意雏菊即可", minLevel: 1, timeMs: 90_000, coin: 20, exp: 18, waterReward: 4, flowerIds: ["daisy"], flowerCount: 1 },
  { id: "r-tea", kind: "resident", title: "茶寮点了一枝茉莉", hint: "清香入盏", minLevel: 1, timeMs: 80_000, coin: 28, exp: 16, waterReward: 3, flowerIds: ["jasmine"], flowerCount: 1 },
  { id: "r-chrys", kind: "resident", title: "东篱客要秋菊", hint: "霜色正好", minLevel: 1, timeMs: 85_000, coin: 26, exp: 15, waterReward: 3, flowerIds: ["chrys"], flowerCount: 1 },
  { id: "r-morning", kind: "resident", title: "蒙学孩童讨牵牛花", hint: "要篱上初开的那朵", minLevel: 1, timeMs: 80_000, coin: 18, exp: 14, waterReward: 3, flowerIds: ["morning-glory"], flowerCount: 1 },
  { id: "r-yingchun", kind: "resident", title: "货郎沿街换迎春", hint: "冬日里的一点金", minLevel: 1, timeMs: 85_000, coin: 20, exp: 15, waterReward: 3, flowerIds: ["winter-jasmine"], flowerCount: 1 },
  { id: "r-medicine", kind: "resident", title: "药铺收一枝并蒂莲", hint: "入药最是清心", minLevel: 2, timeMs: 95_000, coin: 70, exp: 20, waterReward: 4, flowerIds: ["lotus"], flowerCount: 1 },
  { id: "r-letter", kind: "resident", title: "驿使求水仙寄远", hint: "案头春信，随驿而去", minLevel: 2, timeMs: 90_000, coin: 22, exp: 16, waterReward: 4, flowerIds: ["narcissus"], flowerCount: 1 },
  { id: "r-temple", kind: "resident", title: "山寺供一枝山茶", hint: "雪里那点红，佛前最静", minLevel: 4, timeMs: 100_000, coin: 68, exp: 22, waterReward: 5, flowerIds: ["camellia"], flowerCount: 1 },
  { id: "r-wine", kind: "resident", title: "酒坊酿桂需双枝", hint: "金桂两枝，秋酿一坛", minLevel: 4, timeMs: 130_000, coin: 130, exp: 34, waterReward: 6, flowerIds: ["osmanthus", "osmanthus"], flowerCount: 2 },
  // —— 花艺定制：凭作品评分交付 ——
  { id: "c-teahouse", kind: "custom", title: "茶寮案头小景", hint: "作品评分 ≥ 60", minLevel: 1, timeMs: 110_000, coin: 50, exp: 20, waterReward: 5, requireScore: 60 },
  { id: "c-spring", kind: "custom", title: "春日花笺定制", hint: "作品评分 ≥ 70", minLevel: 2, timeMs: 120_000, coin: 80, exp: 28, waterReward: 6, requireScore: 70 },
  { id: "c-ink", kind: "custom", title: "墨雅厅堂陈列", hint: "作品评分 ≥ 85", minLevel: 5, timeMs: 150_000, coin: 160, exp: 40, waterReward: 8, requireScore: 85 },
  { id: "c-master", kind: "custom", title: "行会宗师家宴", hint: "作品评分 ≥ 92", minLevel: 8, timeMs: 200_000, coin: 300, exp: 70, waterReward: 10, requireScore: 92 },
  // —— 绸缎/建材：金币平平，水滴丰厚 ——
  { id: "s-ribbon", kind: "silk", title: "绸缎行换花", hint: "交付两枝任意花材", minLevel: 3, timeMs: 100_000, coin: 60, exp: 12, waterReward: 10, flowerCount: 2 },
  { id: "s-brocade", kind: "silk", title: "绸缎庄大宗收花", hint: "任意四枝，织样上新", minLevel: 5, timeMs: 140_000, coin: 96, exp: 18, waterReward: 14, flowerCount: 4 },
  { id: "s-dye", kind: "silk", title: "染坊求两味艳色", hint: "彼岸花与雁来红各一", minLevel: 8, timeMs: 150_000, coin: 200, exp: 30, waterReward: 16, flowerIds: ["spider-lily", "amaranth"], flowerCount: 2 },
  // —— 组团订单：量大限紧，赏金最高 ——
  { id: "g-banquet", kind: "group", title: "花园盛会备花", hint: "牡丹一枝坐镇，再添两枝盛装", minLevel: 6, timeMs: 180_000, coin: 240, exp: 55, waterReward: 12, flowerIds: ["peony"], flowerCount: 3 },
  { id: "g-lantern", kind: "group", title: "上元灯会扎花山", hint: "迎春、水仙、墨梅各一", minLevel: 6, timeMs: 190_000, coin: 260, exp: 58, waterReward: 12, flowerIds: ["winter-jasmine", "narcissus", "plum"], flowerCount: 3 },
  { id: "g-wedding", kind: "group", title: "喜宴百花轿", hint: "牡丹山茶各一，再添两枝喜色", minLevel: 7, timeMs: 170_000, coin: 280, exp: 60, waterReward: 10, flowerIds: ["peony", "camellia"], flowerCount: 4 },
  { id: "g-poets", kind: "group", title: "诗社秋夜雅集", hint: "星辰郁金香领衔，共六枝", minLevel: 10, timeMs: 220_000, coin: 400, exp: 80, waterReward: 12, flowerIds: ["star-tulip"], flowerCount: 6 },
];
