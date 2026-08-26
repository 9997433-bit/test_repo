#!/usr/bin/env node

/**
 * Round 3 deterministic live economy simulation.
 *
 * Unlike the Round 1 placeholder, this probe imports the production state,
 * forge, combat, weapon, balance, and stage modules. The only local behavior
 * is the auditable one-action-per-minute player policy.
 */
import { createRng } from '../js/core/rng.js';
import {
  addResource,
  canAfford,
  createInitialState,
  spend,
} from '../js/core/state.js';
import * as balance from '../js/data/balance.js';
import { STAGES } from '../js/data/stages.js';
import { WEAPONS } from '../js/data/weapons.js';
import {
  estimatePower,
  simulateBattle,
} from '../js/combat/engine.js';
import {
  collectIdle,
  computeWeaponStats,
  enhanceCostFor,
  enhanceWeapon,
  forgeWeapon,
  previewForge,
  regenStamina,
} from '../js/forge/forge.js';

const DURATION_MINUTES = 60;
const TARGET_STAGE = 20;
const ECONOMY_SEED = 20_260_826;
const IDLE_COLLECT_INTERVAL_MINUTES = 5;
const POWER_RETRY_RATIO = 0.9;
const {
  LINEUP_UNLOCK_STAGES,
  STARTER_KIT,
  STAMINA,
  SWEEP_RULES,
} = balance;
const MAX_SWEEPS = Number.isFinite(SWEEP_RULES?.freeDaily)
  ? SWEEP_RULES.freeDaily
  : 0;

function finiteNumbers(value, seen = new Set()) {
  if (typeof value === 'number') return Number.isFinite(value);
  if (!value || typeof value !== 'object' || seen.has(value)) return true;
  seen.add(value);
  return Object.values(value).every((child) => finiteNumbers(child, seen));
}

function createStartingState() {
  const state = createInitialState({ seed: ECONOMY_SEED, nowMs: 0 });
  if (STARTER_KIT && typeof STARTER_KIT === 'object') {
    Object.assign(state.resources, STARTER_KIT);
  }
  state.idle.staminaAt = 0;
  return state;
}

function createSimulation(policy) {
  const state = createStartingState();
  return {
    policy,
    state,
    rng: createRng(ECONOMY_SEED),
    minuteReached20: null,
    battles: 0,
    wins: 0,
    losses: 0,
    forges: 0,
    enhances: 0,
    sweeps: 0,
    waits: 0,
    collections: 0,
    lastBattleLost: false,
    powerAtLastLoss: null,
  };
}

function clearedStage(simulation) {
  return simulation.state.campaign.highestStage;
}

function unlockedSlots(stage) {
  return Math.min(
    5,
    LINEUP_UNLOCK_STAGES.filter((unlockStage) => stage >= unlockStage).length,
  );
}

function weaponPower(weapon) {
  return computeWeaponStats(weapon)?.power ?? 0;
}

function updateLineup(simulation) {
  const slots = unlockedSlots(clearedStage(simulation));
  const strongest = [...simulation.state.weapons]
    .sort((left, right) => weaponPower(right) - weaponPower(left))
    .slice(0, slots);
  simulation.state.lineup = [
    ...strongest.map((weapon) => weapon.uid),
    ...new Array(5 - strongest.length).fill(null),
  ];
  return strongest;
}

function currentPower(simulation) {
  return estimatePower(
    simulation.state,
    simulation.state.lineup,
    { catalog: WEAPONS },
  );
}

function affordableForgeOptions(simulation, nowMs) {
  const stage = clearedStage(simulation);
  const tiers = [
    ...(stage >= 25 ? ['gold'] : []),
    ...(stage >= 10 ? ['silver'] : []),
    'iron',
  ];

  for (const tier of tiers) {
    const base = previewForge(simulation.state, {
      stage: tier,
      useLucky: false,
      useMasterForge: false,
      now: nowMs,
    });
    if (!base.ok || !base.canAfford) continue;

    const options = {
      stage: tier,
      elementBias: null,
      useLucky: tier !== 'iron' && simulation.state.resources.luckyCharm > 0,
      useMasterForge: base.masterForge.available,
      now: nowMs,
    };
    const desired = previewForge(simulation.state, options);
    if (desired.ok && desired.canAfford) return options;

    options.useLucky = false;
    const fallback = previewForge(simulation.state, options);
    if (fallback.ok && fallback.canAfford) return options;
  }
  return null;
}

function tryForge(simulation, nowMs) {
  const options = affordableForgeOptions(simulation, nowMs);
  if (!options) return false;
  const result = forgeWeapon(simulation.state, options, simulation.rng);
  if (!result.ok) {
    throw new Error(`生产 forgeWeapon() 拒绝已通过 preview 的锻造：${result.reason}`);
  }
  simulation.forges += 1;
  updateLineup(simulation);
  return true;
}

