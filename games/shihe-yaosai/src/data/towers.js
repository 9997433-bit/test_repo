// 蚀核要塞 · 五塔数值（Fable-3 冻结，Round 1）
// 每塔 3 级；levels[k] 为该级"完整"数值（sim 直接整体读取，不做字段合并）。
// levels[0].cost = 建造价；levels[1].cost / levels[2].cost = 升到 Ⅱ / Ⅲ 级的升级价。
// 伤害口径：
//   kind 'hitscan' / 'burst' / 'missile' → damage 为单发伤害，rate 为每秒发数
//   kind 'beam' / 'aura'                → dps 为每秒伤害（sim 按 dps*dt 结算）
// 最终伤害 = 表值 × armorMultiplier(towerId, armor) ×（过载中 ×CONFIG.overclock.multiplier）。
// 距离均为 3D 世界单位（环半径 40 口径）。

export const TOWER_ORDER = ["rail", "prism", "scatter", "well", "star"];

export const TOWERS = {
  rail: {
    id: "rail",
    name: "轨炮",
    kind: "hitscan",
    targeting: "first", // 优先打离核最近者
    lanes: [0, 1, 2],
    desc: "长射程动能狙击，穿透直线上的多个目标。克甲壳，穿不透力场。",
    levels: [
      { cost: 70, range: 30, damage: 26, rate: 0.9, pierce: 2 },
      { cost: 56, range: 32, damage: 42, rate: 1.0, pierce: 2 },
      { cost: 98, range: 34, damage: 66, rate: 1.1, pierce: 3 },
    ],
  },

  prism: {
    id: "prism",
    name: "棱镜",
    kind: "beam",
    targeting: "first",
    lanes: [0, 1, 2],
    desc: "持续光束熔穿力场。若目标方向 refractRange 内另有棱镜则折射一次（最多 2 段）。",
    // 折射（Round 1 冻结）：第 2 段伤害 = dps × refractFalloff；只折 1 次。
    levels: [
      { cost: 90, range: 22, dps: 20, refractRange: 18, refractFalloff: 0.7 },
      { cost: 72, range: 24, dps: 32, refractRange: 18, refractFalloff: 0.7 },
      { cost: 126, range: 26, dps: 50, refractRange: 18, refractFalloff: 0.85 },
    ],
  },

  scatter: {
    id: "scatter",
    name: "霰星",
    kind: "burst",
    targeting: "first",
    lanes: [0, 1, 2],
    desc: "短程星屑爆发，命中点 aoeRadius 内至多 maxTargets 个敌人各吃一次 damage。克蜂群。",
    levels: [
      { cost: 60, range: 14, damage: 9, rate: 1.4, aoeRadius: 6, maxTargets: 6 },
      { cost: 48, range: 15, damage: 14, rate: 1.5, aoeRadius: 6, maxTargets: 7 },
      { cost: 84, range: 16, damage: 21, rate: 1.6, aoeRadius: 7, maxTargets: 9 },
    ],
  },

  well: {
    id: "well",
    name: "坠井",
    kind: "aura",
    targeting: "aura", // 无单目标：range 内全体持续生效
    lanes: [0, 1, 2],
    desc: "引力井：范围内全体减速 slowPct 并持续掉血。多口井减速不叠加，取最大值。",
    // slowPct 0.40 = 移速降为 60%。
    levels: [
      { cost: 80, range: 16, dps: 6, slowPct: 0.4 },
      { cost: 64, range: 17, dps: 10, slowPct: 0.48 },
      { cost: 112, range: 18, dps: 15, slowPct: 0.55 },
    ],
  },

  star: {
    id: "star",
    name: "星弩",
    kind: "missile",
    targeting: "maxHp", // 优先打当前血量最高者（点名精英/Boss）
    lanes: [0, 1, 2],
    desc: "全场追踪星矢，弹速 projectileSpeed，重击单体。打大不打小，蜂群会溢伤。",
    levels: [
      { cost: 110, range: 34, damage: 55, rate: 0.45, projectileSpeed: 26 },
      { cost: 88, range: 36, damage: 88, rate: 0.5, projectileSpeed: 26 },
      { cost: 154, range: 38, damage: 140, rate: 0.55, projectileSpeed: 30 },
    ],
  },
};

/**
 * 建造价（1 级 cost）。
 * @param {string} towerId
 * @returns {number}
 */
export function towerCost(towerId) {
  const t = TOWERS[towerId];
  if (!t) throw new Error(`towerCost: unknown towerId "${towerId}"`);
  return t.levels[0].cost;
}

/**
 * 当前等级可用的升级项。level 取 1..3（1 = 刚建成）。满级返回 []。
 * @param {string} towerId
 * @param {number} level 当前等级（1 起）
 * @returns {{ toLevel:number, cost:number, label:string, stats:object }[]}
 */
export function upgradeOptions(towerId, level) {
  const t = TOWERS[towerId];
  if (!t) throw new Error(`upgradeOptions: unknown towerId "${towerId}"`);
  if (level >= t.levels.length) return [];
  const next = t.levels[level]; // levels[level] 即下一级（level 1 → levels[1]）
  const numerals = ["Ⅰ", "Ⅱ", "Ⅲ"];
  return [
    {
      toLevel: level + 1,
      cost: next.cost,
      label: `${t.name} ${numerals[level] ?? level + 1}`,
      stats: next,
    },
  ];
}
