/**
 * 敌人图鉴（山海经 × 敦煌）。
 *
 * 数值锚点（详见 docs/GDD.md「敌人与关卡曲线」）：
 *   hp ≈ 目标境界攻击 ×（前期 6~8 / 后期 10~14 / 终局 Boss ~18）
 *        ——后期击杀时长逼近裸抗窗口，护盾/治疗/控制才有出场价值
 *   atk ≈ 目标境界生命 × 1.8 / 20（敌人每 1800ms 出手一次，玩家裸抗约 20 秒）
 * classId 决定克制环互动，element 决定五行反应；六元素与七职业在图鉴内
 * 均有覆盖，保证每个玩家职业都有顺风与逆风关。
 */
export const ENEMIES = [
  // —— 前期（练气~金丹，原有五敌，数值不动）——
  { id: "paper_moth", name: "纸蛾精", classId: "yao", hp: 90, atk: 10, element: "wood", lore: "山海残页里飞出的蠹虫。" },
  { id: "ink_wolf", name: "墨瞳狼", classId: "qi", hp: 130, atk: 16, element: "water", lore: "以未干焦墨为皮。" },
  { id: "seal_golem", name: "朱印傀", classId: "ti", hp: 200, atk: 14, element: "earth", lore: "画阁走失的巨大闲章。" },
  { id: "thunder_crane", name: "雷纹鹤", classId: "fa", hp: 160, atk: 22, element: "thunder", lore: "敦煌藻井上走下来的仙禽。" },
  { id: "chan_statue", name: "禅心石", classId: "mo", hp: 240, atk: 18, element: "metal", lore: "不语，只以钟声反击。" },
  // —— 中期（元婴~化神）——
  { id: "mirage_shen", name: "鸣沙蜃", classId: "mo", hp: 320, atk: 26, element: "water", lore: "鸣沙山下的老蜃，吐雾成楼，困过整支商队十年。" },
  { id: "flying_apsara", name: "反弹琵琶伎", classId: "yao", hp: 400, atk: 30, element: "fire", lore: "壁画剥落处飞出的乐伎，琵琶反弹，一音夺一魄。" },
  { id: "bifang_bird", name: "毕方火鹤", classId: "fa", hp: 520, atk: 34, element: "fire", lore: "独脚青羽，见则其邑有讹火——《山海经·西山经》。" },
  { id: "vajra_guardian", name: "窟门金刚", classId: "ti", hp: 680, atk: 36, element: "earth", lore: "自窟门左壁走下的力士，怒目圆睁，肌理如岩。" },
  // —— 后期（炼虚~大乘）——
  { id: "blade_yaksha", name: "白刃夜叉", classId: "jian", hp: 760, atk: 52, element: "metal", lore: "护法像走失的随侍，双刀如新月，专斩半空的笔锋。" },
  { id: "nine_color_deer", name: "九色鹿影", classId: "dao", hp: 1050, atk: 56, element: "wood", lore: "本生故事里的义鹿被贪念污了影子，影子先行伤人。" },
  { id: "qiongqi", name: "穷奇啸风", classId: "qi", hp: 1350, atk: 72, element: "thunder", lore: "状如虎而有翼，闻讼则食直者，乘雷助恶而来。" },
  // —— 终局（飞升）——
  { id: "dijiang", name: "帝江浑沌", classId: "mo", hp: 2300, atk: 84, element: "earth", lore: "六足四翼，浑敦无面目，是识歌舞——天山之神，终局之卷。" },
];