function tryEnhance(simulation) {
  const candidates = [...simulation.state.weapons]
    .sort((left, right) => weaponPower(right) - weaponPower(left));
  for (const weapon of candidates) {
    const cost = enhanceCostFor(weapon);
    if (!cost || !canAfford(simulation.state, cost)) continue;
    const result = enhanceWeapon(simulation.state, weapon.uid);
    if (!result.ok) {
      throw new Error(`生产 enhanceWeapon() 拒绝可负担强化：${result.reason}`);
    }
    simulation.enhances += 1;
    updateLineup(simulation);
    return true;
  }
  return false;
}

function grantMap(state, values) {
  for (const [resource, amount] of Object.entries(values ?? {})) {
    if (resource === 'exp' || resource === 'materials') continue;
    if (typeof amount === 'number' && Number.isFinite(amount) && amount > 0) {
      addResource(state, resource, amount);
    }
  }
}

function grantStageRewards(simulation, stage, rewardRng) {
  grantMap(simulation.state, stage.rewards);
  grantMap(simulation.state, stage.rewards?.materials);
  grantMap(simulation.state, stage.firstClear);

  for (const drop of stage.dropTable ?? []) {
    if (!rewardRng.bool(drop.chance)) continue;
    addResource(
      simulation.state,
      drop.id,
      rewardRng.int(drop.min, drop.max),
    );
  }
}

function grantRepeatRewards(simulation, stage) {
  grantMap(simulation.state, stage.rewards);
  grantMap(simulation.state, stage.rewards?.materials);
}

function sweepHighestCleared(simulation) {
  if (simulation.sweeps >= MAX_SWEEPS) return false;
  const stage = STAGES[clearedStage(simulation) - 1];
  if (
    !stage ||
    stage.sweepUnlockClears > 1 ||
    !spend(simulation.state, { stamina: stage.staminaCost })
  ) {
    return false;
  }

  grantRepeatRewards(simulation, stage);
  simulation.sweeps += 1;
  return true;
}

function challengeNextStage(simulation, minute) {
  const stage = STAGES[clearedStage(simulation)];
  if (!stage || !spend(simulation.state, { stamina: stage.staminaCost })) {
    return false;
  }

  const lineup = updateLineup(simulation);
  const battleRng = simulation.rng.fork(`battle-${stage.index}-${simulation.battles}`);
  const result = simulateBattle({
    playerWeapons: lineup,
    enemyWaves: stage.waves,
    catalog: WEAPONS,
    rng: battleRng,
    speed: 4,
    mode: 'campaign',
  });
  simulation.battles += 1;

  if (!finiteNumbers(result)) {
    throw new Error(`第 ${stage.index} 关战斗结果含 NaN 或 Infinity`);
  }

  if (result.winner !== 'player') {
    simulation.losses += 1;
    simulation.lastBattleLost = true;
    simulation.powerAtLastLoss = currentPower(simulation);
    return true;
  }

  simulation.wins += 1;
  simulation.lastBattleLost = false;
  simulation.powerAtLastLoss = null;
  simulation.state.campaign.highestStage = stage.index;
  // forge/idle.js consumes maxCleared, while core/state.js owns highestStage.
  // The harness writes both until production orchestration exposes one field.
  simulation.state.campaign.maxCleared = stage.index;
  grantStageRewards(
    simulation,
    stage,
    simulation.rng.fork(`reward-${stage.index}`),
  );
  updateLineup(simulation);

  if (stage.index === TARGET_STAGE) {
    simulation.minuteReached20 = minute;
  }
  return true;
}

function collectProductionIdle(simulation, minute) {
  const result = collectIdle(simulation.state, minute * 60_000);
  if (result.ok) simulation.collections += 1;
}

function takeActiveAction(simulation, minute) {
  if (clearedStage(simulation) >= TARGET_STAGE) return;
  const nowMs = minute * 60_000;
  const lineup = updateLineup(simulation);

  if (lineup.length === 0) {
    if (!tryForge(simulation, nowMs)) simulation.waits += 1;
    return;
  }

  const slotCount = unlockedSlots(clearedStage(simulation));
  if (lineup.length < slotCount && tryForge(simulation, nowMs)) return;

  const nextStage = STAGES[clearedStage(simulation)];
  const power = currentPower(simulation);
  const stalledAfterLoss =
    simulation.lastBattleLost &&
    power <= (simulation.powerAtLastLoss ?? power);
  const shouldUpgrade =
    stalledAfterLoss ||
    power < nextStage.recommendPower * POWER_RETRY_RATIO;

  if (shouldUpgrade) {
    if (tryEnhance(simulation)) return;
    if (tryForge(simulation, nowMs)) return;
    if (stalledAfterLoss) {
      if (sweepHighestCleared(simulation)) return;
      simulation.waits += 1;
      return;
    }
  }

  if (challengeNextStage(simulation, minute)) return;

  // With no stamina, continue converting accrued production resources into
  // power so the result separates the stamina wall from a power wall.
  if (tryEnhance(simulation)) return;
  if (tryForge(simulation, nowMs)) return;
  simulation.waits += 1;
}

