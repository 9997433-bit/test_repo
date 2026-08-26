/**
 * 技能结算库。
 *
 * 每个技能是一个纯结算函数 `resolve(ctx)`，只通过引擎注入的 ctx 操作战场，
 * 因此本文件不 import engine，避免循环依赖，也方便单独做数值测试。
 *
 * ctx 契约（由 engine.js 提供）：
 * ```
 * {
 *   rng, actor, skill, round, wave,
 *   aliveEnemies(), aliveAllies(),
 *   selectEnemies(count, mode), lowestAlly(), lowestEnemy(),
 *   dealDamage(target, { power, element, pierce, canCrit, critBonus, lifesteal, label, tag, noReflect }),
 *   heal(target, amount, label), addShield(target, amount, label),
 *   applyStatus(target, status), effAtk(unit), log(type, payload)
 * }
 * ```
 */

import { elementLabel } from './elements.js';

export const STATUS_INFO = Object.freeze({
  burn: Object.freeze({ id: 'burn', name: '灼烧', kind: 'dot', bad: true }),
  chill: Object.freeze({ id: 'chill', name: '冰缓', kind: 'debuff', bad: true }),
  freeze: Object.freeze({ id: 'freeze', name: '冻结', kind: 'control', bad: true }),
  shock: Object.freeze({ id: 'shock', name: '感电', kind: 'dot', bad: true }),
  mark: Object.freeze({ id: 'mark', name: '破绽', kind: 'debuff', bad: true }),
  weaken: Object.freeze({ id: 'weaken', name: '弱化', kind: 'debuff', bad: true }),
  atkUp: Object.freeze({ id: 'atkUp', name: '战意', kind: 'buff', bad: false }),
  guard: Object.freeze({ id: 'guard', name: '铁壁', kind: 'buff', bad: false }),
  thorns: Object.freeze({ id: 'thorns', name: '棘甲', kind: 'buff', bad: false }),
  regen: Object.freeze({ id: 'regen', name: '淬体', kind: 'hot', bad: false }),
  haste: Object.freeze({ id: 'haste', name: '疾风', kind: 'buff', bad: false }),
});

function status(id, turns, value, source, extra = {}) {
  return {
    id,
    name: STATUS_INFO[id]?.name ?? id,
    kind: STATUS_INFO[id]?.kind ?? 'buff',
    bad: STATUS_INFO[id]?.bad ?? false,
    turns,
    value,
    sourceUid: source?.uid ?? null,
    ...extra,
  };
}

/* ------------------------------------------------------------------ *
 * 技能结算函数（≥8）
 * ------------------------------------------------------------------ */

/** 烈焰斩：单体高倍火伤 + 灼烧 DOT。 */
export function resolveBlazeSlash(ctx) {
  const [target] = ctx.selectEnemies(1);
  if (!target) return;
  const hit = ctx.dealDamage(target, { power: 1.75, element: 'fire', label: '烈焰斩' });
  if (hit && target.alive) {
    ctx.applyStatus(target, status('burn', 3, Math.max(1, Math.round(hit.damage * 0.18)), ctx.actor, { element: 'fire' }));
  }
}

/** 霜锁：冰伤 + 减速，低血时概率冻结一回合。 */
export function resolveFrostLock(ctx) {
  const [target] = ctx.selectEnemies(1);
  if (!target) return;
  const hit = ctx.dealDamage(target, { power: 1.45, element: 'ice', label: '霜锁' });
  if (!hit || !target.alive) return;
  ctx.applyStatus(target, status('chill', 2, 0.25, ctx.actor, { element: 'ice' }));
  const hpRatio = target.hp / target.maxHp;
  const freezeChance = 0.18 + (1 - hpRatio) * 0.22;
  if (ctx.rng.chance(freezeChance)) {
    ctx.applyStatus(target, status('freeze', 1, 1, ctx.actor, { element: 'ice' }));
  }
}

