// 随机事件表。字段语义见 docs/GDD.md §9.2。
// 现状：world.event 恒为 null（验收红9）。本表是 Round 2 的接线目标：
// sim 每 EVENT_RULES.checkIntervalSec 秒掷一次事件（mulberry32(seed+tick)），
// 满足 minStage/minHq 且当前无进行中事件时按 weight 抽取，写入 world.event =
// { id, endsAt, phase }；UI 弹播报气泡，canvas 有对应表现。
//
// 字段语义：
//   weight        抽取权重（0 = 只能被剧情/天气触发）。
//   minStage/minHq 出现门槛（开荒 10 分钟内不出袭击类事件）。
//   telegraphSec  预警时长（先播报再生效，给玩家反应窗口）。
//   durationSec   生效时长。
//   kind          raid 战斗事件 / hazard 环境事件 / boon 增益事件 / trade 交易事件。
//   effect        数值口径（实现代理直接读）。
//   resolve       玩家可选应对及结算。
//   weatherBias   天气对权重的乘数（风暴天海盗不出门）。

export const EVENTS = {
  pirate_raid: {
    id: "pirate_raid",
    name: "海盗袭击",
    kind: "raid",
    weight: 30,
    minStage: 3,
    minHq: 2,
    telegraphSec: 20,
    durationSec: 0,
    effect: {
      // 袭击战力 = 当前最高通关 stage 的敌人表 ×0.6（复用 stages 生成器口径）
      wavePowerMult: 0.6,
      onLose: { resourceLossPct: 0.1, lossPool: ["wood", "plastic", "scrap", "rawFish"] },
    },
    resolve: {
      fight: { rewardCoins: 20, rewardBadge: 1, log: "打跑了海盗，捡了他们的船板。" },
      hide: { skipBattle: true, resourceLossPct: 0.05, log: "全员趴下装海藻，损失点浮财。" },
    },
    weatherBias: { storm: 0, tsunami: 0 },
    quip: "老大，海平线上有黑帆！",
  },
  shark_pack: {
    id: "shark_pack",
    name: "鲨群过境",
    kind: "hazard",
    weight: 22,
    minStage: 2,
    minHq: 1,
    telegraphSec: 12,
    durationSec: 60,
    effect: {
      fishingMult: 0,        // 过境期间禁钓（咬钩的全是鲨鱼）
      diveSharksBonus: 2,    // 潜水额外 +2 条鲨鱼
      salvageMult: 0.7,
    },
    resolve: null,
    weatherBias: { tsunami: 0 },
    quip: "背鳍连成线了，收杆收杆！",
  },
  drift_merchant: {
    id: "drift_merchant",
    name: "漂流商人",
    kind: "trade",
    weight: 26,
    minStage: 2,
    minHq: 2,
    telegraphSec: 0,
    durationSec: 90,
    effect: {
      trades: [
        { give: { coins: 8 }, get: { wood: 15 } },
        { give: { coins: 8 }, get: { plastic: 12 } },
        { give: { fillet: 6 }, get: { coins: 18 } },
        { give: { salt: 4 }, get: { coins: 14 } },
        { give: { coins: 20 }, get: { blueprint: 1 } },
        { give: { coins: 30 }, get: { hourglass: 5 } },
        { give: { coins: 25 }, get: { seed: 2 } },
      ],
      maxDeals: 3, // 每次靠岸最多成交 3 笔
    },
    resolve: null,
    weatherBias: { storm: 0.3, tsunami: 0 },
    quip: "浮筏超市靠岸，只收硬通货。",
  },
  gull_delivery: {
    id: "gull_delivery",
    name: "海鸥快递",
    kind: "boon",
    weight: 14,
    minStage: 1,
    minHq: 1,
    telegraphSec: 0,
    durationSec: 0,
    effect: { grant: { wood: 4, plastic: 3, rawFish: 2 } },
    resolve: null,
    weatherBias: {},
    quip: "一群海鸥空投了……别问来路的物资。",
  },
  calm_tide: {
    id: "calm_tide",
    name: "风平浪静",
    kind: "boon",
    weight: 8,
    minStage: 1,
    minHq: 1,
    telegraphSec: 0,
    durationSec: 90,
    effect: { prodMult: 1.25, salvageMult: 1.25 },
    resolve: null,
    weatherBias: { storm: 0, tsunami: 0 },
    quip: "海面平得能照镜子，全员手速加快！",
  },
};

export const EVENT_RULES = {
  checkIntervalSec: 45,   // 掷事件间隔
  chance: 0.12,           // 每次判定的基础概率
  minGapSec: 120,         // 两次事件的最短间隔
  maxPerDay: 3,           // 每昼夜（240 秒）事件上限
  seedFormula: "meta.seed + meta.tick", // 与现行天气掷法同源，保证可复现
};
