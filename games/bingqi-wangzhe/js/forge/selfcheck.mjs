#!/usr/bin/env node
/**
 * 锻造 / 经济自检 —— `node js/forge/selfcheck.mjs`
 *
 * 只依赖 core/rng + core/state + data + forge，不碰 DOM，CI 可直接跑。
 * 守住 fable-3 §1 与 §4 的四条硬承诺：
 *   1. 账号首锻至少精钢（uncommon），且同种子可复现；
 *   2. 白银/黄金炉 8 锤保底史诗不被击穿，精铁炉没有假保底；
 *   3. 幸运符 / 大师熔炉叠乘后的品质概率落在文档验收表 ±0.5pp 内；
 *   4. 挂机速率、体力消耗、掉落表与文档字面量一致；分解不返还铜钱。
 *
 * Round 3 追加两条（R2 简报 §SOTA-1「40–60 分钟到 20 关」）：
 *   5. 1–20 关体力总账：普通战 ≤ STAGE_STAMINA.normalBudgetTo20，且带重试的净支出
 *      落在 60 分钟自然供给之内；
 *   6. 扫荡：三星才开，每次 1 点体力（每日前 2 次免费），同种子可复现。
 */

import assert from 'node:assert/strict';

import { createRng } from '../core/rng.js';
import { createInitialState, hydrate, serialize } from '../core/state.js';
import {
  FORGE_COST,
  FORGE_PITY,
  FORGE_STAGES,
  IDLE_RATES,
  PROGRESSION_TARGET,
  QUALITIES,
  QUALITY_RANK,
  STAGE_BALANCE,
  STAGE_STAMINA,
  STAMINA_LEDGER_TO_20,
  STARTER_KIT,
  SWEEP_RULES,
  staminaLedger,
  staminaSupply,
} from '../data/balance.js';
import { STAGES } from '../data/stages.js';
import {
  computeQualityWeights,
  dismantleWeapon,
  forgeWeapon,
  freeSweepsLeft,
  idleRatesFor,
  normalizeWeights,
  previewForge,
  previewSweep,
  sweepStage,
  sweepableStages,
} from './index.js';

const RICH = [
  'coin',
  'iron',
  'silverOre',
  'goldOre',
  'fireCrystal',
  'iceCrystal',
  'thunderCrystal',
  'luckyCharm',
  'diamond',
];

const results = [];
let failed = 0;

function check(name, fn) {
  try {
    const detail = fn();
    results.push({ name, status: 'passed', ...(detail === undefined ? {} : { detail }) });
    console.error(`[PASS] ${name}`);
  } catch (error) {
    failed += 1;
    results.push({ name, status: 'failed', error: error?.message ?? String(error) });
    console.error(`[FAIL] ${name}: ${error?.message ?? error}`);
  }
}

function fundedState() {
  const state = createInitialState();
  for (const id of RICH) state.resources[id] = 1e12;
  return state;
}

/** 保持背包常空：自检要连锻上万次，容量不是这里的被测对象。 */
function forgeLoop(state, opts, rng, times, onResult) {
  for (let i = 0; i < times; i += 1) {
    const res = forgeWeapon(state, opts, rng);
    assert.equal(res.ok, true, `第 ${i + 1} 锤失败：${res.reason}`);
    assert.ok(res.weapon && typeof res.quality === 'string', '成功结果必须带 weapon 与 quality');
    onResult?.(res, i);
    state.weapons.length = 0;
  }
}

const pp = (x) => Math.round(x * 10000) / 100;

/* ------------------------------------------------------------------ *
 * 1. 首锻保底
 * ------------------------------------------------------------------ */

