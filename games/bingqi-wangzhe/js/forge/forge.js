/**
 * 锻造系统 — 契约实现。
 *
 *   previewForge(state, opts)
 *   forgeWeapon(state, opts, rng)
 *   enhanceWeapon(state, weaponId)
 *   dismantleWeapon(state, weaponId)
 *   collectIdle(state, nowMs)
 *
 * 约束：
 *  - 逻辑层，禁止 window / document / Math.random；随机一律由调用方注入 rng。
 *  - 只 import 同层与 data/，不 import core/（Round 1 期间 core 可能尚未落地）。
 *    对 state 的读写全部走本文件的防御性访问器，兼容 core/state.js 的最低字段集。
 *  - 所有失败都返回 { ok:false, reason }，reason 码在 data/strings.js 里有中文翻译。
 */

import {
  QUALITIES,
  QUALITY_RANK,
  ELEMENTS,
  ELEMENT_BIAS,
  ELEMENT_CRYSTAL,
  FORGE_STAGES,
  FORGE_COST,
  ELEMENT_BIAS_COST,
  ELEMENT_BIAS_WEIGHT,
  LUCKY_CHARM_COST,
  QUALITY_WEIGHTS,
  LUCKY_CHARM_MULTIPLIER,
  MASTER_FORGE_MULTIPLIER,
  MASTER_FORGE,
  FORGE_PITY,
  FORGE_PITY_BY_STAGE,
  QUALITY_STAT_MULTIPLIER,
  ENHANCE_COST,
  DISMANTLE,
  BAG,
} from '../data/balance.js';
import { WEAPONS, WEAPON_BY_ID } from '../data/weapons.js';
import {
  HAMMER_LINES,
  HAMMER_HINT_BY_QUALITY,
  FORGE_RESULT_LINE,
  QUALITY_NAME,
  FORGE_STAGE_NAME,
} from '../data/strings.js';
import { createRngAdapter } from './rng.js';
import { rollAffixes, affixCountFor } from './affix.js';
import { computeWeaponStats, levelCapFor, skillSlotsFor } from './stats.js';
import { previewIdle, idleRatesFor, regenStamina, lastCollectAtOf } from './idle.js';

const DAY_MS = 86400000;
const LEGENDARY_RANK = QUALITY_RANK.legendary;
const EPIC_RANK = QUALITY_RANK.epic;

const fail = (reason, extra) => ({ ok: false, reason, ...(extra || {}) });

/* ------------------------------------------------------------------ *
 * 防御性 state 访问
 * ------------------------------------------------------------------ */

function ensureForgeState(state) {
  if (!state || typeof state !== 'object') return null;
  if (!state.resources || typeof state.resources !== 'object') state.resources = {};
  if (!Array.isArray(state.weapons)) state.weapons = [];
  if (!Array.isArray(state.lineup)) state.lineup = [];
  if (!state.idle || typeof state.idle !== 'object') state.idle = {};
  if (!state.flags || typeof state.flags !== 'object') state.flags = {};
  if (!state.codex || typeof state.codex !== 'object') state.codex = { discovered: {} };
  if (!Array.isArray(state.codex) && (!state.codex.discovered || typeof state.codex.discovered !== 'object')) {
    state.codex.discovered = {};
  }

  const hadForge = Boolean(state.forge) && typeof state.forge === 'object';
  if (!hadForge) state.forge = {};
  const f = state.forge;
  // core/state.js 的 serialize() 白名单里还没有 forge 段，重新载入存档时它是空的。
  // 保底计数一旦每次开局清零，8 锤保底就形同虚设，所以这里从 flags 里的镜像还原。
  if (!hadForge) restoreForgeSnapshot(state, f);
  if (!f.pity || typeof f.pity !== 'object') f.pity = {};
  for (const stage of FORGE_STAGES) {
    if (!f.pity[stage] || typeof f.pity[stage] !== 'object') f.pity[stage] = { epic: 0, legendary: 0 };
    if (typeof f.pity[stage].epic !== 'number') f.pity[stage].epic = 0;
    if (typeof f.pity[stage].legendary !== 'number') f.pity[stage].legendary = 0;
  }
  if (!f.masterForge || typeof f.masterForge !== 'object') f.masterForge = { dayKey: -1, used: 0 };
  if (typeof f.totalForged !== 'number' || !Number.isFinite(f.totalForged)) f.totalForged = 0;
  if (typeof f.serial !== 'number') f.serial = deriveSerial(state);

  // 首锻保底只认「这个账号是否成功开过炉」。老存档没有该字段，
  // 用已有的证据（core 的 flags.firstForgeDone / 累计锻造数 / 背包）反推，
  // 免得一个 Round 1 的存档在 Round 2 白拿一次保底。
  if (typeof f.firstForgeDone !== 'boolean') {
    f.firstForgeDone = Boolean(
      state.flags?.firstForgeDone || f.totalForged > 0 || state.weapons.length > 0,
    );
  }
  return state;
}

