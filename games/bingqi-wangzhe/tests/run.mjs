import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const FORGE_SAMPLE_SIZE = 384;
const EIGHT_HOURS_MS = 8 * 60 * 60 * 1000;
const FIRST_FORGE_SEEDS = Array.from({ length: 32 }, (_, index) => 0x510000 + index);
const IRON_FORGE_OPTIONS = {
  stage: 'iron',
  elementBias: null,
  useLucky: false,
  useMasterForge: false,
};
const results = [];

async function importModule(relativePath, requiredExports = []) {
  const url = new URL(relativePath, import.meta.url);
  assert.ok(existsSync(fileURLToPath(url)), `缺少模块 ${relativePath}`);

  const module = await import(url.href);
  const missing = requiredExports.filter((name) => typeof module[name] !== 'function');
  assert.deepEqual(missing, [], `${relativePath} 缺少导出：${missing.join(', ')}`);
  return module;
}

async function importIfPresent(relativePath) {
  const url = new URL(relativePath, import.meta.url);
  if (!existsSync(fileURLToPath(url))) return null;
  return import(url.href);
}

async function probe(name, fn) {
  const startedAt = performance.now();
  try {
    const details = await fn();
    const result = {
      name,
      status: 'passed',
      durationMs: Number((performance.now() - startedAt).toFixed(2)),
      ...(details === undefined ? {} : { details }),
    };
    results.push(result);
    console.error(`[PASS] ${name}`);
  } catch (error) {
    const message = error?.message ?? String(error);
    const result = {
      name,
      status: 'failed',
      durationMs: Number((performance.now() - startedAt).toFixed(2)),
      error: message,
    };
    results.push(result);
    console.error(`[FAIL] ${name}: ${message}`);
  }
}

async function probeIfModulesPresent(name, relativePaths, fn) {
  const missing = relativePaths.filter((relativePath) => {
    const url = new URL(relativePath, import.meta.url);
    return !existsSync(fileURLToPath(url));
  });
  if (missing.length > 0) {
    const reason = `缺少模块：${missing.join(', ')}`;
    results.push({ name, status: 'skipped', durationMs: 0, reason });
    console.error(`[SKIP] ${name}: ${reason}`);
    return;
  }
  await probe(name, fn);
}

function makeFundedState(createInitialState) {
  const state = createInitialState();
  assert.ok(state && typeof state === 'object', 'createInitialState() 必须返回状态对象');
  assert.ok(state.resources && typeof state.resources === 'object', '初始状态缺少 resources');
  assert.ok(Array.isArray(state.weapons), '初始状态缺少 weapons[]');

  for (const id of [
    'coin',
    'iron',
    'silverOre',
    'goldOre',
    'fireCrystal',
    'iceCrystal',
    'thunderCrystal',
    'luckyCharm',
    'diamond',
    'stamina',
  ]) {
    state.resources[id] = 1_000_000_000;
  }
  return state;
}

function extractForgedWeapon(output, state, previousLength) {
  const directCandidates = [
    output?.weapon,
    output?.item,
    output?.result?.weapon,
    output?.result,
    output,
  ];
  for (const candidate of directCandidates) {
    if (candidate && typeof candidate === 'object' && 'quality' in candidate) {
      return candidate;
    }
  }
  if (state.weapons.length > previousLength) return state.weapons.at(-1);
  return null;
}

async function sampleForgeDistribution(seed, sampleSize) {
  const { createRng } = await importModule('../js/core/rng.js', ['createRng']);
  const { createInitialState } = await importModule('../js/core/state.js', ['createInitialState']);
  const { forgeWeapon } = await importModule('../js/forge/forge.js', ['forgeWeapon']);
  const state = makeFundedState(createInitialState);
  const rng = createRng(seed);
  const counts = {};
  const validQualities = new Set(['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic']);

  for (let index = 0; index < sampleSize; index += 1) {
    const previousLength = state.weapons.length;
    const output = forgeWeapon(
      state,
      IRON_FORGE_OPTIONS,
      rng,
    );
    assert.equal(
      output?.ok,
      true,
      `第 ${index + 1} 次锻造失败${output?.reason ? `：${output.reason}` : ''}`,
    );
    const weapon = extractForgedWeapon(output, state, previousLength);
    assert.ok(weapon, `第 ${index + 1} 次锻造未返回兵器，也未写入 state.weapons`);
    const { quality } = weapon;
    assert.equal(typeof quality, 'string', `第 ${index + 1} 次锻造缺少字符串 quality`);
    assert.ok(validQualities.has(quality), `未知锻造品质：${quality}`);
    counts[quality] = (counts[quality] ?? 0) + 1;
    // 品质采样不测试背包容量；移除样本，保留 rng、保底与锻造计数的连续状态。
    state.weapons.splice(previousLength);
  }

  return Object.fromEntries(Object.entries(counts).sort(([a], [b]) => a.localeCompare(b)));
}

