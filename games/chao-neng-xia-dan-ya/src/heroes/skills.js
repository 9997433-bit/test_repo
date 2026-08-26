/**
 * 英雄技能与触发器定义（Opus-3 所有权）。
 *
 * 每个技能由「被动触发器」+ 可选「大招」组成：
 * - 被动挂在某个 TRIGGERS 时机上，由战斗层派发事件时自动结算；
 * - 大招消耗能量，由玩家按 Q 主动释放。
 *
 * `effects()` 只返回声明式效果描述，真正的伤害 / 生成蛋 / 状态施加由
 * `src/combat` 与 `src/physics` 消费，英雄层不越界执行。
 *
 * 名册与流派归属一律以 `src/data/heroes.js` 的 18 只英雄表为准：本表只登记「行为」，
 * 不再重复声明 school，也不为数据表之外的英雄预留条目。
 * 大招消耗同理不在本表定稿——模块底部的 `alignUltCostsWithData()` 会用数据表值覆盖。
 */
import * as DATA from "../data/index.js";
import { EFFECTS, TRIGGERS } from "./constants.js";
import { GENERIC_ULT_ID, tableUltCost } from "./energy.js";

/** 技能词条按星级解锁；mods 会在实例化时合并进 `instance.skillMods`。 */
function trait(star, id, name, desc, mods) {
  return { star, id, name, desc, mods };
}

/** 词条对技能强度的统一放大系数。 */
export function potency(self) {
  return 1 + (self?.skillMods?.potency ?? 0);
}

function extraCount(self) {
  return Math.floor(self?.skillMods?.count ?? 0);
}

const spawnEgg = (count, powerMul, extra = {}) => ({
  kind: EFFECTS.SPAWN_EGG,
  count,
  powerMul,
  ...extra,
});
const damage = (mul, extra = {}) => ({ kind: EFFECTS.DAMAGE, mul, ...extra });
const status = (name, extra = {}) => ({ kind: EFFECTS.STATUS, status: name, ...extra });
const buff = (stat, extra = {}) => ({ kind: EFFECTS.BUFF, stat, ...extra });
const modifier = (key, value, extra = {}) => ({ kind: EFFECTS.MODIFIER, key, value, ...extra });
const energy = (amount, extra = {}) => ({ kind: EFFECTS.ENERGY, amount, ...extra });
const heal = (amount, extra = {}) => ({ kind: EFFECTS.HEAL, amount, ...extra });
const shield = (charges, extra = {}) => ({ kind: EFFECTS.SHIELD, charges, ...extra });
const field = (kind, extra = {}) => ({ kind: EFFECTS.FIELD, field: kind, ...extra });