/**
 * 把锻造存档段镜像进 `state.flags`（core 的 serialize 会原样克隆 flags），
 * 等 core 把 `forge` 加进白名单后，这层镜像可以直接删掉。
 */
const FORGE_SNAPSHOT_KEY = 'forgeSnapshot';

function writeForgeSnapshot(state) {
  if (!state.flags || typeof state.flags !== 'object') return;
  const f = state.forge;
  state.flags[FORGE_SNAPSHOT_KEY] = {
    pity: JSON.parse(JSON.stringify(f.pity)),
    masterForge: { ...f.masterForge },
    totalForged: f.totalForged,
    serial: f.serial,
    firstForgeDone: f.firstForgeDone,
  };
}

function restoreForgeSnapshot(state, target) {
  const snap = state.flags?.[FORGE_SNAPSHOT_KEY];
  if (!snap || typeof snap !== 'object') return;
  if (snap.pity && typeof snap.pity === 'object') target.pity = JSON.parse(JSON.stringify(snap.pity));
  if (snap.masterForge && typeof snap.masterForge === 'object') target.masterForge = { ...snap.masterForge };
  if (typeof snap.totalForged === 'number') target.totalForged = snap.totalForged;
  if (typeof snap.serial === 'number') target.serial = snap.serial;
  if (typeof snap.firstForgeDone === 'boolean') target.firstForgeDone = snap.firstForgeDone;
}

function deriveSerial(state) {
  let max = 0;
  for (const w of state.weapons) {
    const m = /^w(\d+)/.exec(String(w?.uid ?? ''));
    if (m) max = Math.max(max, Number(m[1]));
  }
  return Math.max(max, state.weapons.length);
}

function readRes(state, id) {
  const v = Number(state.resources?.[id]);
  return Number.isFinite(v) ? v : 0;
}

function missingFor(state, cost) {
  const missing = {};
  for (const [id, need] of Object.entries(cost)) {
    const have = readRes(state, id);
    if (have < need) missing[id] = need - have;
  }
  return missing;
}

function payCost(state, cost) {
  for (const [id, need] of Object.entries(cost)) {
    state.resources[id] = readRes(state, id) - need;
  }
}

function grant(state, gains) {
  for (const [id, n] of Object.entries(gains)) {
    if (!n) continue;
    state.resources[id] = readRes(state, id) + n;
  }
}

function bagCapacity(state) {
  const raw = Number(state.flags?.bagSlots);
  const n = Number.isFinite(raw) && raw > 0 ? raw : BAG.baseSlots;
  return Math.min(BAG.maxSlots, n);
}

function dayKeyOf(nowMs) {
  return Math.floor((Number(nowMs) || 0) / DAY_MS);
}

function nowOf(opts) {
  const n = Number(opts?.now);
  return Number.isFinite(n) ? n : Date.now();
}

function pushLog(state, line) {
  if (Array.isArray(state.log)) {
    state.log.push(line);
    if (state.log.length > 200) state.log.splice(0, state.log.length - 200);
  }
}

