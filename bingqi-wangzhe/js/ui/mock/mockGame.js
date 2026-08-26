/**
 * mockGame —— UI 的本地兜底实现。
 *
 * 存在意义：`js/core|forge|combat|data` 由其他代理负责，在它们落地之前，
 * 界面必须能被独立开发、演示与验收。因此本文件用最小可信的逻辑复刻 GDD 的
 * 关键规则（品质权重、元素克制、体力回复、挂机结算、ELO-lite 竞技）。
 *
 * ⚠ 它不是最终逻辑层：一旦真实模块注入（见 gameAdapter.js），
 *   相同名字的能力会被逐项替换，mock 只补齐缺失的部分。
 *
 * 存档键刻意与逻辑层的 `bqwz.save.v1` 区分，避免污染真实存档。
 */

import {
  MOCK_WEAPONS,
  MOCK_WEAPON_BY_ID,
  MOCK_STAGES,
  MOCK_REGIONS,
  MOCK_SKILLS,
  MOCK_AFFIXES,
  MOCK_FOE_NAMES,
  MOCK_FOE_TITLES
} from './data.js';
import { QUALITY_ORDER, ELEMENT_BEATS, elementCN } from '../format.js';

const SAVE_KEY = 'bqwz.ui.mock.v1';
const STAMINA_CAP = 120;
const STAMINA_PERIOD_MS = 6 * 60 * 1000;
const IDLE_CAP_MS = 8 * 60 * 60 * 1000;
const LEVEL_CAP = 30;

/* ------------------------------------------------------------------ */
/* RNG：mulberry32（与 core/rng.js 同族算法，便于日后替换）              */
/* ------------------------------------------------------------------ */

function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function createRng(seed = 1) {
  const next = mulberry32(seed);
  const api = {
    next,
    nextFloat: next,
    int: (min, max) => min + Math.floor(next() * (max - min + 1)),
    pick: (arr) => arr[Math.floor(next() * arr.length)],
    chance: (p) => next() < p,
    weighted(pairs) {
      const total = pairs.reduce((s, [, w]) => s + w, 0);
      let r = next() * total;
      for (const [value, w] of pairs) {
        r -= w;
        if (r <= 0) return value;
      }
      return pairs[pairs.length - 1][0];
    }
  };
  return api;
}

/* ------------------------------------------------------------------ */
/* 配方与权重                                                          */
/* ------------------------------------------------------------------ */

export const FORGE_STAGES = [
  {
    id: 'iron',
    name: '精铁炉',
    hint: '寻常炉温，稳出凡兵',
    cost: { iron: 12, coin: 60 },
    unlockCleared: 0,
    odds: { common: 0.52, uncommon: 0.3, rare: 0.14, epic: 0.035, legendary: 0.005, mythic: 0 }
  },
  {
    id: 'silver',
    name: '白银炉',
    hint: '秘银引火，玄兵渐出',
    cost: { silverOre: 10, coin: 240 },
    unlockCleared: 6,
    odds: { common: 0.18, uncommon: 0.34, rare: 0.3, epic: 0.14, legendary: 0.035, mythic: 0.005 }
  },
  {
    id: 'gold',
    name: '黄金炉',
    hint: '赤金烈焰，可望神兵',
    cost: { goldOre: 8, coin: 900 },
    unlockCleared: 18,
    odds: { common: 0.04, uncommon: 0.16, rare: 0.3, epic: 0.32, legendary: 0.15, mythic: 0.03 }
  }
];

const STAGE_BY_ID = Object.fromEntries(FORGE_STAGES.map((s) => [s.id, s]));

const QUALITY_MULT = {
  common: 1,
  uncommon: 1.35,
  rare: 1.9,
  epic: 2.7,
  legendary: 3.9,
  mythic: 5.6
};

const AFFIX_COUNT = {
  common: [0, 0],
  uncommon: [1, 1],
  rare: [1, 2],
  epic: [2, 2],
  legendary: [2, 3],
  mythic: [3, 3]
};

const LINEUP_UNLOCK_AT = [0, 2, 6, 12, 22]; // 已通关关数解锁第 n 栏

/* ------------------------------------------------------------------ */
/* 初始状态                                                            */
/* ------------------------------------------------------------------ */