/** 键为英雄 id。数据表里的 `skill` 字符串通过 SKILL_ALIASES 映射到这里。 */
export const SKILLS = {
  ninja_goose: {
    id: "shuriken_split",
    name: "手里剑分蛋",
    desc: "主蛋命中后追加 2 枚手里剑蛋。",
    trigger: TRIGGERS.HIT,
    oncePerTurn: true,
    condition: (evt) => evt?.primary !== false,
    effects: (evt, self) => [
      spawnEgg(2 + extraCount(self), 0.35 * potency(self), {
        pattern: "fan",
        inheritVelocity: 0.6,
        pierce: self?.skillMods?.pierce ?? 0,
      }),
    ],
    ult: {
      name: "千羽乱舞",
      cost: 60,
      desc: "同时射出 6 枚手里剑蛋。",
      effects: (evt, self) => [spawnEgg(6 + extraCount(self), 0.5 * potency(self), { pattern: "radial" })],
    },
    traits: [
      trait(2, "extra_blade", "多一刃", "手里剑 +1 枚", { count: 1 }),
      trait(3, "sharpen", "开锋", "手里剑威力 +25%", { potency: 0.25 }),
      trait(4, "pierce", "透甲", "手里剑穿透 1 次", { pierce: 1 }),
      trait(5, "storm", "剑雨", "手里剑 +1 枚，威力再 +20%", { count: 1, potency: 0.2 }),
    ],
  },

  fallen_crow: {
    id: "fallen_slash",
    name: "堕羽斩",
    desc: "连击 ≥8 时可释放，对当前目标造成高额斩击。",
    trigger: TRIGGERS.COMBO,
    oncePerTurn: true,
    condition: (evt) => (evt?.combo ?? 0) >= 8,
    effects: (evt, self) => [damage(0.6 * potency(self), { target: "current", tag: "slash" })],
    ult: {
      name: "黑羽处刑",
      cost: 70,
      requiresCombo: 8,
      desc: "连击 ≥8 时对当前目标造成 320% 斩击。",
      condition: (evt) => (evt?.combo ?? 0) >= 8,
      effects: (evt, self) => [damage(3.2 * potency(self), { target: "current", tag: "execute" })],
    },
    traits: [
      trait(2, "keen", "锐羽", "斩击伤害 +20%", { potency: 0.2 }),
      trait(3, "cheap_combo", "轻羽", "连击门槛降到 6", { comboThreshold: -2 }),
      trait(4, "bleed", "撕裂", "附加流血", { bleed: 1 }),
      trait(5, "double_slash", "双斩", "斩击命中两次", { count: 1, potency: 0.15 }),
    ],
  },

  dash_duck: {
    id: "dash_crit",
    name: "冲刺暴击",
    desc: "发射瞬间短冲刺，首次撞击必定暴击。",
    trigger: TRIGGERS.LAUNCH,
    effects: (evt, self) => [
      modifier("dash", 120 * potency(self)),
      modifier("guaranteedCrit", 1 + extraCount(self)),
    ],
    ult: {
      name: "音爆冲鸭",
      cost: 50,
      desc: "本回合所有命中暴击伤害 +60%。",
      effects: (evt, self) => [buff("critMul", { add: 0.6 * potency(self), duration: "turn", scope: "self" })],
    },
    traits: [
      trait(2, "longer_dash", "长冲刺", "冲刺距离 +25%", { potency: 0.25 }),
      trait(3, "double_crit", "连暴", "必暴次数 +1", { count: 1 }),
      trait(4, "crit_power", "破壳", "暴击伤害 +20%", { critMul: 0.2 }),
      trait(5, "sonic", "音爆", "冲刺路径造成范围伤害", { shockwave: 1 }),
    ],
  },

  dandy_pigeon: {
    id: "dandy_refresh",
    name: "帅气亮相",
    desc: "回合结束为其他英雄回复少量能量。",
    trigger: TRIGGERS.TURN_END,
    effects: (evt, self) => [energy(6 * potency(self), { scope: "others" })],
    ult: {
      name: "全场焦点",
      cost: 55,
      desc: "为其他英雄各刷新 30% 能量。",
      effects: (evt, self) => [energy(0.3 * potency(self), { scope: "others", ratio: true })],
    },
    traits: [
      trait(2, "spotlight", "追光", "能量效果 +20%", { potency: 0.2 }),
      trait(3, "encore", "返场", "自身也回复能量", { selfEnergy: 1 }),
      trait(4, "charm", "魅惑", "全队暴击 +3%", { teamCrit: 0.03 }),
      trait(5, "grand_show", "盛大演出", "能量效果再 +30%", { potency: 0.3 }),
    ],
  },

  sun_bird: {
    id: "solar_burn",
    name: "日轮灼烧",
    desc: "主蛋伤害提升并留下灼烧。",
    trigger: TRIGGERS.HIT,
    condition: (evt) => evt?.primary !== false,
    effects: (evt, self) => [
      damage(0.25 * potency(self), { target: "current", tag: "solar" }),
      status("burn", { stacks: 1 + extraCount(self), duration: 3 * potency(self) }),
    ],
    ult: {
      name: "日冕爆发",
      cost: 65,
      desc: "对全场灼烧目标引爆，造成 180% 伤害。",
      effects: (evt, self) => [
        damage(1.8 * potency(self), { target: "burning", area: true, tag: "solar_nova" }),
      ],
    },
    traits: [
      trait(2, "hotter", "高温", "灼烧层数 +1", { count: 1 }),
      trait(3, "long_burn", "余烬", "灼烧时长 +30%", { potency: 0.3 }),
      trait(4, "solar_armor", "日甲", "灼烧目标受到伤害 +8%", { burnVuln: 0.08 }),
      trait(5, "corona", "日冕", "引爆伤害 +40%", { potency: 0.4 }),
    ],
  },

  mech_goose: {
    id: "gear_heavy",
    name: "齿轮重蛋",
    desc: "蛋变重，击碎砖块后额外穿透 1 次。",
    trigger: TRIGGERS.LAUNCH,
    effects: (evt, self) => [
      modifier("mass", 1.4 * potency(self)),
      modifier("pierce", 1 + extraCount(self)),
    ],
    ult: {
      name: "重工碾压",
      cost: 60,
      desc: "本回合蛋无视砖块反弹，直线碾压。",
      effects: (evt, self) => [modifier("plow", 1), modifier("pierce", 3 + extraCount(self))],
    },
    traits: [
      trait(2, "heavier", "加重", "质量 +20%", { potency: 0.2 }),
      trait(3, "extra_pierce", "钻头", "穿透 +1", { count: 1 }),
      trait(4, "brick_bonus", "拆迁", "对砖块伤害 +30%", { brickDamage: 0.3 }),
      trait(5, "juggernaut", "重装", "穿透 +1，质量再 +20%", { count: 1, potency: 0.2 }),
    ],
  },

  drum_chick: {
    id: "war_drum",
    name: "战鼓光环",
    desc: "光环：全队攻击 +12%。",
    trigger: TRIGGERS.AURA,
    aura: { teamAtkMul: 0.12 },
    effects: () => [],
    ult: {
      name: "冲锋鼓点",
      cost: 55,
      desc: "本回合全队攻击额外 +25%。",
      effects: (evt, self) => [
        buff("atk", { mul: 0.25 * potency(self), duration: "turn", scope: "team" }),
      ],
    },
    traits: [
      trait(2, "louder", "重锤", "光环 +3%", { teamAtkMul: 0.03 }),
      trait(3, "march", "行军", "光环附加全队暴击 +5%", { teamCrit: 0.05 }),
      trait(4, "battle_cry", "战吼", "光环 +3%", { teamAtkMul: 0.03 }),
      trait(5, "anthem", "禽王战歌", "战斗开始全队 +20 能量", { teamStartEnergy: 20 }),
    ],
  },

  pep_chick: {
    id: "pep_extra_egg",
    name: "元气加蛋",
    desc: "战斗开始时额外获得 1 枚蛋。",
    trigger: TRIGGERS.BATTLE_START,
    effects: (evt, self) => [
      modifier("extraEggs", 1 + extraCount(self), { turns: 1 + (self?.skillMods?.eggTurns ?? 0) }),
    ],
    ult: {
      name: "元气爆棚",
      cost: 45,
      desc: "立刻补充 2 枚蛋。",
      effects: (evt, self) => [spawnEgg(2 + extraCount(self), 1 * potency(self), { pattern: "stack" })],
    },
    traits: [
      trait(2, "double_pep", "双份元气", "开局额外蛋 +1", { count: 1 }),
      trait(3, "warm_up", "热身", "每场前 2 回合都获得额外蛋", { eggTurns: 1 }),
      trait(4, "big_egg", "大蛋", "额外蛋威力 +25%", { potency: 0.25 }),
      trait(5, "endless", "元气无限", "开局额外蛋 +1", { count: 1 }),
    ],
  },

  thunder_chick: {
    id: "shock_bounce",
    name: "感电弹跳",
    desc: "主蛋带感电，反弹优先追向敌人。",
    trigger: TRIGGERS.LAUNCH,
    effects: (evt, self) => [
      modifier("homing", 0.35 * potency(self)),
      status("shock", { stacks: 1 + extraCount(self), applyOn: "hit", duration: 4 }),
    ],
    ult: {
      name: "雷神审判",
      cost: 60,
      desc: "对所有感电目标降下落雷，造成 150% 伤害。",
      effects: (evt, self) => [
        damage(1.5 * potency(self), { target: "shocked", area: true, tag: "thunder" }),
      ],
    },
    traits: [
      trait(2, "stronger_shock", "强电", "感电层数 +1", { count: 1 }),
      trait(3, "better_homing", "追踪", "追踪强度 +30%", { potency: 0.3 }),
      trait(4, "conduct", "导电", "感电目标受雷伤 +15%", { shockVuln: 0.15 }),
      trait(5, "storm_lord", "雷帝", "落雷伤害 +40%", { potency: 0.4 }),
    ],
  },

  hiphop_duck: {
    id: "shock_spread",
    name: "感电扩散",
    desc: "命中感电目标时，向邻近 2 个目标扩散感电。",
    trigger: TRIGGERS.HIT,
    condition: (evt) => Boolean(evt?.target?.statuses?.shock),
    effects: (evt, self) => [
      status("shock", { spread: 2 + extraCount(self), radius: 90 * potency(self), stacks: 1 }),
    ],
    ult: {
      name: "电音派对",
      cost: 55,
      desc: "全场敌人附加 2 层感电。",
      effects: (evt, self) => [status("shock", { target: "all", stacks: 2 + extraCount(self) })],
    },
    traits: [
      trait(2, "wider", "扩音", "扩散半径 +25%", { potency: 0.25 }),
      trait(3, "more_targets", "多人 battle", "扩散目标 +1", { count: 1 }),
      trait(4, "bass", "低音炮", "扩散附带 30% 伤害", { spreadDamage: 0.3 }),
      trait(5, "rave", "全场蹦迪", "扩散目标 +1，半径再 +25%", { count: 1, potency: 0.25 }),
    ],
  },

  bird_of_paradise: {
    id: "paradise_bolt",
    name: "天堂雷补",
    desc: "回合结束时对所有带电敌人补一发雷。",
    trigger: TRIGGERS.TURN_END,
    effects: (evt, self) => [
      damage(0.5 * potency(self), { target: "shocked", area: true, tag: "paradise" }),
    ],
    ult: {
      name: "天堂降临",
      cost: 60,
      desc: "对带电敌人造成 200% 伤害并刷新感电。",
      effects: (evt, self) => [
        damage(2 * potency(self), { target: "shocked", area: true, tag: "paradise_ult" }),
        status("shock", { target: "shocked", stacks: 1, refresh: true }),
      ],
    },
    traits: [
      trait(2, "brighter", "极彩", "补雷伤害 +25%", { potency: 0.25 }),
      trait(3, "wide_bolt", "散雷", "补雷范围扩大", { radius: 40 }),
      trait(4, "recharge", "续电", "补雷刷新感电时长", { refresh: 1 }),
      trait(5, "heaven", "天堂", "补雷伤害再 +35%", { potency: 0.35 }),
    ],
  },

  ice_phoenix: {
    id: "frost_egg",
    name: "冰霜之蛋",
    desc: "主蛋附带冻结。",
    trigger: TRIGGERS.LAUNCH,
    effects: (evt, self) => [
      status("freeze", { applyOn: "hit", duration: 1.2 * potency(self), stacks: 1 + extraCount(self) }),
    ],
    ult: {
      name: "暴风雪",
      cost: 70,
      desc: "全场暴风雪，造成 120% 伤害并冻结。",
      effects: (evt, self) => [
        damage(1.2 * potency(self), { target: "all", area: true, tag: "blizzard" }),
        status("freeze", { target: "all", duration: 1.5 * potency(self) }),
      ],
    },
    traits: [
      trait(2, "colder", "极寒", "冻结时长 +25%", { potency: 0.25 }),
      trait(3, "shatter", "碎冰", "对冻结目标伤害 +15%", { freezeVuln: 0.15 }),
      trait(4, "double_frost", "霜华", "冻结层数 +1", { count: 1 }),
      trait(5, "absolute_zero", "绝对零度", "暴风雪伤害 +40%", { potency: 0.4 }),
    ],
  },

  emperor_penguin: {
    id: "ice_floor",
    name: "冰面领域",
    desc: "光环：延长全队冻结时长，战斗开始生成冰面。",
    trigger: TRIGGERS.BATTLE_START,
    aura: { freezeDurationMul: 0.25 },
    effects: (evt, self) => [field("ice", { coverage: 0.35 * potency(self), friction: 0.02 })],
    ult: {
      name: "极地滑道",
      cost: 50,
      desc: "整片战场变成冰面，蛋速度 +20%。",
      effects: (evt, self) => [
        field("ice", { coverage: 1, friction: 0.01 }),
        modifier("speed", 0.2 * potency(self)),
      ],
    },
    traits: [
      trait(2, "wider_ice", "扩张", "冰面覆盖 +25%", { potency: 0.25 }),
      trait(3, "long_freeze", "严冬", "冻结时长光环 +10%", { freezeDurationMul: 0.1 }),
      trait(4, "slippery", "极滑", "冰面摩擦更低", { friction: -0.005 }),
      trait(5, "glacier", "冰川", "冰面覆盖再 +35%", { potency: 0.35 }),
    ],
  },

  shark_eagle: {
    id: "collide_growth",
    name: "碰撞增幅",
    desc: "每次撞钉，蛋半径 +1（本回合内）。",
    trigger: TRIGGERS.PEG_HIT,
    effects: (evt, self) => [
      modifier("eggRadius", 1 + extraCount(self), { stack: true, maxStacks: 4, duration: "turn" }),
    ],
    ult: {
      name: "鲨齿撕咬",
      cost: 55,
      desc: "蛋半径立即翻倍并造成 150% 撞击伤害。",
      effects: (evt, self) => [
        modifier("eggRadius", 6 * potency(self), { duration: "turn" }),
        damage(1.5 * potency(self), { target: "current", tag: "bite" }),
      ],
    },
    traits: [
      trait(2, "bigger_bite", "巨口", "每次 +2 半径", { count: 1 }),
      trait(3, "collide_damage", "冲撞", "半径每 +1，伤害 +5%", { radiusDamage: 0.05 }),
      trait(4, "high_cap", "无限膨胀", "上限 +2 层", { maxStacks: 2 }),
      trait(5, "apex", "顶级掠食", "大招效果 +30%", { potency: 0.3 }),
    ],
  },

  deer_chick: {
    id: "collide_split",
    name: "撞击分裂",
    desc: "撞钉时有机会分裂出 1 枚子蛋。",
    trigger: TRIGGERS.PEG_HIT,
    condition: (evt, self, ctx) => (ctx?.rng?.() ?? 1) < 0.25 * potency(self),
    effects: (evt, self) => [
      spawnEgg(1 + extraCount(self), 0.7, { inheritVelocity: 0.7, pattern: "split" }),
    ],
    ult: {
      name: "鹿角风暴",
      cost: 60,
      desc: "当前所有蛋各分裂 2 枚。",
      effects: (evt, self) => [
        spawnEgg(2 + extraCount(self), 0.7 * potency(self), { source: "allEggs", pattern: "split" }),
      ],
    },
    traits: [
      trait(2, "lucky_split", "好运分裂", "分裂概率 +25%", { potency: 0.25 }),
      trait(3, "twin", "双生", "分裂数 +1", { count: 1 }),
      trait(4, "strong_split", "壮角", "子蛋威力 +20%", { splitPower: 0.2 }),
      trait(5, "cascade", "连锁分裂", "子蛋也能分裂一次", { cascade: 1 }),
    ],
  },

  heal_duck: {
    id: "yolk_heal",
    name: "蛋黄治愈",
    desc: "每回收一枚蛋，回复 4% 生命。",
    trigger: TRIGGERS.EGG_RECYCLED,
    effects: (evt, self) => [
      heal(0.04 * potency(self), { ratio: true, scope: "player" }),
    ],
    ult: {
      name: "暖巢",
      cost: 45,
      desc: "立即回复 20% 生命并附加护盾。",
      effects: (evt, self) => [
        heal(0.2 * potency(self), { ratio: true, scope: "player" }),
        shield(1, { absorb: 0.1 }),
      ],
    },
    traits: [
      trait(2, "warm_yolk", "暖黄", "治疗量 +25%", { potency: 0.25 }),
      trait(3, "overheal", "溢流", "溢出治疗转为护盾", { overheal: 1 }),
      trait(4, "quick_nest", "快巢", "治疗量再 +25%", { potency: 0.25 }),
      trait(5, "life_spring", "生命泉", "全队受到的漏怪伤害 -10%", { leakReduce: 0.1 }),
    ],
  },

  guard_duck: {
    id: "shell_guard",
    name: "蛋壳护盾",
    desc: "战斗开始获得护盾，抵挡一次漏怪伤害。",
    trigger: TRIGGERS.BATTLE_START,
    effects: (evt, self) => [
      shield(1 + extraCount(self), { absorb: 1, tag: "shell" }),
    ],
    ult: {
      name: "铁壳阵",
      cost: 50,
      desc: "获得 2 层护盾并降低受到的伤害 20%。",
      effects: (evt, self) => [
        shield(2 + extraCount(self), { absorb: 1 }),
        buff("damageTaken", { mul: -0.2 * potency(self), duration: "turn", scope: "team" }),
      ],
    },
    traits: [
      trait(2, "thick_shell", "厚壳", "护盾 +1 层", { count: 1 }),
      trait(3, "regen_shell", "再生壳", "每 3 回合补 1 层", { regen: 3 }),
      trait(4, "reflect", "反震", "破盾时反弹伤害", { reflect: 0.5 }),
      trait(5, "fortress", "堡垒", "护盾 +1 层，减伤 +10%", { count: 1, potency: 0.5 }),
    ],
  },

  grace_goose: {
    id: "grace_slow",
    name: "优雅减速",
    desc: "光环：敌人移动速度 -15%，冰系伤害 +10%。",
    trigger: TRIGGERS.AURA,
    aura: { enemySlow: 0.15, iceDamageMul: 0.1 },
    effects: () => [],
    ult: {
      name: "天鹅湖",
      cost: 50,
      desc: "全场敌人减速 50%，持续 4 秒。",
      effects: (evt, self) => [
        status("slow", { target: "all", value: 0.5 * potency(self), duration: 4 }),
      ],
    },
    traits: [
      trait(2, "elegant", "端庄", "减速光环 +5%", { enemySlow: 0.05 }),
      trait(3, "frost_grace", "霜之优雅", "冰系伤害光环 +5%", { iceDamageMul: 0.05 }),
      trait(4, "long_lake", "长湖", "大招时长 +2 秒", { duration: 2 }),
      trait(5, "swan_queen", "天鹅女王", "减速光环 +5%，大招效果 +30%", {
        enemySlow: 0.05,
        potency: 0.3,
      }),
    ],
  },
};

