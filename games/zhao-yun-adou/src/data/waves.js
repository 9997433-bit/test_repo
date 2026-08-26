/**
 * 波次表（Round 2 平衡版）。
 *
 * 设计目标（见 docs/GDD.md「敌军与波次」与「调参记录（Round 2）」）：
 * - 1–3 波为教程波：数量少、血薄、出兵间隔长，2~3 枚 1 级兵即可零漏防守；
 * - 4/8/12 波 Boss 检查点：加速 / 护盾 / 加速 依次登场，Boss 走位慢但皮糙；
 * - 10–12 波为决胜段：血量抬坡（lateRamp），双方都必须开始漏兵卖血，
 *   胜负由板面质量差异决定，而不是靠「双方全清 → 平局判玩家」的兜底规则；
 * - 第 13 波终章「长坂坡决战」：精锐 + 分裂大 Boss，重收官节奏而非血墙；
 * - 全场 13 波总时长约 2.8~4.1 分钟（含击杀提前收波与提前分胜负）。
 *
 * Round 2 改动：血量斜率 12 → 18、lateRamp 6 → 12/波·级（终章按 56% 比例跟进）。
 * 真实射程 + 强化基准玩家（会合并/用铲/拼将）合入后，旧表被双方同时零漏打穿，
 * 91% 对局靠平局规则判玩家胜；新表把决胜段推回「必须掉心」区间，
 * bench 胜率 33/36 → 19/36。任何再调整都必须重跑 npm run bench。
 */
export const MAX_WAVE = 13;

export function waveSpec(wave) {
  const w = Math.max(1, Math.min(MAX_WAVE, wave));
  if (w === MAX_WAVE) {
    // 终章「长坂坡决战」：精锐少而硬 + 分裂大 Boss，重节奏而非血墙
    // （总血量 ≈ 56% 的 12 波，比例与 Round 1 持平；实测终章不改胜负）。
    return {
      wave: w,
      count: 8,
      hp: 210,
      speed: 34,
      reward: 9,
      boss: { hp: 520, speed: 22, skill: "split" },
      interval: 0.9,
    };
  }
  const boss = w % 4 === 0;
  const lateRamp = Math.max(0, w - 9) * 12;
  return {
    wave: w,
    count: 4 + w,
    hp: 19 + w * 18 + lateRamp,
    speed: 22 + w * 1.44,
    reward: 2 + Math.floor(w / 2),
    boss: boss
      ? { hp: 70 + w * 24, speed: 16 + w * 0.8, skill: w === 8 ? "shield" : "haste" }
      : null,
    interval: Math.max(0.65, 1.2 - w * 0.045),
  };
}

/**
 * 卖血补偿：漏 1 个敌人扣 1 心，但立刻返还馒头。
 * 后期一滴血价值 ~30 馒头 ≈ 3~4 次征兵，「卖血换经济」是真实抉择。
 */
export function leakCompensation(wave) {
  return 8 + 2 * wave;
}