check('首锻保底至少精钢（32 个种子）', () => {
  const floor = QUALITY_RANK[FORGE_PITY.firstForgeMinQuality];
  const seen = {};
  for (let seed = 1; seed <= 32; seed += 1) {
    const state = fundedState();
    const preview = previewForge(state, { stage: 'iron' });
    assert.equal(preview.pity.isFirstForge, true, '新存档应被判为首锻');
    assert.equal(preview.qualityChances[0].chance, 0, '首锻前瞻里凡铁概率必须为 0');

    const res = forgeWeapon(state, { stage: 'iron' }, createRng(seed));
    assert.equal(res.ok, true);
    assert.ok(
      QUALITY_RANK[res.quality] >= floor,
      `种子 ${seed} 首锻出了 ${res.quality}，低于 ${FORGE_PITY.firstForgeMinQuality}`,
    );
    assert.equal(res.firstForge, true);
    assert.equal(state.forge.firstForgeDone, true, '首锻后必须落盘 forge.firstForgeDone');
    assert.equal(state.flags.firstForgeDone, true, '首锻后应同步 core 的 flags.firstForgeDone');
    seen[res.quality] = (seen[res.quality] ?? 0) + 1;
  }
  return seen;
});

check('首锻同种子可复现，第二锤不再保底', () => {
  const run = () => {
    const state = fundedState();
    const rng = createRng(0x5eed01);
    const first = forgeWeapon(state, { stage: 'iron' }, rng);
    const second = forgeWeapon(state, { stage: 'iron' }, rng);
    return [first, second];
  };
  const [a1, a2] = run();
  const [b1, b2] = run();
  assert.equal(a1.quality, b1.quality, '同种子首锻品质不一致');
  assert.equal(a2.quality, b2.quality, '同种子第二锤品质不一致');
  assert.equal(a1.firstForgeFloorApplied, FORGE_PITY.firstForgeMinQuality);
  assert.equal(a2.firstForgeFloorApplied, null, '第二锤不该再吃首锻保底');
  assert.equal(a2.firstForge, false);
  return { first: a1.quality, second: a2.quality };
});

check('老存档不白拿首锻保底', () => {
  const state = fundedState();
  state.flags.firstForgeDone = true;
  const preview = previewForge(state, { stage: 'iron' });
  assert.equal(preview.pity.isFirstForge, false);
  assert.ok(preview.qualityChances[0].chance > 0, '非首锻应能出凡铁');
  return { commonChance: preview.qualityChances[0].chance };
});

/* ------------------------------------------------------------------ *
 * 2. 8 锤史诗保底
 * ------------------------------------------------------------------ */

const EPIC = QUALITY_RANK.epic;

for (const stage of FORGE_PITY.pityTiers) {
  check(`${stage} 炉 8 锤史诗保底不击穿（20000 锤）`, () => {
    const state = fundedState();
    state.flags.firstForgeDone = true;
    state.forge = undefined; // 防御性 init 必须能从零重建
    const rng = createRng(0xbeef);
    let streak = 0;
    let worst = 0;
    let guaranteed = 0;
    let guaranteedHit = 0;

    forgeLoop(state, { stage }, rng, 20000, (res) => {
      if (res.pityFloorApplied) {
        guaranteed += 1;
        if (QUALITY_RANK[res.quality] >= EPIC) guaranteedHit += 1;
      }
      if (QUALITY_RANK[res.quality] >= EPIC) {
        worst = Math.max(worst, streak);
        streak = 0;
        assert.equal(res.pityAfter.epic, 0, '出史诗+后保底计数必须清零');
      } else {
        streak += 1;
        assert.equal(res.pityAfter.epic, streak, '保底计数应等于连续未出史诗的锤数');
        assert.ok(
          streak < FORGE_PITY.epicPityCount,
          `连续 ${streak} 锤未出史诗，超过 ${FORGE_PITY.epicPityCount} 锤保底`,
        );
      }
    });

    assert.equal(guaranteed, guaranteedHit, '触发保底的那一锤必须真的出史诗+');
    assert.ok(guaranteed > 0, '20000 锤里一次保底都没触发，保底逻辑可能没接上');
    assert.equal(state.forge.pity[stage].epic, streak, '保底计数必须落在 state.forge.pity');
    return { maxMissStreak: worst, pityTriggered: guaranteed };
  });
}