/**
 * 数据表里 `skill` / `ult` 字段的字符串 → 英雄 id。
 * 直接从 `src/data/skills.js` 的 `owner` 反推，F3 改招牌技能 id 时无需同步维护副本；
 * 本表登记的行为条目再补一份 id 别名，兼容按行为 id 索引的旧调用方。
 */
function buildSkillAliases() {
  const aliases = {};
  for (const [heroId, skill] of Object.entries(SKILLS)) {
    if (skill?.id) aliases[skill.id] = heroId;
  }
  for (const skill of Object.values(DATA.SKILLS ?? {})) {
    const owner = skill?.owner;
    if (skill?.id && owner && SKILLS[owner]) aliases[skill.id] = owner;
  }
  return aliases;
}

export const SKILL_ALIASES = buildSkillAliases();

/** 数据表补了新英雄但技能未登记时的兜底，保证不会出现「按 Q 没反应」。 */
export const FALLBACK_SKILL = {
  id: "full_power",
  name: "全力一击",
  school: "brute",
  desc: "消耗能量打出一次强化攻击。",
  trigger: TRIGGERS.LAUNCH,
  effects: () => [],
  ult: {
    name: "全力一击",
    cost: 60,
    desc: "造成 200% 伤害。",
    effects: (evt, self) => [damage(2 * potency(self), { target: "current", tag: "generic" })],
  },
  traits: [
    trait(2, "power_1", "蓄力 I", "伤害 +15%", { potency: 0.15 }),
    trait(3, "power_2", "蓄力 II", "伤害 +15%", { potency: 0.15 }),
    trait(4, "power_3", "蓄力 III", "伤害 +15%", { potency: 0.15 }),
    trait(5, "power_4", "蓄力 IV", "伤害 +25%", { potency: 0.25 }),
  ],
};

