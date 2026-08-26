// 关卡表（30 关，5v5：每关恰好 5 名敌人）。曲线与里程碑阵容见 docs/GDD.md §8。
// 兼容约束：STAGES 为长度 30 的数组，{id,name,exp,hourglass,enemies} 与敌人
// {key,name,hp,atk,def,spd,lane} 被 ui/**、combat/battle.js、bench/probe
// 直接消费，禁止改名。敌人 skill 字段 battle.js 已原生支持（taunt/burst/heal/
// aoe/hook/multishot/buff），Boss 机制差异由数据直接点亮，无需改战斗代码。
// 快照契约（tests/combat-contract.test.js）：
//   STAGES[0].enemies[0] 必须是 raider(1, 0.7)（本轮未动）。
//   STAGES[29].enemies 本轮已按 Round 3 验收口径再平衡（hp×6 atk×2.6 escort×0.85，
//   2 星队 0/128、4 星队 118/128，见 GDD §8.2），「满编挑战终局 Boss」快照需重录
//   （vitest -u），重录由测试所有方执行，本文件不改测试。
//
// 字段（Round 2 接线）：
//   boss        是否 Boss 关（5 的倍数；UI 做强调、战前提示 mechanics 文案）。
//   intro       进关播报（老大口吻）。
//   reward      每次通关奖励 { coins }（现行 fight 只发 exp+hourglass+badge，
//               badge 应改为 firstClear 才发，见下）。
//   firstClear  首通一次性奖励。shard 唯一的关卡来源在 Boss 关首通
//               （5/10/15/20/25/30 → 10/15/20/25/30/40，合计 140）；
//               badge 每关首通 +1（替换现行「每次通关 +1」）。
//   mechanics   Boss 机制一句话（战前 UI 展示）。
//
// 数值曲线（经 simulateBattle 以 campaign.js 真实种子逐关仿真校准，见 GDD §8.2）：
//   杂兵 hp = 18 + 24n + 0.42n²（温和二次），atk = 5 + 2.6n − 0.026n²（后期收敛，
//   避免 24 回合上限内把玩家血池打穿），def = 1 + 0.35n。
//   兵种系数：火枪 hp×0.75 atk×1.35；蛙人 hp×0.9 atk×1.1 spd108；
//   鱼叉手 hp×0.8 atk×1.25。1–9 关用降倍率杂兵补足 5 人头（首关全场 ×0.55–0.7，
//   保证米娅单人可胜的开局承诺）。
//   Boss 是曲线的门神：本体 hp×4.8–13 / atk×2.3–3.4 逐 Boss 覆写（Round 2 战斗
//   实装酒劲叠层、连珠多段、治疗护盾后联盟侧大幅变强，Boss 倍率随之整体上调；
//   B30 于 Round 3 解冻重做：hp×6 atk×2.6 escort×0.85——2 星队 0/128 全灭、
//   3 星队 0/128（终局墙）、4 星队 118/128 可过、5 星队 128/128 巡礼），
//   护卫 = 本关杂兵 × escortMult。

function base(n) {
  return {
    hp: Math.round(18 + 24 * n + 0.42 * n * n),
    atk: Math.round((5 + 2.6 * n - 0.026 * n * n) * 10) / 10,
    def: Math.round(1 + 0.35 * n),
  };
}

function raider(n, mult = 1) {
  const b = base(n);
  return { key: "raider", name: "海盗杂兵", hp: Math.round(b.hp * mult), atk: Math.round(b.atk * mult), def: b.def, spd: 90, lane: "front" };
}

function gunner(n, mult = 1) {
  const b = base(n);
  return { key: "gunner", name: "甲板火枪", hp: Math.round(b.hp * 0.75 * mult), atk: Math.round(b.atk * 1.35 * mult), def: Math.max(1, Math.round(b.def * 0.6)), spd: 100, lane: "back" };
}

function diver(n, mult = 1) {
  const b = base(n);
  return { key: "diver", name: "蛙人刺客", hp: Math.round(b.hp * 0.9 * mult), atk: Math.round(b.atk * 1.1 * mult), def: b.def, spd: 108, lane: "front" };
}

