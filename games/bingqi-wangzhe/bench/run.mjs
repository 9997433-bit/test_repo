#!/usr/bin/env node

/**
 * Round 2 live benchmark and boundary probe.
 *
 * This file uses only Node globals and the game's production public modules.
 * A missing module/export is a failure: the Round 1 SKIP path is no longer an
 * acceptable benchmark result now that core, forge, and combat have landed.
 */

const BATTLE_ITERATIONS = 500;
const FORGE_SAMPLES = 1_000;
const BENCH_SEED = 20_260_826;
const BATTLE_TARGET_MS = 500;
const FORGE_TARGET_MS = 500;

const MODULE_URLS = {
  rng: new URL('../js/core/rng.js', import.meta.url),
  state: new URL('../js/core/state.js', import.meta.url),
  forge: new URL('../js/forge/forge.js', import.meta.url),
  combat: new URL('../js/combat/engine.js', import.meta.url),
};

function errorMessage(error) {
  return error instanceof Error ? `${error.name}: ${error.message}` : String(error);
}

async function loadModule(name, requiredExports) {
  try {
    const module = await import(MODULE_URLS[name]);
    const missingExports = requiredExports.filter(
      (exportName) => typeof module[exportName] !== 'function',
    );

    if (missingExports.length > 0) {
      return {
        status: 'skip',
        reason: `${name} 缺少导出：${missingExports.join(', ')}`,
      };
    }

    return { status: 'ok', module };
  } catch (error) {
    if (error?.code === 'ERR_MODULE_NOT_FOUND') {
      return {
        status: 'skip',
        reason: `${name} 模块缺失（${MODULE_URLS[name].pathname}）`,
      };
    }

    return { status: 'error', reason: errorMessage(error) };
  }
}

function clone(value) {
  return structuredClone(value);
}

function makeWeapon(index, overrides = {}) {
  const atk = overrides.atk ?? 420 + index * 17;
  const hp = overrides.hp ?? 2_400 + index * 90;
  const element = overrides.element ?? ['fire', 'ice', 'thunder'][index % 3];

  return {
    id: `bench-weapon-${index}`,
    templateId: `bench-weapon-${index}`,
    name: `基准兵器${index}`,
    type: ['sword', 'spear', 'bow', 'hammer', 'fan'][index % 5],
    quality: 'rare',
    rarity: 'rare',
    level: 10,
    element,
    atk,
    attack: atk,
    baseAtk: atk,
    hp,
    maxHp: hp,
    currentHp: hp,
    speed: 100 + index * 3,
    crit: 0.12,
    critRate: 0.12,
    defense: 50,
    skills: [],
    skillIds: [],
    ...overrides,
  };
}

function makeEnemy(index = 0, overrides = {}) {
  return {
    ...makeWeapon(100 + index, {
      atk: 310 + index * 23,
      hp: 2_100 + index * 180,
      element: ['ice', 'thunder', 'fire'][index % 3],
    }),
    id: `bench-enemy-${index}`,
    name: `基准敌兵${index}`,
    ...overrides,
  };
}

function battleFixture(playerCount = 3, playerOverrides = {}) {
  return {
    playerWeapons: Array.from({ length: playerCount }, (_, index) =>
      makeWeapon(index, playerOverrides),
    ),
    enemyWaves: [
      [makeEnemy(0), makeEnemy(1)],
      [makeEnemy(2, { hp: 3_600, maxHp: 3_600, currentHp: 3_600 })],
    ],
    speed: 4,
  };
}

function summarizeBattle(result) {
  if (!result || typeof result !== 'object') {
    return String(result);
  }

  return `winner=${String(result.winner ?? 'unknown')}, rounds=${String(
    result.rounds ?? 'unknown',
  )}, timeline=${Array.isArray(result.timeline) ? result.timeline.length : 'unknown'}`;
}

