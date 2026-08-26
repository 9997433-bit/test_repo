/**
 * 技能库 — 纯数据，无副作用。
 *
 * 技能形状：
 * {
 *   id, name, type: 'active' | 'passive',
 *   element: 'fire' | 'ice' | 'thunder' | null,   // null = 跟随持有者主元素
 *   cd,            // 主动技冷却回合数；被动为 0
 *   target,        // 'single' | 'all' | 'lowest' | 'random' | 'self' | 'allies'
 *   power,         // 伤害系数（乘持有者 atk），治疗/护盾同样复用
 *   hits,          // 段数
 *   effects: [{ kind, value, duration, chance }],
 *   desc, tags: []
 * }
 *
 * effect.kind 约定（战斗层实现）：
 *   burn 灼烧DoT / chill 减速 / shock 麻痹 / bleed 流血
 *   atkUp 攻击提升 / defDown 破防 / speedUp 迅捷 / speedDown 迟滞
 *   shield 护盾 / heal 治疗 / lifesteal 吸血 / reflect 反伤
 *   pierce 无视减伤 / execute 斩杀 / combo 追击 / cleanse 净化 / taunt 嘲讽
 */

const A = (id, name, element, cd, target, power, hits, effects, desc, tags) =>
  Object.freeze({
    id,
    name,
    type: 'active',
    element,
    cd,
    target,
    power,
    hits,
    effects: Object.freeze(effects.map((e) => Object.freeze(e))),
    desc,
    tags: Object.freeze(tags),
  });

const P = (id, name, element, effects, desc, tags) =>
  Object.freeze({
    id,
    name,
    type: 'passive',
    element,
    cd: 0,
    target: 'self',
    power: 0,
    hits: 0,
    effects: Object.freeze(effects.map((e) => Object.freeze(e))),
    desc,
    tags: Object.freeze(tags),
  });

/* ------------------------------------------------------------------ *
 * 精铁炉 兵器技
 * ------------------------------------------------------------------ */

export const IRON_SKILLS = Object.freeze([
  A('sk_liehuo_zhan', '烈火斩', 'fire', 3, 'single', 1.45, 1,
    [{ kind: 'burn', value: 0.18, duration: 2, chance: 0.6 }],
    '一记炉火淬过的斩击，有几率点燃目标。', ['burst', 'dot']),

  A('sk_hanfeng_ci', '寒锋刺', 'ice', 3, 'single', 1.3, 2,
    [{ kind: 'chill', value: 0.15, duration: 2, chance: 0.5 }],
    '两段快刺，寒气顺着伤口爬上对手的手腕。', ['multi', 'control']),

  A('sk_leiting_tu', '雷霆突', 'thunder', 3, 'single', 1.6, 1,
    [{ kind: 'shock', value: 1, duration: 1, chance: 0.25 }],
    '借步突刺，枪尖带起一线电光。', ['burst', 'control']),

  A('sk_hanyu_she', '寒羽射', 'ice', 3, 'lowest', 1.55, 1,
    [{ kind: 'speedDown', value: 0.12, duration: 2, chance: 0.55 }],
    '白羽掠过，专挑最虚弱的那一个。', ['snipe']),

  A('sk_pishan', '劈山', 'fire', 4, 'single', 1.9, 1,
    [{ kind: 'defDown', value: 0.12, duration: 2, chance: 0.7 }],
    '樵夫的手艺：不讲章法，只讲一下劈到底。', ['burst', 'break']),

  A('sk_leiming_ji', '雷鸣击', 'thunder', 4, 'all', 1.05, 1,
    [{ kind: 'shock', value: 1, duration: 1, chance: 0.18 }],
    '锤头砸地，整条阵线都跟着抖了一下。', ['aoe', 'control']),

  A('sk_qingfeng_fu', '清风拂', 'ice', 3, 'allies', 0.55, 1,
    [{ kind: 'heal', value: 0.55, duration: 0, chance: 1 }, { kind: 'cleanse', value: 1, duration: 0, chance: 0.35 }],
    '扇面一合一开，替同袍拂去灼痕。', ['support', 'heal']),

  A('sk_liyin_zhen', '离音震', 'thunder', 4, 'all', 0.9, 1,
    [{ kind: 'defDown', value: 0.1, duration: 2, chance: 0.5 }],
    '一声笛响拉长，听得人骨缝发麻。', ['aoe', 'break']),

  A('sk_zhepeng', '遮篷', 'fire', 4, 'self', 0, 0,
    [{ kind: 'shield', value: 0.9, duration: 2, chance: 1 }, { kind: 'reflect', value: 0.15, duration: 2, chance: 1 }],
    '伞骨撑开，雨与刀都被挡在外头。', ['defense', 'shield']),

  A('sk_beici', '背刺', 'fire', 3, 'lowest', 1.75, 1,
    [{ kind: 'bleed', value: 0.14, duration: 2, chance: 0.5 }],
    '巷口的规矩：出手要快，最好只出一次。', ['burst', 'dot']),

  A('sk_hengsao', '横扫', 'fire', 3, 'all', 1.0, 1,
    [{ kind: 'speedDown', value: 0.08, duration: 1, chance: 0.4 }],
    '戟杆横过半个战场，逼退所有靠近的人。', ['aoe']),

  A('sk_shouye_nu', '守夜弩', 'thunder', 3, 'single', 1.4, 2,
    [{ kind: 'pierce', value: 0.2, duration: 0, chance: 1 }],
    '守夜人的两连发，专破皮甲与侥幸。', ['multi', 'pierce']),
]);

