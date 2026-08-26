/**
 * 全局战斗平衡常量（纯数据；物理模块以此为调参基准，须与 GDD 保持一致）。
 */
export const BALANCE = {
  /** 玩家资源 */
  player: {
    baseHp: 100,          // 冒险/塔/肉鸽初始生命（鸭族科技 +10%）
    hpRegenPerStage: 20,  // 冒险每通过一关回复
  },

  /** 连击系统（GDD：每层 +6% 暴伤，满 20 层触发「爆蛋时刻」） */
  combo: {
    critDmgPerStack: 0.06,
    maxStacks: 20,
    windowSec: 2.5,       // 超过窗口未命中则清零（连击流 2 件套 +0.8s）
    burst: { at: 20, name: "爆蛋时刻", fieldDmgPct: 1.5, desc: "对全场敌人造成 150% 攻击的蛋液爆发，随后连击清零" },
  },

  /** 暴击基础值 */
  crit: {
    baseChance: 0.1,
    baseMult: 1.5,
    maxChance: 0.6,
  },

  /** 能量获取（元气/羁绊/神器在此基础上加成） */
  energy: {
    perEnemyHit: 6,
    perBrickBreak: 2,
    perComboMilestone: 10,   // 连击每达 milestoneEvery 层额外回能
    milestoneEvery: 5,
    perTurnEnd: 12,
  },

  /** 蛋与发射（与 GDD 物理章节一致，供数据驱动调参） */
  egg: {
    baseRadius: 11,
    minSpeed: 220,
    maxSpeed: 720,
    elasticity: 0.85,
    gravity: 1680,
    splitSpeedInherit: 0.7,
    aimArcDeg: 70,          // 左右各 ±70°
    predictBounces: 3,       // 瞄准虚线预测反弹次数
    idleRecallSpeed: 8,      // 速度低于该值持续 idleRecallSec 判定回收
    idleRecallSec: 0.6,
    outOfBoundsY: 820,
  },

  /** 结算评分权重（胜利结算星级/评分） */
  score: {
    comboPeakWeight: 0.35,
    timeWeight: 0.2,
    hpLeftWeight: 0.25,
    brickClearWeight: 0.2,
    threeStarThreshold: 0.85,
    twoStarThreshold: 0.6,
  },
};
