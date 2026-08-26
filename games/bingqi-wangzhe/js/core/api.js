/**
 * 编排层 —— 把「存档原语」「静态数据」「锻造」「战斗」拼成界面能直接调用的动词。
 *
 * ## 为什么这一层存在
 *
 * `core` 只有状态与事件，`forge`/`combat` 只有纯函数，`data` 只有常量。
 * 「挑战一关」这种动作横跨四层：扣体力 → 组阵 → 打一场 → 发奖 → 推进度 → 广播事件。
 * 谁都不该越界去调别人的目录，所以由这一层做编排。
 *
 * ## 依赖方向
 *
 * 本文件**不 import** `../data`、`../forge`、`../combat`：模块由组合根（`js/main.js`）
 * 注入。core 因此仍然只依赖自己，可以被单测独立加载。
 *
 * ## 视图模型
 *
 * `js/ui/gameAdapter.js` 的契约是冻结的：它按 mockGame 的形状读字段
 * （`stage.powerReq`、`weapon.stats.atk`、`preview.costs[]`…）。逻辑层的返回值
 * 形状不同，所以这里同时提供两套出口：
 *
 *  - `game.data / game.forge / game.combat`（= `game.raw.*`）：逻辑层命名空间原样。
 *    `gameAdapter.inspectCapabilities()` 按**原始导出名**点名（`previewIdle`、
 *    `computeWeaponStats`、`arenaOpponentToWaves`…），`live/liveGame.js` 也按原始签名调用
 *    （`combat.estimatePower(units)`、`forge.previewForge(state, opts)`）。这三个键上若挂
 *    UI 门面，点名单必然缺项，界面就会整体退回 mock —— Round 2 的「mock 成功路径」正是这么来的。
 *  - `game.view.data / view.forge / view.combat`：UI 形状的门面，给不想自己拼视图模型的调用方。
 */

import {
  ARENA_BASE_RANK,
  ARENA_DAILY_ATTACKS,
  ARENA_LOG_LIMIT,
  LINEUP_SLOTS,
  syncCodexMirror,
  unlockedLineupSlots,
} from './state.js';
import { normalizeSeed } from './rng.js';

/** UI 适配层要求逻辑层显式提供的编排动词（gameAdapter.js 的同名清单）。 */
export const ORCHESTRATION_VERBS = Object.freeze([
  'challengeStage',
  'sweepStage',
  'arenaFight',
  'setLineup',
  'clearSlot',
  'bonds',
  'peekIdle',
  'weapons',
  'weapon',
  'campaign',
  'arena',
  'enhanceCost',
]);

/** UI 的关卡分组（`js/ui/mock/data.js` 的 REGIONS）：每 8 关一段。 */
const REGION_SIZE = 8;

/** 竞技胜负的积分变动。 */
const ARENA_WIN_SCORE = 18;
const ARENA_LOSE_SCORE = 8;
const ARENA_SCORE_FLOOR = 800;

/** 单次扫荡最多重复几遍（防止一次点掉整天体力）。 */
const SWEEP_MAX_TIMES = 10;

/** data 未提供 SWEEP_RULES 时的兜底（与 balance.SWEEP_RULES 同值）。 */
const DEFAULT_SWEEP_RULES = Object.freeze({ freeDaily: 2, staminaCost: 'same-as-stage' });

const isFn = (v) => typeof v === 'function';
const num = (v, fallback = 0) => (Number.isFinite(Number(v)) ? Number(v) : fallback);

/**
 * 把逻辑层模块装到 `createGame()` 的产物上。
 *
 * @param {object} game    `createGame()` 的返回值
 * @param {object} modules `{ data, forge, combat }`，分别是三个目录的 namespace import
 * @returns {object} 同一个 game 实例（便于链式使用）
 */
