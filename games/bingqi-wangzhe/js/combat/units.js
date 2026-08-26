/**
 * 战斗单位归一化。
 *
 * 兵器实例（存档里的 `state.weapons[]`）、图鉴原型（`data/weapons.js`）、
 * 关卡敌人配置（`data/stages.js`）三种形态字段不完全一致，
 * 这里统一折算成战斗引擎唯一认可的 CombatUnit：
 *
 * ```
 * {
 *   uid, defId, name, title, side, slot,
 *   type, element, quality, level,
 *   atk, hp, maxHp, speed, crit, critDmg,
 *   lifesteal, combo, reduction, thorns, elemDmg, pierce,
 *   skills[], cooldowns{}, statuses[], shield, alive, isBoss
 * }
 * ```
 */

import { normalizeElement } from './elements.js';

export const QUALITY_ORDER = Object.freeze([
  'common',
  'uncommon',
  'rare',
  'epic',
  'legendary',
  'mythic',
]);

export const QUALITY_INFO = Object.freeze({
  common: Object.freeze({ id: 'common', name: '凡铁', color: '#9a9188', mult: 1.0 }),
  uncommon: Object.freeze({ id: 'uncommon', name: '精钢', color: '#6fbf73', mult: 1.15 }),
  rare: Object.freeze({ id: 'rare', name: '玄兵', color: '#4a9be8', mult: 1.35 }),
  epic: Object.freeze({ id: 'epic', name: '紫霄', color: '#a76bff', mult: 1.62 }),
  legendary: Object.freeze({ id: 'legendary', name: '传说', color: '#e4b84a', mult: 1.95 }),
  mythic: Object.freeze({ id: 'mythic', name: '神话', color: '#ff6b4a', mult: 2.4 }),
});

const QUALITY_ALIASES = Object.freeze({
  凡铁: 'common',
  精钢: 'uncommon',
  玄兵: 'rare',
  紫霄: 'epic',
  传说: 'legendary',
  神话: 'mythic',
  normal: 'common',
  green: 'uncommon',
  blue: 'rare',
  purple: 'epic',
  orange: 'legendary',
  red: 'mythic',
});

/**
 * 兵器类型：影响基础速度与暴击手感（攻/血直接取数据层数值，不再二次乘算）。
 * role 供羁绊与 AI 参考：striker 输出 / guard 承伤 / ranger 远程 / support 辅助。
 */
export const TYPE_INFO = Object.freeze({
  sword: Object.freeze({ id: 'sword', name: '剑', speed: 106, crit: 0.03, role: 'striker' }),
  blade: Object.freeze({ id: 'blade', name: '刀', speed: 100, crit: 0.03, role: 'striker' }),
  spear: Object.freeze({ id: 'spear', name: '枪', speed: 98, crit: 0.02, role: 'striker' }),
  halberd: Object.freeze({ id: 'halberd', name: '戟', speed: 90, crit: 0.01, role: 'guard' }),
  glaive: Object.freeze({ id: 'glaive', name: '戟刃', speed: 88, crit: 0.02, role: 'guard' }),
  bow: Object.freeze({ id: 'bow', name: '弓', speed: 112, crit: 0.06, role: 'ranger' }),
  crossbow: Object.freeze({ id: 'crossbow', name: '弩', speed: 96, crit: 0.05, role: 'ranger' }),
  axe: Object.freeze({ id: 'axe', name: '斧', speed: 84, crit: 0.01, role: 'guard' }),
  hammer: Object.freeze({ id: 'hammer', name: '锤', speed: 78, crit: 0, role: 'guard' }),
  fan: Object.freeze({ id: 'fan', name: '扇', speed: 120, crit: 0.04, role: 'support' }),
  flute: Object.freeze({ id: 'flute', name: '笛', speed: 110, crit: 0.02, role: 'support' }),
  umbrella: Object.freeze({ id: 'umbrella', name: '伞', speed: 94, crit: 0.02, role: 'support' }),
  relic: Object.freeze({ id: 'relic', name: '神器', speed: 104, crit: 0.05, role: 'striker' }),
});

