// 关卡表（30 关）。曲线设计与里程碑阵容见 docs/GDD.md §8。
// 兼容约束：STAGES 为长度 30 的数组，{id,name,exp,hourglass,enemies} 与敌人
// {key,name,hp,atk,def,spd,lane} 被 ui/app.js、combat/battle.js、bench/probe
// 直接消费，禁止改名。敌人 skill 字段 battle.js 已原生支持（taunt/burst/heal/
// aoe/hook/multishot），Boss 机制差异由数据直接点亮，无需改战斗代码。
//
// 新增字段（Round 2 接线）：
//   boss        是否 Boss 关（5 的倍数；UI 做强调、战前提示 mechanics 文案）。
//   intro       进关播报（老大口吻）。
//   reward      每次通关奖励 { coins }（现行 fight 只发 exp+hourglass+badge，
//               badge 应改为 firstClear 才发，见下）。
//   firstClear  首通一次性奖励。shard 唯一的关卡来源在 Boss 关首通
//               （5/10/15/20/25/30 → 10/15/20/25/30/40，合计 140）；
//               badge 每关首通 +1（替换现行「每次通关 +1」）。
//   mechanics   Boss 机制一句话（战前 UI 展示）。
//
// 数值曲线（经 simulateBattle 以游戏真实种子逐关仿真校准，见 GDD §8.2）：
//   杂兵 hp = 18 + 24n + 0.42n²（温和二次），atk = 5 + 2.6n − 0.026n²（后期收敛，
//   避免 24 回合上限内把玩家血池打穿），def = 1 + 0.35n。
//   兵种系数：火枪 hp×0.75 atk×1.35；蛙人 hp×0.9 atk×1.1 spd108；
//   鱼叉手 hp×0.8 atk×1.25。Boss 是曲线的门神：hp×3.2 atk×1.25 def×1.5。

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
    mechanics: "每 4 回合一口 2.4 倍撕咬：带上奶妈，别让前排空血挨咬。",
    firstClear: { shard: 10, blueprint: 1, badge: 1, coins: 60 },
  },
  10: {
    key: "hook_captain",
    name: "钩手船长",
    skill: { name: "拖锚铁钩", star: 1, kind: "hook", value: 1, period: 0 },
    hpMult: 4.2,
    escortMult: 1,
    mechanics: "开战即把你的后排钩进前排：给脆皮留保命血量或先手集火他。",
    firstClear: { shard: 15, blueprint: 1, badge: 1, coins: 90, diamonds: 2 },
  },
  15: {
    key: "siren",
    name: "深潮塞壬",
    skill: { name: "潮汐挽歌", star: 1, kind: "heal", value: 60, period: 3 },
    hpMult: 5,
    atkMult: 1.45,
    escortMult: 1,
    mechanics: "每 3 回合给残血敌人回 60：输出不够会被她奶成车轮战。",
    firstClear: { shard: 20, blueprint: 2, badge: 1, coins: 120 },
  },
  20: {
    key: "kraken_arm",
    name: "克拉肯触腕",
    skill: { name: "横扫甲板", star: 1, kind: "aoe", value: 0.45, period: 5 },
    hpMult: 4.2,
    escortMult: 1,
    mechanics: "每 5 回合横扫全队 45% 溅射：全员血线要厚，奶量要跟上。",
    firstClear: { shard: 25, blueprint: 2, badge: 1, coins: 150, diamonds: 3 },
  },
  25: {
    key: "iron_whale",
    name: "废铁鲸",
    skill: { name: "锈甲坚守", star: 1, kind: "taunt", value: 1, period: null },
    escortMult: 0.8,
    mechanics: "开场嘲讽 + 超厚血量：这是一场 DPS 检定，24 回合内啃不动就是平局。",
    firstClear: { shard: 30, blueprint: 2, badge: 1, coins: 200 },
  },
  30: {
    key: "tide_lord",
    name: "潮汐领主",
    skill: { name: "灭世潮涌", star: 1, kind: "burst", value: 3.2, period: 4 },
    mechanics: "每 4 回合 3.2 倍潮涌重击：终局考试，四星前排 + 双辅助再来。",
    firstClear: { shard: 40, blueprint: 3, badge: 2, coins: 300, diamonds: 5 },
  },
};

function waveFor(n) {
  if (n === 1) return [raider(n, 0.7), raider(n, 0.7)];
  if (n === 2) return [raider(n, 0.85), raider(n, 0.85), gunner(n, 0.85)];
  if (n === 3) return [raider(n), raider(n), gunner(n)];
  if (n === 4) return [raider(n), raider(n), gunner(n), gunner(n)];
  if (n <= 7) return [raider(n), raider(n), gunner(n), gunner(n)];
  if (n <= 9) return [raider(n), diver(n), raider(n), gunner(n)];
  if (n <= 14) return [raider(n), raider(n), diver(n), gunner(n), gunner(n)];
  if (n <= 19) return [raider(n), diver(n), diver(n), gunner(n), harpooner(n)];
  if (n <= 24) return [raider(n), diver(n), diver(n), gunner(n), harpooner(n)];
  return [raider(n), diver(n), diver(n), harpooner(n), harpooner(n)];
}

export const STAGES = Array.from({ length: 30 }, (_, i) => {
  const n = i + 1;
  const boss = BOSSES[n];
  // Boss 关护卫默认 ×0.7（压力来自 Boss 机制），个别 Boss 用 escortMult 覆写。
  const em = boss?.escortMult ?? 0.7;
  const escort = (u) => ({ ...u, hp: Math.round(u.hp * em), atk: Math.round(u.atk * em) });
  const grunts = boss ? waveFor(n).slice(0, n <= 5 ? 2 : 4).map(escort) : waveFor(n);
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

// 关卡规则（Round 2 接线）。
export const STAGE_RULES = {
  teamCap: 5,          // 5v5：出战最多 5 名英雄，heroes > 5 时必须做取舍
  skipAfterSec: 10,    // 战斗播放 10 秒后可跳过（结果同 seed 不变）
  replayRewardMult: 0.25, // 重打已通关卡：exp/hourglass/coins ×0.25，firstClear 不重发
  seedFormula: "meta.seed + stage*99", // 与现行 ui/app.js 保持一致
};
