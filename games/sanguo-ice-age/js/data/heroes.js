/**
 * 武将数据表（fable-balance）
 *
 * 开局对齐（与 config.START 一致）：food 320 / wood 420 / coal 140 / iron 60，
 *   另有招贤令（heroTickets）3 张，配合 q_main_04/06/07 的票奖励支撑前 20 分钟招募线。
 *
 * 招募（抽卡）权重：蓝/紫/橙/红 = 60/26/11/3。
 *   数值本身不放在 data 层，权威定义见 systems/heroes.js 的 RECRUIT_WEIGHTS；
 *   抽取概率按品质权重计算，与名额数量无关
 *   （本表 20 名武将品质分布：蓝 3 / 紫 6 / 橙 7 / 红 4）。
 *   pity（保底）：由招募系统实现——建议连续 20 抽未出橙及以上时下一抽强制橙，
 *   连续 60 抽未出红时下一抽强制红；触发后对应计数清零，两条保底独立计数。
 *
 * 数值语义约定：
 * - base 为 1 级白板属性；品质基准倍率约为 blue 1.0 / purple 1.12 / orange 1.28 / red 1.45，
 *   已折算进各将数值，另按人物形象微调。
 * - skill.value 语义按 type 区分：
 *   damage  → 技能伤害 = atk（谋略型为 intel）* value；
 *   guard   → 我方受伤减免比例；
 *   heal    → 治疗量 = intel * value（换算为部队恢复）；
 *   buff    → 对应属性提升比例；
 *   control → 敌方削弱/失手比例（减攻减速等）。
 * - 阵营克制见 config.FACTION_BEATS（吴克蜀、蜀克魏、魏克吴），同阵营编队应另有羁绊加成。
 * - 红将全阵容仅 4 名（吕布/关羽/诸葛亮/曹操），招募权重应显著低于橙紫蓝。
 */