check('精铁炉不设保底（也不假装有）', () => {
  const state = fundedState();
  state.flags.firstForgeDone = true;
  const preview = previewForge(state, { stage: 'iron' });
  assert.equal(preview.pity.epicThreshold, null);
  assert.equal(preview.pity.legendaryThreshold, null);

  const rng = createRng(0xc0ffee);
  let streak = 0;
  let worst = 0;
  forgeLoop(state, { stage: 'iron' }, rng, 4000, (res) => {
    assert.equal(res.pityFloorApplied, null, '精铁炉不该触发保底');
    if (QUALITY_RANK[res.quality] >= EPIC) {
      worst = Math.max(worst, streak);
      streak = 0;
    } else {
      streak += 1;
    }
  });
  assert.ok(worst > FORGE_PITY.epicPityCount, '精铁炉理应出现长于 8 锤的空窗');
  return { maxMissStreak: Math.max(worst, streak) };
});

check('保底计数扛得住存档往返', () => {
  const state = fundedState();
  const rng = createRng(0x51ab);
  forgeLoop(state, { stage: 'silver' }, rng, 5);
  const before = JSON.parse(JSON.stringify(state.forge.pity));
  assert.ok(before.silver.epic > 0 || before.silver.legendary > 0, '样本里应已累计保底计数');

  const reloaded = hydrate(serialize(state));
  const preview = previewForge(reloaded, { stage: 'silver' });
  assert.deepEqual(reloaded.forge.pity, before, '重载后保底计数必须与存盘时一致');
  assert.equal(preview.pity.isFirstForge, false, '重载后不该再判为首锻');
  return { pity: reloaded.forge.pity.silver };
});

/* ------------------------------------------------------------------ *
 * 3. 品质概率对齐 fable-3 §1.1 验收表
 * ------------------------------------------------------------------ */

/** 文档 §1.1：白银 / 黄金炉在四种修正组合下的品质概率（百分点）。 */
const DOC_TABLE = {
  silver: {
    base: [20.0, 34.0, 28.0, 14.0, 3.6, 0.4],
    lucky: [7.5, 25.6, 39.5, 21.0, 5.7, 0.68],
    master: [17.5, 29.7, 24.5, 22.0, 5.7, 0.63],
    both: [6.2, 21.0, 32.3, 31.1, 8.5, 1.0],
  },
  gold: {
    base: [0, 16.0, 33.0, 31.0, 16.0, 4.0],
    lucky: [0, 8.7, 33.8, 33.9, 18.6, 4.9],
    master: [0, 11.4, 23.4, 39.6, 20.5, 5.1],
    both: [0, 6.0, 23.2, 41.8, 22.9, 6.1],
  },
};

const COMBOS = {
  base: { useLucky: false, useMasterForge: false },
  lucky: { useLucky: true, useMasterForge: false },
  master: { useLucky: false, useMasterForge: true },
  both: { useLucky: true, useMasterForge: true },
};

check('权重叠乘后的概率落在文档表 ±0.5pp', () => {
  const report = {};
  for (const [stage, rows] of Object.entries(DOC_TABLE)) {
    for (const [combo, expected] of Object.entries(rows)) {
      const chances = normalizeWeights(computeQualityWeights({ stage, ...COMBOS[combo] }));
      const actual = QUALITIES.map((q) => pp(chances[q]));
      actual.forEach((value, i) => {
        assert.ok(
          Math.abs(value - expected[i]) <= 0.5,
          `${stage}/${combo}/${QUALITIES[i]}：实测 ${value}pp，文档 ${expected[i]}pp`,
        );
      });
      report[`${stage}.${combo}`] = actual;
    }
  }
  return report;
});

