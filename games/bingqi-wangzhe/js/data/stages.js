/**
 * 主线试炼 — 40 关，8 章，每 5 关一个精英 BOSS。纯数据，无副作用。
 *
 * 章节表与关卡名为手写；**经济字段**（体力、首通、重复掉落）逐关取自
 * `balance.STAGE_BALANCE`（fable-3 §3 的 400 种子校准表），
 * **战斗字段**（recommendPower / waves / 敌人面板）仍由本文件的曲线算出 ——
 * 文档的 enemyPower 是按 baseAtk 20–32 的原型标定的，而 data/weapons.js 的原型高约 1.5 倍，
 * 直接换会让整条难度曲线失真。文档值另存为 `stage.balancePower` 供经济回归比对，
 * 等 opus-3 的实战引擎重跑天级投影后再统一（fable-3 §11-1）。
 */

import {
  ELEMENT_CRYSTAL,
  SHARD_RESOURCE,
  SLOT_UNLOCK_STAGES,
  STAGE_BALANCE,
  SWEEP_RULES,
} from './balance.js';

/** 关卡数值锚点：第 1 关 120 战力，第 40 关 30000 战力，指数插值。 */
const POWER_START = 120;
const POWER_END = 30000;
const STAGE_COUNT = 40;
const POWER_STEP = (POWER_END / POWER_START) ** (1 / (STAGE_COUNT - 1));

const ELITE_POWER_SCALE = 1.35;

const round = (n) => Math.round(n);

