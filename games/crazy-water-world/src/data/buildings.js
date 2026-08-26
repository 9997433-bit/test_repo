// 建筑表。字段语义见 docs/GDD.md §5。
// 兼容约束：{id,name,w,h,unique,cost,upgrade,pop,desc} 与 UNLOCK_LEVEL 被
// world/build.js、world/grid.js、world/canvas.js、ui 直接消费，禁止改名；
// 12 个建筑 id 保持不变；cost/upgrade 数值受测试夹具约束
// （house/fish_chair/radio/dive_dock 必须在默认开局资源下可放置），本轮未改动。
//
// 新增字段（Round 2 接线）：
//   maxLevel      等级上限（现行升级无上限，应改读表；hq 上限 8 对应软目标）。
//   output        每级每秒纯产出（sim 现行写死同值，应改读表：rate = output × level
//                 × 委任加成 × 天气 prod/salvage）。标 salvage: true 的建筑吃
//                 WEATHERS.salvage 而非 prod。
//   input         每级每秒维持性消耗（不足时该建筑当 tick 停产；现行未实现）。
//   converts      加工配方 [{ in, out, perSec, minLevel }]：perSec 为每级每秒处理
//                 的配方份数；建筑等级 ≥ minLevel 解锁。替换 sim 现行写死的
//                 切鱼厂 0.08 生鱼→0.8 鱼片+0.25 熟食。
//   upgradeGrowth 升级成本按等级的乘数：L→L+1 花费 = ceil(upgrade × growth^(L-1))；
//                 蓝图/沙漏等稀缺件不乘（每级固定）。现行每级恒定原价，应改读表。
//   upgradeExtra  高等级附加消耗：等级 ≥ fromLevel 起每级额外 add（工具的主要去向）。
//   adjacency     邻接加成 { likes: [建筑id], bonus, desc }：与 likes 中建筑正交相邻时
//                 产率 ×(1+bonus)，同类加成不叠加，取一次。
//   perks         按等级解锁的能力说明（委任位/氧气/招募档等，供 UI 与实现读取）。

