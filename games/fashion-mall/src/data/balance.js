export const TICK_MS = 250;

export const LEVEL_INCOME_GATES = [0, 800, 4000, 20000, 100000, 600000, 3000000];
export const LEVEL_XP_GATES = [0, 20, 60, 140, 300, 620, 1280];

export const SHOPS = [
  {
    id: "fastfood",
    name: "星光快餐",
    specialty: "休闲",
    unlockLevel: 1,
    base: 12,
    growth: 1.18,
    staffSlots: 3,
    color: "#ffb4c8",
    emoji: "🍔",
    blurb: "从热油与番茄酱开始的第一桶金",
  },
  {
    id: "fresh",
    name: "晨光生鲜",
    specialty: "购物",
    unlockLevel: 2,
    base: 22,
    growth: 1.2,
    staffSlots: 3,
    color: "#9be7c4",
    emoji: "🥬",
    blurb: "接住当季，货架就会自己唱歌",
  },
  {
    id: "boutique",
    name: "缪斯服装",
    specialty: "丽人",
    unlockLevel: 3,
    base: 36,
    growth: 1.22,
    staffSlots: 4,
    color: "#e8c37a",
    emoji: "👗",
    blurb: "把顾客脑中的灵感画成一套衣服",
  },
  {
    id: "blindbox",
    name: "盲盒潮玩",
    specialty: "娱乐",
    unlockLevel: 4,
    base: 48,
    growth: 1.23,
    staffSlots: 3,
    color: "#c9b6ff",
    emoji: "🎁",
    blurb: "隐藏款会改变整层楼的排队曲线",
  },
  {
    id: "fortune",
    name: "星语占卜",
    specialty: "娱乐",
    unlockLevel: 5,
    base: 64,
    growth: 1.24,
    staffSlots: 2,
    color: "#9ad4ff",
    emoji: "🔮",
    blurb: "通关转盘可兑换招募碎片",
  },
];

export const PARTNERS = [
  { id: "lin", name: "林澄", specialty: "休闲", title: "金牌店长", story: "把翻台率做成了艺术。" },
  { id: "su", name: "苏晚", specialty: "购物", title: "买手总监", story: "只选会自己走路的货。" },
  { id: "ye", name: "叶织", specialty: "丽人", title: "天才设计师", story: "素描本里藏着下季流行。" },
  { id: "jo", name: "周漾", specialty: "娱乐", title: "营销操盘", story: "一条短视频顶一周广告。" },
  { id: "an", name: "安祈", specialty: "娱乐", title: "占卜顾问", story: "她从不剧透结局，只抬客单价。" },
  { id: "kai", name: "江澄乐", specialty: "丽人", title: "偶像代言", story: "签约后整座城都在讨论橱窗。" },
];

export const OUTFITS = {
  hair: [
    { id: "bob", name: "杏核短发", charm: 8 },
    { id: "long", name: "蜜茶长卷", charm: 12 },
    { id: "high", name: "星钻高马尾", charm: 16 },
  ],
  top: [
    { id: "tee", name: "奶油针织", charm: 6 },
    { id: "blazer", name: "玫瑰西装", charm: 14 },
    { id: "gown", name: "香槟晚礼服", charm: 22 },
  ],
  bottom: [
    { id: "skirt", name: "百褶短裙", charm: 7 },
    { id: "slacks", name: "燕麦西裤", charm: 11 },
    { id: "silk", name: "流光长裙", charm: 18 },
  ],
  shoes: [
    { id: "sneaker", name: "云朵板鞋", charm: 5 },
    { id: "heel", name: "细闪高跟", charm: 13 },
    { id: "boot", name: "法式短靴", charm: 10 },
  ],
  acc: [
    { id: "none", name: "素颜出门", charm: 0 },
    { id: "pearl", name: "珍珠耳钉", charm: 9 },
    { id: "crown", name: "时代细冠", charm: 20 },
  ],
};

export const FURNITURE = [
  { id: "sofa", name: "复古丝绒沙发", bonus: 0.06, room: "living" },
  { id: "lamp", name: "琥珀落地灯", bonus: 0.03, room: "living" },
  { id: "vanity", name: "贝壳梳妆台", bonus: 0.05, room: "studio" },
  { id: "piano", name: "奶油三角琴", bonus: 0.08, room: "studio" },
  { id: "tub", name: "玫瑰金浴缸", bonus: 0.07, room: "spa" },
  { id: "garden", name: "空中花房", bonus: 0.1, room: "spa" },
];

export const RESEARCH_NODES = [
  { id: "line-a", name: "中央厨房流水线", cost: 400, income: 8 },
  { id: "line-b", name: "冷链分拣", cost: 1800, income: 22 },
  { id: "line-c", name: "联名包装厂", cost: 9000, income: 70 },
  { id: "line-d", name: "城市配送枢纽", cost: 42000, income: 210 },
];