/** 按数据表条目解析技能：先看 skill 字段，再看英雄 id，最后兜底。 */
export function resolveSkill(def) {
  if (!def) return FALLBACK_SKILL;
  const direct = SKILLS[def.id];
  if (direct) return direct;
  const aliased = SKILL_ALIASES[def.skill];
  if (aliased && SKILLS[aliased]) return SKILLS[aliased];
  return FALLBACK_SKILL;
}

/** 表外英雄既没有 school 也没有登记技能时的归属。 */
export const DEFAULT_SCHOOL = "brute";

/** 流派归属：数据表的 `school` 是权威，其次是技能登记的 school，最后才是默认流派。 */
export function schoolOf(def, skill = null) {
  if (typeof def?.school === "string" && def.school) return def.school;
  const resolved = skill ?? resolveSkill(def);
  return typeof resolved?.school === "string" && resolved.school ? resolved.school : DEFAULT_SCHOOL;
}

/** 星级解锁的词条列表。1 星只有基础效果。 */
export function unlockedTraits(skill, star) {
  const s = Math.max(1, Math.floor(Number(star) || 1));
  return (skill?.traits ?? []).filter((t) => t.star <= s);
}

/** 合并已解锁词条的 mods，数值相加。 */
export function mergeTraitMods(skill, star) {
  const mods = {};
  for (const t of unlockedTraits(skill, star)) {
    for (const [key, value] of Object.entries(t.mods ?? {})) {
      mods[key] = (mods[key] ?? 0) + Number(value || 0);
    }
  }
  return mods;
}

