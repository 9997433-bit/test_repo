#!/usr/bin/env node
/**
 * 战斗时间轴自检 —— `node js/combat/selfcheck.mjs`
 *
 * 只依赖 combat 自己（不碰 core / data / DOM），CI 可直接跑。
 * 守住 Round 3 的四条硬承诺：
 *   1. `STATUS_INFO` 每条都有可画的 `icon`，别名与未知 id 都能取到图标；
 *   2. `type` 为 damage / skill / kill 的事件**恒带**全套 `EVENT_RICH_FIELDS`；
 *   3. 富字段语义正确：AOE 溅射、多段连击、状态归属、BOSS 出手/挨打/被击破各自可辨；
 *   4. 老契约一字未动：`type ∈ EVENT_TYPES`、`t === subtype`，
 *      且固定种子的战报指纹与加富字段之前逐字一致（rng 消耗次序没被碰过）。
 */

import assert from 'node:assert/strict';

import {
  EVENT_RICH_FIELDS,
  EVENT_SUBTYPES,
  EVENT_TYPES,
  STATUS_INFO,
  normalizeStatusId,
  simulateBattle,
  skillCastHints,
  statusIcon,
  statusInfo,
} from './index.js';

/**
 * 加富字段**之前**（Round 2 末，commit d15aa4e）由同一场景算出的战报指纹。
 * 指纹只取 Round 2 就存在的字段，所以它一漂移就意味着随机流被动了，
 * 历史种子的战报重播会静默改写——真要改数值，请同步 `ENGINE_VERSION`。
 */
const GOLDEN_FINGERPRINT = 'fnv1a:e896bfc9:15918';
const FINGERPRINT_SEED = 0x7b3c9a1;

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

/* ------------------------------------------------------------------ *
 * 固定场景：一波杂兵 + 一波 BOSS，覆盖溅射 / 多段 / DOT / 反伤 / 击破
 * ------------------------------------------------------------------ */

function scenario() {
  const playerWeapons = [
    {
      id: 'p-fire-sword',
      name: '赤霄剑',
      type: 'sword',
      element: 'fire',
      quality: 'epic',
      level: 12,
      atk: 96,
      hp: 780,
      speed: 106,
      crit: 0.18,
      skills: ['blaze_slash', 'double_strike'],
    },
    {
      id: 'p-thunder-bow',
      name: '惊雷弩',
      type: 'crossbow',
      element: 'thunder',
      quality: 'rare',
      level: 10,
      atk: 84,
      hp: 620,
      speed: 96,
      crit: 0.12,
      skills: ['thunder_chain', 'whirlwind'],
    },
    {
      id: 'p-ice-umbrella',
      name: '玄冰伞',
      type: 'umbrella',
      element: 'ice',
      quality: 'rare',
      level: 9,
      atk: 62,
      hp: 900,
      speed: 94,
      crit: 0.05,
      thorns: 0.2,
      skills: ['forge_mend', 'guard_stance'],
    },
  ];

  const enemyWaves = [
    {
      name: '寒渊前哨',
      units: [
        { id: 'e1', name: '冰俑甲', element: 'ice', atk: 58, hp: 520, speed: 92, skills: ['frost_lock'] },
        { id: 'e2', name: '冰俑乙', element: 'ice', atk: 54, hp: 480, speed: 88, skills: ['pierce_shot'] },
        { id: 'e3', name: '雷隼', element: 'thunder', atk: 66, hp: 400, speed: 118, skills: ['sk_e_maidian'] },
      ],
    },
    {
      name: '烛龙关',
      units: [
        {
          id: 'boss',
          name: '烛龙',
          element: 'fire',
          quality: 'legendary',
          atk: 108,
          hp: 2600,
          speed: 100,
          isBoss: true,
          skills: ['sk_e_wuxiang_beng', 'thorn_armor', 'sk_e_kuangnu'],
        },
        { id: 'e4', name: '炉卫甲', element: 'fire', atk: 62, hp: 640, speed: 90, skills: ['blaze_slash'] },
        { id: 'e5', name: '炉卫乙', element: 'fire', atk: 60, hp: 600, speed: 86, skills: ['blood_drink'] },
      ],
    },
  ];

  return { playerWeapons, enemyWaves, seed: FINGERPRINT_SEED, speed: 1 };
}