const CHAPTERS = [
  {
    id: 'ch_luobian',
    name: '炉边镇',
    subtitle: '火起于灶，兵起于市',
    element: 'fire',
    mobs: ['铁市闲汉', '废窑野狗', '挑担的贼', '炉灰里的手', '断秤打手'],
    boss: { name: '镇口铁面人', title: '第一个不肯让路的人', skillId: 'sk_e_fenshen_zhan' },
    stages: [
      { name: '晨炉初响', title: '第一锤总是最轻的' },
      { name: '铁市口角', title: '争的不是价钱' },
      { name: '废窑野狗', title: '窑塌了，狗还守着' },
      { name: '挑担的贼', title: '担子里不是货' },
      { name: '镇口铁面', title: '面具下没有脸' },
    ],
  },
  {
    id: 'ch_duanyue',
    name: '断岳关',
    subtitle: '雷劈过的石头最硬',
    element: 'thunder',
    mobs: ['关下游卒', '断桥拦路者', '雷打的松', '塌方里的影', '铜哨兵'],
    boss: { name: '守关铜甲将', title: '他守的关早就没了', skillId: 'sk_e_leiting_pu' },
    stages: [
      { name: '关下石道', title: '石头缝里长着刀' },
      { name: '断桥拦路', title: '过桥要留下点什么' },
      { name: '雷打的松', title: '烧焦了还站着' },
      { name: '塌方隘口', title: '路是自己挖出来的' },
      { name: '铜甲守关', title: '甲比人活得久' },
    ],
  },
  {
    id: 'ch_shuangqi',
    name: '霜岐林',
    subtitle: '雪落下来就不打算走了',
    element: 'ice',
    mobs: ['白毛林狼', '冻河渡夫', '雪下的钟', '披霜猎户', '冰枝傀'],
    boss: { name: '岐山雪女', title: '她只是想让林子安静', skillId: 'sk_e_hanyuan_suo' },
    stages: [
      { name: '落雪初夜', title: '第一场雪盖住了脚印' },
      { name: '冻河渡', title: '冰面比船稳' },
      { name: '白毛林狼', title: '它们不叫' },
      { name: '冰下的钟', title: '敲一下，整片林子听得见' },
      { name: '雪女临林', title: '她抬手，雪就停了' },
    ],
  },
  {
    id: 'ch_yuntai',
    name: '云台渡',
    subtitle: '火信一起，渡口就关了',
    element: 'fire',
    mobs: ['渡口盘查吏', '火油船工', '云台阶卒', '望楼信手', '烙印客'],
    boss: { name: '云台判官', title: '他判过的人都过了河', skillId: 'sk_e_taotie_shi' },
    stages: [
      { name: '渡口盘查', title: '问的是名字，验的是手' },
      { name: '火油船', title: '船上不能点灯' },
      { name: '云台阶', title: '一共三百级' },
      { name: '望楼火信', title: '信一起，桥就断' },
      { name: '判官坐渡', title: '过河要先过他' },
    ],
  },
  {
    id: 'ch_leize',
    name: '雷泽',
    subtitle: '水里有电，鼓一响就落雷',
    element: 'thunder',
    mobs: ['芦荡巡者', '走电的水', '沉舟阵魂', '雷母庙祝', '带铁的鱼'],
    boss: { name: '泽心鼓者', title: '他鼓其腹，天就应他', skillId: 'sk_e_leiting_pu' },
    stages: [
      { name: '泽边芦荡', title: '芦苇比人高' },
      { name: '走电的水', title: '别踩下去' },
      { name: '沉舟阵', title: '舟沉了，阵还在' },
      { name: '雷母庙', title: '庙里没有神像' },
      { name: '泽心鼓声', title: '鼓一响，天就低了' },
    ],
  },
  {
    id: 'ch_beiyuan',
    name: '北渊窟',
    subtitle: '这里的静是一种硬东西',
    element: 'ice',
    mobs: ['渊口寒气', '冰棺列卒', '无光河客', '千年不化', '沉渊守卫'],
    boss: { name: '北渊守渊人', title: '他守的不是渊，是渊里的静', skillId: 'sk_e_hanyuan_suo' },
    stages: [
      { name: '渊口寒气', title: '吸一口能划破喉咙' },
      { name: '冰棺列', title: '一共九十九具' },
      { name: '无光河', title: '水是黑的，也是不动的' },
      { name: '千年不化', title: '凿开只需要一句话' },
      { name: '守渊人立', title: '他已经站了很久' },
    ],
  },
  {
    id: 'ch_fentian',
    name: '焚天窑',
    subtitle: '废器也是器，匠魂也是魂',
    element: 'fire',
    mobs: ['窑火重燃', '熔铁池怪', '废器成兵', '未回火的刀', '窑口学徒'],
    boss: { name: '焚天老匠', title: '他这辈子只想打完一件', skillId: 'sk_e_jiuyou_fen' },
    stages: [
      { name: '窑火重开', title: '停了十年的火' },
      { name: '熔铁池', title: '池底有东西在动' },
      { name: '废器成兵', title: '断的也能站起来' },
      { name: '匠魂不散', title: '他还在砧边' },
      { name: '老匠开炉', title: '最后一件，成了' },
    ],
  },
  {
    id: 'ch_jiuxiao',
    name: '九霄墟',
    subtitle: '断戟成林的地方，风也不敢过',
    element: 'mixed',
    mobs: ['墟上无风', '断戟成林', '星陨坑影', '天问残响', '无相之兵'],
    boss: { name: '九霄·兵器王者', title: '他手里没有兵器', skillId: 'sk_e_tianwen_ni' },
    stages: [
      { name: '墟上无风', title: '连尘都不落' },
      { name: '断戟成林', title: '每一杆都插着名字' },
      { name: '星陨坑', title: '坑底还是热的' },
      { name: '天问之前', title: '问出口就没有退路' },
      { name: '兵器王者', title: '他手里没有兵器' },
    ],
  },
];

const MIXED_CYCLE = ['fire', 'ice', 'thunder'];

const CRYSTAL_OF = ELEMENT_CRYSTAL;

const ENEMY_BASIC_SKILL = {
  fire: 'sk_e_zaowo_hui',
  ice: 'sk_e_suibing',
  thunder: 'sk_e_maidian',
};

function stageElement(chapter, indexInChapter) {
  if (chapter.element !== 'mixed') return chapter.element;
  return MIXED_CYCLE[indexInChapter % MIXED_CYCLE.length];
}

function waveCount(index, isElite) {
  let n = 1;
  if (index > 8) n = 2;
  if (index > 20) n = 3;
  if (isElite) n = Math.min(3, n + 1);
  return n;
}