const TYPE_ALIASES = Object.freeze({
  剑: 'sword',
  刀: 'blade',
  枪: 'spear',
  戟: 'halberd',
  戟刃: 'glaive',
  弓: 'bow',
  弩: 'crossbow',
  斧: 'axe',
  锤: 'hammer',
  扇: 'fan',
  笛: 'flute',
  伞: 'umbrella',
  神器: 'relic',
  dagger: 'blade',
  saber: 'blade',
  katana: 'blade',
  lance: 'spear',
  polearm: 'halberd',
  mace: 'hammer',
  artifact: 'relic',
  divine: 'relic',
  mythicWeapon: 'relic',
});

const DEFAULT_TYPE = Object.freeze({ id: 'unknown', name: '异器', speed: 100, crit: 0, role: 'striker' });

/** 词条键归一化：GDD 词条池 = 元素伤害/暴击/吸血/连击/减伤/速度/反伤。 */
const AFFIX_ALIASES = Object.freeze({
  elemdmg: 'elemDmg',
  elementdmg: 'elemDmg',
  elementdamage: 'elemDmg',
  元素伤害: 'elemDmg',
  crit: 'crit',
  critrate: 'crit',
  暴击: 'crit',
  critdmg: 'critDmg',
  critdamage: 'critDmg',
  暴伤: 'critDmg',
  lifesteal: 'lifesteal',
  vampire: 'lifesteal',
  吸血: 'lifesteal',
  combo: 'combo',
  连击: 'combo',
  reduction: 'reduction',
  defense: 'reduction',
  减伤: 'reduction',
  speed: 'speed',
  速度: 'speed',
  thorns: 'thorns',
  reflect: 'thorns',
  反伤: 'thorns',
  pierce: 'pierce',
  破甲: 'pierce',
  atk: 'atkPct',
  atkpct: 'atkPct',
  hp: 'hpPct',
  hppct: 'hpPct',
});

const PERCENT_AFFIXES = new Set([
  'elemDmg',
  'crit',
  'lifesteal',
  'combo',
  'reduction',
  'speed',
  'thorns',
  'pierce',
  'atkPct',
  'hpPct',
]);

export function qualityIndex(quality) {
  const q = normalizeQuality(quality);
  const idx = QUALITY_ORDER.indexOf(q);
  return idx < 0 ? 0 : idx;
}

export function normalizeQuality(quality) {
  if (typeof quality === 'number') {
    return QUALITY_ORDER[Math.max(0, Math.min(QUALITY_ORDER.length - 1, Math.trunc(quality)))];
  }
  if (typeof quality === 'string') {
    const key = quality.trim();
    if (QUALITY_INFO[key]) return key;
    const lower = key.toLowerCase();
    if (QUALITY_INFO[lower]) return lower;
    if (QUALITY_ALIASES[key]) return QUALITY_ALIASES[key];
    if (QUALITY_ALIASES[lower]) return QUALITY_ALIASES[lower];
  }
  return 'common';
}

export function qualityMultiplier(quality) {
  return QUALITY_INFO[normalizeQuality(quality)].mult;
}

export function qualityLabel(quality) {
  return QUALITY_INFO[normalizeQuality(quality)].name;
}

export function normalizeType(type) {
  if (typeof type === 'string') {
    const key = type.trim();
    if (TYPE_INFO[key]) return key;
    const lower = key.toLowerCase();
    if (TYPE_INFO[lower]) return lower;
    if (TYPE_ALIASES[key]) return TYPE_ALIASES[key];
    if (TYPE_ALIASES[lower]) return TYPE_ALIASES[lower];
  }
  return 'unknown';
}

export function typeInfo(type) {
  return TYPE_INFO[normalizeType(type)] ?? DEFAULT_TYPE;
}

