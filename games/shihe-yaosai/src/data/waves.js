// 蚀核要塞 · 波次与 Boss（Fable-3，Round 2 修订）
// 20 波数据完整；probe 基线跑前 5 波（WAVES.slice(0, 5)），后续波不改结构直接续跑。
// 首怪入场时刻 = CONFIG.firstWaveDelay + 波 1 首组 delay = 0.5 + 0 = 0.5s（Round 2 冻结 ≤2s）。
// Round 2 微调：波 18/19/20 hpMul 2.1/2.3/2.5 → 2.15/2.4/2.6，收紧终盘；波 1–5 未动。
//
// 每波字段：
//   wave     波号 1..20
//   hpMul    本波敌人 hp 系数：实际 hp = ceil(ENEMIES[id].hp × hpMul)
//   bonus    清波奖励屑晶（击杀 bounty 之外额外发放）
//   groups[] 出怪组：
//     enemy    敌人 id（见 enemies.js）
//     count    数量
//     lane     0 下 / 1 中 / 2 上
//     delay    本波开始后多少秒出第一个（秒）
//     interval 组内相邻两个的间隔（秒）
// 出生角 θ 由 sim 用种子随机（同组建议扇区聚集），数据层不指定。

export const WAVES = [
  // ——— 教学段：认识三种护甲 ———
  { wave: 1, hpMul: 1.0, bonus: 20, groups: [
    { enemy: "mote", count: 6, lane: 0, delay: 0, interval: 1.2 },
  ] },
  { wave: 2, hpMul: 1.0, bonus: 22, groups: [
    { enemy: "mote", count: 8, lane: 0, delay: 0, interval: 0.9 },
    { enemy: "husk", count: 3, lane: 1, delay: 4, interval: 1.4 },
  ] },
  { wave: 3, hpMul: 1.0, bonus: 24, groups: [
    { enemy: "husk", count: 6, lane: 0, delay: 0, interval: 1.1 },
    { enemy: "veil", count: 4, lane: 1, delay: 3, interval: 1.6 },
  ] },
  { wave: 4, hpMul: 1.05, bonus: 26, groups: [
    { enemy: "wisp", count: 12, lane: 2, delay: 0, interval: 0.5 },
    { enemy: "mote", count: 4, lane: 0, delay: 2, interval: 1.0 },
  ] },
  // ——— 第一次精英考试（Round 1 sim 打到这波为止）———
  { wave: 5, hpMul: 1.1, bonus: 30, groups: [
    { enemy: "mote", count: 8, lane: 0, delay: 0, interval: 0.8 },
    { enemy: "veil", count: 4, lane: 2, delay: 3, interval: 1.5 },
    { enemy: "warden", count: 1, lane: 1, delay: 6, interval: 0 },
  ] },

  // ——— 中盘：混编与压节奏 ———
  { wave: 6, hpMul: 1.15, bonus: 32, groups: [
    { enemy: "ram", count: 3, lane: 0, delay: 0, interval: 3.0 },
    { enemy: "husk", count: 8, lane: 1, delay: 1, interval: 1.0 },
  ] },
  { wave: 7, hpMul: 1.2, bonus: 34, groups: [
    { enemy: "wisp", count: 16, lane: 2, delay: 0, interval: 0.4 },
    { enemy: "mote", count: 8, lane: 0, delay: 2, interval: 0.8 },
  ] },
  { wave: 8, hpMul: 1.25, bonus: 36, groups: [
    { enemy: "veil", count: 8, lane: 1, delay: 0, interval: 1.2 },
    { enemy: "oracle", count: 1, lane: 1, delay: 8, interval: 0 },
  ] },
  { wave: 9, hpMul: 1.3, bonus: 38, groups: [
    { enemy: "husk", count: 6, lane: 0, delay: 0, interval: 1.0 },
    { enemy: "veil", count: 6, lane: 2, delay: 2, interval: 1.2 },
    { enemy: "ram", count: 3, lane: 1, delay: 5, interval: 2.5 },
  ] },
  { wave: 10, hpMul: 1.35, bonus: 44, groups: [
    { enemy: "warden", count: 2, lane: 0, delay: 0, interval: 5.0 },
    { enemy: "brood", count: 1, lane: 2, delay: 4, interval: 0 },
    { enemy: "mote", count: 10, lane: 1, delay: 1, interval: 0.7 },
  ] },
  { wave: 11, hpMul: 1.4, bonus: 42, groups: [
    { enemy: "wisp", count: 10, lane: 0, delay: 0, interval: 0.45 },
    { enemy: "wisp", count: 10, lane: 2, delay: 1.5, interval: 0.45 },
    { enemy: "mote", count: 6, lane: 1, delay: 3, interval: 0.8 },
  ] },
  { wave: 12, hpMul: 1.5, bonus: 44, groups: [
    { enemy: "ram", count: 5, lane: 0, delay: 0, interval: 2.4 },
    { enemy: "veil", count: 6, lane: 1, delay: 3, interval: 1.2 },
  ] },
  { wave: 13, hpMul: 1.55, bonus: 46, groups: [
    { enemy: "husk", count: 10, lane: 0, delay: 0, interval: 0.9 },
    { enemy: "oracle", count: 2, lane: 1, delay: 4, interval: 6.0 },
  ] },
  { wave: 14, hpMul: 1.65, bonus: 48, groups: [
    { enemy: "mote", count: 12, lane: 0, delay: 0, interval: 0.6 },
    { enemy: "wisp", count: 12, lane: 2, delay: 2, interval: 0.5 },
    { enemy: "brood", count: 2, lane: 1, delay: 5, interval: 4.0 },
  ] },
  // ——— 精英三重奏 ———
  { wave: 15, hpMul: 1.75, bonus: 54, groups: [
    { enemy: "warden", count: 1, lane: 0, delay: 0, interval: 0 },
    { enemy: "veil", count: 6, lane: 1, delay: 2, interval: 1.3 },
    { enemy: "oracle", count: 1, lane: 1, delay: 3, interval: 0 },
    { enemy: "brood", count: 1, lane: 2, delay: 6, interval: 0 },
  ] },

  // ——— 终盘：高压冲刺 ———
  { wave: 16, hpMul: 1.85, bonus: 52, groups: [
    { enemy: "ram", count: 6, lane: 0, delay: 0, interval: 2.2 },
    { enemy: "husk", count: 10, lane: 2, delay: 1, interval: 0.8 },
  ] },
  { wave: 17, hpMul: 1.95, bonus: 54, groups: [
    { enemy: "wisp", count: 8, lane: 0, delay: 0, interval: 0.4 },
    { enemy: "wisp", count: 8, lane: 1, delay: 1, interval: 0.4 },
    { enemy: "wisp", count: 8, lane: 2, delay: 2, interval: 0.4 },
    { enemy: "mote", count: 8, lane: 0, delay: 4, interval: 0.7 },
  ] },
  { wave: 18, hpMul: 2.15, bonus: 58, groups: [
    { enemy: "veil", count: 10, lane: 1, delay: 0, interval: 1.0 },
    { enemy: "oracle", count: 2, lane: 0, delay: 4, interval: 5.0 },
    { enemy: "ram", count: 4, lane: 2, delay: 6, interval: 2.2 },
  ] },
  { wave: 19, hpMul: 2.4, bonus: 62, groups: [
    { enemy: "warden", count: 3, lane: 0, delay: 0, interval: 4.5 },
    { enemy: "husk", count: 12, lane: 1, delay: 1, interval: 0.7 },
    { enemy: "brood", count: 2, lane: 2, delay: 3, interval: 4.0 },
  ] },
  { wave: 20, hpMul: 2.6, bonus: 80, groups: [
    { enemy: "warden", count: 2, lane: 0, delay: 0, interval: 5.0 },
    { enemy: "oracle", count: 2, lane: 1, delay: 2, interval: 5.0 },
    { enemy: "brood", count: 2, lane: 2, delay: 4, interval: 5.0 },
    { enemy: "veil", count: 10, lane: 1, delay: 6, interval: 1.0 },
    { enemy: "mote", count: 10, lane: 0, delay: 8, interval: 0.6 },
  ] },
];

// Boss「蚀主」：第 20 波清完、CONFIG.interWaveDelay 秒后单独登场。
// 相位按当前血量百分比从上往下取第一条满足 hp/maxHp <= hpPct 的（1.0 相位即开场）。
// 进入新相位时：切护甲、乘 speedMul（对基础 speed）、按 summon 出一组小怪。
// 漏敌扣核 20 = 核满血也直接归零：Boss 必须拦下。
export const BOSS = {
  id: "etch-lord",
  name: "蚀主",
  size: "boss",
  hp: 4800,
  speed: 1.05,
  lane: 1,
  bounty: 500,
  leak: 20,
  phases: [
    { hpPct: 1.0, armor: "shield", speedMul: 1.0, summon: null },
    {
      hpPct: 0.66,
      armor: "shell",
      speedMul: 1.2,
      summon: { enemy: "wisp", count: 6, lane: 2, interval: 0.4 },
    },
    {
      hpPct: 0.33,
      armor: "swarm",
      speedMul: 1.45,
      summon: { enemy: "mote", count: 8, lane: 0, interval: 0.5 },
    },
  ],
};