function enemiesPerWave(index, waveIdx, isElite, totalWaves) {
  const isLast = waveIdx === totalWaves - 1;
  let n = index <= 4 ? 1 : index <= 14 ? 2 : 3;
  if (isElite && isLast) n = Math.min(3, n);
  return Math.max(1, n);
}

function buildWaves(chapter, index, isElite, power, element) {
  const total = waveCount(index, isElite);
  const waves = [];
  for (let w = 0; w < total; w += 1) {
    const isLast = w === total - 1;
    const count = enemiesPerWave(index, w, isElite, total);
    /** 波次递增：最后一波最强 */
    const waveScale = 0.82 + 0.18 * w + (isLast ? 0.12 : 0);
    const row = [];
    for (let e = 0; e < count; e += 1) {
      const bossSlot = isElite && isLast && e === 0;
      const unitShare = bossSlot ? 1 : 1 / Math.max(1, count);
      const elemForUnit = chapter.element === 'mixed' ? MIXED_CYCLE[(index + w + e) % 3] : element;
      const atk = round(power * 0.085 * waveScale * (bossSlot ? 1.5 : unitShare * 1.35));
      const hp = round(power * 0.62 * waveScale * (bossSlot ? 2.4 : unitShare * 1.6));
      row.push(
        Object.freeze({
          id: `${chapter.id}_s${index}_w${w}_e${e}`,
          name: bossSlot ? chapter.boss.name : chapter.mobs[(index + w + e) % chapter.mobs.length],
          element: elemForUnit,
          atk: Math.max(6, atk),
          hp: Math.max(30, hp),
          speed: 86 + ((index * 3 + e * 7) % 34) + (bossSlot ? 12 : 0),
          skillId: bossSlot ? chapter.boss.skillId : ENEMY_BASIC_SKILL[elemForUnit],
          isBoss: bossSlot,
        }),
      );
    }
    waves.push(Object.freeze(row));
  }
  return Object.freeze(waves);
}

/** 经济表里的 `crystal` 指本关元素的三相晶；`shards` 按品质换成碎片资源。 */
function expandRewardMap(source, element) {
  const out = {};
  if (!source) return out;
  for (const [key, value] of Object.entries(source)) {
    if (key === 'crystal') {
      out[CRYSTAL_OF[element]] = (out[CRYSTAL_OF[element]] ?? 0) + value;
    } else if (key === 'shards') {
      for (const [quality, n] of Object.entries(value)) {
        const id = SHARD_RESOURCE[quality];
        if (id) out[id] = (out[id] ?? 0) + n;
      }
    } else {
      out[key] = (out[key] ?? 0) + value;
    }
  }
  return out;
}

function buildFirstClear(row, element) {
  return Object.freeze(expandRewardMap(row.firstClear, element));
}

/** 每次胜利/扫荡的掉落区间。区间型资源写 [min,max]，概率型写 chance。 */
function buildRepeat(row, element) {
  const rolls = {};
  for (const [key, value] of Object.entries(row.repeat)) {
    if (Array.isArray(value)) rolls[key] = Object.freeze([value[0], value[1]]);
  }
  return Object.freeze({
    rolls: Object.freeze(rolls),
    crystalId: CRYSTAL_OF[element],
    crystalChance: row.repeat.crystalChance ?? 0,
    shardId: SHARD_RESOURCE[row.repeat.shardTier] ?? null,
    shardTier: row.repeat.shardTier ?? null,
    shardChance: row.repeat.shardChance ?? 0,
  });
}

/** 重复掉落的期望值视图（UI 展示与经济回归用，实际发放走 dropTable/repeat）。 */
function buildRewards(row, index, repeat) {
  const mid = ([min, max]) => round((min + max) / 2);
  const materials = {};
  for (const [id, span] of Object.entries(repeat.rolls)) {
    if (id === 'coin') continue;
    const n = mid(span);
    if (n > 0) materials[id] = n;
  }
  if (repeat.crystalChance > 0) {
    const n = (materials[repeat.crystalId] ?? 0) + repeat.crystalChance;
    materials[repeat.crystalId] = Math.round(n * 100) / 100;
  }
  return Object.freeze({
    coin: mid(row.repeat.coin),
    exp: round(10 + index * 6),
    materials: Object.freeze(materials),
  });
}

