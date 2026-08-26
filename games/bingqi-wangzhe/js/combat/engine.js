/**
 * 自动战斗引擎。
 *
 * 契约（ARCHITECTURE.md）：
 * ```
 * export function estimatePower(state, lineupIds)
 * export function simulateBattle({ playerWeapons, enemyWaves, rng, speed })
 * export function generateArenaOpponents(state, rng)
 * ```
 *
 * 设计要点：
 *  - 全程纯函数，无 window / DOM / Date 依赖，Node 可直接 import。
 *  - 所有随机走注入的 rng（或种子），同种子必然复现同一条 timeline。
 *  - 安全回合上限 MAX_ROUNDS = 50，另有行动次数硬保险，杜绝死循环。
 */

import {
  ELEMENTS,
  bestElementAgainst,
  dominantElement,
  elementCrystal,
  elementLabel,
  elementMultiplier,
  normalizeElement,
  relationLabel,
} from './elements.js';
import { hashSeed, toRng } from './rng.js';
import {
  QUALITY_ORDER,
  cloneUnit,
  qualityIndex,
  qualityLabel,
  toCombatUnit,
  typeLabel,
  unitSnapshot,
} from './units.js';
import {
  applyBonds,
  computeBonds,
  computeLineupPower,
  lineupSummary,
  resolveLineupUnits,
} from './lineup.js';
import {
  BASIC_ATTACK,
  pickSkill,
  resolveSkill,
  tickCooldowns,
} from './skills.js';

/**
 * 引擎版本。任何改变 rng 消耗次序的改动都必须 +1，
 * 否则历史种子的回放（golden 测试 / 战报重播）会静默漂移。
 */
export const ENGINE_VERSION = 1;

/** 安全回合上限：超过即判定并强制结束。 */
export const MAX_ROUNDS = 50;
/** 行动次数硬保险（回合上限 × 满员双方 × 冗余）。 */
const MAX_ACTIONS = MAX_ROUNDS * 12;
/** 磨战衰减：第 30 回合后治疗与护盾逐步失效，双奶阵容必然分出胜负。 */
const FATIGUE_START = 30;
const FATIGUE_STEP = 0.1;
/** 伤害浮动区间。 */
const VARIANCE_MIN = 0.94;
const VARIANCE_SPAN = 0.12;
/** 减伤硬上限。 */
const MAX_MITIGATION = 0.85;

/** 战报播放节奏（毫秒），实际值为 base / speed。 */
export const EVENT_DURATION = Object.freeze({
  start: 700,
  wave: 480,
  round: 240,
  action: 190,
  skill: 420,
  damage: 300,
  heal: 260,
  buff: 240,
  status: 200,
  dot: 240,
  shield: 220,
  kill: 700,
  end: 900,
});

export const EVENT_TYPES = Object.freeze([
  'start',
  'wave',
  'round',
  'action',
  'skill',
  'damage',
  'heal',
  'buff',
  'status',
  'dot',
  'shield',
  'kill',
  'end',
]);

/** AI 性格：影响选目标时元素/威胁/残血三项的权重。 */
export const AI_PROFILES = Object.freeze({
  balanced: Object.freeze({ id: 'balanced', name: '中庸', element: 1, threat: 1, lowHp: 1, lethal: 1 }),
  aggressive: Object.freeze({ id: 'aggressive', name: '悍勇', element: 0.8, threat: 1.6, lowHp: 0.7, lethal: 1.2 }),
  focus: Object.freeze({ id: 'focus', name: '收割', element: 0.9, threat: 0.6, lowHp: 1.8, lethal: 1.5 }),
  counter: Object.freeze({ id: 'counter', name: '相克', element: 1.9, threat: 0.8, lowHp: 0.9, lethal: 1 }),
  guard: Object.freeze({ id: 'guard', name: '镇守', element: 1, threat: 1.3, lowHp: 0.8, lethal: 0.9 }),
});

function profileOf(id) {
  return AI_PROFILES[id] ?? AI_PROFILES.balanced;
}