function simulate(policy) {
  const simulation = createSimulation(policy);

  if (policy === '无操作') {
    regenStamina(simulation.state, DURATION_MINUTES * 60_000);
    collectIdle(simulation.state, DURATION_MINUTES * 60_000);
    return simulation;
  }

  for (let minute = 1; minute <= DURATION_MINUTES; minute += 1) {
    regenStamina(simulation.state, minute * 60_000);
    if (minute % IDLE_COLLECT_INTERVAL_MINUTES === 0) {
      collectProductionIdle(simulation, minute);
    }
    takeActiveAction(simulation, minute);
  }

  return simulation;
}

function resultRow(simulation) {
  const state = simulation.state;
  return {
    场景: simulation.policy,
    '60 分钟关卡': clearedStage(simulation),
    '到达 20 关': clearedStage(simulation) >= TARGET_STAGE ? '是' : '否',
    '到达分钟': simulation.minuteReached20 ?? '—',
    '战斗(胜/负)': `${simulation.battles} (${simulation.wins}/${simulation.losses})`,
    锻造次数: simulation.forges,
    强化次数: simulation.enhances,
    扫荡次数: simulation.sweeps,
    等待分钟: simulation.waits,
    最终战力: currentPower(simulation),
    铜钱: Math.round(state.resources.coin),
    精铁: Math.round(state.resources.iron),
    体力: Math.round(state.resources.stamina * 10) / 10,
  };
}

function printAssumptions() {
  const initial = createStartingState();
  const staminaTo20 = STAGES.slice(0, TARGET_STAGE)
    .reduce((total, stage) => total + stage.staminaCost, 0);
  console.log('生产模块经济模型（固定种子，可复现）');
  console.table([
    {
      参数: '生产模块',
      值: 'core/state + data/{balance,stages,weapons} + forge + combat/engine',
    },
    {
      参数: '初始资源',
      值: `铜钱 ${initial.resources.coin} / 精铁 ${initial.resources.iron} / 体力 ${initial.resources.stamina}`,
    },
    {
      参数: '1–20 关体力',
      值: `生产关卡表合计 ${staminaTo20}；60 分钟自然可用 ${initial.resources.stamina + Math.floor(60 * 60_000 / STAMINA.regenMs)}`,
    },
    {
      参数: '积极策略',
      值: `每分钟最多一项；每 ${IDLE_COLLECT_INTERVAL_MINUTES} 分钟收取；战力低于推荐 ${POWER_RETRY_RATIO * 100}% 时优先强化/锻造；战败停滞时最多扫荡 ${MAX_SWEEPS} 次`,
    },
    { 参数: '随机种子', 值: String(ECONOMY_SEED) },
  ]);
}

function progressionGap(simulation) {
  const stage = clearedStage(simulation);
  const staminaNeeded = STAGES.slice(stage, TARGET_STAGE)
    .reduce((total, entry) => total + entry.staminaCost, 0);
  const staminaAvailable = simulation.state.resources.stamina;
  const nextStage = STAGES[stage] ?? null;
  const power = currentPower(simulation);
  return {
    staminaNeeded,
    staminaAvailable,
    staminaGap: Math.max(0, staminaNeeded - staminaAvailable),
    nextStage: nextStage?.index ?? null,
    nextStagePower: nextStage?.recommendPower ?? 0,
    nextStagePowerGap: nextStage
      ? Math.max(0, nextStage.recommendPower - power)
      : 0,
  };
}

function main() {
  const passive = simulate('无操作');
  const active = simulate('积极操作');
  if (!finiteNumbers(passive) || !finiteNumbers(active)) {
    throw new Error('经济模拟状态含 NaN 或 Infinity');
  }

  printAssumptions();
  console.log('\n60 分钟模拟');
  console.table([resultRow(passive), resultRow(active)]);

  if (active.minuteReached20 === null) {
    const gap = progressionGap(active);
    console.log(
      `\n结论：生产模块实跑下，积极操作 60 分钟到第 ${clearedStage(active)} 关，未满足 40–60 分钟到 20 关目标；` +
      `无损打完剩余关卡需 ${gap.staminaNeeded} 体力，现有 ${gap.staminaAvailable}，缺 ${gap.staminaGap}；` +
      `第 ${gap.nextStage} 关建议战力 ${gap.nextStagePower}，当前缺 ${gap.nextStagePowerGap}。`,
    );
  } else {
    const withinTarget =
      active.minuteReached20 >= 40 && active.minuteReached20 <= DURATION_MINUTES;
    console.log(
      `\n结论：生产模块实跑下，积极操作在第 ${active.minuteReached20} 分钟到 20 关，${
        withinTarget ? '落在' : '未落在'
      } 40–60 分钟目标区间；无操作停在第 ${clearedStage(passive)} 关。`,
    );
  }

  const withinTarget =
    active.minuteReached20 !== null &&
    active.minuteReached20 >= 40 &&
    active.minuteReached20 <= DURATION_MINUTES;
  const gap = progressionGap(active);
  console.log(
    `METRIC economy reached_stage=${clearedStage(active)} reached_20_minute=${active.minuteReached20 ?? 'none'} ` +
    `stamina_gap=${gap.staminaGap} next_stage=${gap.nextStage ?? 'none'} next_power_gap=${gap.nextStagePowerGap} ` +
    `target_window=40-60 pass=${withinTarget}`,
  );
}

main();
