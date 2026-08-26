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
    title: "伐木积薪",
    desc: "冰原的夜比刀锋更冷，火堆里的柴撑不过三更。建一座伐木场，让斧声替全城守夜。",
    require: { type: "build", id: "lumber", value: 1 },
    reward: { food: 80, wood: 120 },
    next: "q_main_02",
  },
  {
    id: "q_main_02",
    title: "雪原猎粮",
    desc: "粮囤见了底，孩子们数着米粒过日子。建一座猎人小屋，让猎户踏雪寻食。",
    require: { type: "build", id: "hunter", value: 1 },
    reward: { food: 150, wood: 60 },
    next: "q_main_03",
  },
  {
    id: "q_main_03",
    title: "炉火御寒",
    desc: "老猎人夜观天色：七日之内，寒潮必至。把火炉升到 2 级——炉火一灭，民心先散。",
    require: { type: "build", id: "furnace", value: 2 },
    reward: { wood: 120, coal: 80 },
    next: "q_main_04",
  },
  {
    id: "q_main_04",
    title: "收容流民",
    desc: "城门外又候着一队拖家带口的流民，眉睫上结满白霜。把民居升到 2 级——乱世里多一个人，就多一双添柴的手。",
    require: { type: "build", id: "house", value: 2 },
    reward: { food: 120, recruitTickets: 1 },
    next: "q_main_05",
  },
  {
    id: "q_main_05",
    title: "凿煤备寒",
    desc: "柴薪易燃也易尽，唯有黑煤经得住长夜。把煤矿升到 2 级，囤下过冬的底气。",
    require: { type: "build", id: "coal_mine", value: 2 },
    reward: { coal: 150, iron: 50 },
    next: "q_main_06",
  },
  {
    id: "q_main_06",
    title: "炉旺城兴",
    desc: "炉火是全城的心跳，跳得越旺，城池越大。把火炉升到 3 级，解锁更多营造之法。",
    require: { type: "build", id: "furnace", value: 3 },
    reward: { iron: 100, recruitTickets: 1 },
    next: "q_main_07",
  },
  {
    id: "q_main_07",
    title: "筑馆招贤",
    desc: "乱世如炉，英雄如薪。建起招贤馆，温一壶热酒，静候豪杰踏雪而来。",
    require: { type: "build", id: "tavern", value: 1 },
    reward: { food: 100, recruitTickets: 2 },
    next: "q_main_08",
  },
  {
    id: "q_main_08",
    title: "豪杰来投",
    desc: "檐下的酒温了又凉，凉了又温。用招贤令延请一位武将入城，共扶危局。",
    require: { type: "recruit", value: 1 },
    reward: { food: 150, wood: 150 },
    next: "q_main_09",
  },
  {
    id: "q_main_09",
    title: "整军经武",
    desc: "流寇的马蹄声在风雪里越来越近。建一座步兵营，把乡勇手里的锄头换成长枪。",
    require: { type: "build", id: "barracks_inf", value: 1 },
    reward: { food: 100, iron: 120 },
    next: "q_main_10",
  },
  {
    id: "q_main_10",
    title: "厉兵秣马",
    desc: "训练 20 名士兵。牢记相克之道：步克骑、骑克弓、弓克步——排兵如弈棋，一步错，满盘寒。",
    require: { type: "train", value: 20 },
    reward: { food: 200, iron: 80 },
    next: "q_main_11",
  },
  {
    id: "q_main_11",
    title: "初雪扬威",
    desc: "流寇劫我粮道，掠我柴薪。率军出城打赢第一仗，让雪原记住这座城的名字。",
    require: { type: "battle", value: 1 },
    reward: { food: 200, heroId: "zhao_yun" },
    next: "q_main_12",
  },
  {
    id: "q_main_12",
    title: "炉暖山河",
    desc: "常胜将军已立于麾下，枪缨映着炉光。把火炉升到 5 级，让这座城在冰河之世站成不灭的薪火。",
    require: { type: "build", id: "furnace", value: 5 },
    reward: { wood: 300, coal: 300, recruitTickets: 3 },
    next: null,
  },
];