check('精铁炉实抽分布贴合权重（20000 锤，±1pp）', () => {
  const expected = normalizeWeights(computeQualityWeights({ stage: 'iron' }));
  const state = fundedState();
  state.flags.firstForgeDone = true;
  const rng = createRng(0x1a2b3c);
  const counts = {};
  const n = 20000;
  forgeLoop(state, { stage: 'iron' }, rng, n, (res) => {
    counts[res.quality] = (counts[res.quality] ?? 0) + 1;
  });
  const actual = {};
  for (const q of QUALITIES) {
    actual[q] = pp((counts[q] ?? 0) / n);
    assert.ok(
      Math.abs(actual[q] - pp(expected[q])) <= 1,
      `${q}：实抽 ${actual[q]}pp，权重 ${pp(expected[q])}pp`,
    );
  }
  assert.equal(counts.mythic ?? 0, 0, '精铁炉权重为 0 的神话不该出现');
  return actual;
});

check('元素偏向付晶即保证主元素', () => {
  const state = fundedState();
  state.flags.firstForgeDone = true;
  const rng = createRng(0x1357);
  const before = state.resources.thunderCrystal;
  let count = 0;
  forgeLoop(state, { stage: 'silver', elementBias: 'thunder' }, rng, 500, (res) => {
    assert.equal(res.proto.element, 'thunder', `第 ${count + 1} 锤偏向失效：${res.proto.element}`);
    count += 1;
  });
  const spent = (before - state.resources.thunderCrystal) / 500;
  assert.equal(spent, 2, '元素偏向每次应扣 2 枚三相晶');
  return { forges: count, crystalPerForge: spent };
});

/* ------------------------------------------------------------------ *
 * 4. 挂机 / 关卡 / 分解
 * ------------------------------------------------------------------ */

check('挂机速率与文档公式一致', () => {
  const rows = {};
  for (const cleared of [0, 5, 10, 20, 22, 40]) {
    const state = createInitialState();
    state.campaign.highestStage = cleared;
    const { rates } = idleRatesFor(state);
    const expected = {};
    for (const [id, def] of Object.entries(IDLE_RATES)) {
      if (cleared < (def.minStage ?? 0)) continue;
      const raw = def.base + def.perStage * Math.max(0, cleared - (def.offsetStage ?? 0));
      if (raw > 0) expected[id] = Math.round(raw * 1000) / 1000;
    }
    assert.deepEqual(rates, expected, `通关 ${cleared} 关时的挂机速率不符`);
    rows[cleared] = rates;
  }
  assert.equal(rows[0].coin, 5, '零通关铜钱速率应为 5/min');
  assert.equal(rows[40].coin, 93, '40 关铜钱速率应为 93/min');
  assert.ok(rows[10].silverOre > 0 && rows[5].silverOre === undefined, '秘银应在 10 关解锁');
  assert.ok(rows[22].goldOre > 0 && rows[20].goldOre === undefined, '赤金应在 22 关解锁');
  return rows;
});

check('开局礼包锁死 360 铜钱 / 60 精铁', () => {
  assert.equal(STARTER_KIT.coin, 360, '开局铜钱必须是 360（3 锤精铁炉）');
  assert.equal(STARTER_KIT.iron, 60, '开局精铁必须是 60（3 锤精铁炉）');
  assert.equal(STARTER_KIT.coin, FORGE_COST.iron.coin * 3, '开局铜钱应始终等于 3 锤炉费');
  assert.equal(STARTER_KIT.iron, FORGE_COST.iron.iron * 3, '开局精铁应始终等于 3 锤炉费');
  assert.equal(STARTER_KIT.stamina, undefined, '开局礼包只给铜钱与精铁，体力归 core 的开局资源');
  return { ...STARTER_KIT };
});

check('开局礼包正好够 3 锤精铁炉', () => {
  const state = createInitialState();
  Object.assign(state.resources, STARTER_KIT);
  const rng = createRng(0x0301);
  let forged = 0;
  while (true) {
    const res = forgeWeapon(state, { stage: 'iron' }, rng);
    if (!res.ok) {
      assert.equal(res.reason, 'insufficient_resources', `第 ${forged + 1} 锤意外失败：${res.reason}`);
      break;
    }
    forged += 1;
    assert.ok(forged <= 4, '开局礼包锤数超出预期');
  }
  assert.equal(forged, 3, `开局礼包只够 ${forged} 锤，文档要求 3 锤`);
  return { forges: forged, kit: STARTER_KIT };
});