export function shopRate(shop, level, staffFilled, partnerBonus, charm) {
  const safeLevel = Math.max(1, level);
  return (
    shop.base *
    shop.growth ** (safeLevel - 1) *
    (1 + staffFilled * 0.12) *
    (1 + partnerBonus) *
    (1 + charm * 0.002)
  );
}

export function offlineGold(onlinePerSec, hoursAway, furnitureBonus) {
  const capped = Math.min(Math.max(hoursAway, 0), 8);
  return onlinePerSec * 0.65 * capped * 3600 * (1 + furnitureBonus);
}

export function partnerShopBonus(partnerSpecialty, shopSpecialty, partnerLevel) {
  const match = partnerSpecialty === shopSpecialty ? 0.6 : 0.15;
  return match * (1 + (partnerLevel - 1) * 0.08);
}

export function nextLevelReady(level, goldEarned, xp) {
  const next = level;
  if (next >= LEVEL_INCOME_GATES.length) return false;
  return goldEarned >= LEVEL_INCOME_GATES[next] && xp >= LEVEL_XP_GATES[next];
}

/* ── 小游戏赏金表（唯一口径，Round 2 起视图一律查表，禁止内联数值）──
 * 技巧型（fastfood/fresh/boutique）：正收益，由操作耗时与技巧上限约束产出。
 * 付费随机型（blindbox/fortune）：金币期望必须 < 成本（RTP ≤ 85%，测试守护），
 * 抽水换来的是招募碎片与阅历——随机玩法只承载碎片/惊喜，不承载金币产出。 */
export const MINIGAME_PAYOUTS = {
  fastfood: { tipBase: 28, tipPerItem: 12, xp: 2 },
  fresh: { goldPerCatch: 18, catchesPerXp: 3 },
  boutique: { base: 40, perScore: 35, xpBase: 3, xpPerScore: 1 },
  blindbox: {
    cost: 60,
    xp: 1,
    pool: [
      { id: "common", name: "普通亚克力立牌", w: 55, gold: 18, shard: 0 },
      { id: "rare", name: "稀有闪卡", w: 30, gold: 45, shard: 0 },
      { id: "hidden", name: "隐藏款手办", w: 12, gold: 100, shard: 1 },
      { id: "sign", name: "城主签名隐藏", w: 3, gold: 280, shard: 3 },
    ],
  },
  fortune: {
    cost: 30,
    xp: 2,
    slots: [
      { id: "daji", name: "大吉", gold: 40, shard: 1, good: true },
      { id: "taohua", name: "桃花", gold: 30, shard: 0, good: true },
      { id: "piancai", name: "偏财", gold: 36, shard: 0, good: true },
      { id: "pingwen", name: "平稳", gold: 10, shard: 0, good: false },
      { id: "xiaoxiong", name: "小凶", gold: 0, shard: 0, good: false },
      { id: "qiyu", name: "奇遇", gold: 27, shard: 0, good: true },
    ],
  },
};

export const PARTNER_SIGN_SHARDS = 3;

export function fastfoodTip(orderSize) {
  const p = MINIGAME_PAYOUTS.fastfood;
  return { gold: p.tipBase + orderSize * p.tipPerItem, xp: p.xp };
}

export function freshPayout(caught) {
  const p = MINIGAME_PAYOUTS.fresh;
  return { gold: p.goldPerCatch * caught, xp: Math.ceil(caught / p.catchesPerXp) };
}

export function boutiquePayout(score) {
  const p = MINIGAME_PAYOUTS.boutique;
  return { gold: p.base + score * p.perScore, xp: p.xpBase + score * p.xpPerScore };
}

// rand01 ∈ [0,1)，由调用方注入（视图传 Math.random()），保证公式层可确定性测试
export function blindboxRoll(rand01) {
  const { pool } = MINIGAME_PAYOUTS.blindbox;
  const total = pool.reduce((s, p) => s + p.w, 0);
  let acc = 0;
  for (const prize of pool) {
    acc += prize.w;
    if (rand01 * total < acc) return prize;
  }
  return pool[pool.length - 1];
}

export function fortuneSpin(rand01) {
  const { slots } = MINIGAME_PAYOUTS.fortune;
  const idx = Math.min(slots.length - 1, Math.max(0, Math.floor(rand01 * slots.length)));
  return slots[idx];
}

// 付费随机玩法的精确期望（供测试断言与 UI 概率公示）
export function paidGameExpectation(id) {
  const cfg = MINIGAME_PAYOUTS[id];
  const entries = cfg.pool || cfg.slots;
  const total = entries.reduce((s, e) => s + (e.w ?? 1), 0);
  const gold = entries.reduce((s, e) => s + (e.w ?? 1) * e.gold, 0) / total;
  const shard = entries.reduce((s, e) => s + (e.w ?? 1) * (e.shard || 0), 0) / total;
  return { cost: cfg.cost, gold, shard, netGold: gold - cfg.cost };
}