function makeWeaponInstance(proto, rng, level = 1) {
  const [lo, hi] = AFFIX_COUNT[proto.quality];
  const n = lo + Math.floor(rng.next() * (hi - lo + 1));
  const pool = [...MOCK_AFFIXES];
  const affixes = [];
  for (let i = 0; i < n && pool.length; i += 1) {
    const idx = Math.floor(rng.next() * pool.length);
    const a = pool.splice(idx, 1)[0];
    const tierBoost = QUALITY_ORDER.indexOf(proto.quality) / 5;
    const value = Math.round(a.min + (a.max - a.min) * (0.35 + 0.65 * rng.next()) * (0.7 + 0.5 * tierBoost));
    affixes.push({ id: a.id, name: a.name, value, unit: a.unit });
  }
  return {
    uid: `wi_${Math.floor(rng.next() * 1e9).toString(36)}_${Date.now().toString(36).slice(-4)}`,
    protoId: proto.id,
    quality: proto.quality,
    element: proto.element,
    level,
    affixes,
    createdAt: Date.now()
  };
}

function createInitialState(seed = 20260826) {
  const rng = createRng(seed);
  // 开局给一小撮兵器：既能立刻打过前几关，也让背包/图鉴不至于空到无从演示。
  const starters = [
    ['w_hanshuang_dao', 4],
    ['w_qingfeng_jian', 3],
    ['w_liefeng_gong', 2],
    ['w_tiegu_jian', 3]
  ].map(([id, lv]) => makeWeaponInstance(MOCK_WEAPON_BY_ID[id], rng, lv));
  // 另有三把曾经锻出后分解的，只留图鉴记录
  const remembered = ['w_qiaofu_fu', 'w_liuyun_shan', 'w_poyun_qiang'];
  return {
    version: 1,
    seed,
    rngCursor: 1,
    createdAt: Date.now(),
    resources: {
      coin: 1280,
      iron: 86,
      silverOre: 24,
      goldOre: 6,
      fireCrystal: 5,
      iceCrystal: 4,
      thunderCrystal: 3,
      luckyCharm: 2,
      stamina: 96,
      diamond: 30
    },
    staminaAt: Date.now(),
    weapons: starters,
    lineup: [starters[0].uid, starters[1].uid, null, null, null],
    campaign: { cleared: 3, stars: { stage_01: 3, stage_02: 3, stage_03: 2 } },
    arena: { rank: 18, points: 1000, ticketsLeft: 5, log: [] },
    codex: {
      ...Object.fromEntries(remembered.map((id) => [id, 1])),
      ...Object.fromEntries(starters.map((w) => [w.protoId, 1]))
    },
    flags: { masterForgeDay: null },
    idle: { lastCollectAt: Date.now() - 47 * 60 * 1000 }
  };
}

/**
 * 展示存档（`?demo=1`）。
 *
 * 纯 UI 阶段没有别的办法看到中后期界面——五栏满阵、传说/神话流光边、
 * 高炉阶概率条、竞技高位。因此保留一个可复现的展示档，兼作视觉走查基准。
 */
function createDemoState(seed = 20260826) {
  const s = createInitialState(seed);
  const rng = createRng(seed ^ 0x2545f491);

  s.campaign.cleared = 27;
  MOCK_STAGES.slice(0, 27).forEach((stage, i) => {
    s.campaign.stars[stage.id] = [3, 3, 2, 3, 2, 3][i % 6];
  });

  s.resources = {
    coin: 486320,
    iron: 2140,
    silverOre: 860,
    goldOre: 324,
    fireCrystal: 41,
    iceCrystal: 36,
    thunderCrystal: 28,
    luckyCharm: 12,
    stamina: 118,
    diamond: 1860
  };

  const roster = [
    ['w_chixiao', 14],
    ['w_jinwu_gong', 12],
    ['w_canyang_jiren', 11],
    ['w_suiyue_ji', 10],
    ['w_yuluo_di', 9],
    ['w_chengying_jian', 8],
    ['w_shuangyue_jiren', 7],
    ['w_kaishan_fu', 6],
    ['w_hanshuang_dao', 6],
    ['w_mingyu_san', 4],
    ['w_poyue_nu', 3],
    ['w_liuyun_shan', 2]
  ];
  s.weapons = roster.map(([id, lv]) => makeWeaponInstance(MOCK_WEAPON_BY_ID[id], rng, lv));
  s.lineup = s.weapons.slice(0, 5).map((w) => w.uid);

  s.codex = {};
  MOCK_WEAPONS.slice(0, 22).forEach((p) => {
    s.codex[p.id] = 1 + Math.floor(rng.next() * 4);
  });
  roster.forEach(([id]) => {
    s.codex[id] = (s.codex[id] || 0) + 1;
  });

  s.arena = {
    rank: 6,
    points: 1428,
    ticketsLeft: 4,
    log: [
      { at: Date.now() - 6 * 60000, foe: '雪衣侯', win: true, rankChange: 2 },
      { at: Date.now() - 42 * 60000, foe: '听雷者', win: true, rankChange: 0 },
      { at: Date.now() - 96 * 60000, foe: '铁面客', win: false, rankChange: 0 }
    ]
  };
  s.idle.lastCollectAt = Date.now() - 3.4 * 3600000;
  return s;
}

