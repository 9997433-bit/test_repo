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
    skill: { id: "sk_cao_cao", name: "奸雄令", desc: "挟令诸军，全军攻击提升 25%，持续到战斗结束。", type: "buff", value: 0.25 },
    title: "乱世奸雄",
    blurb: "宁教我负天下人，休教天下人负我。冰河既至，唯强者聚薪火。",
  },
  {
    id: "zhang_liao",
    name: "张辽",
    faction: "wei",
    quality: "orange",
    role: "dps",
    troop: "cavalry",
    base: { atk: 125, def: 79, hp: 1210, intel: 58 },
    skill: { id: "sk_zhang_liao", name: "八百破敌", desc: "率死士突袭，对敌军造成 190% 攻击的伤害。", type: "damage", value: 1.9 },
    title: "止啼名将",
    blurb: "逍遥津畔八百骑，江东小儿闻名止啼。",
  },
  {
    id: "xu_chu",
    name: "许褚",
    faction: "wei",
    quality: "purple",
    role: "tank",
    troop: "infantry",
    base: { atk: 70, def: 108, hp: 1400, intel: 45 },
    skill: { id: "sk_xu_chu", name: "虎痴裸衣", desc: "裸衣酣战护住中军，我方受到的伤害降低 32%。", type: "guard", value: 0.32 },
    title: "虎痴",
    blurb: "腰围十带，力能拽牛。曹公帐下第一护卫。",
  },
  {
    id: "guo_jia",
    name: "郭嘉",
    faction: "wei",
    quality: "purple",
    role: "support",
    troop: "archer",
    base: { atk: 74, def: 65, hp: 985, intel: 118 },
    skill: { id: "sk_guo_jia", name: "十胜先机", desc: "洞悉敌情，全军谋略与先攻提升 20%。", type: "buff", value: 0.2 },
    title: "鬼才",
    blurb: "算无遗策，惜天不假年。雪夜里的一盏孤灯。",
  },
  {
    id: "xun_yu",
    name: "荀彧",
    faction: "wei",
    quality: "purple",
    role: "support",
    troop: "archer",
    base: { atk: 68, def: 60, hp: 940, intel: 122 },
    skill: { id: "sk_xun_yu", name: "驱虎吞狼", desc: "离间敌阵，敌军攻击与士气降低 22%。", type: "control", value: 0.22 },
    title: "王佐之才",
    blurb: "居中持重，粮草辎重皆出其手。寒城的定海针。",
  },
  {
    id: "xiahou_dun",
    name: "夏侯惇",
    faction: "wei",
    quality: "blue",
    role: "tank",
    troop: "infantry",
    base: { atk: 64, def: 95, hp: 1260, intel: 38 },
    skill: { id: "sk_xiahou_dun", name: "拔矢啖睛", desc: "身先士卒，我方受到的伤害降低 25%。", type: "guard", value: 0.25 },
    title: "独眼将军",
    blurb: "父精母血，不可弃也。拔矢啖睛，勇冠三军。",
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
    skill: { id: "sk_liu_bei", name: "仁德之君", desc: "抚恤三军，按智力 32% 恢复我方部队。", type: "heal", value: 0.32 },
    title: "昭烈帝",
    blurb: "携民渡江，弘毅宽厚。冰原上百姓愿随他走的人。",
  },
  {
    id: "guan_yu",
    name: "关羽",
    faction: "shu",
    quality: "red",
    role: "dps",
    troop: "infantry",
    base: { atk: 148, def: 92, hp: 1350, intel: 62 },
    skill: { id: "sk_guan_yu", name: "青龙偃月", desc: "拖刀斩将，对敌军造成 220% 攻击的伤害。", type: "damage", value: 2.2 },
    title: "武圣",
    blurb: "温酒斩华雄，千里走单骑。青龙刀映雪光。",
  },
  {
    id: "zhang_fei",
    name: "张飞",
    faction: "shu",
    quality: "orange",
    role: "tank",
    troop: "cavalry",
    base: { atk: 92, def: 118, hp: 1520, intel: 35 },
    skill: { id: "sk_zhang_fei", name: "当阳断喝", desc: "长坂桥头一声吼，敌军攻击与行动降低 30%。", type: "control", value: 0.3 },
    title: "万人敌",
    blurb: "燕人张翼德在此！谁敢与我决一死战！",
  },
  {
    id: "zhao_yun",
    name: "赵云",
    faction: "shu",
    quality: "orange",
    role: "dps",
    troop: "cavalry",
    base: { atk: 128, def: 85, hp: 1240, intel: 55 },
    skill: { id: "sk_zhao_yun", name: "七进七出", desc: "单骑冲阵，对敌军造成 185% 攻击的伤害，且自身少受反击。", type: "damage", value: 1.85 },
    title: "常胜将军",
    blurb: "一身是胆。长坂坡前救幼主，枪出如龙。",
  },
  {
    id: "zhuge_liang",
    name: "诸葛亮",
    faction: "shu",
    quality: "red",
    role: "support",
    troop: "archer",
    base: { atk: 90, def: 70, hp: 1120, intel: 160 },
    skill: { id: "sk_zhuge_liang", name: "八阵图", desc: "布下石阵困敌，敌军攻防与速度降低 35%。", type: "control", value: 0.35 },
    title: "卧龙",
    blurb: "功盖三分国，名成八阵图。羽扇轻摇，风雪听令。",
  },
  {
    id: "huang_zhong",
    name: "黄忠",
    faction: "shu",
    quality: "blue",
    role: "dps",
    troop: "archer",
    base: { atk: 102, def: 60, hp: 900, intel: 42 },
    skill: { id: "sk_huang_zhong", name: "百步穿杨", desc: "老当益壮，对敌军造成 170% 攻击的伤害。", type: "damage", value: 1.7 },
    title: "老骥伏枥",
    blurb: "年过六旬，箭无虚发。定军山下斩夏侯。",
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
    skill: { id: "sk_sun_quan", name: "坐断东南", desc: "固守基业，全军防御提升 18%。", type: "buff", value: 0.18 },
    title: "吴大帝",
    blurb: "生子当如孙仲谋。碧眼紫髯，坐断东南战未休。",
  },
  {
    id: "zhou_yu",
    name: "周瑜",
    faction: "wu",
    quality: "orange",
    role: "dps",
    troop: "archer",
    base: { atk: 118, def: 64, hp: 980, intel: 138 },
    skill: { id: "sk_zhou_yu", name: "赤壁业火", desc: "纵火焚营，按智力 200% 对敌军造成谋略伤害。", type: "damage", value: 2.0 },
    title: "美周郎",
    blurb: "谈笑间樯橹灰飞烟灭。冰河时代最珍贵的，是他掌心的火。",
  },
  {
    id: "sun_ce",
    name: "孙策",
    faction: "wu",
    quality: "orange",
    role: "dps",
    troop: "cavalry",
    base: { atk: 124, def: 76, hp: 1150, intel: 60 },
    skill: { id: "sk_sun_ce", name: "小霸王", desc: "霸王突阵，对敌军造成 180% 攻击的伤害。", type: "damage", value: 1.8 },
    title: "江东小霸王",
    blurb: "以玉玺借兵，横扫江东。锋锐之气，冰雪难掩。",
  },
  {
    id: "gan_ning",
    name: "甘宁",
    faction: "wu",
    quality: "purple",
    role: "dps",
    troop: "infantry",
    base: { atk: 112, def: 70, hp: 1060, intel: 48 },
    skill: { id: "sk_gan_ning", name: "百骑劫营", desc: "衔枚夜袭，对敌军造成 175% 攻击的伤害。", type: "damage", value: 1.75 },
    title: "锦帆贼",
    blurb: "铃声所至，百骑劫魏营，全身而还。",
  },
  {
    id: "taishi_ci",
    name: "太史慈",
    faction: "wu",
    quality: "blue",
    role: "dps",
    troop: "archer",
    base: { atk: 100, def: 58, hp: 880, intel: 45 },
    skill: { id: "sk_taishi_ci", name: "神亭酣战", desc: "箭术如神，对敌军造成 165% 攻击的伤害。", type: "damage", value: 1.65 },
    title: "笃烈之士",
    blurb: "大丈夫生于乱世，当带三尺剑立不世之功。",
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
    skill: { id: "sk_lv_bu", name: "方天无双", desc: "人中吕布，马中赤兔。对敌军造成 240% 攻击的毁灭一击。", type: "damage", value: 2.4 },
    title: "飞将",
    blurb: "辕门射戟，三英难敌。天下武力之巅，忠诚之谷。",
  },
  {
    id: "diao_chan",
    name: "貂蝉",
    faction: "qun",
    quality: "orange",
    role: "support",
    troop: "archer",
    base: { atk: 66, def: 62, hp: 920, intel: 135 },
    skill: { id: "sk_diao_chan", name: "闭月离间", desc: "巧施连环，敌军自乱阵脚，攻击与命中降低 32%。", type: "control", value: 0.32 },
    title: "闭月",
    blurb: "一舞倾城，离间董吕。乱世中最锋利的不是刀。",
  },
  {
    id: "hua_tuo",
    name: "华佗",
    faction: "qun",
    quality: "purple",
    role: "support",
    troop: "archer",
    base: { atk: 55, def: 58, hp: 900, intel: 125 },
    skill: { id: "sk_hua_tuo", name: "青囊妙手", desc: "刮骨疗毒，按智力 40% 恢复我方部队。", type: "heal", value: 0.4 },
    title: "神医",
    blurb: "五禽戏强身，麻沸散救人。寒潮之下，医者即城墙。",
  },
];