/** 雷链：跳跃至多 3 个目标，每跳衰减 22%。 */
export function resolveThunderChain(ctx) {
  const targets = ctx.selectEnemies(3, 'chain');
  if (targets.length === 0) return;
  let power = 1.32;
  for (let i = 0; i < targets.length; i += 1) {
    const target = targets[i];
    if (!target.alive) continue;
    const hit = ctx.dealDamage(target, {
      power,
      element: 'thunder',
      label: i === 0 ? '雷链' : `雷链·${i + 1}跳`,
    });
    if (hit && target.alive && ctx.rng.chance(0.25)) {
      ctx.applyStatus(target, status('shock', 2, Math.max(1, Math.round(hit.damage * 0.12)), ctx.actor, { element: 'thunder' }));
    }
    power *= 0.78;
  }
}

/** 旋风斩：全体溅射，命中数越多单体越低。 */
export function resolveWhirlwind(ctx) {
  const targets = ctx.aliveEnemies();
  if (targets.length === 0) return;
  const power = 1.15 - Math.min(0.3, (targets.length - 1) * 0.09);
  for (const target of targets) {
    if (!target.alive) continue;
    ctx.dealDamage(target, { power, label: '旋风斩', tag: 'aoe' });
  }
}

/** 破甲射：无视大部分减伤，暴击加成高。 */
export function resolvePierceShot(ctx) {
  const [target] = ctx.selectEnemies(1, 'threat');
  if (!target) return;
  const hit = ctx.dealDamage(target, {
    power: 1.55,
    pierce: 0.7,
    critBonus: 0.2,
    label: '破甲射',
  });
  if (hit && target.alive) {
    ctx.applyStatus(target, status('mark', 2, 0.12, ctx.actor));
  }
}

/** 饮血：吸血一击，回复自身。 */
export function resolveBloodDrink(ctx) {
  const [target] = ctx.selectEnemies(1);
  if (!target) return;
  ctx.dealDamage(target, { power: 1.4, lifesteal: 0.45, label: '饮血' });
}

/** 铁壁：自身护盾 + 全队减伤。 */
export function resolveGuardStance(ctx) {
  const shield = Math.round(ctx.effAtk(ctx.actor) * 1.6 + ctx.actor.maxHp * 0.08);
  ctx.addShield(ctx.actor, shield, '铁壁');
  for (const ally of ctx.aliveAllies()) {
    ctx.applyStatus(ally, status('guard', 2, ally === ctx.actor ? 0.18 : 0.1, ctx.actor));
  }
}

/** 连环击：两段攻击，第二段 65% 倍率，可再触发连击词条。 */
export function resolveDoubleStrike(ctx) {
  const [first] = ctx.selectEnemies(1);
  if (!first) return;
  ctx.dealDamage(first, { power: 1.05, label: '连环击·一' });
  const next = first.alive ? first : ctx.selectEnemies(1)[0];
  if (next && next.alive) {
    ctx.dealDamage(next, { power: 0.65, label: '连环击·二' });
  }
}

/** 兵魂共鸣：神话被动主动化，全队攻击力提升并附带元素增伤。 */
export function resolveSoulResonance(ctx) {
  const allies = ctx.aliveAllies();
  for (const ally of allies) {
    ctx.applyStatus(ally, status('atkUp', 3, 0.22, ctx.actor, { element: ctx.actor.element }));
  }
  // payload 与其他事件对齐：只放可序列化的标量，不要把活的 unit 引用塞进时间轴
  ctx.log('buff', {
    actorUid: ctx.actor.uid,
    actor: ctx.actor.name,
    side: ctx.actor.side,
    element: ctx.actor.element,
    label: '兵魂共鸣',
    targets: allies.map((u) => u.uid),
    text: `${ctx.actor.name} 唤醒兵魂，全军攻击 +22%（${elementLabel(ctx.actor.element)}共鸣）`,
  });
}

/** 棘甲：反伤增益 + 自身回复。 */
export function resolveThornArmor(ctx) {
  ctx.applyStatus(ctx.actor, status('thorns', 3, 0.35, ctx.actor));
  ctx.heal(ctx.actor, Math.round(ctx.actor.maxHp * 0.08), '棘甲淬炼');
}