function markCodex(state, protoId, quality) {
  const codex = state.codex;
  if (Array.isArray(codex)) {
    const isNew = !codex.includes(protoId);
    if (isNew) codex.push(protoId);
    return isNew;
  }
  const entry = codex.discovered[protoId];
  if (!entry) {
    codex.discovered[protoId] = { firstQuality: quality, bestQuality: quality, count: 1 };
    return true;
  }
  entry.count = (entry.count || 0) + 1;
  if ((QUALITY_RANK[quality] ?? 0) > (QUALITY_RANK[entry.bestQuality] ?? -1)) {
    entry.bestQuality = quality;
  }
  return false;
}

function isInLineup(state, uid) {
  return state.lineup.some((slot) => slot === uid || slot?.uid === uid);
}

/* ------------------------------------------------------------------ *
 * 消耗与权重
 * ------------------------------------------------------------------ */

export function normalizeOpts(opts) {
  const o = opts && typeof opts === 'object' ? opts : {};
  const stage = FORGE_STAGES.includes(o.stage) ? o.stage : 'iron';
  const elementBias = ELEMENTS.includes(o.elementBias) ? o.elementBias : null;
  return {
    stage,
    elementBias,
    useLucky: Boolean(o.useLucky),
    useMasterForge: Boolean(o.useMasterForge),
    now: o.now,
  };
}

/** 本次开炉的全部消耗（含元素偏向与幸运符）。 */
export function computeForgeCost(opts) {
  const o = normalizeOpts(opts);
  const cost = { ...FORGE_COST[o.stage] };
  if (o.elementBias) {
    const crystal = ELEMENT_CRYSTAL[o.elementBias];
    cost[crystal] = (cost[crystal] ?? 0) + ELEMENT_BIAS_COST[o.stage];
  }
  if (o.useLucky) {
    for (const [id, n] of Object.entries(LUCKY_CHARM_COST)) cost[id] = (cost[id] ?? 0) + n;
  }
  if (o.useMasterForge) {
    for (const [id, n] of Object.entries(MASTER_FORGE.extraCost)) cost[id] = (cost[id] ?? 0) + n;
  }
  return cost;
}

/** 应用幸运符 / 大师熔炉修正后的品质权重（未归一化）。 */
export function computeQualityWeights(opts) {
  const o = normalizeOpts(opts);
  const base = QUALITY_WEIGHTS[o.stage];
  const out = {};
  for (const q of QUALITIES) {
    let w = base[q] ?? 0;
    if (o.useLucky) w *= LUCKY_CHARM_MULTIPLIER[q] ?? 1;
    if (o.useMasterForge) w *= MASTER_FORGE_MULTIPLIER[q] ?? 1;
    out[q] = w;
  }
  return out;
}

export function normalizeWeights(weights) {
  let total = 0;
  for (const q of QUALITIES) total += Math.max(0, weights[q] ?? 0);
  const out = {};
  for (const q of QUALITIES) out[q] = total > 0 ? Math.max(0, weights[q] ?? 0) / total : 0;
  return out;
}

/**
 * 某炉某品质下可以锻出的原型。
 *
 * 规则：
 *  - 原型自带 [minQuality, maxQuality] 区间，品质必须落在区间内；
 *  - 本炉阶级 >= 原型阶级时随时可出；
 *  - 本炉阶级低于原型阶级时，只有传说及以上品质才会「超规格」现身
 *    —— 这就是精铁炉偶尔翻出神兵的来路。
 */
export function eligibleProtos(stage, quality) {
  const qRank = QUALITY_RANK[quality] ?? 0;
  const stageRank = FORGE_STAGES.indexOf(stage);
  return WEAPONS.filter((w) => {
    const min = QUALITY_RANK[w.minQuality] ?? 0;
    const max = QUALITY_RANK[w.maxQuality] ?? QUALITY_RANK.mythic;
    if (qRank < min || qRank > max) return false;
    const protoRank = FORGE_STAGES.indexOf(w.forgeStage);
    if (protoRank <= stageRank) return true;
    return qRank >= LEGENDARY_RANK;
  });
}

function pityStateFor(state, stage) {
  return state.forge.pity[stage];
}

