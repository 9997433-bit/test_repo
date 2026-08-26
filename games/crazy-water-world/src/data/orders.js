// 居民与订单表。字段语义见 docs/GDD.md §4.3。
// 订单轮换（rollOrder/fulfillOrder）已接线；本轮补齐居民招募与 perk 的机读口径，
// 广播站（radio）屏与 tick 按下述规则消费，零猜测：
//   招募：radio 等级 ≥ recruit.radioLevel 且 residents.length < 床位（Σ小屋 pop）
//        时可招；cost 里 coins 扣 player.coins，其余键扣 resources，不足则置灰。
//        入队用 RESIDENT_RULES.spawn 初始三值 + 立即 rollOrder 挂一张单。
//   多订单：每居民各挂 1 张单（ORDER_RULES.ordersPerResident），上限自然 =
//        residents.length；ui/orders.js 的 orderOf 目前只取第一张，接线时改为逐居民展示。
//   perk：tick 里对 perk.target 建筑的产率乘 (1 + rate × 同 target 在船人数)，
//        叠加封顶 RESIDENT_RULES.perkStackCap 层；target = "flotsam" 由
//        explore/salvage 的漂浮物刷新间隔消费（缩短 rate 比例）。
//
// ORDER_POOL 字段：
//   want / qty     需求资源与数量区间（随 HQ 等级取档，见 tier）。
//   tier           出现档位：1 = HQ1 起，2 = HQ3 起，3 = HQ6 起。
//   rewardExp      交单经验。
//   reward         附加奖励（coins 记入 player.coins；资源记入 resources）。
//   flavor         交单台词（老大口吻/打工人幽默）。
//
// RESIDENT_POOL 字段：
//   job            岗位名（scavenger/cook/fisher/farmer/mechanic，UI 标签用）。
//   perk           { target, rate }：target 是建筑 id（fish_plant/fish_chair/farm/
//                  workshop）或 "flotsam"（海面漂浮物刷新）；rate 为每人加成比例。
//   recruit        广播站招募条件 { radioLevel, cost }；null = 开局自带。
//                  cost 的 coins/meal 是 coins 与熟食的常态去向之一（闭环见 GDD §4）。

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
  { id: "r_qiang", name: "摸鱼阿强", job: "scavenger", perk: { target: "flotsam", rate: 0.08 }, recruit: null,
    blurb: "开局就在筏上。摸鱼是态度，拾荒是本职。" },
  { id: "r_gui", name: "干饭桂花", job: "cook", perk: { target: "fish_plant", rate: 0.08 }, recruit: { radioLevel: 1, cost: { meal: 2 } },
    blurb: "为一口热饭上了你的船，切鱼快过切菜。" },
  { id: "r_cao", name: "躺平老曹", job: "fisher", perk: { target: "fish_chair", rate: 0.08 }, recruit: { radioLevel: 1, cost: { freshWater: 4 } },
    blurb: "躺着也能钓鱼，这叫专业。" },
  { id: "r_mei", name: "卷王小美", job: "farmer", perk: { target: "farm", rate: 0.08 }, recruit: { radioLevel: 2, cost: { meal: 3, coins: 10 } },
    blurb: "在海上也要卷出一片麦田。" },
  { id: "r_tou", name: "螺丝老头", job: "mechanic", perk: { target: "workshop", rate: 0.08 }, recruit: { radioLevel: 2, cost: { scrap: 8, coins: 12 } },
    blurb: "给他一把废铁，还你一个工坊传说。" },
  { id: "r_shui", name: "夜宵阿水", job: "cook", perk: { target: "fish_plant", rate: 0.08 }, recruit: { radioLevel: 3, cost: { meal: 4, coins: 20 } },
    blurb: "深夜切鱼不打瞌睡，因为一直在吃。" },
];

// 居民招募与 perk 结算规则（广播站屏 + tick 消费）。
export const RESIDENT_RULES = {
  recruitBuilding: "radio",  // 招募入口建筑（等级门槛读 RESIDENT_POOL[*].recruit.radioLevel）
  needsBed: true,            // 招募前置：residents.length < Σ小屋床位（sim.js 的 beds 口径）
  perkStackCap: 3,           // 同 target 的 perk 至多叠 3 人层（超编居民只交单不加产）
  orderOnJoin: true,         // 入队立即 rollOrder 挂一张单
  spawn: { hunger: 70, thirst: 70, hp: 100, mood: 60 }, // 新居民初始三值（与 store 默认阿强一致）
};

export const ORDER_RULES = {
  rotateAfterFulfill: true, // 交单后立刻抽下一单（不重复上一单）
  cooldownSec: 45,          // 同一居民两单之间的最短间隔
  qtyScalePerHq: 0.15,      // 需求数量随 HQ 等级放大：qty × (1 + 0.15×(HQ-1))，四舍五入
  moodReward: 15,           // 交单心情 +15（现行值保留）
  hungerReset: 80,          // 交单顺带管饭（现行值保留）
  ordersPerResident: 1,     // 每居民同时挂 1 张单：总挂单数 = 居民数 × 本值
  refuseAfterSec: 240,      // 超时不交单：心情 -10，订单轮换（不惩罚资源）
};
