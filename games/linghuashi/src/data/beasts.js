/**
 * 灵兽图鉴。passive 只允许三种（crit / qiRegen / shield），
 * 且同一 passive 的 value 必须全图鉴一致：
 * progression/beasts.js 以「首只出现的 value」作为该被动的一星基准（PASSIVE_BASE），
 * 合成升星与洗练都按基准 × 星级倍率（1 / 1.65 / 2.6）重算，基准不一致会造成升星后数值跳变。
 * 扩充图鉴请复用现有三档基准：crit 0.08 / qiRegen 2 / shield 12。
 */
export const BEASTS = [
  { id: "ink_fox", name: "墨狐", passive: "crit", value: 0.08, lore: "尾扫过处，墨点皆成杀着。" },
  { id: "paper_carp", name: "纸鲤", passive: "qiRegen", value: 2, lore: "游在砚池里，衔灵气入笔。" },
  { id: "shan_deer", name: "山海鹿", passive: "shield", value: 12, lore: "角如珊瑚，替主人挡下第一击。" },
  { id: "baize_cub", name: "白泽崽", passive: "crit", value: 0.08, lore: "通万物之情，先一步看破敌隙。" },
  { id: "kalavinka", name: "迦陵频伽", passive: "qiRegen", value: 2, lore: "人首鸟身，梵音不断，续气如泉。" },
  { id: "xuan_turtle", name: "旋龟", passive: "shield", value: 12, lore: "鸟首虺尾，负甲为盾，佩之不聋。" },
];

/*
 * 灵兽养成定价（唯一数值源；progression/beasts.js 与 UI 应从这里读取，
 * 接入方式见 docs/API_CONTRACT.md §4.1 [v2]，数值论证见 docs/GDD.md「灵兽」节）。
 *
 * 收兽消耗包子：包子仅产自挂机（0.6/分，8 小时封顶 288/次），此前全无消耗出口。
 * 36 = 整 60 分钟的包子产出，即「挂机一小时收一兽」；满额一次结算恰好 8 只，
 * 新档教程后约 1 小时可入手首兽。
 *
 * 洗练/合成消耗灵气丹：18 与 30×星级 与 progression/beasts.js 现行硬编码
 * （REROLL_COST / EVOLVE_COST）一致，迁移读取时数值零变化；
 * 保持「洗练两次 ≈ 一次一星合成」，合成始终是更贵的操作。
 */
/** 收兽成本，货币：包子。 */
export const BEAST_CATCH_COST = 36;
/** 洗练（必换被动）成本，货币：灵气丹。 */
export const BEAST_REROLL_COST = 18;
/** 合成成本 = 该值 × 当前星级，货币：灵气丹。 */
export const BEAST_EVOLVE_COST_PER_STAR = 30;