/* ------------------------------------------------------------------ */
/* 工厂                                                                */
/* ------------------------------------------------------------------ */

/**
 * @param {{seed?:number, fresh?:boolean, preset?:'demo'}} options
 */
export function createMockGame(options = {}) {
  const listeners = new Set();
  const build = () => (options.preset === 'demo'
    ? createDemoState(options.seed)
    : createInitialState(options.seed));
  let state = load() || build();
  let rng = createRng((state.seed ^ 0x9e3779b9) + state.rngCursor);

  function bumpRng() {
    state.rngCursor = (state.rngCursor + 1) % 1e9;
    rng = createRng((state.seed ^ 0x9e3779b9) + state.rngCursor * 2654435761);
  }

  function load() {
    if (options.fresh || options.preset) return null;
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed && parsed.version === 1 ? parsed : null;
    } catch {
      return null;
    }
  }

  function save() {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    } catch {
      /* 存储不可用时静默降级为内存态 */
    }
  }

  function emit(type, payload) {
    listeners.forEach((fn) => {
      try {
        fn(type, payload);
      } catch (err) {
        console.error('[mockGame] listener error', err);
      }
    });
  }

  function commit(type, payload) {
    save();
    emit(type, payload);
  }

  /* ---------------- 资源 ---------------- */

  function tickStamina(now = Date.now()) {
    const res = state.resources;
    if (res.stamina >= STAMINA_CAP) {
      state.staminaAt = now;
      return 0;
    }
    const elapsed = now - (state.staminaAt || now);
    const gained = Math.floor(elapsed / STAMINA_PERIOD_MS);
    if (gained <= 0) return 0;
    const applied = Math.min(gained, STAMINA_CAP - res.stamina);
    res.stamina += applied;
    state.staminaAt = (state.staminaAt || now) + gained * STAMINA_PERIOD_MS;
    return applied;
  }

  function staminaEtaSeconds(now = Date.now()) {
    if (state.resources.stamina >= STAMINA_CAP) return 0;
    const elapsed = (now - (state.staminaAt || now)) % STAMINA_PERIOD_MS;
    return Math.ceil((STAMINA_PERIOD_MS - elapsed) / 1000);
  }

  function canAfford(cost) {
    return Object.entries(cost).every(([k, v]) => (state.resources[k] || 0) >= v);
  }

  function spend(cost) {
    if (!canAfford(cost)) return false;
    Object.entries(cost).forEach(([k, v]) => {
      state.resources[k] -= v;
    });
    return true;
  }

  function grant(loot) {
    Object.entries(loot).forEach(([k, v]) => {
      if (!v) return;
      const cap = k === 'stamina' ? STAMINA_CAP : Infinity;
      state.resources[k] = Math.min(cap, (state.resources[k] || 0) + v);
    });
  }

  /* ---------------- 兵器读数 ---------------- */

  function affixValue(weapon, affixId) {
    return weapon.affixes?.find((a) => a.id === affixId)?.value || 0;
  }

  function weaponStats(w) {
    const proto = MOCK_WEAPON_BY_ID[w.protoId];
    if (!proto) return { atk: 0, hp: 0, speed: 0, crit: 0 };
    const g = 1 + 0.12 * (w.level - 1);
    return {
      atk: Math.round(proto.baseAtk * g),
      hp: Math.round(proto.baseHp * g),
      speed: proto.speed + affixValue(w, 'af_speed'),
      crit: 0.05 + affixValue(w, 'af_crit') / 100,
      lifesteal: affixValue(w, 'af_lifesteal') / 100,
      reduce: affixValue(w, 'af_reduce') / 100,
      elementDmg: affixValue(w, 'af_element') / 100,
      combo: affixValue(w, 'af_combo') / 100,
      reflect: affixValue(w, 'af_reflect') / 100
    };
  }

  /** 视图模型：把实例 + 原型合成 UI 直接可用的对象。 */
  function viewWeapon(w) {
    const proto = MOCK_WEAPON_BY_ID[w.protoId] || {};
    const s = weaponStats(w);
    return {
      ...w,
      name: proto.name,
      title: proto.title,
      type: proto.type,
      lore: proto.lore,
      tags: proto.tags || [],
      skill: MOCK_SKILLS[proto.skillId] || MOCK_SKILLS.sk_basic,
      skillSlots: Math.min(3, Math.floor((w.level - 1) / 3)),
      stats: s,
      power: weaponPower(w),
      equippedSlot: state.lineup.indexOf(w.uid)
    };
  }

  function weaponPower(w) {
    const s = weaponStats(w);
    return Math.round(s.atk * (1 + s.crit * 0.5) * (1 + s.elementDmg) + s.hp * 0.15);
  }

  function collectionBonus() {
    const found = Object.keys(state.codex).length;
    return Math.min(0.15, (found / MOCK_WEAPONS.length) * 0.15);
  }

  function bondsFor(uids) {
    const list = uids.filter(Boolean).map((uid) => state.weapons.find((w) => w.uid === uid)).filter(Boolean);
    const byType = {};
    const byElement = {};
    let mythic = 0;
    list.forEach((w) => {
      const proto = MOCK_WEAPON_BY_ID[w.protoId];
      if (!proto) return;
      byType[proto.type] = (byType[proto.type] || 0) + 1;
      byElement[proto.element] = (byElement[proto.element] || 0) + 1;
      if (proto.quality === 'mythic') mythic += 1;
    });
    const typeHit = Object.entries(byType).filter(([, n]) => n >= 2);
    const elHit = Object.entries(byElement).filter(([, n]) => n >= 3);
    return [
      {
        id: 'bond_type',
        name: '同源',
        desc: '同类型兵器 ≥2：全体攻击 +8%',
        active: typeHit.length > 0,
        detail: typeHit.map(([t, n]) => `${t}×${n}`).join(' / ') || '尚未成型',
        value: typeHit.length > 0 ? 0.08 : 0
      },
      {
        id: 'bond_element',
        name: '三相',
        desc: '同元素兵器 ≥3：元素伤害 +14%',
        active: elHit.length > 0,
        detail: elHit.map(([e, n]) => `${elementCN(e)}×${n}`).join(' / ') || '尚未成型',
        value: elHit.length > 0 ? 0.14 : 0
      },
      {
        id: 'bond_mythic',
        name: '兵魂',
        desc: '上阵神话兵器 ≥1：全体属性 +12%',
        active: mythic > 0,
        detail: mythic > 0 ? `神话×${mythic}` : '尚未成型',
        value: mythic > 0 ? 0.12 : 0
      },
      {
        id: 'bond_codex',
        name: '图鉴',
        desc: '图鉴收集度加成（最高 +15%）',
        active: collectionBonus() > 0,
        detail: `${Object.keys(state.codex).length}/${MOCK_WEAPONS.length}`,
        value: collectionBonus()
      }
    ];
  }

  function estimatePower(uids = state.lineup) {
    const list = uids.filter(Boolean)
      .map((uid) => state.weapons.find((w) => w.uid === uid))
      .filter(Boolean);
    if (!list.length) return 0;
    const base = list.reduce((sum, w) => sum + weaponPower(w), 0);
    const bonus = bondsFor(uids).reduce((s, b) => s + (b.active ? b.value : 0), 0);
    return Math.round(base * (1 + bonus));
  }

  /* ---------------- 锻造 ---------------- */

  function isMasterForgeReady() {
    const today = new Date().toISOString().slice(0, 10);
    return state.flags.masterForgeDay !== today;
  }

  function buildCost(opts) {
    const stage = STAGE_BY_ID[opts.stage] || FORGE_STAGES[0];
    const cost = { ...stage.cost };
    if (opts.elementBias) cost[`${opts.elementBias}Crystal`] = 1;
    if (opts.useLucky) cost.luckyCharm = 1;
    return cost;
  }

  function computeOdds(opts) {
    const stage = STAGE_BY_ID[opts.stage] || FORGE_STAGES[0];
    const odds = { ...stage.odds };
    const boost = (q, k) => {
      odds[q] = (odds[q] || 0) * k;
    };
    if (opts.useLucky) {
      boost('epic', 1.6);
      boost('legendary', 1.8);
      boost('mythic', 2);
      boost('common', 0.62);
    }
    if (opts.useMasterForge && isMasterForgeReady()) {
      boost('epic', 1.8);
      boost('legendary', 1.8);
      boost('mythic', 1.8);
      boost('common', 0.45);
      boost('uncommon', 0.75);
    }
    const total = Object.values(odds).reduce((s, v) => s + v, 0) || 1;
    QUALITY_ORDER.forEach((q) => {
      odds[q] = (odds[q] || 0) / total;
    });
    return odds;
  }

  function previewForge(opts) {
    const stage = STAGE_BY_ID[opts.stage] || FORGE_STAGES[0];
    const cost = buildCost(opts);
    const costs = Object.entries(cost).map(([id, need]) => ({
      id,
      need,
      have: state.resources[id] || 0,
      ok: (state.resources[id] || 0) >= need
    }));
    const locked = state.campaign.cleared < stage.unlockCleared;
    return {
      stage: stage.id,
      stageName: stage.name,
      hint: stage.hint,
      locked,
      lockHint: locked ? `通关第 ${stage.unlockCleared} 关后开启` : '',
      costs,
      odds: computeOdds(opts),
      masterForgeReady: isMasterForgeReady(),
      canForge: !locked && costs.every((c) => c.ok)
    };
  }

  function pickProto(quality, elementBias) {
    let pool = MOCK_WEAPONS.filter((w) => w.quality === quality);
    if (!pool.length) pool = MOCK_WEAPONS.filter((w) => w.quality === 'common');
    if (elementBias) {
      const biased = pool.filter((w) => w.element === elementBias);
      // 元素偏向不是硬保底：70% 命中所选元素
      if (biased.length && rng.chance(0.7)) pool = biased;
    }
    return pool[Math.floor(rng.next() * pool.length)];
  }

  function forgeWeapon(opts) {
    const preview = previewForge(opts);
    if (preview.locked) return { ok: false, error: preview.lockHint };
    if (!preview.canForge) return { ok: false, error: '材料不足' };
    if (!spend(buildCost(opts))) return { ok: false, error: '材料不足' };

    bumpRng();
    const quality = rng.weighted(QUALITY_ORDER.map((q) => [q, preview.odds[q] || 0]));
    const proto = pickProto(quality, opts.elementBias);
    const weapon = makeWeaponInstance(proto, rng);
    state.weapons.push(weapon);
    state.codex[proto.id] = (state.codex[proto.id] || 0) + 1;
    if (opts.useMasterForge && isMasterForgeReady()) {
      state.flags.masterForgeDay = new Date().toISOString().slice(0, 10);
    }
    const isNew = state.codex[proto.id] === 1;
    commit('forge', { weapon, isNew });
    return { ok: true, weapon: viewWeapon(weapon), isNew };
  }

  function enhanceCost(w) {
    const mult = QUALITY_MULT[w.quality] || 1;
    return {
      coin: Math.round(70 * Math.pow(w.level, 1.42) * mult),
      iron: Math.round(4 + w.level * 2.4 * mult)
    };
  }

  function enhanceWeapon(uid) {
    const w = state.weapons.find((x) => x.uid === uid);
    if (!w) return { ok: false, error: '兵器不存在' };
    if (w.level >= LEVEL_CAP) return { ok: false, error: '已至上限' };
    const cost = enhanceCost(w);
    if (!spend(cost)) return { ok: false, error: '铜钱或精铁不足' };
    w.level += 1;
    const unlockedSlot = (w.level - 1) % 3 === 0 && w.level > 1;
    commit('enhance', { uid, level: w.level });
    return { ok: true, weapon: viewWeapon(w), unlockedSlot, cost };
  }

  function dismantleWeapon(uid) {
    const idx = state.weapons.findIndex((x) => x.uid === uid);
    if (idx < 0) return { ok: false, error: '兵器不存在' };
    const w = state.weapons[idx];
    if (state.lineup.includes(uid)) return { ok: false, error: '上阵中的兵器无法分解' };
    if (state.weapons.length <= 1) return { ok: false, error: '至少保留一把兵器' };
    const mult = QUALITY_MULT[w.quality] || 1;
    const refund = {
      coin: Math.round(120 * mult * (1 + (w.level - 1) * 0.3) * 0.6),
      iron: Math.round(10 * mult * 0.6),
      luckyCharm: w.quality === 'legendary' || w.quality === 'mythic' ? 1 : 0
    };
    state.weapons.splice(idx, 1);
    grant(refund);
    commit('dismantle', { uid, refund });
    return { ok: true, refund };
  }

  /* ---------------- 挂机 ---------------- */

  function idleRates() {
    const c = Math.max(1, state.campaign.cleared);
    return {
      coin: 0.9 * Math.pow(1.11, c),
      iron: 0.22 * Math.pow(1.07, c),
      silverOre: c >= 9 ? 0.05 * Math.pow(1.05, c - 8) : 0,
      goldOre: c >= 21 ? 0.02 * Math.pow(1.04, c - 20) : 0
    };
  }

  function peekIdle(now = Date.now()) {
    const elapsed = Math.min(IDLE_CAP_MS, now - (state.idle.lastCollectAt || now));
    const hours = elapsed / 3600000;
    const rates = idleRates();
    const loot = {};
    Object.entries(rates).forEach(([k, perMin]) => {
      const v = Math.floor(perMin * hours * 60);
      if (v > 0) loot[k] = v;
    });
    return {
      loot,
      seconds: Math.floor(elapsed / 1000),
      capped: elapsed >= IDLE_CAP_MS,
      empty: Object.keys(loot).length === 0
    };
  }

  function collectIdle(now = Date.now()) {
    const peek = peekIdle(now);
    if (peek.empty) return { ok: false, error: '炉温尚温，暂无产出' };
    grant(peek.loot);
    state.idle.lastCollectAt = now;
    commit('idle', peek);
    return { ok: true, ...peek };
  }

  /* ---------------- 战斗 ---------------- */

  function elementMod(a, b) {
    if (a === b) return 1;
    return ELEMENT_BEATS[a] === b ? 1.35 : 0.75;
  }

  function makeUnits(uids) {
    return uids.filter(Boolean).map((uid) => {
      const w = state.weapons.find((x) => x.uid === uid);
      const proto = MOCK_WEAPON_BY_ID[w.protoId];
      const s = weaponStats(w);
      return {
        id: uid,
        name: proto.name,
        element: proto.element,
        atk: s.atk,
        hp: s.hp,
        maxHp: s.hp,
        speed: s.speed,
        crit: s.crit,
        lifesteal: s.lifesteal,
        reduce: s.reduce,
        side: 'ally'
      };
    });
  }

  function makeEnemyWave(stage, waveIndex, seedRng) {
    const count = waveIndex === stage.waves - 1 && stage.isElite ? 1 : Math.min(3, 1 + waveIndex);
    const isBoss = waveIndex === stage.waves - 1 && stage.isElite;
    const share = stage.powerReq / Math.max(1, count);
    return Array.from({ length: count }, (_, i) => {
      const el = isBoss ? stage.element : ['fire', 'ice', 'thunder'][(stage.index + i) % 3];
      const name = isBoss
        ? stage.bossName || `${stage.name}·守`
        : `${stage.regionName}·${['游兵', '锐卒', '悍将'][i % 3]}`;
      const hp = Math.round(share * (isBoss ? 3.4 : 1.7));
      return {
        id: `e_${stage.id}_${waveIndex}_${i}`,
        name,
        element: el,
        atk: Math.round(share * (isBoss ? 0.42 : 0.3)),
        hp,
        maxHp: hp,
        speed: 18 + seedRng.int(0, 14) + (isBoss ? 8 : 0),
        crit: isBoss ? 0.12 : 0.05,
        lifesteal: 0,
        reduce: isBoss ? 0.12 : 0,
        side: 'foe',
        isBoss
      };
    });
  }

  function runBattle(allies, waves, seed) {
    const brng = createRng(seed);
    const timeline = [];
    const roster = allies.map((u) => ({ ...u }));
    let round = 0;
    let waveIndex = 0;
    let foes = waves[0].map((u) => ({ ...u }));

    timeline.push({ round: 0, kind: 'sys', text: '战鼓三通，两阵相接。' });

    while (round < 40) {
      round += 1;
      const alive = () => roster.filter((u) => u.hp > 0);
      const foeAlive = () => foes.filter((u) => u.hp > 0);
      if (!alive().length) break;

      const order = [...alive(), ...foeAlive()].sort(
        (a, b) => b.speed - a.speed + (brng.next() - 0.5) * 3
      );

      for (const actor of order) {
        if (actor.hp <= 0) continue;
        const targets = actor.side === 'ally' ? foeAlive() : alive();
        if (!targets.length) break;
        const target = targets[Math.floor(brng.next() * targets.length)];
        const mod = elementMod(actor.element, target.element);
        const crit = brng.chance(actor.crit);
        const raw = actor.atk * mod * (crit ? 1.8 : 1) * (0.9 + brng.next() * 0.24);
        const dmg = Math.max(1, Math.round(raw * (1 - (target.reduce || 0))));
        target.hp = Math.max(0, target.hp - dmg);
        if (actor.lifesteal) {
          actor.hp = Math.min(actor.maxHp, actor.hp + Math.round(dmg * actor.lifesteal));
        }
        timeline.push({
          round,
          kind: actor.side,
          element: actor.element,
          text: `<b>${actor.name}</b>${mod > 1 ? '（克制）' : mod < 1 ? '（被克）' : ''}击中 <b>${target.name}</b>，`
            + `${crit ? '<span class="crit">暴击</span> ' : ''}造成 <span class="dmg">${dmg}</span> 点伤害`
            + `${target.hp === 0 ? '，<b>击破</b>！' : '。'}`
        });
        if (timeline.length > 60) break;
      }

      if (!foeAlive().length) {
        waveIndex += 1;
        if (waveIndex >= waves.length) break;
        foes = waves[waveIndex].map((u) => ({ ...u }));
        timeline.push({ round, kind: 'sys', text: `第 ${waveIndex + 1} 波敌军压上。` });
      }
      if (timeline.length > 60) break;
    }

    const survivors = roster.filter((u) => u.hp > 0).length;
    const clearedAll = waveIndex >= waves.length;
    const winner = clearedAll && survivors > 0 ? 'player' : 'enemy';
    timeline.push({
      round,
      kind: 'sys',
      text: winner === 'player' ? '敌阵尽破，收兵。' : '阵前失利，暂且撤退。'
    });
    const stars = winner !== 'player'
      ? 0
      : survivors === roster.length
        ? 3
        : survivors >= Math.ceil(roster.length / 2)
          ? 2
          : 1;
    return { winner, rounds: round, timeline, stars, survivors, total: roster.length };
  }

  function challengeStage(stageId) {
    const stage = MOCK_STAGES.find((s) => s.id === stageId);
    if (!stage) return { ok: false, error: '关卡不存在' };
    if (stage.index > state.campaign.cleared + 1) return { ok: false, error: '前置关卡未通关' };
    tickStamina();
    if (state.resources.stamina < stage.staminaCost) return { ok: false, error: '体力不足' };
    const lineup = state.lineup.filter(Boolean);
    if (!lineup.length) return { ok: false, error: '请先在战阵中上阵兵器' };

    state.resources.stamina -= stage.staminaCost;
    bumpRng();
    const seed = (state.seed + stage.index * 7919 + state.rngCursor) >>> 0;
    const seedRng = createRng(seed);
    const waves = Array.from({ length: stage.waves }, (_, i) => makeEnemyWave(stage, i, seedRng));
    const result = runBattle(makeUnits(lineup), waves, seed);

    let rewards = {};
    if (result.winner === 'player') {
      rewards = Object.fromEntries(Object.entries(stage.rewards).filter(([, v]) => v > 0));
      grant(rewards);
      const prevStars = state.campaign.stars[stage.id] || 0;
      state.campaign.stars[stage.id] = Math.max(prevStars, result.stars);
      if (stage.index > state.campaign.cleared) state.campaign.cleared = stage.index;
    }
    commit('battle', { stageId, result });
    return { ok: true, stage, result: { ...result, rewards } };
  }

  /* ---------------- 竞技 ---------------- */

  function arenaOpponents() {
    const myPower = Math.max(120, estimatePower());
    const arng = createRng((state.seed ^ 0x51ed270b) + state.arena.rank);
    return MOCK_FOE_NAMES.map((name, i) => {
      const rank = i + 1;
      const delta = (state.arena.rank - rank) * 0.045;
      const power = Math.max(80, Math.round(myPower * (1 + delta) * (0.86 + arng.next() * 0.3)));
      const element = ['fire', 'ice', 'thunder'][(i + state.arena.rank) % 3];
      const ratio = power / myPower;
      return {
        id: `foe_${rank}`,
        rank,
        name,
        title: MOCK_FOE_TITLES[i],
        element,
        power,
        points: 1600 - rank * 28 + arng.int(-12, 12),
        difficulty: ratio < 0.88 ? 'easy' : ratio > 1.12 ? 'hard' : 'even',
        squad: Array.from({ length: 3 }, () => arng.pick(MOCK_WEAPONS).id)
      };
    });
  }

  function arenaFight(foeId) {
    const foe = arenaOpponents().find((f) => f.id === foeId);
    if (!foe) return { ok: false, error: '对手不存在' };
    if (state.arena.ticketsLeft <= 0) return { ok: false, error: '今日挑战次数已用尽' };
    const lineup = state.lineup.filter(Boolean);
    if (!lineup.length) return { ok: false, error: '请先在战阵中上阵兵器' };

    state.arena.ticketsLeft -= 1;
    bumpRng();
    const seed = (state.seed + foe.rank * 104729 + state.rngCursor) >>> 0;
    const arng = createRng(seed);
    const squad = foe.squad.map((pid, i) => {
      const proto = MOCK_WEAPON_BY_ID[pid];
      const share = foe.power / 3;
      const hp = Math.round(share * 2.2);
      return {
        id: `${foe.id}_${i}`,
        name: proto.name,
        element: proto.element,
        atk: Math.round(share * 0.34),
        hp,
        maxHp: hp,
        speed: proto.speed + arng.int(-3, 5),
        crit: 0.08,
        lifesteal: 0,
        reduce: 0.05,
        side: 'foe'
      };
    });
    const result = runBattle(makeUnits(lineup), [squad], seed);

    let rewards = {};
    let rankChange = 0;
    if (result.winner === 'player') {
      rewards = { diamond: 6 + Math.floor((21 - foe.rank) / 3), goldOre: 2 };
      grant(rewards);
      if (foe.rank < state.arena.rank) {
        rankChange = state.arena.rank - foe.rank;
        state.arena.rank = foe.rank;
      }
      state.arena.points += 18 + Math.max(0, 20 - foe.rank);
    } else {
      rewards = { diamond: 1 };
      grant(rewards);
      state.arena.points = Math.max(800, state.arena.points - 8);
    }
    state.arena.log.unshift({
      at: Date.now(),
      foe: foe.name,
      win: result.winner === 'player',
      rankChange
    });
    state.arena.log = state.arena.log.slice(0, 8);
    commit('arena', { foeId, result });
    return { ok: true, foe, result: { ...result, rewards, rankChange } };
  }

  /* ---------------- 战阵 ---------------- */

  function lineupUnlocked() {
    return LINEUP_UNLOCK_AT.filter((need) => state.campaign.cleared >= need).length;
  }

  function lineupUnlockHint(slot) {
    return `通关第 ${LINEUP_UNLOCK_AT[slot]} 关解锁`;
  }

  function setLineup(slot, uid) {
    if (slot >= lineupUnlocked()) return { ok: false, error: lineupUnlockHint(slot) };
    const existing = state.lineup.indexOf(uid);
    if (existing >= 0 && existing !== slot) state.lineup[existing] = null;
    state.lineup[slot] = uid;
    commit('lineup', { slot, uid });
    return { ok: true };
  }

  function clearSlot(slot) {
    state.lineup[slot] = null;
    commit('lineup', { slot, uid: null });
    return { ok: true };
  }

  /* ---------------- 图鉴 ---------------- */

  function codexEntries() {
    return MOCK_WEAPONS.map((proto) => ({
      ...proto,
      skill: MOCK_SKILLS[proto.skillId] || MOCK_SKILLS.sk_basic,
      found: (state.codex[proto.id] || 0) > 0,
      count: state.codex[proto.id] || 0
    }));
  }

  /* ---------------- 对外 API ---------------- */

  return {
    isMock: true,
    source: 'mockGame',

    get state() {
      return state;
    },

    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    emit,

    // 资源
    resources: () => state.resources,
    tick: (now) => {
      const gained = tickStamina(now);
      if (gained) commit('stamina', { gained });
      return gained;
    },
    staminaCap: () => STAMINA_CAP,
    staminaEtaSeconds,

    // 数据
    weapons: () => state.weapons.map(viewWeapon),
    weapon: (uid) => {
      const w = state.weapons.find((x) => x.uid === uid);
      return w ? viewWeapon(w) : null;
    },
    stages: () => MOCK_STAGES,
    regions: () => MOCK_REGIONS,
    forgeStages: () => FORGE_STAGES,
    codexEntries,
    prototypeCount: () => MOCK_WEAPONS.length,

    // 锻造
    previewForge,
    forgeWeapon,
    enhanceWeapon,
    enhanceCost: (uid) => {
      const w = state.weapons.find((x) => x.uid === uid);
      return w ? enhanceCost(w) : null;
    },
    dismantleWeapon,
    levelCap: () => LEVEL_CAP,

    // 挂机
    peekIdle,
    collectIdle,

    // 战斗
    estimatePower,
    challengeStage,
    campaign: () => state.campaign,

    // 竞技
    arena: () => state.arena,
    arenaOpponents,
    arenaFight,

    // 战阵
    lineup: () => state.lineup,
    lineupUnlocked,
    lineupUnlockHint,
    setLineup,
    clearSlot,
    bonds: () => bondsFor(state.lineup),

    // 存档
    save,
    reset() {
      state = build();
      save();
      emit('reset', null);
    }
  };
}