/** 斩杀：目标血量越低伤害越高，最高 2.6 倍。 */
export function resolveExecute(ctx) {
  const [target] = ctx.selectEnemies(1, 'lowest');
  if (!target) return;
  const missing = 1 - target.hp / target.maxHp;
  ctx.dealDamage(target, {
    power: 1.2 + missing * 1.4,
    critBonus: 0.1,
    label: '斩杀',
  });
}

/** 炉火淬体：治疗最残血友军并挂持续回复。 */
export function resolveForgeMend(ctx) {
  const target = ctx.lowestAlly();
  if (!target) return;
  const amount = Math.round(ctx.effAtk(ctx.actor) * 1.1 + target.maxHp * 0.1);
  ctx.heal(target, amount, '炉火淬体');
  ctx.applyStatus(target, status('regen', 3, Math.round(target.maxHp * 0.04), ctx.actor));
}

/** 疾风引：给最快友军加速并削弱敌方最强者。 */
export function resolveGaleLead(ctx) {
  const allies = ctx.aliveAllies();
  const fastest = allies.reduce((best, u) => (best && best.speed >= u.speed ? best : u), null);
  if (fastest) ctx.applyStatus(fastest, status('haste', 2, 0.25, ctx.actor));
  const [threat] = ctx.selectEnemies(1, 'threat');
  if (threat) ctx.applyStatus(threat, status('weaken', 2, 0.18, ctx.actor));
}

/** 普通攻击（无 CD，兜底）。 */
export function resolveBasicAttack(ctx) {
  const [target] = ctx.selectEnemies(1);
  if (!target) return;
  const hit = ctx.dealDamage(target, { power: 1, label: '普攻', tag: 'basic' });
  if (hit && ctx.actor.combo > 0 && ctx.rng.chance(ctx.actor.combo)) {
    const follow = target.alive ? target : ctx.selectEnemies(1)[0];
    if (follow && follow.alive) {
      ctx.dealDamage(follow, { power: 0.5, label: '连击', tag: 'combo' });
    }
  }
}

/* ------------------------------------------------------------------ *
 * 技能表
 * ------------------------------------------------------------------ */

function def(entry) {
  return Object.freeze({
    kind: 'active',
    element: null,
    cd: 3,
    priority: 50,
    targeting: 'enemy',
    tags: Object.freeze([]),
    ...entry,
  });
}

export const BASIC_ATTACK = def({
  id: 'basic_attack',
  name: '普攻',
  desc: '基础一击，可触发连击词条。',
  cd: 0,
  priority: 0,
  resolve: resolveBasicAttack,
  tags: Object.freeze(['basic']),
});

