/**
 * 极限挑战（肉鸽）静态表：神器池 + 规则 + 无尽波次曲线。
 * 肉鸽模式不带养成（等级/星/图鉴/种族科技均不生效），全靠局内三选一。
 *
 * 神器 mod 键约定（combat/modes 消费）：数值均为加法叠层，maxStacks 为可重复拾取上限。
 */
export const ARTIFACTS = [
  /* ---------- common（普通） ---------- */
  { id: "twin_yolk", name: "双黄蛋", rarity: "common", maxStacks: 2, desc: "发射时 25% 概率打出双蛋（副蛋 70% 伤害）。", mod: { twinEggChance: 0.25, twinEggPct: 0.7 } },
  { id: "iron_shell", name: "铁壳蛋液", rarity: "common", maxStacks: 3, desc: "主蛋伤害 +15%。", mod: { mainEggPct: 0.15 } },
  { id: "iced_soda", name: "冰镇汽水", rarity: "common", maxStacks: 2, desc: "冻结持续 +0.4 秒。", mod: { freezeBonusSec: 0.4 } },
  { id: "bouncy_jelly", name: "弹力果冻", rarity: "common", maxStacks: 2, desc: "蛋弹性 +0.05，碰撞伤害上限 +10%。", mod: { bouncinessBonus: 0.05, bounceDmgCapPct: 0.1 } },
  { id: "golden_tray", name: "黄金蛋托", rarity: "common", maxStacks: 3, desc: "波次金币 +30%。", mod: { goldFindPct: 0.3 } },
  { id: "lucky_feather", name: "幸运羽毛", rarity: "common", maxStacks: 2, desc: "三选一可刷新次数 +1。", mod: { rerollBonus: 1 } },
  { id: "glutton_badge", name: "大胃王徽章", rarity: "common", maxStacks: 3, desc: "生命上限 +25 并回复 25。", mod: { maxHpBonus: 25, healOnPick: 25 } },
  { id: "yolk_breakwater", name: "蛋液防波堤", rarity: "common", maxStacks: 2, desc: "漏怪/接触伤害 -30%。", mod: { leakReducePct: 0.3 } },

  /* ---------- rare（稀有） ---------- */
  { id: "chili_sauce", name: "秘制辣椒酱", rarity: "rare", maxStacks: 2, desc: "灼烧伤害 +50%。", mod: { burnDmgPct: 0.5 } },
  { id: "static_down", name: "静电羽绒", rarity: "rare", maxStacks: 2, desc: "感电扩散目标 +1。", mod: { spreadTargetBonus: 1 } },
  { id: "magnet_bill", name: "磁力鸭嘴", rarity: "rare", maxStacks: 1, desc: "蛋受到朝向最近敌人的轻微吸力（强度 0.25）。", mod: { magnetStrength: 0.25 } },
  { id: "combo_metronome", name: "连击节拍器", rarity: "rare", maxStacks: 2, desc: "连击保持窗口 +1 秒。", mod: { comboWindowBonusSec: 1 } },
  { id: "warm_incubator", name: "孵化恒温箱", rarity: "rare", maxStacks: 2, desc: "每波开始全队回 10 能量。", mod: { energyPerWave: 10 } },
  { id: "split_yeast", name: "分裂酵母", rarity: "rare", maxStacks: 1, desc: "分裂蛋伤害 55% → 70%。", mod: { splitPctOverride: 0.7 } },
  { id: "steam_nozzle", name: "蒸汽喷嘴", rarity: "rare", maxStacks: 1, desc: "蒸发反应倍率 ×1.4 → ×1.6。", mod: { vaporizeMultOverride: 1.6 } },
  { id: "superconduct_coil", name: "超导线圈", rarity: "rare", maxStacks: 1, desc: "超导破甲 8 → 12 秒，且额外 -2 护甲。", mod: { superconductSecOverride: 12, superconductFlatArmor: 2 } },
  { id: "feather_fan", name: "弹幕羽扇", rarity: "rare", maxStacks: 2, desc: "大招能量消耗 -15%。", mod: { ultCostReducePct: 0.15 } },
  { id: "revenge_shell", name: "复仇蛋壳", rarity: "rare", maxStacks: 1, desc: "受到伤害后，下一枚蛋伤害 +40%。", mod: { revengeNextEggPct: 0.4 } },

  /* ---------- epic（史诗） ---------- */
  { id: "popcorn_fuse", name: "爆米花引信", rarity: "epic", maxStacks: 1, desc: "蛋静止回收前原地爆炸（120% 伤害，半径 80）。", mod: { recallExplodePct: 1.2, recallExplodeRadius: 80 } },
  { id: "yolk_core", name: "蛋黄核心", rarity: "epic", maxStacks: 1, desc: "每 5 层连击全队攻击 +1%（上限 +10%）。", mod: { atkPerComboBand: 0.01, atkPerComboBandCap: 0.1 } },
  { id: "armor_drill", name: "破甲蛋锥", rarity: "epic", maxStacks: 1, desc: "无视目标 50% 护甲。", mod: { armorIgnorePct: 0.5 } },
  { id: "slow_hourglass", name: "慢动作沙漏", rarity: "epic", maxStacks: 1, desc: "蛋速低于 200 时伤害 +25%（慢蛋精算流）。", mod: { slowEggThreshold: 200, slowEggDmgPct: 0.25 } },

  /* ---------- legendary（传说） ---------- */
  { id: "crown_shell", name: "王冠蛋壳", rarity: "legendary", maxStacks: 1, desc: "「禽王光环」羁绊需求 4 → 3 人。", mod: { kingAuraNeedOverride: 3 } },
  { id: "endless_carton", name: "无限蛋盒", rarity: "legendary", maxStacks: 1, desc: "每回合首次回收后 30% 概率立即再获得一次发射。", mod: { encoreShotChance: 0.3 } },
];

