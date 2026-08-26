// 随机事件表。字段语义见 docs/GDD.md §9.2。
// Round 3 接线口径（tick 消费本表的完整生命周期，零猜测）：
//   1) 掷取：sim 每 EVENT_RULES.checkIntervalSec 秒用
//      deriveRng(meta.seed, meta.tick, EVENT_RULES.seedSalt) 掷一次；
//      通过 chance 判定后，在满足 minStage/minHq 且 weight×weatherBias>0 的事件里
//      按权重抽取；受 minGapSec / maxPerDay（昼夜 = dayLengthSec）约束。
//   2) 落地：写 world.event = { id, phase: "telegraph"|"active", endsAt }；
//      telegraphSec 走完转 active，durationSec 走完清空回 null。
//      注意：core/store.js normalize 现将 world.event 钳成 string|null，
//      接线时需把它放宽成上述对象形状（列入代码侧待接清单）。
//   3) 余波：天气从 storm/tsunami 转走时，按 EVENT_RULES.aftermath 掷对应
//      weight=0 的余波事件（风暴/海啸后果由此闭环，围栏减损走 stormShelter）。
//   4) 海盗：袭击波用 stages.js 导出的 raidWave(campaign.bestStage,
//      effect.wavePowerMult) 生成，直接喂 simulateBattle，不改战斗代码；
//      telegraphSec 内玩家二选一（resolve.fight / resolve.hide），
//      超时按 autoResolve 自动结算。
//
// 字段语义：
//   weight        抽取权重（0 = 只能被剧情/天气触发，不进随机池）。
//   minStage/minHq 出现门槛（开荒 10 分钟内不出袭击类事件）。
//   telegraphSec  预警时长（先播报再生效，给玩家反应窗口 = 海盗的应对窗口）。
//   durationSec   生效时长（0 = 即时结算，落地即清）。
//   kind          raid 战斗事件 / hazard 环境事件 / boon 增益事件 / trade 交易事件。
//   effect        数值口径（实现代理直接读）。
//   resolve       玩家可选应对及结算；autoResolve = 超时未选时走哪个键。
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
      // 袭击波 = raidWave(campaign.bestStage, 0.6)（stages.js 导出，5 人，喂 simulateBattle）
      wavePowerMult: 0.6,
      onLose: { resourceLossPct: 0.1, lossPool: ["wood", "plastic", "scrap", "rawFish"] },
    },
    resolve: {
      fight: { rewardCoins: 20, rewardBadge: 1, log: "打跑了海盗，捡了他们的船板。" },
      hide: { skipBattle: true, resourceLossPct: 0.05, log: "全员趴下装海藻，损失点浮财。" },
    },
    // telegraphSec 内没点「迎战」就自动装海藻：损失 5%，不打无准备之仗。
    autoResolve: "hide",
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
      // give 从玩家侧扣（coins 走 player.coins，其余走 resources），get 反向入账；
      // 任一 give 不足则该笔置灰。id 供 UI 按钮与成交日志引用。
      trades: [
        { id: "t_wood", give: { coins: 8 }, get: { wood: 15 } },
        { id: "t_plastic", give: { coins: 8 }, get: { plastic: 12 } },
        { id: "t_fillet", give: { fillet: 6 }, get: { coins: 18 } },
        { id: "t_salt", give: { salt: 4 }, get: { coins: 14 } },
        { id: "t_blueprint", give: { coins: 20 }, get: { blueprint: 1 } },
        { id: "t_hourglass", give: { coins: 30 }, get: { hourglass: 5 } },
        { id: "t_seed", give: { coins: 25 }, get: { seed: 2 } },
      ],
      maxDeals: 3, // 每次靠岸最多成交 3 笔（计数挂在 world.event 上，事件清空即重置）
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

  // ── 天气余波（weight 0：不进随机池，由 EVENT_RULES.aftermath 在天气结束时触发）──
  storm_wreckage: {
    id: "storm_wreckage",
    name: "风暴余波",
    kind: "hazard",
    weight: 0,
    minStage: 1,
    minHq: 1,
    telegraphSec: 0,
    durationSec: 0,
    effect: {
      // 即时结算：损失比例先乘 stormShelter(state).mult（围栏减损终于有账可算），
      // 再从 lossPool 里按现存量加权扣。flotsamBurst = 事后海面额外刷 N 个漂浮物
      // （风暴把别人的木筏也拆了，残骸归你），由 explore/salvage 刷新逻辑消费。
      resourceLossPct: 0.08,
      lossPool: ["wood", "plastic", "rawFish", "freshWater"],
      shelterScaled: true,
      flotsamBurst: 5,
    },
    resolve: null,
    weatherBias: {},
    quip: "风停了。盘点损失，顺便捞点别人的损失。",
  },
  tsunami_wreckage: {
    id: "tsunami_wreckage",
    name: "海啸余波",
    kind: "hazard",
    weight: 0,
    minStage: 1,
    minHq: 1,
    telegraphSec: 0,
    durationSec: 0,
    effect: {
      resourceLossPct: 0.15,
      lossPool: ["wood", "plastic", "scrap", "rawFish", "freshWater"],
      shelterScaled: true,
      flotsamBurst: 8,
    },
    resolve: null,
    weatherBias: {},
    quip: "浪头过去了……仓库里少的那些，就当交过路费。",
  },
};

export const EVENT_RULES = {
  checkIntervalSec: 45,   // 掷事件间隔
  chance: 0.12,           // 每次判定的基础概率
  minGapSec: 120,         // 两次事件的最短间隔
  maxPerDay: 3,           // 每昼夜事件上限（余波事件不计数）
  dayLengthSec: 240,      // 昼夜长度（与 sim.js timeOfDay 的 240 同源，供 maxPerDay 记账）
  seedSalt: "event",      // deriveRng(meta.seed, meta.tick, seedSalt)——与天气掷法同构，保证可复现
  seedFormula: "deriveRng(meta.seed, meta.tick, 'event')", // 口径备注（人读）
  // 天气余波：world.weather 离开该键时掷 chance，命中则立刻落对应 weight=0 事件。
  aftermath: {
    storm: { eventId: "storm_wreckage", chance: 0.6 },
    tsunami: { eventId: "tsunami_wreckage", chance: 1 },
  },
};