check('关卡表与 fable-3 §3 掉落表一致', () => {
  assert.equal(STAGES.length, STAGE_BALANCE.length, '关卡数不符');
  for (const stage of STAGES) {
    const row = STAGE_BALANCE[stage.index - 1];
    assert.equal(stage.staminaCost, row.staminaCost, `第 ${stage.index} 关体力消耗不符`);
    assert.equal(stage.isElite, row.elite, `第 ${stage.index} 关精英标记不符`);
    assert.equal(stage.firstClear.coin, row.firstClear.coin, `第 ${stage.index} 关首通铜钱不符`);
    assert.equal(
      row.firstClear.coin,
      Math.round((30 + 46 * stage.index) / 5) * 5,
      `第 ${stage.index} 关首通铜钱偏离文档公式`,
    );
    const coinDrop = stage.dropTable.find((d) => d.id === 'coin');
    assert.deepEqual([coinDrop.min, coinDrop.max], row.repeat.coin, `第 ${stage.index} 关铜钱掉落区间不符`);
    assert.equal(stage.balancePower, row.enemyPower);
  }
  const stamina = new Set(STAGES.map((s) => s.staminaCost));
  assert.deepEqual(
    [...stamina].sort((a, b) => a - b),
    [2, 3, 4, 6],
    '体力消耗应只有新手段 2 / 4 与常规段 3 / 6 四档',
  );
  for (const stage of STAGES) {
    if (stage.index <= STAGE_STAMINA.discountThroughStage) continue;
    const expected = stage.isElite ? STAGE_STAMINA.cost.elite : STAGE_STAMINA.cost.normal;
    assert.equal(stage.staminaCost, expected, `第 ${stage.index} 关不在新手段，体力应回到文档值`);
  }
  return { stages: STAGES.length, staminaCosts: [...stamina] };
});

check('分解只退矿物与碎片，铜钱不退', () => {
  const state = fundedState();
  const rng = createRng(0x2468);
  const res = forgeWeapon(state, { stage: 'silver' }, rng);
  assert.equal(res.ok, true);
  const weapon = res.weapon;
  weapon.locked = false;
  const coinBefore = state.resources.coin;
  const out = dismantleWeapon(state, weapon.uid);
  assert.equal(out.ok, true, `分解失败：${out.reason}`);
  assert.equal(out.refund.coin, undefined, '分解不得返还铜钱');
  assert.equal(state.resources.coin, coinBefore, '分解不得改动铜钱余额');
  assert.equal(out.refund.silverOre, 9, '白银炉 16 秘银应退 60% = 9');
  assert.ok(
    Object.keys(out.refund).some((id) => id.startsWith('shard')),
    '分解应产出同品质碎片',
  );
  return { quality: weapon.quality, refund: out.refund };
});

check('forgeWeapon / previewForge 返回形状未变', () => {
  const state = fundedState();
  const preview = previewForge(state, { stage: 'iron' });
  for (const key of ['ok', 'stage', 'cost', 'canAfford', 'missing', 'qualityChances', 'lucky', 'masterForge', 'pity', 'bag', 'expectedAtk']) {
    assert.ok(key in preview, `previewForge 缺少字段 ${key}`);
  }
  const res = forgeWeapon(state, { stage: 'iron' }, createRng(7));
  for (const key of ['ok', 'weapon', 'quality', 'proto', 'stats', 'cost', 'reveal']) {
    assert.ok(key in res, `forgeWeapon 缺少字段 ${key}`);
  }
  assert.equal(res.ok, true);
  assert.equal(res.weapon, state.weapons.at(-1), '锻造结果必须写进 state.weapons');
  assert.equal(typeof res.quality, 'string');

  const broke = forgeWeapon(state, { stage: 'nope' }, createRng(7));
  assert.deepEqual(broke, { ok: false, reason: 'invalid_stage' }, '非法炉应返回 { ok:false, reason }');
  const noRng = forgeWeapon(state, { stage: 'iron' }, null);
  assert.equal(noRng.reason, 'no_rng');
  return { previewKeys: Object.keys(preview).length, forgeKeys: Object.keys(res).length };
});