/* ------------------------------------------------------------------ *
 * 白银炉 兵器技
 * ------------------------------------------------------------------ */

export const SILVER_SKILLS = Object.freeze([
  A('sk_yanwu_zhan', '焰舞斩', 'fire', 3, 'single', 1.7, 3,
    [{ kind: 'burn', value: 0.22, duration: 3, chance: 0.75 }],
    '三段旋斩，火舌顺着剑脊缠上去。', ['multi', 'dot']),

  A('sk_shuangfeng_lian', '霜锋连', 'ice', 3, 'single', 1.55, 3,
    [{ kind: 'chill', value: 0.18, duration: 2, chance: 0.7 }, { kind: 'combo', value: 0.3, duration: 0, chance: 0.3 }],
    '刀走连环，落雪一样细密。', ['multi', 'control']),

  A('sk_binghe_ci', '冰河刺', 'ice', 4, 'all', 1.15, 1,
    [{ kind: 'chill', value: 0.2, duration: 2, chance: 0.55 }, { kind: 'defDown', value: 0.1, duration: 2, chance: 0.4 }],
    '枪尖点地，脚下结出一条河。', ['aoe', 'control']),

  A('sk_xingluo_ji', '星落戟', 'thunder', 4, 'all', 1.35, 1,
    [{ kind: 'shock', value: 1, duration: 1, chance: 0.3 }],
    '戟影自上而下，像一场砸下来的星雨。', ['aoe', 'burst']),

  A('sk_liehuo_nu', '裂火弩', 'fire', 3, 'single', 2.05, 1,
    [{ kind: 'burn', value: 0.25, duration: 3, chance: 0.65 }, { kind: 'pierce', value: 0.25, duration: 0, chance: 1 }],
    '一矢入甲，甲缝里先烧起来。', ['snipe', 'pierce']),

  A('sk_lianzhu_lei', '连珠雷', 'thunder', 3, 'random', 1.05, 4,
    [{ kind: 'shock', value: 1, duration: 1, chance: 0.15 }],
    '四矢连发，谁也不知道下一支落在谁身上。', ['multi', 'random']),

  A('sk_bingpo_zhan', '冰魄斩', 'ice', 4, 'single', 2.2, 1,
    [{ kind: 'chill', value: 0.25, duration: 3, chance: 0.8 }, { kind: 'defDown', value: 0.15, duration: 2, chance: 0.6 }],
    '斧刃过处，血还没流就冻住了。', ['burst', 'control']),

  A('sk_ronghuo_za', '熔火砸', 'fire', 4, 'all', 1.25, 1,
    [{ kind: 'burn', value: 0.2, duration: 3, chance: 0.6 }, { kind: 'defDown', value: 0.12, duration: 2, chance: 0.5 }],
    '锤心带着窑温，砸下去溅起一地火星。', ['aoe', 'dot']),

  A('sk_yanwei_shan', '焰尾扇', 'fire', 3, 'all', 1.1, 1,
    [{ kind: 'atkUp', value: 0.15, duration: 2, chance: 1 }],
    '扇尾扫出一线火，顺手替自己人添了口气。', ['aoe', 'support']),

  A('sk_jiuxiao_yin', '九霄引', 'thunder', 4, 'allies', 0, 0,
    [{ kind: 'atkUp', value: 0.22, duration: 3, chance: 1 }, { kind: 'speedUp', value: 0.15, duration: 3, chance: 1 }],
    '笛声往上走，走到云里，人也跟着轻了。', ['support', 'buff']),

  A('sk_xuemu', '雪幕', 'ice', 4, 'allies', 0, 0,
    [{ kind: 'shield', value: 1.3, duration: 2, chance: 1 }, { kind: 'chill', value: 0.12, duration: 2, chance: 0.4 }],
    '伞面一转，雪落成墙。', ['defense', 'shield']),

  A('sk_linguang_ci', '鳞光刺', 'ice', 3, 'lowest', 1.95, 1,
    [{ kind: 'lifesteal', value: 0.3, duration: 0, chance: 1 }, { kind: 'bleed', value: 0.16, duration: 2, chance: 0.5 }],
    '刃身薄如鱼鳞，进去容易出来难。', ['snipe', 'sustain']),

  A('sk_qiuhong_she', '秋鸿射', 'ice', 3, 'single', 1.85, 1,
    [{ kind: 'speedDown', value: 0.18, duration: 2, chance: 0.6 }, { kind: 'combo', value: 0.35, duration: 0, chance: 0.35 }],
    '弦声在雁群散尽之后才到。', ['snipe', 'combo']),
]);