function harpooner(n, mult = 1) {
  const b = base(n);
  return { key: "harpooner", name: "鱼叉手", hp: Math.round(b.hp * 0.8 * mult), atk: Math.round(b.atk * 1.25 * mult), def: Math.max(1, Math.round(b.def * 0.8)), spd: 96, lane: "back" };
}

function bossUnit(n, boss) {
  const b = base(n);
  return {
    key: boss.key,
    name: boss.name,
    hp: Math.round(b.hp * (boss.hpMult ?? 3.8)),
    atk: Math.round(b.atk * (boss.atkMult ?? 1.3)),
    def: Math.round(b.def * 1.5),
    spd: 92,
    lane: "front",
    skill: boss.skill,
  };
}

const BOSSES = {
  5: {
    key: "megalodon",
    name: "巨齿鲨王",
    skill: { name: "血盆撕咬", star: 1, kind: "burst", value: 2.4, period: 4 },
    hpMult: 9,
    atkMult: 3.2,
    escortMult: 1,
    mechanics: "每 4 回合一口 2.4 倍撕咬：带上奶妈，别让前排空血挨咬。",
    firstClear: { shard: 10, blueprint: 1, badge: 1, coins: 60 },
  },
  10: {
    key: "hook_captain",
    name: "钩手船长",
    skill: { name: "拖锚铁钩", star: 1, kind: "hook", value: 1, period: 0 },
    hpMult: 13,
    atkMult: 3.4,
    escortMult: 1,
    mechanics: "开战即把你的后排钩进前排：给脆皮留保命血量或先手集火他。",
    firstClear: { shard: 30, blueprint: 1, badge: 1, coins: 90, diamonds: 2 },
  },
  15: {
    key: "siren",
    name: "深潮塞壬",
    skill: { name: "潮汐挽歌", star: 1, kind: "heal", value: 60, period: 3 },
    hpMult: 8,
    atkMult: 2.3,
    escortMult: 1,
    mechanics: "每 3 回合给残血敌人回 60：输出不够会被她奶成车轮战。",
    firstClear: { shard: 50, blueprint: 2, badge: 1, coins: 120 },
  },
  20: {
    key: "kraken_arm",
    name: "克拉肯触腕",
    skill: { name: "横扫甲板", star: 1, kind: "aoe", value: 0.45, period: 5 },
    hpMult: 7.2,
    atkMult: 2.3,
    escortMult: 1,
    mechanics: "每 5 回合横扫全队 45% 溅射：全员血线要厚，奶量要跟上。",
    firstClear: { shard: 75, blueprint: 2, badge: 1, coins: 150, diamonds: 3 },
  },
  25: {
    key: "iron_whale",
    name: "废铁鲸",
    skill: { name: "锈甲坚守", star: 1, kind: "taunt", value: 1, period: null },
    hpMult: 4.8,
    atkMult: 2.3,
    escortMult: 0.95,
    mechanics: "开场嘲讽 + 超厚血量：这是一场 DPS 检定，24 回合内啃不动就是平局。",
    firstClear: { shard: 105, blueprint: 2, badge: 1, coins: 200 },
  },
  30: {
    key: "tide_lord",
    name: "潮汐领主",
    skill: { name: "灭世潮涌", star: 1, kind: "burst", value: 3.2, period: 4 },
    // Round 3 再平衡（原冻结值 hp×3.8 atk×1.3 escort×0.7 导致 2 星队 113/128 胜的倒挂）。
    // 校准口径：campaign.js 真实种子 128 盐——★2 全灭 0/128、★3 仍 0/128、
    // ★4 满编 118/128、★5 满编 128/128（见 GDD §8.2）。
    hpMult: 6,
    atkMult: 2.6,
    escortMult: 0.85,
    mechanics: "每 4 回合 3.2 倍潮涌重击：终局考试，全员四星再来，三星就是送。",
    firstClear: { shard: 120, blueprint: 3, badge: 2, coins: 300, diamonds: 5 },
  },
};