function buildBattleInput() {
  const playerWeapons = [
    {
      id: 'probe-player-fire',
      templateId: 'probe-player-fire',
      name: '探针火剑',
      element: 'fire',
      quality: 'rare',
      level: 1,
      atk: 34,
      baseAtk: 34,
      hp: 210,
      maxHp: 210,
      baseHp: 210,
      speed: 12,
      crit: 0.2,
      critRate: 0.2,
      skills: [],
      affixes: [],
    },
  ];
  const enemyWaves = [
    [
      {
        id: 'probe-enemy-ice',
        name: '探针冰俑',
        element: 'ice',
        level: 1,
        atk: 22,
        baseAtk: 22,
        hp: 180,
        maxHp: 180,
        baseHp: 180,
        speed: 9,
        crit: 0.1,
        critRate: 0.1,
        skills: [],
        affixes: [],
      },
    ],
  ];
  return { playerWeapons, enemyWaves };
}

function setIdleStart(state, timestamp) {
  state.idle = state.idle && typeof state.idle === 'object' ? state.idle : {};
  for (const key of [
    'lastCollectedAt',
    'lastCollectAt',
    'lastClaimAt',
    'lastTickAt',
    'lastActiveAt',
    'lastOnlineAt',
    'lastSavedAt',
    'since',
    'timestamp',
  ]) {
    state.idle[key] = timestamp;
  }
  for (const key of ['lastCollectedAt', 'lastActiveAt', 'lastOnlineAt', 'lastSavedAt', 'updatedAt']) {
    state[key] = timestamp;
  }
  state.createdAt = timestamp;
}

function numericResourceDelta(before, after) {
  const delta = {};
  for (const key of new Set([...Object.keys(before ?? {}), ...Object.keys(after ?? {})])) {
    const previous = Number(before?.[key] ?? 0);
    const current = Number(after?.[key] ?? 0);
    if (Number.isFinite(previous) && Number.isFinite(current) && current !== previous) {
      delta[key] = current - previous;
    }
  }
  return Object.fromEntries(Object.entries(delta).sort(([a], [b]) => a.localeCompare(b)));
}

function numericRewardMap(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const reward = {};
  for (const [key, amount] of Object.entries(value)) {
    if (typeof amount === 'number' && Number.isFinite(amount)) reward[key] = amount;
  }
  return Object.fromEntries(Object.entries(reward).sort(([a], [b]) => a.localeCompare(b)));
}

function durationMsFrom(result, state) {
  const containers = [result, result?.idle, state?.idle];
  const candidates = [
    ['cappedMs', 1],
    ['elapsedMs', 1],
    ['durationMs', 1],
    ['offlineMs', 1],
    ['cappedSeconds', 1000],
    ['elapsedSeconds', 1000],
    ['offlineSeconds', 1000],
    ['cappedHours', 60 * 60 * 1000],
    ['hours', 60 * 60 * 1000],
  ];
  for (const container of containers) {
    if (!container || typeof container !== 'object') continue;
    for (const [key, multiplier] of candidates) {
      if (typeof container[key] === 'number' && Number.isFinite(container[key])) {
        return container[key] * multiplier;
      }
    }
  }
  return null;
}

function idleObservation(beforeResources, state, result) {
  const resourceDelta = numericResourceDelta(beforeResources, state.resources);
  const rewardCandidates = [
    result?.rewards,
    result?.gains,
    result?.collected,
    result?.resources,
    result?.reward,
  ];
  let rewards = {};
  for (const candidate of rewardCandidates) {
    const mapped = numericRewardMap(candidate);
    if (Object.keys(mapped).length > 0) {
      rewards = mapped;
      break;
    }
  }
  return {
    resourceDelta,
    rewards,
    durationMs: durationMsFrom(result, state),
  };
}