/* ------------------------------------------------------------------ *
 * 黄金炉 兵器技
 * ------------------------------------------------------------------ */

export const GOLD_SKILLS = Object.freeze([
  A('sk_poxiao_yijian', '破晓一剑', 'thunder', 4, 'single', 2.85, 1,
    [{ kind: 'pierce', value: 0.35, duration: 0, chance: 1 }, { kind: 'execute', value: 0.25, duration: 0, chance: 1 }],
    '天亮之前只出一剑，天亮之后不必再出。', ['burst', 'execute']),

  A('sk_wangchuan_zhan', '忘川斩', 'ice', 4, 'single', 2.5, 2,
    [{ kind: 'lifesteal', value: 0.4, duration: 0, chance: 1 }, { kind: 'chill', value: 0.22, duration: 3, chance: 0.7 }],
    '刀过处水声不断，渡魂不渡人。', ['multi', 'sustain']),

  A('sk_tunri_ci', '吞日刺', 'fire', 4, 'single', 2.95, 1,
    [{ kind: 'burn', value: 0.35, duration: 3, chance: 0.85 }, { kind: 'defDown', value: 0.2, duration: 3, chance: 0.8 }],
    '枪尖抬起时，天上少了一轮日。', ['burst', 'dot']),

  A('sk_jiuli_hengsao', '九黎横扫', 'thunder', 4, 'all', 1.85, 1,
    [{ kind: 'shock', value: 1, duration: 1, chance: 0.35 }, { kind: 'atkUp', value: 0.18, duration: 3, chance: 1 }],
    '战旗不倒，戟就不停。', ['aoe', 'buff']),

  A('sk_shechen', '射尘', 'fire', 4, 'lowest', 3.1, 1,
    [{ kind: 'execute', value: 0.35, duration: 0, chance: 1 }, { kind: 'pierce', value: 0.3, duration: 0, chance: 1 }],
    '一箭定关，关上的人来不及回头。', ['snipe', 'execute']),

  A('sk_zhenchao', '镇潮', 'ice', 5, 'all', 1.6, 1,
    [{ kind: 'shield', value: 1.8, duration: 3, chance: 1 }, { kind: 'taunt', value: 1, duration: 2, chance: 0.6 }],
    '锤落海堰，千年的潮都得让路。', ['aoe', 'defense']),

  A('sk_duanlong', '断龙', 'thunder', 5, 'single', 3.3, 1,
    [{ kind: 'defDown', value: 0.28, duration: 3, chance: 1 }, { kind: 'bleed', value: 0.25, duration: 3, chance: 0.7 }],
    '斧起斧落，龙脊在雷里断成两截。', ['burst', 'break']),

  A('sk_fenji', '焚寂', 'fire', 4, 'all', 1.7, 1,
    [{ kind: 'burn', value: 0.3, duration: 3, chance: 0.8 }, { kind: 'atkUp', value: 0.2, duration: 3, chance: 1 }],
    '一扇合上，世上安静了；再打开，世上烧起来了。', ['aoe', 'dot']),

  A('sk_zhaohun', '招魂', 'ice', 5, 'allies', 0, 0,
    [{ kind: 'heal', value: 1.4, duration: 0, chance: 1 }, { kind: 'atkUp', value: 0.25, duration: 3, chance: 1 }, { kind: 'cleanse', value: 1, duration: 0, chance: 1 }],
    '旧部听见笛声，就都回营了。', ['support', 'heal']),

  A('sk_zhetian', '遮天', 'thunder', 5, 'allies', 0, 0,
    [{ kind: 'shield', value: 2.2, duration: 3, chance: 1 }, { kind: 'reflect', value: 0.3, duration: 3, chance: 1 }],
    '伞下无雨，也无雷。', ['defense', 'shield']),

  A('sk_wanji', '万机', 'thunder', 4, 'random', 1.35, 5,
    [{ kind: 'shock', value: 1, duration: 1, chance: 0.2 }, { kind: 'combo', value: 0.4, duration: 0, chance: 0.4 }],
    '机括开合如雨，数不清是第几支。', ['multi', 'random']),

  A('sk_chanyi', '蝉翼', 'fire', 3, 'single', 2.4, 3,
    [{ kind: 'combo', value: 0.5, duration: 0, chance: 0.5 }, { kind: 'lifesteal', value: 0.25, duration: 0, chance: 1 }],
    '三刀落下都没有声音，第四刀才有。', ['multi', 'combo']),
]);

