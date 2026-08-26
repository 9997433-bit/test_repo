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
 */

import assert from 'node:assert/strict';

import { createRng } from '../core/rng.js';
import { createInitialState, hydrate, serialize } from '../core/state.js';
import {
  FORGE_PITY,
  FORGE_STAGES,
  IDLE_RATES,
  QUALITIES,
  QUALITY_RANK,
  STAGE_BALANCE,
  STARTER_KIT,
} from '../data/balance.js';
import { STAGES } from '../data/stages.js';
import {
  computeQualityWeights,
  dismantleWeapon,
  forgeWeapon,
  idleRatesFor,
  normalizeWeights,
  previewForge,
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
  assert.deepEqual([...stamina].sort((a, b) => a - b), [3, 6], '体力消耗应只有 3 / 6 两档');
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

const summary = {
  ok: failed === 0,
  totals: { passed: results.filter((r) => r.status === 'passed').length, failed },
  checks: results,
};
console.log(JSON.stringify(summary, null, 2));
process.exitCode = failed === 0 ? 0 : 1;