export function typeLabel(type) {
  return typeInfo(type).name;
}

/** 图鉴 catalog 支持数组或字典两种形态。 */
export function resolveWeaponDef(weapon, catalog) {
  if (!weapon) return null;
  if (weapon.def && typeof weapon.def === 'object') return weapon.def;
  const id = weapon.defId ?? weapon.weaponId ?? weapon.protoId ?? weapon.baseId ?? weapon.id;
  if (!id || !catalog) return null;
  if (Array.isArray(catalog)) {
    return catalog.find((entry) => entry && (entry.id === id || entry.defId === id)) ?? null;
  }
  if (typeof catalog === 'object') {
    return catalog[id] ?? null;
  }
  return null;
}

function normalizeAffixKey(key) {
  if (typeof key !== 'string') return null;
  const trimmed = key.trim();
  return AFFIX_ALIASES[trimmed] ?? AFFIX_ALIASES[trimmed.toLowerCase()] ?? null;
}

function normalizeAffixValue(key, raw) {
  const value = Number(raw);
  if (!Number.isFinite(value)) return 0;
  // 数据层可能写 0.08 也可能写 8（百分数），统一折算成小数。
  if (PERCENT_AFFIXES.has(key) && Math.abs(value) > 1) return value / 100;
  return value;
}

/** 支持 `[{ id, value }]`、`[{ key, value }]`、`{ crit: 0.08 }`、`['crit']` 多种写法。 */
export function collectAffixes(source) {
  const out = {
    elemDmg: 0,
    crit: 0,
    critDmg: 0,
    lifesteal: 0,
    combo: 0,
    reduction: 0,
    speed: 0,
    thorns: 0,
    pierce: 0,
    atkPct: 0,
    hpPct: 0,
  };
  const add = (rawKey, rawValue) => {
    const key = normalizeAffixKey(rawKey);
    if (!key) return;
    out[key] += normalizeAffixValue(key, rawValue);
  };
  const consume = (list) => {
    if (!list) return;
    if (Array.isArray(list)) {
      for (const entry of list) {
        if (!entry) continue;
        if (typeof entry === 'string') add(entry, 0.05);
        else add(entry.id ?? entry.key ?? entry.type ?? entry.name, entry.value ?? entry.amount ?? entry.v);
      }
      return;
    }
    if (typeof list === 'object') {
      for (const [key, value] of Object.entries(list)) add(key, value);
    }
  };
  consume(source?.affixes);
  consume(source?.affix);
  consume(source?.runes);
  consume(source?.stats);
  consume(source?.bonuses);
  return out;
}

function collectSkills(raw, def) {
  const ids = [];
  const push = (value) => {
    if (!value) return;
    if (Array.isArray(value)) {
      for (const item of value) push(item);
      return;
    }
    if (typeof value === 'string') {
      if (!ids.includes(value)) ids.push(value);
      return;
    }
    if (typeof value === 'object' && value.id) push(value.id);
  };
  push(raw?.skills);
  push(raw?.skillIds);
  push(raw?.skillId);
  push(def?.skills);
  push(def?.skillId);
  return ids;
}