/* ------------------------------------------------------------------ *
 * 神话 兵器技
 * ------------------------------------------------------------------ */

export const MYTHIC_SKILLS = Object.freeze([
  A('sk_zhulong_kaimu', '烛龙开目', 'fire', 5, 'all', 2.6, 1,
    [
      { kind: 'burn', value: 0.45, duration: 4, chance: 1 },
      { kind: 'defDown', value: 0.25, duration: 3, chance: 1 },
      { kind: 'atkUp', value: 0.3, duration: 3, chance: 1 },
    ],
    '烛龙睁眼为昼，闭眼为夜；此刻它睁着眼。', ['aoe', 'mythic', 'dot']),

  A('sk_xuanming_fengyuan', '玄冥封渊', 'ice', 5, 'all', 2.3, 1,
    [
      { kind: 'chill', value: 0.35, duration: 4, chance: 1 },
      { kind: 'speedDown', value: 0.3, duration: 3, chance: 1 },
      { kind: 'shield', value: 2.0, duration: 3, chance: 1 },
    ],
    '寒渊合口，连时间都走得慢了。', ['aoe', 'mythic', 'control']),

  A('sk_leize_tianwen', '雷泽天问', 'thunder', 5, 'single', 4.2, 1,
    [
      { kind: 'shock', value: 1, duration: 2, chance: 0.75 },
      { kind: 'pierce', value: 0.5, duration: 0, chance: 1 },
      { kind: 'execute', value: 0.4, duration: 0, chance: 1 },
    ],
    '问天者不必等答案，剑落即是回声。', ['burst', 'mythic', 'execute']),

  A('sk_taixu_xingyun', '太虚星陨', 'fire', 5, 'random', 1.9, 4,
    [
      { kind: 'burn', value: 0.3, duration: 3, chance: 0.8 },
      { kind: 'combo', value: 0.6, duration: 0, chance: 0.5 },
      { kind: 'speedUp', value: 0.25, duration: 3, chance: 1 },
    ],
    '拉满这张弓的人，要先学会松手。', ['multi', 'mythic', 'combo']),
]);

/* ------------------------------------------------------------------ *
 * 羁绊（被动）— 战斗层按 BOND_RULES 触发
 * ------------------------------------------------------------------ */