// 5v5 契约：每关必须恰好 5 名敌人（Boss 关 = 本体 + 4 护卫）。
// 1–9 关用降倍率的杂兵补足人头，首关首位 raider(1,0.7) 被契约快照冻结不可动。
function waveFor(n) {
  if (n === 1) return [raider(n, 0.7), raider(n, 0.7), raider(n, 0.55), gunner(n, 0.6), raider(n, 0.55)];
  if (n === 2) return [raider(n, 0.85), raider(n, 0.85), gunner(n, 0.85), raider(n, 0.65), gunner(n, 0.65)];
  if (n === 3) return [raider(n), raider(n), gunner(n), raider(n, 0.75), gunner(n, 0.75)];
  if (n === 4) return [raider(n), raider(n), gunner(n), gunner(n), raider(n, 0.8)];
  if (n <= 7) return [raider(n), raider(n), gunner(n), gunner(n), raider(n, 0.85)];
  if (n <= 9) return [raider(n), diver(n), raider(n), gunner(n), gunner(n, 0.85)];
  if (n <= 14) return [raider(n), raider(n), diver(n), gunner(n), gunner(n)];
  if (n <= 19) return [raider(n), diver(n), diver(n), gunner(n), harpooner(n)];
  if (n <= 24) return [raider(n), diver(n), diver(n), gunner(n), harpooner(n)];
  return [raider(n), diver(n), diver(n), harpooner(n), harpooner(n)];
}

export const STAGES = Array.from({ length: 30 }, (_, i) => {
  const n = i + 1;
  const boss = BOSSES[n];
  // Boss 关护卫 = 本关杂兵前 4 名 × escortMult；六个 Boss 均已显式覆写，×0.7 仅作兜底。
  const em = boss?.escortMult ?? 0.7;
  const escort = (u) => ({ ...u, hp: Math.round(u.hp * em), atk: Math.round(u.atk * em) });
  const grunts = boss ? waveFor(n).slice(0, 4).map(escort) : waveFor(n);
  const enemies = boss ? [bossUnit(n, boss), ...grunts] : grunts;
  return {
    id: n,
    name: boss ? `海域霸主 · ${boss.name}` : `废海航线 ${n}`,
    boss: !!boss,
    exp: 24 + 6 * n,
    hourglass: boss ? Math.round((4 + Math.ceil(n / 3)) * 1.5) : 4 + Math.ceil(n / 3),
    reward: { coins: 6 + 2 * n },
    firstClear: boss ? boss.firstClear : { badge: 1, coins: 10 + 2 * n },
    mechanics: boss ? boss.mechanics : null,
    intro: boss ? `${boss.name}堵住了航线。${boss.mechanics}` : `第 ${n} 段废海航线，例行清杂兵。`,
    enemies,
  };
});

/**
 * 海盗袭击波（events.js pirate_raid 的消费入口，纯数据派生、零战斗代码改动）：
 * 以「当前最高通关关卡」的杂兵表为底，整体乘 powerMult 得到 5 名敌人，
 * 形状与 STAGES[n].enemies 完全一致，可直接喂给 simulateBattle。
 * bestStage = 0（还没通关）时按第 1 关口径出最弱波。
 */
export function raidWave(bestStage, powerMult = 1) {
  const n = Math.max(1, Math.min(30, Math.round(Number.isFinite(bestStage) ? bestStage : 1) || 1));
  const mult = Number.isFinite(powerMult) && powerMult > 0 ? powerMult : 1;
  return waveFor(n).map((u) => ({
    ...u,
    hp: Math.max(1, Math.round(u.hp * mult)),
    atk: Math.max(1, Math.round(u.atk * mult)),
  }));
}

// 关卡规则（teamCap/replayRewardMult 已被 ui/screens/campaign.js 消费）。
export const STAGE_RULES = {
  teamCap: 5,          // 5v5：出战最多 5 名英雄，heroes > 5 时必须做取舍
  skipAfterSec: 10,    // 战斗播放 10 秒后可跳过（结果同 seed 不变）
  replayRewardMult: 0.25, // 重打已通关卡：exp/hourglass/coins ×0.25，firstClear 不重发
  seedFormula: "hashSeed(`${meta.seed}:${stage}:${campaign.attempts}`)", // 与 campaign.js 现行实现一致
};