/** 该炉的保底阈值；null 表示这一档不设保底（精铁炉两档皆无）。 */
export function pityThresholdsFor(stage) {
  return FORGE_PITY_BY_STAGE[stage] ?? { epic: null, legendary: null };
}

/** 返回本次开炉的连抽保底下限品质（null 表示无保底）。 */
export function pityFloorFor(state, stage) {
  const p = pityStateFor(state, stage);
  const th = pityThresholdsFor(stage);
  if (th.legendary && p.legendary + 1 >= th.legendary) return 'legendary';
  if (th.epic && p.epic + 1 >= th.epic) return 'epic';
  return null;
}

/** 账号首锻保底：还没成功开过炉时，本次至少出 FORGE_PITY.firstForgeMinQuality。 */
export function isFirstForge(state) {
  return !state?.forge?.firstForgeDone;
}

export function firstForgeFloorFor(state) {
  return isFirstForge(state) ? FORGE_PITY.firstForgeMinQuality ?? null : null;
}

/** 取两个下限里更高的那个。 */
export function highestFloor(a, b) {
  if (!a) return b ?? null;
  if (!b) return a ?? null;
  return (QUALITY_RANK[a] ?? 0) >= (QUALITY_RANK[b] ?? 0) ? a : b;
}

/** 本次开炉真正生效的品质下限：连抽保底与首锻保底取高。 */
export function forgeFloorFor(state, stage) {
  return highestFloor(pityFloorFor(state, stage), firstForgeFloorFor(state));
}

function applyQualityFloor(weights, floorQuality) {
  if (!floorQuality) return weights;
  const floor = QUALITY_RANK[floorQuality] ?? 0;
  const out = {};
  let any = 0;
  for (const q of QUALITIES) {
    const keep = (QUALITY_RANK[q] ?? 0) >= floor;
    out[q] = keep ? weights[q] ?? 0 : 0;
    any += out[q];
  }
  if (any <= 0) out[floorQuality] = 1;
  return out;
}

function masterForgeStatus(state, nowMs) {
  const mf = state.forge.masterForge;
  const today = dayKeyOf(nowMs);
  const used = mf.dayKey === today ? mf.used : 0;
  return {
    dayKey: today,
    used,
    remaining: Math.max(0, MASTER_FORGE.dailyUses - used),
    available: used < MASTER_FORGE.dailyUses,
    resetAt: (today + 1) * DAY_MS,
  };
}

function consumeMasterForge(state, nowMs) {
  const mf = state.forge.masterForge;
  const today = dayKeyOf(nowMs);
  if (mf.dayKey !== today) {
    mf.dayKey = today;
    mf.used = 0;
  }
  mf.used += 1;
}

/* ------------------------------------------------------------------ *
 * previewForge
 * ------------------------------------------------------------------ */

/**
 * 开炉前瞻：不修改 state，不需要 rng。
 */
