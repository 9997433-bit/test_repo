// 潜水区域与掉落表。字段语义见 docs/GDD.md §6.3。
// 现状：explore/dive.js 的 startDive 写死 wreck 布局（2 鲨 3 点），本表是
// Round 2 的接线目标 —— startDive(state, zone) 按 DIVE_ZONES[zone] 生成会话，
// 节点坐标用 seaSeed + tick 播种的 mulberry32 摆放。字段均为纯数据，无逻辑。
//
// shard 的两条获取链之一在这里（另一条是 Boss 关首通，见 stages.js）：
// 深海稀有点可重复刷取，用于补齐升星缺口（全里程碑需 ~160，关卡提供 140）。
//
// 字段语义：
//   unlock       进入条件 { dockLevel, stage? }（潜水船坞等级 / 已通关数）。
//   oxygen       基础氧气秒数（再加船坞加成：每级 +12，见 buildings.dive_dock.perks）。
//   o2DrainBase / o2DrainPerDepth  氧耗 = (base + depth×perDepth) × 天气 diveO2。
//   sharks       鲨鱼数量与速度倍率（碰撞判定半径沿用现行 6）。
//   nodeCount    每次下潜生成的普通资源点数量区间。
//   nodes        普通点加权表 [{ res, n:[min,max], w }]。
//   rareChance   本次下潜出现稀有点的概率（稀有点画法必须有区别闪光）。
//   rares        稀有点加权表（shard 在此；trench 权重最高）。
//   flavor       进入播报（老大口吻）。

export const DIVE_ZONES = {
  wreck: {
    id: "wreck",
    name: "沉船残骸",
    unlock: { dockLevel: 1 },
    oxygen: 100,
    o2DrainBase: 6,
    o2DrainPerDepth: 0.04,
    sharks: { count: 2, speed: 1 },
    nodeCount: [3, 4],
    nodes: [
      { res: "scrap", n: [3, 5], w: 30 },
      { res: "stone", n: [2, 4], w: 22 },
      { res: "plastic", n: [2, 4], w: 18 },
      { res: "rope", n: [1, 2], w: 14 },
      { res: "blueprint", n: [1, 1], w: 16 },
    ],
    rareChance: 0.3,
    rares: [
      { res: "blueprint", n: [1, 2], w: 60 },
      { res: "shard", n: [1, 1], w: 25 },
      { res: "hourglass", n: [2, 3], w: 15 },
    ],
    flavor: "一艘货轮的骨架。老大，铁和蓝图都在下面。",
  },
  city: {
    id: "city",
    name: "沉没都市",
    unlock: { dockLevel: 2, stage: 8 },
    oxygen: 90,
    o2DrainBase: 7,
    o2DrainPerDepth: 0.05,
    sharks: { count: 3, speed: 1.2 },
    nodeCount: [4, 5],
    nodes: [
      { res: "scrap", n: [4, 7], w: 26 },
      { res: "stone", n: [3, 6], w: 24 },
      { res: "blueprint", n: [1, 1], w: 20 },
      { res: "rope", n: [2, 3], w: 12 },
      { res: "hourglass", n: [1, 2], w: 18 },
    ],
    rareChance: 0.45,
    rares: [
      { res: "shard", n: [1, 2], w: 45 },
      { res: "blueprint", n: [2, 2], w: 35 },
      { res: "badge", n: [1, 1], w: 20 },
    ],
    flavor: "整条商业街泡在水里，霓虹灯居然还有一盏亮着。",
  },
  trench: {
    id: "trench",
    name: "深渊海沟",
    unlock: { dockLevel: 3, stage: 18 },
    oxygen: 80,
    o2DrainBase: 8,
    o2DrainPerDepth: 0.07,
    sharks: { count: 4, speed: 1.45 },
    nodeCount: [4, 6],
    nodes: [
      { res: "scrap", n: [6, 9], w: 22 },
      { res: "stone", n: [5, 8], w: 20 },
      { res: "blueprint", n: [1, 2], w: 22 },
      { res: "hourglass", n: [2, 3], w: 20 },
      { res: "badge", n: [1, 1], w: 16 },
    ],
    rareChance: 0.6,
    rares: [
      { res: "shard", n: [2, 3], w: 60 },
      { res: "badge", n: [1, 2], w: 22 },
      { res: "blueprint", n: [2, 3], w: 18 },
    ],
    flavor: "黑得连鲨鱼都要开灯。碎片就藏在最深的沟里。",
  },
};

// 潜水通用规则：与 explore/dive.js 现行写死常数对齐，Round 2 改读本表。
export const DIVE_RULES = {
  moveSpd: 18,          // 每秒移动单位（diveStep 现行值）
  collectRadius: 5,     // 资源点拾取半径
  sharkRadius: 6,       // 鲨鱼碰撞半径
  surfaceDepth: 8,      // 深度 < 8 时可安全上浮
  failHpLoss: 18,       // 潜水失败掉血（finishDive 现行值）
  oxygenPerDockLevel: 12, // 船坞每级额外氧气
  xpPerLoot: 10,        // 每件战利品经验（finishDive 现行值）
  weatherField: "diveO2", // 读 WEATHERS[*].diveO2 作氧耗倍率；0 = 禁潜
};