function num(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function clamp(value, min, max) {
  return value < min ? min : value > max ? max : value;
}

/* ------------------------------------------------------------------ *
 * 战力
 * ------------------------------------------------------------------ */

/**
 * 阵容战力评估。
 * @param {object|Array} state 存档（或直接给兵器数组）
 * @param {Array} [lineupIds] 上阵兵器 uid 列表，省略时取 state.lineup
 * @param {object} [opts] { catalog }
 * @returns {number}
 */
export function estimatePower(state, lineupIds, opts = {}) {
  const { units } = resolveLineupUnits(state, lineupIds, opts);
  if (units.length === 0) return 0;
  return computeLineupPower(units, computeBonds(units));
}

/** 直接对一组战斗单位估算战力（竞技场镜像用）。 */
export function estimateUnitsPower(units) {
  const list = Array.isArray(units) ? units : [];
  return computeLineupPower(list, computeBonds(list));
}

/* ------------------------------------------------------------------ *
 * 状态派生
 * ------------------------------------------------------------------ */

function statusValue(unit, id) {
  let total = 0;
  for (const s of unit.statuses) {
    if (s.id === id) total += num(s.value);
  }
  return total;
}

function hasStatus(unit, id) {
  return unit.statuses.some((s) => s.id === id);
}

function effAtk(unit) {
  const mod = 1 + statusValue(unit, 'atkUp') - statusValue(unit, 'weaken');
  return Math.max(1, unit.atk * Math.max(0.2, mod));
}

function effSpeed(unit) {
  const mod = 1 + statusValue(unit, 'haste') - statusValue(unit, 'chill');
  return Math.max(1, unit.speed * Math.max(0.2, mod));
}

function effReduction(unit) {
  return clamp(unit.reduction + statusValue(unit, 'guard'), 0, MAX_MITIGATION);
}

function effThorns(unit) {
  return Math.max(0, unit.thorns + statusValue(unit, 'thorns'));
}

function incomingMult(unit) {
  return 1 + statusValue(unit, 'mark');
}

function applyStatusTo(unit, incoming) {
  const existing = unit.statuses.find((s) => s.id === incoming.id && s.sourceUid === incoming.sourceUid);
  if (existing) {
    existing.turns = Math.max(existing.turns, incoming.turns);
    existing.value = incoming.id === 'burn' || incoming.id === 'shock'
      ? Math.min(existing.value + incoming.value, incoming.value * 3)
      : Math.max(existing.value, incoming.value);
    return existing;
  }
  const copy = { ...incoming };
  unit.statuses.push(copy);
  return copy;
}

function tickStatusDurations(unit) {
  unit.statuses = unit.statuses.filter((s) => {
    s.turns -= 1;
    return s.turns > 0;
  });
}

/* ------------------------------------------------------------------ *
 * 敌方波次归一化
 * ------------------------------------------------------------------ */

function normalizeWave(wave, index, opts) {
  const raw = Array.isArray(wave) ? { units: wave } : (wave ?? {});
  const list = raw.units ?? raw.enemies ?? raw.monsters ?? [];
  const units = (Array.isArray(list) ? list : [list])
    .filter(Boolean)
    .map((enemy, i) => toCombatUnit(enemy, {
      catalog: opts.catalog,
      side: 'enemy',
      slot: i,
      index: i,
    }));
  return {
    index,
    name: raw.name ?? `第 ${index + 1} 波`,
    ai: raw.ai ?? opts.enemyAi ?? null,
    rewards: raw.rewards ?? null,
    units,
  };
}

/** 把关卡/竞技配置转成引擎认可的波次数组。 */
export function toEnemyWaves(input, opts = {}) {
  if (!input) return [];
  const list = Array.isArray(input) ? input : [input];
  // 允许直接传一维敌人数组（视作单波）。
  const looksFlat = list.length > 0 && list.every((w) => w && !Array.isArray(w) && !w.units && !w.enemies && !w.monsters);
  const waves = looksFlat ? [list] : list;
  return waves.map((wave, i) => normalizeWave(wave, i, opts)).filter((w) => w.units.length > 0);
}

/* ------------------------------------------------------------------ *
 * 主模拟
 * ------------------------------------------------------------------ */

/**
 * 自动战斗模拟。
 *
 * @param {object} input
 * @param {Array}  input.playerWeapons 玩家上阵兵器（实例或已归一化单位）
 * @param {Array}  input.enemyWaves    敌方波次（1–3 波，每波若干敌人）
 * @param {object|number} [input.rng]  core/rng.js 实例、纯函数或种子
 * @param {number} [input.speed=1]     战报播放倍速（只影响事件时间戳）
 * @param {number} [input.seed]        无 rng 时的种子
 * @param {number} [input.maxRounds]   回合上限，默认 50
 * @param {number} [input.waveRecovery=0.2] 过波回复比例
 * @param {boolean}[input.bonds=true]  是否结算羁绊
 * @param {string} [input.mode='campaign'] campaign | arena | idle
 * @returns {{ winner, rounds, timeline, rewards, ... }}
 */
export function simulateBattle(input = {}) {
  const {
    playerWeapons = [],
    enemyWaves = [],
    rng: rngSource,
    speed = 1,
    seed,
    maxRounds = MAX_ROUNDS,
    waveRecovery = 0.2,
    bonds: useBonds = true,
    catalog = null,
    mode = 'campaign',
    playerAi = 'balanced',
    enemyAi = null,
  } = input;

  const rng = toRng(rngSource ?? seed, seed ?? 1);
  const playbackSpeed = clamp(num(speed, 1) || 1, 0.25, 8);
  const roundCap = clamp(Math.trunc(num(maxRounds, MAX_ROUNDS)) || MAX_ROUNDS, 1, MAX_ROUNDS * 4);

  // --- 组建双方 ---
  const rawPlayers = (Array.isArray(playerWeapons) ? playerWeapons : [playerWeapons])
    .filter(Boolean)
    .slice(0, 5)
    .map((w, i) => toCombatUnit(w, { catalog, side: 'player', slot: i, index: i }));
  const playerBonds = useBonds ? computeBonds(rawPlayers) : [];
  const players = (useBonds ? applyBonds(rawPlayers, playerBonds) : rawPlayers.map(cloneUnit))
    .map((u, i) => ({ ...u, side: 'player', slot: i, ai: u.ai ?? playerAi }));

  const waves = toEnemyWaves(enemyWaves, { catalog, enemyAi });

  const battle = {
    rng,
    speed: playbackSpeed,
    round: 0,
    wave: 0,
    seq: 0,
    clock: 0,
    actions: 0,
    timeline: [],
    players,
    enemies: [],
    mode,
  };

  const emit = (type, payload = {}) => {
    const event = {
      seq: battle.seq++,
      at: Math.round(battle.clock),
      t: type,
      round: battle.round,
      wave: battle.wave,
      ...payload,
    };
    battle.clock += (EVENT_DURATION[type] ?? 200) / playbackSpeed;
    battle.timeline.push(event);
    return event;
  };

  const alive = (list) => list.filter((u) => u.alive && u.hp > 0);
  const aliveOf = (unit) => (unit.side === 'player' ? alive(battle.players) : alive(battle.enemies));
  const foesOf = (unit) => (unit.side === 'player' ? alive(battle.enemies) : alive(battle.players));

  const playerAlive = () => alive(battle.players).length > 0;
  const enemyAlive = () => alive(battle.enemies).length > 0;

  /* --- 目标选择 AI --- */
  function selectTargets(actor, count = 1, mode_ = 'default') {
    const candidates = foesOf(actor);
    if (candidates.length === 0) return [];
    const profile = profileOf(actor.ai);
    const maxAtk = candidates.reduce((m, u) => Math.max(m, u.atk), 1);
    const estimate = effAtk(actor) * 1.25;
    const scored = candidates.map((target) => {
      const mult = elementMultiplier(actor.element, target.element);
      const hpRatio = target.hp / target.maxHp;
      let score = 0;
      score += (mult - 1) * 120 * profile.element;
      score += (1 - hpRatio) * 30 * profile.lowHp;
      score += (target.atk / maxAtk) * 25 * profile.threat;
      if (estimate * mult >= target.hp) score += 100 * profile.lethal;
      if (target.isBoss) score += 8;
      if (mode_ === 'threat') score += (target.atk / maxAtk) * 60;
      if (mode_ === 'lowest') score += (1 - hpRatio) * 90;
      score += rng.nextFloat() * 6;
      return { target, score };
    });
    scored.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (a.target.slot !== b.target.slot) return a.target.slot - b.target.slot;
      return a.target.uid < b.target.uid ? -1 : 1;
    });
    return scored.slice(0, Math.max(1, count)).map((s) => s.target);
  }

  /* --- 伤害结算 --- */
  function dealDamage(source, target, opts = {}) {
    if (!target || !target.alive || !source.alive) return null;
    const element = normalizeElement(opts.element ?? source.element);
    const power = num(opts.power, 1);
    const mult = elementMultiplier(element, target.element);
    const critChance = clamp(source.crit + num(opts.critBonus), 0, 1);
    const critRoll = rng.nextFloat(); // 恒定消耗一次，保证不同分支下随机流一致
    const crit = opts.canCrit === false ? false : critRoll < critChance;
    const critMul = crit ? source.critDmg : 1;
    const pierce = clamp(num(opts.pierce, source.pierce), 0, 1);
    const mitigation = effReduction(target) * (1 - pierce);
    const variance = VARIANCE_MIN + rng.nextFloat() * VARIANCE_SPAN;

    const raw = effAtk(source)
      * power
      * mult
      * (1 + source.elemDmg)
      * critMul
      * (1 - mitigation)
      * incomingMult(target)
      * variance;

    let damage = Math.max(1, Math.round(raw));
    let absorbed = 0;
    if (target.shield > 0) {
      absorbed = Math.min(target.shield, damage);
      target.shield -= absorbed;
      damage -= absorbed;
    }
    target.hp = Math.max(0, target.hp - damage);
    source.damageDealt += damage;
    target.damageTaken += damage;

    const relation = relationLabel(element, target.element);
    const marks = [];
    if (relation) marks.push(relation);
    if (crit) marks.push('暴击');
    if (absorbed > 0 && damage > 0) marks.push(`护盾吸收${absorbed}`);
    const hitText = damage === 0 && absorbed > 0
      ? `被护盾吸收 ${absorbed}`
      : `${damage} 伤害`;

    emit('damage', {
      actorUid: source.uid,
      actor: source.name,
      targetUid: target.uid,
      target: target.name,
      side: source.side,
      label: opts.label ?? '攻击',
      tag: opts.tag ?? 'skill',
      element,
      damage,
      absorbed,
      crit,
      relation: relation || '普通',
      multiplier: mult,
      hp: target.hp,
      maxHp: target.maxHp,
      text: `${opts.label ?? '攻击'} · ${source.name} → ${target.name} ${hitText}`
        + `${marks.length ? `（${marks.join(' · ')}）` : ''}`
        + ` [${target.name} ${target.hp}/${target.maxHp}]`,
    });

    const steal = num(opts.lifesteal, source.lifesteal);
    if (steal > 0 && damage > 0 && source.alive) {
      heal(source, Math.round(damage * steal), '吸血');
    }

    const thorns = effThorns(target);
    if (!opts.noReflect && thorns > 0 && damage > 0 && target.alive && source.alive) {
      const reflect = Math.max(1, Math.round(damage * thorns));
      source.hp = Math.max(0, source.hp - reflect);
      source.damageTaken += reflect;
      emit('damage', {
        actorUid: target.uid,
        actor: target.name,
        targetUid: source.uid,
        target: source.name,
        side: target.side,
        label: '棘甲反伤',
        tag: 'thorns',
        element: null,
        damage: reflect,
        absorbed: 0,
        crit: false,
        relation: '反伤',
        multiplier: 1,
        hp: source.hp,
        maxHp: source.maxHp,
        text: `棘甲反伤 · ${target.name} 弹回 ${reflect} 伤害 [${source.name} ${source.hp}/${source.maxHp}]`,
      });
      checkDeath(source, target);
    }

    const killed = checkDeath(target, source);
    return { damage, absorbed, crit, relation, multiplier: mult, killed };
  }

  function checkDeath(unit, killer) {
    if (unit.alive && unit.hp <= 0) {
      unit.alive = false;
      unit.hp = 0;
      unit.statuses = [];
      unit.shield = 0;
      if (killer && killer !== unit) killer.kills += 1;
      emit('kill', {
        actorUid: killer?.uid ?? null,
        actor: killer?.name ?? '',
        targetUid: unit.uid,
        target: unit.name,
        side: unit.side,
        text: `${unit.name} 被击破${killer && killer !== unit ? `（${killer.name}）` : ''}`,
      });
      return true;
    }
    return false;
  }

  /** 磨战衰减系数：回合越长，回复越无力。 */
  function fatigueMod() {
    if (battle.round <= FATIGUE_START) return 1;
    return Math.max(0, 1 - (battle.round - FATIGUE_START) * FATIGUE_STEP);
  }

  function heal(unit, amount, label = '回复') {
    const effective = Math.round(amount * fatigueMod());
    if (!unit.alive || effective <= 0) return 0;
    const before = unit.hp;
    unit.hp = Math.min(unit.maxHp, unit.hp + effective);
    const gained = unit.hp - before;
    if (gained <= 0) return 0;
    emit('heal', {
      actorUid: unit.uid,
      actor: unit.name,
      targetUid: unit.uid,
      target: unit.name,
      side: unit.side,
      label,
      amount: gained,
      hp: unit.hp,
      maxHp: unit.maxHp,
      text: `${label} · ${unit.name} 回复 ${gained} 生命 [${unit.hp}/${unit.maxHp}]`,
    });
    return gained;
  }

  function addShield(unit, amount, label = '护盾') {
    const effective = Math.round(amount * fatigueMod());
    if (!unit.alive || effective <= 0) return 0;
    unit.shield += effective;
    emit('shield', {
      actorUid: unit.uid,
      actor: unit.name,
      targetUid: unit.uid,
      target: unit.name,
      side: unit.side,
      label,
      amount: effective,
      shield: unit.shield,
      text: `${label} · ${unit.name} 获得 ${effective} 点护盾`,
    });
    return unit.shield;
  }

  function applyStatus(unit, incoming) {
    if (!unit.alive || !incoming) return null;
    const applied = applyStatusTo(unit, incoming);
    emit('status', {
      actorUid: incoming.sourceUid,
      targetUid: unit.uid,
      target: unit.name,
      side: unit.side,
      statusId: applied.id,
      status: applied.name,
      turns: applied.turns,
      value: applied.value,
      bad: applied.bad,
      text: `${unit.name} 获得【${applied.name}】${applied.turns} 回合`,
    });
    return applied;
  }

  function makeContext(actor, skill) {
    return {
      rng,
      battle,
      actor,
      skill,
      round: battle.round,
      wave: battle.wave,
      aliveEnemies: () => foesOf(actor),
      aliveAllies: () => aliveOf(actor),
      selectEnemies: (count = 1, mode_ = 'default') => selectTargets(actor, count, mode_),
      lowestAlly: () => {
        const list = aliveOf(actor);
        if (list.length === 0) return null;
        return list.reduce((best, u) => (u.hp / u.maxHp < best.hp / best.maxHp ? u : best), list[0]);
      },
      lowestEnemy: () => selectTargets(actor, 1, 'lowest')[0] ?? null,
      dealDamage: (target, opts) => dealDamage(actor, target, opts),
      heal: (target, amount, label) => heal(target, amount, label),
      addShield: (target, amount, label) => addShield(target, amount, label),
      applyStatus: (target, st) => applyStatus(target, st),
      effAtk,
      log: (type, payload = {}) => emit(type, payload),
    };
  }

  /* --- 回合内单体行动 --- */
  function takeTurn(unit) {
    if (!unit.alive) return;
    battle.actions += 1;

    // 回合开始：DOT / HOT 结算
    for (const st of unit.statuses.slice()) {
      if (st.id === 'burn' || st.id === 'shock') {
        const dot = Math.max(1, Math.round(st.value));
        unit.hp = Math.max(0, unit.hp - dot);
        unit.damageTaken += dot;
        emit('dot', {
          targetUid: unit.uid,
          target: unit.name,
          side: unit.side,
          statusId: st.id,
          status: st.name,
          element: st.element ?? null,
          damage: dot,
          hp: unit.hp,
          maxHp: unit.maxHp,
          text: `【${st.name}】${unit.name} 损失 ${dot} 生命 [${unit.hp}/${unit.maxHp}]`,
        });
        if (checkDeath(unit, null)) return;
      } else if (st.id === 'regen') {
        heal(unit, st.value, '淬体');
      }
    }
    if (!unit.alive) return;

    if (hasStatus(unit, 'freeze')) {
      emit('action', {
        actorUid: unit.uid,
        actor: unit.name,
        side: unit.side,
        skipped: true,
        reason: 'freeze',
        speed: Math.round(effSpeed(unit)),
        text: `${unit.name} 被冻结，本回合无法行动`,
      });
      tickStatusDurations(unit);
      tickCooldowns(unit);
      return;
    }

    const foes = foesOf(unit);
    if (foes.length === 0) return;

    const ctxProbe = makeContext(unit, BASIC_ATTACK);
    const skill = pickSkill(ctxProbe);
    const ctx = makeContext(unit, skill);

    emit('action', {
      actorUid: unit.uid,
      actor: unit.name,
      side: unit.side,
      element: unit.element,
      skillId: skill.id,
      skill: skill.name,
      speed: Math.round(effSpeed(unit)),
      hp: unit.hp,
      maxHp: unit.maxHp,
      text: `${unit.name}（${elementLabel(unit.element)}·速${Math.round(effSpeed(unit))}）出手`,
    });

    if (skill.id !== BASIC_ATTACK.id) {
      emit('skill', {
        actorUid: unit.uid,
        actor: unit.name,
        side: unit.side,
        skillId: skill.id,
        skill: skill.name,
        element: skill.element ?? unit.element,
        cd: skill.cd,
        desc: skill.desc ?? '',
        text: `${unit.name} 施展【${skill.name}】`,
      });
      unit.cooldowns[skill.id] = skill.cd;
    }

    resolveSkill(skill, ctx);

    tickStatusDurations(unit);
    tickCooldowns(unit);
  }

  /**
   * 出手顺序：速度条降序。
   * 同速时每回合重抽先手签——固定「玩家优先」会让完全镜像的对战出现约 12pp 的
   * 系统性先手优势，竞技场镜像必须公平。抽签走战斗 rng，因此仍然种子可复现。
   */
  function turnOrder() {
    const units = [...alive(battle.players), ...alive(battle.enemies)];
    const initiative = new Map();
    for (const u of units) initiative.set(u, rng.nextFloat());
    return units.sort((a, b) => {
      const sa = effSpeed(a);
      const sb = effSpeed(b);
      if (sb !== sa) return sb - sa;
      const ia = initiative.get(a);
      const ib = initiative.get(b);
      if (ia !== ib) return ib - ia;
      if (a.slot !== b.slot) return a.slot - b.slot;
      return a.uid < b.uid ? -1 : 1;
    });
  }

  /* --- 开战 --- */
  emit('start', {
    engineVersion: ENGINE_VERSION,
    mode,
    speed: playbackSpeed,
    seed: rng.seed,
    maxRounds: roundCap,
    players: battle.players.map(unitSnapshot),
    waves: waves.map((w) => ({ name: w.name, units: w.units.map(unitSnapshot) })),
    bonds: playerBonds.map((b) => ({ id: b.id, name: b.name, desc: b.desc })),
    text: `战斗开始：我方 ${battle.players.length} 器 vs ${waves.length} 波敌军`
      + `${playerBonds.length ? `（羁绊：${playerBonds.map((b) => b.name).join('、')}）` : ''}`,
  });

  let timeout = false;
  let clearedWaves = 0;

  if (battle.players.length === 0 || waves.length === 0) {
    const winner = battle.players.length === 0 ? 'enemy' : 'player';
    emit('end', {
      winner,
      rounds: 0,
      timeout: false,
      text: winner === 'player' ? '无敌可战，直接凯旋' : '无兵可用，战斗失败',
    });
    return finalize({
      battle,
      waves,
      winner,
      rounds: 0,
      timeout: false,
      clearedWaves: winner === 'player' ? waves.length : 0,
      playerBonds,
      rng,
      mode,
      playbackSpeed,
      roundCap,
    });
  }

  for (let w = 0; w < waves.length; w += 1) {
    battle.wave = w + 1;
    battle.enemies = waves[w].units.map((u) => {
      const clone = cloneUnit(u);
      clone.ai = clone.ai ?? waves[w].ai ?? (clone.isBoss ? 'focus' : 'balanced');
      return clone;
    });
    if (waves[w].bonds !== false) {
      const spawned = battle.enemies;
      const enemyBonds = computeBonds(spawned);
      if (enemyBonds.length > 0) {
        battle.enemies = applyBonds(spawned, enemyBonds).map((u, i) => ({
          ...u,
          side: 'enemy',
          slot: i,
          ai: spawned[i].ai,
        }));
      }
    }

    emit('wave', {
      waveIndex: w,
      name: waves[w].name,
      enemies: battle.enemies.map(unitSnapshot),
      text: `【${waves[w].name}】${battle.enemies.map((u) => `${u.name}(${elementLabel(u.element)})`).join('、')} 登场`,
    });

    while (playerAlive() && enemyAlive() && battle.round < roundCap && battle.actions < MAX_ACTIONS) {
      battle.round += 1;
      emit('round', {
        text: `— 第 ${battle.round} 回合 —`,
      });
      for (const unit of turnOrder()) {
        if (!unit.alive) continue;
        if (!playerAlive() || !enemyAlive()) break;
        takeTurn(unit);
        if (battle.actions >= MAX_ACTIONS) break;
      }
    }

    if (!enemyAlive()) clearedWaves += 1;

    if (!playerAlive()) break;
    if (battle.round >= roundCap || battle.actions >= MAX_ACTIONS) {
      timeout = true;
      break;
    }

    // 过波恢复
    if (w < waves.length - 1 && waveRecovery > 0) {
      for (const unit of alive(battle.players)) {
        heal(unit, Math.round(unit.maxHp * waveRecovery), '整备');
        unit.statuses = unit.statuses.filter((s) => !s.bad);
      }
    }
  }

  let winner;
  if (!playerAlive()) {
    winner = 'enemy';
  } else if (clearedWaves >= waves.length) {
    winner = 'player';
  } else {
    // 触顶判定：按剩余血量比拼
    const pRatio = ratioOf(battle.players);
    const eRatio = ratioOf(battle.enemies);
    winner = Math.abs(pRatio - eRatio) < 0.05 ? 'draw' : pRatio > eRatio ? 'player' : 'enemy';
    timeout = true;
  }

  emit('end', {
    winner,
    rounds: battle.round,
    timeout,
    clearedWaves,
    survivors: alive(battle.players).map(unitSnapshot),
    text: winner === 'player'
      ? `战斗胜利！共 ${battle.round} 回合，存活 ${alive(battle.players).length} 器${timeout ? '（回合触顶·血量判定）' : ''}`
      : winner === 'draw'
        ? `回合触顶，双方战平（${battle.round} 回合）`
        : `战斗失败……坚持了 ${battle.round} 回合`,
  });

  return finalize({
    battle,
    waves,
    winner,
    rounds: battle.round,
    timeout,
    clearedWaves,
    playerBonds,
    rng,
    mode,
    playbackSpeed,
    roundCap,
  });
}