export function previewForge(state, opts) {
  const s = ensureForgeState(state);
  if (!s) return fail('invalid_state');

  const raw = opts && typeof opts === 'object' ? opts : {};
  if (raw.stage != null && !FORGE_STAGES.includes(raw.stage)) return fail('invalid_stage');
  if (raw.elementBias != null && !ELEMENTS.includes(raw.elementBias)) return fail('invalid_element');

  const o = normalizeOpts(raw);
  const now = nowOf(o);
  const mf = masterForgeStatus(s, now);
  const effective = { ...o, useMasterForge: o.useMasterForge && mf.available };

  const cost = computeForgeCost(effective);
  const missing = missingFor(s, cost);
  const canAfford = Object.keys(missing).length === 0;

  const pityFloor = pityFloorFor(s, o.stage);
  const firstFloor = firstForgeFloorFor(s);
  const floor = highestFloor(pityFloor, firstFloor);
  const weights = applyQualityFloor(computeQualityWeights(effective), floor);
  const chances = normalizeWeights(weights);

  const qualityChances = QUALITIES.map((q) => ({
    quality: q,
    label: QUALITY_NAME[q],
    weight: Math.round((weights[q] ?? 0) * 1000) / 1000,
    chance: Math.round(chances[q] * 100000) / 100000,
    poolSize: eligibleProtos(o.stage, q).length,
  }));

  const pity = pityStateFor(s, o.stage);
  const thresholds = pityThresholdsFor(o.stage);
  const expectedAtk = QUALITIES.reduce((sum, q) => {
    const pool = eligibleProtos(o.stage, q);
    if (pool.length === 0) return sum;
    const avgBase = pool.reduce((a, w) => a + w.baseAtk, 0) / pool.length;
    return sum + chances[q] * avgBase * QUALITY_STAT_MULTIPLIER[q];
  }, 0);

  return {
    ok: true,
    stage: o.stage,
    stageName: FORGE_STAGE_NAME[o.stage],
    elementBias: o.elementBias,
    cost,
    canAfford,
    missing,
    qualityChances,
    lucky: {
      requested: o.useLucky,
      applied: effective.useLucky,
      owned: readRes(s, 'luckyCharm'),
    },
    masterForge: {
      requested: o.useMasterForge,
      applied: effective.useMasterForge,
      ...mf,
    },
    /** UI 侧的扁平别名，等价于 masterForge.available。 */
    masterForgeReady: mf.available,
    pity: {
      epic: pity.epic,
      legendary: pity.legendary,
      epicThreshold: thresholds.epic,
      legendaryThreshold: thresholds.legendary,
      remainingToEpic: thresholds.epic ? Math.max(0, thresholds.epic - pity.epic) : null,
      floorThisForge: floor,
      pityFloor,
      firstForgeFloor: firstFloor,
      isFirstForge: isFirstForge(s),
      guaranteed: Boolean(floor),
    },
    bag: { used: s.weapons.length, capacity: bagCapacity(s) },
    expectedAtk: Math.round(expectedAtk),
    affixCountByQuality: QUALITIES.reduce((acc, q) => {
      acc[q] = affixCountFor(q);
      return acc;
    }, {}),
  };
}

/* ------------------------------------------------------------------ *
 * forgeWeapon
 * ------------------------------------------------------------------ */

function buildRevealSteps(quality) {
  return HAMMER_LINES.map((line) =>
    line.step < 3
      ? { step: line.step, text: line.text, reveals: false }
      : { step: line.step, text: `${line.text}${HAMMER_HINT_BY_QUALITY[quality]}`, reveals: true, quality },
  );
}

function makeUid(state, rngA) {
  state.forge.serial += 1;
  const salt = rngA.int(0, 1295).toString(36).padStart(2, '0');
  return `w${state.forge.serial}${salt}`;
}

/**
 * 开炉。
 * @param {object} state
 * @param {{stage?:string, elementBias?:string, useLucky?:boolean, useMasterForge?:boolean, now?:number}} opts
 * @param {object|function} rng  core/rng.js 的 createRng() 结果，或任意可产出 [0,1) 的源
 */