/** BOSS 必死的一边倒战局：专门用来看 kill 事件的 BOSS 归属。 */
function bossSlayScenario() {
  return {
    seed: 0x51a10,
    playerWeapons: [
      {
        id: 'p-slayer',
        name: '斩龙客',
        type: 'blade',
        element: 'thunder',
        quality: 'mythic',
        level: 30,
        atk: 900,
        hp: 4000,
        speed: 140,
        skills: ['execute'],
      },
    ],
    enemyWaves: [
      {
        name: '孤龙',
        units: [{ id: 'lone-boss', name: '朽龙', element: 'fire', atk: 20, hp: 300, speed: 40, isBoss: true }],
      },
    ],
  };
}

/** 全员杂兵：用来反证 BOSS 标记不是恒真。 */
function mobOnlyScenario() {
  return {
    seed: 0x11f0,
    playerWeapons: [
      { id: 'p-a', name: '短刃', element: 'fire', atk: 70, hp: 500, speed: 100, skills: ['whirlwind'] },
    ],
    enemyWaves: [
      {
        name: '游卒',
        units: [
          { id: 'm1', name: '游卒甲', element: 'ice', atk: 40, hp: 300, speed: 90 },
          { id: 'm2', name: '游卒乙', element: 'ice', atk: 40, hp: 300, speed: 88 },
        ],
      },
    ],
  };
}

/**
 * 只取 Round 2 就已存在的字段做指纹：新增的富字段不参与，
 * 因此指纹一旦漂移就说明 rng 消耗次序被动过了。
 */
function fingerprint(result) {
  const parts = [
    `winner=${result.winner}`,
    `rounds=${result.rounds}`,
    `grade=${result.grade}`,
    `events=${result.timeline.length}`,
    `duration=${result.durationMs}`,
    `damage=${result.stats.damageDealt}/${result.stats.damageTaken}`,
    `rewards=${JSON.stringify(result.rewards)}`,
  ];
  for (const ev of result.timeline) {
    parts.push([
      ev.seq,
      ev.at,
      ev.t,
      ev.actorUid ?? '',
      ev.targetUid ?? '',
      ev.damage ?? '',
      ev.crit ?? '',
      ev.amount ?? '',
      ev.hp ?? '',
      ev.text ?? '',
    ].join('|'));
  }
  const text = parts.join('\n');
  let h = 2166136261 >>> 0;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return `fnv1a:${(h >>> 0).toString(16)}:${text.length}`;
}

const RICH_TYPES = new Set(['damage', 'skill', 'kill']);

const battle = simulateBattle(scenario());
const timeline = battle.timeline;
const richEvents = timeline.filter((ev) => RICH_TYPES.has(ev.type));
const damages = timeline.filter((ev) => ev.t === 'damage');

/* ------------------------------------------------------------------ *
 * 1. 状态图标
 * ------------------------------------------------------------------ */