/* ------------------------------------------------------------------ *
 * 5. 1–20 关体力总账（R2 简报 §1：旧表 72 点会卡死 60 分钟到 20 关）
 * ------------------------------------------------------------------ */

check('1–20 关体力总账在 60 分钟供给之内', () => {
  const ledger = STAMINA_LEDGER_TO_20;
  const rows = STAGE_BALANCE.filter((row) => row.id <= PROGRESSION_TARGET.stage);

  const normal = rows.filter((r) => !r.elite).reduce((sum, r) => sum + r.staminaCost, 0);
  const elite = rows.filter((r) => r.elite).reduce((sum, r) => sum + r.staminaCost, 0);
  const refund = rows.reduce((sum, r) => sum + (r.firstClear.stamina ?? 0), 0);

  assert.equal(ledger.normal, normal, '总账的普通战体力与关卡表对不上');
  assert.equal(ledger.elite, elite, '总账的精英战体力与关卡表对不上');
  assert.equal(ledger.refund, refund, '总账的首通返还与关卡表对不上');
  assert.equal(ledger.gross, normal + elite);
  assert.equal(ledger.net, ledger.gross - ledger.refund);
  assert.deepEqual({ ...staminaLedger(PROGRESSION_TARGET.stage) }, { ...ledger }, '总账函数与常量不一致');

  assert.ok(
    normal <= STAGE_STAMINA.normalBudgetTo20,
    `1–20 关普通战合计 ${normal} 点，超出预算 ${STAGE_STAMINA.normalBudgetTo20}`,
  );

  const supply = staminaSupply(PROGRESSION_TARGET.minutesMax);
  assert.ok(
    ledger.gross <= supply,
    `全胜也要 ${ledger.gross} 点，而 60 分钟只供给 ${supply} 点`,
  );
  assert.ok(
    ledger.withRetries <= supply,
    `带 ${PROGRESSION_TARGET.retryRatio * 100}% 重试要 ${ledger.withRetries} 点，超出 60 分钟供给 ${supply} 点`,
  );

  // 实跑（60 分钟、16 种子）里 1–20 关会吃 10–14 场败仗，接近「每关打两遍」。
  assert.ok(
    ledger.gross * 2 - ledger.refund <= supply,
    `每关打两遍要 ${ledger.gross * 2 - ledger.refund} 点，超出 60 分钟供给 ${supply} 点`,
  );

  // 40 分钟这条下限也要成立，否则「40–60 分钟」只有上界有意义。
  assert.ok(
    ledger.net <= staminaSupply(PROGRESSION_TARGET.minutesMin),
    `净支出 ${ledger.net} 点超出 40 分钟供给 ${staminaSupply(PROGRESSION_TARGET.minutesMin)} 点`,
  );

  // 逐关递增：新手段不能比后面贵。
  let prev = 0;
  for (const row of rows) {
    if (row.elite) continue;
    assert.ok(row.staminaCost >= prev, `第 ${row.id} 关普通战体力比前面便宜，曲线倒挂`);
    prev = row.staminaCost;
  }

  return {
    ledger: { ...ledger },
    supply60: supply,
    supply40: staminaSupply(PROGRESSION_TARGET.minutesMin),
    旧表: '全程 3/6 时为 72 点，已超 60 分钟供给',
  };
});