export const BOND_SKILLS = Object.freeze([
  P('bond_type_sword', '剑心', null, [{ kind: 'atkUp', value: 0.12, duration: 0, chance: 1 }], '同阵 2 把剑：全体攻击 +12%。', ['bond', 'type']),
  P('bond_type_saber', '刀势', null, [{ kind: 'combo', value: 0.1, duration: 0, chance: 1 }], '同阵 2 把刀：全体连击率 +10%。', ['bond', 'type']),
  P('bond_type_spear', '枪列', null, [{ kind: 'pierce', value: 0.12, duration: 0, chance: 1 }], '同阵 2 杆枪：全体破防 +12%。', ['bond', 'type']),
  P('bond_type_halberd', '戟阵', null, [{ kind: 'defUp', value: 0.12, duration: 0, chance: 1 }], '同阵 2 杆戟：全体减伤 +12%。', ['bond', 'type']),
  P('bond_type_bow', '雁行', null, [{ kind: 'critUp', value: 0.1, duration: 0, chance: 1 }], '同阵 2 张弓：全体暴击 +10%。', ['bond', 'type']),
  P('bond_type_crossbow', '机括', null, [{ kind: 'speedUp', value: 0.1, duration: 0, chance: 1 }], '同阵 2 具弩：全体速度 +10%。', ['bond', 'type']),
  P('bond_type_axe', '斧劲', null, [{ kind: 'critDmgUp', value: 0.2, duration: 0, chance: 1 }], '同阵 2 把斧：全体暴伤 +20%。', ['bond', 'type']),
  P('bond_type_hammer', '锤镇', null, [{ kind: 'hpUp', value: 0.15, duration: 0, chance: 1 }], '同阵 2 柄锤：全体生命 +15%。', ['bond', 'type']),
  P('bond_type_fan', '扇引', null, [{ kind: 'heal', value: 0.06, duration: 0, chance: 1 }], '同阵 2 面扇：每回合回复 6% 生命。', ['bond', 'type']),
  P('bond_type_flute', '笛音', null, [{ kind: 'cdDown', value: 1, duration: 0, chance: 1 }], '同阵 2 支笛：全体技能冷却 -1。', ['bond', 'type']),
  P('bond_type_umbrella', '伞覆', null, [{ kind: 'reflect', value: 0.15, duration: 0, chance: 1 }], '同阵 2 把伞：全体反伤 +15%。', ['bond', 'type']),
  P('bond_type_blade', '刃影', null, [{ kind: 'lifesteal', value: 0.12, duration: 0, chance: 1 }], '同阵 2 柄刃：全体吸血 +12%。', ['bond', 'type']),

  P('bond_elem_fire', '三昧真火', 'fire', [{ kind: 'burn', value: 0.15, duration: 2, chance: 0.35 }, { kind: 'atkUp', value: 0.15, duration: 0, chance: 1 }], '同阵 3 件火器：攻击 +15%，普攻附带灼烧。', ['bond', 'element']),
  P('bond_elem_ice', '玄冰不化', 'ice', [{ kind: 'chill', value: 0.15, duration: 2, chance: 0.35 }, { kind: 'defUp', value: 0.15, duration: 0, chance: 1 }], '同阵 3 件冰器：减伤 +15%，普攻附带迟滞。', ['bond', 'element']),
  P('bond_elem_thunder', '九天雷动', 'thunder', [{ kind: 'shock', value: 1, duration: 1, chance: 0.15 }, { kind: 'speedUp', value: 0.15, duration: 0, chance: 1 }], '同阵 3 件雷器：速度 +15%，普攻有几率麻痹。', ['bond', 'element']),

  P('bond_mythic_soul', '兵魂', null,
    [{ kind: 'atkUp', value: 0.2, duration: 0, chance: 1 }, { kind: 'hpUp', value: 0.2, duration: 0, chance: 1 }, { kind: 'cdDown', value: 1, duration: 0, chance: 1 }],
    '阵中有 1 把神话兵器即可觉醒：全体攻防 +20%，冷却 -1。', ['bond', 'mythic']),
]);

/* ------------------------------------------------------------------ *
 * 敌方技能（关卡与竞技共用）
 * ------------------------------------------------------------------ */

