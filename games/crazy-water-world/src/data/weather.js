// 天气表。字段语义见 docs/GDD.md §9（天气与事件）。
// 兼容约束：WEATHERS[*].{id,name,salvage,prod,damage,sky} 与 WEATHER_WEIGHTS
// 被 world/sim.js 与 world/canvas.js 直接消费，禁止改名；本轮仅追加字段。
// 新增字段（Round 2 接线）：
//   hunger / thirst  生存消耗倍率（sim 现行写死 clear 0.35 其余 0.5，应改读表：
//                    drain = 0.35 * hunger，thirst 同理再乘 1.1 基准）。
//   fishing          咬钩率与节奏条倍率（0 = 禁钓，tsunami 时收杆强制返航）。
//   diveO2           潜水氧气消耗倍率（0 = 禁潜）。
//   stillBonus       淡水净化器产率额外倍率（暴雨接雨水）。
//   durationSec      天气持续区间 [min,max]（sim 现行写死 70+rng*50，应改读表）。
//   warnSec          转入该天气前的预警秒数（0 = 无预警；海啸必须给撤离窗口）。
//   quip             「老大」口吻播报台词（气泡/日志复用）。

export const WEATHERS = {
  clear: {
    id: "clear",
    name: "晴朗",
    salvage: 1,
    prod: 1,
    damage: 0,
    sky: ["#7ec8e3", "#0e7c8a"],
    hunger: 1,
    thirst: 1.15,
    fishing: 1,
    diveO2: 1,
    stillBonus: 1,
    durationSec: [80, 130],
    warnSec: 0,
    quip: "大晴天，晒得口干。老大，多备水。",
  },
  haze: {
    id: "haze",
    name: "薄雾",
    salvage: 0.85,
    prod: 0.95,
    damage: 0,
    sky: ["#9bb7c4", "#3d6d78"],
    hunger: 1,
    thirst: 1,
    fishing: 1.1,
    diveO2: 1,
    stillBonus: 1,
    durationSec: [70, 110],
    warnSec: 0,
    quip: "起雾了，鱼倒是敢靠岸了。",
  },
  rain: {
    id: "rain",
    name: "暴雨",
    salvage: 0.7,
    prod: 0.8,
    damage: 0,
    sky: ["#4a6270", "#16323c"],
    hunger: 1.05,
    thirst: 0.85,
    fishing: 1.2,
    diveO2: 1.1,
    stillBonus: 1.4,
    durationSec: [60, 100],
    warnSec: 0,
    quip: "白捡的淡水，把桶都摆出来！",
  },
  storm: {
    id: "storm",
    name: "风暴",
    salvage: 0.4,
    prod: 0.55,
    damage: 0.8,
    sky: ["#1b2a33", "#06151b"],
    hunger: 1.2,
    thirst: 1.1,
    fishing: 0.5,
    diveO2: 1.5,
    stillBonus: 1.2,
    durationSec: [50, 90],
    warnSec: 12,
    quip: "风暴来了！没围栏的建筑要挨揍。",
  },
  tsunami: {
    id: "tsunami",
    name: "海啸预警",
    salvage: 0.2,
    prod: 0.35,
    damage: 2.2,
    sky: ["#14243a", "#3a1020"],
    hunger: 1.25,
    thirst: 1.2,
    fishing: 0,
    diveO2: 0,
    stillBonus: 1,
    durationSec: [40, 70],
    warnSec: 25,
    quip: "海啸预警！收杆上浮，全员抱紧木头！",
  },
};

// 现行全局权重（sim.js 直接消费，保持不动）。
export const WEATHER_WEIGHTS = [
  ["clear", 48],
  ["haze", 18],
  ["rain", 18],
  ["storm", 12],
  ["tsunami", 4],
];

// 按指挥中心等级递进的天气权重（Round 2 接线：sim 改按 HQ 等级取档，
// 找不到档位时回退 WEATHER_WEIGHTS）。开荒期不出海啸，避免 10 分钟循环被天灾打断。
export const WEATHER_SCHEDULE = [
  { minHq: 1, weights: [["clear", 62], ["haze", 22], ["rain", 16]] },
  { minHq: 2, weights: [["clear", 54], ["haze", 20], ["rain", 18], ["storm", 8]] },
  { minHq: 3, weights: [["clear", 48], ["haze", 18], ["rain", 18], ["storm", 12], ["tsunami", 4]] },
  { minHq: 5, weights: [["clear", 42], ["haze", 18], ["rain", 18], ["storm", 15], ["tsunami", 7]] },
];
