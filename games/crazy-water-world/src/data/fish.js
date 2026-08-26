// 鱼种表。字段语义与节奏条规格见 docs/GDD.md §6.2。
// 兼容约束：{id,name,weight,value,window,sea} 被 explore/fishing.js 直接消费，
// 禁止改名删除；原 6 个 id（sardine/mackerel/clown/tuna/angler/boot）保持不变。
// 窗口可玩规则（本表自检）：
//   窗口整体落在 [0.12, 0.88]，指针可达；宽度按品质下限：
//   junk/common ≥ 0.16，rare ≥ 0.12，epic ≥ 0.09，legend ≥ 0.07。
//   蓝图鱼（angler/coelacanth/ghost）窗口必须满足上述规则 —— 灯笼鱼 0.20–0.34
//   宽 0.14，节奏条下靠技巧稳定可钓（验收红1 的修复口径）。
// 新增字段（Round 2 接线）：
//   rarity     junk/common/rare/epic/legend，图鉴分档与首钓奖励档位。
//   bar        节奏条指针速度倍率（基准见 FISHING_RULES.barSweepSec，越大越快越难）。
//   xp         钓获经验（resolveHook 现行写死 +6，应改读表）。
//   firstCatch 图鉴首钓一次性奖励（coins/diamonds 记入 player 字段）。
//   lore       图鉴一句话文案（老大口吻）。
// 海域池规则（现行 castLine 逻辑）：near 恒可钓；建潜水船坞后 far/deep 入池；
// abyss 现行代码不入池，属预留海域，解锁条件见 SEAS.abyss（Round 2 接线）。

