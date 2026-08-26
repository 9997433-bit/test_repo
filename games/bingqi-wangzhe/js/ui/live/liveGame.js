/**
 * liveGame —— 用「真实逻辑层」实现界面需要的那套动词。
 *
 * 它和 `mock/mockGame.js` 暴露完全相同的形状，区别只有一个：
 * 所有读写都落在 core 的真实存档上，所有数值都由 `data` / `forge` / `combat` 算出，
 * 本文件不自己发明任何玩法数值。
 *
 * ## 三类职责
 *
 * 1. **视图模型**：把 `state.weapons[]`（只有 protoId/quality/level/affixes）
 *    与 `data/weapons.js` 原型合成界面直接能渲染的对象。
 * 2. **编排动词**：`challengeStage` / `arenaFight` / `setLineup` 这些跨模块动作，
 *    冻结契约里没有定义。逻辑层若提供同名实现（`game.challengeStage` 或
 *    `game.modules.orchestrator.*`）则优先调用，否则由这里用 core 原语 +
 *    combat 纯函数组合出来，绝不回落 mock。
 * 3. **存档补丁**：core 的 `serialize()` 白名单里没有 `state.forge`（保底 / 大师熔炉），
 *    `hydrate()` 又只认识 arena 的固定字段，所以这两处镜像进 `state.flags`
 *    （flags 是整体合并的，能安全过一轮存读）。缺口登记在
 *    `.agent_workspace/round2/REQUESTS.md`。
 */

import * as defaultData from '../../data/index.js';
import * as defaultForge from '../../forge/index.js';
import * as defaultCombat from '../../combat/index.js';
import { LINEUP_UNLOCK_STAGES } from '../../core/index.js';

const ARENA_TICKETS_PER_DAY = 5;
const ARENA_ROSTER = 20;
const ARENA_REFRESH_MS = 30 * 60 * 1000;
const ARENA_LOG_KEEP = 8;

const clone = (v) => JSON.parse(JSON.stringify(v));
const fail = (error, extra) => ({ ok: false, error, ...(extra || {}) });
const isFn = (v) => typeof v === 'function';

/** 按关卡出现顺序析出章节表（去重，保序）。 */
function chaptersFromStages(stages) {
  const seen = new Map();
  for (const s of stages) {
    const id = s?.chapterId ?? s?.regionId;
    if (!id || seen.has(id)) continue;
    seen.set(id, {
      id,
      name: s.chapterName ?? s.regionName ?? id,
      element: s.element ?? 'fire',
      subtitle: s.chapterSubtitle ?? s.regionSubtitle ?? ''
    });
  }
  return [...seen.values()];
}

/**
 * 把 data 层的命名空间归一成界面用的形状。
 * 既吃 `import * as data`（全大写常量），也吃已经整理过的 `{ weapons, stages }`。
 */
export function normalizeData(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const weapons = raw.weapons ?? raw.WEAPONS;
  const stages = raw.stages ?? raw.STAGES;
  if (!Array.isArray(weapons) || !Array.isArray(stages)) return null;
  const byId = (list, key = 'id') =>
    Object.fromEntries(list.map((item) => [item[key], item]));
  return {
    weapons,
    weaponById: raw.weaponById ?? raw.WEAPON_BY_ID ?? byId(weapons),
    stages,
    stageById: raw.stageById ?? raw.STAGE_BY_ID ?? byId(stages),
    // 没给章节表就从关卡里析出来：试炼页按章分组，缺了这张表整页会空着，
    // 而每一关本来就带着自己属于哪一章。
    chapters: raw.chapters ?? raw.CHAPTER_LIST ?? chaptersFromStages(stages),
    skills: raw.skills ?? raw.SKILLS ?? [],
    skillById: raw.skillById ?? raw.SKILL_BY_ID ?? {},
    forgeStages: raw.forgeStages ?? raw.FORGE_STAGES ?? ['iron', 'silver', 'gold'],
    balance: {
      STAMINA: raw.STAMINA ?? raw.balance?.STAMINA ?? { max: 120, regenMs: 360000 },
      IDLE: raw.IDLE ?? raw.balance?.IDLE ?? { offlineCapMs: 288e5 },
      BAG: raw.BAG ?? raw.balance?.BAG ?? { baseSlots: 60 }
    },
    strings: raw.strings ?? raw
  };
}