export function installGameApi(game, modules = {}) {
  const data = modules.data ?? {};
  const forge = modules.forge ?? {};
  const combat = modules.combat ?? {};

  const catalog = data.WEAPON_BY_ID ?? {};
  const protos = Array.isArray(data.WEAPONS) ? data.WEAPONS : [];
  const stageList = Array.isArray(data.STAGES) ? data.STAGES : [];
  const stageById = data.STAGE_BY_ID ?? Object.fromEntries(stageList.map((s) => [s.id, s]));
  const skillById = data.SKILL_BY_ID ?? {};
  const typeName = data.TYPE_NAME ?? {};
  const reasonText = data.REASON ?? {};

  const stateOf = () => game.state;
  const nowOf = () => game.nowMs();
  const say = (reason, fallback) => reasonText[reason] ?? fallback ?? '操作失败';

  /* ================================================================ *
   * 视图模型
   * ================================================================ */

  /** 词条：内部存 0.09 / 'pct'，界面要 9 / '%'。 */
  function viewAffix(affix) {
    const pct = affix?.unit === 'pct';
    const value = num(affix?.value, 0);
    return {
      id: affix?.id ?? '',
      name: affix?.name ?? '',
      stat: affix?.stat ?? '',
      value: pct ? Math.round(value * 1000) / 10 : Math.round(value),
      unit: pct ? '%' : '',
      tier: affix?.tier ?? null,
      desc: affix?.desc ?? '',
    };
  }

  function viewSkill(skillId) {
    const skill = skillById[skillId];
    if (!skill) return null;
    return { id: skill.id, name: skill.name, desc: skill.desc, cd: skill.cd };
  }

  /**
   * 兵器实例 → 界面视图模型（weaponCard / weaponDetail / 战阵选将都读这个形状）。
   */
  function viewWeapon(weapon) {
    if (!weapon) return null;
    const proto = catalog[weapon.protoId] ?? null;
    const stats = isFn(forge.computeWeaponStats) ? forge.computeWeaponStats(weapon) : null;
    const affixes = Array.isArray(weapon.affixes) ? weapon.affixes.map(viewAffix) : [];
    const state = stateOf();
    return {
      uid: weapon.uid,
      protoId: weapon.protoId,
      quality: weapon.quality,
      level: num(weapon.level, 1),
      locked: Boolean(weapon.locked),
      affixes,
      name: proto?.name ?? '无名兵器',
      title: proto?.title ?? '',
      // UI 的 weaponIcon() 按中文类型名取图标，这里直接给中文。
      type: typeName[proto?.type] ?? proto?.type ?? '器',
      typeId: proto?.type ?? null,
      element: proto?.element ?? 'fire',
      lore: proto?.lore ?? '',
      tags: proto?.tags ? [...proto.tags] : [],
      skill: viewSkill(proto?.skillId),
      skillSlots: stats?.skillSlots ?? 1,
      levelCap: stats?.levelCap ?? num(weapon.level, 1),
      stats: {
        atk: stats?.atk ?? 0,
        hp: stats?.hp ?? 0,
        speed: stats?.speed ?? 0,
        crit: stats?.crit ?? 0,
        critDmg: stats?.critDmg ?? 0,
        elementDmg: stats?.elementDmg ?? 0,
        lifesteal: stats?.lifesteal ?? 0,
        mitigation: stats?.mitigation ?? 0,
      },
      power: stats?.power ?? 0,
      createdAt: num(weapon.obtainedAt, 0),
      equippedSlot: Array.isArray(state?.lineup) ? state.lineup.indexOf(weapon.uid) : -1,
    };
  }

  /** 图鉴原型 → 界面视图模型（gameAdapter 会再补 found / count）。 */
  function viewProto(proto) {
    return {
      id: proto.id,
      name: proto.name,
      title: proto.title,
      type: typeName[proto.type] ?? proto.type,
      typeId: proto.type,
      element: proto.element,
      // 原型只有品质区间，图鉴按「能锻出的最高品质」归档。
      quality: proto.maxQuality ?? proto.minQuality ?? 'common',
      minQuality: proto.minQuality ?? 'common',
      maxQuality: proto.maxQuality ?? 'mythic',
      baseAtk: proto.baseAtk,
      baseHp: proto.baseHp,
      speed: proto.baseSpeed ?? 100,
      forgeStage: data.FORGE_STAGE_NAME?.[proto.forgeStage] ?? proto.forgeStage,
      skill: viewSkill(proto.skillId),
      lore: proto.lore,
      tags: proto.tags ? [...proto.tags] : [],
    };
  }

  /**
   * 关卡 → 界面视图模型。
   *
   * 界面按 `js/ui/mock/data.js` 的字段名读（powerReq / regionId / waves 为数字），
   * 并且用 `game.regions()`（mock 的 5 段分区）做分组，所以这里按每 8 关一段补 regionId。
   */
  function viewStage(stage) {
    return {
      id: stage.id,
      index: stage.index,
      name: stage.name,
      title: stage.title,
      element: stage.element,
      isElite: stage.isElite,
      staminaCost: stage.staminaCost,
      powerReq: stage.recommendPower,
      waves: stage.waves.length,
      bossName: stage.isElite ? stage.waves.at(-1)?.find((u) => u.isBoss)?.name ?? null : null,
      regionId: `r${Math.floor((stage.index - 1) / REGION_SIZE) + 1}`,
      regionName: stage.chapterName,
      chapterId: stage.chapterId,
      rewards: flattenStageRewards(stage),
    };
  }

  const uiStages = stageList.map(viewStage);
  const uiStageById = Object.fromEntries(uiStages.map((s) => [s.id, s]));
  const uiProtos = protos.map(viewProto);

  function flattenStageRewards(stage) {
    const out = { coin: num(stage.rewards?.coin, 0) };
    for (const [id, n] of Object.entries(stage.rewards?.materials ?? {})) out[id] = num(n, 0);
    return out;
  }

  /**
   * 战报文案里的技能名。
   *
   * `combat` 有自己的一套技能库，`data` 的 `sk_*` 不在其中，取不到时它会合成一条
   * 同名条目（`name` 直接等于 id），于是战报会写成「施展【sk_pishan】」。
   * combat 目录不归本代理改，就在出口处把这些 id 换回中文名。
   */
  function namedSkills(text) {
    return String(text).replace(/sk_[a-z0-9_]+/gi, (id) => skillById[id]?.name ?? id);
  }

  /** 战斗结果 → 界面战报（battleReport.js 读 kind / survivors / total）。 */
  function viewBattle(result, rewards) {
    const timeline = (result.timeline ?? [])
      .filter((ev) => ev.text)
      .map((ev) => ({
        round: ev.round ?? 0,
        kind: ev.side === 'player' ? 'ally' : ev.side === 'enemy' ? 'foe' : 'sys',
        element: ev.element ?? null,
        type: ev.t,
        text: escapeHtml(namedSkills(ev.text)),
      }));
    const total = (result.players ?? []).length;
    return {
      winner: result.winner,
      rounds: result.rounds,
      stars: result.stars,
      grade: result.grade,
      timeout: Boolean(result.timeout),
      survivors: (result.survivors ?? []).length,
      total,
      timeline,
      rewards: rewards ?? {},
      seed: result.seed,
    };
  }

  /* ================================================================ *
   * 状态读写小工具
   * ================================================================ */

  function ownedWeapon(uid) {
    const list = stateOf().weapons;
    return Array.isArray(list) ? list.find((w) => w?.uid === uid) ?? null : null;
  }

  function lineupWeapons() {
    const state = stateOf();
    const slots = Array.isArray(state.lineup) ? state.lineup : [];
    return slots.map((uid) => (uid ? ownedWeapon(uid) : null)).filter(Boolean);
  }

  function grant(gains, reason) {
    const applied = {};
    for (const [id, n] of Object.entries(gains ?? {})) {
      const amount = Math.floor(num(n, 0));
      if (amount <= 0) continue;
      game.addResource(id, amount, reason);
      applied[id] = amount;
    }
    return applied;
  }

  function changed(reason) {
    game.emit(game.EVENTS.STATE_CHANGED, { reason, state: stateOf() });
  }

  /** 每一场战斗都要一颗互不相同、却又可回放的种子。 */
  function battleSeed(tag, salt) {
    const state = stateOf();
    return normalizeSeed(`${state.seed}:${tag}:${salt}:${num(state.campaign?.attempts, 0)}`);
  }

  /* ================================================================ *
   * data / forge / combat 门面
   * ================================================================ */

  const dataFacade = {
    weapons: uiProtos,
    stages: uiStages,
    skills: data.SKILLS ?? [],
    strings: data,
    stage: (id) => uiStageById[id] ?? null,
    proto: (id) => uiProtos.find((p) => p.id === id) ?? null,
  };

  /** previewForge：逻辑层返回 qualityChances[]/missing{}，界面要 costs[]/odds{}。 */
  function previewForge(state, opts) {
    const preview = forge.previewForge(state, { ...opts, now: nowOf() });
    if (!preview?.ok) {
      return {
        stage: opts?.stage ?? 'iron',
        stageName: data.FORGE_STAGE_NAME?.[opts?.stage] ?? '精铁炉',
        hint: '',
        locked: true,
        lockHint: say(preview?.reason),
        costs: [],
        odds: {},
        masterForgeReady: false,
        canForge: false,
      };
    }
    const costs = Object.entries(preview.cost).map(([id, need]) => ({
      id,
      need,
      have: game.getResource(id),
      ok: game.getResource(id) >= need,
    }));
    const odds = {};
    for (const entry of preview.qualityChances) odds[entry.quality] = entry.chance;
    const bagFull = preview.bag.used >= preview.bag.capacity;
    return {
      stage: preview.stage,
      stageName: preview.stageName,
      hint: data.FORGE_STAGE_DESC?.[preview.stage] ?? '',
      locked: bagFull,
      lockHint: bagFull ? say('bag_full') : '',
      costs,
      odds,
      pity: preview.pity,
      bag: preview.bag,
      expectedAtk: preview.expectedAtk,
      masterForgeReady: preview.masterForge.available,
      canForge: preview.canAfford && !bagFull,
    };
  }

  function forgeWeapon(state, opts, rng) {
    const result = forge.forgeWeapon(state, { ...opts, now: nowOf() }, rng ?? game.rng);
    if (!result?.ok) return { ok: false, error: say(result?.reason), reason: result?.reason };
    state.codex.forgedCount = num(state.codex.forgedCount, 0) + 1;
    syncCodexMirror(state);
    game.emit(game.EVENTS.FORGED, { weapon: result.weapon, quality: result.quality });
    changed('forge');
    return {
      ok: true,
      weapon: viewWeapon(result.weapon),
      quality: result.quality,
      isNew: result.isNewProto,
      reveal: result.reveal,
      resultLine: result.resultLine,
    };
  }

  function enhanceWeapon(state, uid) {
    const result = forge.enhanceWeapon(state, uid);
    if (!result?.ok) return { ok: false, error: say(result?.reason), reason: result?.reason };
    game.emit(game.EVENTS.ENHANCED, { uid, level: result.levelTo });
    changed('enhance');
    return {
      ok: true,
      weapon: viewWeapon(result.weapon),
      cost: result.cost,
      unlockedSlot: result.unlockedSlot,
      levelFrom: result.levelFrom,
      levelTo: result.levelTo,
    };
  }

  function dismantleWeapon(state, uid) {
    const result = forge.dismantleWeapon(state, uid);
    if (!result?.ok) return { ok: false, error: say(result?.reason), reason: result?.reason };
    game.emit(game.EVENTS.DISMANTLED, { uid, refund: result.refund });
    changed('dismantle');
    return { ok: true, refund: result.refund };
  }

  function collectIdle(state, atMs) {
    const at = Number.isFinite(atMs) ? atMs : nowOf();
    const result = forge.collectIdle(state, at);
    if (!result?.ok) {
      return { ok: false, error: say(result?.reason, '炉温尚温，暂无产出'), reason: result?.reason };
    }
    game.emit(game.EVENTS.IDLE_COLLECTED, { collected: result.gains, at });
    changed('idle:collect');
    return { ok: true, loot: result.gains, gains: result.gains, minutes: result.minutes };
  }

  const forgeFacade = {
    previewForge,
    forgeWeapon,
    enhanceWeapon,
    dismantleWeapon,
    collectIdle,
  };

  /**
   * 竞技对手表必须**只由存档决定**：界面每次重绘都会调一次
   * `arenaOpponents()`，若直接用推进中的 game.rng，列表会一次一变，
   * 点谁都打不到刚才看见的那个人。
   */
  function arenaSeed(state) {
    const day = num(state.arena?.daily?.day, -1);
    return normalizeSeed(`${state.seed}:arena:${day}:${num(state.arena?.lastRefreshAt, 0)}`);
  }

  function decorateOpponent(foe, myPower) {
    const ratio = myPower > 0 ? foe.power / myPower : 1;
    return {
      ...foe,
      element: foe.element ?? dominantElementOf(foe.lineup),
      points: foe.score,
      difficulty: ratio < 0.88 ? 'easy' : ratio > 1.12 ? 'hard' : 'even',
      squad: (foe.lineup ?? []).map((u) => u.uid),
    };
  }

  function dominantElementOf(lineup) {
    const counts = {};
    for (const unit of lineup ?? []) counts[unit.element] = (counts[unit.element] ?? 0) + 1;
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'fire';
  }

  function generateArenaOpponents(state) {
    const raw = combat.generateArenaOpponents(state, arenaSeed(state), { catalog });
    const myPower = estimatePower(state, state.lineup);
    return raw.map((foe) => decorateOpponent(foe, myPower));
  }

  function estimatePower(state, lineupIds) {
    return combat.estimatePower(state, lineupIds ?? state.lineup, { catalog });
  }

  const combatFacade = {
    estimatePower,
    simulateBattle: (input) => combat.simulateBattle({ catalog, ...input }),
    generateArenaOpponents,
  };

  /* ================================================================ *
   * 编排动词
   * ================================================================ */

  /** 挂机预览：`{ loot, seconds, capped, empty }`。 */
  function peekIdle(atMs) {
    const at = Number.isFinite(atMs) ? atMs : nowOf();
    const preview = forge.previewIdle(stateOf(), at);
    return {
      loot: preview.gains,
      rates: preview.rates,
      seconds: Math.floor(preview.rawMs / 1000),
      capped: preview.capped,
      empty: !preview.ready,
    };
  }

  /**
   * 挑战主线关卡：扣体力 → 打一场 → 发奖 → 推进度。
   * @param {string} stageId
   */
  function challengeStage(stageId) {
    const state = stateOf();
    const stage = stageById[stageId];
    if (!stage) return { ok: false, error: '关卡不存在' };

    const cleared = num(state.campaign.cleared, 0);
    if (stage.index > cleared + 1) return { ok: false, error: '前置关卡未通关' };

    const party = lineupWeapons();
    if (party.length === 0) return { ok: false, error: '请先在战阵中上阵兵器' };

    if (stage.powerGate > 0 && estimatePower(state, state.lineup) < stage.powerGate) {
      return { ok: false, error: `战力不足，建议 ${stage.powerGate} 以上再来` };
    }
    if (!game.spend({ stamina: stage.staminaCost }, 'campaign')) {
      return { ok: false, error: '体力不足' };
    }

    state.campaign.attempts = num(state.campaign.attempts, 0) + 1;
    state.campaign.lastPlayedAt = nowOf();

    const result = combat.simulateBattle({
      playerWeapons: party,
      enemyWaves: stage.waves,
      catalog,
      seed: battleSeed('stage', stage.index),
      speed: num(state.flags?.battleSpeed, 1),
      mode: 'campaign',
    });

    const won = result.winner === 'player';
    let rewards = {};
    let firstClear = false;
    if (won) {
      rewards = grant(flattenStageRewards(stage), `stage:${stage.id}`);
      const before = num(state.campaign.stars[stage.id], 0);
      if (before === 0) {
        firstClear = true;
        Object.assign(rewards, grant(stage.firstClear, `stage:first:${stage.id}`));
      }
      state.campaign.stars[stage.id] = Math.max(before, result.stars);
      if (stage.index > cleared) {
        state.campaign.cleared = stage.index;
        state.campaign.highestStage = stage.index;
      }
      state.campaign.daily[stage.isElite ? 'elite' : 'normal'] =
        num(state.campaign.daily[stage.isElite ? 'elite' : 'normal'], 0) + 1;
      game.emit(game.EVENTS.STAGE_CLEARED, { stageId: stage.id, index: stage.index, stars: result.stars });
    }

    const view = viewBattle(result, rewards);
    game.emit(game.EVENTS.BATTLE_END, { mode: 'campaign', stageId: stage.id, winner: result.winner });
    changed('campaign:battle');
    return { ok: true, stage: uiStageById[stage.id], firstClear, result: view, raw: result };
  }

  /** 按关卡掉落表滚一次重复掉落（概率型按 chance 命中，区间型取闭区间整数）。 */
  function rollRepeatDrops(stage) {
    const out = {};
    for (const drop of stage.dropTable ?? []) {
      const chance = num(drop.chance, 1);
      if (chance < 1 && !game.rng.bool(chance)) continue;
      const min = Math.floor(num(drop.min, 0));
      const max = Math.floor(num(drop.max, min));
      const n = max > min ? game.rng.int(min, max) : min;
      if (n > 0) out[drop.id] = (out[drop.id] ?? 0) + n;
    }
    return out;
  }

  /**
   * 扫荡已通关的关卡：不进战斗，直接按掉落表结算 `times` 次。
   *
   * 与 `challengeStage` 并列的第二个体力出口 —— 前 `SWEEP_RULES.freeDaily` 次当日免费，
   * 之后每次照收本关体力，这样「重复刷素材」不必再逐场看战报。
   *
   * @param {string} stageId
   * @param {number} [times=1] 重复次数，夹在 1..10
   */
  function sweepStage(stageId, times = 1) {
    const state = stateOf();
    const stage = stageById[stageId];
    if (!stage) return { ok: false, error: '关卡不存在' };
    if (num(state.campaign.stars?.[stage.id], 0) <= 0) {
      return { ok: false, error: '需先通关本关才能扫荡' };
    }

    const rules = data.SWEEP_RULES ?? DEFAULT_SWEEP_RULES;
    const runs = Math.max(1, Math.min(SWEEP_MAX_TIMES, Math.floor(num(times, 1))));
    const usedToday = Math.max(0, Math.floor(num(state.campaign.daily?.sweep, 0)));
    const freeLeft = Math.max(0, Math.floor(num(rules.freeDaily, 0)) - usedToday);
    const freeUsed = Math.min(freeLeft, runs);
    const staminaCost = (runs - freeUsed) * num(stage.staminaCost, 0);

    if (staminaCost > 0 && !game.spend({ stamina: staminaCost }, 'sweep')) {
      return { ok: false, error: '体力不足' };
    }

    const loot = {};
    for (let i = 0; i < runs; i += 1) {
      for (const [id, n] of Object.entries(rollRepeatDrops(stage))) {
        loot[id] = (loot[id] ?? 0) + n;
      }
    }
    const gained = grant(loot, `sweep:${stage.id}`);
    state.campaign.daily.sweep = usedToday + runs;
    state.campaign.lastPlayedAt = nowOf();

    game.emit(game.EVENTS.STAGE_SWEPT, { stageId: stage.id, times: runs, loot: gained, staminaCost });
    changed('campaign:sweep');
    return {
      ok: true,
      stage: uiStageById[stage.id],
      times: runs,
      freeUsed,
      staminaCost,
      loot: gained,
    };
  }

  /**
   * 竞技挑战：不耗体力，耗每日次数；胜则夺名次。
   * @param {string} foeId
   */
  function arenaFight(foeId) {
    const state = stateOf();
    const foe = generateArenaOpponents(state).find((f) => f.id === foeId);
    if (!foe) return { ok: false, error: '对手不存在' };
    if (ticketsLeft(state) <= 0) return { ok: false, error: '今日挑战次数已用尽' };

    const party = lineupWeapons();
    if (party.length === 0) return { ok: false, error: '请先在战阵中上阵兵器' };

    state.arena.daily.attacks = num(state.arena.daily.attacks, 0) + 1;

    const result = combat.simulateBattle({
      playerWeapons: party,
      enemyWaves: combat.arenaOpponentToWaves(foe),
      catalog,
      seed: battleSeed('arena', foe.rank),
      speed: num(state.flags?.battleSpeed, 1),
      mode: 'arena',
      enemyAi: foe.ai,
    });

    const won = result.winner === 'player';
    let rankChange = 0;
    let rewards = {};
    if (won) {
      state.arena.wins = num(state.arena.wins, 0) + 1;
      rewards = grant({ diamond: foe.rewards?.diamond, goldOre: foe.rewards?.goldOre }, 'arena:win');
      if (foe.rank < state.arena.rank) {
        rankChange = state.arena.rank - foe.rank;
        state.arena.rank = foe.rank;
      }
      state.arena.rating = num(state.arena.rating, 1000) + ARENA_WIN_SCORE
        + Math.max(0, ARENA_BASE_RANK - foe.rank);
    } else {
      state.arena.losses = num(state.arena.losses, 0) + 1;
      rewards = grant({ diamond: 1 }, 'arena:lose');
      state.arena.rating = Math.max(ARENA_SCORE_FLOOR, num(state.arena.rating, 1000) - ARENA_LOSE_SCORE);
    }
    state.arena.score = state.arena.rating;
    state.arena.best = Math.max(num(state.arena.best, 0), state.arena.rating);
    state.arena.log = [
      { at: nowOf(), foe: foe.name, win: won, rankChange },
      ...(state.arena.log ?? []),
    ].slice(0, ARENA_LOG_LIMIT);

    const view = viewBattle(result, rewards);
    view.rankChange = rankChange;
    game.emit(game.EVENTS.ARENA_END, { foeId, winner: result.winner, rankChange });
    changed('arena:battle');
    return { ok: true, foe, result: view, raw: result };
  }

  function ticketsLeft(state) {
    return Math.max(0, ARENA_DAILY_ATTACKS - num(state.arena?.daily?.attacks, 0));
  }

  /** 上阵：同一把兵器不能占两栏，未解锁的栏位拒绝写入。 */
  function setLineup(slot, uid) {
    const state = stateOf();
    const index = Math.floor(num(slot, -1));
    if (index < 0 || index >= LINEUP_SLOTS) return { ok: false, error: '没有这个栏位' };
    if (index >= unlockedLineupSlots(state)) return { ok: false, error: '该栏位尚未解锁' };
    if (!ownedWeapon(uid)) return { ok: false, error: '兵器不存在' };

    const existing = state.lineup.indexOf(uid);
    if (existing >= 0 && existing !== index) state.lineup[existing] = null;
    state.lineup[index] = uid;
    game.emit(game.EVENTS.LINEUP_CHANGED, { slot: index, uid });
    changed('lineup:set');
    return { ok: true, slot: index, uid };
  }

  function clearSlot(slot) {
    const state = stateOf();
    const index = Math.floor(num(slot, -1));
    if (index < 0 || index >= LINEUP_SLOTS) return { ok: false, error: '没有这个栏位' };
    state.lineup[index] = null;
    game.emit(game.EVENTS.LINEUP_CHANGED, { slot: index, uid: null });
    changed('lineup:clear');
    return { ok: true, slot: index };
  }

  /**
   * 羁绊面板：战斗层只返回**已生效**的羁绊，界面要的是「四条固定条目 + 是否点亮」，
   * 所以这里按族归并成固定四行。
   */
  function bonds() {
    const state = stateOf();
    const units = lineupWeapons().map((w) =>
      combat.toCombatUnit(w, { catalog, side: 'player' }));
    const active = units.length > 0 ? combat.computeBonds(units) : [];
    const byKind = (kind) => active.filter((b) => b.kind === kind);

    const typeBonds = byKind('type');
    const elementBonds = [...byKind('element'), ...byKind('coverage')];
    const mythicBonds = byKind('mythic');
    const codexBonus = isFn(forge.codexBonusOf) ? forge.codexBonusOf(state) : 0;
    const discovered = Object.keys(state.codex?.discovered ?? {}).length;

    return [
      {
        id: 'bond_type',
        name: '同源共鸣',
        desc: '同类型兵器 ≥2：全队攻击与暴击提升',
        active: typeBonds.length > 0,
        detail: typeBonds.map((b) => `${b.name.split('·')[1] ?? b.name}×${b.count}`).join(' / ') || '尚未成型',
        value: typeBonds.reduce((s, b) => s + b.effects.atkPct, 0),
      },
      {
        id: 'bond_element',
        name: '三相同辉',
        desc: '同元素兵器 ≥3：元素增伤提升（火冰雷齐备另有加成）',
        active: elementBonds.length > 0,
        detail: elementBonds.map((b) => b.name).join(' / ') || '尚未成型',
        value: elementBonds.reduce((s, b) => s + b.effects.elemDmgAdd, 0),
      },
      {
        id: 'bond_mythic',
        name: '兵魂',
        desc: '上阵神话兵器 ≥1：全队攻击与生命提升',
        active: mythicBonds.length > 0,
        detail: mythicBonds.length ? `神话×${mythicBonds[0].count}` : '尚未成型',
        value: mythicBonds.reduce((s, b) => s + b.effects.atkPct, 0),
      },
      {
        id: 'bond_codex',
        name: '图鉴收集',
        desc: '图鉴收集度加成挂机产出（最高 +15%）',
        active: codexBonus > 0,
        detail: `${discovered}/${uiProtos.length}`,
        value: codexBonus,
      },
    ];
  }

  /* ================================================================ *
   * 装载
   * ================================================================ */

  const api = {
    // 逻辑层原样：gameAdapter 的点名单与 liveGame 的调用都按这套签名。
    data,
    forge,
    combat,
    raw: { data, forge, combat },
    // UI 形状门面（可选出口，见文件头）。
    view: { data: dataFacade, forge: forgeFacade, combat: combatFacade },

    // —— gameAdapter 的编排动词 ——
    challengeStage,
    sweepStage,
    arenaFight,
    setLineup,
    clearSlot,
    bonds,
    peekIdle,
    weapons: () => (stateOf().weapons ?? []).map(viewWeapon),
    weapon: (uid) => viewWeapon(ownedWeapon(uid)),
    campaign: () => stateOf().campaign,
    arena: () => {
      const state = stateOf();
      return {
        rank: state.arena.rank,
        points: state.arena.rating,
        best: state.arena.best,
        wins: state.arena.wins,
        losses: state.arena.losses,
        ticketsLeft: ticketsLeft(state),
        log: state.arena.log ?? [],
      };
    },
    enhanceCost: (uid) => {
      const weapon = ownedWeapon(uid);
      return weapon ? forge.enhanceCostFor(weapon) : null;
    },

    // 组合根接手后，挂机由 forge 记账；core 自带的 pending 版本让位。
    collectIdle: (at) => collectIdle(stateOf(), at),

    // —— 便利读数（UI 可选用，测试常用） ——
    stages: () => uiStages,
    regions: () => regionsOf(uiStages),
    estimatePower: (ids) => estimatePower(stateOf(), ids),
    arenaOpponents: () => generateArenaOpponents(stateOf()),
    lineup: () => stateOf().lineup,
    levelCap: (uid) => forge.levelCapFor(ownedWeapon(uid)?.quality ?? 'common'),
  };

  Object.assign(game, api);
  return game;
}

/** 按每 8 关一段切出界面分组（与 mock 的 REGIONS 对齐，颜色取该段首关元素）。 */
function regionsOf(stages) {
  const regions = new Map();
  for (const stage of stages) {
    if (!regions.has(stage.regionId)) {
      regions.set(stage.regionId, {
        id: stage.regionId,
        name: stage.regionName,
        element: stage.element,
        from: stage.index,
        to: stage.index,
      });
    }
    regions.get(stage.regionId).to = stage.index;
  }
  return [...regions.values()];
}

/** 战报文本会被 UI 以 innerHTML 插入，逻辑层来的文案先做转义。 */
function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export default installGameApi;
