/**
 * 主线任务：顺序推进，条件满足后自动领取奖励。
 * check(state) 必须是纯函数（只读 state）。
 */

export const QUESTS = [
  {
    id: "q01",
    name: "薪火不熄",
    desc: "囤积 50 木材，保证火炉过夜。",
    check: (s) => s.resources.wood >= 50,
    reward: { food: 40 },
  },
  {
    id: "q02",
    name: "猎手上山",
    desc: "建造猎人小屋（1 级）。",
    check: (s) => s.buildings.hunter >= 1,
    reward: { wood: 40 },
  },
  {
    id: "q03",
    name: "炉火纯青",
    desc: "将火炉升到 2 级。",
    check: (s) => s.buildings.furnace >= 2,
    reward: { food: 60, wood: 60 },
  },
  {
    id: "q04",
    name: "安置流民",
    desc: "人口达到 15。",
    check: (s) => s.population >= 15,
    reward: { food: 80 },
  },
  {
    id: "q05",
    name: "黑石之利",
    desc: "建造煤矿，并囤积 30 煤炭。",
    check: (s) => s.buildings.coalMine >= 1 && s.resources.coal >= 30,
    reward: { wood: 100 },
  },
  {
    id: "q06",
    name: "第一场寒潮",
    desc: "熬过第一次寒潮（人口存活）。",
    check: (s) => s.stats.blizzardsSurvived >= 1,
    reward: { food: 120, tokens: 1 },
  },
  {
    id: "q07",
    name: "招贤纳士",
    desc: "在招贤馆招募 1 名武将。",
    check: (s) => s.stats.recruits >= 1,
    reward: { souls: 60, food: 60 },
  },
  {
    id: "q08",
    name: "厉兵秣马",
    desc: "累计训练 30 名士兵。",
    check: (s) => s.stats.trained >= 30,
    reward: { food: 100, iron: 30 },
  },
  {
    id: "q09",
    name: "首战告捷",
    desc: "通关讨伐第 1 关「黄巾残寇」。",
    check: (s) => s.stage >= 1,
    reward: { tokens: 1, souls: 60 },
  },
  {
    id: "q10",
    name: "炉心如炬",
    desc: "将火炉升到 4 级。",
    check: (s) => s.buildings.furnace >= 4,
    reward: { coal: 120, iron: 60 },
  },
  {
    id: "q11",
    name: "人心所向",
    desc: "人口达到 40 且民心不低于 60。",
    check: (s) => s.population >= 40 && s.morale >= 60,
    reward: { food: 200, tokens: 1 },
  },
  {
    id: "q12",
    name: "开疆拓土",
    desc: "通关讨伐第 4 关「冰封坞堡」。",
    check: (s) => s.stage >= 4,
    reward: { tokens: 2, souls: 120 },
  },
  {
    id: "q13",
    name: "文治武功",
    desc: "建造太学院与医馆。",
    check: (s) => s.buildings.academy >= 1 && s.buildings.clinic >= 1,
    reward: { food: 150, wood: 150 },
  },
  {
    id: "q14",
    name: "冰原不倒",
    desc: "累计熬过 3 次寒潮。",
    check: (s) => s.stats.blizzardsSurvived >= 3,
    reward: { tokens: 2, souls: 150 },
  },
  {
    id: "q15",
    name: "冰河霸业",
    desc: "通关讨伐第 8 关「江东水寨」——雪原之上，再无敌手。",
    check: (s) => s.stage >= 8,
    reward: { tokens: 4, souls: 400, food: 500 },
  },
];