/** 肉鸽运行规则（modes/rogue 消费）。 */
export const ROGUE_RULES = {
  startHeroChoices: 3,          // 开局三选一（从 r/sr 中抽）
  startHeroPool: ["r", "sr"],
  ssrOfferFromWave: 8,          // 第 8 波起三选一可出 ssr 英雄
  offerEveryWaves: 2,           // 每 2 波一次三选一
  offerChoices: 3,
  offerHeroWeight: 0.4,         // 三选一内容：40% 英雄 / 60% 神器（队满 5 人后全神器）
  offerArtifactWeight: 0.6,
  maxTeam: 5,
  baseRerolls: 1,               // 每次三选一自带刷新次数
  playerHp: 100,
  eliteEveryWaves: 5,           // 每 5 波插入精英（chef_fox 或随机精英词缀）
  bossEveryWaves: 10,           // 每 10 波 BOSS（按 BOSS_LIST 顺序循环）
  bossHpPct: 0.5,               // 肉鸽 BOSS 血量 = 本体 × 0.5 × 当前波次 hp 倍率
  artifactRarityWeights: { common: 55, rare: 30, epic: 12, legendary: 3 },
  goldPerWaveBase: 12,          // 每波金币 = base + growth × 波数（带回主存档）
  goldPerWaveGrowth: 2,
};

/**
 * 无尽波次强度曲线：
 * hpMult(wave) = 1 + 0.18 × wave                （wave ≤ 15，线性开荒段）
 * hpMult(wave) = hpMult(15) × 1.09^(wave-15)     （wave > 15，复利淘汰段）
 * dmgMult(wave) = 1 + 0.06 × wave
 * 设计意图：前 15 波构筑成型期压力平缓；15 波后强度复利上升，40 波左右自然终结一局。
 */
export const ROGUE_WAVE_SCALING = {
  hpLinearPerWave: 0.18,
  linearUntilWave: 15,
  compoundPerWaveAfter: 1.09,
  dmgPerWave: 0.06,
};

/** 波次敌人池（按波段解锁，n 只从池中加权随机；单位数量随波段上升）。 */
export const ROGUE_WAVE_BANDS = [
  { minWave: 1, unitsMin: 3, unitsMax: 5, pool: ["slime_brick", "pigeon_bandit"] },
  { minWave: 6, unitsMin: 4, unitsMax: 6, pool: ["slime_brick", "pigeon_bandit", "armor_pig", "neon_moth"] },
  { minWave: 11, unitsMin: 4, unitsMax: 7, pool: ["slime_brick", "pigeon_bandit", "armor_pig", "neon_moth", "spike_crab", "magma_snail", "heal_totem"] },
  { minWave: 16, unitsMin: 5, unitsMax: 8, pool: ["armor_pig", "neon_moth", "spike_crab", "magma_snail", "heal_totem", "frost_seal", "volt_drone"] },
  { minWave: 21, unitsMin: 6, unitsMax: 9, pool: ["armor_pig", "spike_crab", "magma_snail", "heal_totem", "frost_seal", "volt_drone", "kitchen_rat"] },
];
