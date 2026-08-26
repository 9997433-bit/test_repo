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
 *   dealDamage(target, { power, element, pierce, canCrit, critBonus, lifesteal, label, tag, noReflect,
 *                        statusId, aoe, multiHit, hitIndex, hitCount }),
 *   heal(target, amount, label), addShield(target, amount, label),
 *   applyStatus(target, status), effAtk(unit), log(type, payload)
 * }
 * ```
 *
 * 后五个是 Round 3 的**演出提示**，只写进 timeline，不参与任何数值结算：
 * 不传时引擎按本次施放的技能特征（`skillCastHints`）自动填，
 * 传了就以传入值为准——多段技逐段报 `hitIndex / hitCount` 才能让 UI 排开弹道。
 */

import { elementLabel } from './elements.js';

/**
 * 状态 id 的旧名映射（fable-2 规格 §1.2）。
 * 规格与数据层各自用过一套写法，权威一律取下面 `STATUS_INFO` 的 id。
 */
export const STATUS_ALIASES = Object.freeze({
  atkDown: 'weaken',
  defDown: 'mark',
  drUp: 'guard',
  defUp: 'guard',
  slow: 'chill',
  speedDown: 'chill',
  speedUp: 'haste',
  stun: 'freeze',
  paralyze: 'freeze',
  bleed: 'burn',
  dot: 'burn',
  hot: 'regen',
  thorn: 'thorns',
});

/**
 * 状态表。
 *
 * `icon` / `color` 是 Round 3 为 UI 补的展示字段：状态条要画图标，
 * 时间轴与飘字要按状态染色。战斗结算完全不读这两个键，改它们不影响任何数值，
 * 但 `id / name / kind / bad` 仍是结算与存档认的权威语义，不能动。
 */
export const STATUS_INFO = Object.freeze({
  burn: Object.freeze({ id: 'burn', name: '灼烧', kind: 'dot', bad: true, icon: '🔥', color: '#ff6b3d' }),
  chill: Object.freeze({ id: 'chill', name: '冰缓', kind: 'debuff', bad: true, icon: '❄️', color: '#7cc7ff' }),
  freeze: Object.freeze({ id: 'freeze', name: '冻结', kind: 'control', bad: true, icon: '🧊', color: '#4a9be8' }),
  shock: Object.freeze({ id: 'shock', name: '感电', kind: 'dot', bad: true, icon: '⚡', color: '#c99bff' }),
  mark: Object.freeze({ id: 'mark', name: '破绽', kind: 'debuff', bad: true, icon: '🎯', color: '#ff8fa3' }),
  weaken: Object.freeze({ id: 'weaken', name: '弱化', kind: 'debuff', bad: true, icon: '🔻', color: '#b07d6a' }),
  atkUp: Object.freeze({ id: 'atkUp', name: '战意', kind: 'buff', bad: false, icon: '⚔️', color: '#e4b84a' }),
  guard: Object.freeze({ id: 'guard', name: '铁壁', kind: 'buff', bad: false, icon: '🛡️', color: '#9fb4c7' }),
  thorns: Object.freeze({ id: 'thorns', name: '棘甲', kind: 'buff', bad: false, icon: '🌵', color: '#6fbf73' }),
  regen: Object.freeze({ id: 'regen', name: '淬体', kind: 'hot', bad: false, icon: '💚', color: '#7fd6a2' }),
  haste: Object.freeze({ id: 'haste', name: '疾风', kind: 'buff', bad: false, icon: '💨', color: '#8fe0d8' }),
});

/** 未登记状态的展示兜底：UI 拿到任何 id 都画得出一个格子，不必判空。 */
export const DEFAULT_STATUS_INFO = Object.freeze({
  id: null,
  name: '未知状态',
  kind: 'buff',
  bad: false,
  icon: '✦',
  color: '#9a9188',
});

/** 状态 id 归一化；认不出来原样返回（容错优先，绝不抛错）。 */
export function normalizeStatusId(id) {
  if (typeof id !== 'string') return id;
  const key = id.trim();
  if (STATUS_INFO[key]) return key;
  return STATUS_ALIASES[key] ?? STATUS_ALIASES[key.toLowerCase()] ?? key;
}

/** 状态展示信息（含 icon / color）；未知 id 回落到 `DEFAULT_STATUS_INFO` 并带上原 id。 */
export function statusInfo(id) {
  const key = normalizeStatusId(id);
  return STATUS_INFO[key] ?? Object.freeze({ ...DEFAULT_STATUS_INFO, id: key ?? null });
}

/** 状态图标；`id` 为空时返回 null，方便 UI 直接 `icon && render(icon)`。 */
export function statusIcon(id) {
  if (id == null || id === '') return null;
  return statusInfo(id).icon;
}

function status(rawId, turns, value, source, extra = {}) {
  const id = normalizeStatusId(rawId);
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

/**
 * 本次施放实际使用的元素。
 *
 * 原型的元素是硬编码的（烈焰斩=火），但数据层的技借原型结算时元素由数据说了算，
 * 否则「火系多段技」借雷链原型会打出雷伤。返回 undefined 表示跟随持有者主元素。
 */
function castElement(ctx, fallback) {
  return ctx?.skill?.element ?? fallback ?? undefined;
}

/* ------------------------------------------------------------------ *
 * 技能结算函数（≥8）
 * ------------------------------------------------------------------ */

/** 烈焰斩：单体高倍火伤 + 灼烧 DOT。 */
export function resolveBlazeSlash(ctx) {
  const [target] = ctx.selectEnemies(1);
  if (!target) return;
  const element = castElement(ctx, 'fire');
  const hit = ctx.dealDamage(target, {
    power: 1.75,
    element,
    label: ctx.skill?.name ?? '烈焰斩',
    statusId: 'burn',
  });
  if (hit && target.alive) {
    ctx.applyStatus(target, status('burn', 3, Math.max(1, Math.round(hit.damage * 0.18)), ctx.actor, { element }));
  }
}

/** 霜锁：冰伤 + 减速，低血时概率冻结一回合。 */
export function resolveFrostLock(ctx) {
  const [target] = ctx.selectEnemies(1);
  if (!target) return;
  const element = castElement(ctx, 'ice');
  const hit = ctx.dealDamage(target, {
    power: 1.45,
    element,
    label: ctx.skill?.name ?? '霜锁',
    statusId: 'chill',
  });
  if (!hit || !target.alive) return;
  ctx.applyStatus(target, status('chill', 2, 0.25, ctx.actor, { element }));
  const hpRatio = target.hp / target.maxHp;
  const freezeChance = 0.18 + (1 - hpRatio) * 0.22;
  if (ctx.rng.chance(freezeChance)) {
    ctx.applyStatus(target, status('freeze', 1, 1, ctx.actor, { element }));
  }
}

/** 雷链：跳跃至多 3 个目标，每跳衰减 22%。 */
export function resolveThunderChain(ctx) {
  const targets = ctx.selectEnemies(3, 'chain');
  if (targets.length === 0) return;
  const element = castElement(ctx, 'thunder');
  const name = ctx.skill?.name ?? '雷链';
  let power = 1.32;
  for (let i = 0; i < targets.length; i += 1) {
    const target = targets[i];
    if (!target.alive) continue;
    const hit = ctx.dealDamage(target, {
      power,
      element,
      label: i === 0 ? name : `${name}·${i + 1}跳`,
      statusId: 'shock',
      multiHit: true,
      hitIndex: i + 1,
      hitCount: targets.length,
    });
    if (hit && target.alive && ctx.rng.chance(0.25)) {
      ctx.applyStatus(target, status('shock', 2, Math.max(1, Math.round(hit.damage * 0.12)), ctx.actor, { element }));
    }
    power *= 0.78;
  }
}

/** 旋风斩：全体溅射，命中数越多单体越低。 */
export function resolveWhirlwind(ctx) {
  const targets = ctx.aliveEnemies();
  if (targets.length === 0) return;
  const power = 1.15 - Math.min(0.3, (targets.length - 1) * 0.09);
  const element = castElement(ctx);
  const label = ctx.skill?.name ?? '旋风斩';
  // 溅射是「一段打多人」：报 aoe 与溅射序号，但不是多段（multiHit），
  // 否则 UI 会把横扫演成连击。
  let index = 0;
  for (const target of targets) {
    if (!target.alive) continue;
    index += 1;
    ctx.dealDamage(target, {
      power,
      element,
      label,
      tag: 'aoe',
      aoe: true,
      multiHit: false,
      hitIndex: index,
      hitCount: targets.length,
    });
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
    element: castElement(ctx),
    label: ctx.skill?.name ?? '破甲射',
    statusId: 'mark',
  });
  if (hit && target.alive) {
    ctx.applyStatus(target, status('mark', 2, 0.12, ctx.actor));
  }
}

/** 饮血：吸血一击，回复自身。 */
export function resolveBloodDrink(ctx) {
  const [target] = ctx.selectEnemies(1);
  if (!target) return;
  ctx.dealDamage(target, {
    power: 1.4,
    lifesteal: 0.45,
    element: castElement(ctx),
    label: ctx.skill?.name ?? '饮血',
  });
}

/** 铁壁：自身护盾 + 全队减伤。 */
export function resolveGuardStance(ctx) {
  const shield = Math.round(ctx.effAtk(ctx.actor) * 1.6 + ctx.actor.maxHp * 0.08);
  ctx.addShield(ctx.actor, shield, ctx.skill?.name ?? '铁壁');
  for (const ally of ctx.aliveAllies()) {
    ctx.applyStatus(ally, status('guard', 2, ally === ctx.actor ? 0.18 : 0.1, ctx.actor));
  }
}

/** 连环击：两段攻击，第二段 65% 倍率，可再触发连击词条。 */
export function resolveDoubleStrike(ctx) {
  const [first] = ctx.selectEnemies(1);
  if (!first) return;
  const element = castElement(ctx);
  const name = ctx.skill?.name ?? '连环击';
  ctx.dealDamage(first, { power: 1.05, element, label: `${name}·一`, multiHit: true, hitIndex: 1, hitCount: 2 });
  const next = first.alive ? first : ctx.selectEnemies(1)[0];
  if (next && next.alive) {
    ctx.dealDamage(next, { power: 0.65, element, label: `${name}·二`, multiHit: true, hitIndex: 2, hitCount: 2 });
  }
}

/** 兵魂共鸣：神话被动主动化，全队攻击力提升并附带元素增伤。 */
export function resolveSoulResonance(ctx) {
  const allies = ctx.aliveAllies();
  const element = castElement(ctx) ?? ctx.actor.element;
  for (const ally of allies) {
    ctx.applyStatus(ally, status('atkUp', 3, 0.22, ctx.actor, { element }));
  }
  // payload 与其他事件对齐：只放可序列化的标量，不要把活的 unit 引用塞进时间轴
  ctx.log('buff', {
    actorUid: ctx.actor.uid,
    actor: ctx.actor.name,
    side: ctx.actor.side,
    element,
    label: ctx.skill?.name ?? '兵魂共鸣',
    statusId: 'atkUp',
    icon: statusIcon('atkUp'),
    targets: allies.map((u) => u.uid),
    text: `${ctx.actor.name} 唤醒兵魂，全军攻击 +22%（${elementLabel(element)}共鸣）`,
  });
}

/** 棘甲：反伤增益 + 自身回复。 */
export function resolveThornArmor(ctx) {
  ctx.applyStatus(ctx.actor, status('thorns', 3, 0.35, ctx.actor));
  ctx.heal(ctx.actor, Math.round(ctx.actor.maxHp * 0.08), ctx.skill?.name ?? '棘甲淬炼');
}

/** 斩杀：目标血量越低伤害越高，最高 2.6 倍。 */
export function resolveExecute(ctx) {
  const [target] = ctx.selectEnemies(1, 'lowest');
  if (!target) return;
  const missing = 1 - target.hp / target.maxHp;
  ctx.dealDamage(target, {
    power: 1.2 + missing * 1.4,
    critBonus: 0.1,
    element: castElement(ctx),
    label: ctx.skill?.name ?? '斩杀',
  });
}

/** 炉火淬体：治疗最残血友军并挂持续回复。 */
export function resolveForgeMend(ctx) {
  const target = ctx.lowestAlly();
  if (!target) return;
  const amount = Math.round(ctx.effAtk(ctx.actor) * 1.1 + target.maxHp * 0.1);
  ctx.heal(target, amount, ctx.skill?.name ?? '炉火淬体');
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
      // 连击是掷骰后才知道的，首段发生时无从预告，只有追击这一段带 multiHit。
      ctx.dealDamage(follow, { power: 0.5, label: '连击', tag: 'combo', multiHit: true, hitIndex: 2, hitCount: 2 });
    }
  }
}

/* ------------------------------------------------------------------ *
 * 技能表
 * ------------------------------------------------------------------ */

/**
 * 技能定义。
 *
 * `statuses` 是这一技**会挂出来**的状态 id（主状态在前），Round 3 新增：
 * 引擎据此给 skill / damage 事件填 `statusId`，UI 才能在弹道上预挂状态图标。
 * 只是演出提示，实际有没有挂上仍由 `resolve` 里的掷骰说了算。
 */
function def(entry) {
  return Object.freeze({
    kind: 'active',
    element: null,
    cd: 3,
    priority: 50,
    targeting: 'enemy',
    tags: Object.freeze([]),
    statuses: Object.freeze([]),
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
    statuses: Object.freeze(['burn']),
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
    statuses: Object.freeze(['chill', 'freeze']),
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
    statuses: Object.freeze(['shock']),
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
    statuses: Object.freeze(['mark']),
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
    statuses: Object.freeze(['guard']),
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
    statuses: Object.freeze(['atkUp']),
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
    statuses: Object.freeze(['thorns']),
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
    statuses: Object.freeze(['regen']),
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
    statuses: Object.freeze(['haste', 'weaken']),
  }),
});

/**
 * 数据层 `data/skills.js` 的 `sk_*` 技 → 战斗层结算原型。
 *
 * 数据层按「兵器技」组织（三炉 + 神话 + 敌方，53 条），战斗层按结算原型组织（13 条），
 * 两边不是一一对应。没有这张表时 `getSkill` 会拿 id 的 FNV 哈希随机挑一个原型，
 * id 虽然统一了，行为却是在掷骰子——治疗技可能被打成斩杀技。
 *
 * 表内条目取自 fable-2《Round 2 战斗规格对齐清单》§1.3；`name / element / cd`
 * 与 `data/skills.js` 原定义保持一致（战斗层不 import 数据层，只复制这三个
 * 有结算意义的字段；文案 `desc` 仍用原型的，避免把大段散文抄两遍）。
 *
 * 形如 `[原型 id, 名称, 元素, 冷却]`。
 */
const DATA_SKILL_TABLE = Object.freeze({
  // 精铁炉
  sk_liehuo_zhan: ['blaze_slash', '烈火斩', 'fire', 3],
  sk_hanfeng_ci: ['frost_lock', '寒锋刺', 'ice', 3],
  sk_leiting_tu: ['pierce_shot', '雷霆突', 'thunder', 3],
  sk_hanyu_she: ['execute', '寒羽射', 'ice', 3],
  sk_pishan: ['pierce_shot', '劈山', 'fire', 4],
  sk_leiming_ji: ['whirlwind', '雷鸣击', 'thunder', 4],
  sk_qingfeng_fu: ['forge_mend', '清风拂', 'ice', 3],
  sk_liyin_zhen: ['whirlwind', '离音震', 'thunder', 4],
  sk_zhepeng: ['guard_stance', '遮篷', 'fire', 4],
  sk_beici: ['execute', '背刺', 'fire', 3],
  sk_hengsao: ['whirlwind', '横扫', 'fire', 3],
  sk_shouye_nu: ['double_strike', '守夜弩', 'thunder', 3],
  // 白银炉
  sk_yanwu_zhan: ['blaze_slash', '焰舞斩', 'fire', 3],
  sk_shuangfeng_lian: ['frost_lock', '霜锋连', 'ice', 3],
  sk_binghe_ci: ['whirlwind', '冰河刺', 'ice', 4],
  sk_xingluo_ji: ['whirlwind', '星落戟', 'thunder', 4],
  sk_liehuo_nu: ['blaze_slash', '裂火弩', 'fire', 3],
  sk_lianzhu_lei: ['thunder_chain', '连珠雷', 'thunder', 3],
  sk_bingpo_zhan: ['frost_lock', '冰魄斩', 'ice', 4],
  sk_ronghuo_za: ['whirlwind', '熔火砸', 'fire', 4],
  sk_yanwei_shan: ['whirlwind', '焰尾扇', 'fire', 3],
  sk_jiuxiao_yin: ['soul_resonance', '九霄引', 'thunder', 4],
  sk_xuemu: ['guard_stance', '雪幕', 'ice', 4],
  sk_linguang_ci: ['blood_drink', '鳞光刺', 'ice', 3],
  sk_qiuhong_she: ['frost_lock', '秋鸿射', 'ice', 3],
  // 黄金炉
  sk_poxiao_yijian: ['execute', '破晓一剑', 'thunder', 4],
  sk_wangchuan_zhan: ['blood_drink', '忘川斩', 'ice', 4],
  sk_tunri_ci: ['blaze_slash', '吞日刺', 'fire', 4],
  sk_jiuli_hengsao: ['whirlwind', '九黎横扫', 'thunder', 4],
  sk_shechen: ['execute', '射尘', 'fire', 4],
  sk_zhenchao: ['guard_stance', '镇潮', 'ice', 5],
  sk_duanlong: ['pierce_shot', '断龙', 'thunder', 5],
  sk_fenji: ['whirlwind', '焚寂', 'fire', 4],
  sk_zhaohun: ['forge_mend', '招魂', 'ice', 5],
  sk_zhetian: ['guard_stance', '遮天', 'thunder', 5],
  sk_wanji: ['thunder_chain', '万机', 'thunder', 4],
  sk_chanyi: ['blood_drink', '蝉翼', 'fire', 3],
  // 神话
  sk_zhulong_kaimu: ['whirlwind', '烛龙开目', 'fire', 5],
  sk_xuanming_fengyuan: ['whirlwind', '玄冥封渊', 'ice', 5],
  sk_leize_tianwen: ['execute', '雷泽天问', 'thunder', 5],
  sk_taixu_xingyun: ['thunder_chain', '太虚星陨', 'fire', 5],
  // 敌方
  sk_e_zaowo_hui: ['blaze_slash', '灶涡回', 'fire', 3],
  sk_e_suibing: ['whirlwind', '碎冰', 'ice', 3],
  sk_e_maidian: ['pierce_shot', '埋电', 'thunder', 3],
  sk_e_tiepi: ['guard_stance', '铁皮', null, 4],
  sk_e_kuangnu: ['soul_resonance', '狂怒', null, 4],
  sk_e_fenshen_zhan: ['whirlwind', '焚身斩', 'fire', 4],
  sk_e_hanyuan_suo: ['whirlwind', '寒渊锁', 'ice', 4],
  sk_e_leiting_pu: ['whirlwind', '雷霆铺', 'thunder', 4],
  sk_e_taotie_shi: ['blood_drink', '饕餮食', null, 5],
  sk_e_wuxiang_beng: ['whirlwind', '无相崩', null, 5],
  sk_e_jiuyou_fen: ['whirlwind', '九幽焚', 'fire', 5],
  sk_e_tianwen_ni: ['pierce_shot', '天问·逆', 'thunder', 5],
});

/** 数据层技 id → `{ archetype, name, element, cd }`，只读视图。 */
export const DATA_SKILL_ARCHETYPES = Object.freeze(
  Object.fromEntries(
    Object.entries(DATA_SKILL_TABLE).map(([id, [archetype, name, element, cd]]) => [
      id,
      Object.freeze({ id, archetype, name, element, cd }),
    ]),
  ),
);

/**
 * Round 1 之前各分支与 fable-2 规格 §5 用过的旧技能 id（camelCase / 早期命名）。
 * 统一到 snake_case 之后仍要认这些旧名，否则老存档与老关卡表会掉进哈希兜底。
 *
 * `bond_*` 被动**不在**这里：羁绊走 `lineup.js` 的 `computeBonds`，不经 `getSkill`。
 * `js/ui/mock/data.js` 的 `sk_flame_slash` 一族属于待删 mock，按规格 R0-2 不做映射。
 */
const LEGACY_SKILL_ALIASES = Object.freeze({
  // fable-2 规格 §5 十二技
  flameSlash: 'blaze_slash',
  frostPierce: 'frost_lock',
  whirlwindAxe: 'whirlwind',
  quakeHammer: 'pierce_shot',
  windFanMend: 'forge_mend',
  warFlute: 'soul_resonance',
  jadeUmbrella: 'guard_stance',
  galeArrow: 'double_strike',
  bladeDance: 'blood_drink',
  halberdSweep: 'whirlwind',
  dragonInferno: 'sk_zhulong_kaimu',
  basicAttack: 'basic_attack',
  // 规格 §5 备注里的另外三把神话模板
  frostMythic: 'sk_xuanming_fengyuan',
  thunderMythic: 'sk_leize_tianwen',
  neutralMythic: 'soul_resonance',
  // 其余分支旧名
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
  normalAttack: 'basic_attack',
  normal_attack: 'basic_attack',
});

/** 旧名 / 中文名 / 早期分支 id → 权威 id（原型库 id 或数据层 `sk_*` id）。 */
export const SKILL_ALIASES = Object.freeze({
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
const dataSkillCache = new Map();

/** 数据层技 → 挂在原型上的派生定义（保留数据层的 id / 名称 / 元素 / CD）。 */
function dataSkill(id) {
  if (!dataSkillCache.has(id)) {
    const spec = DATA_SKILL_ARCHETYPES[id];
    const archetype = SKILL_LIBRARY[spec.archetype];
    dataSkillCache.set(id, Object.freeze({
      ...archetype,
      id,
      name: spec.name,
      element: spec.element ?? archetype.element,
      cd: spec.cd,
      archetypeId: archetype.id,
      fromData: true,
    }));
  }
  return dataSkillCache.get(id);
}

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
  if (DATA_SKILL_ARCHETYPES[key]) return key;
  const alias = SKILL_ALIASES[key];
  if (alias && (SKILL_LIBRARY[alias] || DATA_SKILL_ARCHETYPES[alias])) return alias;
  return null;
}

/**
 * 技能 id 归一化：权威 id（原型库 snake_case 或数据层 `sk_*`）原样返回，
 * 旧名 / 中文名 / camelCase 折到权威 id；认不出来返回 null（由 getSkill 决定兜底）。
 *
 * 只剥 `skill_` 前缀：`sk_` 前缀属于数据层的权威命名空间，不能顺手剥掉，
 * 否则待删 mock 的 `sk_flame_slash` 会被误认成 `flame_slash`（规格 R0-2 禁止）。
 */
export function normalizeSkillId(id) {
  const raw = typeof id === 'object' && id ? id.id : id;
  if (raw == null || raw === '') return null;
  const key = String(raw).trim();
  const snake = toSnakeCase(key);
  for (const candidate of [key, key.toLowerCase(), snake, snake.replace(/^skill_/, '')]) {
    const hit = lookup(candidate);
    if (hit) return hit;
  }
  return null;
}

/**
 * 取技能定义；未知 id 走稳定兜底，永不返回 null。
 * 解析顺序：SKILL_LIBRARY → SKILL_ALIASES → DATA_SKILL_ARCHETYPES → synthesize。
 */
export function getSkill(id) {
  if (!id) return BASIC_ATTACK;
  if (typeof id === 'object' && typeof id.resolve === 'function') return id;
  const key = typeof id === 'object' ? id.id : id;
  const resolved = normalizeSkillId(key);
  if (resolved) return SKILL_LIBRARY[resolved] ?? dataSkill(resolved);
  if (!synthCache.has(key)) synthCache.set(key, synthesize(key));
  return synthCache.get(key);
}

export function listSkills() {
  return Object.values(SKILL_LIBRARY);
}

/**
 * 一次施放的演出提示（Round 3）：引擎用它给 timeline 的
 * `aoe` / `multiHit` / `statusId` 填缺省值，resolve 里传的显式值优先。
 *
 * 纯读技能定义，不碰战场、不掷骰，因此不影响任何数值与随机流。
 *
 * @param {string|object} skill 技能 id 或定义
 * @returns {{ skillId, aoe: boolean, multiHit: boolean, statusId: string|null, statusIds: string[] }}
 */
export function skillCastHints(skill) {
  const def_ = getSkill(skill);
  const tags = def_.tags ?? [];
  const statusIds = Object.freeze((def_.statuses ?? []).map(normalizeStatusId).filter(Boolean));
  return Object.freeze({
    skillId: def_.id ?? null,
    // 群体技 = 打标签的溅射技，或者目标域本就是「敌方全体 / 我方全体」。
    aoe: tags.includes('aoe') || def_.targeting === 'enemyAll' || def_.targeting === 'allyAll',
    multiHit: tags.includes('multi'),
    statusId: statusIds[0] ?? null,
    statusIds,
  });
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