function runBattleBenchmark(simulateBattle, createRng) {
  const fixture = battleFixture();
  const inputs = Array.from({ length: BATTLE_ITERATIONS }, () => ({
    ...clone(fixture),
    rng: createRng(BENCH_SEED),
  }));

  let lastResult;
  let sink = 0;
  const startedAt = performance.now();

  for (const input of inputs) {
    lastResult = simulateBattle(input);
    sink ^= Number(lastResult?.rounds ?? lastResult?.timeline?.length ?? 0);
  }

  const elapsedMs = performance.now() - startedAt;
  return {
    status: elapsedMs <= BATTLE_TARGET_MS ? 'pass' : 'fail',
    targetMs: BATTLE_TARGET_MS,
    iterations: BATTLE_ITERATIONS,
    elapsedMs,
    meanMs: elapsedMs / BATTLE_ITERATIONS,
    operationsPerSecond: (BATTLE_ITERATIONS / elapsedMs) * 1_000,
    summary: summarizeBattle(lastResult),
    sink,
  };
}

function prepareForgeState(createInitialState) {
  const state = createInitialState();
  state.resources ??= {};

  for (const resource of [
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
    state.resources[resource] = 1_000_000_000;
  }

  state.weapons ??= [];
  state.lineup ??= [];
  return state;
}

function forgeQuality(result, state) {
  const weapon =
    result?.weapon ??
    result?.createdWeapon ??
    result?.item ??
    (result?.id ? result : undefined) ??
    state.weapons?.at(-1);

  return String(weapon?.quality ?? weapon?.rarity ?? result?.quality ?? 'unknown');
}

function runForgeBenchmark(forgeWeapon, createInitialState, createRng) {
  const baseState = prepareForgeState(createInitialState);
  const opts = {
    stage: 'iron',
    elementBias: undefined,
    useLucky: false,
    useMasterForge: false,
  };
  const distribution = new Map();
  const startedAt = performance.now();

  for (let sample = 0; sample < FORGE_SAMPLES; sample += 1) {
    const state = clone(baseState);
    const result = forgeWeapon(state, opts, createRng(sample));
    const quality = forgeQuality(result, state);
    distribution.set(quality, (distribution.get(quality) ?? 0) + 1);
  }

  const elapsedMs = performance.now() - startedAt;
  return {
    status: elapsedMs <= FORGE_TARGET_MS ? 'pass' : 'fail',
    targetMs: FORGE_TARGET_MS,
    samples: FORGE_SAMPLES,
    elapsedMs,
    meanMs: elapsedMs / FORGE_SAMPLES,
    samplesPerSecond: (FORGE_SAMPLES / elapsedMs) * 1_000,
    distribution,
  };
}

function runBoundary(name, fn) {
  try {
    const detail = fn();
    if (!finiteNumbers(detail)) {
      throw new Error('结果含 NaN 或 Infinity');
    }
    return { boundary: name, status: 'PASS', detail: String(detail) };
  } catch (error) {
    return { boundary: name, status: 'THREW', detail: errorMessage(error) };
  }
}

function skippedBoundary(name, reason) {
  return { boundary: name, status: 'SKIP', detail: reason };
}

function finiteNumbers(value, seen = new Set()) {
  if (typeof value === 'number') {
    return Number.isFinite(value);
  }
  if (!value || typeof value !== 'object' || seen.has(value)) {
    return true;
  }

  seen.add(value);
  return Object.values(value).every((child) => finiteNumbers(child, seen));
}

function probeBattleBoundaries(simulateBattle, createRng) {
  const boundaries = [];

  boundaries.push(
    runBoundary('空阵容', () => {
      const result = simulateBattle({
        ...battleFixture(0),
        rng: createRng(1),
      });
      if (!finiteNumbers(result)) throw new Error('战斗结果含 NaN 或 Infinity');
      return summarizeBattle(result);
    }),
  );

  boundaries.push(
    runBoundary('满 5 兵器', () => {
      const result = simulateBattle({
        ...battleFixture(5),
        rng: createRng(2),
      });
      if (!finiteNumbers(result)) throw new Error('战斗结果含 NaN 或 Infinity');
      return summarizeBattle(result);
    }),
  );

  boundaries.push(
    runBoundary('超大伤害', () => {
      const result = simulateBattle({
        ...battleFixture(1, {
          atk: 1_000_000_000_000_000,
          attack: 1_000_000_000_000_000,
          baseAtk: 1_000_000_000_000_000,
        }),
        enemyWaves: [[makeEnemy(0, { hp: 1, maxHp: 1, currentHp: 1 })]],
        rng: createRng(3),
      });
      if (!finiteNumbers(result)) {
        throw new Error('战斗结果含 NaN 或 Infinity');
      }
      return summarizeBattle(result);
    }),
  );

  return boundaries;
}

function probeSeedZero(createRng, simulateBattle) {
  return runBoundary('种子 0', () => {
    const firstRng = createRng(0);
    const secondRng = createRng(0);
    const draw = (rng) => {
      const next = typeof rng.nextFloat === 'function' ? rng.nextFloat : rng.next;
      if (typeof next !== 'function') {
        throw new Error('RNG 缺少 nextFloat()/next()');
      }
      return Array.from({ length: 8 }, () => next.call(rng));
    };
    const first = draw(firstRng);
    const second = draw(secondRng);

    if (!first.every(Number.isFinite) || JSON.stringify(first) !== JSON.stringify(second)) {
      throw new Error('种子 0 不可重复或产生非有限值');
    }

    if (simulateBattle) {
      const input = battleFixture();
      const battleA = simulateBattle({ ...clone(input), rng: createRng(0) });
      const battleB = simulateBattle({ ...clone(input), rng: createRng(0) });
      if (!finiteNumbers(battleA) || !finiteNumbers(battleB)) {
        throw new Error('种子 0 的战斗结果含 NaN 或 Infinity');
      }
      if (JSON.stringify(battleA) !== JSON.stringify(battleB)) {
        throw new Error('种子 0 的战斗结果不确定');
      }
    }

    return `deterministic; draws=${first.slice(0, 3).join(', ')}`;
  });
}

function probeZeroStamina(createInitialState, spend) {
  return runBoundary('0 体力', () => {
    const state = createInitialState();
    state.resources ??= {};
    state.resources.stamina = 0;
    const spent = spend(state, { stamina: 1 });
    const remaining = state.resources.stamina;

    if (spent !== false || remaining !== 0) {
      throw new Error(`spend=${String(spent)}, remaining=${String(remaining)}`);
    }
    if (!finiteNumbers(state)) {
      throw new Error('资源状态含 NaN 或 Infinity');
    }

    return 'spend=false, remaining=0';
  });
}

function printBenchmarkRows(rows) {
  console.table(
    rows.map((row) => ({
      probe: row.probe,
      status: row.status.toUpperCase(),
      runs: row.runs ?? '-',
      total_ms: row.elapsedMs?.toFixed(3) ?? '-',
      mean_ms: row.meanMs?.toFixed(6) ?? '-',
      throughput_s: row.throughput?.toFixed(1) ?? '-',
      detail: row.detail,
    })),
  );
}

async function main() {
  console.log('兵器王者 Round 2 生产模块基准 / 边界压力探针');
  console.log(`Node ${process.version}; platform=${process.platform}/${process.arch}`);

  const [rngLoad, stateLoad, forgeLoad, combatLoad] = await Promise.all([
    loadModule('rng', ['createRng']),
    loadModule('state', ['createInitialState', 'spend']),
    loadModule('forge', ['forgeWeapon']),
    loadModule('combat', ['simulateBattle']),
  ]);

  const benchmarkRows = [];
  let simulateBattle;
  let createRng;

  if (rngLoad.status === 'ok') {
    createRng = rngLoad.module.createRng;
  }
  if (combatLoad.status === 'ok') {
    simulateBattle = combatLoad.module.simulateBattle;
  }

  if (simulateBattle && createRng) {
    try {
      const battle = runBattleBenchmark(simulateBattle, createRng);
      benchmarkRows.push({
        probe: '战斗模拟',
        status: battle.status,
        runs: battle.iterations,
        elapsedMs: battle.elapsedMs,
        meanMs: battle.meanMs,
        throughput: battle.operationsPerSecond,
        detail: battle.summary,
      });
      if (battle.status !== 'pass') process.exitCode = 1;
    } catch (error) {
      benchmarkRows.push({
        probe: '战斗模拟',
        status: 'error',
        runs: 0,
        detail: errorMessage(error),
      });
      process.exitCode = 1;
    }
  } else {
    const reason = [combatLoad, rngLoad]
      .filter((load) => load.status !== 'ok')
      .map((load) => load.reason)
      .join('；');
    benchmarkRows.push({ probe: '战斗模拟', status: 'skip', detail: reason });
  }

  let forgeResult;
  if (forgeLoad.status === 'ok' && stateLoad.status === 'ok' && createRng) {
    try {
      forgeResult = runForgeBenchmark(
        forgeLoad.module.forgeWeapon,
        stateLoad.module.createInitialState,
        createRng,
      );
      benchmarkRows.push({
        probe: '锻造权重采样',
        status: forgeResult.status,
        runs: forgeResult.samples,
        elapsedMs: forgeResult.elapsedMs,
        meanMs: forgeResult.meanMs,
        throughput: forgeResult.samplesPerSecond,
        detail: [...forgeResult.distribution]
          .map(([quality, count]) => `${quality}=${count}`)
          .join(', '),
      });
      if (forgeResult.status !== 'pass') process.exitCode = 1;
    } catch (error) {
      benchmarkRows.push({
        probe: '锻造权重采样',
        status: 'error',
        runs: 0,
        detail: errorMessage(error),
      });
      process.exitCode = 1;
    }
  } else {
    const reason = [forgeLoad, stateLoad, rngLoad]
      .filter((load) => load.status !== 'ok')
      .map((load) => load.reason)
      .join('；');
    benchmarkRows.push({ probe: '锻造权重采样', status: 'skip', detail: reason });
  }

  console.log('\n基准结果');
  printBenchmarkRows(benchmarkRows);
  if (benchmarkRows.some((row) => row.status !== 'pass')) {
    process.exitCode = 1;
  }

  if (forgeResult) {
    console.log('\n锻造品质分布（1000 次）');
    console.table(
      [...forgeResult.distribution]
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([quality, count]) => ({
          quality,
          count,
          percentage: `${((count / FORGE_SAMPLES) * 100).toFixed(1)}%`,
        })),
    );
  }

  const boundaries = [];
  if (simulateBattle && createRng) {
    boundaries.push(...probeBattleBoundaries(simulateBattle, createRng));
  } else {
    const reason = '需要 combat.simulateBattle 与 rng.createRng';
    boundaries.push(
      skippedBoundary('空阵容', reason),
      skippedBoundary('满 5 兵器', reason),
      skippedBoundary('超大伤害', reason),
    );
  }

  if (createRng) {
    boundaries.push(probeSeedZero(createRng, simulateBattle));
  } else {
    boundaries.push(skippedBoundary('种子 0', rngLoad.reason));
  }

  if (stateLoad.status === 'ok') {
    boundaries.push(
      probeZeroStamina(stateLoad.module.createInitialState, stateLoad.module.spend),
    );
  } else {
    boundaries.push(skippedBoundary('0 体力', stateLoad.reason));
  }

  console.log('\n边界结果');
  console.table(boundaries);
  if (boundaries.some((row) => row.status !== 'PASS')) {
    process.exitCode = 1;
  }

  for (const row of benchmarkRows) {
    console.log(
      `RESULT ${row.probe} status=${row.status} runs=${row.runs ?? 0} detail=${JSON.stringify(
        row.detail,
      )}`,
    );
  }

  const battleRow = benchmarkRows.find((row) => row.probe === '战斗模拟');
  const forgeRow = benchmarkRows.find((row) => row.probe === '锻造权重采样');
  console.log(
    `METRIC combat runs=${battleRow?.runs ?? 0} total_ms=${battleRow?.elapsedMs?.toFixed(3) ?? 'NaN'} target_ms=${BATTLE_TARGET_MS} pass=${battleRow?.status === 'pass'}`,
  );
  console.log(
    `METRIC forge samples=${forgeRow?.runs ?? 0} total_ms=${forgeRow?.elapsedMs?.toFixed(3) ?? 'NaN'} target_ms=${FORGE_TARGET_MS} pass=${forgeRow?.status === 'pass'}`,
  );
}

await main();