export const HEROES = [
  // ── 魏 ──────────────────────────────────────────
  {
    id: "cao_cao",
    name: "曹操",
    faction: "wei",
    quality: "red",
    role: "support",
    troop: "infantry",
    base: { atk: 96, def: 84, hp: 1280, intel: 152 },
    skill: { id: "sk_cao_cao", name: "奸雄令", desc: "一纸军令压过风雪，三军肃然：全军攻击提升 25%，持续到战斗结束。", type: "buff", value: 0.25 },
    title: "乱世奸雄",
    blurb: "宁教我负天下人，休教天下人负我。冰河既至，他先想到的不是取暖，而是收拢天下的薪火。",
  },
  {
    id: "zhang_liao",
    name: "张辽",
    faction: "wei",
    quality: "orange",
    role: "dps",
    troop: "cavalry",
    base: { atk: 125, def: 79, hp: 1210, intel: 58 },
    skill: { id: "sk_zhang_liao", name: "八百破敌", desc: "率八百死士凿阵而入，对敌军造成 190% 攻击的伤害。", type: "damage", value: 1.9 },
    title: "威震逍遥津",
    blurb: "逍遥津畔八百骑踏碎坚冰，江东小儿夜闻其名，啼声顿止。",
  },
  {
    id: "xu_chu",
    name: "许褚",
    faction: "wei",
    quality: "purple",
    role: "tank",
    troop: "infantry",
    base: { atk: 70, def: 108, hp: 1400, intel: 45 },
    skill: { id: "sk_xu_chu", name: "虎痴裸衣", desc: "裸衣酣战，独当中军之门，我方受到的伤害降低 32%。", type: "guard", value: 0.32 },
    title: "虎痴",
    blurb: "腰围十带，力能倒拽牛尾。大雪封营之夜，他裸衣立于辕门，寒气近不得曹公三尺。",
  },
  {
    id: "guo_jia",
    name: "郭嘉",
    faction: "wei",
    quality: "purple",
    role: "support",
    troop: "archer",
    base: { atk: 74, def: 65, hp: 985, intel: 118 },
    skill: { id: "sk_guo_jia", name: "十胜先机", desc: "十胜十败，了然于胸，全军谋略与先攻提升 20%。", type: "buff", value: 0.2 },
    title: "鬼才",
    blurb: "算无遗策，惜天不假年。雪夜军帐里那盏将尽未尽的孤灯。",
  },
  {
    id: "xun_yu",
    name: "荀彧",
    faction: "wei",
    quality: "purple",
    role: "support",
    troop: "archer",
    base: { atk: 68, def: 60, hp: 940, intel: 122 },
    skill: { id: "sk_xun_yu", name: "驱虎吞狼", desc: "一封书信搅乱敌营，敌军攻击与士气降低 22%。", type: "control", value: 0.22 },
    title: "王佐之才",
    blurb: "居中持重，粮秣柴薪皆出其手。城再冷，有他在，人心不散。",
  },
  {
    id: "xiahou_dun",
    name: "夏侯惇",
    faction: "wei",
    quality: "blue",
    role: "tank",
    troop: "infantry",
    base: { atk: 64, def: 95, hp: 1260, intel: 38 },
    skill: { id: "sk_xiahou_dun", name: "拔矢啖睛", desc: "拔矢啖睛，身先士卒，我方受到的伤害降低 25%。", type: "guard", value: 0.25 },
    title: "独眼将军",
    blurb: "父精母血，不可弃也。此等悍勇，足令风雪却步。",
  },

  // ── 蜀 ──────────────────────────────────────────
  {
    id: "liu_bei",
    name: "刘备",
    faction: "shu",
    quality: "orange",
    role: "support",
    troop: "infantry",
    base: { atk: 88, def: 80, hp: 1180, intel: 128 },
    skill: { id: "sk_liu_bei", name: "仁德之君", desc: "仁德抚军，同袍如手足，按智力 32% 恢复我方部队。", type: "heal", value: 0.32 },
    title: "昭烈帝",
    blurb: "携民渡江，弘毅宽厚。冰封千里，百姓宁弃屋舍，也要跟着他走。",
  },
  {
    id: "guan_yu",
    name: "关羽",
    faction: "shu",
    quality: "red",
    role: "dps",
    troop: "infantry",
    base: { atk: 148, def: 92, hp: 1350, intel: 62 },
    skill: { id: "sk_guan_yu", name: "青龙偃月", desc: "拖刀回斩，雪光刀光难辨，对敌军造成 220% 攻击的伤害。", type: "damage", value: 2.2 },
    title: "武圣",
    blurb: "温酒斩华雄，千里走单骑。杯中酒尚温，青龙刀上的落雪已经化了。",
  },
  {
    id: "zhang_fei",
    name: "张飞",
    faction: "shu",
    quality: "orange",
    role: "tank",
    troop: "cavalry",
    base: { atk: 92, def: 118, hp: 1520, intel: 35 },
    skill: { id: "sk_zhang_fei", name: "当阳断喝", desc: "据水断桥，瞋目横矛一声吼，敌军攻击与行动降低 30%。", type: "control", value: 0.3 },
    title: "万人敌",
    blurb: "长坂桥头一声断喝，喝退追兵百万，也震落了满树寒霜。",
  },
  {
    id: "zhao_yun",
    name: "赵云",
    faction: "shu",
    quality: "orange",
    role: "dps",
    troop: "cavalry",
    base: { atk: 128, def: 85, hp: 1240, intel: 55 },
    skill: { id: "sk_zhao_yun", name: "七进七出", desc: "单骑透阵，枪缨过处无停马，对敌军造成 185% 攻击的伤害，且自身少受反击。", type: "damage", value: 1.85 },
    title: "常胜将军",
    blurb: "一身是胆。长坂坡七进七出，怀中幼主安睡，枪出如龙搅碎风雪。",
  },
  {
    id: "zhuge_liang",
    name: "诸葛亮",
    faction: "shu",
    quality: "red",
    role: "support",
    troop: "archer",
    base: { atk: 90, def: 70, hp: 1120, intel: 160 },
    skill: { id: "sk_zhuge_liang", name: "八阵图", desc: "垒石成阵，困敌于八门之内，敌军攻防与速度降低 35%。", type: "control", value: 0.35 },
    title: "卧龙",
    blurb: "功盖三分国，名成八阵图。羽扇轻摇，连风雪也要听他号令。",
  },
  {
    id: "huang_zhong",
    name: "黄忠",
    faction: "shu",
    quality: "blue",
    role: "dps",
    troop: "archer",
    base: { atk: 102, def: 60, hp: 900, intel: 42 },
    skill: { id: "sk_huang_zhong", name: "百步穿杨", desc: "弓开如满月，箭去似流星，对敌军造成 170% 攻击的伤害。", type: "damage", value: 1.7 },
    title: "老当益壮",
    blurb: "年过六旬，箭无虚发。定军山下斩夏侯，白发不曾输少年。",
  },

  // ── 吴 ──────────────────────────────────────────
  {
    id: "sun_quan",
    name: "孙权",
    faction: "wu",
    quality: "purple",
    role: "support",
    troop: "archer",
    base: { atk: 72, def: 68, hp: 1000, intel: 120 },
    skill: { id: "sk_sun_quan", name: "坐断东南", desc: "稳坐中军，基业如磐，全军防御提升 18%。", type: "buff", value: 0.18 },
    title: "吴大帝",
    blurb: "生子当如孙仲谋。碧眼紫髯，坐断东南，任凭冰河改道，基业不移。",
  },
  {
    id: "zhou_yu",
    name: "周瑜",
    faction: "wu",
    quality: "orange",
    role: "dps",
    troop: "archer",
    base: { atk: 118, def: 64, hp: 980, intel: 138 },
    skill: { id: "sk_zhou_yu", name: "赤壁业火", desc: "东风既起，火借风势烧透冰原，按智力 200% 对敌军造成谋略伤害。", type: "damage", value: 2.0 },
    title: "美周郎",
    blurb: "谈笑间，樯橹灰飞烟灭。冰河之世万物皆寒，唯他掌中那点赤壁余火不灭。",
  },
  {
    id: "sun_ce",
    name: "孙策",
    faction: "wu",
    quality: "orange",
    role: "dps",
    troop: "cavalry",
    base: { atk: 124, def: 76, hp: 1150, intel: 60 },
    skill: { id: "sk_sun_ce", name: "小霸王", desc: "霸王挺枪突阵，锐不可当，对敌军造成 180% 攻击的伤害。", type: "damage", value: 1.8 },
    title: "江东小霸王",
    blurb: "以玉玺借兵，横扫江东。冰雪封得住江面，封不住少年锋锐。",
  },
  {
    id: "gan_ning",
    name: "甘宁",
    faction: "wu",
    quality: "purple",
    role: "dps",
    troop: "infantry",
    base: { atk: 112, def: 70, hp: 1060, intel: 48 },
    skill: { id: "sk_gan_ning", name: "百骑劫营", desc: "衔枚摸营，铃声起处火光四起，对敌军造成 175% 攻击的伤害。", type: "damage", value: 1.75 },
    title: "锦帆贼",
    blurb: "锦帆铃响，百骑劫营，全身而还。雪夜里那串铃声，是魏军的梦魇。",
  },
  {
    id: "taishi_ci",
    name: "太史慈",
    faction: "wu",
    quality: "blue",
    role: "dps",
    troop: "archer",
    base: { atk: 100, def: 58, hp: 880, intel: 45 },
    skill: { id: "sk_taishi_ci", name: "神亭酣战", desc: "神亭岭上单骑酣战，箭无虚发，对敌军造成 165% 攻击的伤害。", type: "damage", value: 1.65 },
    title: "笃烈之士",
    blurb: "大丈夫生于乱世，当带三尺剑立不世之功。纵是冰河之世，此志不改。",
  },

  // ── 群 ──────────────────────────────────────────
  {
    id: "lv_bu",
    name: "吕布",
    faction: "qun",
    quality: "red",
    role: "dps",
    troop: "cavalry",
    base: { atk: 165, def: 88, hp: 1380, intel: 28 },
    skill: { id: "sk_lv_bu", name: "方天无双", desc: "人中吕布，马中赤兔。方天画戟落处坚冰皆裂，对敌军造成 240% 攻击的毁灭一击。", type: "damage", value: 2.4 },
    title: "飞将",
    blurb: "辕门射戟，三英难敌。天下武力之巅峰，也是忠诚之深谷。",
  },
  {
    id: "diao_chan",
    name: "貂蝉",
    faction: "qun",
    quality: "orange",
    role: "support",
    troop: "archer",
    base: { atk: 66, def: 62, hp: 920, intel: 135 },
    skill: { id: "sk_diao_chan", name: "闭月离间", desc: "连环巧计暗度，敌将反目，阵脚自乱，攻击与命中降低 32%。", type: "control", value: 0.32 },
    title: "闭月",
    blurb: "一舞倾城，离间董吕。乱世里最锋利的兵刃，从来不在武库之中。",
  },
  {
    id: "hua_tuo",
    name: "华佗",
    faction: "qun",
    quality: "purple",
    role: "support",
    troop: "archer",
    base: { atk: 55, def: 58, hp: 900, intel: 125 },
    skill: { id: "sk_hua_tuo", name: "青囊妙手", desc: "刮骨去毒，敷药生肌，按智力 40% 恢复我方部队。", type: "heal", value: 0.4 },
    title: "神医",
    blurb: "青囊在手，麻沸活人。寒潮压城之时，医者的双手就是最后一道城墙。",
  },
];