check('STATUS_INFO 每条都有图标', () => {
  const ids = Object.keys(STATUS_INFO);
  assert.ok(ids.length >= 11, `状态表缩水到 ${ids.length} 条`);
  for (const id of ids) {
    const info = STATUS_INFO[id];
    assert.equal(info.id, id, `${id} 的 id 字段与键不一致`);
    assert.equal(typeof info.icon, 'string', `${id} 缺少 icon`);
    assert.ok(info.icon.length > 0, `${id} 的 icon 是空串`);
    assert.match(info.color, /^#[0-9a-f]{6}$/i, `${id} 的 color 不是十六进制色值`);
    // 结算语义不许被展示字段挤掉
    assert.equal(typeof info.name, 'string');
    assert.equal(typeof info.bad, 'boolean');
  }
  return { count: ids.length, icons: Object.fromEntries(ids.map((id) => [id, STATUS_INFO[id].icon])) };
});

check('statusIcon 认旧名，未知 id 有兜底', () => {
  assert.equal(statusIcon('burn'), STATUS_INFO.burn.icon);
  // 旧名（fable-2 规格 §1.2）走 STATUS_ALIASES 折到权威 id
  assert.equal(normalizeStatusId('stun'), 'freeze');
  assert.equal(statusIcon('stun'), STATUS_INFO.freeze.icon);
  assert.equal(statusIcon('slow'), STATUS_INFO.chill.icon);
  assert.equal(statusIcon('defDown'), STATUS_INFO.mark.icon);
  // 未知 id 不抛错、不返回空
  const unknown = statusInfo('no_such_status');
  assert.equal(unknown.id, 'no_such_status');
  assert.ok(unknown.icon.length > 0, '未知状态没有兜底图标');
  assert.equal(statusIcon(null), null, 'id 为空时应返回 null');
  return { stun: statusIcon('stun'), unknown: unknown.icon };
});

/* ------------------------------------------------------------------ *
 * 2. 老契约没被碰
 * ------------------------------------------------------------------ */

check('timeline 老契约不变（type / subtype / t）', () => {
  assert.ok(timeline.length > 0, '空时间轴');
  for (const ev of timeline) {
    assert.ok(EVENT_TYPES.includes(ev.type), `非法 type：${ev.type}`);
    assert.ok(EVENT_SUBTYPES.includes(ev.subtype), `非法 subtype：${ev.subtype}`);
    assert.equal(ev.t, ev.subtype, '旧字段 t 必须与 subtype 同值');
    assert.equal(typeof ev.seq, 'number');
    assert.equal(typeof ev.text, 'string');
  }
  return { events: timeline.length, types: [...new Set(timeline.map((e) => e.t))] };
});

check('同种子逐字复现', () => {
  const again = simulateBattle(scenario());
  assert.deepEqual(again, battle, '同种子两次模拟结果不一致');
  return { seed: FINGERPRINT_SEED, winner: battle.winner, rounds: battle.rounds };
});

check('富字段不消耗随机数（指纹对齐 Round 2）', () => {
  const actual = fingerprint(battle);
  assert.equal(
    actual,
    GOLDEN_FINGERPRINT,
    `战报指纹漂移：${actual} ≠ ${GOLDEN_FINGERPRINT}，随机流或旧字段被改动了`,
  );
  return { fingerprint: actual };
});

/* ------------------------------------------------------------------ *
 * 3. 富字段恒在
 * ------------------------------------------------------------------ */

check('damage / skill / kill 恒带全套富字段', () => {
  assert.ok(richEvents.length > 20, `样本太少：${richEvents.length}`);
  for (const ev of richEvents) {
    for (const key of EVENT_RICH_FIELDS) {
      assert.ok(key in ev, `${ev.t}#${ev.seq} 缺字段 ${key}`);
    }
    assert.ok(ev.statusId === null || typeof ev.statusId === 'string', 'statusId 只能是 string | null');
    assert.ok(ev.statusIcon === null || typeof ev.statusIcon === 'string');
    assert.equal(ev.statusIcon, ev.statusId ? statusIcon(ev.statusId) : null, 'statusIcon 与 statusId 不一致');
    for (const key of ['aoe', 'multiHit', 'boss', 'bossActor', 'bossTarget']) {
      assert.equal(typeof ev[key], 'boolean', `${key} 必须是布尔`);
    }
    for (const key of ['hitIndex', 'hitCount']) {
      assert.ok(ev[key] === null || Number.isInteger(ev[key]), `${key} 必须是整数或 null`);
    }
    if (ev.hitIndex !== null && ev.hitCount !== null) {
      assert.ok(ev.hitIndex >= 1 && ev.hitIndex <= ev.hitCount, `hitIndex 越界：${ev.hitIndex}/${ev.hitCount}`);
    }
    assert.equal(ev.boss, ev.bossActor || ev.bossTarget, 'boss 必须是 bossActor / bossTarget 的并');
    if (ev.statusId) assert.equal(ev.statusId, normalizeStatusId(ev.statusId), 'statusId 必须是权威 id');
  }
  return {
    checked: richEvents.length,
    byType: Object.fromEntries(
      [...RICH_TYPES].map((t) => [t, richEvents.filter((e) => e.type === t).length]),
    ),
  };
});

/* ------------------------------------------------------------------ *
 * 4. 语义正确
 * ------------------------------------------------------------------ */

check('AOE 与单体可辨', () => {
  const aoe = damages.filter((ev) => ev.aoe);
  const single = damages.filter((ev) => !ev.aoe);
  assert.ok(aoe.length > 0, '整场没有一条 AOE 伤害');
  assert.ok(single.length > 0, '整场没有一条单体伤害');
  for (const ev of aoe) {
    // 溅射是「一段打多人」，不能同时被当成多段连击
    assert.equal(ev.multiHit, false, `AOE 伤害不该带 multiHit：${ev.label}`);
    assert.ok(ev.hitCount >= 1, 'AOE 伤害应报溅射目标数');
  }
  // 单体技的伤害不许被误标成 AOE
  for (const ev of damages.filter((e) => e.label === '烈焰斩' || e.label?.startsWith('连环击'))) {
    assert.equal(ev.aoe, false, `${ev.label} 被误标为 AOE`);
  }
  const aoeLabels = [...new Set(aoe.map((e) => e.label))];
  assert.ok(aoeLabels.includes('旋风斩'), '旋风斩没被标成 AOE');
  return { aoeHits: aoe.length, singleHits: single.length, aoeLabels };
});

check('多段技逐段编号', () => {
  const chain = damages.filter((ev) => ev.label?.startsWith('雷链'));
  assert.ok(chain.length >= 3, `雷链样本不足：${chain.length}`);
  for (const ev of chain) {
    assert.equal(ev.multiHit, true, '雷链每跳都应是多段');
    assert.equal(ev.aoe, false, '雷链是跳跃多段，不是溅射');
    assert.equal(ev.statusId, 'shock', '雷链应预告感电');
  }
  // 第一次施放的三跳必须编号 1/2/3
  const firstCast = chain.slice(0, 3).map((ev) => `${ev.hitIndex}/${ev.hitCount}`);
  assert.deepEqual(firstCast, ['1/3', '2/3', '3/3'], `雷链编号异常：${firstCast.join(' ')}`);

  const combo = damages.filter((ev) => ev.label?.startsWith('连环击'));
  assert.ok(combo.length >= 2, '连环击样本不足');
  for (const ev of combo) assert.equal(ev.multiHit, true, '连环击两段都应是多段');
  return { chainHits: chain.length, comboHits: combo.length, firstCast };
});

check('statusId 指向真正的状态', () => {
  const blaze = damages.filter((ev) => ev.label === '烈焰斩');
  assert.ok(blaze.length > 0, '没打出烈焰斩');
  for (const ev of blaze) assert.equal(ev.statusId, 'burn', '烈焰斩应预告灼烧');

  const dots = timeline.filter((ev) => ev.t === 'dot');
  assert.ok(dots.length > 0, '整场没有 DOT');
  for (const ev of dots) {
    assert.ok(['burn', 'shock'].includes(ev.statusId), `DOT 状态异常：${ev.statusId}`);
    assert.equal(ev.type, 'damage', 'DOT 的规范类型仍是 damage');
    assert.equal(ev.statusIcon, STATUS_INFO[ev.statusId].icon);
    assert.equal(ev.aoe, false, 'DOT 不属于任何一次施放，不该继承 AOE');
  }

  const thorns = damages.filter((ev) => ev.tag === 'thorns');
  assert.ok(thorns.length > 0, '整场没有棘甲反伤');
  for (const ev of thorns) assert.equal(ev.statusId, 'thorns', '反伤应归属棘甲');

  // status 事件也带上图标，状态条不用再查表
  const statusEvents = timeline.filter((ev) => ev.t === 'status');
  assert.ok(statusEvents.length > 0, '整场没有状态事件');
  for (const ev of statusEvents) assert.equal(ev.statusIcon, statusIcon(ev.statusId));
  return { blaze: blaze.length, dots: dots.length, thorns: thorns.length, statusEvents: statusEvents.length };
});

check('技能事件带该技的状态清单', () => {
  const skills = timeline.filter((ev) => ev.t === 'skill');
  assert.ok(skills.length > 0, '整场没有技能事件');
  for (const ev of skills) {
    assert.ok(Array.isArray(ev.statusIds), `${ev.skillId} 缺少 statusIds`);
    const hints = skillCastHints(ev.skillId);
    assert.deepEqual([...ev.statusIds], [...hints.statusIds], `${ev.skillId} 的状态清单与定义不符`);
    assert.equal(ev.statusId, hints.statusId, `${ev.skillId} 的主状态与定义不符`);
    assert.equal(ev.aoe, hints.aoe, `${ev.skillId} 的 aoe 与定义不符`);
    assert.equal(ev.multiHit, hints.multiHit, `${ev.skillId} 的 multiHit 与定义不符`);
  }
  assert.equal(skillCastHints('guard_stance').aoe, true, '全队技应算群体');
  assert.equal(skillCastHints('blaze_slash').aoe, false, '单体技不该算群体');
  return { skills: skills.length, sample: skills[0].skillId };
});

/* ------------------------------------------------------------------ *
 * 5. BOSS 差异
 * ------------------------------------------------------------------ */

check('BOSS 出手 / 挨打分得清', () => {
  const bossActor = richEvents.filter((ev) => ev.bossActor);
  const bossTarget = richEvents.filter((ev) => ev.bossTarget);
  assert.ok(bossActor.length > 0, 'BOSS 一次都没出手');
  assert.ok(bossTarget.length > 0, 'BOSS 一次都没挨打');
  for (const ev of bossActor) assert.equal(ev.actor, '烛龙', `bossActor 指到了 ${ev.actor}`);
  for (const ev of bossTarget) assert.equal(ev.target, '烛龙', `bossTarget 指到了 ${ev.target}`);
  // 杂兵波（wave 1）里不该冒出 BOSS 标记
  const mobWave = richEvents.filter((ev) => ev.wave === 1);
  assert.ok(mobWave.length > 0, '第一波没有事件');
  assert.equal(mobWave.some((ev) => ev.boss), false, '杂兵波误报 BOSS');
  // 波次事件也预告 BOSS，UI 可以提前切镜头
  const waves = timeline.filter((ev) => ev.t === 'wave');
  assert.deepEqual(waves.map((ev) => ev.boss), [false, true], '波次 BOSS 预告不对');
  return { bossActor: bossActor.length, bossTarget: bossTarget.length };
});

check('BOSS 被击破可辨', () => {
  const slain = simulateBattle(bossSlayScenario());
  assert.equal(slain.winner, 'player', '一边倒战局竟然没赢');
  const kills = slain.timeline.filter((ev) => ev.t === 'kill');
  assert.equal(kills.length, 1, `击破事件数异常：${kills.length}`);
  assert.equal(kills[0].bossTarget, true, 'BOSS 被击破却没标 bossTarget');
  assert.equal(kills[0].boss, true);
  assert.equal(kills[0].target, '朽龙');
  return { kill: kills[0].text };
});

check('无 BOSS 战局全程 boss=false', () => {
  const mobs = simulateBattle(mobOnlyScenario());
  const rich = mobs.timeline.filter((ev) => RICH_TYPES.has(ev.type));
  assert.ok(rich.length > 0, '样本为空');
  for (const ev of rich) {
    assert.equal(ev.boss, false, `杂兵战出现 BOSS 标记：${ev.text}`);
    assert.equal(ev.bossActor, false);
    assert.equal(ev.bossTarget, false);
  }
  assert.equal(mobs.timeline.filter((ev) => ev.t === 'wave').every((ev) => ev.boss === false), true);
  return { checked: rich.length };
});

/* ------------------------------------------------------------------ *
 * 6. 边界
 * ------------------------------------------------------------------ */

check('空阵容仍返回合法富字段战报', () => {
  for (const [name, input] of [
    ['双方皆空', { playerWeapons: [], enemyWaves: [] }],
    ['我方空', { playerWeapons: [], enemyWaves: [[{ id: 'x', name: '孤兵', atk: 10, hp: 10 }]] }],
    ['敌方空', { playerWeapons: [{ id: 'y', name: '孤器', atk: 10, hp: 10 }], enemyWaves: [] }],
  ]) {
    const result = simulateBattle({ ...input, seed: 7 });
    assert.ok(Array.isArray(result.timeline), `${name}：没有 timeline`);
    for (const ev of result.timeline) {
      assert.ok(EVENT_TYPES.includes(ev.type), `${name}：非法 type ${ev.type}`);
      if (!RICH_TYPES.has(ev.type)) continue;
      for (const key of EVENT_RICH_FIELDS) assert.ok(key in ev, `${name}：缺字段 ${key}`);
    }
  }
  return { cases: 3 };
});

const summary = {
  ok: failed === 0,
  totals: { passed: results.filter((r) => r.status === 'passed').length, failed },
  fingerprint: { seed: FINGERPRINT_SEED, golden: GOLDEN_FINGERPRINT },
  checks: results,
};

console.log(JSON.stringify(summary, null, 2));
process.exitCode = failed === 0 ? 0 : 1;
