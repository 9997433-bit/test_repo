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
  /** 抽取权重（≥1）：居民常客 3~4、定制/绸缎 2、组团大单 1；数值越大越常见。 */
  weight: number;
  requireScore?: number;
  flowerIds?: string[];
  flowerCount?: number;
}

// 语义约定：flowerIds 为点名花材（可重复点同一种表示多枝）；
// flowerCount 超出点名部分的缺口按「任意花材」结算。
// 守则：coin > 0；timeMs > 10_000；点名花材的 unlockLevel ≤ 订单 minLevel；weight ≥ 1。
// 定价基准：居民单 coin ≈ 0.70~0.75 × 点名收成；绸缎单 ≈ 0.75~0.9 × 收成但水滴丰厚；
// 组团单 = 0.7 × 点名收成 + 任意补枝估值(≈15/枝) + 三成上下的组团溢价。
export const ORDER_TEMPLATES: OrderTemplate[] = [
  // —— 居民订单：花材简单，经验与水滴偏多 ——
  { id: "r-welcome", kind: "resident", title: "邻家阿姊要一束雏菊", hint: "任意雏菊即可", minLevel: 1, timeMs: 90_000, coin: 20, exp: 18, waterReward: 4, weight: 4, flowerIds: ["daisy"], flowerCount: 1 },
  { id: "r-tea", kind: "resident", title: "茶寮点了一枝茉莉", hint: "清香入盏", minLevel: 1, timeMs: 80_000, coin: 28, exp: 16, waterReward: 3, weight: 3, flowerIds: ["jasmine"], flowerCount: 1 },
  { id: "r-chrys", kind: "resident", title: "东篱客要秋菊", hint: "霜色正好", minLevel: 1, timeMs: 85_000, coin: 26, exp: 15, waterReward: 3, weight: 3, flowerIds: ["chrys"], flowerCount: 1 },
  { id: "r-morning", kind: "resident", title: "蒙学孩童讨牵牛花", hint: "要篱上初开的那朵", minLevel: 1, timeMs: 80_000, coin: 18, exp: 14, waterReward: 3, weight: 3, flowerIds: ["morning-glory"], flowerCount: 1 },
  { id: "r-yingchun", kind: "resident", title: "货郎沿街换迎春", hint: "冬日里的一点金", minLevel: 1, timeMs: 85_000, coin: 20, exp: 15, waterReward: 3, weight: 3, flowerIds: ["winter-jasmine"], flowerCount: 1 },
  { id: "r-inn", kind: "resident", title: "客栈折一枝碧桃", hint: "迎门要有春色", minLevel: 1, timeMs: 85_000, coin: 30, exp: 15, waterReward: 3, weight: 3, flowerIds: ["peach"], flowerCount: 1 },
  { id: "r-medicine", kind: "resident", title: "药铺收一枝并蒂莲", hint: "入药最是清心", minLevel: 2, timeMs: 95_000, coin: 70, exp: 20, waterReward: 4, weight: 3, flowerIds: ["lotus"], flowerCount: 1 },
  { id: "r-letter", kind: "resident", title: "驿使求水仙寄远", hint: "案头春信，随驿而去", minLevel: 2, timeMs: 90_000, coin: 22, exp: 16, waterReward: 4, weight: 3, flowerIds: ["narcissus"], flowerCount: 1 },
  { id: "r-shrine", kind: "resident", title: "山神祠供金桂", hint: "一枝秋香敬山神", minLevel: 3, timeMs: 100_000, coin: 66, exp: 21, waterReward: 4, weight: 3, flowerIds: ["osmanthus"], flowerCount: 1 },
  { id: "r-temple", kind: "resident", title: "山寺供一枝山茶", hint: "雪里那点红，佛前最静", minLevel: 4, timeMs: 100_000, coin: 68, exp: 22, waterReward: 5, weight: 3, flowerIds: ["camellia"], flowerCount: 1 },
  { id: "r-wine", kind: "resident", title: "酒坊酿桂需双枝", hint: "金桂两枝，秋酿一坛", minLevel: 4, timeMs: 130_000, coin: 130, exp: 34, waterReward: 6, weight: 2, flowerIds: ["osmanthus", "osmanthus"], flowerCount: 2 },
  { id: "r-healer", kind: "resident", title: "郎中重金求雪莲", hint: "崖上冰雪，救一场高热", minLevel: 9, timeMs: 140_000, coin: 135, exp: 36, waterReward: 8, weight: 2, flowerIds: ["snow-lotus"], flowerCount: 1 },
  { id: "r-stargazer", kind: "resident", title: "观星台求星辰郁金香", hint: "以花验一页星图", minLevel: 10, timeMs: 130_000, coin: 228, exp: 44, waterReward: 6, weight: 2, flowerIds: ["star-tulip"], flowerCount: 1 },
  // —— 花艺定制：凭作品评分交付 ——
  { id: "c-teahouse", kind: "custom", title: "茶寮案头小景", hint: "作品评分 ≥ 60", minLevel: 1, timeMs: 110_000, coin: 50, exp: 20, waterReward: 5, weight: 3, requireScore: 60 },
  { id: "c-spring", kind: "custom", title: "春日花笺定制", hint: "作品评分 ≥ 70", minLevel: 2, timeMs: 120_000, coin: 80, exp: 28, waterReward: 6, weight: 2, requireScore: 70 },
  { id: "c-gallery", kind: "custom", title: "藏家指名精品", hint: "作品评分 ≥ 75", minLevel: 6, timeMs: 130_000, coin: 120, exp: 32, waterReward: 7, weight: 2, requireScore: 75 },
  { id: "c-ink", kind: "custom", title: "墨雅厅堂陈列", hint: "作品评分 ≥ 85", minLevel: 5, timeMs: 150_000, coin: 160, exp: 40, waterReward: 8, weight: 2, requireScore: 85 },
  { id: "c-master", kind: "custom", title: "行会宗师家宴", hint: "作品评分 ≥ 92", minLevel: 9, timeMs: 200_000, coin: 300, exp: 70, waterReward: 10, weight: 1, requireScore: 92 },
  // —— 绸缎/建材：金币平平，水滴丰厚 ——
  { id: "s-ribbon", kind: "silk", title: "绸缎行换花", hint: "交付两枝任意花材", minLevel: 3, timeMs: 100_000, coin: 60, exp: 12, waterReward: 10, weight: 3, flowerCount: 2 },
  { id: "s-brocade", kind: "silk", title: "绸缎庄大宗收花", hint: "任意四枝，织样上新", minLevel: 5, timeMs: 140_000, coin: 96, exp: 18, waterReward: 14, weight: 2, flowerCount: 4 },
  { id: "s-fan", kind: "silk", title: "扇坊求睡莲纹样", hint: "一枝睡莲，扇面生凉", minLevel: 7, timeMs: 130_000, coin: 150, exp: 26, waterReward: 12, weight: 2, flowerIds: ["waterlily"], flowerCount: 1 },
  { id: "s-dye", kind: "silk", title: "染坊求两味艳色", hint: "彼岸花与雁来红各一", minLevel: 8, timeMs: 150_000, coin: 200, exp: 30, waterReward: 16, weight: 2, flowerIds: ["spider-lily", "amaranth"], flowerCount: 2 },
  { id: "s-firedye", kind: "silk", title: "染坊窨制焰色", hint: "焰火莲与彼岸花各一", minLevel: 13, timeMs: 170_000, coin: 390, exp: 48, waterReward: 18, weight: 1, flowerIds: ["flame-lotus", "spider-lily"], flowerCount: 2 },
  // —— 组团订单：量大限紧，赏金最高 ——
  { id: "g-banquet", kind: "group", title: "花园盛会备花", hint: "牡丹一枝坐镇，再添两枝盛装", minLevel: 6, timeMs: 180_000, coin: 240, exp: 55, waterReward: 12, weight: 1, flowerIds: ["peony"], flowerCount: 3 },
  { id: "g-lantern", kind: "group", title: "上元灯会扎花山", hint: "迎春、水仙、墨梅各一", minLevel: 6, timeMs: 190_000, coin: 260, exp: 58, waterReward: 12, weight: 1, flowerIds: ["winter-jasmine", "narcissus", "plum"], flowerCount: 3 },
  { id: "g-wedding", kind: "group", title: "喜宴百花轿", hint: "牡丹山茶各一，再添两枝喜色", minLevel: 7, timeMs: 170_000, coin: 280, exp: 60, waterReward: 10, weight: 1, flowerIds: ["peony", "camellia"], flowerCount: 4 },
  { id: "g-poets", kind: "group", title: "诗社秋夜雅集", hint: "星辰郁金香领衔，共六枝", minLevel: 10, timeMs: 220_000, coin: 400, exp: 80, waterReward: 12, weight: 1, flowerIds: ["star-tulip"], flowerCount: 6 },
  { id: "g-dawnfeast", kind: "group", title: "晨光雅集捧霞", hint: "朝霞海棠领衔，再添两枝晨色", minLevel: 11, timeMs: 200_000, coin: 330, exp: 68, waterReward: 12, weight: 1, flowerIds: ["dawn-begonia"], flowerCount: 3 },
  { id: "g-rosewedding", kind: "group", title: "梦幻婚典百花轿", hint: "梦幻玫瑰坐镇，山茶相衬，共五枝", minLevel: 12, timeMs: 240_000, coin: 430, exp: 82, waterReward: 12, weight: 1, flowerIds: ["dream-rose", "camellia"], flowerCount: 5 },
];