function num(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

let autoUid = 0;

/**
 * 归一化为战斗单位。
 * @param {object} raw 兵器实例 / 原型 / 敌人配置
 * @param {object} [opts] { catalog, side, slot, index, levelAtkStep, levelHpStep }
 */
export function toCombatUnit(raw, opts = {}) {
  const source = raw ?? {};
  const def = resolveWeaponDef(source, opts.catalog) ?? {};
  const merged = { ...def, ...source };

  const type = normalizeType(merged.type);
  const info = typeInfo(type);
  const quality = normalizeQuality(merged.quality ?? merged.rarity ?? merged.grade);
  const level = Math.max(1, Math.trunc(num(merged.level, 1)));
  const qMul = qualityMultiplier(quality);
  const atkStep = num(opts.levelAtkStep, 0.11);
  const hpStep = num(opts.levelHpStep, 0.13);

  const affixes = collectAffixes(merged);

  const baseAtk = num(merged.baseAtk ?? merged.atkBase, 0);
  const baseHp = num(merged.baseHp ?? merged.hpBase, 0);
  const rawAtk = num(merged.atk, NaN);
  const rawHp = num(merged.maxHp ?? merged.hp, NaN);

  const atkCore = Number.isFinite(rawAtk)
    ? rawAtk
    : Math.max(1, Math.round(baseAtk * qMul * (1 + atkStep * (level - 1))));
  const hpCore = Number.isFinite(rawHp)
    ? rawHp
    : Math.max(1, Math.round((baseHp || baseAtk * 4 || 100) * qMul * (1 + hpStep * (level - 1))));

  const atk = Math.max(1, Math.round(atkCore * (1 + affixes.atkPct)));
  const maxHp = Math.max(1, Math.round(hpCore * (1 + affixes.hpPct)));
  const speed = Math.max(1, Math.round(num(merged.speed, info.speed) * (1 + affixes.speed)));

  const uid = merged.uid ?? merged.instanceId ?? merged.id ?? `u${(autoUid += 1)}`;

  return {
    uid: String(uid),
    defId: merged.defId ?? merged.weaponId ?? def.id ?? merged.id ?? null,
    name: merged.name ?? def.name ?? '无名兵器',
    title: merged.title ?? def.title ?? '',
    side: opts.side ?? 'player',
    slot: Number.isFinite(opts.slot) ? opts.slot : num(merged.slot, num(opts.index, 0)),
    type,
    typeName: info.name,
    role: merged.role ?? info.role,
    element: normalizeElement(merged.element, null),
    quality,
    level,
    atk,
    baseAtk: atk,
    hp: maxHp,
    maxHp,
    speed,
    baseSpeed: speed,
    crit: clamp01(num(merged.crit, 0.05) + info.crit + affixes.crit),
    critDmg: Math.max(1, num(merged.critDmg, 1.5) + affixes.critDmg),
    lifesteal: Math.max(0, num(merged.lifesteal, 0) + affixes.lifesteal),
    combo: clamp01(num(merged.combo, 0) + affixes.combo),
    reduction: Math.max(0, Math.min(0.75, num(merged.reduction, 0) + affixes.reduction)),
    thorns: Math.max(0, num(merged.thorns, 0) + affixes.thorns),
    elemDmg: Math.max(0, num(merged.elemDmg, 0) + affixes.elemDmg),
    pierce: clamp01(num(merged.pierce, 0) + affixes.pierce),
    skills: collectSkills(source, def),
    isBoss: Boolean(merged.isBoss ?? merged.boss),
    ai: merged.ai ?? null,
    cooldowns: {},
    statuses: [],
    shield: 0,
    alive: true,
    damageDealt: 0,
    damageTaken: 0,
    kills: 0,
    bonds: [],
  };
}

export function clamp01(value) {
  if (!Number.isFinite(value)) return 0;
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

/** 深拷贝到独立战斗态（statuses / cooldowns 不共享引用）。 */
export function cloneUnit(unit) {
  return {
    ...unit,
    cooldowns: { ...unit.cooldowns },
    statuses: unit.statuses.map((s) => ({ ...s })),
    bonds: unit.bonds.slice(),
    skills: unit.skills.slice(),
  };
}

/** 战报/UI 用的精简快照。 */
export function unitSnapshot(unit) {
  return {
    uid: unit.uid,
    name: unit.name,
    side: unit.side,
    slot: unit.slot,
    element: unit.element,
    type: unit.type,
    quality: unit.quality,
    level: unit.level,
    atk: unit.atk,
    hp: Math.max(0, Math.round(unit.hp)),
    maxHp: unit.maxHp,
    speed: unit.speed,
    alive: unit.alive,
    isBoss: unit.isBoss,
  };
}