function ratioOf(units) {
  const list = units ?? [];
  if (list.length === 0) return 0;
  let hp = 0;
  let max = 0;
  for (const u of list) {
    hp += Math.max(0, u.hp);
    max += u.maxHp;
  }
  return max > 0 ? hp / max : 0;
}

function finalize({ battle, waves, winner, rounds, timeout, clearedWaves, playerBonds, rng, mode, playbackSpeed, roundCap }) {
  const survivors = battle.players.filter((u) => u.alive && u.hp > 0);
  const survivorRatio = battle.players.length > 0 ? survivors.length / battle.players.length : 0;
  const paceScore = 1 - Math.min(1, rounds / roundCap);
  const score = survivorRatio * 0.7 + paceScore * 0.3;
  const grade = winner !== 'player' ? 'D' : score >= 0.85 ? 'S' : score >= 0.7 ? 'A' : score >= 0.5 ? 'B' : 'C';
  const stars = winner !== 'player' ? 0 : grade === 'S' || grade === 'A' ? 3 : grade === 'B' ? 2 : 1;

  const rewards = computeRewards({ waves, winner, grade, rng, mode });

  return {
    winner,
    rounds,
    timeline: battle.timeline,
    rewards,
    timeout,
    grade,
    stars,
    score: Math.round(score * 100) / 100,
    engineVersion: ENGINE_VERSION,
    seed: rng.seed,
    speed: playbackSpeed,
    mode,
    waves: waves.length,
    clearedWaves,
    bonds: playerBonds.map((b) => ({ id: b.id, name: b.name, desc: b.desc })),
    players: battle.players.map(unitSnapshot),
    enemies: battle.enemies.map(unitSnapshot),
    survivors: survivors.map(unitSnapshot),
    durationMs: Math.round(battle.clock),
    stats: {
      actions: battle.actions,
      events: battle.timeline.length,
      damageDealt: battle.players.reduce((s, u) => s + u.damageDealt, 0),
      damageTaken: battle.players.reduce((s, u) => s + u.damageTaken, 0),
    },
  };
}

