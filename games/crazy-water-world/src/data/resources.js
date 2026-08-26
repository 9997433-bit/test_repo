// 资源总表。字段语义见 docs/GDD.md §4（资源 reciprocal 总表）。
// 兼容约束：RESOURCE_KEYS 现有 16 个 key 与 RESOURCE_META[*].name/color 被
// store/canvas/ui 直接消费，禁止改名删除；本轮仅追加 "tool" 与元数据字段。
// 新增字段（Round 2 接线）：
//   tier   basic 基础建材 / survival 生存消耗 / rare 稀缺进阶 / craft 加工品
//   shape  色盲友好形状（circle/square/triangle/diamond/hex/star/drop/gear），
//          canvas 画漂浮物与 UI 圆点时叠加形状轮廓，不再只靠色相。
//   from   主要获取来源（用于图鉴/tooltip 与新手指引文案）。
//   into   主要消耗去向（用于"这东西攒着干嘛"提示；空数组 = 纯产出型）。

export const RESOURCE_KEYS = [
  "wood",
  "plastic",
  "scrap",
  "rope",
  "stone",
  "rawFish",
  "fillet",
  "meal",
  "freshWater",
  "wheat",
  "seed",
  "salt",
  "blueprint",
  "hourglass",
  "badge",
  "shard",
  "tool",
];

export const RESOURCE_META = {
  wood: {
    name: "浮木",
    color: "#c9843a",
    tier: "basic",
    shape: "square",
    from: ["海面拾荒", "拾荒船自动收集", "订单回礼"],
    into: ["建筑建造/升级", "木筏扩建", "工坊配方"],
  },
  plastic: {
    name: "塑料",
    color: "#7ec8e3",
    tier: "basic",
    shape: "circle",
    from: ["海面拾荒", "拾荒船", "旧雨靴/小丑鱼"],
    into: ["建筑建造/升级", "木筏扩建"],
  },
  scrap: {
    name: "废铁",
    color: "#8a93a0",
    tier: "basic",
    shape: "gear",
    from: ["海面拾荒", "拾荒船（2 级起）", "潜水沉船节点"],
    into: ["建筑建造/升级", "工坊工具配方"],
  },
  rope: {
    name: "绳索",
    color: "#d4b483",
    tier: "basic",
    shape: "wave",
    from: ["海面拾荒", "缠网浮箱（远洋钓获）"],
    into: ["钓鱼椅/小屋/拾荒船建造升级"],
  },
  stone: {
    name: "石材",
    color: "#6d6a67",
    tier: "basic",
    shape: "triangle",
    from: ["海面拾荒（低概率）", "潜水沉没都市节点"],
    into: ["工坊建造", "围栏升级"],
  },
  rawFish: {
    name: "生鱼",
    color: "#5ec8d8",
    tier: "survival",
    shape: "drop",
    from: ["钓鱼椅自动产出", "钓鱼小游戏", "居民渔工岗位"],
    into: ["切鱼厂加工", "直接充饥（效果差）"],
  },
  fillet: {
    name: "生鱼片",
    color: "#ffb4a2",
    tier: "craft",
    shape: "diamond",
    from: ["切鱼厂配方一", "薄暮鳐/剑鱼钓获"],
    into: ["吃饭回饥饿", "居民订单", "腌鱼配方（3 级切鱼厂）"],
  },
  meal: {
    name: "熟食",
    color: "#f4a259",
    tier: "craft",
    shape: "hex",
    from: ["切鱼厂配方二（生鱼+小麦）", "腌鱼配方（鱼片+海盐）"],
    into: ["吃饭（最优回复）", "居民订单", "英雄委任口粮（后期）"],
  },
  freshWater: {
    name: "淡水",
    color: "#4cc9f0",
    tier: "survival",
    shape: "drop",
    from: ["淡水净化器", "暴雨天净化加成", "月光水母"],
    into: ["喝水回口渴", "海上农田灌溉", "居民订单"],
  },
  wheat: {
    name: "小麦",
    color: "#f0d060",
    tier: "survival",
    shape: "triangle",
    from: ["海上农田（耗淡水）"],
    into: ["熟食配方", "选种厂原料", "居民订单"],
  },
  seed: {
    name: "种子",
    color: "#8bc34a",
    tier: "rare",
    shape: "circle",
    from: ["选种厂（后期粮食瓶颈的钥匙）", "漂流商人"],
    into: ["农田建造/升级"],
  },
  salt: {
    name: "海盐",
    color: "#f5f5f5",
    tier: "craft",
    shape: "square",
    from: ["淡水净化器副产物", "青壳蟹钓获"],
    into: ["腌鱼配方（鱼片+盐→熟食×2）", "居民订单"],
  },
  blueprint: {
    name: "蓝图",
    color: "#7c6ff0",
    tier: "rare",
    shape: "star",
    from: ["潜水节点（保底来源）", "灯笼鱼/老古董钓获", "拾荒稀有闪光", "高阶订单"],
    into: ["指挥中心/多数建筑升级（核心瓶颈）"],
  },
  hourglass: {
    name: "沙漏",
    color: "#ffd166",
    tier: "rare",
    shape: "hourglass",
    from: ["关卡通关（每关必得）", "幽灵灯鱼", "漂流商人"],
    into: ["招募低阶英雄", "广播站升级", "委任加速（Round 2）"],
  },
  badge: {
    name: "徽章",
    color: "#e09f3e",
    tier: "rare",
    shape: "shield",
    from: ["关卡首通", "海王鱼苗/老古董", "击退海盗事件"],
    into: ["招募史诗/传说英雄"],
  },
  shard: {
    name: "传说碎片",
    color: "#ef476f",
    tier: "rare",
    shape: "shard",
    from: ["Boss 关（5/10/15/20/25/30）首通固定掉落", "深海潜水稀有点（可重复刷取）"],
    into: ["英雄升星（星级×10）"],
  },
  tool: {
    name: "工具",
    color: "#b0895e",
    tier: "craft",
    shape: "gear",
    from: ["工坊配方（浮木+废铁）"],
    into: ["4 级以上建筑升级附加消耗", "围栏加固", "潜水装备（Round 2）"],
  },
};

export function emptyResources(overrides = {}) {
  const bag = Object.fromEntries(RESOURCE_KEYS.map((k) => [k, 0]));
  return { ...bag, ...overrides };
}