export const SKILL_LIBRARY = Object.freeze({
  basic_attack: BASIC_ATTACK,
  blaze_slash: def({
    id: 'blaze_slash',
    name: '烈焰斩',
    desc: '单体 175% 火焰伤害，附加 3 回合灼烧。',
    element: 'fire',
    cd: 3,
    priority: 70,
    resolve: resolveBlazeSlash,
    tags: Object.freeze(['fire', 'nuke', 'dot']),
  }),
  frost_lock: def({
    id: 'frost_lock',
    name: '霜锁',
    desc: '单体 145% 冰伤，减速 25%，有概率冻结。',
    element: 'ice',
    cd: 3,
    priority: 68,
    resolve: resolveFrostLock,
    tags: Object.freeze(['ice', 'control']),
  }),
  thunder_chain: def({
    id: 'thunder_chain',
    name: '雷链',
    desc: '雷电最多跳跃 3 名敌人，每跳衰减 22%。',
    element: 'thunder',
    cd: 4,
    priority: 72,
    resolve: resolveThunderChain,
    tags: Object.freeze(['thunder', 'multi']),
  }),
  whirlwind: def({
    id: 'whirlwind',
    name: '旋风斩',
    desc: '全体伤害，目标越多单体越低。',
    cd: 4,
    priority: 66,
    targeting: 'enemyAll',
    resolve: resolveWhirlwind,
    tags: Object.freeze(['aoe']),
  }),
  pierce_shot: def({
    id: 'pierce_shot',
    name: '破甲射',
    desc: '无视 70% 减伤，暴击率 +20%，附加破绽。',
    cd: 3,
    priority: 69,
    resolve: resolvePierceShot,
    tags: Object.freeze(['pierce', 'crit']),
  }),
  blood_drink: def({
    id: 'blood_drink',
    name: '饮血',
    desc: '140% 伤害并吸取 45% 伤害为生命。',
    cd: 3,
    priority: 64,
    resolve: resolveBloodDrink,
    tags: Object.freeze(['lifesteal']),
  }),
  guard_stance: def({
    id: 'guard_stance',
    name: '铁壁',
    desc: '为自身生成护盾，全队获得减伤。',
    cd: 4,
    priority: 60,
    targeting: 'allyAll',
    resolve: resolveGuardStance,
    tags: Object.freeze(['defense', 'shield']),
  }),
  double_strike: def({
    id: 'double_strike',
    name: '连环击',
    desc: '两段攻击，第二段 65% 倍率。',
    cd: 2,
    priority: 58,
    resolve: resolveDoubleStrike,
    tags: Object.freeze(['multi']),
  }),
  soul_resonance: def({
    id: 'soul_resonance',
    name: '兵魂共鸣',
    desc: '全队攻击力 +22%，持续 3 回合。',
    cd: 5,
    priority: 75,
    targeting: 'allyAll',
    resolve: resolveSoulResonance,
    tags: Object.freeze(['mythic', 'buff']),
  }),
  thorn_armor: def({
    id: 'thorn_armor',
    name: '棘甲',
    desc: '获得 35% 反伤并回复 8% 生命。',
    cd: 4,
    priority: 55,
    targeting: 'self',
    resolve: resolveThornArmor,
    tags: Object.freeze(['defense', 'thorns']),
  }),
  execute: def({
    id: 'execute',
    name: '斩杀',
    desc: '对残血目标最高造成 260% 伤害。',
    cd: 3,
    priority: 74,
    resolve: resolveExecute,
    tags: Object.freeze(['finisher']),
  }),
  forge_mend: def({
    id: 'forge_mend',
    name: '炉火淬体',
    desc: '治疗最残血友军并附加 3 回合回复。',
    cd: 4,
    priority: 62,
    targeting: 'allyLowest',
    resolve: resolveForgeMend,
    tags: Object.freeze(['heal']),
  }),
  gale_lead: def({
    id: 'gale_lead',
    name: '疾风引',
    desc: '加速己方最快单位，削弱敌方威胁最高者。',
    cd: 4,
    priority: 54,
    targeting: 'mixed',
    resolve: resolveGaleLead,
    tags: Object.freeze(['speed', 'debuff']),
  }),
});

/**
 * 数据层 `data/skills.js` 的 `sk_*` id → 战斗层原型。
 *
 * 数据层按「兵器技」组织（三炉 + 神话 + 敌方），战斗层按结算原型组织，两边不是一一对应；
 * 这里按元素与战术定位挂到最接近的原型上，避免全部落到 `synthesize()` 的哈希兜底
 * ——哈希兜底虽然可复现，但会把治疗技打成斩杀技，数值上说不通。
 */