/* ------------------------------------------------------------------ *
 * 奖励
 * ------------------------------------------------------------------ */

const GRADE_MULTIPLIER = Object.freeze({ S: 1.2, A: 1.1, B: 1, C: 0.9, D: 0 });

function emptyRewards() {
  return {
    coin: 0,
    iron: 0,
    silverOre: 0,
    goldOre: 0,
    fireCrystal: 0,
    iceCrystal: 0,
    thunderCrystal: 0,
    luckyCharm: 0,
    diamond: 0,
    exp: 0,
  };
}

function computeRewards({ waves, winner, grade, rng, mode }) {
  const rewards = emptyRewards();
  const allEnemies = waves.flatMap((w) => w.units);
  if (allEnemies.length === 0) return rewards;

  const explicit = waves.filter((w) => w.rewards);
  if (explicit.length > 0) {
    for (const wave of explicit) {
      for (const [key, value] of Object.entries(wave.rewards)) {
        rewards[key] = (rewards[key] ?? 0) + num(value);
      }
    }
  } else {
    let value = 0;
    let bestQuality = 0;
    let hasBoss = false;
    for (const u of allEnemies) {
      const weight = u.isBoss ? 1.5 : 1;
      value += (u.atk * 1.6 + u.maxHp * 0.35) * weight;
      bestQuality = Math.max(bestQuality, qualityIndex(u.quality));
      hasBoss = hasBoss || u.isBoss;
    }
    rewards.coin = Math.round(value * 0.08);
    rewards.iron = Math.round(value * 0.02);
    rewards.exp = Math.round(value * 0.05);
    if (bestQuality >= QUALITY_ORDER.indexOf('rare')) rewards.silverOre = Math.round(value * 0.006);
    if (bestQuality >= QUALITY_ORDER.indexOf('epic') || hasBoss) rewards.goldOre = Math.max(1, Math.round(value * 0.002));
    const el = dominantElement(allEnemies);
    const crystal = elementCrystal(el);
    if (crystal) rewards[crystal] = Math.max(1, Math.round(value * 0.004));
    if (mode === 'arena') {
      rewards.diamond = rng.int(3, 6);
      rewards.goldOre = Math.max(rewards.goldOre, rng.int(2, 5));
    }
  }

  const mult = GRADE_MULTIPLIER[grade] ?? 1;
  if (winner !== 'player') {
    // 败北保底：只给少量铜钱与经验，方便新手爬坡
    const coin = Math.round(rewards.coin * 0.25);
    const exp = Math.round(rewards.exp * 0.3);
    const out = emptyRewards();
    out.coin = coin;
    out.exp = exp;
    return out;
  }

  const jitter = 0.94 + rng.nextFloat() * 0.12;
  for (const key of Object.keys(rewards)) {
    if (rewards[key] === 0) continue;
    const scale = key === 'diamond' ? mult : mult * jitter;
    rewards[key] = Math.max(key === 'coin' ? 1 : 0, Math.round(rewards[key] * scale));
  }
  return rewards;
}