export const FISH = [
  // ── 近海（开局钓鱼椅即钓）─────────────────────────────
  { id: "sardine", name: "沙丁鱼", weight: 36, value: { rawFish: 1 }, window: [0.42, 0.62], sea: "near",
    rarity: "common", bar: 1, xp: 6, firstCatch: { coins: 5 }, lore: "废海打工鱼，量大管饱。" },
  { id: "mackerel", name: "青花鱼", weight: 24, value: { rawFish: 2 }, window: [0.35, 0.52], sea: "near",
    rarity: "common", bar: 1, xp: 6, firstCatch: { coins: 5 }, lore: "背上的花纹是海浪盖的章。" },
  { id: "clown", name: "小丑鱼", weight: 12, value: { rawFish: 1, plastic: 1 }, window: [0.5, 0.68], sea: "near",
    rarity: "common", bar: 1.05, xp: 6, firstCatch: { coins: 6 }, lore: "住在塑料瓶里，连房子一起钓上来了。" },
  { id: "boot", name: "旧雨靴", weight: 10, value: { plastic: 2 }, window: [0.55, 0.8], sea: "near",
    rarity: "junk", bar: 0.85, xp: 2, firstCatch: { coins: 2 }, lore: "不是鱼。但在废海，能捞的都算收获。" },
  { id: "crab", name: "青壳蟹", weight: 14, value: { rawFish: 1, salt: 1 }, window: [0.3, 0.5], sea: "near",
    rarity: "common", bar: 1, xp: 7, firstCatch: { coins: 6 }, lore: "自带海盐，横着走的调味料。" },
  { id: "jelly", name: "月光水母", weight: 8, value: { freshWater: 2 }, window: [0.58, 0.74], sea: "near",
    rarity: "rare", bar: 1.1, xp: 10, firstCatch: { coins: 12 }, lore: "百分之九十五是水，剩下百分之五是委屈。" },
  { id: "flying", name: "银翅飞鱼", weight: 10, value: { rawFish: 2 }, window: [0.62, 0.78], sea: "near",
    rarity: "rare", bar: 1.25, xp: 10, firstCatch: { coins: 12 }, lore: "想飞出废海，被你一杆钓回现实。" },

  // ── 远洋（建成潜水船坞后入池）─────────────────────────
  { id: "tuna", name: "金枪鱼", weight: 8, value: { rawFish: 4, fillet: 1 }, window: [0.28, 0.4], sea: "far",
    rarity: "rare", bar: 1.2, xp: 12, firstCatch: { coins: 12 }, lore: "一条顶一天伙食，值得练手感。" },
  { id: "saury", name: "秋刀鱼", weight: 16, value: { rawFish: 3 }, window: [0.4, 0.56], sea: "far",
    rarity: "common", bar: 1.05, xp: 8, firstCatch: { coins: 6 }, lore: "烤一烤，居民能多干半天活。" },
  { id: "ray", name: "薄暮鳐", weight: 7, value: { rawFish: 3, fillet: 1 }, window: [0.25, 0.37], sea: "far",
    rarity: "rare", bar: 1.2, xp: 12, firstCatch: { coins: 12 }, lore: "像一块会游泳的滑翔布。" },
  { id: "sword", name: "破浪剑鱼", weight: 5, value: { rawFish: 5, fillet: 1 }, window: [0.18, 0.28], sea: "far",
    rarity: "epic", bar: 1.35, xp: 16, firstCatch: { coins: 20, diamonds: 1 }, lore: "嘴上功夫是真的，别用手挡。" },
  { id: "chest", name: "缠网浮箱", weight: 6, value: { rope: 2, plastic: 2 }, window: [0.6, 0.8], sea: "far",
    rarity: "junk", bar: 0.9, xp: 4, firstCatch: { coins: 4 }, lore: "谁家的快递漂了三年，签收了。" },

  // ── 深海（建成潜水船坞后入池）─────────────────────────
  { id: "angler", name: "灯笼鱼", weight: 5, value: { rawFish: 2, blueprint: 1 }, window: [0.2, 0.34], sea: "deep",
    rarity: "epic", bar: 1.3, xp: 16, firstCatch: { coins: 20, diamonds: 1 }, lore: "钓鱼线上唯一的蓝图快递员，头灯常亮。" },
  { id: "eel", name: "苍电鳗", weight: 6, value: { rawFish: 4 }, window: [0.22, 0.34], sea: "deep",
    rarity: "rare", bar: 1.25, xp: 12, firstCatch: { coins: 12 }, lore: "钓上来那一下，头发都精神了。" },
  { id: "squid", name: "墨仔鱿", weight: 8, value: { rawFish: 3 }, window: [0.3, 0.44], sea: "deep",
    rarity: "rare", bar: 1.15, xp: 10, firstCatch: { coins: 12 }, lore: "跑之前必喷一口墨，职场老手。" },
  { id: "coelacanth", name: "老古董", weight: 2, value: { rawFish: 6, blueprint: 1, badge: 1 }, window: [0.15, 0.23], sea: "deep",
    rarity: "legend", bar: 1.5, xp: 24, firstCatch: { coins: 40, diamonds: 2 }, lore: "比陆地还老的活化石，见过世界没淹的样子。" },

  // ── 深渊海沟（预留海域，Round 2 接线后入池）───────────
  { id: "ghost", name: "幽灵灯鱼", weight: 4, value: { blueprint: 1, hourglass: 2 }, window: [0.2, 0.3], sea: "abyss",
    rarity: "epic", bar: 1.4, xp: 18, firstCatch: { coins: 24, diamonds: 1 }, lore: "半透明的，钓上来才知道钩没空军。" },
  { id: "leviathan_fry", name: "海王鱼苗", weight: 2, value: { fillet: 3, badge: 2, hourglass: 3 }, window: [0.14, 0.22], sea: "abyss",
    rarity: "legend", bar: 1.55, xp: 26, firstCatch: { coins: 60, diamonds: 3 }, lore: "它长大之前，最好已经把它钓完了。" },
];

// 海域档案（Round 2 接线：castLine 的鱼池过滤改读本表 unlock 条件）。
export const SEAS = {
  near: { id: "near", name: "近海", unlock: { always: true }, desc: "木筏边上，开局可钓。" },
  far: { id: "far", name: "远洋", unlock: { building: "dive_dock", level: 1 }, desc: "潜水船坞的小艇能把钓线带出去。" },
  deep: { id: "deep", name: "深海", unlock: { building: "dive_dock", level: 1 }, desc: "灯笼鱼与蓝图所在。" },
  abyss: { id: "abyss", name: "深渊海沟", unlock: { building: "dive_dock", level: 3, stage: 18 }, desc: "后期海域：沙漏与徽章的复刷来源。" },
};

// 节奏条规格（Round 2 接线：钓鱼 UI 按此实现，替换滑杆+明示数字）。
export const FISHING_RULES = {
  barSweepSec: 1.6,    // 指针 0→1→0 一个来回的基准秒数；单条鱼实际 = barSweepSec / fish.bar
  perfectRatio: 0.35,  // 窗口中心 35% 区间判定「完美」
  perfectMult: 2,      // 完美收杆产物翻倍（蓝图等唯一掉落不翻倍）
  missCooldownSec: 1.2, // 脱钩后再抛竿冷却
  weatherField: "fishing", // 读 WEATHERS[*].fishing 作为咬钩率倍率；0 = 该天气禁钓
  windowHidden: true,  // 窗口只画在节奏条上（高亮区），禁止以数字直接泄底
};