// ---------- 连环剧情单「百花盛会」（五折） ----------
// 与常驻模板分池：不进 ORDER_TEMPLATES，不参与随机抽取与同款去重。
// 语义：一次只挂一折，交付第 n 折后放出第 n+1 折；超时不扣口碑、原折顺延重挂
//（自家盛会的客人不会拂袖而去）。守则与常驻模板一致（coin > 0；timeMs > 10_000；
// 点名花材解锁阶 ≤ 本折 minLevel），另循 chapter 从 1 起严格递增、minLevel 非降。
// 奖励按一次性里程碑标定：全链合计 1305 金 / 260 经验，压轴 530 金高出常驻榜首
//（430 金）属有意为之。接线见 docs/GDD.md「Round 3 接线清单 D」。
export interface StoryOrderTemplate extends OrderTemplate {
  /** 第几折（从 1 起、严格递增）；交付第 n 折才放出第 n+1 折。 */
  chapter: number;
  /** 折子引文：挂单时的剧情一句，UI 可放在订单卡 hint 之上（可选展示）。 */
  prologue: string;
}

export const STORY_CHAIN: StoryOrderTemplate[] = [
  { id: "story-invite", chapter: 1, kind: "resident", title: "里正送来盛会请帖", hint: "以一枝墨梅回帖应约", prologue: "县里要办百花盛会。里正亲自登门：「废园重开的事，满城都传遍了——请帖在此，望花坊以花回帖。」", minLevel: 5, timeMs: 150_000, coin: 125, exp: 30, waterReward: 5, weight: 1, flowerIds: ["plum"], flowerCount: 1 },
  { id: "story-trial", chapter: 2, kind: "custom", title: "花行行首来试手艺", hint: "作品评分 ≥ 75", prologue: "花行行首闻讯而来，要亲眼看看回帖之人的本事。「盛会不收虚名，插一瓶给我看。」", minLevel: 6, timeMs: 160_000, coin: 130, exp: 34, waterReward: 7, weight: 1, requireScore: 75 },
  { id: "story-brocade", chapter: 3, kind: "silk", title: "绸缎庄为彩楼收花", hint: "睡莲定纹样，再添两枝任意花材", prologue: "盛会彩楼要披十丈锦。绸缎庄掌柜指名睡莲入纹样：「池光入锦，彩楼才算活了。」", minLevel: 7, timeMs: 170_000, coin: 170, exp: 30, waterReward: 14, weight: 1, flowerIds: ["waterlily"], flowerCount: 3 },
  { id: "story-parade", chapter: 4, kind: "group", title: "盛会前夜扎迎宾花轿", hint: "牡丹坐镇、彼岸花压色，共四枝", prologue: "会期前夜，四乡宾客的花轿都聚到城门。管事的只有一句话：「头一顶轿子，要让人一眼记住。」", minLevel: 8, timeMs: 210_000, coin: 350, exp: 66, waterReward: 12, weight: 1, flowerIds: ["peony", "spider-lily"], flowerCount: 4 },
  { id: "story-gala", chapter: 5, kind: "group", title: "百花盛会压轴大作", hint: "星辰郁金香与牡丹领衔，共六枝", prologue: "盛会当日，主台交给了你。满城看花人翘首：从荒园到今日，这一瓶，是花坊的答卷。", minLevel: 10, timeMs: 260_000, coin: 530, exp: 100, waterReward: 15, weight: 1, flowerIds: ["star-tulip", "peony"], flowerCount: 6 },
];

