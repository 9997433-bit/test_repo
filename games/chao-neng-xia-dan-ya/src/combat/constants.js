/**
 * 战斗层常量与数值调参。
 *
 * 本文件只放「战斗规则」的调参，不放内容表（英雄/关卡/敌人属于 src/data）。
 * 所有导出均为常量对象，纯函数模块按需读取。
 */

/** 元素枚举。physical 表示无元素附着。 */
export const ELEMENT = {
  PHYSICAL: "physical",
  FIRE: "fire",
  ICE: "ice",
  THUNDER: "thunder",
};

/** 参与附着与反应的元素（不含 physical）。 */
export const REACTIVE_ELEMENTS = [ELEMENT.FIRE, ELEMENT.ICE, ELEMENT.THUNDER];

/** 流派枚举，与 src/data 英雄表的 school 字段对齐。 */
export const SCHOOL = {
  COMBO: "combo",
  BRUTE: "brute",
  ELEMENTAL: "elemental",
  COLLIDE: "collide",
  SUPPORT: "support",
};

/** 种族枚举，与 src/data 英雄表的 race 字段对齐。 */
export const RACE = {
  DUCK: "duck",
  CHICK: "chicken",
  GOOSE: "goose",
  BIRD: "bird",
};

/** 早期脚手架用过的种族写法，统一归一到 src/data 的口径。 */
export const RACE_ALIAS = {
  chick: RACE.CHICK,
  chickens: RACE.CHICK,
  ducks: RACE.DUCK,
  geese: RACE.GOOSE,
  birds: RACE.BIRD,
};

/** 状态枚举。 */
export const STATUS = {
  BURN: "burn",
  FREEZE: "freeze",
  SHOCK: "shock",
  ARMOR_BREAK: "armor_break",
  SLOW: "slow",
  VULNERABLE: "vulnerable",
};

/** 元素反应枚举。 */
export const REACTION = {
  VAPORIZE: "vaporize",
  SUPERCONDUCT: "superconduct",
  OVERLOAD: "overload",
};

/** 反应中文名，供 HUD 飘字使用。 */
export const REACTION_LABEL = {
  [REACTION.VAPORIZE]: "蒸发",
  [REACTION.SUPERCONDUCT]: "超导",
  [REACTION.OVERLOAD]: "超载",
};

/** 连击 / 爆蛋时刻调参。 */
export const COMBO = {
  /** 满层触发爆蛋时刻。 */
  MAX: 20,
  /** 命中后连击保持窗口（秒），窗口内再次命中不衰减。 */
  WINDOW: 2.2,
  /** 超出窗口后的衰减速度（层 / 秒）。 */
  DECAY_PER_SEC: 4,
  /** 每层提供的直伤加成。 */
  DAMAGE_PER_STACK: 0.015,
  /** 每层提供的暴击伤害加成（GDD：连击流每层 +6% 暴伤）。 */
  CRIT_DMG_PER_STACK: 0.06,
  /** 每层提供的暴击率加成。 */
  CRIT_CHANCE_PER_STACK: 0.006,
  /** 连击流 3 人羁绊「连击≥N 层时全队暴击率 +x%」的门槛层数。 */
  CRIT_BONUS_STACKS: 10,
  /** 爆蛋时刻持续时间（秒）。 */
  BURST_DURATION: 4,
  /** 爆蛋时刻期间的全局伤害倍率。 */
  BURST_DAMAGE_MULT: 1.5,
  /** 爆蛋瞬间的大爆炸半径与伤害系数（相对本次命中伤害）。 */
  BURST_RADIUS: 168,
  BURST_RATIO: 2.4,
  /** 爆蛋时刻内每次命中附带的小爆炸。 */
  BURST_HIT_RADIUS: 76,
  BURST_HIT_RATIO: 0.35,
};

/** 元素附着与反应调参。 */
export const ELEMENTS = {
  /** 同元素叠到该层数触发饱和效果。 */
  STACK_MAX: 3,
  /** 附着残留时长（秒）。 */
  AURA_DURATION: 6,
  /** 附着强度基准，元素流羁绊会放大。 */
  BASE_POWER: 1,
  /** 火 3 层：持续灼烧。 */
  BURN: { duration: 4, interval: 0.5, ratio: 0.18 },
  /** 冰 3 层：冻结 1.2s。 */
  FREEZE: { duration: 1.2, damageTakenMult: 1.15 },
  /** 雷 3 层：弹跳 2 次。 */
  SHOCK: { duration: 5, hops: 2, falloff: 0.55, radius: 150, ratio: 0.6 },
  /** 火 + 冰 = 蒸发：伤害 ×1.4 并移除冻结。 */
  VAPORIZE: { damageMult: 1.4 },
  /** 雷 + 冰 = 超导：破甲 8s。 */
  SUPERCONDUCT: { duration: 8, armorShred: 0.45, damageMult: 1.1 },
  /** 雷 + 火 = 超载：小爆炸。 */
  OVERLOAD: { radius: 118, ratio: 0.9, damageMult: 1.05 },
};

/** 暴击基准。 */
export const CRIT = {
  BASE_CHANCE: 0.05,
  BASE_MULT: 1.6,
  MAX_CHANCE: 0.95,
};

/** 流派对主蛋结算的直接影响。 */
export const SCHOOL_MODIFIER = {
  [SCHOOL.COMBO]: { damageMult: 1, comboGain: 1 },
  /** GDD：直殴流主蛋伤害 ×1.25。 */
  [SCHOOL.BRUTE]: { damageMult: 1.25, comboGain: 0 },
  [SCHOOL.ELEMENTAL]: { damageMult: 1, comboGain: 0, elementPowerMult: 1.2 },
  /** 碰撞流把碰撞次数转成伤害。 */
  [SCHOOL.COLLIDE]: { damageMult: 1, comboGain: 0, collisionDamageMult: 1.25 },
  [SCHOOL.SUPPORT]: { damageMult: 0.85, comboGain: 0 },
};

/** 每次碰撞（钉 / 墙 / 蛋）提供的伤害加成基数。 */
export const COLLISION = {
  DAMAGE_PER_HIT: 0.05,
  MAX_STACKS: 12,
};

/** 护甲减伤常数：mult = K / (K + armor)。 */
export const ARMOR_K = 100;

/** 元素抗性夹取区间。 */
export const RESIST_CLAMP = { min: -0.5, max: 0.9 };

/** 默认蛋攻击力，用于缺省字段兜底。 */
export const DEFAULT_EGG_POWER = 10;
