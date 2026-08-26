/**
 * 战阵：栏位校验、羁绊计算、战力折算。
 *
 * 羁绊三大族（GDD 3.6）：
 *  - 同类型 ≥2 「同源共鸣」
 *  - 同元素 ≥3 「三相同辉」
 *  - 神话 ≥1 「兵魂」
 * 另附一条覆盖型羁绊「三相归一」（火冰雷齐备）。
 */

import {
  ELEMENTS,
  elementLabel,
  elementSpread,
  normalizeElement,
} from './elements.js';
import {
  QUALITY_ORDER,
  cloneUnit,
  qualityIndex,
  toCombatUnit,
  typeLabel,
} from './units.js';

export const MIN_LINEUP = 1;
export const MAX_LINEUP = 5;

/** 阵容栏位随主线进度解锁：1 / 2 / 3 / 4 / 5。 */
export const SLOT_UNLOCK_STAGES = Object.freeze([0, 2, 4, 9, 14]);

export const EMPTY_EFFECTS = Object.freeze({
  atkPct: 0,
  hpPct: 0,
  critAdd: 0,
  critDmgAdd: 0,
  reductionAdd: 0,
  speedPct: 0,
  elemDmgAdd: 0,
  lifestealAdd: 0,
  thornsAdd: 0,
  comboAdd: 0,
});

function emptyEffects() {
  return { ...EMPTY_EFFECTS };
}

function mergeEffects(target, source) {
  for (const key of Object.keys(EMPTY_EFFECTS)) {
    target[key] += Number(source?.[key]) || 0;
  }
  return target;
}