/**
 * 下一折剧情单：chaptersDone 为已交付折数（存档 storyChapter），
 * 等级未到或全链完结返回 undefined。纯函数，便于接线与测试。
 */
export function nextStoryChapter(chaptersDone: number, level: number): StoryOrderTemplate | undefined {
  const next = STORY_CHAIN[chaptersDone];
  return next && next.minLevel <= level ? next : undefined;
}

/**
 * 按 weight 从候选池中抽一张模板（roll ∈ [0,1)，由调用方注入随机数，保持纯函数可测）。
 * 接线（systems/orders.ts spawnOrders）：把 `pool[Math.floor(Math.random() * pool.length)]`
 * 换成 `pickWeighted(pool, Math.random())` 即可，去重与兜底逻辑不变。
 */
export function pickWeighted<T extends { weight: number }>(pool: T[], roll: number): T | undefined {
  if (pool.length === 0) return undefined;
  const total = pool.reduce((sum, t) => sum + Math.max(0, t.weight), 0);
  if (total <= 0) return pool[0];
  let acc = 0;
  const target = Math.min(Math.max(roll, 0), 0.999_999) * total;
  for (const t of pool) {
    acc += Math.max(0, t.weight);
    if (target < acc) return t;
  }
  return pool[pool.length - 1];
}