export function forgeWeapon(state, opts, rng) {
  const s = ensureForgeState(state);
  if (!s) return fail('invalid_state');

  const rngA = createRngAdapter(rng);
  if (!rngA) return fail('no_rng');

  const raw = opts && typeof opts === 'object' ? opts : {};
  if (raw.stage != null && !FORGE_STAGES.includes(raw.stage)) return fail('invalid_stage');
  if (raw.elementBias != null && !ELEMENTS.includes(raw.elementBias)) return fail('invalid_element');

  const o = normalizeOpts(raw);
  const now = nowOf(o);

  if (s.weapons.length >= bagCapacity(s)) return fail('bag_full');

  const mf = masterForgeStatus(s, now);
  if (o.useMasterForge && !mf.available) return fail('master_forge_exhausted');

  const cost = computeForgeCost(o);
  const missing = missingFor(s, cost);
  if (Object.keys(missing).length > 0) {
    return fail(o.useLucky && missing.luckyCharm ? 'no_lucky_charm' : 'insufficient_resources', { missing, cost });
  }

  payCost(s, cost);
  if (o.useMasterForge) consumeMasterForge(s, now);

  // 1) 品质：权重 → 保底下限（连抽保底 / 首锻保底取高）→ 加权抽取
  const pityFloor = pityFloorFor(s, o.stage);
  const firstFloor = firstForgeFloorFor(s);
  const floor = highestFloor(pityFloor, firstFloor);
  const weights = applyQualityFloor(computeQualityWeights(o), floor);
  let quality = rngA.weightedKey(weights) ?? 'common';

  // 保底是硬承诺：即便权重表被改坏也不许击穿。
  if (floor && (QUALITY_RANK[quality] ?? 0) < (QUALITY_RANK[floor] ?? 0)) quality = floor;

  // 2) 原型：按品质筛出可锻池；池空则逐级降档（防御，正常配置下不会触发）
  let pool = eligibleProtos(o.stage, quality);
  while (pool.length === 0 && (QUALITY_RANK[quality] ?? 0) > 0) {
    quality = QUALITIES[(QUALITY_RANK[quality] ?? 0) - 1];
    pool = eligibleProtos(o.stage, quality);
  }
  if (pool.length === 0) {
    quality = 'common';
    pool = WEAPONS.filter((w) => w.forgeStage === o.stage);
  }

  // 3) 元素偏向：付了三相晶就保证主元素；该品质下没有对应元素原型时才退回加权。
  let biasApplied = false;
  if (o.elementBias) {
    const biased = pool.filter((w) => w.element === o.elementBias);
    if (biased.length > 0 && ELEMENT_BIAS.guarantee) {
      pool = biased;
      biasApplied = true;
    }
  }

  const proto = rngA.weightedPick(pool, (w) =>
    o.elementBias && !biasApplied && w.element === o.elementBias ? ELEMENT_BIAS_WEIGHT : 1,
  );
  if (!proto) return fail('invalid_state');

  // 4) 词条
  const affixes = rollAffixes(proto, quality, rngA);

  const weapon = {
    uid: makeUid(s, rngA),
    protoId: proto.id,
    quality,
    level: 1,
    affixes,
    obtainedAt: now,
    // 附加字段：不参与契约，但存档友好
    forgedStage: o.stage,
    locked: QUALITY_RANK[quality] >= LEGENDARY_RANK,
    skillSlots: skillSlotsFor(1),
  };

  s.weapons.push(weapon);
  const isNewProto = markCodex(s, proto.id, quality);
  s.forge.totalForged += 1;

  const wasFirstForge = isFirstForge(s);
  s.forge.firstForgeDone = true;
  if (s.flags && typeof s.flags === 'object') s.flags.firstForgeDone = true;

  // 5) 保底计数（出史诗+即清零）
  const pity = pityStateFor(s, o.stage);
  const qRank = QUALITY_RANK[quality] ?? 0;
  pity.epic = qRank >= EPIC_RANK ? 0 : pity.epic + 1;
  pity.legendary = qRank >= LEGENDARY_RANK ? 0 : pity.legendary + 1;
  writeForgeSnapshot(s);

  const line = `${FORGE_STAGE_NAME[o.stage]}开炉，得【${QUALITY_NAME[quality]}·${proto.name}】。`;
  pushLog(s, line);

  return {
    ok: true,
    weapon,
    quality,
    proto,
    stats: computeWeaponStats(weapon),
    cost,
    isNewProto,
    usedMasterForge: o.useMasterForge,
    usedLucky: o.useLucky,
    elementBiasApplied: biasApplied,
    firstForge: wasFirstForge,
    floorApplied: floor,
    pityFloorApplied: pityFloor,
    firstForgeFloorApplied: firstFloor,
    pityAfter: { epic: pity.epic, legendary: pity.legendary },
    reveal: buildRevealSteps(quality),
    resultLine: FORGE_RESULT_LINE[quality],
    logLine: line,
  };
}

/* ------------------------------------------------------------------ *
 * enhanceWeapon
 * ------------------------------------------------------------------ */

export function findWeapon(state, weaponId) {
  if (!Array.isArray(state?.weapons)) return null;
  return state.weapons.find((w) => w?.uid === weaponId) ?? null;
}

