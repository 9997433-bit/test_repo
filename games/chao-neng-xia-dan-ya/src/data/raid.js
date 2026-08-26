/**
 * 讨伐魔王静态表（60 秒限时输出，魔王无限重生且逐次成长，按单次总伤害发档位奖励）。
 *
 * 第 i 次重生（i 从 0 起）：
 * - hp  = baseHp × (1 + hpGrowthPerKill × i)
 * - 技能伤害 = skillDmgBase × (1 + dmgGrowthPerKill × i)
 * 讨伐中无漏怪判定（BOSS 固定），玩家生命仅受 BOSS 技能消耗。
 *
 * 平衡假设：60 秒约可发射 12 枚蛋。开荒队单次总伤 ≈ 1500-3000（档 1-2）；
 * 满养成 + 羁绊 + 连击队 ≈ 3-6 万（档 5-6）；档 7 为极限构筑荣誉档。
 */
export const RAID = {
  unlockAfterStage: "2-4",       // 通关第 2 章解锁
  durationSec: 60,
  bossId: "demon_fryer",
  variantName: "讨伐·魔王油锅",
  baseHp: 800,
  hpGrowthPerKill: 0.45,
  skillDmgBase: 10,
  dmgGrowthPerKill: 0.2,
  skillEveryTurns: 2,
  energyGainMult: 1.5,           // 讨伐中能量获取 ×1.5，鼓励大招循环
  playerHp: 100,
  /** 单次挑战总伤害档位奖（每档只发一次，取历史最佳；randomShards 为随机英雄碎片数） */
  tiers: [
    { dmg: 1500, gold: 80, randomShards: 2 },
    { dmg: 4000, gold: 150, randomShards: 4 },
    { dmg: 9000, gold: 240, randomShards: 6 },
    { dmg: 18000, gold: 380, randomShards: 8 },
    { dmg: 35000, gold: 560, randomShards: 10 },
    { dmg: 65000, gold: 800, randomShards: 12 },
    { dmg: 120000, gold: 1200, randomShards: 16 },
  ],
};