const DATA_SKILL_ALIASES = Object.freeze({
  // 精铁炉
  sk_liehuo_zhan: 'blaze_slash',
  sk_hanfeng_ci: 'frost_lock',
  sk_leiting_tu: 'thunder_chain',
  sk_hanyu_she: 'execute',
  sk_pishan: 'pierce_shot',
  sk_leiming_ji: 'whirlwind',
  sk_qingfeng_fu: 'forge_mend',
  sk_liyin_zhen: 'whirlwind',
  sk_zhepeng: 'thorn_armor',
  sk_beici: 'execute',
  sk_hengsao: 'whirlwind',
  sk_shouye_nu: 'pierce_shot',
  // 白银炉
  sk_yanwu_zhan: 'blaze_slash',
  sk_shuangfeng_lian: 'double_strike',
  sk_binghe_ci: 'frost_lock',
  sk_xingluo_ji: 'thunder_chain',
  sk_liehuo_nu: 'pierce_shot',
  sk_lianzhu_lei: 'thunder_chain',
  sk_bingpo_zhan: 'frost_lock',
  sk_ronghuo_za: 'whirlwind',
  sk_yanwei_shan: 'soul_resonance',
  sk_jiuxiao_yin: 'gale_lead',
  sk_xuemu: 'guard_stance',
  sk_linguang_ci: 'blood_drink',
  sk_qiuhong_she: 'double_strike',
  // 黄金炉
  sk_poxiao_yijian: 'execute',
  sk_wangchuan_zhan: 'blood_drink',
  sk_tunri_ci: 'blaze_slash',
  sk_jiuli_hengsao: 'whirlwind',
  sk_shechen: 'execute',
  sk_zhenchao: 'guard_stance',
  sk_duanlong: 'pierce_shot',
  sk_fenji: 'whirlwind',
  sk_zhaohun: 'forge_mend',
  sk_zhetian: 'thorn_armor',
  sk_wanji: 'thunder_chain',
  sk_chanyi: 'double_strike',
  // 神话
  sk_zhulong_kaimu: 'whirlwind',
  sk_xuanming_fengyuan: 'frost_lock',
  sk_leize_tianwen: 'execute',
  sk_taixu_xingyun: 'thunder_chain',
  // 羁绊被动（战斗层的羁绊走 lineup.js，这里只保证不炸）
  bond_type_sword: 'soul_resonance',
  bond_type_saber: 'double_strike',
  bond_type_blade: 'double_strike',
  bond_type_spear: 'pierce_shot',
  bond_type_halberd: 'guard_stance',
  bond_type_bow: 'pierce_shot',
  bond_type_crossbow: 'gale_lead',
  bond_type_axe: 'execute',
  bond_type_hammer: 'guard_stance',
  bond_type_fan: 'forge_mend',
  bond_type_flute: 'gale_lead',
  bond_type_umbrella: 'thorn_armor',
  bond_elem_fire: 'blaze_slash',
  bond_elem_ice: 'frost_lock',
  bond_elem_thunder: 'thunder_chain',
  bond_mythic_soul: 'soul_resonance',
  // 敌方
  sk_e_zaowo_hui: 'blaze_slash',
  sk_e_suibing: 'whirlwind',
  sk_e_maidian: 'thunder_chain',
  sk_e_tiepi: 'guard_stance',
  sk_e_kuangnu: 'soul_resonance',
  sk_e_fenshen_zhan: 'whirlwind',
  sk_e_hanyuan_suo: 'frost_lock',
  sk_e_leiting_pu: 'thunder_chain',
  sk_e_taotie_shi: 'blood_drink',
  sk_e_wuxiang_beng: 'whirlwind',
  sk_e_jiuyou_fen: 'whirlwind',
  sk_e_tianwen_ni: 'pierce_shot',
});

/**
 * Round 1 之前各分支用过的旧技能 id（camelCase / 早期命名）。
 * 统一到 snake_case 之后仍要认这些旧名，否则老存档与老关卡表会掉进哈希兜底。
 */