/** 从 level 升到 level+1 的消耗。 */
export function enhanceCostFor(weapon) {
  const proto = WEAPON_BY_ID[weapon?.protoId];
  if (!proto) return null;
  const next = Math.max(1, Math.floor(Number(weapon.level) || 1)) + 1;
  const qMul = ENHANCE_COST.qualityMultiplier[weapon.quality] ?? 1;
  const cost = {
    coin: Math.round(ENHANCE_COST.coinBase * next ** ENHANCE_COST.coinExponent * qMul),
  };
  const ore = ENHANCE_COST.oreByStage[proto.forgeStage] ?? 'iron';
  cost[ore] = (cost[ore] ?? 0) + Math.ceil(next / ENHANCE_COST.oreDivisor);
  if (next % ENHANCE_COST.diamondEveryLevels === 0) {
    cost.diamond = (cost.diamond ?? 0) + ENHANCE_COST.diamondPerBreak;
  }
  return cost;
}

/**
 * 强化 1 级。每 3 级解锁 1 个技能槽（最多 3）。
 */
export function enhanceWeapon(state, weaponId) {
  const s = ensureForgeState(state);
  if (!s) return fail('invalid_state');

  const weapon = findWeapon(s, weaponId);
  if (!weapon) return fail('invalid_weapon');

  const proto = WEAPON_BY_ID[weapon.protoId];
  if (!proto) return fail('invalid_weapon');

  const from = Math.max(1, Math.floor(Number(weapon.level) || 1));
  const cap = levelCapFor(weapon.quality);
  if (from >= cap) return fail('level_capped', { level: from, levelCap: cap });

  const cost = enhanceCostFor(weapon);
  const missing = missingFor(s, cost);
  if (Object.keys(missing).length > 0) return fail('insufficient_resources', { missing, cost });

  payCost(s, cost);
  weapon.level = from + 1;

  const slotsBefore = skillSlotsFor(from);
  const slotsAfter = skillSlotsFor(weapon.level);
  weapon.skillSlots = slotsAfter;

  const line = `【${proto.name}】强化至 ${weapon.level} 级。`;
  pushLog(s, line);

  return {
    ok: true,
    weapon,
    proto,
    cost,
    levelFrom: from,
    levelTo: weapon.level,
    levelCap: cap,
    unlockedSlot: slotsAfter > slotsBefore ? slotsAfter : 0,
    skillSlots: slotsAfter,
    stats: computeWeaponStats(weapon),
    nextCost: weapon.level < cap ? enhanceCostFor(weapon) : null,
    logLine: line,
  };
}

/* ------------------------------------------------------------------ *
 * dismantleWeapon
 * ------------------------------------------------------------------ */

/**
 * 分解返还：60% 锻造矿物 + 45% 强化投入 + 同品质碎片。
 * 铜钱一分不退（DISMANTLE.refundExclude）—— 这是经济表里主要的反通胀沉没口。
 */
export function dismantleRefundFor(weapon) {
  const proto = WEAPON_BY_ID[weapon?.protoId];
  if (!proto) return null;
  const excluded = new Set(DISMANTLE.refundExclude ?? []);
  const refund = {};

  const base = FORGE_COST[weapon.forgedStage] ?? FORGE_COST[proto.forgeStage] ?? FORGE_COST.iron;
  for (const [id, n] of Object.entries(base)) {
    if (excluded.has(id)) continue;
    refund[id] = (refund[id] ?? 0) + Math.floor(n * DISMANTLE.refundRatio);
  }

  const level = Math.max(1, Math.floor(Number(weapon.level) || 1));
  if (level > 1) {
    const probe = { protoId: weapon.protoId, quality: weapon.quality, level: 1 };
    for (let l = 1; l < level; l += 1) {
      probe.level = l;
      const step = enhanceCostFor(probe);
      if (!step) break;
      for (const [id, n] of Object.entries(step)) {
        if (excluded.has(id)) continue;
        refund[id] = (refund[id] ?? 0) + Math.floor(n * DISMANTLE.enhanceRefundRatio);
      }
    }
  }

  const bonus = DISMANTLE.qualityBonus[weapon.quality] ?? {};
  for (const [id, n] of Object.entries(bonus)) {
    if (!n) continue;
    refund[id] = (refund[id] ?? 0) + n;
  }

  for (const id of Object.keys(refund)) {
    if (refund[id] <= 0) delete refund[id];
  }
  return refund;
}