/* ------------------------------------------------------------------ *
 * 竞技场
 * ------------------------------------------------------------------ */

const SURNAMES = Object.freeze([
  '慕容', '独孤', '南宫', '欧阳', '司徒', '上官', '轩辕', '东方',
  '沈', '洛', '苏', '楚', '陆', '林', '姜', '秦', '燕', '柳', '霍', '裴',
]);

const GIVEN_NAMES = Object.freeze([
  '寒江', '烬阳', '朔风', '弄雪', '青崖', '断岳', '照夜', '流火',
  '无咎', '听雷', '扶摇', '不归', '踏歌', '孤鸿', '燎原', '照霜',
  '拂衣', '惊蛰', '寻真', '重山',
]);

const TITLES = Object.freeze([
  '炉火游侠', '断锋客', '霜纹执令', '雷台守将', '赤炎行者', '玄冰匠首',
  '紫霄游击', '锻骨门徒', '铁衣宿将', '三相试炼者',
]);

const ARENA_AI_POOL = Object.freeze(['balanced', 'aggressive', 'focus', 'counter', 'guard']);

const ARENA_TYPES = Object.freeze([
  'sword', 'blade', 'spear', 'halberd', 'bow', 'crossbow',
  'axe', 'hammer', 'fan', 'flute', 'umbrella', 'glaive',
]);