const LEGACY_SKILL_ALIASES = Object.freeze({
  flameSlash: 'blaze_slash',
  flame_slash: 'blaze_slash',
  fireSlash: 'blaze_slash',
  fire_slash: 'blaze_slash',
  burnStrike: 'blaze_slash',
  iceLock: 'frost_lock',
  ice_lock: 'frost_lock',
  frostBolt: 'frost_lock',
  frost_bolt: 'frost_lock',
  freezeStrike: 'frost_lock',
  lightningChain: 'thunder_chain',
  lightning_chain: 'thunder_chain',
  thunderBolt: 'thunder_chain',
  thunder_bolt: 'thunder_chain',
  whirlSlash: 'whirlwind',
  whirl_slash: 'whirlwind',
  spinSlash: 'whirlwind',
  sweep: 'whirlwind',
  armorPierce: 'pierce_shot',
  armor_pierce: 'pierce_shot',
  piercingShot: 'pierce_shot',
  snipe: 'pierce_shot',
  bloodStrike: 'blood_drink',
  blood_strike: 'blood_drink',
  drainStrike: 'blood_drink',
  vampiricStrike: 'blood_drink',
  ironWall: 'guard_stance',
  iron_wall: 'guard_stance',
  shieldWall: 'guard_stance',
  defendStance: 'guard_stance',
  comboStrike: 'double_strike',
  dualStrike: 'double_strike',
  dual_strike: 'double_strike',
  twinStrike: 'double_strike',
  soulEcho: 'soul_resonance',
  soul_echo: 'soul_resonance',
  weaponSoul: 'soul_resonance',
  spikeArmor: 'thorn_armor',
  spike_armor: 'thorn_armor',
  thornsArmor: 'thorn_armor',
  reflectArmor: 'thorn_armor',
  executeStrike: 'execute',
  execute_strike: 'execute',
  behead: 'execute',
  forgeHeal: 'forge_mend',
  forge_heal: 'forge_mend',
  mend: 'forge_mend',
  healAlly: 'forge_mend',
  windLead: 'gale_lead',
  wind_lead: 'gale_lead',
  hasteLead: 'gale_lead',
  basicAttack: 'basic_attack',
  normalAttack: 'basic_attack',
  normal_attack: 'basic_attack',
});

/** data/skills.js 可能采用别名 id，这里做一层容错映射。 */
export const SKILL_ALIASES = Object.freeze({
  ...DATA_SKILL_ALIASES,
  ...LEGACY_SKILL_ALIASES,
  blazeSlash: 'blaze_slash',
  烈焰斩: 'blaze_slash',
  fire_strike: 'blaze_slash',
  frostLock: 'frost_lock',
  霜锁: 'frost_lock',
  ice_strike: 'frost_lock',
  thunderChain: 'thunder_chain',
  雷链: 'thunder_chain',
  chain_lightning: 'thunder_chain',
  旋风斩: 'whirlwind',
  cleave: 'whirlwind',
  aoe_strike: 'whirlwind',
  pierceShot: 'pierce_shot',
  破甲射: 'pierce_shot',
  armor_break: 'pierce_shot',
  bloodDrink: 'blood_drink',
  饮血: 'blood_drink',
  lifesteal_strike: 'blood_drink',
  guardStance: 'guard_stance',
  铁壁: 'guard_stance',
  shield_wall: 'guard_stance',
  doubleStrike: 'double_strike',
  连环击: 'double_strike',
  combo_strike: 'double_strike',
  soulResonance: 'soul_resonance',
  兵魂共鸣: 'soul_resonance',
  soul_weapon: 'soul_resonance',
  thornArmor: 'thorn_armor',
  棘甲: 'thorn_armor',
  reflect: 'thorn_armor',
  斩杀: 'execute',
  finisher: 'execute',
  forgeMend: 'forge_mend',
  炉火淬体: 'forge_mend',
  heal: 'forge_mend',
  galeLead: 'gale_lead',
  疾风引: 'gale_lead',
  haste: 'gale_lead',
  普攻: 'basic_attack',
  attack: 'basic_attack',
});

const SYNTH_ARCHETYPES = Object.freeze([
  'blaze_slash',
  'frost_lock',
  'thunder_chain',
  'whirlwind',
  'pierce_shot',
  'blood_drink',
  'double_strike',
  'execute',
]);

function synthesize(id) {
  // 数据层新增了战斗层还不认识的技能 id 时，按 id 哈希稳定映射到一个原型，
  // 保留原名与 id，避免战斗直接崩掉，同时保持可复现。
  let h = 2166136261;
  const key = String(id);
  for (let i = 0; i < key.length; i += 1) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const archetype = SKILL_LIBRARY[SYNTH_ARCHETYPES[(h >>> 0) % SYNTH_ARCHETYPES.length]];
  return Object.freeze({ ...archetype, id: key, name: key, synthesized: true, archetypeId: archetype.id });
}

const synthCache = new Map();

/** camelCase → snake_case，供别名表之外的旧名兜底。 */
function toSnakeCase(key) {
  return key
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/[\s-]+/g, '_')
    .toLowerCase();
}