export const BUILDINGS = {
  hq: {
    id: "hq",
    name: "指挥中心",
    w: 2,
    h: 2,
    unique: true,
    cost: { wood: 12, plastic: 6, scrap: 4 },
    upgrade: { wood: 20, scrap: 10, blueprint: 1 },
    maxLevel: 8,
    upgradeGrowth: 1.35,
    adjacency: { likes: ["house"], bonus: 0.1, desc: "贴着小屋办公，居民心情产出 +10%" },
    perks: {
      1: "解锁基础建筑（见 UNLOCK_HQ）",
      2: "解锁淡水净化/农田；委任位 +1",
      3: "解锁拾荒船/广播站；订单档升级",
      4: "解锁工坊/围栏；委任位 +1",
      5: "解锁潜水船坞；天气档位放开（见 WEATHER_SCHEDULE）",
      6: "解锁选种厂；订单档升级",
      7: "委任位 +1",
      8: "软目标达成：浮动城邦资格",
    },
    desc: "老大的办公桌。升级解锁建筑与委任位。",
  },
  house: {
    id: "house",
    name: "小屋",
    w: 2,
    h: 1,
    cost: { wood: 8, plastic: 4 },
    upgrade: { wood: 12, rope: 4 },
    pop: 2,
    maxLevel: 4,
    upgradeGrowth: 1.4,
    popPerLevel: 1,
    adjacency: { likes: ["hq"], bonus: 0.1, desc: "挨着指挥中心，居民休息回心情 +10%" },
    desc: "居民睡觉的地方，心情回血。每级人口上限 +1。",
  },
  fish_chair: {
    id: "fish_chair",
    name: "钓鱼椅",
    w: 1,
    h: 1,
    cost: { wood: 6, rope: 2 },
    upgrade: { wood: 8, plastic: 4 },
    maxLevel: 5,
    upgradeGrowth: 1.4,
    output: { rawFish: 0.035 },
    adjacency: { likes: ["fish_plant"], bonus: 0.1, desc: "鱼获直送切鱼厂，产率 +10%" },
    desc: "摸鱼圣地。解锁钓鱼并缓慢自动出水产。",
  },
  fish_plant: {
    id: "fish_plant",
    name: "切鱼厂",
    w: 2,
    h: 1,
    cost: { wood: 10, scrap: 4, plastic: 4 },
    upgrade: { scrap: 8, blueprint: 1 },
    maxLevel: 5,
    upgradeGrowth: 1.35,
    converts: [
      { in: { rawFish: 1 }, out: { fillet: 0.9 }, perSec: 0.08, minLevel: 1 },
      { in: { rawFish: 1, wheat: 1 }, out: { meal: 1 }, perSec: 0.05, minLevel: 2 },
      { in: { fillet: 1, salt: 1 }, out: { meal: 2 }, perSec: 0.03, minLevel: 3 },
    ],
    adjacency: { likes: ["fish_chair"], bonus: 0.1, desc: "紧邻钓鱼椅，加工 +10%" },
    desc: "生鱼加工成鱼片；二级起做熟食，三级解锁腌鱼。",
  },
  farm: {
    id: "farm",
    name: "海上农田",
    w: 2,
    h: 2,
    cost: { wood: 8, plastic: 8, seed: 1 },
    upgrade: { wood: 10, seed: 2 },
    maxLevel: 5,
    upgradeGrowth: 1.3,
    output: { wheat: 0.03 },
    input: { freshWater: 0.012 },
    adjacency: { likes: ["still"], bonus: 0.15, desc: "净化器直灌，小麦产率 +15%" },
    desc: "在大海上也要开心种田。灌溉吃淡水。",
  },
  seed: {
    id: "seed",
    name: "选种厂",
    w: 2,
    h: 1,
    cost: { wood: 12, scrap: 6, wheat: 4 },
    upgrade: { blueprint: 1, scrap: 8 },
    maxLevel: 4,
    upgradeGrowth: 1.35,
    output: { seed: 0.008 },
    input: { wheat: 0.01 },
    adjacency: { likes: ["farm"], bonus: 0.1, desc: "贴着农田选种，产率 +10%" },
    desc: "粮食瓶颈的关键。吃小麦，吐种子。",
  },
  still: {
    id: "still",
    name: "淡水净化",
    w: 1,
    h: 2,
    cost: { plastic: 10, scrap: 6 },
    upgrade: { plastic: 8, scrap: 6 },
    maxLevel: 5,
    upgradeGrowth: 1.35,
    output: { freshWater: 0.05, salt: 0.006 },
    adjacency: { likes: ["farm"], bonus: 0.1, desc: "近水楼台，净化 +10%" },
    desc: "海水变能喝的水，顺带刮点海盐。暴雨天白赚。",
  },
  salvage: {
    id: "salvage",
    name: "拾荒船",
    w: 2,
    h: 1,
    cost: { wood: 14, rope: 6, scrap: 4 },
    upgrade: { wood: 16, blueprint: 1 },
    maxLevel: 5,
    upgradeGrowth: 1.35,
    output: { wood: 0.04, plastic: 0.025, scrap: 0.01 },
    salvage: true,
    adjacency: { likes: ["workshop"], bonus: 0.1, desc: "工坊帮忙修船，收集 +10%" },
    desc: "自动去更远海面捡垃圾。风暴天不出船。",
  },
  dive_dock: {
    id: "dive_dock",
    name: "潜水船坞",
    w: 2,
    h: 2,
    cost: { wood: 16, scrap: 10, plastic: 8 },
    upgrade: { scrap: 12, blueprint: 1 },
    maxLevel: 3,
    upgradeGrowth: 1.4,
    perks: {
      1: "解锁潜水（沉船残骸）与远洋/深海鱼池",
      2: "氧气上限 +12；解锁沉没都市（DIVE_ZONES.city）",
      3: "氧气上限 +24；解锁深渊海沟（DIVE_ZONES.trench）与深渊鱼池",
    },
    adjacency: { likes: ["workshop"], bonus: 0.1, desc: "装备保养到位，潜水氧耗 -10%" },
    desc: "解锁深海沉船与蓝图。船坞等级决定能下多深。",
  },
  radio: {
    id: "radio",
    name: "广播站",
    w: 1,
    h: 1,
    cost: { scrap: 8, plastic: 8, wood: 4 },
    upgrade: { scrap: 10, hourglass: 2 },
    maxLevel: 4,
    upgradeGrowth: 1.3,
    perks: {
      1: "解锁英雄招募与居民呼救（每级招募 1 名居民，见 orders.js）",
      2: "招募池开放史诗档",
      3: "招募池开放传说档",
      4: "每日免费呼救一次（Round 2）",
    },
    desc: "呼救幸存者与英雄。等级决定招募档位。",
  },
  workshop: {
    id: "workshop",
    name: "工坊",
    w: 2,
    h: 1,
    cost: { wood: 10, scrap: 8, stone: 4 },
    upgrade: { scrap: 10, blueprint: 1 },
    maxLevel: 5,
    upgradeGrowth: 1.35,
    converts: [
      { in: { wood: 2, scrap: 1 }, out: { tool: 1 }, perSec: 0.02, minLevel: 1 },
      { in: { tool: 1, stone: 2 }, out: { scrap: 4 }, perSec: 0.015, minLevel: 3 },
    ],
    adjacency: { likes: ["salvage"], bonus: 0.1, desc: "废料直送，打造 +10%" },
    desc: "浮木废铁打造工具；工具是高级升级的硬通货。",
  },
  wall: {
    id: "wall",
    name: "围栏",
    w: 1,
    h: 1,
    cost: { wood: 4, scrap: 2 },
    upgrade: { wood: 6, scrap: 3 },
    maxLevel: 3,
    upgradeGrowth: 1.5,
    upgradeExtra: { fromLevel: 2, add: { tool: 1 } },
    guard: 0.12,
    adjacency: { likes: ["*"], bonus: 0, desc: "正交相邻的建筑风暴受损 -25%（guardAdj）" },
    guardAdj: 0.25,
    desc: "扛风暴、挡海盗。全岛每座 -12% 天灾伤害，邻接再减。",
  },
};