/** 逻辑层模块（缺省用仓库里的实现，注入方可整体替换）。 */
export function resolveMods(override = {}) {
  return {
    data: normalizeData(override.data || defaultData),
    forge: override.forge || defaultForge,
    combat: override.combat || defaultCombat
  };
}

/**
 * @param {object} runtime core `createGame()` 的产物
 * @param {{data?:object, forge?:object, combat?:object}} [override] 注入方替换的模块
 */
export function createLiveGame(runtime, override = {}) {
  const { data, forge, combat } = resolveMods(override);
  if (!data) throw new Error('[bqwz/ui] data 模块形状不认识');

  const protos = data.weapons;
  const protoById = data.weaponById;
  const skillById = data.skillById;
  const stageList = data.stages;
  const stageById = data.stageById;
  const chapters = data.chapters;
  const text = data.strings;
  const reasonCN = (code, fallback = '操作未成功') => text.REASON?.[code] || fallback;

  /** 逻辑层若自带编排动词就用它的（Round 2 之后可能由 core 提供）。 */
  const orchestrator = runtime.modules?.orchestrator || runtime.modules?.game || null;
  const override_ = (name) => {
    const fn = isFn(runtime[name]) ? runtime[name] : orchestrator && isFn(orchestrator[name]) ? orchestrator[name].bind(orchestrator) : null;
    return fn;
  };

  /* ------------------------------------------------------------------ *
   * 存档补丁与事件
   * ------------------------------------------------------------------ */

  function st() {
    return runtime.state;
  }

  /** serialize / hydrate 丢掉的字段在这里补回来；可安全重入。 */
  function ensureShape() {
    const s = st();
    if (!s.flags || typeof s.flags !== 'object') s.flags = {};
    if (!s.idle || typeof s.idle !== 'object') s.idle = {};
    if (!s.campaign || typeof s.campaign !== 'object') s.campaign = { highestStage: 0, cleared: {} };
    if (!s.campaign.cleared || typeof s.campaign.cleared !== 'object') s.campaign.cleared = {};
    if (!s.arena || typeof s.arena !== 'object') s.arena = {};
    if (!s.arena.daily || typeof s.arena.daily !== 'object') s.arena.daily = { day: -1, attacks: 0 };
    if (!Array.isArray(s.flags.arenaLog)) s.flags.arenaLog = [];

    // 保底计数 / 大师熔炉次数：serialize 不认识 state.forge，从 flags 镜像恢复。
    if (!s.forge && s.flags.forgeState) {
      try {
        s.forge = clone(s.flags.forgeState);
      } catch {
        s.forge = undefined;
      }
    }
    // forge/idle.js 读 `idle.lastCollectAt`，core 存的是 `idle.lastCollectMs`。
    if (!Number.isFinite(s.idle.lastCollectAt)) {
      s.idle.lastCollectAt = Number.isFinite(s.idle.lastCollectMs)
        ? s.idle.lastCollectMs
        : Number(s.createdAt) || runtime.nowMs();
    }
    return s;
  }

  /** 落盘 + 广播。所有会改存档的动词结束时都走这里。 */
  function commit(reason) {
    const s = ensureShape();
    if (s.forge) s.flags.forgeState = clone(s.forge);
    s.idle.lastCollectMs = s.idle.lastCollectAt;
    runtime.save();
    runtime.bus.emit(runtime.EVENTS?.STATE_CHANGED || 'state:changed', { reason, state: s });
  }

  /* ------------------------------------------------------------------ *
   * 兵器视图模型
   * ------------------------------------------------------------------ */

  /** 词条实例（pct 存 0.12）→ 界面文案（12%）。 */
  function displayAffix(a) {
    const isPct = a.unit === 'pct';
    return {
      id: a.id,
      name: a.name,
      stat: a.stat,
      tier: a.tier,
      desc: a.desc,
      value: isPct ? Math.round(a.value * 1000) / 10 : Math.round(a.value),
      unit: isPct ? '%' : ''
    };
  }

  function instanceOf(uid) {
    return st().weapons.find((w) => w.uid === uid) || null;
  }

  function viewSkill(id) {
    const skill = skillById[id];
    return skill ? { id: skill.id, name: skill.name, desc: skill.desc, cd: skill.cd } : null;
  }

  /** 存档实例 + 原型 → 界面直接可渲染的兵器。 */
  function viewWeapon(w) {
    if (!w) return null;
    const proto = protoById[w.protoId] || {};
    const s = forge.computeWeaponStats(w);
    const lineup = st().lineup || [];
    return {
      uid: w.uid,
      protoId: w.protoId,
      quality: w.quality,
      level: s ? s.level : Number(w.level) || 1,
      levelCap: s ? s.levelCap : forge.levelCapFor(w.quality),
      element: proto.element,
      type: proto.type,
      name: proto.name || w.protoId,
      title: proto.title || '',
      lore: proto.lore || '',
      tags: proto.tags || [],
      locked: Boolean(w.locked),
      createdAt: Number(w.obtainedAt) || 0,
      affixes: (w.affixes || []).map(displayAffix),
      skill: viewSkill(proto.skillId),
      skillSlots: s ? s.skillSlots : 1,
      stats: {
        atk: s?.atk ?? 0,
        hp: s?.hp ?? 0,
        speed: s?.speed ?? 0,
        crit: s?.crit ?? 0,
        critDmg: s?.critDmg ?? 1.5,
        lifesteal: s?.lifesteal ?? 0,
        elementDmg: s?.elementDmg ?? 0,
        reduce: s?.mitigation ?? 0,
        combo: s?.combo ?? 0,
        reflect: s?.reflect ?? 0
      },
      power: s?.power ?? 0,
      equippedSlot: lineup.indexOf(w.uid)
    };
  }

  /**
   * 存档实例 → 战斗层单位。
   *
   * 显式把 forge 算好的面板喂给 combat（`toCombatUnit` 优先采纳显式 atk/hp），
   * 否则战斗会用自己那套品质系数重算一遍，界面数字与战报对不上。
   * 词条已并入面板，这里不再重复传 affixes，避免二次叠加。
   */
  function toBattleUnit(w) {
    const s = forge.computeWeaponStats(w);
    if (!s) return null;
    const proto = protoById[w.protoId] || {};
    return {
      uid: w.uid,
      name: s.name,
      title: s.title,
      type: s.type,
      element: s.element,
      quality: s.quality,
      level: s.level,
      atk: s.atk,
      hp: s.hp,
      maxHp: s.hp,
      speed: s.speed,
      crit: s.crit,
      critDmg: s.critDmg,
      lifesteal: s.lifesteal,
      combo: s.combo,
      reduction: s.mitigation,
      thorns: s.reflect,
      elemDmg: s.elementDmg,
      pierce: s.pierce,
      skills: proto.skillId ? [proto.skillId] : []
    };
  }

  function lineupUnits(ids) {
    const list = (ids || st().lineup || []).filter(Boolean);
    return list
      .map((uid) => (typeof uid === 'string' ? instanceOf(uid) : uid))
      .filter(Boolean)
      .map(toBattleUnit)
      .filter(Boolean);
  }

  function estimatePower(ids) {
    const units = lineupUnits(ids);
    return units.length ? combat.estimatePower(units) : 0;
  }

  /* ------------------------------------------------------------------ *
   * 锻造
   * ------------------------------------------------------------------ */

  function forgeStages() {
    return data.forgeStages.map((id) => ({
      id,
      name: text.FORGE_STAGE_NAME?.[id] || id,
      hint: text.FORGE_STAGE_DESC?.[id] || ''
    }));
  }

  function previewForge(opts = {}) {
    const s = ensureShape();
    const p = forge.previewForge(s, { ...opts, now: runtime.nowMs() });
    if (!p.ok) {
      return {
        stage: opts.stage || 'iron',
        stageName: text.FORGE_STAGE_NAME?.[opts.stage] || '精铁炉',
        hint: '',
        locked: true,
        lockHint: reasonCN(p.reason, '此炉暂不可用'),
        costs: [],
        odds: {},
        masterForgeReady: false,
        canForge: false
      };
    }
    const res = s.resources;
    const costs = Object.entries(p.cost).map(([id, need]) => ({
      id,
      need,
      have: Math.floor(res[id] || 0),
      ok: (res[id] || 0) >= need
    }));
    const odds = {};
    p.qualityChances.forEach((q) => {
      odds[q.quality] = q.chance;
    });
    const bagFull = p.bag.used >= p.bag.capacity;
    return {
      stage: p.stage,
      stageName: p.stageName,
      hint: text.FORGE_STAGE_DESC?.[p.stage] || '',
      locked: bagFull,
      lockHint: bagFull ? `兵器架已满（${p.bag.used}/${p.bag.capacity}），先分解几把` : '',
      costs,
      odds,
      masterForgeReady: p.masterForge.available,
      masterForgeRemaining: p.masterForge.remaining,
      canForge: p.canAfford && !bagFull,
      pity: p.pity,
      bag: p.bag,
      expectedAtk: p.expectedAtk
    };
  }

  function forgeWeapon(opts = {}) {
    const s = ensureShape();
    const res = forge.forgeWeapon(s, { ...opts, now: runtime.nowMs() }, runtime.rng);
    if (!res.ok) {
      return fail(reasonCN(res.reason, '无法起炉'), { reason: res.reason, missing: res.missing });
    }
    s.flags.firstForgeDone = true;
    s.codex.forgedCount = (Number(s.codex.forgedCount) || 0) + 1;
    commit('forge');
    return {
      ok: true,
      weapon: viewWeapon(res.weapon),
      isNew: res.isNewProto,
      quality: res.quality,
      cost: res.cost,
      reveal: res.reveal,
      resultLine: res.resultLine,
      pityFloorApplied: res.pityFloorApplied
    };
  }

  function enhanceCost(uid) {
    const w = instanceOf(uid);
    return w ? forge.enhanceCostFor(w) : null;
  }

  function enhanceWeapon(uid) {
    ensureShape();
    const res = forge.enhanceWeapon(st(), uid);
    if (!res.ok) {
      return fail(reasonCN(res.reason, '强化失败'), { reason: res.reason, missing: res.missing });
    }
    commit('enhance');
    return {
      ok: true,
      weapon: viewWeapon(res.weapon),
      unlockedSlot: res.unlockedSlot,
      cost: res.cost,
      levelTo: res.levelTo
    };
  }

  function dismantleWeapon(uid) {
    ensureShape();
    const res = forge.dismantleWeapon(st(), uid);
    if (!res.ok) return fail(reasonCN(res.reason, '分解失败'), { reason: res.reason });
    commit('dismantle');
    return { ok: true, refund: res.refund };
  }

  function setWeaponLock(uid, locked) {
    ensureShape();
    const res = forge.setWeaponLock(st(), uid, locked);
    if (!res.ok) return fail(reasonCN(res.reason, '操作失败'));
    commit('lock');
    return { ok: true, locked: res.locked };
  }

  /* ------------------------------------------------------------------ *
   * 挂机
   *
   * core 的 tickIdle 与 forge 的 previewIdle 是两套并行的结算（前者按小时费率
   * 累进 `idle.pending`，后者按 lastCollectAt 折算）。界面认 forge 那套（费率来自
   * balance），因此领取时顺手把 core 的仓库清零 —— 同一段时间只能兑现一次。
   * ------------------------------------------------------------------ */

  function peekIdle(now = runtime.nowMs()) {
    const s = ensureShape();
    const p = forge.previewIdle(s, now);
    return {
      loot: p.gains,
      seconds: Math.floor(p.cappedMs / 1000),
      rawSeconds: Math.floor(p.rawMs / 1000),
      capped: p.capped,
      empty: !p.ready,
      rates: p.rates,
      codexBonus: p.codexBonus
    };
  }

  function drainCorePending() {
    const pending = st().idle?.pending;
    if (!pending) return;
    Object.keys(pending).forEach((id) => {
      pending[id] = 0;
    });
  }

  function collectIdle(now = runtime.nowMs()) {
    const s = ensureShape();
    const res = forge.collectIdle(s, now);
    if (!res.ok) return fail(reasonCN(res.reason, '炉温尚温，暂无产出'), { reason: res.reason });
    drainCorePending();
    commit('idle');
    return {
      ok: true,
      loot: res.gains,
      seconds: Math.floor(res.cappedMs / 1000),
      capped: res.capped,
      empty: false
    };
  }

  /* ------------------------------------------------------------------ *
   * 试炼
   * ------------------------------------------------------------------ */

  function stageRewardMap(stage) {
    const out = { coin: stage.rewards.coin };
    Object.entries(stage.rewards.materials || {}).forEach(([id, n]) => {
      if (n > 0) out[id] = (out[id] || 0) + n;
    });
    return out;
  }

  function bossNameOf(stage) {
    if (!stage.isElite) return null;
    const last = stage.waves[stage.waves.length - 1] || [];
    return last.find((u) => u.isBoss)?.name || null;
  }

  function stages() {
    return stageList.map((s) => ({
      id: s.id,
      index: s.index,
      name: s.name,
      title: s.title,
      regionId: s.chapterId,
      regionName: s.chapterName,
      element: s.element,
      isElite: s.isElite,
      bossName: bossNameOf(s),
      staminaCost: s.staminaCost,
      powerReq: s.recommendPower,
      powerGate: s.powerGate,
      waves: s.waves.length,
      rewards: stageRewardMap(s)
    }));
  }

  function regions() {
    return chapters.map((c) => ({
      id: c.id,
      name: c.name,
      element: c.element,
      subtitle: c.subtitle
    }));
  }

  function campaign() {
    const s = ensureShape();
    const stars = {};
    Object.entries(s.campaign.cleared).forEach(([id, rec]) => {
      stars[id] = typeof rec === 'number' ? rec : Number(rec?.stars) || 0;
    });
    return { cleared: Math.max(0, Math.floor(s.campaign.highestStage || 0)), stars };
  }

  /** 战斗种子从存档的 rng 流里取，保证「同存档同一战」可复现。 */
  function nextBattleSeed() {
    return isFn(runtime.rng.uint32)
      ? runtime.rng.uint32()
      : Math.floor(runtime.rng.next() * 4294967296);
  }

  function grantLoot(loot, reason) {
    Object.entries(loot || {}).forEach(([id, n]) => {
      if (n > 0) runtime.addResource(id, n, reason);
    });
  }

  /**
   * 技能 id → 中文名。
   *
   * 战斗层有自己一套技能库；`data/skills.js` 里的 id（`sk_*`）不在其中，
   * 会被合成成一个同名兜底技能，于是战报里印出来的是 `施展【sk_leiting_tu】`。
   * 战斗层不归界面改，就在这里备一张字典，演出时把 id 换回「雷霆突」。
   */
  const skillNames = Object.fromEntries(
    Object.values(skillById || {})
      .filter((s) => s && s.id && s.name)
      .map((s) => [s.id, s.name])
  );

  /** 引擎结果 → 战报组件吃的形状（保留完整 timeline 供弹道演出）。 */
  function normalizeResult(result) {
    return {
      engine: true,
      skillNames,
      engineVersion: result.engineVersion,
      winner: result.winner,
      rounds: result.rounds,
      stars: result.stars,
      grade: result.grade,
      timeline: result.timeline,
      players: result.players,
      enemies: result.enemies,
      bonds: result.bonds,
      survivors: result.survivors ? result.survivors.length : 0,
      total: result.players.length,
      seed: result.seed,
      timeout: result.timeout,
      durationMs: result.durationMs,
      stats: result.stats
    };
  }

  function challengeStage(stageId) {
    const injected = override_('challengeStage');
    if (injected) return injected(stageId);

    const s = ensureShape();
    const stage = stageById[stageId];
    if (!stage) return fail('关卡不存在');

    const cleared = Math.max(0, Math.floor(s.campaign.highestStage || 0));
    if (stage.index > cleared + 1) return fail(`先通关第 ${cleared + 1} 关`);

    const units = lineupUnits();
    if (!units.length) return fail('请先在战阵中上阵兵器', { goto: 'lineup' });

    const power = combat.estimatePower(units);
    if (stage.powerGate && power < stage.powerGate) {
      return fail(`精英关需战力 ${stage.powerGate}，当前 ${power}`, { goto: 'lineup' });
    }

    const stamina = Math.floor(s.resources.stamina || 0);
    if (stamina < stage.staminaCost) {
      return fail(`体力不足，还差 ${stage.staminaCost - stamina} 点`, { resource: 'stamina' });
    }
    runtime.spend({ stamina: stage.staminaCost }, 'campaign');

    const seed = nextBattleSeed();
    const raw = combat.simulateBattle({
      playerWeapons: units,
      enemyWaves: stage.waves.map((wave, i) => ({ name: `第 ${i + 1} 波`, units: wave })),
      seed,
      catalog: protoById,
      mode: 'campaign',
      enemyAi: stage.isElite ? 'focus' : null
    });

    const result = normalizeResult(raw);
    const rewards = {};
    const add = (map) => {
      Object.entries(map || {}).forEach(([id, n]) => {
        if (n > 0) rewards[id] = (rewards[id] || 0) + n;
      });
    };

    if (result.winner === 'player') {
      add(stageRewardMap(stage));
      const prev = s.campaign.cleared[stage.id];
      const prevStars = typeof prev === 'number' ? prev : Number(prev?.stars) || 0;
      const firstClear = !prev;
      if (firstClear) add(stage.firstClear);
      s.campaign.cleared[stage.id] = {
        stars: Math.max(prevStars, result.stars),
        clears: (typeof prev === 'object' ? Number(prev.clears) || 0 : 0) + 1,
        at: runtime.nowMs()
      };
      if (stage.index > cleared) s.campaign.highestStage = stage.index;
      result.firstClear = firstClear;
    } else if (raw.rewards?.coin) {
      // 败北保底：引擎给的铜钱落袋（exp 不是资源，不入账）。
      rewards.coin = raw.rewards.coin;
    }

    grantLoot(rewards, 'campaign');
    s.campaign.attempts = (Number(s.campaign.attempts) || 0) + 1;
    s.campaign.lastPlayedAt = runtime.nowMs();
    result.rewards = rewards;
    commit('battle');
    return { ok: true, stage, result };
  }

  /* ------------------------------------------------------------------ *
   * 竞技
   * ------------------------------------------------------------------ */

  let opponentCache = { key: '', list: [] };

  /** 同一刷新周期内对手不变，且不消耗存档 rng 流。 */
  function arenaSeedKey() {
    const s = ensureShape();
    const bucket = Math.floor((Number(s.arena.lastRefreshAt) || 0) / 1000);
    return `${s.seed}:${bucket}:${Math.round(Number(s.arena.rating) || 1000)}`;
  }

  function rawOpponents() {
    const key = arenaSeedKey();
    if (opponentCache.key === key && opponentCache.list.length) return opponentCache.list;
    const s = ensureShape();
    const list = combat.generateArenaOpponents(s, combat.createCombatRng(key), {
      count: ARENA_ROSTER,
      basePower: Math.max(600, estimatePower()),
      catalog: protoById
    });
    opponentCache = { key, list };
    return list;
  }

  function arena() {
    const s = ensureShape();
    const attacks = Math.max(0, Math.floor(s.arena.daily?.attacks || 0));
    return {
      rank: Math.max(1, Math.floor(s.arena.rank || ARENA_ROSTER)),
      points: Math.round(Number(s.arena.rating) || 1000),
      ticketsLeft: Math.max(0, ARENA_TICKETS_PER_DAY - attacks),
      wins: Number(s.arena.wins) || 0,
      losses: Number(s.arena.losses) || 0,
      log: s.flags.arenaLog || []
    };
  }

  function arenaOpponents() {
    const mine = Math.max(1, estimatePower());
    return rawOpponents().map((foe) => {
      const ratio = foe.power / mine;
      return {
        id: foe.id,
        rank: foe.rank,
        name: foe.name,
        title: foe.title,
        element: foe.element || foe.lineup[0]?.element || 'fire',
        power: foe.power,
        points: foe.score,
        difficulty: ratio < 0.88 ? 'easy' : ratio > 1.12 ? 'hard' : 'even',
        counterHint: foe.counterHint,
        squad: foe.lineup.map((u) => u.element)
      };
    });
  }

  function refreshArena() {
    const s = ensureShape();
    s.arena.lastRefreshAt = runtime.nowMs();
    opponentCache = { key: '', list: [] };
    commit('arena:refresh');
    return { ok: true };
  }

  function arenaFight(foeId) {
    const injected = override_('arenaFight');
    if (injected) return injected(foeId);

    const s = ensureShape();
    const foe = rawOpponents().find((f) => f.id === foeId);
    if (!foe) return fail('对手已离场，稍后再来');
    if (arena().ticketsLeft <= 0) return fail('今日挑战次数已用尽');

    const units = lineupUnits();
    if (!units.length) return fail('请先在战阵中上阵兵器', { goto: 'lineup' });

    const seed = nextBattleSeed();
    const raw = combat.simulateBattle({
      playerWeapons: units,
      enemyWaves: combat.arenaOpponentToWaves(foe),
      seed,
      catalog: protoById,
      mode: 'arena',
      enemyAi: foe.ai
    });

    const result = normalizeResult(raw);
    const win = result.winner === 'player';
    const rewards = {};
    let rankChange = 0;

    if (win) {
      rewards.diamond = foe.rewards.diamond;
      rewards.goldOre = foe.rewards.goldOre;
      s.arena.rating = Math.round((Number(s.arena.rating) || 1000) + foe.rewards.score);
      s.arena.wins = (Number(s.arena.wins) || 0) + 1;
      const myRank = Math.max(1, Math.floor(s.arena.rank || ARENA_ROSTER));
      if (foe.rank < myRank) {
        rankChange = myRank - foe.rank;
        s.arena.rank = foe.rank;
      }
    } else {
      rewards.diamond = 1;
      s.arena.rating = Math.max(800, Math.round((Number(s.arena.rating) || 1000) - 8));
      s.arena.losses = (Number(s.arena.losses) || 0) + 1;
    }
    s.arena.best = Math.max(Number(s.arena.best) || 0, s.arena.rating);
    s.arena.daily.attacks = Math.max(0, Math.floor(s.arena.daily.attacks || 0)) + 1;
    s.flags.arenaLog = [
      { at: runtime.nowMs(), foe: foe.name, win, rankChange },
      ...(s.flags.arenaLog || [])
    ].slice(0, ARENA_LOG_KEEP);

    grantLoot(rewards, 'arena');
    result.rewards = rewards;
    result.rankChange = rankChange;
    commit('arena');
    return { ok: true, foe, result };
  }

  /* ------------------------------------------------------------------ *
   * 战阵
   * ------------------------------------------------------------------ */

  function lineupUnlocked() {
    return runtime.unlockedLineupSlots();
  }

  function lineupUnlockHint(slot) {
    const need = LINEUP_UNLOCK_STAGES[slot];
    return Number.isFinite(need) ? `通关第 ${need} 关解锁` : '暂不可用';
  }

  function setLineup(slot, uid) {
    const injected = override_('setLineup');
    if (injected) return injected(slot, uid);

    const s = ensureShape();
    if (!(slot >= 0 && slot < s.lineup.length)) return fail('没有这个栏位');
    if (slot >= lineupUnlocked()) return fail(lineupUnlockHint(slot));
    if (!instanceOf(uid)) return fail('找不到这把兵器');
    // 已在别的栏位：两栏对调，避免「换上一把却丢了另一把」。
    const existing = s.lineup.indexOf(uid);
    if (existing >= 0 && existing !== slot) s.lineup[existing] = s.lineup[slot] || null;
    s.lineup[slot] = uid;
    commit('lineup');
    return { ok: true };
  }

  function clearSlot(slot) {
    const injected = override_('clearSlot');
    if (injected) return injected(slot);

    const s = ensureShape();
    if (!(slot >= 0 && slot < s.lineup.length)) return fail('没有这个栏位');
    s.lineup[slot] = null;
    commit('lineup');
    return { ok: true };
  }

  /**
   * 羁绊面板：已成型的名称与效果都由 combat.computeBonds 给，
   * 未成型的显示进度，好让玩家知道「还差一把」。
   */
  function bonds() {
    const units = lineupUnits();
    const active = combat.computeBonds(units);
    const byType = {};
    const byElement = {};
    let mythic = 0;
    units.forEach((u) => {
      byType[u.type] = (byType[u.type] || 0) + 1;
      byElement[u.element] = (byElement[u.element] || 0) + 1;
      if (u.quality === 'mythic') mythic += 1;
    });
    const maxType = Math.max(0, ...Object.values(byType), 0);
    const maxElement = Math.max(0, ...Object.values(byElement), 0);
    const elementKinds = Object.keys(byElement).length;
    const pick = (kind) => active.find((b) => b.kind === kind);

    return [
      {
        id: 'bond_type',
        name: pick('type')?.name || '同源共鸣',
        desc: pick('type')?.desc || '同类型兵器 ≥2：全队攻击与暴击提升',
        active: Boolean(pick('type')),
        detail: `${maxType}/2`,
        value: 0
      },
      {
        id: 'bond_element',
        name: pick('element')?.name || '三相同辉',
        desc: pick('element')?.desc || '同元素兵器 ≥3：元素增伤提升',
        active: Boolean(pick('element')),
        detail: `${maxElement}/3`,
        value: 0
      },
      {
        id: 'bond_mythic',
        name: pick('mythic')?.name || '兵魂',
        desc: pick('mythic')?.desc || '上阵神话兵器 ≥1：全队攻击与生命提升',
        active: Boolean(pick('mythic')) || mythic > 0,
        detail: `${mythic}/1`,
        value: 0
      },
      {
        id: 'bond_trinity',
        name: pick('coverage')?.name || '三相归一',
        desc: pick('coverage')?.desc || '火冰雷齐备：元素增伤与速度提升',
        active: Boolean(pick('coverage')),
        detail: `${elementKinds}/3`,
        value: 0
      }
    ];
  }

  /* ------------------------------------------------------------------ *
   * 图鉴
   * ------------------------------------------------------------------ */

  function codexEntries() {
    const discovered = ensureShape().codex.discovered || {};
    return protos.map((p) => {
      const rec = discovered[p.id];
      return {
        id: p.id,
        name: p.name,
        title: p.title,
        type: p.type,
        element: p.element,
        // 图鉴按「锻出过的最好品质」归档；未收录时用原型的最低可锻品质占位。
        quality: rec?.bestQuality || p.minQuality,
        minQuality: p.minQuality,
        maxQuality: p.maxQuality,
        baseAtk: p.baseAtk,
        baseHp: p.baseHp,
        speed: p.baseSpeed,
        forgeStage: text.FORGE_STAGE_NAME?.[p.forgeStage] || p.forgeStage,
        lore: p.lore,
        tags: p.tags || [],
        skill: viewSkill(p.skillId),
        found: Boolean(rec),
        count: Number(rec?.count) || 0
      };
    });
  }

  /* ------------------------------------------------------------------ *
   * 资源与时钟
   * ------------------------------------------------------------------ */

  const staminaMax = data.balance.STAMINA.max;
  const staminaRegenMs = data.balance.STAMINA.regenMs;

  function staminaEtaSeconds() {
    const s = ensureShape();
    if ((s.resources.stamina || 0) >= staminaMax) return 0;
    const carry = Math.max(0, Number(s.idle.staminaCarryMs) || 0);
    return Math.max(1, Math.ceil((staminaRegenMs - (carry % staminaRegenMs)) / 1000));
  }

  ensureShape();

  return {
    isMock: false,
    source: 'core',

    get state() {
      return st();
    },

    subscribe(fn) {
      const handler = (payload, ctx) => fn(ctx?.type || 'core', payload);
      runtime.bus.on('*', handler);
      return () => runtime.bus.off?.('*', handler);
    },
    emit: (type, payload) => runtime.bus.emit(type, payload),

    // 资源与时钟
    resources: () => st().resources,
    tick: (now) => runtime.tick(now),
    staminaCap: () => staminaMax,
    staminaEtaSeconds,

    // 数据
    weapons: () => st().weapons.map(viewWeapon),
    weapon: (uid) => viewWeapon(instanceOf(uid)),
    stages,
    regions,
    forgeStages,
    codexEntries,
    prototypeCount: () => protos.length,
    levelCap: (uid) => (uid ? viewWeapon(instanceOf(uid))?.levelCap ?? 70 : 70),

    // 锻造
    previewForge,
    forgeWeapon,
    enhanceWeapon,
    enhanceCost,
    dismantleWeapon,
    setWeaponLock,

    // 挂机
    peekIdle,
    collectIdle,

    // 战斗
    estimatePower,
    challengeStage,
    campaign,

    // 竞技
    arena,
    arenaOpponents,
    arenaFight,
    refreshArena,
    arenaRefreshMs: () => ARENA_REFRESH_MS,

    // 战阵
    lineup: () => st().lineup,
    lineupUnlocked,
    lineupUnlockHint,
    setLineup,
    clearSlot,
    bonds,

    // 存档
    save: () => runtime.save(),
    reset: () => {
      runtime.reset();
      opponentCache = { key: '', list: [] };
      ensureShape();
      runtime.save();
    },
    exportJson: () => runtime.exportJson()
  };
}

export default createLiveGame;