await probe('RNG 可复现', async () => {
  const { createRng } = await importModule('../js/core/rng.js', ['createRng']);
  const first = createRng(0x5eed1234);
  const second = createRng(0x5eed1234);
  const other = createRng(0x5eed1235);
  for (const rng of [first, second, other]) {
    assert.equal(typeof rng?.nextFloat, 'function', 'createRng() 缺少 nextFloat()');
  }
  const firstSequence = Array.from({ length: 64 }, () => first.nextFloat());
  const secondSequence = Array.from({ length: 64 }, () => second.nextFloat());
  const otherSequence = Array.from({ length: 64 }, () => other.nextFloat());
  assert.deepEqual(firstSequence, secondSequence, '同一种子的随机序列不一致');
  assert.notDeepEqual(firstSequence, otherSequence, '不同种子产生了完全相同的随机序列');
  assert.ok(firstSequence.every((value) => value >= 0 && value < 1), 'nextFloat() 必须落在 [0, 1)');
  return { seed: 0x5eed1234, draws: firstSequence.length };
});

await probe('spend/addResource 原子资源操作', async () => {
  const { createInitialState, addResource, spend } = await importModule(
    '../js/core/state.js',
    ['createInitialState', 'addResource', 'spend'],
  );
  const state = createInitialState();
  assert.ok(state?.resources && typeof state.resources === 'object', '初始状态缺少 resources');
  const initialCoin = Number(state.resources.coin ?? 0);
  addResource(state, 'coin', 50);
  assert.equal(state.resources.coin, initialCoin + 50, 'addResource 未按数量增加资源');
  assert.equal(spend(state, { coin: 30 }), true, '资源充足时 spend 应返回 true');
  assert.equal(state.resources.coin, initialCoin + 20, 'spend 成功后未正确扣减资源');
  const beforeRejectedSpend = state.resources.coin;
  assert.equal(
    spend(state, { coin: beforeRejectedSpend + 1 }),
    false,
    '资源不足时 spend 应返回 false',
  );
  assert.equal(state.resources.coin, beforeRejectedSpend, '失败的 spend 不得部分扣款');
  return { resource: 'coin', added: 50, spent: 30 };
});

await probe('锻造品质分布（固定种子）', async () => {
  const seed = 0x0f0a6e;
  const first = await sampleForgeDistribution(seed, FORGE_SAMPLE_SIZE);
  const second = await sampleForgeDistribution(seed, FORGE_SAMPLE_SIZE);
  assert.deepEqual(first, second, '相同种子的锻造品质分布不一致');
  assert.equal(
    Object.values(first).reduce((sum, count) => sum + count, 0),
    FORGE_SAMPLE_SIZE,
    '锻造分布样本数不正确',
  );
  assert.ok(Object.keys(first).length >= 2, '锻造品质分布退化为单一品质');
  return { seed, sampleSize: FORGE_SAMPLE_SIZE, distribution: first };
});

await probe('元素克制倍率', async () => {
  const { elementMultiplier } = await importModule(
    '../js/combat/index.js',
    ['elementMultiplier'],
  );
  for (const [attacker, defender] of [
    ['fire', 'ice'],
    ['ice', 'thunder'],
    ['thunder', 'fire'],
  ]) {
    assert.equal(elementMultiplier(attacker, defender), 1.35, `${attacker} 克制 ${defender} 应为 1.35`);
    assert.equal(elementMultiplier(defender, attacker), 0.75, `${defender} 被 ${attacker} 克制应为 0.75`);
    assert.equal(elementMultiplier(attacker, attacker), 1, `${attacker} 同元素应为 1.0`);
  }
  return { exportName: 'elementMultiplier', advantage: 1.35, disadvantage: 0.75, neutral: 1 };
});

await probe('simulateBattle 同种子结果一致', async () => {
  const { createRng } = await importModule('../js/core/rng.js', ['createRng']);
  const { simulateBattle } = await importModule('../js/combat/index.js', ['simulateBattle']);
  const seed = 0x0ba771e;
  const run = () => {
    const input = buildBattleInput();
    return simulateBattle({ ...input, rng: createRng(seed), speed: 1 });
  };
  const first = run();
  const second = run();
  assert.deepEqual(first, second, '相同种子的战斗结果或时间线不一致');
  assert.ok(first && typeof first === 'object', 'simulateBattle 必须返回结果对象');
  assert.ok('winner' in first, '战斗结果缺少 winner');
  assert.equal(typeof first.rounds, 'number', '战斗结果缺少数字 rounds');
  assert.ok(Array.isArray(first.timeline), '战斗结果缺少 timeline[]');
  assert.ok('rewards' in first, '战斗结果缺少 rewards');
  return { seed, winner: first.winner, rounds: first.rounds, timelineEvents: first.timeline.length };
});

