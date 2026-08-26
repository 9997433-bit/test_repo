/**
 * 关卡表。tier = 推荐境界（realms.js 的 id，供 UI 提示与调参对照，战斗代码不读取）。
 *
 * 奖励曲线（详见 docs/GDD.md「敌人与关卡曲线」）：
 *   在推荐境界反复打对应关卡，约 2.5~4 胜可突破下一境界，后期放缓到 6~9 胜；
 *   qiPills 奖励 ≈ xp × 0.13~0.2，用于天赋（12/级）与灵兽合成洗练（18~90）。
 */
export const STAGES = [
  // —— 原有五关（数值不动）——
  { id: "tutorial", name: "入卷试笔", enemyId: "paper_moth", tier: "qi_refining", reward: { xp: 40, qiPills: 8 } },
  { id: "village", name: "黛瓦古村", enemyId: "ink_wolf", tier: "qi_refining", reward: { xp: 70, qiPills: 14 } },
  { id: "gallery", name: "画阁夜巡", enemyId: "seal_golem", tier: "foundation", reward: { xp: 110, qiPills: 22 } },
  { id: "dunhuang", name: "莫高残壁", enemyId: "thunder_crane", tier: "foundation", reward: { xp: 160, qiPills: 30 } },
  { id: "chan", name: "禅钟秘境", enemyId: "chan_statue", tier: "golden_core", reward: { xp: 220, qiPills: 40 } },
  // —— 新增八关 ——
  { id: "singing_sand", name: "鸣沙孤驿", enemyId: "mirage_shen", tier: "nascent", reward: { xp: 300, qiPills: 52 } },
  { id: "pipa_cave", name: "伎乐残窟", enemyId: "flying_apsara", tier: "nascent", reward: { xp: 400, qiPills: 66 } },
  { id: "flame_ridge", name: "讹火章莪", enemyId: "bifang_bird", tier: "spirit_severing", reward: { xp: 520, qiPills: 82 } },
  { id: "vajra_gate", name: "金刚窟门", enemyId: "vajra_guardian", tier: "spirit_severing", reward: { xp: 660, qiPills: 100 } },
  { id: "moon_spring", name: "月牙泉夜", enemyId: "blade_yaksha", tier: "void", reward: { xp: 820, qiPills: 120 } },
  { id: "deer_shadow", name: "鹿影本生", enemyId: "nine_color_deer", tier: "unity", reward: { xp: 1000, qiPills: 145 } },
  { id: "west_wasteland", name: "西荒风穴", enemyId: "qiongqi", tier: "mahayana", reward: { xp: 1250, qiPills: 170 } },
  { id: "tianshan_chaos", name: "天山浑沌", enemyId: "dijiang", tier: "ascension", reward: { xp: 1500, qiPills: 200 } },
];

export function stageById(id) {
  return STAGES.find((s) => s.id === id) ?? STAGES[0];
}

export function stageIndex(id) {
  return STAGES.findIndex((s) => s.id === id);
}

export function nextStage(id) {
  const i = stageIndex(id);
  return i >= 0 && i < STAGES.length - 1 ? STAGES[i + 1] : null;
}

export function isStageUnlocked(save, stageId) {
  const i = stageIndex(stageId);
  if (i <= 0) return true;
  const prev = STAGES[i - 1];
  return (save.cleared || []).includes(prev.id);
}