check('逐分钟推演：体力不再是 20 关前的瓶颈', () => {
  // 一分钟一动的积极玩家（与 bench/economy-sim.mjs 的策略同构）：
  // 每 3 关吃一次失败重打，精英关首通返还即时到账。
  const attemptsFor = (index) => (index % 3 === 0 ? 2 : 1);
  const regenPerMinute = 60000 / 720000; // STAMINA.regenMs = 6min → 1/6 点每分钟

  let stamina = PROGRESSION_TARGET.startStamina;
  let carry = 0;
  let stage = 1;
  let attempt = 0;
  let waits = 0;
  let reachedAt = null;

  for (let minute = 1; minute <= PROGRESSION_TARGET.minutesMax && reachedAt === null; minute += 1) {
    carry += regenPerMinute;
    const ticks = Math.floor(carry);
    carry -= ticks;
    stamina = Math.min(120, stamina + ticks);

    const row = STAGE_BALANCE[stage - 1];
    if (stamina < row.staminaCost) {
      waits += 1;
      continue;
    }
    stamina -= row.staminaCost;
    attempt += 1;
    if (attempt < attemptsFor(stage)) continue;

    stamina += row.firstClear.stamina ?? 0;
    attempt = 0;
    if (stage === PROGRESSION_TARGET.stage) {
      reachedAt = minute;
      break;
    }
    stage += 1;
  }

  assert.notEqual(reachedAt, null, `60 分钟内没能推到第 ${PROGRESSION_TARGET.stage} 关`);
  assert.ok(
    reachedAt <= PROGRESSION_TARGET.minutesMax,
    `到第 ${PROGRESSION_TARGET.stage} 关用了 ${reachedAt} 分钟，超出 ${PROGRESSION_TARGET.minutesMax} 分钟`,
  );
  assert.equal(waits, 0, `推演里有 ${waits} 分钟在干等体力，体力仍是瓶颈`);
  assert.ok(stamina >= 0, '推演出现负体力');

  return { 到达第20关分钟: reachedAt, 等体力分钟: waits, 剩余体力: Math.round(stamina) };
});

/* ------------------------------------------------------------------ *
 * 6. 扫荡
 * ------------------------------------------------------------------ */

const SWEEP_STAGE_ID = 'stage_03';

function sweepReadyState(stars = SWEEP_RULES.minStars, stamina = 30) {
  const state = createInitialState();
  state.resources.stamina = stamina;
  state.campaign.cleared = 6;
  state.campaign.highestStage = 6;
  state.campaign.stars[SWEEP_STAGE_ID] = stars;
  return state;
}

check('扫荡三星才开，未达标只给 sweep_locked', () => {
  for (const stars of [0, 1, 2]) {
    const state = sweepReadyState(stars);
    const preview = previewSweep(state, SWEEP_STAGE_ID);
    assert.equal(preview.ok, true);
    assert.equal(preview.unlocked, false, `${stars} 星不该解锁扫荡`);
    assert.equal(preview.canSweep, false);

    const res = sweepStage(state, SWEEP_STAGE_ID, { times: 1 }, createRng(1));
    assert.equal(res.ok, false);
    assert.equal(res.reason, 'sweep_locked', `${stars} 星扫荡应被拒`);
    assert.equal(state.resources.stamina, 30, '被拒的扫荡不得扣体力');
  }
  const ready = sweepReadyState();
  assert.equal(previewSweep(ready, SWEEP_STAGE_ID).unlocked, true, '三星应解锁扫荡');
  assert.equal(sweepableStages(ready).length, 1, '可扫荡列表应只含三星关卡');
  return { requiredStars: SWEEP_RULES.minStars };
});

check('扫荡每次 1 点体力，每日前 2 次免体力', () => {
  const state = sweepReadyState();
  assert.equal(freeSweepsLeft(state), SWEEP_RULES.freeDaily);

  const rng = createRng(0x77ee);
  const spent = [];
  for (let i = 0; i < 5; i += 1) {
    const before = state.resources.stamina;
    const res = sweepStage(state, SWEEP_STAGE_ID, { times: 1 }, rng);
    assert.equal(res.ok, true, `第 ${i + 1} 次扫荡失败：${res.reason}`);
    assert.equal(res.times, 1);
    spent.push(before - state.resources.stamina);
  }
  assert.deepEqual(spent, [0, 0, 1, 1, 1], '前 2 次应免体力，其后每次 1 点');
  assert.equal(state.campaign.daily.sweep, 5, '扫荡次数必须落在 campaign.daily.sweep');
  assert.equal(freeSweepsLeft(state), 0);

  // 体力见底时明确失败，不许透支
  state.resources.stamina = 0;
  const broke = sweepStage(state, SWEEP_STAGE_ID, { times: 1 }, rng);
  assert.equal(broke.ok, false);
  assert.equal(broke.reason, 'insufficient_stamina');
  assert.equal(state.resources.stamina, 0, '失败的扫荡不得扣成负数');
  return { staminaPerRun: SWEEP_RULES.staminaCost, spent };
});

