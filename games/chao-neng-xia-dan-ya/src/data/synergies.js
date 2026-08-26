/**
 * 流派羁绊与种族科技（纯数据）。
 * 上场 5 人中同流派人数达到 2 / 3 / 4 时依次激活对应档位（高档包含并覆盖低档同名键）。
 */
export const SCHOOLS = {
  combo: { id: "combo", name: "连击流", color: "#FF6B9D", icon: "combo", tagline: "短间隔命中叠层，满层引爆「爆蛋时刻」" },
  brute: { id: "brute", name: "直殴流", color: "#FF9F1C", icon: "fist", tagline: "主蛋大力出奇迹，稳定清图开荒" },
  elemental: { id: "elemental", name: "属性流", color: "#3A86FF", icon: "spark", tagline: "火冰雷附着与反应，群怪蒸发" },
  collide: { id: "collide", name: "碰撞流", color: "#06D6A0", icon: "bounce", tagline: "弹得越多打得越疼，钉板图之王" },
};

/**
 * 套装效果数值。
 * mod 键约定（combat 消费）：
 * - comboWindowBonusSec   连击保持窗口延长（秒）
 * - comboCritDmgPerStack  每层连击额外暴伤（叠加在基础 6% 之上）
 * - critChanceAt10        连击≥10 层时暴击率加成
 * - eggBurstMult          「爆蛋时刻」伤害倍率
 * - burstKeepStacksPct    爆蛋后保留的连击层数比例
 * - teamAtkPct            全队攻击加成
 * - mainEggMult           主蛋伤害倍率（取最高档，不叠乘）
 * - brickShockChance/brickShockPct 击碎砖块触发冲击波概率/伤害（攻击%）
 * - pierce                主蛋穿透 +N
 * - elementDmgPct         元素伤害加成
 * - reactionMult          元素反应倍率加成（乘在反应基础倍率上）
 * - stacksToProc          同元素触发层数需求（默认 3）
 * - autoEnchantFirstEgg   每回合首蛋自动附当前英雄元素
 * - energyOnReaction      每次元素反应回能
 * - dmgPerBouncePct/bounceDmgCapPct 每次碰撞伤害加成/上限
 * - bouncinessBonus       蛋弹性加成
 * - pegSpawnChance/pegSpawnPct 钉碰撞弹出小蛋概率/伤害（攻击%）
 * - energyPerBounceOnRecall/energyPerBounceMax 回收按碰撞数返能（每次/上限）
 */
export const SYNERGIES = {
  combo: {
    school: "combo",
    tiers: [
      {
        count: 2,
        name: "小连段",
        desc: "连击窗口 +0.8 秒，每层连击额外 +2% 暴击伤害。",
        mod: { comboWindowBonusSec: 0.8, comboCritDmgPerStack: 0.02 },
      },
      {
        count: 3,
        name: "大连段",
        desc: "连击≥10 层时全队暴击率 +15%；「爆蛋时刻」伤害 ×1.5。",
        mod: { critChanceAt10: 0.15, eggBurstMult: 1.5 },
      },
      {
        count: 4,
        name: "禽王光环·连击",
        desc: "「爆蛋时刻」后保留 50% 连击层数，全队攻击 +10%。",
        mod: { burstKeepStacksPct: 0.5, teamAtkPct: 0.1 },
      },
    ],
  },
  brute: {
    school: "brute",
    tiers: [
      {
        count: 2,
        name: "铁蛋",
        desc: "主蛋伤害 ×1.25，命中砖块附带击退。",
        mod: { mainEggMult: 1.25 },
      },
      {
        count: 3,
        name: "重锤",
        desc: "击碎砖块时 30% 概率震出 80% 攻击的冲击波。",
        mod: { brickShockChance: 0.3, brickShockPct: 0.8 },
      },
      {
        count: 4,
        name: "禽王光环·直殴",
        desc: "主蛋伤害提升至 ×1.4，并获得 1 层穿透。",
        mod: { mainEggMult: 1.4, pierce: 1 },
      },
    ],
  },
  elemental: {
    school: "elemental",
    tiers: [
      {
        count: 2,
        name: "附魔学徒",
        desc: "元素伤害 +12%。",
        mod: { elementDmgPct: 0.12 },
      },
      {
        count: 3,
        name: "反应大师",
        desc: "元素反应伤害 ×1.3，同元素触发层数需求 3 → 2。",
        mod: { reactionMult: 1.3, stacksToProc: 2 },
      },
      {
        count: 4,
        name: "禽王光环·属性",
        desc: "每回合首枚蛋自动附当前英雄元素；每次元素反应全队回 10 能量。",
        mod: { autoEnchantFirstEgg: true, energyOnReaction: 10 },
      },
    ],
  },
  collide: {
    school: "collide",
    tiers: [
      {
        count: 2,
        name: "弹力初醒",
        desc: "每次碰撞本蛋伤害 +3%（上限 +30%）。",
        mod: { dmgPerBouncePct: 0.03, bounceDmgCapPct: 0.3 },
      },
      {
        count: 3,
        name: "弹力全开",
        desc: "蛋弹性 +0.06；钉碰撞 25% 概率弹出一枚 40% 攻击的小蛋。",
        mod: { bouncinessBonus: 0.06, pegSpawnChance: 0.25, pegSpawnPct: 0.4 },
      },
      {
        count: 4,
        name: "禽王光环·碰撞",
        desc: "碰撞伤害上限提升至 +60%；回收时按总碰撞次数每次返还全队 2 能量（上限 30）。",
        mod: { bounceDmgCapPct: 0.6, energyPerBounceOnRecall: 2, energyPerBounceMax: 30 },
      },
    ],
  },
};

/** 种族（图鉴/联盟科技简化版展示用）。 */
export const RACES = {
  chicken: { id: "chicken", name: "鸡族", icon: "comb" },
  duck: { id: "duck", name: "鸭族", icon: "bill" },
  goose: { id: "goose", name: "鹅族", icon: "neck" },
  bird: { id: "bird", name: "百鸟", icon: "wing" },
};

/**
 * 种族科技：图鉴中「已拥有」该种族英雄数达到 need 时永久激活（全模式生效，肉鸽除外）。
 * 全 18 只分布：鸡 4 / 鸭 4 / 鹅 3 / 鸟 7。
 */
export const RACE_TECH = {
  chicken: { race: "chicken", need: 4, name: "鸡族战意", desc: "全队暴击率 +3%", mod: { critChance: 0.03 } },
  duck: { race: "duck", need: 4, name: "鸭族厚脸皮", desc: "玩家生命上限 +10%", mod: { playerHpPct: 0.1 } },
  goose: { race: "goose", need: 3, name: "鹅族气势", desc: "能量获取 +10%", mod: { energyGainPct: 0.1 } },
  bird: { race: "bird", need: 5, name: "百鸟朝凤", desc: "全队攻击 +5%", mod: { atkPct: 0.05 } },
};