/** 词条可以调整光环强度，这里把技能光环与词条光环合并。 */
export function auraOf(skill, star) {
  const base = skill?.aura ?? null;
  const mods = mergeTraitMods(skill, star);
  const auraKeys = [
    "teamAtkMul",
    "teamCritBonus",
    "teamEnergyMul",
    "enemySlow",
    "iceDamageMul",
    "freezeDurationMul",
    "extraEggs",
  ];
  const out = {};
  for (const key of auraKeys) {
    const value = (base?.[key] ?? 0) + (mods[key] ?? 0) + (key === "teamCritBonus" ? (mods.teamCrit ?? 0) : 0);
    if (value) out[key] = round4(value);
  }
  return Object.keys(out).length ? out : null;
}

function round4(n) {
  return Math.round(n * 1e4) / 1e4;
}

/**
 * 大招消耗一律以数据表为准。本表的 `cost` 只是表外英雄的兜底数字，留着容易和
 * `data/heroes.js` 漂移，所以模块加载时统一对齐一次：这样连按静态技能表取值的
 * 展示层（`core/catalog.js` 的 HUD 能量环）也吃到数据表的能量。
 */
function alignUltCostsWithData() {
  for (const [heroId, skill] of Object.entries(SKILLS)) {
    const cost = tableUltCost(DATA.HEROES?.[heroId]);
    if (skill.ult && cost !== null) skill.ult.cost = cost;
  }
  const generic = tableUltCost({ ult: GENERIC_ULT_ID });
  if (generic !== null) FALLBACK_SKILL.ult.cost = generic;
}

alignUltCostsWithData();