check('扫荡产出只来自重复掉落表，同种子可复现', () => {
  const dropIds = new Set(STAGES[2].dropTable.map((d) => d.id));
  const run = () => {
    const state = sweepReadyState(SWEEP_RULES.minStars, 40);
    const res = sweepStage(state, SWEEP_STAGE_ID, { times: 6 }, createRng(0xd0e1));
    assert.equal(res.ok, true, `扫荡失败：${res.reason}`);
    return res;
  };
  const a = run();
  const b = run();
  assert.deepEqual(a.gains, b.gains, '同种子扫荡产出不一致');
  assert.equal(a.times, 6);
  assert.equal(a.runs.length, 6, '每次扫荡都要单列一份掉落');
  assert.ok(Object.keys(a.gains).length > 0, '扫荡没有任何产出');
  for (const id of Object.keys(a.gains)) {
    assert.ok(dropIds.has(id), `扫荡掉出了不在重复掉落表里的 ${id}`);
  }
  assert.equal(a.gains.diamond, undefined, '扫荡不得发放首通奖励');
  return { times: a.times, gains: a.gains, staminaSpent: a.staminaSpent };
});

check('扫荡不推进度，也不超过单次上限', () => {
  const state = sweepReadyState(SWEEP_RULES.minStars, 100);
  const before = { cleared: state.campaign.cleared, highest: state.campaign.highestStage };
  const res = sweepStage(state, SWEEP_STAGE_ID, { times: 99 }, createRng(0x2f2f));
  assert.equal(res.ok, true);
  assert.equal(res.times, SWEEP_RULES.maxBatch, `单次扫荡应封顶 ${SWEEP_RULES.maxBatch} 次`);
  assert.equal(state.campaign.cleared, before.cleared, '扫荡不得推进关卡进度');
  assert.equal(state.campaign.highestStage, before.highest, '扫荡不得推进最高关卡');
  assert.equal(state.campaign.stars[SWEEP_STAGE_ID], SWEEP_RULES.minStars, '扫荡不得改星数');

  // 体力不够扫满时按能扫几次扫几次，并如实报告
  const poor = sweepReadyState(SWEEP_RULES.minStars, 2);
  poor.campaign.daily.sweep = SWEEP_RULES.freeDaily;
  const partial = sweepStage(poor, SWEEP_STAGE_ID, { times: 8 }, createRng(0x3a3a));
  assert.equal(partial.ok, true);
  assert.equal(partial.times, 2, '2 点体力只够扫 2 次');
  assert.equal(partial.requested, 8);
  assert.equal(partial.partial, true);
  assert.equal(poor.resources.stamina, 0);

  // 没有随机源就明确失败，不许偷偷用 Math.random
  const noRng = sweepStage(sweepReadyState(), SWEEP_STAGE_ID, { times: 1 }, null);
  assert.equal(noRng.reason, 'no_rng');
  const unknown = sweepStage(sweepReadyState(), 'stage_99', { times: 1 }, createRng(1));
  assert.equal(unknown.reason, 'unknown_stage');
  return { maxBatch: SWEEP_RULES.maxBatch, partial: partial.times };
});

const summary = {
  ok: failed === 0,
  totals: { passed: results.filter((r) => r.status === 'passed').length, failed },
  checks: results,
};
console.log(JSON.stringify(summary, null, 2));
process.exitCode = failed === 0 ? 0 : 1;
