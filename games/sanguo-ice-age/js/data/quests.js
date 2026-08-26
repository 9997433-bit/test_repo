/**
 * 主线任务链（fable-balance）
 *
 * 开局对齐（与 config.START 一致）：food 320 / wood 420 / coal 140 / iron 60。
 *   q01/q02 的要求（lumber 1 级 + hunter 1 级，合计 food 35 / wood 75）
 *   开局资源可直接完成，无需等产出。
 *
 * require.id 约束：type 为 'build' 时，id 必须存在于 data/buildings.js 的
 *   BUILDINGS 权威集合（furnace / lumber / hunter / coal_mine / iron_mine /
 *   house / warehouse / kitchen / barracks_inf / barracks_arch / barracks_cav /
 *   hospital / academy / tavern / wall / embassy / clinic），
 *   禁止使用 sawmill、lumberyard 等别名或不存在的 id。
 *
 * require.type 语义（供任务系统实现）：
 * - 'build'   → 建筑 require.id 达到 require.value 级；
 * - 'recruit' → 累计招募武将 require.value 名；
 * - 'train'   → 累计训练士兵 require.value 名；
 * - 'battle'  → 累计讨伐流寇获胜 require.value 场。
 *
 * 设计意图：任务链是开荒的"隐形教程"，奖励刻意前置：
 * - q03 在首次寒潮（第 7 天）前把玩家推向火炉 2 级，并补发煤炭
 *   （此时煤矿可能尚未运转，避免燃料断档）；
 * - q05 补发生铁，衔接火炉 2 级解锁的铁矿；
 * - q11 首胜奖励橙将赵云，作为战斗线的爽点；
 * - 全链走完约覆盖前 20 分钟（火炉 1 → 5 级）。
 */
export const QUESTS = [
  {
    id: "q_main_01",
    title: "伐木过冬",
    desc: "冰原的夜比刀子还冷。先建一座伐木场，囤积柴薪。",
    require: { type: "build", id: "lumber", value: 1 },
    reward: { food: 80, wood: 120 },
    next: "q_main_02",
  },
  {
    id: "q_main_02",
    title: "猎补粮草",
    desc: "存粮见底了。建一座猎人小屋，让猎户去雪原碰碰运气。",
    require: { type: "build", id: "hunter", value: 1 },
    reward: { food: 150, wood: 60 },
    next: "q_main_03",
  },
  {
    id: "q_main_03",
    title: "生火御寒",
    desc: "老猎人说七日之内必有寒潮。把火炉升到 2 级，别让全城冻僵。",
    require: { type: "build", id: "furnace", value: 2 },
    reward: { wood: 120, coal: 80 },
    next: "q_main_04",
  },
  {
    id: "q_main_04",
    title: "安置流民",
    desc: "城外又来了一批拖家带口的流民。把民居升到 2 级收留他们。",
    require: { type: "build", id: "house", value: 2 },
    reward: { food: 120, recruitTickets: 1 },
    next: "q_main_05",
  },
  {
    id: "q_main_05",
    title: "挖煤备荒",
    desc: "木柴烧得太快，煤才是过冬的底气。把煤矿升到 2 级。",
    require: { type: "build", id: "coal_mine", value: 2 },
    reward: { coal: 150, iron: 50 },
    next: "q_main_06",
  },
  {
    id: "q_main_06",
    title: "炉火渐旺",
    desc: "火炉是全城的心脏。升到 3 级，解锁更多营造之法。",
    require: { type: "build", id: "furnace", value: 3 },
    reward: { iron: 100, recruitTickets: 1 },
    next: "q_main_07",
  },
  {
    id: "q_main_07",
    title: "招贤纳士",
    desc: "乱世出英雄。建起招贤馆，煮一壶热酒等豪杰上门。",
    require: { type: "build", id: "tavern", value: 1 },
    reward: { food: 100, recruitTickets: 2 },
    next: "q_main_08",
  },
  {
    id: "q_main_08",
    title: "义士来投",
    desc: "用招贤令延请一位武将入城效力。",
    require: { type: "recruit", value: 1 },
    reward: { food: 150, wood: 150 },
    next: "q_main_09",
  },
  {
    id: "q_main_09",
    title: "集结乡勇",
    desc: "流寇在城外游荡。建一座步兵营，把乡勇武装起来。",
    require: { type: "build", id: "barracks_inf", value: 1 },
    reward: { food: 100, iron: 120 },
    next: "q_main_10",
  },
  {
    id: "q_main_10",
    title: "厉兵秣马",
    desc: "训练 20 名士兵。记住：步克骑、骑克弓、弓克步。",
    require: { type: "train", value: 20 },
    reward: { food: 200, iron: 80 },
    next: "q_main_11",
  },
  {
    id: "q_main_11",
    title: "初讨流寇",
    desc: "率军出城，讨伐劫掠粮道的流寇，打赢第一仗。",
    require: { type: "battle", value: 1 },
    reward: { food: 200, heroId: "zhao_yun" },
    next: "q_main_12",
  },
  {
    id: "q_main_12",
    title: "炉暖全城",
    desc: "常胜将军已入麾下。把火炉升到 5 级，让整座城在冰河中站稳脚跟。",
    require: { type: "build", id: "furnace", value: 5 },
    reward: { wood: 300, coal: 300, recruitTickets: 3 },
    next: null,
  },
];