function num(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

/** 当前可用栏位数（1..5）。 */
export function lineupCapacity(state) {
  if (!state || typeof state !== 'object' || Array.isArray(state)) return MAX_LINEUP;
  const explicit = num(state.lineupSlots ?? state.flags?.lineupSlots ?? state.campaign?.lineupSlots, NaN);
  if (Number.isFinite(explicit)) {
    return Math.max(MIN_LINEUP, Math.min(MAX_LINEUP, Math.trunc(explicit)));
  }
  const cleared = num(
    state.campaign?.cleared ?? state.campaign?.maxStage ?? state.campaign?.highest ?? state.campaign?.stage,
    0,
  );
  let slots = MIN_LINEUP;
  for (let i = 0; i < SLOT_UNLOCK_STAGES.length; i += 1) {
    if (cleared >= SLOT_UNLOCK_STAGES[i]) slots = i + 1;
  }
  return Math.max(MIN_LINEUP, Math.min(MAX_LINEUP, slots));
}

function weaponsOf(state) {
  if (Array.isArray(state)) return state;
  if (!state || typeof state !== 'object') return [];
  if (Array.isArray(state.weapons)) return state.weapons;
  if (Array.isArray(state.inventory)) return state.inventory;
  if (Array.isArray(state.bag)) return state.bag;
  return [];
}

function catalogOf(state, opts) {
  return (
    opts?.catalog
    ?? (Array.isArray(state) ? null : state?.catalog ?? state?.weaponDefs ?? state?.defs ?? null)
  );
}

function weaponKey(weapon) {
  return String(weapon?.uid ?? weapon?.instanceId ?? weapon?.id ?? '');
}

/** 按 uid / id / 下标 / 直接对象 四种写法查兵器。 */
export function findWeapon(weapons, ref) {
  if (ref == null) return null;
  if (typeof ref === 'object') return ref;
  const key = String(ref);
  const hit = weapons.find((w) => weaponKey(w) === key);
  if (hit) return hit;
  if (typeof ref === 'number' && Number.isInteger(ref) && ref >= 0 && ref < weapons.length) {
    return weapons[ref];
  }
  return null;
}

/**
 * 把 state + lineupIds 解析为战斗单位数组（未套羁绊）。
 * state 也可以直接传兵器数组，lineupIds 省略时取全部/state.lineup。
 */
export function resolveLineupUnits(state, lineupIds, opts = {}) {
  const weapons = weaponsOf(state);
  const catalog = catalogOf(state, opts);
  const ids = lineupIds
    ?? (Array.isArray(state) ? weapons : state?.lineup)
    ?? [];
  const list = Array.isArray(ids) ? ids : [ids];

  const units = [];
  const missing = [];
  let slot = 0;
  for (const ref of list) {
    if (ref == null || ref === '') {
      slot += 1;
      continue;
    }
    const weapon = findWeapon(weapons, ref);
    if (!weapon) {
      missing.push(ref);
      slot += 1;
      continue;
    }
    units.push(
      toCombatUnit(weapon, {
        catalog,
        side: opts.side ?? 'player',
        slot,
        index: slot,
      }),
    );
    slot += 1;
  }
  return { units, missing, weapons, catalog };
}

/* ------------------------------------------------------------------ *
 * 校验
 * ------------------------------------------------------------------ */

/**
 * 阵容合法性校验。
 * @returns {{ ok, errors, warnings, capacity, filled, units, duplicates, missing }}
 */
export function validateLineup(state, lineupIds, opts = {}) {
  const weapons = weaponsOf(state);
  const capacity = opts.capacity ?? lineupCapacity(state);
  const raw = lineupIds ?? (Array.isArray(state) ? weapons : state?.lineup) ?? [];
  const list = Array.isArray(raw) ? raw : [raw];
  const errors = [];
  const warnings = [];

  if (list.length > MAX_LINEUP) {
    errors.push({ code: 'too_many', message: `阵容最多 ${MAX_LINEUP} 栏，当前 ${list.length} 栏。` });
  }
  if (list.length > capacity) {
    errors.push({ code: 'slot_locked', message: `第 ${capacity + 1} 栏尚未解锁（当前解锁 ${capacity} 栏）。` });
  }

  const seen = new Map();
  const duplicates = [];
  const missing = [];
  let filled = 0;
  for (let i = 0; i < list.length; i += 1) {
    const ref = list[i];
    if (ref == null || ref === '') continue;
    filled += 1;
    const weapon = findWeapon(weapons, ref);
    if (!weapon) {
      missing.push(ref);
      errors.push({ code: 'not_owned', slot: i, ref, message: `第 ${i + 1} 栏的兵器不存在于背包。` });
      continue;
    }
    const key = weaponKey(weapon) || `#${i}`;
    if (seen.has(key)) {
      duplicates.push(key);
      errors.push({ code: 'duplicate', slot: i, ref, message: `第 ${i + 1} 栏与第 ${seen.get(key) + 1} 栏重复上阵。` });
      continue;
    }
    seen.set(key, i);
  }

  if (filled < MIN_LINEUP) {
    errors.push({ code: 'empty', message: '至少需要上阵 1 把兵器。' });
  }
  if (filled > 0 && filled < capacity) {
    warnings.push({ code: 'not_full', message: `还有 ${capacity - filled} 个已解锁栏位空置。` });
  }

  const { units } = resolveLineupUnits(state, list, opts);
  if (units.length >= 2) {
    const spread = elementSpread(units);
    const kinds = ELEMENTS.filter((el) => spread[el] > 0).length;
    if (kinds === 1) {
      warnings.push({ code: 'single_element', message: '全队单一元素，容易被针对克制。' });
    }
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    capacity,
    filled,
    units,
    duplicates,
    missing,
  };
}

/* ------------------------------------------------------------------ *
 * 羁绊
 * ------------------------------------------------------------------ */

const TYPE_BOND_TIERS = Object.freeze([
  { need: 2, atkPct: 0.08, critAdd: 0.02, label: '双器同源' },
  { need: 3, atkPct: 0.14, critAdd: 0.04, label: '三器同源' },
  { need: 4, atkPct: 0.2, critAdd: 0.06, label: '四器同源' },
  { need: 5, atkPct: 0.26, critAdd: 0.08, label: '五器同源' },
]);

const ELEMENT_BOND_TIERS = Object.freeze([
  { need: 3, elemDmgAdd: 0.12, label: '三相同辉' },
  { need: 4, elemDmgAdd: 0.18, label: '四相同辉' },
  { need: 5, elemDmgAdd: 0.25, label: '五相同辉' },
]);

/** 同元素羁绊在通用增伤之外，各自附带一条性格化收益。 */
const ELEMENT_BOND_EXTRA = Object.freeze({
  fire: { critAdd: 0.05, desc: '炉火灼盛，暴击 +5%' },
  ice: { reductionAdd: 0.06, desc: '玄冰护体，减伤 +6%' },
  thunder: { speedPct: 0.08, desc: '雷行迅捷，速度 +8%' },
});

const MYTHIC_TIERS = Object.freeze([
  { need: 1, atkPct: 0.1, hpPct: 0.1, label: '兵魂初醒' },
  { need: 2, atkPct: 0.15, hpPct: 0.15, label: '兵魂共鸣' },
  { need: 3, atkPct: 0.2, hpPct: 0.2, label: '兵魂大成' },
]);

function pickTier(tiers, count) {
  let hit = null;
  for (const tier of tiers) {
    if (count >= tier.need) hit = tier;
  }
  return hit;
}

/**
 * 计算羁绊。
 * @param {Array} units 已归一化的战斗单位
 * @returns {Array<{id,name,desc,kind,tier,count,effects,members}>}
 */
export function computeBonds(units) {
  const list = Array.isArray(units) ? units.filter(Boolean) : [];
  const bonds = [];
  if (list.length === 0) return bonds;

  // 同类型 ≥2
  const byType = new Map();
  for (const u of list) {
    if (!u.type || u.type === 'unknown') continue;
    if (!byType.has(u.type)) byType.set(u.type, []);
    byType.get(u.type).push(u);
  }
  for (const type of [...byType.keys()].sort()) {
    const members = byType.get(type);
    const tier = pickTier(TYPE_BOND_TIERS, members.length);
    if (!tier) continue;
    bonds.push({
      id: `type:${type}`,
      name: `同源共鸣·${typeLabel(type)}`,
      desc: `${tier.label}：攻击 +${Math.round(tier.atkPct * 100)}%，暴击 +${Math.round(tier.critAdd * 100)}%`,
      kind: 'type',
      key: type,
      tier: tier.need,
      count: members.length,
      effects: { ...emptyEffects(), atkPct: tier.atkPct, critAdd: tier.critAdd },
      members: members.map((u) => u.uid),
    });
  }

  // 同元素 ≥3
  const byElement = new Map();
  for (const u of list) {
    const el = normalizeElement(u.element);
    if (!el) continue;
    if (!byElement.has(el)) byElement.set(el, []);
    byElement.get(el).push(u);
  }
  for (const el of ELEMENTS) {
    const members = byElement.get(el);
    if (!members) continue;
    const tier = pickTier(ELEMENT_BOND_TIERS, members.length);
    if (!tier) continue;
    const extra = ELEMENT_BOND_EXTRA[el];
    const effects = mergeEffects(emptyEffects(), { elemDmgAdd: tier.elemDmgAdd });
    mergeEffects(effects, extra);
    bonds.push({
      id: `element:${el}`,
      name: `${tier.label}·${elementLabel(el)}`,
      desc: `元素增伤 +${Math.round(tier.elemDmgAdd * 100)}%，${extra.desc}`,
      kind: 'element',
      key: el,
      tier: tier.need,
      count: members.length,
      effects,
      members: members.map((u) => u.uid),
    });
  }

  // 神话兵魂 ≥1
  const mythics = list.filter((u) => qualityIndex(u.quality) >= QUALITY_ORDER.indexOf('mythic'));
  if (mythics.length > 0) {
    const tier = pickTier(MYTHIC_TIERS, mythics.length);
    bonds.push({
      id: 'mythic:soul',
      name: `兵魂·${tier.label}`,
      desc: `神话兵器 ${mythics.length} 把：全队攻击 +${Math.round(tier.atkPct * 100)}%，生命 +${Math.round(tier.hpPct * 100)}%`,
      kind: 'mythic',
      key: 'mythic',
      tier: tier.need,
      count: mythics.length,
      effects: { ...emptyEffects(), atkPct: tier.atkPct, hpPct: tier.hpPct },
      members: mythics.map((u) => u.uid),
    });
  }

  // 三相归一（覆盖型）
  const spread = elementSpread(list);
  if (ELEMENTS.every((el) => spread[el] > 0)) {
    bonds.push({
      id: 'element:trinity',
      name: '三相归一',
      desc: '火冰雷齐备：元素增伤 +6%，速度 +4%',
      kind: 'coverage',
      key: 'trinity',
      tier: 3,
      count: 3,
      effects: { ...emptyEffects(), elemDmgAdd: 0.06, speedPct: 0.04 },
      members: list.map((u) => u.uid),
    });
  }

  return bonds;
}

/** 合并所有羁绊效果。 */
export function aggregateBondEffects(bonds) {
  const total = emptyEffects();
  for (const bond of bonds ?? []) mergeEffects(total, bond.effects);
  return total;
}

/** 生成套用羁绊后的新单位数组（不修改入参）。 */
export function applyBonds(units, bonds) {
  const effects = aggregateBondEffects(bonds);
  const names = (bonds ?? []).map((b) => b.name);
  return (units ?? []).map((unit) => {
    const next = cloneUnit(unit);
    next.atk = Math.max(1, Math.round(unit.atk * (1 + effects.atkPct)));
    next.baseAtk = next.atk;
    next.maxHp = Math.max(1, Math.round(unit.maxHp * (1 + effects.hpPct)));
    next.hp = next.maxHp;
    next.speed = Math.max(1, Math.round(unit.speed * (1 + effects.speedPct)));
    next.baseSpeed = next.speed;
    next.crit = Math.min(1, unit.crit + effects.critAdd);
    next.critDmg = unit.critDmg + effects.critDmgAdd;
    next.reduction = Math.min(0.75, unit.reduction + effects.reductionAdd);
    next.elemDmg = unit.elemDmg + effects.elemDmgAdd;
    next.lifesteal = unit.lifesteal + effects.lifestealAdd;
    next.thorns = unit.thorns + effects.thornsAdd;
    next.combo = Math.min(1, unit.combo + effects.comboAdd);
    next.bonds = names;
    return next;
  });
}

/* ------------------------------------------------------------------ *
 * 战力
 * ------------------------------------------------------------------ */

/**
 * 战力公式（GDD 6）：
 *   base    = Σ atk × (1 + crit × 0.5) × elementMod × utility
 *   hpTerm  = Σ maxHp × 0.15
 *   setBonus= (base + hpTerm) × bondFactor
 *   power   = round(base + hpTerm + setBonus)
 * 其中 elementMod = 1 + 元素增伤词条，utility 折算吸血/连击/减伤/反伤，
 * bondFactor 由羁绊聚合效果折算。
 *
 * 注意：units 必须传**未套羁绊**的原始单位，羁绊收益只通过 setBonus 计一次。
 */
export function computeLineupPower(units, bonds) {
  const list = Array.isArray(units) ? units.filter(Boolean) : [];
  if (list.length === 0) return 0;

  let base = 0;
  let hpTerm = 0;
  for (const u of list) {
    const elementMod = 1 + Math.max(0, num(u.elemDmg));
    const critMod = 1 + Math.max(0, num(u.crit)) * 0.5;
    const utility = 1
      + Math.max(0, num(u.lifesteal)) * 0.4
      + Math.max(0, num(u.combo)) * 0.3
      + Math.max(0, num(u.reduction)) * 0.5
      + Math.max(0, num(u.thorns)) * 0.2;
    base += num(u.atk) * critMod * elementMod * utility;
    hpTerm += num(u.maxHp) * 0.15;
  }

  const effects = aggregateBondEffects(bonds);
  const bondFactor = effects.atkPct * 0.6
    + effects.hpPct * 0.25
    + effects.critAdd * 0.5
    + effects.elemDmgAdd * 0.5
    + effects.speedPct * 0.3
    + effects.reductionAdd * 0.4;

  return Math.round((base + hpTerm) * (1 + bondFactor));
}

/**
 * 一站式阵容概览：单位、羁绊、聚合效果、战力。
 * @returns {{ units, bondedUnits, bonds, effects, power, validation }}
 */
export function lineupSummary(state, lineupIds, opts = {}) {
  const validation = validateLineup(state, lineupIds, opts);
  const units = validation.units;
  const bonds = computeBonds(units);
  const bondedUnits = applyBonds(units, bonds);
  return {
    units,
    bondedUnits,
    bonds,
    effects: aggregateBondEffects(bonds),
    power: computeLineupPower(units, bonds),
    validation,
  };
}