const ARENA_SKILL_POOL = Object.freeze({
  fire: ['blaze_slash', 'execute', 'whirlwind', 'double_strike'],
  ice: ['frost_lock', 'guard_stance', 'thorn_armor', 'forge_mend'],
  thunder: ['thunder_chain', 'pierce_shot', 'gale_lead', 'double_strike'],
});

/**
 * 本地竞技场镜像：按玩家战力生成 20 名 AI 对手。
 * 同 state + 同 rng 种子 → 完全一致的对手表。
 *
 * @param {object} state 存档
 * @param {object|number} rng core/rng.js 实例或种子
 * @param {object} [opts] { count = 20, basePower, catalog }
 */
export function generateArenaOpponents(state, rng, opts = {}) {
  const r = toRng(rng, hashSeed(state?.seed ?? 'arena'));
  const count = clamp(Math.trunc(num(opts.count, 20)) || 20, 1, 100);
  const basePower = Math.max(600, num(opts.basePower, estimatePower(state, undefined, opts)) || 800);
  const playerScore = num(state?.arena?.score, 1200);

  const opponents = [];
  for (let i = 0; i < count; i += 1) {
    // rank 1 最强（1.45 倍战力），末位约 0.65 倍，附带 ±3% 抖动
    const ladder = count > 1 ? i / (count - 1) : 0;
    const factor = clamp(1.45 - ladder * 0.8 + (r.nextFloat() - 0.5) * 0.06, 0.5, 1.8);
    const targetPower = Math.round(basePower * factor);
    const size = clamp(Math.round(factor * 3.2), 1, 5);
    // 越靠前的对手越倾向三相混编：单一元素阵容虽有同辉羁绊，却会被针对性克制打穿，
    // 让高名次少走单元素，排名与实际难度才对得上。
    const focus = r.chance(clamp(0.85 - factor * 0.35, 0.15, 0.85)) ? r.pick(ELEMENTS) : null;
    const qIndex = clamp(Math.floor(factor * 3.1), 0, QUALITY_ORDER.length - 1);

    const lineup = [];
    for (let s = 0; s < size; s += 1) {
      const element = focus && r.chance(0.7) ? focus : r.pick(ELEMENTS);
      const type = r.pick(ARENA_TYPES);
      const quality = QUALITY_ORDER[clamp(qIndex + (r.chance(0.25) ? 1 : 0), 0, QUALITY_ORDER.length - 1)];
      const skillPool = ARENA_SKILL_POOL[element];
      const skills = [skillPool[r.int(0, skillPool.length - 1)]];
      if (r.chance(0.35)) skills.push(skillPool[r.int(0, skillPool.length - 1)]);
      lineup.push({
        uid: `arena-${i}-${s}`,
        name: `${typeLabel(type)}·${elementLabel(element)}${qualityLabel(quality)}`,
        type,
        element,
        quality,
        level: Math.max(1, Math.round(factor * 12)),
        atk: Math.round(80 + r.nextFloat() * 40),
        hp: Math.round(420 + r.nextFloat() * 220),
        crit: 0.05 + r.nextFloat() * 0.1,
        reduction: r.nextFloat() * 0.12,
        lifesteal: r.chance(0.3) ? 0.05 + r.nextFloat() * 0.1 : 0,
        elemDmg: r.nextFloat() * 0.15,
        skills: [...new Set(skills)],
      });
    }

    // 先按相对数值建单位，再线性缩放到目标战力（战力对 atk/hp 是齐次线性）
    let units = lineup.map((w, s) => toCombatUnit(w, { side: 'enemy', slot: s, index: s }));
    const rawPower = estimateUnitsPower(units);
    const scale = rawPower > 0 ? targetPower / rawPower : 1;
    for (let s = 0; s < lineup.length; s += 1) {
      lineup[s].atk = Math.max(1, Math.round(units[s].atk * scale));
      lineup[s].hp = Math.max(1, Math.round(units[s].maxHp * scale));
    }
    units = lineup.map((w, s) => toCombatUnit(w, { side: 'enemy', slot: s, index: s }));

    const ai = r.pick(ARENA_AI_POOL);
    const name = `${r.pick(SURNAMES)}${r.pick(GIVEN_NAMES)}`;
    opponents.push({
      id: `arena-${i + 1}`,
      rank: i + 1,
      name,
      title: r.pick(TITLES),
      ai,
      aiName: profileOf(ai).name,
      element: focus,
      power: estimateUnitsPower(units),
      score: Math.round(playerScore * 0.6 + factor * 620),
      lineup,
      units: units.map(unitSnapshot),
      rewards: {
        diamond: clamp(6 - Math.floor(ladder * 4), 2, 6),
        goldOre: clamp(8 - Math.floor(ladder * 5), 3, 8),
        score: clamp(Math.round(28 - ladder * 20), 6, 30),
      },
      counterHint: focus ? bestElementAgainst(focus) : null,
    });
  }
  return opponents;
}