/* ── 限时目标续期曲线（ARCHITECTURE §4.3 锁定接口：rollNextGoal(state) -> goal）──
 * core Round 2 接线：settle 管线里目标完成发奖后、或超时后调用本函数生成下一档。
 * tier 是自适应难度档：连续完成升档 ×1.35，超时降档，玩家强度自动收敛。 */
export const GOAL_CURVE = {
  durationMs: 8 * 60 * 1000,
  baseSpan: 560, // Lv1 首档区间，对齐基线初始目标 600 − 起始金 40
  levelMult: 3, // 每主角等级区间 ×3，贴合该等级收入量级
  tierMult: 1.35,
  tierMax: 6,
  rewardShare: 0.35, // 金币奖励 = 区间 × 0.35
  xpBase: 14,
  xpPerLevel: 6,
  xpTierBoost: 0.15,
};

export function goalSpan(level, tier) {
  return Math.round(
    GOAL_CURVE.baseSpan *
      GOAL_CURVE.levelMult ** (Math.max(1, level) - 1) *
      GOAL_CURVE.tierMult ** tier,
  );
}

export function goalReward(level, tier) {
  return {
    gold: Math.round(goalSpan(level, tier) * GOAL_CURVE.rewardShare),
    xp: Math.round(
      (GOAL_CURVE.xpBase + GOAL_CURVE.xpPerLevel * Math.max(1, level)) *
        (1 + GOAL_CURVE.xpTierBoost * tier),
    ),
  };
}

export function rollNextGoal(state, nowMs = Date.now()) {
  const prev = state.goal;
  const prevTier = Number.isFinite(prev?.tier) ? prev.tier : 0; // 旧档无 tier 字段按 0 档
  const tier = prev
    ? Math.min(GOAL_CURVE.tierMax, Math.max(0, prevTier + (prev.done ? 1 : -1)))
    : 0;
  const level = Math.max(1, state.level || 1);
  return {
    target: Math.round((state.goldEarned || 0) + goalSpan(level, tier)),
    until: nowMs + GOAL_CURVE.durationMs,
    done: false,
    tier,
    reward: goalReward(level, tier),
  };
}

/* ── 被动阅历供给（堵纯挂机卡级；core Round 2 在 settle 管线按 dt 累计）──
 * 等级双门槛里金币门有挂机供给而阅历门没有，纯挂机会永久卡级。
 * 被动速率随等级抬升但慢于门槛差增速，纯挂机每级约 17→52 分钟；
 * 主动玩法阅历速率约为其 10–20 倍，主动仍是最优路径。离线按 0.65 折减。 */
export const PASSIVE_XP = { base: 0.02, growth: 1.6, offlineRate: 0.65 };

export function passiveXpPerSec(level) {
  return PASSIVE_XP.base * PASSIVE_XP.growth ** (Math.max(1, level) - 1);
}

/* ── 成本曲线（权威口径；基线内联在视图里的公式 Round 2 一律改查此处）──
 * 基线升级成本 80×1.45^n 对产出 1.18^n：回本时长每级 ×1.229，Lv40 回本 32 小时，
 * 且五店共用一条成本线导致后期店（base 64）升级近乎白送。
 * 新口径成本 ∝ shop.base，成本增速 = 产出增速 + 0.1，
 * 回本时长 = 12/(g−1) × ((g+0.1)/g)^(n−1)，每级仅 ×≈1.08，缓增不发散。 */
export const COSTS = {
  upgrade: { baseMult: 12, growthDelta: 0.1 },
  hire: { base: 50, growth: 1.5 },
  train: { base: 40, growth: 1.6 },
  furniturePerBonus: 40000,
};

export function shopUpgradeCost(shop, level) {
  return Math.floor(
    COSTS.upgrade.baseMult *
      shop.base *
      (shop.growth + COSTS.upgrade.growthDelta) ** (Math.max(1, level) - 1),
  );
}

export function hireCost(staffCount) {
  return Math.floor(COSTS.hire.base * COSTS.hire.growth ** Math.max(0, staffCount));
}

// 基线 40×level 线性成本对恒定边际收益（每级 +4.8% 店收入）可无限白嫖，改指数
export function partnerTrainCost(level) {
  return Math.floor(COSTS.train.base * COSTS.train.growth ** (Math.max(1, level) - 1));
}

// 修正基线 200/bonus 的倒挂定价（加成越高反而越便宜）
export function furnitureCost(item) {
  return Math.round(item.bonus * COSTS.furniturePerBonus);
}

/* 同店叠伙伴按 1, 0.5, 0.25… 衰减合并，堵“全员堆最贵店”的退化最优解。
 * economy.js#shopBonusMap Round 2 接线时用本函数替换直接求和。 */
export const PARTNER_STACK_DECAY = 0.5;

export function combinePartnerBonuses(bonuses) {
  return [...bonuses]
    .sort((a, b) => b - a)
    .reduce((sum, b, i) => sum + b * PARTNER_STACK_DECAY ** i, 0);
}