function lookup(key) {
  if (!key) return null;
  if (SKILL_LIBRARY[key]) return key;
  const alias = SKILL_ALIASES[key];
  if (alias && SKILL_LIBRARY[alias]) return alias;
  return null;
}

/**
 * 技能 id 归一化：现用 snake_case id → 原样；旧名 / 别名 / camelCase → 现用 id。
 * 认不出来返回 null（由 getSkill 决定兜底策略）。
 */
export function normalizeSkillId(id) {
  const raw = typeof id === 'object' && id ? id.id : id;
  if (raw == null || raw === '') return null;
  const key = String(raw).trim();
  const candidates = [
    key,
    key.toLowerCase(),
    toSnakeCase(key),
    // `skill_blaze_slash` / `sk_blaze_slash` 这类带前缀的写法
    toSnakeCase(key).replace(/^(?:skill|sk|s)_/, ''),
  ];
  for (const candidate of candidates) {
    const hit = lookup(candidate);
    if (hit) return hit;
  }
  return null;
}

/** 取技能定义；未知 id 走稳定兜底，永不返回 null。 */
export function getSkill(id) {
  if (!id) return BASIC_ATTACK;
  if (typeof id === 'object' && typeof id.resolve === 'function') return id;
  const key = typeof id === 'object' ? id.id : id;
  const resolved = normalizeSkillId(key);
  if (resolved) return SKILL_LIBRARY[resolved];
  if (!synthCache.has(key)) synthCache.set(key, synthesize(key));
  return synthCache.get(key);
}

export function listSkills() {
  return Object.values(SKILL_LIBRARY);
}

export function isSkillReady(unit, skillId) {
  const skill = getSkill(skillId);
  if (skill.cd <= 0) return true;
  return (unit.cooldowns?.[skill.id] ?? 0) <= 0;
}

/** 结算入口（engine 调用）。 */
export function resolveSkill(skill, ctx) {
  const def_ = getSkill(skill);
  def_.resolve(ctx);
  return def_;
}

/** 回合结束递减 CD。 */
export function tickCooldowns(unit) {
  for (const key of Object.keys(unit.cooldowns)) {
    if (unit.cooldowns[key] > 0) unit.cooldowns[key] -= 1;
    if (unit.cooldowns[key] <= 0) delete unit.cooldowns[key];
  }
}

/**
 * AI 技能选择：按情境加权，同分时用 priority 与 id 稳定排序。
 * ctx 需提供 aliveAllies() / aliveEnemies() / actor。
 */
export function pickSkill(ctx) {
  const actor = ctx.actor;
  const enemies = ctx.aliveEnemies();
  const allies = ctx.aliveAllies();
  const ready = [];
  for (const id of actor.skills ?? []) {
    const skill = getSkill(id);
    if (skill.id === BASIC_ATTACK.id) continue;
    if (!isSkillReady(actor, skill.id)) continue;
    ready.push(skill);
  }
  if (ready.length === 0) return BASIC_ATTACK;

  const hurtAlly = allies.some((u) => u.hp / u.maxHp < 0.55);
  const selfHurt = actor.hp / actor.maxHp < 0.5;
  const finishable = enemies.some((u) => u.hp / u.maxHp < 0.35);

  let best = null;
  let bestScore = -Infinity;
  for (const skill of ready) {
    let score = skill.priority;
    if (skill.tags.includes('aoe') || skill.tags.includes('multi')) score += (enemies.length - 1) * 14;
    if (skill.tags.includes('heal')) score += hurtAlly ? 40 : -45;
    if (skill.tags.includes('defense')) score += selfHurt ? 30 : -25;
    if (skill.tags.includes('finisher')) score += finishable ? 45 : -20;
    if (skill.tags.includes('lifesteal')) score += selfHurt ? 18 : 0;
    if (skill.tags.includes('buff')) score += allies.length >= 3 ? 12 : -6;
    if (skill.tags.includes('control')) score += enemies.length > 1 ? 8 : 0;
    if (score > bestScore || (score === bestScore && best && skill.id < best.id)) {
      best = skill;
      bestScore = score;
    }
  }
  return best ?? BASIC_ATTACK;
}