/** 竞技对手 → simulateBattle 可直接吃的波次。 */
export function arenaOpponentToWaves(opponent) {
  if (!opponent) return [];
  return [{
    name: `${opponent.name} 的防守阵`,
    ai: opponent.ai,
    units: opponent.lineup,
  }];
}

/* ------------------------------------------------------------------ *
 * 文本战报
 * ------------------------------------------------------------------ */

const REPORT_PREFIX = Object.freeze({
  start: '◆',
  wave: '▣',
  round: '──',
  action: '·',
  skill: '✦',
  damage: '  ↳',
  heal: '  ♥',
  shield: '  ▢',
  status: '  ◈',
  dot: '  ~',
  kill: '  ✖',
  end: '◆',
});

/**
 * 把 timeline 渲染成纯文本战报（UI 降级显示 / 测试断言 / 控制台调试）。
 * @param {object} result simulateBattle 的返回值
 * @param {object} [opts] { types, showSeq }
 */
export function formatBattleReport(result, opts = {}) {
  if (!result) return '';
  const allow = opts.types ? new Set(opts.types) : null;
  const lines = [];
  for (const ev of result.timeline) {
    if (allow && !allow.has(ev.t)) continue;
    const prefix = REPORT_PREFIX[ev.t] ?? ' ';
    const text = ev.text ?? ev.t;
    lines.push(`${opts.showSeq ? `#${String(ev.seq).padStart(3, '0')} ` : ''}${prefix} ${text}`);
  }
  const reward = Object.entries(result.rewards)
    .filter(([, v]) => v > 0)
    .map(([k, v]) => `${k} +${v}`)
    .join('，');
  lines.push(`◆ 结算：${result.winner === 'player' ? '胜' : result.winner === 'draw' ? '平' : '负'}`
    + ` · 评级 ${result.grade} · ${result.stars}★ · 回合 ${result.rounds}`);
  lines.push(`◆ 奖励：${reward || '无'}`);
  return lines.join('\n');
}

/**
 * 便利再导出：engine.js 是战斗层的门面，测试与 UI 常只 import 这一个文件，
 * 因此把元素表与阵容 API 一并透出，避免调用方去记内部文件划分。
 */
export {
  ELEMENT_CYCLE,
  ELEMENTS,
  NEUTRAL_MULTIPLIER,
  STRONG_MULTIPLIER,
  WEAK_MULTIPLIER,
  counterOf,
  counteredBy,
  elementLabel,
  elementMultiplier,
  elementRelation,
  normalizeElement,
} from './elements.js';
export {
  MAX_LINEUP,
  MIN_LINEUP,
  aggregateBondEffects,
  applyBonds,
  computeBonds,
  computeLineupPower,
  lineupCapacity,
  lineupSummary,
  validateLineup,
} from './lineup.js';
