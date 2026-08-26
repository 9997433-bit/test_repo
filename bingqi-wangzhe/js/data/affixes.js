/**
 * 词条池 — 纯数据，无副作用。
 *
 * 词条形状：
 * {
 *   id, name, stat, unit: 'pct' | 'flat',
 *   min, max,               // 基准数值区间（rare 品质为 1.0 倍基准）
 *   weight,                 // 抽取权重
 *   minQuality,             // 低于该品质不会出现
 *   elementLocked,          // true 时数值只对持有者主元素生效
 *   desc
 * }
 *
 * 实例化后写入兵器 `affixes[]`：
 *   { id, stat, value, unit, quality }
 */

const AF = (o) => Object.freeze(o);

export const AFFIXES = Object.freeze([
  AF({
    id: 'af_elem_dmg',
    name: '相生',
    stat: 'elementDmg',
    unit: 'pct',
    min: 0.06,
    max: 0.18,
    weight: 120,
    minQuality: 'common',
    elementLocked: true,
    desc: '本命元素伤害提升',
  }),
  AF({
    id: 'af_crit',
    name: '锋锐',
    stat: 'crit',
    unit: 'pct',
    min: 0.03,
    max: 0.12,
    weight: 110,
    minQuality: 'common',
    elementLocked: false,
    desc: '暴击率提升',
  }),
  AF({
    id: 'af_crit_dmg',
    name: '裂帛',
    stat: 'critDmg',
    unit: 'pct',
    min: 0.1,
    max: 0.35,
    weight: 85,
    minQuality: 'uncommon',
    elementLocked: false,
    desc: '暴击伤害提升',
  }),
  AF({
    id: 'af_lifesteal',
    name: '饮血',
    stat: 'lifesteal',
    unit: 'pct',
    min: 0.04,
    max: 0.14,
    weight: 70,
    minQuality: 'uncommon',
    elementLocked: false,
    desc: '造成伤害时按比例回复生命',
  }),
  AF({
    id: 'af_combo',
    name: '连环',
    stat: 'combo',
    unit: 'pct',
    min: 0.04,
    max: 0.15,
    weight: 75,
    minQuality: 'uncommon',
    elementLocked: false,
    desc: '有几率追加一次普攻',
  }),
  AF({
    id: 'af_mitigation',
    name: '坚壁',
    stat: 'mitigation',
    unit: 'pct',
    min: 0.03,
    max: 0.12,
    weight: 95,
    minQuality: 'common',
    elementLocked: false,
    desc: '受到伤害降低',
  }),
  AF({
    id: 'af_speed',
    name: '迅捷',
    stat: 'speed',
    unit: 'flat',
    min: 4,
    max: 16,
    weight: 100,
    minQuality: 'common',
    elementLocked: false,
    desc: '速度提升，更早行动',
  }),
  AF({
    id: 'af_reflect',
    name: '反锋',
    stat: 'reflect',
    unit: 'pct',
    min: 0.05,
    max: 0.2,
    weight: 60,
    minQuality: 'uncommon',
    elementLocked: false,
    desc: '将受到伤害的一部分反弹给攻击者',
  }),
  AF({
    id: 'af_atk_pct',
    name: '开锋',
    stat: 'atkPct',
    unit: 'pct',
    min: 0.05,
    max: 0.16,
    weight: 105,
    minQuality: 'common',
    elementLocked: false,
    desc: '攻击力提升',
  }),
  AF({
    id: 'af_hp_pct',
    name: '厚重',
    stat: 'hpPct',
    unit: 'pct',
    min: 0.06,
    max: 0.2,
    weight: 105,
    minQuality: 'common',
    elementLocked: false,
    desc: '生命上限提升',
  }),
  AF({
    id: 'af_pierce',
    name: '破甲',
    stat: 'pierce',
    unit: 'pct',
    min: 0.05,
    max: 0.18,
    weight: 65,
    minQuality: 'rare',
    elementLocked: false,
    desc: '无视目标部分减伤',
  }),
  AF({
    id: 'af_first_strike',
    name: '先声',
    stat: 'firstStrike',
    unit: 'pct',
    min: 0.12,
    max: 0.4,
    weight: 45,
    minQuality: 'rare',
    elementLocked: false,
    desc: '首回合造成的伤害提升',
  }),
  AF({
    id: 'af_execute',
    name: '断魂',
    stat: 'execute',
    unit: 'pct',
    min: 0.08,
    max: 0.25,
    weight: 32,
    minQuality: 'epic',
    elementLocked: false,
    desc: '对残血目标追加伤害',
  }),
  AF({
    id: 'af_cd_down',
    name: '通玄',
    stat: 'cdDown',
    unit: 'flat',
    min: 1,
    max: 1,
    weight: 18,
    minQuality: 'legendary',
    elementLocked: false,
    desc: '技能冷却 -1 回合',
  }),
]);

export const AFFIX_BY_ID = Object.freeze(
  AFFIXES.reduce((acc, a) => {
    acc[a.id] = a;
    return acc;
  }, Object.create(null)),
);

/** 词条实例的品质标签，用于 UI 上色（按 roll 值在区间中的位置）。 */
export const AFFIX_ROLL_TIERS = Object.freeze([
  Object.freeze({ id: 'plain', name: '平', maxRoll: 0.35 }),
  Object.freeze({ id: 'fine', name: '良', maxRoll: 0.7 }),
  Object.freeze({ id: 'superb', name: '绝', maxRoll: 0.92 }),
  Object.freeze({ id: 'perfect', name: '极', maxRoll: 1.01 }),
]);

export default AFFIXES;