// 现行解锁口径：玩家等级（build.js 直接消费，保持不动）。
export const UNLOCK_LEVEL = {
  hq: 1,
  house: 1,
  fish_chair: 1,
  fish_plant: 1,
  still: 2,
  farm: 2,
  salvage: 3,
  workshop: 3,
  radio: 3,
  wall: 4,
  dive_dock: 4,
  seed: 5,
};

// 目标解锁口径：指挥中心等级（GDD §5.3；Round 2 接线后替换 UNLOCK_LEVEL 判定，
// 未建 HQ 时视为 0 级 —— 只有 hq 本身可建，形成「必须先立指挥中心」的原作约束）。
export const UNLOCK_HQ = {
  hq: 0,
  house: 1,
  fish_chair: 1,
  fish_plant: 1,
  still: 2,
  farm: 2,
  salvage: 3,
  radio: 3,
  workshop: 4,
  wall: 4,
  dive_dock: 5,
  seed: 6,
};

// 木筏扩建成本曲线（build.expandRaft 现行写死 wood:10+w+h, plastic:4；
// 本表为设计口径，Round 2 接线：第 n 次扩建 = base + perTile×(当前格数)）。
export const RAFT_RULES = {
  baseWood: 8,
  perTileWood: 0.5,
  plastic: 4,
  startSize: [6, 5],
  cityGoal: { tiles: 18, buildingTypes: 8 },
};