await probe('离线挂机 8 小时封顶', async () => {
  const stateModule = await importModule('../js/core/state.js', ['createInitialState']);
  const forgeModule = await importIfPresent('../js/forge/forge.js');
  const collect =
    typeof forgeModule?.collectIdle === 'function'
      ? forgeModule.collectIdle
      : typeof stateModule.tickIdle === 'function'
        ? stateModule.tickIdle
        : null;
  assert.equal(
    typeof collect,
    'function',
    '../js/forge/forge.js 缺少 collectIdle，且 ../js/core/state.js 缺少 tickIdle',
  );

  const now = 2_000_000_000_000;
  const observe = async (offlineHours) => {
    const state = stateModule.createInitialState();
    assert.ok(state?.resources && typeof state.resources === 'object', '初始状态缺少 resources');
    setIdleStart(state, now - offlineHours * 60 * 60 * 1000);
    const beforeResources = { ...state.resources };
    const result = await collect(state, now);
    return idleObservation(beforeResources, state, result);
  };
  const atCap = await observe(8);
  const overCap = await observe(12);
  const atCapReward = Object.keys(atCap.resourceDelta).length > 0 ? atCap.resourceDelta : atCap.rewards;
  const overCapReward =
    Object.keys(overCap.resourceDelta).length > 0 ? overCap.resourceDelta : overCap.rewards;
  const hasRewardEvidence = Object.values(atCapReward).some((amount) => amount !== 0);
  const hasDurationEvidence = atCap.durationMs !== null && overCap.durationMs !== null;
  assert.ok(
    hasRewardEvidence || hasDurationEvidence,
    '离线结算未暴露结算时长，且未产生可观察的资源奖励，无法验证 8 小时封顶',
  );
  if (hasRewardEvidence) {
    assert.deepEqual(overCapReward, atCapReward, '离线 12 小时奖励必须与 8 小时奖励一致');
  }
  if (hasDurationEvidence) {
    assert.ok(overCap.durationMs <= EIGHT_HOURS_MS, '离线结算时长超过 8 小时');
    assert.equal(overCap.durationMs, atCap.durationMs, '离线 12 小时的计入时长必须封顶为 8 小时');
  }
  return {
    source: typeof forgeModule?.collectIdle === 'function' ? 'collectIdle' : 'tickIdle',
    comparedHours: [8, 12],
    cappedDurationMs: overCap.durationMs,
    rewards: overCapReward,
  };
});

await probeIfModulesPresent(
  '首锻品质至少为 uncommon（多种子）',
  ['../js/core/rng.js', '../js/core/state.js', '../js/forge/forge.js'],
  async () => {
    const { createRng } = await importModule('../js/core/rng.js', ['createRng']);
    const { createInitialState } = await importModule('../js/core/state.js', ['createInitialState']);
    const { forgeWeapon } = await importModule('../js/forge/forge.js', ['forgeWeapon']);
    const qualityRank = new Map(
      ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic'].map((quality, rank) => [
        quality,
        rank,
      ]),
    );
    const observed = {};

    for (const seed of FIRST_FORGE_SEEDS) {
      const state = createInitialState({ seed });
      const previousLength = state.weapons.length;
      const output = forgeWeapon(state, IRON_FORGE_OPTIONS, createRng(seed));
      assert.equal(output?.ok, true, `种子 ${seed} 的首锻失败：${output?.reason ?? '未知原因'}`);
      const weapon = extractForgedWeapon(output, state, previousLength);
      assert.ok(weapon, `种子 ${seed} 的首锻未产生兵器`);
      assert.ok(qualityRank.has(weapon.quality), `种子 ${seed} 返回未知品质：${weapon.quality}`);
      assert.ok(
        qualityRank.get(weapon.quality) >= qualityRank.get('uncommon'),
        `种子 ${seed} 的首锻品质为 ${weapon.quality}，低于 uncommon`,
      );
      observed[weapon.quality] = (observed[weapon.quality] ?? 0) + 1;
    }

    return { seeds: FIRST_FORGE_SEEDS.length, minimumQuality: 'uncommon', observed };
  },
);

await probeIfModulesPresent(
  'serialize 往返保留 forge.pity',
  ['../js/core/state.js'],
  async () => {
    const { createInitialState, hydrate, serialize } = await importModule(
      '../js/core/state.js',
      ['createInitialState', 'hydrate', 'serialize'],
    );
    const state = createInitialState({ seed: 0x5170 });
    if (!state.forge?.pity || typeof state.forge.pity !== 'object') {
      return { fieldPresent: false };
    }

    for (const [index, pity] of Object.values(state.forge.pity).entries()) {
      pity.epic = 2 + index;
      pity.legendary = 5 + index;
    }
    const expected = JSON.parse(JSON.stringify(state.forge.pity));
    const serialized = serialize(state);
    assert.deepEqual(serialized?.forge?.pity, expected, 'serialize() 丢失或改写了 forge.pity');
    const restored = hydrate(JSON.stringify(serialized));
    assert.deepEqual(restored?.forge?.pity, expected, 'hydrate(serialize(state)) 未保留 forge.pity');
    return { fieldPresent: true, stages: Object.keys(expected) };
  },
);

