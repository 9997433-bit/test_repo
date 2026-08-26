#!/usr/bin/env node

/**
 * A deliberately simplified, deterministic economy model.
 *
 * It does not import production balance data: the purpose is to expose a
 * Round 2 target and make assumptions auditable while those modules are being
 * implemented in parallel.
 */

const MODEL = Object.freeze({
  durationMinutes: 60,
  targetStage: 20,
  initial: Object.freeze({
    stage: 0,
    power: 300,
    coin: 700,
    iron: 80,
    stamina: 120,
  }),
  staminaCap: 120,
  staminaRegenPerMinute: 1 / 6,
  battleStaminaCost: 5,
  forgeCoinCost: 110,
  forgeIronCost: 10,
  forgePowerBase: 105,
});

function stagePowerRequirement(stage) {
  return 220 + 6.5 * stage ** 2;
}

function idleIncome(stage) {
  return {
    coin: 18 + stage * 2.2,
    iron: 1.1 + stage * 0.12,
  };
}

function battleReward(stage) {
  return {
    coin: 75 + stage * 9,
    iron: 3 + Math.floor(stage / 4),
  };
}

function forgePowerGain(forgeCount) {
  return MODEL.forgePowerBase + Math.floor(forgeCount / 5) * 8;
}

function createState(policy) {
  return {
    policy,
    ...MODEL.initial,
    minuteReached20: null,
    battles: 0,
    forges: 0,
    waits: 0,
  };
}

function accrueOneMinute(state) {
  const income = idleIncome(state.stage);
  state.coin += income.coin;
  state.iron += income.iron;
  state.stamina = Math.min(
    MODEL.staminaCap,
    state.stamina + MODEL.staminaRegenPerMinute,
  );
}

function takeActiveAction(state, minute) {
  if (state.stage >= MODEL.targetStage) {
    return;
  }

  const nextStage = state.stage + 1;
  const canBattle =
    state.power >= stagePowerRequirement(nextStage) &&
    state.stamina >= MODEL.battleStaminaCost;

  if (canBattle) {
    state.stamina -= MODEL.battleStaminaCost;
    state.stage = nextStage;
    state.battles += 1;

    const reward = battleReward(nextStage);
    state.coin += reward.coin;
    state.iron += reward.iron;

    if (state.stage === MODEL.targetStage) {
      state.minuteReached20 = minute;
    }
    return;
  }

  if (state.coin >= MODEL.forgeCoinCost && state.iron >= MODEL.forgeIronCost) {
    state.coin -= MODEL.forgeCoinCost;
    state.iron -= MODEL.forgeIronCost;
    state.power += forgePowerGain(state.forges);
    state.forges += 1;
    return;
  }

  state.waits += 1;
}

function simulate(policy) {
  const state = createState(policy);

  for (let minute = 1; minute <= MODEL.durationMinutes; minute += 1) {
    accrueOneMinute(state);
    if (policy === '积极操作') {
      takeActiveAction(state, minute);
    }
  }

  return state;
}

function resultRow(state) {
  return {
    场景: state.policy,
    '60 分钟关卡': state.stage,
    '到达 20 关': state.stage >= MODEL.targetStage ? '是' : '否',
    '到达分钟': state.minuteReached20 ?? '—',
    战斗次数: state.battles,
    锻造次数: state.forges,
    等待分钟: state.waits,
    最终战力: Math.round(state.power),
    铜钱: Math.round(state.coin),
    精铁: Math.round(state.iron),
    体力: Math.round(state.stamina * 10) / 10,
  };
}

function printAssumptions() {
  console.log('简化经济模型（确定性，不代表生产数值）');
  console.table([
    { 参数: '初始状态', 值: '战力 300 / 铜钱 700 / 精铁 80 / 体力 120' },
    { 参数: '挂机/分钟', 值: '铜钱 18+2.2×已过关；精铁 1.1+0.12×已过关' },
    { 参数: '锻造', 值: '110 铜钱 + 10 精铁；基础 +105 战力，逐步成长' },
    { 参数: '战斗', 值: '每关 5 体力、每分钟最多一个操作' },
    { 参数: '关卡门槛', 值: '220 + 6.5×关卡²' },
  ]);
}

function main() {
  const passive = simulate('无操作');
  const active = simulate('积极操作');

  printAssumptions();
  console.log('\n60 分钟模拟');
  console.table([resultRow(passive), resultRow(active)]);

  if (active.minuteReached20 === null) {
    console.log(
      `\n结论：该简化模型下，积极操作 60 分钟只能到第 ${active.stage} 关，未满足 40–60 分钟到 20 关目标。`,
    );
  } else {
    const withinTarget =
      active.minuteReached20 >= 40 && active.minuteReached20 <= MODEL.durationMinutes;
    console.log(
      `\n结论：该简化模型下，积极操作在第 ${active.minuteReached20} 分钟到 20 关，${
        withinTarget ? '落在' : '未落在'
      } 40–60 分钟目标区间；无操作停在第 ${passive.stage} 关。`,
    );
  }
}

main();