export const ENEMY_SKILLS = Object.freeze([
  A('sk_e_zaowo_hui', '灶涡回', 'fire', 3, 'single', 1.3, 1, [{ kind: 'burn', value: 0.12, duration: 2, chance: 0.4 }], '炉底翻起的火舌。', ['enemy']),
  A('sk_e_suibing', '碎冰', 'ice', 3, 'all', 0.95, 1, [{ kind: 'chill', value: 0.12, duration: 2, chance: 0.35 }], '崩落的冰碴。', ['enemy']),
  A('sk_e_maidian', '埋电', 'thunder', 3, 'single', 1.4, 1, [{ kind: 'shock', value: 1, duration: 1, chance: 0.2 }], '雷泽的地脉走电。', ['enemy']),
  A('sk_e_tiepi', '铁皮', null, 4, 'self', 0, 0, [{ kind: 'shield', value: 1.1, duration: 2, chance: 1 }], '披上一层粗铁。', ['enemy', 'defense']),
  A('sk_e_kuangnu', '狂怒', null, 4, 'self', 0, 0, [{ kind: 'atkUp', value: 0.25, duration: 3, chance: 1 }], '越打越凶。', ['enemy', 'buff']),
  A('sk_e_fenshen_zhan', '焚身斩', 'fire', 4, 'all', 1.5, 1, [{ kind: 'burn', value: 0.2, duration: 3, chance: 0.6 }], '精英统领的火斩。', ['enemy', 'elite']),
  A('sk_e_hanyuan_suo', '寒渊锁', 'ice', 4, 'all', 1.35, 1, [{ kind: 'speedDown', value: 0.2, duration: 2, chance: 0.6 }], '拖住所有人的脚步。', ['enemy', 'elite']),
  A('sk_e_leiting_pu', '雷霆铺', 'thunder', 4, 'all', 1.55, 1, [{ kind: 'shock', value: 1, duration: 1, chance: 0.28 }], '一片雷同时落下。', ['enemy', 'elite']),
  A('sk_e_taotie_shi', '饕餮食', null, 5, 'single', 2.2, 1, [{ kind: 'lifesteal', value: 0.5, duration: 0, chance: 1 }], 'BOSS 的一口。', ['enemy', 'boss']),
  A('sk_e_wuxiang_beng', '无相崩', null, 5, 'all', 1.9, 1, [{ kind: 'defDown', value: 0.2, duration: 3, chance: 0.8 }], 'BOSS 的全场压制。', ['enemy', 'boss']),
  A('sk_e_jiuyou_fen', '九幽焚', 'fire', 5, 'all', 2.3, 1, [{ kind: 'burn', value: 0.3, duration: 3, chance: 0.9 }], '终章 BOSS 的焚天术。', ['enemy', 'boss']),
  A('sk_e_tianwen_ni', '天问·逆', 'thunder', 5, 'single', 3.0, 1, [{ kind: 'pierce', value: 0.4, duration: 0, chance: 1 }], '终章 BOSS 的问天一击。', ['enemy', 'boss']),
]);

export const SKILLS = Object.freeze([
  ...IRON_SKILLS,
  ...SILVER_SKILLS,
  ...GOLD_SKILLS,
  ...MYTHIC_SKILLS,
  ...BOND_SKILLS,
  ...ENEMY_SKILLS,
]);

export const SKILL_BY_ID = Object.freeze(
  SKILLS.reduce((acc, s) => {
    acc[s.id] = s;
    return acc;
  }, Object.create(null)),
);

export const BOND_SKILL_BY_TYPE = Object.freeze({
  sword: 'bond_type_sword',
  saber: 'bond_type_saber',
  spear: 'bond_type_spear',
  halberd: 'bond_type_halberd',
  bow: 'bond_type_bow',
  crossbow: 'bond_type_crossbow',
  axe: 'bond_type_axe',
  hammer: 'bond_type_hammer',
  fan: 'bond_type_fan',
  flute: 'bond_type_flute',
  umbrella: 'bond_type_umbrella',
  blade: 'bond_type_blade',
});

export const BOND_SKILL_BY_ELEMENT = Object.freeze({
  fire: 'bond_elem_fire',
  ice: 'bond_elem_ice',
  thunder: 'bond_elem_thunder',
});

export const BOND_SKILL_MYTHIC = 'bond_mythic_soul';

export default SKILLS;