await probeIfModulesPresent(
  'challengeStage 空体力失败且不发奖励',
  ['../js/main.js'],
  async () => {
    const { createBoundGame } = await importModule('../js/main.js', ['createBoundGame']);
    const game = createBoundGame({
      seed: 0x517a,
      now: () => 2_000_000_000_000,
      autoLoad: false,
      autoSave: false,
    });

    try {
      assert.equal(typeof game.challengeStage, 'function', '组合游戏缺少 challengeStage()');
      const firstStage = game.stages?.()[0];
      assert.ok(firstStage?.id, '未找到可挑战的首关');
      const forged = game.forge?.forgeWeapon(game.state, IRON_FORGE_OPTIONS, game.rng);
      assert.equal(forged?.ok, true, `测试阵容首锻失败：${forged?.reason ?? forged?.error ?? '未知原因'}`);
      assert.equal(game.setLineup(0, forged.weapon.uid)?.ok, true, '测试兵器无法上阵');

      const stamina = game.getResource('stamina');
      assert.ok(stamina > 0, '初始体力必须为正，才能构造空体力边界');
      assert.equal(game.spend({ stamina }, 'round3-empty-stamina'), true, '无法耗尽测试体力');
      assert.equal(game.getResource('stamina'), 0, '测试体力未归零');

      const resourcesBefore = JSON.parse(JSON.stringify(game.state.resources));
      const campaignBefore = JSON.parse(JSON.stringify(game.state.campaign));
      const outcome = game.challengeStage(firstStage.id);
      assert.equal(outcome?.ok, false, '空体力挑战必须失败');
      assert.match(
        `${outcome?.reason ?? ''} ${outcome?.error ?? ''}`,
        /体力|stamina/i,
        '空体力失败结果必须说明体力不足',
      );
      assert.deepEqual(game.state.resources, resourcesBefore, '空体力失败不得扣资源或发奖励');
      assert.deepEqual(game.state.campaign, campaignBefore, '空体力失败不得推进关卡或挑战次数');
      return { stageId: firstStage.id, stamina: 0, rewarded: false };
    } finally {
      game.destroy?.();
    }
  },
);

await probeIfModulesPresent(
  'STARTER_KIT 或初始资源支持至少 2 次精铁锻',
  ['../js/core/state.js', '../js/data/balance.js'],
  async () => {
    const { createInitialState } = await importModule('../js/core/state.js', ['createInitialState']);
    const balance = await importModule('../js/data/balance.js');
    const ironCost = balance.FORGE_COST?.iron;
    assert.ok(ironCost && typeof ironCost === 'object', 'FORGE_COST.iron 缺失');

    const forgeCapacity = (resources) => {
      const capacities = Object.entries(ironCost)
        .filter(([, amount]) => Number(amount) > 0)
        .map(([id, amount]) => Math.floor(Number(resources?.[id] ?? 0) / Number(amount)));
      return capacities.length > 0 ? Math.min(...capacities) : 0;
    };
    const initialCapacity = forgeCapacity(createInitialState().resources);
    const starterCapacity = forgeCapacity(balance.STARTER_KIT);
    const available = Math.max(initialCapacity, starterCapacity);
    assert.ok(
      available >= 2,
      `开局资源不足 2 次精铁锻：初始资源 ${initialCapacity} 次，STARTER_KIT ${starterCapacity} 次`,
    );
    return {
      requiredForges: 2,
      source: starterCapacity >= initialCapacity ? 'STARTER_KIT' : 'initialResources',
      supportedForges: available,
      ironCost,
    };
  },
);

const totals = {
  passed: results.filter(({ status }) => status === 'passed').length,
  skipped: results.filter(({ status }) => status === 'skipped').length,
  failed: results.filter(({ status }) => status === 'failed').length,
};
const summary = {
  ok: totals.failed === 0,
  totals,
  forgeSampleSize: FORGE_SAMPLE_SIZE,
  tests: results,
  gaps: results
    .filter(({ status }) => status === 'skipped')
    .map(({ name, reason }) => ({ name, reason })),
};

console.log(JSON.stringify(summary, null, 2));
process.exitCode = totals.failed === 0 ? 0 : 1;