function buildDropTable(repeat) {
  const drops = [];
  for (const [id, [min, max]] of Object.entries(repeat.rolls)) {
    drops.push({ id, chance: 1, min, max });
  }
  if (repeat.crystalChance > 0) {
    drops.push({ id: repeat.crystalId, chance: repeat.crystalChance, min: 1, max: 1 });
  }
  if (repeat.shardId && repeat.shardChance > 0) {
    drops.push({ id: repeat.shardId, chance: repeat.shardChance, min: 1, max: 1 });
  }
  return Object.freeze(drops.map((d) => Object.freeze(d)));
}

/** 阵容栏位在这些关卡通关后解锁（balance.SLOT_UNLOCK_STAGES：第 i 项通关后开第 i+1 格）。 */
const LINEUP_UNLOCK_AT = SLOT_UNLOCK_STAGES.reduce((acc, stage, i) => {
  if (i > 0 && stage > 0) acc[stage] = i + 1;
  return acc;
}, {});

function buildStages() {
  const list = [];
  for (let i = 1; i <= STAGE_COUNT; i += 1) {
    const chapterIdx = Math.floor((i - 1) / 5);
    const chapter = CHAPTERS[chapterIdx];
    const indexInChapter = (i - 1) % 5;
    const meta = chapter.stages[indexInChapter];
    const isElite = i % 5 === 0;
    const element = stageElement(chapter, indexInChapter);
    const basePower = POWER_START * POWER_STEP ** (i - 1);
    const power = round(basePower * (isElite ? ELITE_POWER_SCALE : 1));
    const row = STAGE_BALANCE[i - 1];
    const repeat = buildRepeat(row, element);

    list.push(
      Object.freeze({
        id: `stage_${String(i).padStart(2, '0')}`,
        index: i,
        chapterId: chapter.id,
        chapterName: chapter.name,
        chapterSubtitle: chapter.subtitle,
        name: meta.name,
        title: meta.title,
        element,
        isElite,
        staminaCost: row.staminaCost,
        recommendPower: power,
        /** fable-3 §3 的敌方战力参考值，暂不驱动战斗，只供经济回归比对。 */
        balancePower: row.enemyPower,
        waves: buildWaves(chapter, i, isElite, power, element),
        rewards: buildRewards(row, i, repeat),
        firstClear: buildFirstClear(row, element),
        repeat,
        dropTable: buildDropTable(repeat),
        unlockLineupSlot: LINEUP_UNLOCK_AT[i] ?? null,
        /** 精英关需要战力门槛，普通关不设限 */
        powerGate: isElite ? round(power * 0.72) : 0,
        /** 扫荡门槛：打到三星才开放，每次固定 1 点体力（balance.SWEEP_RULES）。 */
        sweepStars: SWEEP_RULES.minStars,
        sweepStaminaCost: SWEEP_RULES.staminaCost,
        sweepUnlockClears: 1,
      }),
    );
  }
  return Object.freeze(list);
}

export const STAGES = buildStages();

export const STAGE_BY_ID = Object.freeze(
  STAGES.reduce((acc, s) => {
    acc[s.id] = s;
    return acc;
  }, Object.create(null)),
);

export const CHAPTER_LIST = Object.freeze(
  CHAPTERS.map((c, i) =>
    Object.freeze({
      id: c.id,
      name: c.name,
      subtitle: c.subtitle,
      element: c.element,
      from: i * 5 + 1,
      to: i * 5 + 5,
      bossName: c.boss.name,
      bossTitle: c.boss.title,
    }),
  ),
);

export const STAGE_COUNT_TOTAL = STAGES.length;
export const ELITE_STAGE_INDICES = Object.freeze(STAGES.filter((s) => s.isElite).map((s) => s.index));

export function getStage(index) {
  return STAGES[index - 1] ?? null;
}

export default STAGES;