/** 传说及以上开炉即自动上锁，需要玩家显式解锁后才能分解。 */
export function setWeaponLock(state, weaponId, locked) {
  const s = ensureForgeState(state);
  if (!s) return fail('invalid_state');
  const weapon = findWeapon(s, weaponId);
  if (!weapon) return fail('invalid_weapon');
  weapon.locked = Boolean(locked);
  return { ok: true, weapon, locked: weapon.locked };
}

export function dismantleWeapon(state, weaponId) {
  const s = ensureForgeState(state);
  if (!s) return fail('invalid_state');

  const idx = s.weapons.findIndex((w) => w?.uid === weaponId);
  if (idx < 0) return fail('invalid_weapon');

  const weapon = s.weapons[idx];
  if (weapon.locked) return fail('weapon_locked', { weapon });
  if (isInLineup(s, weapon.uid)) return fail('weapon_in_lineup', { weapon });

  const proto = WEAPON_BY_ID[weapon.protoId];
  const refund = dismantleRefundFor(weapon) ?? {};
  grant(s, refund);
  s.weapons.splice(idx, 1);

  const refundText = Object.entries(refund)
    .map(([id, n]) => `${id}×${n}`)
    .join('、');
  const line = `分解【${proto?.name ?? weapon.protoId}】，回收 ${refundText || '无'}。`;
  pushLog(s, line);

  return { ok: true, removed: weapon, proto, refund, logLine: line };
}

/* ------------------------------------------------------------------ *
 * collectIdle
 * ------------------------------------------------------------------ */

/**
 * 收取挂机产出。离线最多结算 8 小时；不足 1 分钟不结算。
 * 体力回复由 core 的 tickIdle 负责；若 core 未处理，可显式传 opts.stamina = true。
 */
export function collectIdle(state, nowMs, opts) {
  const s = ensureForgeState(state);
  if (!s) return fail('invalid_state');

  const now = Number.isFinite(Number(nowMs)) ? Number(nowMs) : Date.now();
  const preview = previewIdle(s, now);

  let stamina = null;
  if (opts?.stamina === true) stamina = regenStamina(s, now);

  if (!preview.ready) {
    return {
      ok: false,
      reason: 'nothing_to_collect',
      elapsedMs: preview.rawMs,
      cappedMs: preview.cappedMs,
      rates: preview.rates,
      gains: {},
      stamina,
      nextReadyAt: lastCollectAtOf(s, now) + preview.minCollectMs,
    };
  }

  grant(s, preview.gains);
  s.idle.lastCollectAt = now;
  s.idle.lastAt = now;
  s.idle.totalCollected = (Number(s.idle.totalCollected) || 0) + 1;

  const gainText = Object.entries(preview.gains)
    .map(([id, n]) => `${id}×${n}`)
    .join('、');
  const line = `收取挂机产出：${gainText}。`;
  pushLog(s, line);

  return {
    ok: true,
    gains: preview.gains,
    rates: preview.rates,
    elapsedMs: preview.rawMs,
    cappedMs: preview.cappedMs,
    capped: preview.capped,
    minutes: preview.minutes,
    cleared: preview.cleared,
    codexBonus: preview.codexBonus,
    collectedAt: now,
    stamina,
    logLine: line,
  };
}

/* ------------------------------------------------------------------ *
 * 便捷再导出（战斗层 / UI 层共用）
 * ------------------------------------------------------------------ */

export {
  computeWeaponStats,
  levelCapFor,
  skillSlotsFor,
  previewIdle,
  idleRatesFor,
  regenStamina,
  createRngAdapter,
  rollAffixes,
};

export default {
  previewForge,
  forgeWeapon,
  enhanceWeapon,
  dismantleWeapon,
  collectIdle,
};
