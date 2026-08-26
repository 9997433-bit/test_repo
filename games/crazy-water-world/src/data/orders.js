// 居民与订单表。字段语义见 docs/GDD.md §4.3。
// 现状：store 只有 1 名居民「摸鱼阿强」，ui/app.js 的 fulfillOrder 写死第二单起
// 恒为 meal×1（验收红9）。本表是 Round 2 的接线目标：交单后按 ORDER_RULES 从
// ORDER_POOL 轮换抽取（同居民不连续抽同一单），居民由广播站按 RESIDENT_POOL 招募。
//
// ORDER_POOL 字段：
//   want / qty     需求资源与数量区间（随 HQ 等级取档，见 tier）。
//   tier           出现档位：1 = HQ1 起，2 = HQ3 起，3 = HQ6 起。
//   rewardExp      交单经验。
//   reward         附加奖励（coins 记入 player.coins；资源记入 resources）。
//   flavor         交单台词（老大口吻/打工人幽默）。
//
// RESIDENT_POOL 字段：
//   job / perk     岗位与被动加成（Round 2 接线：scavenger 拾荒刷新 +8%、
//                  fisher 钓鱼椅产出 +8%、farmer 农田 +8%、cook 切鱼厂 +8%、
//                  mechanic 工坊 +8%；同岗位多人可叠加，上限 3 层）。
//   recruit        广播站招募条件 { radioLevel, cost }。人口受小屋 pop 上限约束。

export const ORDER_POOL = [
  { id: "o_fillet", want: "fillet", qty: [2, 3], tier: 1, rewardExp: 20, reward: { coins: 6 }, flavor: "生鱼片要新鲜的，谢谢老板。" },
  { id: "o_water", want: "freshWater", qty: [3, 5], tier: 1, rewardExp: 16, reward: { coins: 5 }, flavor: "喝口不咸的水，是废海人最大的体面。" },
  { id: "o_meal", want: "meal", qty: [1, 2], tier: 1, rewardExp: 28, reward: { coins: 8 }, flavor: "热乎的！今天不摆烂了。" },
  { id: "o_raw", want: "rawFish", qty: [4, 6], tier: 1, rewardExp: 14, reward: { coins: 4 }, flavor: "我自己腌，你别管。" },
  { id: "o_wheat", want: "wheat", qty: [3, 5], tier: 2, rewardExp: 24, reward: { coins: 8 }, flavor: "想吃口主食，海里长的不算。" },
  { id: "o_salt", want: "salt", qty: [2, 3], tier: 2, rewardExp: 22, reward: { coins: 8 }, flavor: "没盐的日子，鱼都懒得咸。" },
  { id: "o_plastic", want: "plastic", qty: [6, 9], tier: 2, rewardExp: 20, reward: { coins: 10 }, flavor: "收塑料，给孩子拼个玩具船。" },
  { id: "o_tool", want: "tool", qty: [1, 2], tier: 3, rewardExp: 40, reward: { coins: 18, blueprint: 1 }, flavor: "好工具难寻，拿蓝图跟你换。" },
  { id: "o_feast", want: "meal", qty: [4, 6], tier: 3, rewardExp: 55, reward: { coins: 24, hourglass: 2 }, flavor: "全岛聚餐！老大破费了。" },
];

export const RESIDENT_POOL = [
  { id: "r_qiang", name: "摸鱼阿强", job: "scavenger", perk: { salvageRate: 0.08 }, recruit: null,
    blurb: "开局就在筏上。摸鱼是态度，拾荒是本职。" },
  { id: "r_gui", name: "干饭桂花", job: "cook", perk: { fishPlantRate: 0.08 }, recruit: { radioLevel: 1, cost: { meal: 2 } },
    blurb: "为一口热饭上了你的船，切鱼快过切菜。" },
  { id: "r_cao", name: "躺平老曹", job: "fisher", perk: { fishChairRate: 0.08 }, recruit: { radioLevel: 1, cost: { freshWater: 4 } },
    blurb: "躺着也能钓鱼，这叫专业。" },
  { id: "r_mei", name: "卷王小美", job: "farmer", perk: { farmRate: 0.08 }, recruit: { radioLevel: 2, cost: { meal: 3, coins: 10 } },
    blurb: "在海上也要卷出一片麦田。" },
  { id: "r_tou", name: "螺丝老头", job: "mechanic", perk: { workshopRate: 0.08 }, recruit: { radioLevel: 2, cost: { scrap: 8, coins: 12 } },
    blurb: "给他一把废铁，还你一个工坊传说。" },
  { id: "r_shui", name: "夜宵阿水", job: "cook", perk: { fishPlantRate: 0.08 }, recruit: { radioLevel: 3, cost: { meal: 4, coins: 20 } },
    blurb: "深夜切鱼不打瞌睡，因为一直在吃。" },
];

export const ORDER_RULES = {
  rotateAfterFulfill: true, // 交单后立刻抽下一单（不重复上一单）
  cooldownSec: 45,          // 同一居民两单之间的最短间隔
  qtyScalePerHq: 0.15,      // 需求数量随 HQ 等级放大：qty × (1 + 0.15×(HQ-1))，四舍五入
  moodReward: 15,           // 交单心情 +15（现行值保留）
  hungerReset: 80,          // 交单顺带管饭（现行值保留）
  maxOpenOrders: "residents.length", // 同时挂单数 = 居民数
  refuseAfterSec: 240,      // 超时不交单：心情 -10，订单轮换（不惩罚资源）
};
