export const STAGES = [
  {
    id: "tutorial",
    name: "入卷试笔",
    enemyId: "paper_target",
    element: "wood",
    recommend: "qi_refining",
    reward: { xp: 40, qiPills: 10 },
    intro: "老画师铺开一张空白残卷：先学六式笔意。",
  },
  {
    id: "village",
    name: "黛瓦古村",
    enemyId: "paper_moth",
    element: "wood",
    recommend: "qi_refining",
    reward: { xp: 70, qiPills: 14 },
    intro: "村口槐树下，残页化蛾，扑向灯火。",
  },
  {
    id: "bamboo",
    name: "潇湘竹海",
    enemyId: "ink_wolf",
    element: "water",
    recommend: "qi_refining",
    reward: { xp: 95, qiPills: 18 },
    intro: "竹影摇碎月光，墨瞳在暗处发亮。",
  },
  {
    id: "gallery",
    name: "画阁夜巡",
    enemyId: "seal_golem",
    element: "earth",
    recommend: "foundation",
    reward: { xp: 120, qiPills: 22 },
    intro: "画阁的闲章成了精，满地朱泥脚印。",
  },
  {
    id: "lotus",
    name: "太液莲池",
    enemyId: "lotus_serpent",
    element: "water",
    recommend: "foundation",
    reward: { xp: 150, qiPills: 26 },
    intro: "莲叶下盘着一条工笔勾出的白蛇。",
  },
  {
    id: "dunhuang",
    name: "莫高残壁",
    enemyId: "thunder_crane",
    element: "thunder",
    recommend: "golden_core",
    reward: { xp: 185, qiPills: 30 },
    intro: "藻井上的仙禽踏雷而下，衣带当风。",
  },
  {
    id: "furnace",
    name: "丹炉遗窟",
    enemyId: "cinnabar_ape",
    element: "fire",
    recommend: "golden_core",
    reward: { xp: 225, qiPills: 36 },
    intro: "废弃丹炉里养出一只通体朱砂的猿。",
  },
  {
    id: "glacier",
    name: "寒潭镜面",
    enemyId: "mirror_koi",
    element: "water",
    recommend: "nascent",
    reward: { xp: 270, qiPills: 42 },
    intro: "潭面如镜，倒影先你一步出手。",
  },
  {
    id: "chan",
    name: "禅钟秘境",
    enemyId: "chan_statue",
    element: "metal",
    recommend: "nascent",
    reward: { xp: 330, qiPills: 50 },
    intro: "石像不语，钟声一响，笔锋皆颤。",
  },
  {
    id: "inkheaven",
    name: "墨渊天阙",
    enemyId: "ink_sovereign",
    element: "water",
    recommend: "spirit_severing",
    boss: true,
    reward: { xp: 480, qiPills: 80 },
    intro: "众画之源。执墨者在此等一位真正的画师。",
  },
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
